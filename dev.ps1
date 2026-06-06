#!/usr/bin/env pwsh
# dev.ps1 - Inicia el backend (.NET) y el frontend (Angular) de Cobros
# Pregunta si reiniciar el back si ya esta corriendo en el puerto 5010.

$BACK_PORT  = 5010
$BACK_DIR   = "$PSScriptRoot\backend\CobrosApi"
$FRONT_DIR  = "$PSScriptRoot\cobros-iu"
$BACK_URL   = "http://localhost:$BACK_PORT"

# -- Helpers ---------------------------------------------------------------

function Get-ProcessOnPort([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -First 1
    if ($conn) { return Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue }
    return $null
}

function Write-Step([string]$Text) {
    Write-Host "`n> $Text" -ForegroundColor Cyan
}

function Write-Ok([string]$Text) {
    Write-Host "  OK: $Text" -ForegroundColor Green
}

function Write-Warn([string]$Text) {
    Write-Host "  WARN: $Text" -ForegroundColor Yellow
}

# -- Backend ---------------------------------------------------------------

Write-Step "Verificando backend en el puerto $BACK_PORT..."

$existing = Get-ProcessOnPort -Port $BACK_PORT

if ($existing) {
    Write-Warn "El backend ya esta corriendo (PID $($existing.Id) - $($existing.ProcessName))"
    $resp = Read-Host "  Reiniciar el backend? [s/N]"
    if ($resp -match '^[sS]$') {
        Write-Step "Deteniendo proceso $($existing.Id)..."
        Stop-Process -Id $existing.Id -Force
        Start-Sleep -Milliseconds 500
        Write-Ok "Proceso detenido."
        $startBack = $true
    } else {
        Write-Ok "Manteniendo el backend actual."
        $startBack = $false
    }
} else {
    $startBack = $true
}

if ($startBack) {
    Write-Step "Iniciando backend en $BACK_URL..."
    $backJob = Start-Process -FilePath "dotnet" `
        -ArgumentList "run", "--urls", $BACK_URL `
        -WorkingDirectory $BACK_DIR `
        -PassThru -NoNewWindow
    Write-Ok "Backend iniciado (PID $($backJob.Id)). Compilando..."
}

# -- Frontend --------------------------------------------------------------

Write-Step "Iniciando frontend Angular en http://localhost:4200..."
$env:NG_CLI_ANALYTICS = "false"
$frontJob = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm", "start" `
    -WorkingDirectory $FRONT_DIR `
    -PassThru -NoNewWindow
Write-Ok "Frontend iniciado (PID $($frontJob.Id))."

# -- Esperar ---------------------------------------------------------------

Write-Host "`n------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Backend  -> $BACK_URL" -ForegroundColor White
Write-Host "  Frontend -> http://localhost:4200" -ForegroundColor White
Write-Host "  Presiona Ctrl+C para detener ambos procesos." -ForegroundColor DarkGray
Write-Host "------------------------------------------------`n" -ForegroundColor DarkGray

# Mantener el script corriendo; al hacer Ctrl+C se mata todo.
try {
    while ($true) { Start-Sleep -Seconds 5 }
} finally {
    Write-Host "`n> Deteniendo procesos..." -ForegroundColor Cyan
    if ($startBack -and $backJob -and !$backJob.HasExited)  { Stop-Process -Id $backJob.Id  -Force -ErrorAction SilentlyContinue }
    if ($frontJob -and !$frontJob.HasExited)                { Stop-Process -Id $frontJob.Id -Force -ErrorAction SilentlyContinue }
    Write-Ok "Listo."
}
