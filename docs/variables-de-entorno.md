# Variables de entorno

La plantilla es `.env.example` y lo que consume el sitio publicado sale de
`cloudflare/src/api/runtime.ts`: los secretos se cargan en Cloudflare y las
públicas, como `vars` en `cloudflare/produccion/wrangler.json`.

Lo que usa el Worker: `CRON_SECRET` (autentica `/api/vigilancia`,
`/api/newsletter` y `/api/recordatorio-teclab`), `REVALIDATE_SECRET`
(`/api/revalidar`), `SMTP2GO_API_KEY`, `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`
para los avisos, las tres de Turnstile y `NEXT_PUBLIC_GA_ID`. Las banderas
`NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL` y `NEXT_PUBLIC_FORMULARIOS_DEMO` son de
desarrollo y producción las ignora.

El `.env.local` de esta máquina conserva además credenciales que no son del
sitio: los portales de precios, HubSpot y Search Console. Las de Supabase
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `EDITOR_DATABASE_URL`) quedaron cuando se dio de
baja esa base y ya no las lee nada del sitio.

El robot de Teclab se dio de baja el 27/10/2026: ya no existen `ROBOT_SECRET`, `ROBOT_GITHUB_TOKEN` ni `ROBOT_GITHUB_REPO`, y `/api/robot/autoinscripciones` tampoco. Detalle en `odd/tasks/autoinscripcion-teclab.md`.

El mail con el resumen del precio de Teclab y el newsletter semanal (`docs/formularios-por-casa.md`) usan una, en Cloudflare y marcada Sensitive:

- `SMTP2GO_API_KEY`: clave de la API de SMTP2GO con la que `/api/formularios` manda el mail desde `inscripciones@siglo21sur.com`. Sin ella no se manda nada (queda un `console.warn`) y la respuesta del formulario no cambia. La usa también el cron `/api/newsletter`, que sin ella responde 503 sin leer la base. Como toda variable nueva en Cloudflare, recién vale después de un redeploy.

`NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL=1` habilita el token `rate-limit-only` únicamente con `NODE_ENV=development` y sin claves Turnstile. El valor por defecto es `0`; producción lo ignora aunque esté en `1`. No reemplaza el rate limit ni el captcha real.

`NEXT_PUBLIC_FORMULARIOS_DEMO=1` es el modo demo de formularios, **sólo de desarrollo**: vale únicamente con `NODE_ENV=development` (`npm run dev`); en producción, en el build y en los tests se ignora aunque esté en `1`. Sirve para recorrer en local todos los pasos de la preinscripción sin captcha. El widget no carga Cloudflare (aunque haya site key) y `/api/formularios` valida el payload y responde 201 con datos de demo. **Qué no hace**: no escribe en D1, no consume la cuota, no verifica Turnstile, no manda mails por SMTP2GO, no da de alta en HubSpot, no suscribe al newsletter y no dispara avisos de Telegram. Por eso no prueba la integración real: para eso está `NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL` o las claves de prueba de Cloudflare. Detalle en `docs/formularios-por-casa.md`, sección «Modo demo».

## Publicar el Worker de producción

Todo lo de arriba es de la app anterior. El sitio publicado se despliega desde `cloudflare/` y usa una sola credencial:

- `CLOUDFLARE_API_TOKEN`: token acotado a esta cuenta, guardado en `.env.local` (no versionado) o pasado por el entorno. Permisos: `Workers Scripts:Edit`, `Workers Routes:Edit` de la zona `siglo21sur.com` y `Queues:Edit`; `D1:Edit` sólo si además se van a aplicar migraciones. `npm run publicar:ensayo` funciona sin él porque no sale a la red; `npm run publicar:produccion` se niega a publicar sin credencial.

El camino recomendado es publicar desde CI: `.github/workflows/publicar.yml` usa el secreto de repositorio `CLOUDFLARE_API_TOKEN` (mismos permisos) y se dispara a mano desde Actions. La variable local queda para trabajar en la máquina.

El publicador (`cloudflare/scripts/publicar.mjs`) le pasa a wrangler **sólo** el `PATH`, el `HOME` y ese token: la service role de Supabase, `SMTP2GO_API_KEY`, `TELEGRAM_*` y las credenciales de ventas que comparten el archivo no entran al proceso que publica. La alternativa a la variable es `wrangler login`, que guarda el OAuth en texto plano en `~/.wrangler/config/default.toml`; sirve, pero no se acota por permiso ni por Worker y no deja rastro de quién publicó.
