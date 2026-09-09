@echo off
cd /d "%~dp0.."
node --env-file-if-exists=.env.local herramientas/integraciones.mjs %*
