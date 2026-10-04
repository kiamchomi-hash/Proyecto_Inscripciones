# Variables de entorno

El digest diario de `digest-clicks` consulta una vez por día los visitantes de Vercel Analytics. Para que también envíe
ese número a Telegram necesita, sólo en Supabase Edge Functions, `VERCEL_ANALYTICS_TOKEN`,
`VERCEL_ANALYTICS_PROJECT_ID` y `VERCEL_ANALYTICS_TEAM_ID`. El token es secreto y no va al repo ni al navegador.

Lo que usa Next en producción (plantilla en `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_EXPECTED_HOSTNAME` y `NEXT_PUBLIC_GA_ID`, más `REVALIDATE_SECRET` (`/api/revalidar`) y `CRON_SECRET` (los dos crons de `vercel.json`: `/api/vigilancia` y `/api/newsletter`). `WEBHOOK_SECRET` es la única que consumen sólo las Edge Functions; `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` las usan **las dos partes** — las Edge Functions `notificar`, `alerta-firewall` y `digest-clicks`, y también `/api/vigilancia`, que es Next.

El `.env.local` de esta máquina tiene, de las que usa Next, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GA_ID` y las tres de Turnstile; el resto de sus ~20 líneas son de las herramientas (`EDITOR_DATABASE_URL`, `TELEGRAM_*`, y las credenciales de los scripts de ventas). **La que no está es `SUPABASE_SERVICE_ROLE_KEY`.** Alcanza para levantar el sitio y leer de la base, pero un POST válido a `/api/formularios` devuelve 503 al consultar la cuota o intentar escribir; los sobres inválidos devuelven 400 antes. `vercel env pull` no trae la service role (está marcada Sensitive). Para probar formularios de punta a punta hay que pegarla a mano desde el gestor de contraseñas.

El robot de Teclab (`docs/formularios-por-casa.md`) suma tres, todas en Vercel:

- `ROBOT_SECRET`: autentica al robot en `/api/robot/autoinscripciones` (`Authorization: Bearer …`). Va también como secreto del repo `cau-robot-teclab` en GitHub. Sin ella, el endpoint responde 503.
- `ROBOT_GITHUB_TOKEN`: token de GitHub con permiso para disparar `repository_dispatch` en el repo del robot (fine-grained, Contents: read and write, sólo ese repo). Sin ella, no se despacha y las autoinscripciones quedan pendientes.
- `ROBOT_GITHUB_REPO`: `dueño/repo` del robot, por ejemplo `kiamchomi-hash/cau-robot-teclab`.

El mail con el resumen del precio de Teclab y el newsletter semanal (`docs/formularios-por-casa.md`) usan una, en Vercel y marcada Sensitive:

- `SMTP2GO_API_KEY`: clave de la API de SMTP2GO con la que `/api/formularios` manda el mail desde `inscripciones@siglo21sur.com`. Sin ella no se manda nada (queda un `console.warn`) y la respuesta del formulario no cambia. La usa también el cron `/api/newsletter`, que sin ella responde 503 sin leer la base. Como toda variable nueva en Vercel, recién vale después de un redeploy.

`NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL=1` habilita el token `rate-limit-only` únicamente con `NODE_ENV=development` y sin claves Turnstile. El valor por defecto es `0`; producción lo ignora aunque esté en `1`. No reemplaza la service role ni el rate limit.
