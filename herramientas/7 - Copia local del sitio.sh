#!/usr/bin/env bash
# Gemelo en Linux de "7 - Copia local del sitio.bat".
set -u
cd "$(dirname "$0")/.." || exit 1

echo
echo "  COPIA LOCAL DE DOBLE CLIC"
echo "  Arma en el Escritorio una copia del sitio con todas las versiones:"
echo "  main, ramas compatibles con el Worker y el trabajo actual, con menu lateral."
echo
echo "  Compila cada version en una carpeta aislada. Tarda varios minutos."
echo "  No sobrescribe una copia anterior: hay que moverla antes de continuar."
echo

node herramientas/copia-local.mjs
salida=$?

if [ "$salida" -ne 0 ]; then
  echo
  echo "  No se pudo actualizar la copia. No se abre la version anterior."
  echo "  Revisa el error que aparece arriba."
  echo
  echo "  ------------------------------------------------------------"
  read -rsn1 -p "  Toca una tecla para cerrar." _ || true
  echo
  exit "$salida"
fi

# El .bat abre la carpeta con "start"; aca el equivalente es xdg-open. Si el
# entorno no lo tiene, no es un error: la copia ya esta escrita.
if [ -d "$HOME/Escritorio" ]; then
  destino="$HOME/Escritorio/CAU-copia/ABRIR.html"
else
  destino="$HOME/Desktop/CAU-copia/ABRIR.html"
fi
echo
if [ -f "$destino" ] && command -v xdg-open >/dev/null 2>&1; then
  echo "  Abriendo la copia..."
  xdg-open "$destino" >/dev/null 2>&1 &
else
  echo "  Copia en: $destino"
fi

echo
echo "  ------------------------------------------------------------"
read -rsn1 -p "  Terminado. Toca una tecla para cerrar." _ || true
echo
exit $salida
