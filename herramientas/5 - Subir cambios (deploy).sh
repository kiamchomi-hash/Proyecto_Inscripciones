#!/usr/bin/env bash
# Gemelo en Linux de "5 - Subir cambios (deploy).bat". Mismo orden y mismos
# cortes: rama, lista de cambios, descripcion, confirmacion, npm run check, y
# recien ahi commit y push.
set -u
cd "$(dirname "$0")/.." || exit 1

# Los tokens de GitHub que quedaron en el entorno son invalidos y hacen fallar
# el push con un error que no dice nada. Vaciarlos deja que git use las
# credenciales guardadas (gh auth o el credential helper del sistema).
unset GH_TOKEN GITHUB_TOKEN

fin() {
  echo
  read -rsn1 -p "  Toca una tecla para cerrar." _ || true
  echo
  exit "${1:-0}"
}

echo
echo "  SUBIR CAMBIOS A PRODUCCION"
echo "  Un push a main despliega el sitio. No hay vuelta atras en un clic."
echo

rama=$(git rev-parse --abbrev-ref HEAD)
if [ "$rama" != "main" ]; then
  echo "  OJO: estas en la rama \"$rama\", no en main."
  echo "  Este boton es para main. Cancelado."
  fin 1
fi

# Dos cosas distintas pueden estar pendientes: archivos sin commitear, y commits
# ya hechos que nunca se subieron. Hay que mirar las dos.
haycambios=no
[ -n "$(git status --porcelain)" ] && haycambios=si

pendientes=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
[ -n "$pendientes" ] || pendientes=0

mensaje=""

if [ "$haycambios" = no ]; then
  if [ "$pendientes" = 0 ]; then
    echo "  No hay nada para subir: todo commiteado y todo publicado."
    fin 0
  fi
  echo "  No hay archivos sin commitear, pero quedaron $pendientes commits"
  echo "  sin subir:"
  echo "  ------------------------------------------------------------"
  git log origin/main..HEAD --oneline
  echo "  ------------------------------------------------------------"
  echo
  read -r -p "  Publicarlos? (S/N): " ok
  case "${ok:-}" in
    [sS]) ;;
    *) echo; echo "  Cancelado. No se toco nada."; fin 1 ;;
  esac
else
  echo "  Esto es lo que se va a subir:"
  echo "  ------------------------------------------------------------"
  git status --short
  if [ "$pendientes" != 0 ]; then
    echo
    echo "  Ademas van $pendientes commits de antes que nunca se subieron:"
    git log origin/main..HEAD --oneline
  fi
  echo "  ------------------------------------------------------------"
  echo
  echo "  Si aparece algo que no querias subir, cancela y sacalo primero."
  echo

  read -r -p "  Descripcion del cambio: " mensaje
  if [ -z "${mensaje:-}" ]; then
    echo
    echo "  Sin descripcion no se sube nada. Cancelado."
    fin 1
  fi

  echo
  read -r -p "  Subir a produccion con ese mensaje? (S/N): " ok
  case "${ok:-}" in
    [sS]) ;;
    *) echo; echo "  Cancelado. No se toco nada."; fin 1 ;;
  esac
fi

echo
echo "  [1/3] Revisando el codigo (lint + tipos + tests)..."
echo
if ! npm run check; then
  echo
  echo "  ------------------------------------------------------------"
  echo "  LAS REVISIONES FALLARON. No se commiteo ni se subio nada."
  echo "  Arreglar lo de arriba, o pedirle a Claude que lo mire."
  fin 1
fi

if [ "$haycambios" = si ]; then
  echo
  echo "  [2/3] Guardando el commit..."
  git add -A
  if ! git commit -m "$mensaje"; then
    echo
    echo "  El commit fallo. No se subio nada."
    fin 1
  fi
fi

echo
echo "  [3/3] Subiendo a GitHub..."
if ! git push; then
  echo
  echo "  ------------------------------------------------------------"
  echo "  EL PUSH FALLO, pero el commit quedo guardado en local."
  echo "  Suele ser que el repo cambio desde otro lado. Pedirle a"
  echo "  Claude que lo resuelva; no se pierde nada."
  fin 1
fi

echo
echo "  ------------------------------------------------------------"
echo "  Listo. Vercel ya esta desplegando: tarda un par de minutos."
echo "  https://www.siglo21sur.com"
echo
echo "  Cuando termine, conviene correr el 2 (Smoke de produccion)"
echo "  para confirmar que el sitio quedo bien."
fin 0
