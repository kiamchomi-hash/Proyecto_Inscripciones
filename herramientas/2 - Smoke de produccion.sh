#!/usr/bin/env bash
# Gemelo en Linux de "2 - Smoke de produccion.bat".
set -u
cd "$(dirname "$0")/.." || exit 1

echo
echo "  SMOKE DE PRODUCCION"
echo "  Revisa www.siglo21sur.com: rutas, cabeceras, redirects,"
echo "  las 119 URLs del sitemap y el peso real de la home."
echo "  Tarda un par de minutos."
echo

node herramientas/smoke.mjs
salida=$?

echo
echo "  ------------------------------------------------------------"
read -rsn1 -p "  Terminado. Toca una tecla para cerrar." _ || true
echo
exit $salida
