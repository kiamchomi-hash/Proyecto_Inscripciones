# Publicación y recuperación en Cloudflare

El sitio funciona en el Worker `cau-produccion-20261026`, con los dominios
`www.siglo21sur.com` y `siglo21sur.com` y la base D1 `cau-produccion`.
La migración es definitiva; la recuperación se hace dentro de Cloudflare.

## Antes de publicar

- Revisar los cambios y ejecutar los controles del proyecto y de `cloudflare/`.
- Comprobar la configuración en `produccion/wrangler.json` y el plan con
  `npm run publicar` desde `cloudflare/`.
- No incluir secretos ni datos privados en Git. Las migraciones D1 se aplican
  por separado y necesitan su propia revisión.
- Un push a `main` publica el commit después de las verificaciones. El deploy
  manual y los ensayos están documentados en `AGENTS.md`.

## Recuperación

- **Worker:** volver a una versión anterior del Worker si es necesario y
  comprobar rutas, cabeceras, redirects y formularios.
- **D1:** una versión anterior del Worker no revierte datos. Antes de restaurar,
  respaldar y reconciliar lo escrito desde el punto de recuperación; no pisar
  filas nuevas.
- **Efectos externos:** un aviso enviado no se deshace y uno ambiguo no se
  reintenta automáticamente.

Los cambios en producción y la recuperación de datos requieren autorización.
