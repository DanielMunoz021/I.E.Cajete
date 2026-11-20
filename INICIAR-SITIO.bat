@echo off
rem Doble clic: enciende la base de datos y el servidor, y abre el sitio completo (con el portal) en el navegador.
title Sitio IE Cajete
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0herramientas\abrir-sitio.ps1"
