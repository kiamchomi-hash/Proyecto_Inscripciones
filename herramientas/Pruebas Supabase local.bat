@echo off
cd /d "%~dp0.."
call npm run test:integracion
pause
