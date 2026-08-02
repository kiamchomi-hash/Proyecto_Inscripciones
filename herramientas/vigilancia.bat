@echo off
chcp 65001 >nul
cd /d "%~dp0.."

REM Envoltorio para el Programador de tareas de Windows. A diferencia de los
REM otros .bat de esta carpeta, este NO lleva pause: corre solo, sin ventana, y
REM devuelve el codigo de salida del chequeo.
REM
REM   herramientas\vigilancia.bat deps
REM   herramientas\vigilancia.bat smoke
REM   herramientas\vigilancia.bat contenido

node herramientas\vigilancia.mjs %1
exit /b %errorlevel%
