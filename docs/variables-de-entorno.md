# Variables de entorno

La plantilla `.env.example` cubre lo que se usa en esta máquina (la credencial de
Cloudflare, la analítica, Telegram y los informes). Lo que consume el sitio
publicado sale de `cloudflare/src/api/runtime.ts`: los secretos se cargan en
Cloudflare y las públicas, como `vars` en `cloudflare/produccion/wrangler.json`.

Lo que usa el Worker: `TURNSTILE_SECRET_KEY` (secreto) con
`TURNSTILE_EXPECTED_HOSTNAME` y `PUBLIC_TURNSTILE_SITE_KEY` (vars) para el
captcha; `CRON_SECRET` para `/api/vigilancia`, `/api/newsletter` y
`/api/recordatorio-teclab`; `REVALIDATE_SECRET` para `/api/revalidar` (sin él
responde 503, y hoy no lo dispara ningún trigger); `ALERTA_CLOUDFLARE_SECRETO`
para el webhook de Cloudflare Notifications; `TELEGRAM_BOT_TOKEN` y
`TELEGRAM_CHAT_ID` para los avisos; `CF_ANALYTICS_TOKEN` con `CF_ACCOUNT_TAG` y
`CF_RUM_SITE_TAG` para las visitas; y `CORREO_PRUEBA_SECRETO` /
`CORREO_PRUEBA_DESTINO` para `/api/correo-prueba`, que sólo manda a una casilla.
`DB`, `EFECTOS` y `EMAIL` son bindings, no variables: D1, la cola y el envío de
correo. Las banderas `FORMULARIOS_PRUEBA_LOCAL` y `FORMULARIOS_DEMO` son de
desarrollo (`APP_STAGE` local) y producción las ignora.

El `.env.local` de esta máquina conserva además credenciales que no son del
sitio: los portales de precios, HubSpot y Search Console.

El robot de Teclab se dio de baja el 27/10/2026: ya no existen `ROBOT_SECRET`, `ROBOT_GITHUB_TOKEN` ni `ROBOT_GITHUB_REPO`, y `/api/robot/autoinscripciones` tampoco. Detalle en `odd/tasks/autoinscripcion-teclab.md`.

El mail con el resumen del precio de Teclab y el newsletter semanal (`docs/formularios-por-casa.md`) salen por el binding `send_email` de Cloudflare desde `inscripciones@siglo21sur.com`, con el remitente restringido en `wrangler.json`: no hay clave que custodiar ni rotar. SMTP2GO y su `SMTP2GO_API_KEY` se retiraron el 29/10/2026 ([detalle](correo-cloudflare.md)). Sin binding no hay transporte: la intención queda en el outbox y la levanta el barrido.

`FORMULARIOS_PRUEBA_LOCAL=1` habilita el token `rate-limit-only` únicamente con `APP_STAGE` local y sin claves Turnstile. El valor por defecto es `0`; producción lo ignora aunque esté en `1`. No reemplaza el rate limit ni el captcha real.

`FORMULARIOS_DEMO=1` es el modo demo de formularios, **sólo de desarrollo**: vale únicamente con `APP_STAGE` local; en producción, en el build y en los tests se ignora aunque esté en `1`. Sirve para recorrer en local todos los pasos de la preinscripción sin captcha. El widget no carga Cloudflare (aunque haya site key) y `/api/formularios` valida el payload y responde 201 con datos de demo. **Qué no hace**: no escribe en D1, no consume la cuota, no verifica Turnstile, no manda correo, no suscribe al newsletter y no dispara avisos de Telegram. Por eso no prueba la integración real: para eso está `FORMULARIOS_PRUEBA_LOCAL` o las claves de prueba de Cloudflare. Detalle en `docs/formularios-por-casa.md`, sección «Modo demo».

## Publicar el Worker de producción

Los de arriba son del Worker, y `CLOUDFLARE_API_TOKEN` es la única que usa esta máquina para publicar. El sitio se despliega desde `cloudflare/`:

- `CLOUDFLARE_API_TOKEN`: token acotado a esta cuenta, guardado en `.env.local` (no versionado) o pasado por el entorno. Permisos: `Workers Scripts:Edit`, `Workers Routes:Edit` de la zona `siglo21sur.com` y `Queues:Edit`; `D1:Edit` sólo si además se van a aplicar migraciones. `npm run publicar:ensayo` funciona sin él porque no sale a la red; `npm run publicar:produccion` se niega a publicar sin credencial.

El camino normal es el push a `main`: el workflow `Verificaciones` corre los controles y, si pasan, publica ese mismo commit con el secreto de repositorio `CLOUDFLARE_API_TOKEN` (mismos permisos). `.github/workflows/publicar.yml` queda para el ensayo y el deploy manual desde Actions. La variable local queda para trabajar en la máquina.

El publicador (`cloudflare/scripts/publicar.mjs`) le pasa a wrangler **sólo** el `PATH`, el `HOME` y ese token: `TELEGRAM_*`, `CF_ANALYTICS_TOKEN` y las credenciales de ventas que comparten el archivo no entran al proceso que publica. La alternativa a la variable es `wrangler login`, que guarda el OAuth en texto plano en `~/.wrangler/config/default.toml`; sirve, pero no se acota por permiso ni por Worker y no deja rastro de quién publicó.
