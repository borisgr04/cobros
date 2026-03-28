# ============================================================
# deploy.ps1 — Despliegue completo CobrosApi + CobrosV2 en Azure
# 
# Qué hace:
#   1. Verifica prerequisitos (az CLI, Docker, Node) y auth Azure
#   2. Crea el resource group si no existe
#   3. Despliega infraestructura via Bicep (ACR, Container Apps, PostgreSQL, SWA)
#   4. Construye imagen Docker y la sube al ACR
#   5. Actualiza el Container App con la imagen real
#   6. Construye Angular con la URL del API de producción
#   7. Despliega Angular al Static Web App
# ============================================================

param(
    [string]$ResourceGroupName  = 'RG-Cobros-Prod',
    [string]$Location           = 'eastus',
    [string]$SubscriptionId     = 'b6812e21-33d6-4dea-9996-a38aa193682f',
    [string]$ImageTag           = 'latest',

    # Secretos — si no se pasan se piden de forma segura
    [string]$ConnectionString   = '',   # Cadena Npgsql a Supabase
    [string]$JwtSecret          = '',
    [string]$GoogleClientId     = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─── Colores helper ──────────────────────────────────────────────────────────

function Write-Step  { param($msg) Write-Host "`n▶  $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "   ✅ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "   ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "   ❌ $msg" -ForegroundColor Red; exit 1 }

# ─── Rutas ───────────────────────────────────────────────────────────────────

$scriptDir      = $PSScriptRoot
$repoRoot       = Split-Path $scriptDir -Parent
$backendDir     = Join-Path $repoRoot 'CobrosApi'
$frontendDir    = Join-Path $repoRoot 'cobrosv2'
$frontendDist   = Join-Path $frontendDir 'dist\cobros-app\browser'
$prodEnvFile    = Join-Path $frontendDir 'src\environments\environment.prod.ts'
$bicepFile      = Join-Path $scriptDir  'main.bicep'
$bicepParams    = Join-Path $scriptDir  'main.parameters.json'
$deploymentName = "cobros-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')"

# ─── 1. Prerequisitos ────────────────────────────────────────────────────────

Write-Step "Verificando prerequisitos..."

foreach ($cmd in @('az', 'docker', 'node', 'npm')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Fail "$cmd no está instalado o no está en PATH"
    }
}
Write-Ok "az CLI, Docker, Node y npm encontrados"

# ─── 2. Secretos (si no se pasaron como parámetros) ──────────────────────────

if (-not $ConnectionString) {
    Write-Host ""
    Write-Host "   Cadena de conexión Npgsql — formato:" -ForegroundColor Gray
    Write-Host "   Host=aws-1-us-east-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.pmbagngbmwwkadjdcjah;Password=...;SslMode=Require;Trust Server Certificate=true;" -ForegroundColor DarkGray
    $secCs = Read-Host "🔐 Cadena de conexión a Supabase" -AsSecureString
    $ConnectionString = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secCs))
}

if (-not $JwtSecret) {
    $secJwt = Read-Host "🔐 JWT Secret (mín. 32 chars)" -AsSecureString
    $JwtSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secJwt))
}

if ($JwtSecret.Length -lt 32) { Write-Fail "JWT Secret debe tener al menos 32 caracteres" }

# ─── 3. Autenticación Azure ───────────────────────────────────────────────────

Write-Step "Verificando autenticación Azure..."

try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    Write-Ok "Conectado como: $($account.user.name)"
} catch {
    Write-Warn "No autenticado. Iniciando az login..."
    az login --output none
    $account = az account show --output json | ConvertFrom-Json
}

az account set --subscription $SubscriptionId --output none
Write-Ok "Suscripción activa: $SubscriptionId"

# ─── 4. Resource Group ───────────────────────────────────────────────────────

Write-Step "Verificando resource group: $ResourceGroupName..."

$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq 'true') {
    Write-Ok "Resource group ya existe"
} else {
    Write-Warn "Creando resource group $ResourceGroupName en $Location..."
    az group create --name $ResourceGroupName --location $Location --output none
    Write-Ok "Resource group creado"
}

# ─── 5. Despliegue Bicep ─────────────────────────────────────────────────────

Write-Step "Desplegando infraestructura (Bicep)..."
Write-Warn "Esto puede tardar 5-10 minutos (PostgreSQL tarda más)..."

$deployResult = az deployment group create `
    --name               $deploymentName `
    --resource-group     $ResourceGroupName `
    --template-file      $bicepFile `
    --parameters         "@$bicepParams" `
    --parameters         connectionString=$ConnectionString `
    --parameters         jwtSecret=$JwtSecret `
    --parameters         googleClientId=$GoogleClientId `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) { Write-Fail "Error en el despliegue Bicep" }

