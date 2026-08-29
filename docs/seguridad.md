# Seguridad: historial y revisiones

Este archivo es la memoria de seguridad del proyecto. Contesta tres preguntas que antes había que reconstruir a mano cada vez: qué se endureció y cuándo, qué defensas hay hoy y quién las sostiene, y qué mirar en la próxima revisión.

Creado el 29/08/2026 reconstruyendo el historial desde el log de git, los archivos de `sql/` y `PENDIENTES.md`. Las revisiones nuevas se anotan al final, en "Bitácora".

## Qué se endureció, en orden

**20/07/2026, el endurecimiento grande** (`e5a3088`, `sql/2026-07-20_seguridad_*.sql`). Es la fecha que parte el proyecto en dos. Se retiró el módulo de alumnos entero (scrapeaba eCampus y guardaba datos de terceros), se borraron las rutas de subida de imágenes que no validaban nada, y los formularios públicos dejaron de escribir en Supabase desde el navegador: entró `POST /api/formularios` con la service role del lado del servidor, `lib/turnstile.ts` para verificar el captcha, `lib/sanitize-content.ts` para el HTML que viene de la base y el rate limit por IP hasheada (`check_form_rate_limit`, tabla `form_rate_limits` sin acceso para `anon` ni `authenticated`). En la base se encendió RLS sobre `profesores` con la función `current_user_is_admin()`, y `middleware.ts` pasó a `proxy.ts` con la cadena sesión -> fila en `profesores` -> estado aprobado -> rol. Las cabeceras de seguridad y la CSP se declararon en `next.config.ts`.

**22/07/2026, la lectura pública de datos personales** (`608e430`, `sql/2026-07-22_cerrar_lectura_publica.sql`). El endurecimiento anterior había revocado `INSERT` pero dejado `SELECT` abierto a `anon`, y la anon key viaja en el bundle: el contacto de cada pregunta de FAQ era público. Se encendió RLS en `consultas`, `solicitudes_clase` y `faq_preguntas`, se revocó `SELECT` en las tres, y `faq_preguntas` quedó con grant por columna (sin `contacto` ni `nombre_contacto`) y policy de sólo aprobadas.

**20 al 27/07/2026, el incidente de los avisos.** El mismo endurecimiento le agregó validación de secreto a la Edge Function `notificar` y el trigger de la base nunca se actualizó para mandarlo. Como `net.http_post` encola sin bloquear, el `INSERT` siguió respondiendo 201 durante ocho días con las notificaciones muertas. No costó ningún lead real (la única consulta del período era una prueba propia), pero fijó la regla: **estos cambios se verifican en `net._http_response`, nunca por lo que responde el formulario**.

**29/07/2026, rotación de `TURNSTILE_SECRET_KEY`** (`b3dbac5`), junto con los arreglos del captcha vencido que rechazaba envíos y la validación de teléfono del lado del cliente.

**30/07/2026, los advisors de Supabase** (`sql/2026-07-30_corregir_advisors_supabase.sql`): funciones sin `search_path` fijo y objetos que el linter del dashboard marcaba.

**08/08/2026, dependencias** (`4b11920`). La auditoría encontró que los `overrides` de `package.json` eran la causa de las vulnerabilidades, no el remedio: pineaban versiones viejas. Se sacaron casi todos (quedó el de `postcss`, a propósito, porque Next pinea una versión más vieja que la parcheada). Antes, el 02/08, se había actualizado `sanitize-html` a 2.17.6.

**08/08/2026, alertas de firewall** (`4288ee5`). Tercera familia de webhooks: el evento `firewall.attack` de Vercel llama a la Edge Function `alerta-firewall`, que avisa por Telegram. Usa `VERCEL_WEBHOOK_SECRET`, que es un secreto aparte de `WEBHOOK_SECRET`.

**28/08/2026, los secretos al Vault** (`c40fdeb`, `a3911bc`, `800f7e9`; `sql/2026-08-28_secretos_al_vault.sql` y `_rotar_secretos.sql`). `REVALIDATE_SECRET` y `WEBHOOK_SECRET` estaban escritos como literales en el cuerpo de `notify_revalidar` y `notify_edge_function`, y `pg_proc` deja leer el cuerpo de una función a cualquier rol que pueda conectarse. De `WEBHOOK_SECRET` había tres copias: los dos triggers y el `command` del job `digest-clicks-diario`. Ahora los tres leen de `vault.decrypted_secrets`, lo que obligó a que `notify_edge_function` pase a `SECURITY DEFINER`. Los dos secretos se rotaron ese mismo día. Los cuatro archivos viejos de `sql/` que reponían el literal se corrigieron, porque la convención es correr `sql/` a mano en orden de fecha y reaplicar cualquiera de ellos deshacía el arreglo.

