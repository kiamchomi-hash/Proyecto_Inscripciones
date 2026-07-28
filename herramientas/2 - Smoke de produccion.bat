@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title Smoke de produccion

echo.
echo   SMOKE DE PRODUCCION
echo   Revisa www.siglo21sur.com: rutas, cabeceras, redirects,
echo   las 119 URLs del sitemap y el peso real de la home.
echo   Tarda un par de minutos.
echo.

node herramientas\smoke.mjs

echo.
echo   ------------------------------------------------------------
echo   Terminado. Cerra la ventana cuando quieras.
pause >nul
