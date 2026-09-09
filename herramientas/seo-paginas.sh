#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
node herramientas/seo-paginas.mjs "$@"
