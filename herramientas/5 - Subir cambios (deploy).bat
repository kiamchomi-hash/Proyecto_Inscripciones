@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
title Subir cambios
node herramientas/deploy.mjs
set "resultado=%errorlevel%"
echo.
pause >nul
exit /b %resultado%
