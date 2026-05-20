# ========================================
# Script de Despliegue para Azure Storage Static Website
# ========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "RG-AI-DEV",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableCdn
)

Write-Host "🚀 Iniciando despliegue de Cobros v2 a Azure Storage" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Configuración
$appName = "cobrosv2"
$deploymentName = "cobrosv2-deployment-$(Get-Date -Format 'yyyyMMddHHmmss')"
$bicepFile = Join-Path $PSScriptRoot "main.bicep"
$buildPath = Join-Path (Split-Path $PSScriptRoot -Parent) "dist\cobros-app\browser"

# Verificar que el archivo Bicep existe
if (-not (Test-Path $bicepFile)) {
    Write-Host "❌ Error: No se encontró el archivo Bicep en: $bicepFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivo Bicep encontrado" -ForegroundColor Green

# Verificar autenticación Azure
Write-Host "`n📋 Verificando autenticación con Azure..." -ForegroundColor Yellow
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Conectado como: $($account.user.name)" -ForegroundColor Green
    Write-Host "   Suscripción: $($account.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ No estás autenticado en Azure. Ejecuta 'az login' primero." -ForegroundColor Red
    exit 1
}

# Verificar/crear grupo de recursos
Write-Host "`n📦 Verificando grupo de recursos: $ResourceGroupName" -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "   Creando grupo de recursos..." -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    Write-Host "✅ Grupo de recursos creado" -ForegroundColor Green
} else {
    Write-Host "✅ Grupo de recursos existe" -ForegroundColor Green
}

# Previsualizar cambios (What-If)
Write-Host "`n🔍 Previsualizando cambios con What-If..." -ForegroundColor Yellow
az deployment group what-if `
    --resource-group $ResourceGroupName `
    --template-file $bicepFile `
    --parameters appName=$appName environment=$Environment enableCdn=$($EnableCdn.IsPresent)

Write-Host "`n¿Deseas continuar con el despliegue? (S/N): " -ForegroundColor Yellow -NoNewline
$confirmation = Read-Host
if ($confirmation -ne 'S' -and $confirmation -ne 's') {
    Write-Host "❌ Despliegue cancelado" -ForegroundColor Red
    exit 0
}

# Desplegar infraestructura con Bicep
Write-Host "`n🚀 Desplegando infraestructura..." -ForegroundColor Cyan
$deployment = az deployment group create `
    --resource-group $ResourceGroupName `
    --name $deploymentName `
    --template-file $bicepFile `
    --parameters appName=$appName environment=$Environment enableCdn=$($EnableCdn.IsPresent) `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el despliegue de infraestructura" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Infraestructura desplegada exitosamente" -ForegroundColor Green

# Obtener outputs
$storageAccountName = $deployment.properties.outputs.storageAccountName.value
$staticWebsiteUrl = $deployment.properties.outputs.staticWebsiteUrl.value

Write-Host "`n📊 Recursos creados:" -ForegroundColor Cyan
Write-Host "   Storage Account: $storageAccountName" -ForegroundColor White
Write-Host "   URL: $staticWebsiteUrl" -ForegroundColor White

# Habilitar sitio web estático
Write-Host "`n🌐 Habilitando sitio web estático..." -ForegroundColor Yellow
az storage blob service-properties update `
    --account-name $storageAccountName `
    --auth-mode login `
    --static-website `
    --404-document index.html `
    --index-document index.html

Write-Host "✅ Sitio web estático habilitado" -ForegroundColor Green

# Compilar aplicación Angular
Write-Host "`n🔨 Compilando aplicación Angular..." -ForegroundColor Yellow
$parentPath = Split-Path $PSScriptRoot -Parent
Push-Location $parentPath

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar la aplicación" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "✅ Aplicación compilada" -ForegroundColor Green

# Verificar que existe la carpeta de build
if (-not (Test-Path $buildPath)) {
    Write-Host "❌ No se encontró la carpeta de build: $buildPath" -ForegroundColor Red
    exit 1
}

# Subir archivos al blob storage
Write-Host "`n📤 Subiendo archivos a Azure Storage..." -ForegroundColor Yellow
az storage blob upload-batch `
    --account-name $storageAccountName `
    --auth-mode login `
    --destination '$web' `
    --source $buildPath `
    --overwrite `
    --output table

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al subir archivos" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivos subidos exitosamente" -ForegroundColor Green

# Configurar MIME types para Angular
Write-Host "`n⚙️  Configurando MIME types..." -ForegroundColor Yellow
az storage blob update `
    --account-name $storageAccountName `
    --container-name '$web' `
    --name 'index.html' `
    --content-type 'text/html' `
    --auth-mode login

Write-Host "✅ MIME types configurados" -ForegroundColor Green

# Mostrar resumen
Write-Host "`n" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✅ DESPLIEGUE COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "`n📋 Información del despliegue:" -ForegroundColor Yellow
Write-Host "   Aplicación: $appName" -ForegroundColor White
Write-Host "   Ambiente: $Environment" -ForegroundColor White
Write-Host "   Grupo de recursos: $ResourceGroupName" -ForegroundColor White
Write-Host "   Storage Account: $storageAccountName" -ForegroundColor White
Write-Host "`n🌐 URLs:" -ForegroundColor Yellow
Write-Host "   Sitio Web: $staticWebsiteUrl" -ForegroundColor Cyan
if ($EnableCdn) {
    $cdnUrl = $deployment.properties.outputs.cdnUrl.value
    Write-Host "   CDN: $cdnUrl" -ForegroundColor Cyan
}
Write-Host "`n🔗 Portal Azure:" -ForegroundColor Yellow
Write-Host "   https://portal.azure.com/#@/resource/subscriptions/$($account.id)/resourceGroups/$ResourceGroupName/overview" -ForegroundColor Cyan
Write-Host "`n"
