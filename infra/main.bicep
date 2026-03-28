// ============================================================
// CobrosApi — Full Stack Infrastructure
// Recursos:
//   - Log Analytics Workspace
//   - Azure Container Registry (Basic)
//   - Container Apps Environment
//   - Container App (backend .NET 8)
//   - Azure Static Web Apps (Free) — frontend Angular
//
// Base de datos: Supabase (externo, cadena de conexión como parámetro)
// ============================================================

targetScope = 'resourceGroup'

// ─── Parámetros ──────────────────────────────────────────────────────────────

@description('Nombre base de la aplicación (sin guiones, max 10 chars)')
@minLength(3)
@maxLength(10)
param appName string = 'cobros'

@description('Ambiente de despliegue')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Región de todos los recursos (excepto SWA)')
param location string = resourceGroup().location

@description('Cadena de conexión Npgsql completa a Supabase (o cualquier PostgreSQL externo)')
@secure()
param connectionString string

@description('Secreto para firmar JWT (mín. 32 chars)')
@secure()
param jwtSecret string

@description('Google OAuth Client ID (opcional)')
param googleClientId string = ''

// ─── Variables ───────────────────────────────────────────────────────────────

var prefix           = '${appName}-${environment}'
var unique6          = take(uniqueString(resourceGroup().id), 6)
var acrName          = '${appName}acr${unique6}'   // max 50, alphanumeric
var logName          = 'log-${prefix}'
var caeNname         = 'cae-${prefix}'
var containerAppName = 'ca-${appName}api-${environment}'
var swaName          = 'swa-${prefix}'

// ─── Log Analytics ───────────────────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
  tags: { Environment: environment, App: appName }
}

// ─── Container Registry ──────────────────────────────────────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    zoneRedundancy: 'Disabled'
  }
  tags: { Environment: environment, App: appName }
}

// ─── Container Apps Environment ──────────────────────────────────────────────

resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: caeNname
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
  tags: { Environment: environment, App: appName }
}

// ─── Static Web App ───────────────────────────────────────────────────────────
// Se crea antes que Container App para poder usar su hostname en CORS

resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: swaName
  location: 'eastus2'              // SWA solo disponible en ciertas regiones
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
  tags: { Environment: environment, App: appName }
}

// ─── Container App (backend) ─────────────────────────────────────────────────

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'           // Para pull de ACR sin credenciales
  }
  properties: {
    managedEnvironmentId: cae.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['https://${swa.properties.defaultHostname}']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
          allowedHeaders: ['*']
          allowCredentials: false
        }
      }
      secrets: [
        { name: 'db-conn',    value: connectionString }
        { name: 'jwt-secret', value: jwtSecret }
      ]
      registries: [
        {
          server:   acr.properties.loginServer
          identity: 'system'           // Pull mediante Managed Identity
        }
      ]
    }
    template: {
      containers: [
        {
          name:  'cobrosapi'
          image: 'mcr.microsoft.com/dotnet/samples:aspnetapp'   // Placeholder; el script actualiza
          resources: {
            cpu:    json('0.5')
            memory: '1.0Gi'
          }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT',              value: 'Production' }
            { name: 'ASPNETCORE_URLS',                     value: 'http://+:8080' }
            { name: 'UseInMemoryDb',                       value: 'false' }
            { name: 'UseDevAuth',                          value: 'false' }
            { name: 'ConnectionStrings__DefaultConnection', secretRef: 'db-conn' }
            { name: 'Jwt__Secret',                         secretRef: 'jwt-secret' }
            { name: 'Jwt__Issuer',                         value: 'CobrosApi' }
            { name: 'Jwt__Audience',                       value: 'CobrosApp' }
            { name: 'Authentication__Google__ClientId',    value: googleClientId }
            { name: 'Cors__AllowedOrigins__0',             value: 'https://${swa.properties.defaultHostname}' }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
      }
    }
  }
}

// Rol AcrPull para que Container App pueda hacer pull de la imagen
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, containerApp.id, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '7f951dda-4ed3-4680-a7ca-43fe172d538d'   // AcrPull
    )
    principalId:   containerApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

output acrLoginServer   string = acr.properties.loginServer
output acrName          string = acr.name
output containerAppName string = containerApp.name
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output swaName          string = swa.name
output swaHostname      string = swa.properties.defaultHostname
output resourceGroup    string = resourceGroup().name
