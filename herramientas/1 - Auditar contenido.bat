@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title Auditar contenido

echo.
echo   AUDITORIA DE CONTENIDO
echo   Busca lo que falta cargar en Supabase.
echo.

node --env-file-if-exists=.env.local herramientas\auditar-contenido.mjs

echo.
echo   ------------------------------------------------------------
echo   Terminado. Cerra la ventana cuando quieras.
pause >nul
