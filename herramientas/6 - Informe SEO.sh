#!/usr/bin/env bash
# Gemelo en Linux de "6 - Informe SEO.bat". Mismo informe, mismo codigo de
# salida. Doble clic (el escritorio pregunta si ejecutar en terminal) o:
#   bash "herramientas/6 - Informe SEO.sh"
set -u
cd "$(dirname "$0")/.." || exit 1

echo
echo "  INFORME SEO"
echo "  Baja los datos de Search Console y deja el informe en"
echo "  herramientas/vigilancia-logs/seo-ultimo.md"
echo
echo "  Tarda unos minutos: revisa una por una las URLs del sitemap."
echo

node --env-file-if-exists=.env.local herramientas/seo-semanal.mjs
salida=$?

echo
echo "  ------------------------------------------------------------"
read -rsn1 -p "  Terminado. Toca una tecla para cerrar." _ || true
echo
exit $salida
