#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.." || exit 1
node herramientas/equivalencias.mjs
