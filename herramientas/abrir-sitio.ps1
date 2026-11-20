# =====================================================================
# Abre el sitio COMPLETO en local (lo usa INICIAR-SITIO.bat):
#   base de datos + PHP sirviendo sitio/ y la API en http://localhost:8000
# =====================================================================
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\comun.ps1"

try {
    Write-Host ''
    Write-Host '  Sitio IE Cajete - iniciando...' -ForegroundColor Green
    Write-Host ''

    if (-not (Get-Command php -ErrorAction SilentlyContinue)) { throw 'No encuentro PHP. Instálalo con: winget install PHP.PHP.NTS.8.4' }

    # Primera vez en este computador: crea la base local y config.php
    if (-not (Test-Path "$RAIZ\privado\config.php")) {
        Write-Host '  Primera vez: preparando la base de datos local...' -ForegroundColor Cyan
        & "$PSScriptRoot\preparar-local.ps1"
    }

    Iniciar-BD

    # Si ya hay un PHP en el puerto (por ejemplo, uno que solo atiende la API), se reinicia con el enrutador completo
    Get-NetTCPConnection -LocalPort $PUERTO_PHP -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue } |
        Where-Object { $_.ProcessName -eq 'php' } | Stop-Process -Force
    Start-Sleep -Milliseconds 300

    Write-Host "  Iniciando el servidor (puerto $PUERTO_PHP)..." -ForegroundColor Cyan
    Start-Process -FilePath 'php' -ArgumentList '-S', "127.0.0.1:$PUERTO_PHP", '-t', 'sitio', 'herramientas/router-local.php' -WorkingDirectory $RAIZ -WindowStyle Hidden
    for ($i = 0; $i -lt 20 -and -not (Puerto-Abierto $PUERTO_PHP); $i++) { Start-Sleep -Milliseconds 300 }
    if (-not (Puerto-Abierto $PUERTO_PHP)) { throw 'El servidor PHP no arrancó.' }

    Start-Process "http://localhost:$PUERTO_PHP/"
    Write-Host ''
    Write-Host "  Listo: http://localhost:$PUERTO_PHP" -ForegroundColor Green
    Write-Host '  El sitio sigue funcionando aunque cierres esta ventana.'
    Write-Host '  Para apagarlo: doble clic en DETENER-SITIO.bat'
    Write-Host ''
    Start-Sleep -Seconds 4
} catch {
    Write-Host ''
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ''
    Read-Host '  Presiona Enter para cerrar'
    exit 1
}
