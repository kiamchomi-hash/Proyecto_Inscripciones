#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
npm run calidad
resultado=$?
read -r -p "Enter para cerrar..."
exit "$resultado"
