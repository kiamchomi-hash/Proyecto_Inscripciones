# Publicación y recuperación en Cloudflare

El sitio funciona en el Worker `cau-produccion-20261026`, con los dominios
`www.siglo21sur.com` y `siglo21sur.com` y la base D1 `cau-produccion`.
La migración es definitiva; la recuperación se hace dentro de Cloudflare.

## Antes de publicar

- Revisar los cambios y ejecutar los controles del proyecto y de `cloudflare/`.
- Comprobar la configuración en `produccion/wrangler.json` y el plan con
  `npm run publicar` desde `cloudflare/`.
- El flujo de publicación está preparado para versiones Worker con canary 0% → smoke con override
  → 5% → smoke → 100%; ante fallo devuelve el Worker estable al 100% y nunca
  revierte D1. No es elegible hasta que estén disponibles el bucket
  `cau-assets-historicos`, `CLOUDFLARE_R2_API_TOKEN` separado y la regla de
  afinidad de la zona.
- La regla `http_request_transform` tiene que cubrir `www.siglo21sur.com` y
  `siglo21sur.com` y asignar dinámicamente `Cloudflare-Workers-Version-Key` a
  `ip.src`. Así el HTML y sus requests de assets llegan a la misma versión
  durante el gradual deployment. Después de crearla y verificarla, definir la
  variable de Actions `CANARY_VERSION_AFFINITY_CONFIGURED=true`. La variable
  sola no crea ni comprueba la regla; sin ella el publicador falla cerrado.
- Los assets se suben antes de incluir la candidata en el deployment. El smoke
  fuerza la candidata con `Cloudflare-Workers-Version-Overrides` y verifica
  también una ruta de asset en R2. La sincronización no borra objetos: los
  guarda por hash de su contenido y sólo sube los que no están, usando el índice
  `indices/objetos.json` del mismo bucket. Si ese índice falta o no se puede
  leer, sube todo (más lento, igual de correcto).
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
