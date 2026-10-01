#!/usr/bin/env bash
cd -- "$(dirname -- "$0")/.." || exit 1
node herramientas/secretos.mjs
estado=$?
read -r -p "Presionar Enter para cerrar..." _
exit "$estado"
