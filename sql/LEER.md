# SQL de trabajo

Esta carpeta se reserva para archivos SQL preparados para D1. El esquema y las
migraciones del sitio publicado están en `cloudflare/migrations/`.

Los archivos históricos de PostgreSQL y Supabase se retiraron del árbol de
trabajo; siguen disponibles en el historial de Git. No se deben ejecutar en D1.
Para escribir en producción se usa `npm run db:d1` con `--escribir` y se revisa
la sentencia antes de ejecutarla.
