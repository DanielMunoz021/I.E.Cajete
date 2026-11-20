# Apaga la API PHP y MariaDB locales.
. "$PSScriptRoot\comun.ps1"
Get-Process php -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*PHP*' } | Stop-Process -Force
& "$MARIADB\bin\mariadb-admin.exe" -u root "--port=$PUERTO_BD" --protocol=TCP shutdown 2>$null
Write-Host 'Servidores locales detenidos.'
