@echo off
rem Doble clic: apaga el servidor PHP y la base de datos locales.
title Detener sitio IE Cajete
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0herramientas\detener-local.ps1"
timeout /t 3 >nul