# Extraer outputs
$outputs           = $deployResult.properties.outputs
$acrLoginServer    = $outputs.acrLoginServer.value
$acrName           = $outputs.acrName.value
$containerAppName  = $outputs.containerAppName.value
$containerAppFqdn  = $outputs.containerAppFqdn.value
$swaName           = $outputs.swaName.value
$swaHostname       = $outputs.swaHostname.value

Write-Ok "Infraestructura desplegada"
Write-Host "   ACR:           $acrLoginServer" -ForegroundColor Gray
Write-Host "   Container App: $containerAppFqdn" -ForegroundColor Gray
Write-Host "   SWA:           $swaHostname" -ForegroundColor Gray
Write-Host "   BD:            Supabase (externa)" -ForegroundColor Gray

# ─── 6. Build y Push imagen Docker ───────────────────────────────────────────

Write-Step "Construyendo imagen Docker del backend..."

$imageFullName = "$acrLoginServer/cobrosapi:$ImageTag"

Push-Location $backendDir
try {
    docker build -t $imageFullName -f Dockerfile .
    if ($LASTEXITCODE -ne 0) { Write-Fail "Error al construir la imagen Docker" }
    Write-Ok "Imagen construida: $imageFullName"
} finally {
    Pop-Location
}

Write-Step "Autenticando en ACR y subiendo imagen..."

az acr login --name $acrName --output none
if ($LASTEXITCODE -ne 0) { Write-Fail "Error al autenticar en ACR" }

docker push $imageFullName
if ($LASTEXITCODE -ne 0) { Write-Fail "Error al hacer push de la imagen" }
Write-Ok "Imagen subida al ACR"

# ─── 7. Esperar propagación RBAC y actualizar Container App ──────────────────

Write-Step "Esperando propagación RBAC (30s) y actualizando Container App..."
Start-Sleep -Seconds 30

az containerapp update `
    --name           $containerAppName `
    --resource-group $ResourceGroupName `
    --image          $imageFullName `
    --output none

if ($LASTEXITCODE -ne 0) { Write-Fail "Error al actualizar el Container App" }
Write-Ok "Container App actualizado con imagen real"

# ─── 8. Build Angular con URL de producción ───────────────────────────────────

Write-Step "Actualizando environment.prod.ts con URL del API..."

$prodApiUrl    = "https://$containerAppFqdn"
$envProdContent = @"
export const environment = {
  production: true,
  useMocks: false,
  apiUrl: '$prodApiUrl'
};
"@

Set-Content -Path $prodEnvFile -Value $envProdContent -Encoding UTF8
Write-Ok "environment.prod.ts actualizado: $prodApiUrl"

Write-Step "Ejecutando ng build --configuration production..."

Push-Location $frontendDir
try {
    npm run build -- --configuration production
    if ($LASTEXITCODE -ne 0) { Write-Fail "Error al construir Angular" }
    Write-Ok "Build Angular completado"
} finally {
    Pop-Location
}

# ─── 9. Desplegar Angular al Static Web App ───────────────────────────────────

Write-Step "Obteniendo token de despliegue del Static Web App..."

$deployToken = az staticwebapp secrets list `
    --name           $swaName `
    --resource-group $ResourceGroupName `
    --query          "properties.apiKey" -o tsv

if (-not $deployToken) { Write-Fail "No se pudo obtener el token de despliegue del SWA" }
Write-Ok "Token obtenido"

Write-Step "Desplegando frontend al Static Web App..."

Push-Location $frontendDir
try {
    npx @azure/static-web-apps-cli deploy $frontendDist `
        --deployment-token $deployToken `
        --env production

    if ($LASTEXITCODE -ne 0) { Write-Fail "Error al desplegar en Static Web App" }
    Write-Ok "Frontend desplegado"
} finally {
    Pop-Location
}

# ─── 10. Resumen final ────────────────────────────────────────────────────────

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  🚀 DESPLIEGUE COMPLETADO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend (Angular SPA):" -ForegroundColor White
Write-Host "    https://$swaHostname" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend (API .NET 8):" -ForegroundColor White
Write-Host "    https://$containerAppFqdn" -ForegroundColor Green
Write-Host "    https://$containerAppFqdn/swagger" -ForegroundColor Green
Write-Host "    https://$containerAppFqdn/health" -ForegroundColor Green
Write-Host ""
Write-Host "  BD (Supabase):" -ForegroundColor White
Write-Host "    db.pmbagngbmwwkadjdcjah.supabase.co" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
