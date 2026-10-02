#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.." || exit 1
node --env-file-if-exists=.env.local herramientas/tipos-supabase.mjs
