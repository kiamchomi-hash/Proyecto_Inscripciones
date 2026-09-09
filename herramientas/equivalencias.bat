@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title Consulta local de equivalencias
node herramientas\equivalencias.mjs
pause
