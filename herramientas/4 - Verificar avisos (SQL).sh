#!/usr/bin/env bash
# Gemelo en Linux de "4 - Verificar avisos (SQL).bat".
set -u
cd "$(dirname "$0")" || exit 1

SQL_EDITOR="https://supabase.com/dashboard/project/yuwfkdehaowkselkhtck/sql/new"

echo
echo "  VERIFICAR AVISOS DE FORMULARIO"
echo "  Los avisos por mail y Telegram fallan en silencio: la web"
echo "  responde 201 igual. Esto los prueba de verdad."
echo
echo "  No se puede correr desde esta maquina: no hay credencial de"
echo "  escritura sobre la base. Va por el SQL Editor de Supabase."
echo

# El portapapeles en Linux depende del servidor grafico: wl-copy en Wayland,
# xclip o xsel en X11. Si no hay ninguno, no se rompe nada: se muestra la ruta
# del archivo para abrirlo a mano.
copiado=no
if command -v wl-copy >/dev/null 2>&1; then
  wl-copy < verificar-avisos.sql && copiado=si
elif command -v xclip >/dev/null 2>&1; then
  xclip -selection clipboard < verificar-avisos.sql && copiado=si
elif command -v xsel >/dev/null 2>&1; then
  xsel --clipboard --input < verificar-avisos.sql && copiado=si
fi

if [ "$copiado" = si ]; then
  echo "  [1] El SQL ya esta copiado al portapapeles."
else
  echo "  [1] No hay portapapeles disponible (falta wl-copy, xclip o xsel)."
  echo "      Abrir a mano: $PWD/verificar-avisos.sql"
fi
echo "  [2] Se abre el SQL Editor: pegar con Ctrl+V."
echo "  [3] Correr un PASO por vez (seleccionar el bloque y Run)."
echo "      No sirve de una sola pasada: pg_net recien manda el"
echo "      pedido cuando la transaccion commitea."
echo
echo "  Esperado en el PASO 2: tres filas con status_code 200."
echo "  Un 401 significa que el secreto del trigger no coincide"
echo "  con el de la Edge Function."
echo

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$SQL_EDITOR" >/dev/null 2>&1 &
else
  echo "  SQL Editor: $SQL_EDITOR"
  echo
fi

echo "  ------------------------------------------------------------"
read -rsn1 -p "  Toca una tecla para cerrar." _ || true
echo
