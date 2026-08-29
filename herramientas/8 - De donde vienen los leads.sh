#!/usr/bin/env bash
# Gemelo en Linux de "8 - De donde vienen los leads.bat". Mismo informe, mismo
# codigo de salida. Doble clic (el escritorio pregunta si ejecutar en terminal)
# o:
#   bash "herramientas/8 - De donde vienen los leads.sh"
set -u
cd "$(dirname "$0")/.." || exit 1

echo
echo "  DE DONDE VIENEN LOS LEADS"
echo "  Clics a WhatsApp, consultas del formulario y trafico desde Google,"
echo "  de los ultimos 14 dias."
echo

node --env-file-if-exists=.env.local herramientas/leads.mjs
salida=$?

echo
echo "  ------------------------------------------------------------"
read -rsn1 -p "  Terminado. Toca una tecla para cerrar." _ || true
echo
exit $salida
