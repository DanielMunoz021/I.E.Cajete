# =====================================================================
# Levanta el portal en local:
#   - MariaDB (puerto 3307), API PHP (puerto 8000) y el sitio con Vite (puerto 5173)
# Uso:  powershell -ExecutionPolicy Bypass -File herramientas\iniciar-local.ps1
# Abre http://localhost:5173  ·  Ctrl+C detiene Vite (la BD y PHP siguen en segundo plano;
# para apagarlos: herramientas\detener-local.ps1)
# =====================================================================
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\comun.ps1"

if (-not (Test-Path "$RAIZ\privado\config.php")) { throw 'Primero ejecuta herramientas\preparar-local.ps1' }

Iniciar-BD

if (-not (Puerto-Abierto $PUERTO_PHP)) {
    Write-Host "Iniciando la API PHP (puerto $PUERTO_PHP)..." -ForegroundColor Cyan
    Start-Process -FilePath 'php' -ArgumentList '-S', "127.0.0.1:$PUERTO_PHP", '-t', 'sitio', 'herramientas/router-local.php' -WorkingDirectory $RAIZ -WindowStyle Hidden
}

Write-Host 'Iniciando el sitio: http://localhost:5173' -ForegroundColor Green
Set-Location "$RAIZ\frontend"
npm run dev -- --port 5173 --open
