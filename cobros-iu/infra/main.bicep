// ========================================
// Azure Storage Account para Aplicación Angular Estática
// ========================================
// Este archivo Bicep crea un Storage Account optimizado para hospedar
// una aplicación Angular como sitio web estático

targetScope = 'resourceGroup'

// ========================================
// PARÁMETROS
// ========================================

@description('Nombre de la aplicación (usado para generar nombres de recursos)')
@minLength(3)
@maxLength(11)
param appName string = 'cobrosv2'

@description('Ubicación para todos los recursos')
param location string = resourceGroup().location

@description('Ambiente de despliegue (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('SKU del Storage Account')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
])
param storageSku string = 'Standard_LRS'

@description('Habilitar CDN para mejorar el rendimiento global')
param enableCdn bool = false

// ========================================
// VARIABLES
// ========================================

// Nombre único del storage account (sin guiones, solo lowercase y números, max 24 chars)
var storageAccountName = '${toLower(appName)}${environment}${uniqueString(resourceGroup().id)}'
var cdnProfileName = '${appName}-cdn-${environment}'
var cdnEndpointName = '${appName}-endpoint-${environment}'

// ========================================
// RECURSOS
// ========================================

// Storage Account con sitio web estático habilitado
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-01-01' = {
  name: take(storageAccountName, 24) // Asegurar max 24 caracteres
  location: location
  kind: 'StorageV2'
  sku: {
    name: storageSku
  }
  properties: {
    // Seguridad
    supportsHttpsTrafficOnly: true // Solo tráfico HTTPS
    minimumTlsVersion: 'TLS1_2' // TLS mínimo 1.2
    allowBlobPublicAccess: true // Necesario para sitio web estático
    allowSharedKeyAccess: false // Deshabilitar acceso por clave compartida (mejor seguridad)
    defaultToOAuthAuthentication: true // Usar OAuth por defecto
    
    // Acceso público
    publicNetworkAccess: 'Enabled'
    
    // Red
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }
    
    // Encriptación
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
      requireInfrastructureEncryption: false
    }
  }
  
  tags: {
    Environment: environment
    Application: appName
    ManagedBy: 'Bicep'
    Purpose: 'StaticWebsite'
  }
}

// Habilitar sitio web estático en el blob storage
// Nota: Esto se hace mediante la CLI después del despliegue
// porque Bicep no tiene soporte directo para esta configuración

// CDN Profile (opcional, para mejor rendimiento global)
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = if (enableCdn) {
  name: cdnProfileName
  location: 'global'
  sku: {
    name: 'Standard_Microsoft'
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// CDN Endpoint
resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = if (enableCdn) {
  parent: cdnProfile
  name: cdnEndpointName
  location: 'global'
  properties: {
    originHostHeader: '${storageAccount.name}.z13.web.core.windows.net'
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    contentTypesToCompress: [
      'application/javascript'
      'application/json'
      'application/x-javascript'
      'application/xml'
      'text/css'
      'text/html'
      'text/javascript'
      'text/plain'
      'text/xml'
    ]
    isCompressionEnabled: true
    origins: [
      {
        name: 'origin1'
        properties: {
          hostName: '${storageAccount.name}.z13.web.core.windows.net'
          httpPort: 80
          httpsPort: 443
          originHostHeader: '${storageAccount.name}.z13.web.core.windows.net'
        }
      }
    ]
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// ========================================
// OUTPUTS
// ========================================

@description('Nombre del Storage Account creado')
output storageAccountName string = storageAccount.name

@description('ID del Storage Account')
output storageAccountId string = storageAccount.id

@description('URL del sitio web estático')
output staticWebsiteUrl string = 'https://${storageAccount.name}.z13.web.core.windows.net/'

@description('Nombre del contenedor web')
output webContainerName string = '$web'

@description('URL del CDN (si está habilitado)')
output cdnUrl string = enableCdn ? 'https://${cdnEndpoint.properties.hostName}/' : ''

@description('Grupo de recursos')
output resourceGroupName string = resourceGroup().name