**28/08/2026, el rol `cau_editor`** (`f2da33b`, `sql/2026-08-28_rol_editor_contenido.sql`). Para editar contenido desde local sin tener la service role en la máquina. Es un rol de Postgres distinto, con privilegios sólo sobre las tablas de contenido, y `herramientas/db.mjs` además frena los `UPDATE` y `DELETE` sin `WHERE`. Se descartó firmar un JWT con el secreto del proyecto justamente porque ese secreto también emite tokens `service_role`.

## Lo que sostiene el modelo hoy

El detalle vive en `CLAUDE.md`; acá va sólo el mapa de qué protege qué, para saber qué se rompe si se toca algo.

| Defensa | Dónde | Qué pasa si falla |
|---|---|---|
| Los formularios públicos no escriben directo | `app/api/formularios/route.ts` más los grants revocados | cualquiera con la anon key del bundle escribe en las tablas |
| Turnstile con verificación de hostname | `lib/turnstile.ts` | los formularios se llenan de bots |
| Rate limit por IP hasheada | RPC `check_form_rate_limit` | 5 por tipo cada 10 min; sin eso no hay tope |
| RLS y grants por columna | `sql/2026-07-2*_seguridad_*.sql`, `_cerrar_lectura_publica.sql` | los datos personales vuelven a ser públicos |
| Cadena de acceso al panel | `proxy.ts` | cualquiera logueado entra al admin |
| CSP y cabeceras | `next.config.ts` | XSS y clickjacking |
| Sanitizado del HTML de la base | `lib/sanitize-content.ts` | XSS almacenado en novedades |
| Secretos en el Vault | `vault.decrypted_secrets` | se leen desde `pg_proc` con cualquier rol |
| La service role no está en local | `.env.local` sin `SUPABASE_SERVICE_ROLE_KEY` | la máquina de casa pasa a tener la credencial que saltea todo |

**`tests/security.test.mjs` es la parte que no se olvida.** Corre en `npm run check` y falla si un componente fuera de `components/admin/` inserta directo en las tablas de formularios, si vuelve el módulo de alumnos, si una API admin queda sin exigir rol, si el JSON-LD deja de escapar contenido de la base o si el endpoint de formularios vuelve a escribir nombres de columna a mano. Cada test de ahí es una regresión que ya pasó una vez.

## Cómo se hace una revisión

Cinco pasos, ninguno tarda. Los resultados van a la bitácora de abajo.

1. `npm audit` y `npm audit --omit=dev`. Si aparece algo, el agente `auditor-dependencias` decide qué conviene actualizar. Ojo con los `overrides`: ya fueron la causa una vez.
2. `node --test tests/security.test.mjs` (o `npm run check`, que lo incluye).
3. `npm run smoke`, que verifica contra producción las cabeceras declaradas en `lib/vigilancia-esperado.ts`, y una mirada a la CSP servida por si algún servicio nuevo quedó sin declarar.
4. `npx vercel firewall overview`, más el ruleset de OWASP en el dashboard (los `active: true` de los grupos no evalúan nada si el ruleset está apagado).
5. Barrido de credenciales: buscar valores en el repo, que es público; revisar los PAT de Supabase en `supabase.com/dashboard/account/tokens`, que no vencen nunca y alcanzan todos los proyectos de la cuenta; y borrar las claves de servicios que se dejaron de usar.
6. **Los avisos públicos de los proveedores, que es el paso que `npm audit` no cubre.** Next.js publica security releases mensuales en `nextjs.org/blog` (desde julio de 2026 con preanuncio), Vercel abre un bulletin en `vercel.com/kb/bulletin/` cuando le pasa algo a la plataforma, y Supabase avisa por el dashboard. Se comprobó el 29/08/2026 que `npm audit` daba **cero** con dos RCE críticos publicados cuatro días antes contra la versión que teníamos: el registry no siempre tiene el advisory cargado, así que la versión de Next se compara a mano contra el último release.

Lo que no se puede probar automatizado: **el captcha** (Cloudflare no emite token para un navegador manejado por Playwright; lo que sí se chequea es que el checkbox se desmarque solo a los 300 s) y **la cadena completa de avisos**, que se verifica con `herramientas/verificar-avisos.sql` leyendo `net._http_response`.

## Bitácora

### 29/08/2026, primera revisión formal

Todo verde. Lo medido:

