#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
node --env-file-if-exists=.env.local herramientas/integraciones.mjs "$@"
