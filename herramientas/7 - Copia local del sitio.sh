#!/usr/bin/env bash
# Gemelo en Linux de "7 - Copia local del sitio.bat".
set -u
cd "$(dirname "$0")/.." || exit 1

echo
echo "  COPIA LOCAL DE DOBLE CLIC"
echo "  Arma en el Escritorio una copia del sitio con todas las versiones:"
echo "  produccion, cada rama y la experimental, con menu lateral."
echo
echo "  Compila una vez por version y cambia de rama, asi que el arbol"
echo "  tiene que estar sin cambios pendientes. Tarda varios minutos."
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
destino="$HOME/Desktop/CAU-copia/ABRIR.html"
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
