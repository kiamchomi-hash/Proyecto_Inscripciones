#!/usr/bin/env bash
# Revisa las skills del repo: frontmatter, tamano, rutas absolutas y enlaces.
cd "$(dirname "$0")/.." || exit 1
node herramientas/verificar-skills.mjs
resultado=$?
printf '\n'
read -rsn1 -p "Toca una tecla para cerrar." _ || true
printf '\n'
exit "$resultado"
