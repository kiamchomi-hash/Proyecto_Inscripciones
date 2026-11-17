# Plazo del control integral de Cloudflare

## Problema

El publicador ejecuta `npm --prefix cloudflare run check` con un límite general
de cinco minutos. Ese comando recorre muchas suites consecutivas y la corrida
instrumentada superó ese plazo durante telemetría, aunque los archivos del
snapshot seguían presentes. Al matar el proceso principal antes de terminar,
sus pruebas pueden quedar interrumpidas y dejar errores secundarios engañosos.

## Diseño aprobado

Mantener el límite actual para los demás comandos y ampliar a treinta minutos
únicamente `npm --prefix cloudflare run check`. Probar el plazo como parte del
contrato de `checkLocal`; no omitir suites, cambiar su orden ni relajar la
verificación del snapshot.

## Límite

No modifica el workflow remoto, las credenciales, D1 ni la configuración de
producción. La publicación continúa bloqueada hasta completar todos los checks.
