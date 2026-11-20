# Valores comunes de los scripts locales.
$RAIZ       = Split-Path $PSScriptRoot -Parent
$MARIADB    = "C:\Users\$env:USERNAME\dev-tools\mariadb-10.11.20-winx64"
$DATOS      = "$RAIZ\.local\mariadb"
$PUERTO_BD  = 3307
$NOMBRE_BD  = 'iecajete_portal'
$USUARIO_BD = 'iecajete_portal'
$PUERTO_PHP = 8000

# PATH completo (para encontrar php, node y npm instalados con winget)
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

function Puerto-Abierto([int]$puerto) {
    $c = New-Object Net.Sockets.TcpClient
    try { $c.Connect('127.0.0.1', $puerto); $true } catch { $false } finally { $c.Close() }
}

function Iniciar-BD {
    if (Puerto-Abierto $PUERTO_BD) { return }
    Write-Host "Iniciando MariaDB local (puerto $PUERTO_BD)..." -ForegroundColor Cyan
    Start-Process -FilePath "$MARIADB\bin\mariadbd.exe" -ArgumentList "--datadir=`"$DATOS`"", "--port=$PUERTO_BD", '--bind-address=127.0.0.1' -WindowStyle Hidden
    for ($i = 0; $i -lt 30 -and -not (Puerto-Abierto $PUERTO_BD); $i++) { Start-Sleep -Milliseconds 500 }
    if (-not (Puerto-Abierto $PUERTO_BD)) { throw 'MariaDB no arranco. Revisa .local\mariadb\*.err' }
}
