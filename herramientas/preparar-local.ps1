# =====================================================================
# Prepara el entorno LOCAL del portal (se ejecuta una sola vez):
#   1. Inicializa una base MariaDB 10.11 portable en .local\mariadb (puerto 3307)
#   2. Crea la base de datos y su usuario, e importa database\schema.sql
#   3. Escribe privado\config.php (entorno de desarrollo)
# Uso:  powershell -ExecutionPolicy Bypass -File herramientas\preparar-local.ps1
# =====================================================================
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\comun.ps1"

if (-not (Test-Path "$MARIADB\bin\mariadbd.exe")) {
    throw "No encuentro MariaDB en $MARIADB. Descomprime mariadb-10.11.20-winx64.zip en C:\Users\$env:USERNAME\dev-tools\"
}

# 1. Base de datos local
if (-not (Test-Path "$DATOS\mysql")) {
    Write-Host 'Inicializando MariaDB local...' -ForegroundColor Cyan
    New-Item -ItemType Directory -Force $DATOS | Out-Null
    & "$MARIADB\bin\mariadb-install-db.exe" "--datadir=$DATOS" "--port=$PUERTO_BD" | Out-Null
}
Iniciar-BD

# 2. Base, usuario y esquema
$claveBd = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
$sql = @"
CREATE DATABASE IF NOT EXISTS $NOMBRE_BD CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$USUARIO_BD'@'localhost' IDENTIFIED BY '$claveBd';
ALTER USER '$USUARIO_BD'@'localhost' IDENTIFIED BY '$claveBd';
GRANT ALL PRIVILEGES ON $NOMBRE_BD.* TO '$USUARIO_BD'@'localhost';
FLUSH PRIVILEGES;
"@
$sql | & "$MARIADB\bin\mariadb.exe" -u root "--port=$PUERTO_BD" --protocol=TCP

$tablas = & "$MARIADB\bin\mariadb.exe" -u root "--port=$PUERTO_BD" --protocol=TCP -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$NOMBRE_BD'"
if ([int]$tablas -eq 0) {
    Write-Host 'Importando database\schema.sql...' -ForegroundColor Cyan
    Get-Content "$RAIZ\database\schema.sql" -Raw -Encoding UTF8 | & "$MARIADB\bin\mariadb.exe" -u root "--port=$PUERTO_BD" --protocol=TCP --default-character-set=utf8mb4 $NOMBRE_BD
    if (Test-Path "$RAIZ\database\datos-iniciales.sql") {
        Get-Content "$RAIZ\database\datos-iniciales.sql" -Raw -Encoding UTF8 | & "$MARIADB\bin\mariadb.exe" -u root "--port=$PUERTO_BD" --protocol=TCP --default-character-set=utf8mb4 $NOMBRE_BD
    }
} else {
    Write-Host "La base $NOMBRE_BD ya tiene tablas: no se reimporta." -ForegroundColor Yellow
}

# 3. config.php de desarrollo
$claveInstalacion = -join ((48..57) + (97..122) | Get-Random -Count 20 | ForEach-Object { [char]$_ })
$config = @"
<?php
// config.php LOCAL (generado por herramientas\preparar-local.ps1). No va a Git.
return [
    'bd' => ['host' => '127.0.0.1', 'puerto' => $PUERTO_BD, 'nombre' => '$NOMBRE_BD', 'usuario' => '$USUARIO_BD', 'clave' => '$claveBd'],
    'entorno' => 'desarrollo',
    'clave_instalacion' => '$claveInstalacion',
    'uploads_dir' => __DIR__ . '/uploads',
    'max_pdf_mb' => 20,
    'max_imagen_mb' => 5,
    'login_max_por_correo' => 5,
    'login_max_por_ip' => 20,
    'login_ventana_min' => 15,
];
"@
[IO.File]::WriteAllText("$RAIZ\privado\config.php", $config, (New-Object Text.UTF8Encoding $false))

Write-Host ''
Write-Host 'Listo. Entorno local preparado.' -ForegroundColor Green
Write-Host "Clave de instalacion (para crear el primer admin): $claveInstalacion" -ForegroundColor Yellow
Write-Host 'Siguiente paso: herramientas\iniciar-local.ps1 y abre http://localhost:5173/api/instalar.php'
