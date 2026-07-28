@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title Capturas del sitio

echo.
echo   CAPTURAS DESKTOP + MOBILE
echo   6 paginas de produccion, en las dos pantallas.
echo   Tarda un par de minutos.
echo.

node herramientas\capturas.mjs

echo.
echo   Abriendo la carpeta de capturas...
start "" "%CD%\screenshots"

echo.
echo   ------------------------------------------------------------
echo   Terminado. Cerra la ventana cuando quieras.
pause >nul
