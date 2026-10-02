#!/bin/sh
# Control local compartido por Git en Windows y Linux; stdin conserva las refs.
root=$(git rev-parse --show-toplevel) || exit 1
command -v node >/dev/null 2>&1 || { echo 'Falta Node. Instalar Node y reintentar el push.' >&2; exit 1; }
exec node "$root/herramientas/pre-push.mjs"
