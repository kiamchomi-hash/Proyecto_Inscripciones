#!/usr/bin/env bash
# Gemelo en Linux de "3 - Capturas del sitio.bat".
set -u
cd "$(dirname "$0")/.." || exit 1

echo
echo "  CAPTURAS DESKTOP + MOBILE"
echo "  6 paginas de produccion, en las dos pantallas."
echo "  Tarda un par de minutos."
echo

node herramientas/capturas.mjs
salida=$?

# El .bat abre la carpeta con "start"; aca el equivalente es xdg-open. Si el
# entorno no lo tiene (una sesion por SSH, por ejemplo), no es un error: la
# carpeta ya esta escrita y se avisa la ruta.
echo
if command -v xdg-open >/dev/null 2>&1; then
  echo "  Abriendo la carpeta de capturas..."
  xdg-open screenshots >/dev/null 2>&1 &
else
  echo "  Capturas en: $PWD/screenshots"
fi

echo
echo "  ------------------------------------------------------------"
read -rsn1 -p "  Terminado. Toca una tecla para cerrar." _ || true
echo
exit $salida
