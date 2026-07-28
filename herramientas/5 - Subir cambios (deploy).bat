@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0.."
title Subir cambios

rem Los tokens de GitHub que quedaron en el entorno son invalidos y hacen
rem fallar el push con un error que no dice nada. Vaciarlos deja que git use
rem las credenciales guardadas de Windows.
set "GH_TOKEN="
set "GITHUB_TOKEN="

echo.
echo   SUBIR CAMBIOS A PRODUCCION
echo   Un push a main despliega el sitio. No hay vuelta atras en un clic.
echo.

for /f "delims=" %%r in ('git rev-parse --abbrev-ref HEAD') do set "rama=%%r"
if not "!rama!"=="main" (
  echo   OJO: estas en la rama "!rama!", no en main.
  echo   Este boton es para main. Cancelado.
  echo.
  pause >nul
  exit /b 1
)

rem Dos cosas distintas pueden estar pendientes: archivos sin commitear, y
rem commits ya hechos que nunca se subieron. Hay que mirar las dos.
set "haycambios="
for /f "delims=" %%s in ('git status --porcelain') do set "haycambios=1"

set "pendientes=0"
for /f "delims=" %%p in ('git rev-list --count origin/main..HEAD 2^>nul') do set "pendientes=%%p"

if not defined haycambios (
  if "!pendientes!"=="0" (
    echo   No hay nada para subir: todo commiteado y todo publicado.
    echo.
    pause >nul
    exit /b 0
  )
  rem Nada de parentesis en los echo de adentro de un bloque if: el ")" lo
  rem cierra antes de tiempo y cmd se come la linea entera.
  echo   No hay archivos sin commitear, pero quedaron !pendientes! commits
  echo   sin subir:
  echo   ------------------------------------------------------------
  git log origin/main..HEAD --oneline
  echo   ------------------------------------------------------------
  echo.
  set "ok="
  set /p "ok=  Publicarlos? (S/N): "
  if /i not "!ok!"=="S" (
    echo.
    echo   Cancelado. No se toco nada.
    echo.
    pause >nul
    exit /b 1
  )
  goto :revisar
)

echo   Esto es lo que se va a subir:
echo   ------------------------------------------------------------
git status --short
if not "!pendientes!"=="0" (
  echo.
  echo   Ademas van !pendientes! commits de antes que nunca se subieron:
  git log origin/main..HEAD --oneline
)
echo   ------------------------------------------------------------
echo.
echo   Si aparece algo que no querias subir, cancela y sacalo primero.
echo.

set "mensaje="
set /p "mensaje=  Descripcion del cambio (sin comillas): "
if "!mensaje!"=="" (
  echo.
  echo   Sin descripcion no se sube nada. Cancelado.
  echo.
  pause >nul
  exit /b 1
)

echo.
set "ok="
set /p "ok=  Subir a produccion con ese mensaje? (S/N): "
if /i not "!ok!"=="S" (
  echo.
  echo   Cancelado. No se toco nada.
  echo.
  pause >nul
  exit /b 1
)

:revisar
echo.
echo   [1/3] Revisando el codigo (lint + tipos + tests)...
echo.
call npm run check
if errorlevel 1 (
  echo.
  echo   ------------------------------------------------------------
  echo   LAS REVISIONES FALLARON. No se commiteo ni se subio nada.
  echo   Arreglar lo de arriba, o pedirle a Claude que lo mire.
  echo.
  pause >nul
  exit /b 1
)

if not defined haycambios goto :publicar

echo.
echo   [2/3] Guardando el commit...
git add -A
git commit -m "!mensaje!"
if errorlevel 1 (
  echo.
  echo   El commit fallo. No se subio nada.
  echo.
  pause >nul
  exit /b 1
)

:publicar
echo.
echo   [3/3] Subiendo a GitHub...
git push
if errorlevel 1 (
  echo.
  echo   ------------------------------------------------------------
  echo   EL PUSH FALLO, pero el commit quedo guardado en local.
  echo   Suele ser que el repo cambio desde otro lado. Pedirle a
  echo   Claude que lo resuelva; no se pierde nada.
  echo.
  pause >nul
  exit /b 1
)

echo.
echo   ------------------------------------------------------------
echo   Listo. Vercel ya esta desplegando: tarda un par de minutos.
echo   https://www.siglo21sur.com
echo.
echo   Cuando termine, conviene correr el 2 (Smoke de produccion)
echo   para confirmar que el sitio quedo bien.
echo.
pause >nul