- `npm audit` y `npm audit --omit=dev`: **0 vulnerabilidades**.
- `tests/security.test.mjs`: **8 de 8**.
- Cabeceras de producción: HSTS con `max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` con cámara, micrófono, geolocalización, pagos y USB en vacío, y CSP completa con `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` y `upgrade-insecure-requests`. `frame-ancestors 'none'` es lo que cubre el clickjacking, así que la ausencia de `X-Frame-Options` no es un hueco.
- `/admin` sin sesión: 307 a `/admin/login`, con `X-Robots-Tag: noindex, nofollow`.
- Repo: ningún secreto versionado. Las coincidencias de la búsqueda son todas menciones en documentación o `GRANT ... TO service_role` en los SQL. `.env.local` está ignorado.
- Firewall de Vercel: habilitado, 4 reglas activas, 0 IP bloqueadas, 0 bypasses, mitigaciones de sistema activas, Attack Mode apagado (que es lo correcto fuera de un ataque).

**Los dos incidentes públicos que nos tocan, revisados el mismo día.**

*La brecha de Vercel del 19/04/2026* (`vercel.com/kb/bulletin/vercel-april-2026-security-incident`). Un empleado de Vercel tenía conectada una herramienta de IA de terceros, Context.ai, que fue comprometida con un infostealer; con esas credenciales el atacante entró a su Google Workspace saltando el MFA, de ahí a su cuenta de Vercel y de ahí a sistemas internos, donde **enumeró y descifró las variables de entorno no sensibles** de un subconjunto de clientes. Vercel notificó a los afectados y recomendó rotar todo lo que no estuviera marcado como Sensitive.

**A nosotros no nos alcanza, y la razón es que las que valen están todas marcadas Sensitive.** Verificado con `npx vercel env ls`: las diecisiete entradas con valor secreto (`SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET`, `REVALIDATE_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `BUSCADOR_SECRET`, `TURNSTILE_EXPECTED_HOSTNAME`) figuran como tipo `Secret`, que es lo que el atacante no pudo descifrar. En texto plano quedan sólo `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, que viajan en el bundle del navegador y son públicas por diseño, y `VENTAS_STORAGE_BUCKET`, que es el nombre de un bucket (`lib/ventas-snapshot.ts`), no una credencial. Como efecto secundario: la molestia de que `vercel env pull` no traiga la service role a la máquina local es la misma marca que dejó la credencial afuera de la brecha.

*El security release de Next.js del 25/08/2026* (`nextjs.org/blog/august-2026-security-release`). Dos RCE críticos, y el lock tenía **16.3.0** contra un fix en **16.3.3**:

- **GHSA-2xp9-vwfh-vxw4**, RCE sin autenticar en la API de optimización de imágenes al procesar un AVIF malicioso, por un agujero en `libheif` debajo de `sharp`. El parche desactiva la optimización de AVIF hasta que llegue el arreglo de upstream.
- **CVE-2026-75604**, RCE sin autenticar cuando el servidor de Next corre sobre un filesystem de Windows y la app usa Pages Router y App Router a la vez, sin Cache Components. Linux y macOS no están afectados y no hay workaround.

**Producción no estuvo expuesta a ninguno de los dos.** El de Windows no aplica dos veces: el runtime de Next en Vercel es Linux y acá no hay Pages Router (no existe `pages/`). Y del de AVIF, Vercel desactivó la optimización de AVIF en su servicio administrado apenas se identificó, así que sirve los AVIF sin procesarlos (`vercel.com/changelog/nextjs-august-2026-security-release`). Los avisos de julio de 2026 ya venían incluidos en 16.3.0 estable, así que ese release no dejó nada suelto. Actualizar a 16.3.3 igual, por higiene y porque el `next dev` local no tiene la mitigación de infraestructura.

Queda abierto, nada urgente:

- **Subir Next de 16.3.0 a 16.3.3**, por lo de arriba. Va en su propio deploy, con `npm run smoke` detrás.

- **Los PAT de Supabase no vencen y alcanzan todos los proyectos de la cuenta.** Al 27/07 quedaban vivos `codex-release` (en uso) y `mercadolibrebot`. Confirmar si el segundo sigue haciendo falta.
- **Restos de Resend.** La clave `Onboarding` y la variable `RESEND_API_KEY` de Vercel quedaron sin uso cuando el mail salió del proyecto. No tocar `topykly-dev`, que es del otro proyecto que comparte la cuenta.
- **El ruleset de OWASP CRS en Vercel.** Verificar en el dashboard si sigue apagado y decidir si se enciende; el CLI no lo muestra.
- **La API key muerta de TestSprite** en el `~/.claude.json` de la máquina de Linux. Es higiene: la key se borró en el servicio el 08/08/2026.
