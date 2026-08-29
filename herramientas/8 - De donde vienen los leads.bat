@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title De donde vienen los leads

echo.
echo   DE DONDE VIENEN LOS LEADS
echo   Clics a WhatsApp, consultas del formulario y trafico desde Google,
echo   de los ultimos 14 dias.
echo.

node --env-file-if-exists=.env.local herramientas\leads.mjs

echo.
echo   ------------------------------------------------------------
echo   Terminado. Cerra la ventana cuando quieras.
pause >nul
