#!/usr/bin/env bash
# Gemelo en Linux de "1 - Auditar contenido.bat". Mismo chequeo, mismo codigo de
# salida. Doble clic (el escritorio pregunta si ejecutar en terminal) o:
#   bash "herramientas/1 - Auditar contenido.sh"
set -u
cd "$(dirname "$0")/.." || exit 1

echo
echo "  AUDITORIA DE CONTENIDO"
echo "  Busca lo que falta cargar en Supabase."
echo

node --env-file-if-exists=.env.local herramientas/auditar-contenido.mjs
salida=$?

echo
echo "  ------------------------------------------------------------"
read -rsn1 -p "  Terminado. Toca una tecla para cerrar." _ || true
echo
exit $salida
