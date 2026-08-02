#!/usr/bin/env bash
# Gemelo en Linux de vigilancia.bat, el que usan las tareas automaticas. A
# diferencia de los .sh numerados NO espera una tecla: corre solo y devuelve el
# codigo de salida del chequeo.
#
#   herramientas/vigilancia.sh deps
#   herramientas/vigilancia.sh smoke
#   herramientas/vigilancia.sh contenido
#
# Desde cron conviene la ruta absoluta y un PATH con node; ver LEER.md.
set -u
cd "$(dirname "$0")/.." || exit 1

exec node herramientas/vigilancia.mjs "${1:-}"
