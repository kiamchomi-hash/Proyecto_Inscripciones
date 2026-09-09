@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title Copia local del sitio

echo.
echo   COPIA LOCAL DE DOBLE CLIC
echo   Arma en el Escritorio una copia del sitio con todas las versiones:
echo   produccion, cada rama y la experimental, con menu lateral.
echo.
echo   Compila una vez por version y cambia de rama, asi que el arbol
echo   tiene que estar sin cambios pendientes. Tarda varios minutos.
echo.

node herramientas\copia-local.mjs
if errorlevel 1 goto :error

echo.
echo   Abriendo la copia...
start "" "%USERPROFILE%\Desktop\CAU-copia\ABRIR.html"

echo.
echo   ------------------------------------------------------------
echo   Terminado. Cerra la ventana cuando quieras.
pause >nul
exit /b 0

:error
echo.
echo   No se pudo actualizar la copia. No se abre la version anterior.
echo   Revisa el error que aparece arriba.
pause >nul
exit /b 1
