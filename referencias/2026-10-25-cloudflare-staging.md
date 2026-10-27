# Referencias: media externa y preparación de staging

## Documentación oficial actual consultada

- https://developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/ — espacio reservado servido por Cloudflare, no modificable por el Worker; alcance de los controles y exclusión de escáneres, sin ocultar esta limitación.
- https://developers.cloudflare.com/workers/static-assets/direct-upload/ — upload de manifest, buckets base64 y JWT de finalización; transferencia por API con MCP oficial, sin recuperar OAuth para shell.
- https://developers.cloudflare.com/workers/configuration/multipart-upload-metadata/ — módulos, binding D1/ASSETS y secretos sólo de servidor en metadata multipart.
- https://developers.cloudflare.com/workers/wrangler/configuration/ — schema, variables/bindings no heredables, cron vacío, build y riesgo de autoprovisionamiento/DLQ.
- https://developers.cloudflare.com/workers/wrangler/commands/ — referencia de comandos; no se invocó deploy ni dry-run.
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/ — asset-first puede saltear middleware; run_worker_first para proteger todos los assets y limitación de ctx.access.
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ — JWT con firma/issuer/AUD y rotación de JWKS; referencia para un acceso futuro, no activado ni elegido aquí.

## Diez imágenes públicas, GET y decodificación el 25/10/2026

Todas HTTP 200, `image/jpeg`, sin redirecciones. No se conservó el archivo ni
se verificó licencia de redistribución: se preservan las URLs que ya usa el sitio.

- https://i.ytimg.com/vi/K3Gqax1X-dE/maxresdefault.jpg — 1280×720, miniatura en sobre nosotros.
- https://i.ytimg.com/vi/yZNU0NZrGaI/maxresdefault.jpg — 1280×720, miniatura en sobre nosotros.
- https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1000&q=80 — 1000×751, referencia en materias.
- https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1000&q=80 — 1000×751, referencia en materias.
- https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1000&q=80 — 1000×667, referencia en materias.
- https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&q=80 — 1000×667, referencia en materias.
- https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=1000&q=80 — 1000×667, referencia en materias.
- https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1000&q=80 — 1000×667, referencia en materias.
- https://images.unsplash.com/photo-1758612898258-398a43e7fd65?w=1000&q=80 — 1000×563, referencia en materias.
- https://images.unsplash.com/photo-1783115259399-3a5a3e0e4592?w=1000&q=80 — 1000×750, referencia en materias.
