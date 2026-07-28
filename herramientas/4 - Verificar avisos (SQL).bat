@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Verificar avisos de formulario

echo.
echo   VERIFICAR AVISOS DE FORMULARIO
echo   Los avisos por mail y Telegram fallan en silencio: la web
echo   responde 201 igual. Esto los prueba de verdad.
echo.
echo   No se puede correr desde esta maquina: no hay credencial de
echo   escritura sobre la base. Va por el SQL Editor de Supabase.
echo.

powershell -NoProfile -Command "Get-Content -Raw -Encoding UTF8 'verificar-avisos.sql' | Set-Clipboard"

echo   [1] El SQL ya esta copiado al portapapeles.
echo   [2] Se abre el SQL Editor: pegar con Ctrl+V.
echo   [3] Correr un PASO por vez (seleccionar el bloque y Run).
echo       No sirve de una sola pasada: pg_net recien manda el
echo       pedido cuando la transaccion commitea.
echo.
echo   Esperado en el PASO 2: tres filas con status_code 200.
echo   Un 401 significa que el secreto del trigger no coincide
echo   con el de la Edge Function.
echo.

start "" "https://supabase.com/dashboard/project/yuwfkdehaowkselkhtck/sql/new"

echo   ------------------------------------------------------------
pause >nul
