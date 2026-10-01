#!/usr/bin/env bash
# La selección, revisión y publicación viven en el mismo módulo en ambos sistemas.
cd "$(dirname "$0")/.." || exit 1
node herramientas/deploy.mjs
resultado=$?
printf '\n'
read -rsn1 -p "Toca una tecla para cerrar." _ || true
printf '\n'
exit "$resultado"
