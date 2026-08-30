@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title Informe SEO

echo.
echo   INFORME SEO
echo   Baja los datos de Search Console y deja el informe en
echo   herramientas\vigilancia-logs\seo-ultimo.md
echo.
echo   Tarda unos minutos: revisa una por una las URLs del sitemap.
echo.

node --env-file-if-exists=.env.local herramientas\seo-semanal.mjs

echo.
echo   Publicando al repo privado (si esta configurado)...
node --env-file-if-exists=.env.local herramientas\publicar-informe.mjs

echo.
echo   ------------------------------------------------------------
echo   Terminado. Cerra la ventana cuando quieras.
pause >nul
