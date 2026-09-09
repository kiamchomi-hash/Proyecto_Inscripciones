@echo off
cd /d "%~dp0.."
call npm run calidad
set "resultado=%errorlevel%"
pause
exit /b %resultado%
