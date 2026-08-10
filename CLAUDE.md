# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sitio de **Universidad Siglo 21 — CAU Villa Lugano**, un centro de aprendizaje a distancia. Publica la oferta académica, capta inscripciones y gestiona las clases de apoyo. Producción: `https://www.siglo21sur.com` (Vercel).

Todo el texto de interfaz, los comentarios de código y la documentación están en español (es-AR).

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm start            # servir el build

npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # node --test tests/*.test.mjs
npm run check        # lint + typecheck + test — correr esto antes de commitear
```

Un test suelto: `node --test tests/security.test.mjs`. Un caso puntual: `node --test --test-name-pattern "rol admin" tests/security.test.mjs`.

### Verificaciones que no cubre `npm run check`

`check` sólo mira el código. En `herramientas/` están las que miran los datos y el sitio publicado, cada una con un `.bat` (Windows) y un `.sh` (Linux) de doble clic al lado (`LEER.md` explica cada una). Los envoltorios son dos, el `.mjs` que hace el trabajo es uno solo: la lógica se toca ahí. Nada de esa carpeta entra al bundle de Next. Las tres primeras salen con código 1 si encuentran algo:

```bash
npm run auditar      # contenido faltante en Supabase (lee con la anon key, corre local)
npm run smoke        # producción: rutas, cabeceras, redirects, sitemap y peso real del HTML
npm run capturas     # PNG desktop + mobile a screenshots/<AAAAMMDD-HHMM>/
npm run seo          # informe semanal de Search Console (mide; no propone)
```

- **`auditar`** (`herramientas/auditar-contenido.mjs`) busca el desfasaje entre la base y las fuentes reales: carreras visibles sin plan de estudios (ni en la columna ni en un slide `plan_estudios`, mismo criterio que el `hasPlan` de `career-detail.tsx`), carreras sin slides —que abren una ficha vacía—, slugs duplicados, niveles desconocidos y novedades publicadas sin `imagen_url` (og:image vacío al compartir). Las carreras `proximamente` bajan a aviso: todavía no tienen temario publicado. Importa `esCarreraVisible()` del módulo real (Node 24 strippea los tipos), así que sigue sola los cambios de taxonomía.
- **`smoke`** (`herramientas/smoke.mjs`) acepta `--base=http://localhost:3000` y `--rapido` (saltea el barrido de las ~119 URLs del sitemap). Los redirects sólo se prueban contra el dominio propio. Mide el peso pidiendo a prod, no comprimiendo local: Vercel comprime el HTML al vuelo con otra calidad.
- **`capturas`** (`herramientas/capturas.mjs`) acepta `--base=`, `--rutas=/faq,/contacto`, `--solo=mobile|desktop` y `--viewport` (sólo la primera pantalla). Usa `devices['iPhone 13']` de Playwright: `chrome --headless --window-size` **no** da un viewport CSS del ancho pedido e inventa recortes falsos en móvil. Navega con `waitUntil: 'load'` porque `networkidle` nunca llega en las páginas con formulario (Turnstile deja tráfico abierto). Desde Git Bash las rutas con `/` inicial se mangean: usar PowerShell o `--rutas=faq,contacto`.

- **`seo`** (`herramientas/seo-semanal.mjs`) baja Search Console firmando un JWT con la service account de `~/.gsc/service_account.json` (la misma del MCP `gsc`), así que no agrega ninguna dependencia. Deja `herramientas/vigilancia-logs/seo-ultimo.md` con páginas cuyo CTR está por debajo de lo esperable **para su posición**, consultas entre la 4 y la 15 con la página que las recibe, caídas de posición y URLs del sitemap sin indexar. Acepta `--rapido` (saltea la inspección URL por URL), `--dias=` y `--sitio=`. La ventana termina tres días antes de hoy porque GSC consolida con atraso. **Las carreras fuera de la oferta quedan afuera del informe**: redirigen a la home y está bien, pero si no se filtran copan la lista — para saber cuáles son lee la oferta vigente de Supabase. Sale con código 1 sólo ante algo roto (página caída del índice, canónica cambiada por Google, caída fuerte de tráfico), no ante una sugerencia. El criterio de qué hacer con los números lo pone el agente `estratega-seo`, que lo lee cuando se lo invoca a mano.

Para los avisos de formulario (Telegram) está `herramientas/verificar-avisos.sql`: prueba los tres triggers de una sola pasada, con los pasos separados porque `pg_net` recién despacha el pedido cuando la transacción commitea.

También en `herramientas/`, sin script npm: `generar-og.mjs` produce por cada novedad dos derivados de 1200×630 desde las fotos de `public/` — la foto limpia (`public/imagenes/novedades/<slug>.jpg`, para `imagen_url`) y la versión con el título compuesto encima (`public/imagenes/og/<slug>.jpg`, para el og:image). Depende de `sharp` (declarado como devDependency).

### Deploy

**Push a `main` = deploy**: Vercel publica automáticamente. `herramientas/5 - Subir cambios (deploy).bat` (o el `.sh` gemelo) es el flujo guiado (muestra el diff, pide descripción, corre `npm run check` y recién ahí commitea y pushea). Antes de un push manual, vaciar `GH_TOKEN` y `GITHUB_TOKEN` si están seteados: valores viejos hacen fallar el push con un error que no explica nada.

### Dos máquinas: Windows y Linux

El proyecto se trabaja desde las dos, con el mismo repo y el mismo comportamiento. Lo que sostiene la paridad:

- **Nada de rutas absolutas de una máquina** en archivos versionados. El caso testigo fue `.claude/skills`, que era un symlink a `/home/coco/...`: en Windows git lo bajaba como un archivo de texto y las skills no cargaban.
- **`.gitattributes` fija los finales de línea** por extensión. Un `.sh` con CRLF falla con `bad interpreter: ^M`.
- **Los envoltorios son por sistema, la lógica no.** Cada verificación es un `.mjs` con un `.bat` y un `.sh` al lado; ninguno de los dos tiene lógica propia.
- **`node herramientas/entorno.mjs exportar|importar`** mueve lo que no viaja por git: `.env.local`, la memoria de Claude Code, la credencial de Search Console, `.agents/` y `notas-locales/` (investigaciones propias que no van al repo, que es público). La memoria vive en `~/.claude/projects/<ruta del proyecto con guiones>/memory`, así que el nombre de la carpeta cambia con la ruta y el script lo recalcula. El procedimiento completo está en `herramientas/LEER.md`.
- **`fs.cpSync` recursivo no se usa**: en Node 24 sobre Windows revienta el proceso (0xC0000409, no lanza excepción) si la ruta tiene un carácter no ASCII, y la de este proyecto tiene un acento.

## Arquitectura

### Next.js 16 + App Router

Las páginas son Server Components que leen de Supabase en el render. La home usa `revalidate = 3600`; `/carreras/[slug]`, `/novedades/[page]` y los artículos usan 86400 para no gastar ISR Writes; `/faq`, `/clases-apoyo/[materia]`, `/imagenes` y `/sitemap.xml` no declaran ninguno, así que son estáticos puros. Esos números son la red de abajo, no el mecanismo: lo que publica de verdad es la revalidación on-demand (ver más abajo). `/clases-apoyo` **también es estática**: mostraba un calendario relativo a hoy y por eso usaba `dynamic = 'force-dynamic'`, pero dejó de mostrarlo y el flag se sacó. La revalida el trigger de `materias`.

`proxy.ts` en la raíz **es el middleware** — Next 16 renombró `middleware.ts` a `proxy.ts` y exporta una función `proxy()`. Ahí vive todo el control de acceso del panel admin.

### Los cuatro clientes de Supabase

Elegir mal el cliente es el error más fácil de cometer:

| Módulo | Credencial | Para qué |
|---|---|---|
| `lib/supabase.ts` | anon, sin sesión | lecturas públicas desde Server Components (carreras, materias, novedades, FAQ) |
| `lib/supabase-auth.ts` | anon + sesión en cookies | **todo el panel admin en el navegador**: login, layout, dashboard, `/admin/clases-apoyo`, sidebar. Incluye sus escrituras |
| `lib/supabase-server.ts` | anon + sesión en cookies | sesión del usuario en Server Components. Hoy **no lo importa nadie** — `proxy.ts` arma su propio `createServerClient` inline |
| `lib/supabase-admin.ts` | **service role** | escrituras del público y de las APIs. Tiene `import 'server-only'`; nunca puede entrar al bundle del cliente |

Qué puede escribir cada rol (definido en `sql/2026-07-20_seguridad_*.sql`):

- **`anon`** (visitante sin sesión) es de sólo lectura. `INSERT` sobre `consultas`, `faq_preguntas` y `solicitudes_clase` está revocado tanto para `anon` como para `authenticated`; por eso los formularios públicos van sí o sí por la service role.
- **`authenticated`** (profesor logueado y aprobado) **sí escribe** con la misma anon key: `UPDATE` sobre `materias` (policy `materias_approved_update`) e `INSERT` de su propia fila en `profesores` (`profesores_register_pending`). No hace falta service role para el panel — no la uses ahí.
- La service role está marcada Sensitive en Vercel, así que **desde la máquina local no hay credencial de escritura**: todo `INSERT`/`UPDATE` manual va por el SQL Editor del dashboard.

### Invariante: los formularios públicos no escriben directo en la base

Todo lo que envía el público pasa por `POST /api/formularios`, que discrimina con el campo `kind`: `consulta` (inscripciones), `faq` (preguntas) o `clase` (turnos de apoyo). El orden real del handler:

1. Valida el sobre (`kind` conocido, `token` presente, `payload` es objeto) → 400.
2. En un `Promise.all`, verifica Turnstile **y** consulta el rate limit. Ojo: el rate limit corre siempre, así que un pedido que falla el captcha igual consume cuota.
3. Recién en `insertConsulta`/`insertFaq`/`insertClase` valida el payload en sí (regex de email y teléfono, formato de horario, cantidad de filas).

`tests/security.test.mjs` falla si algún componente fuera de `components/admin/` llama a `.from('consultas'|'faq_preguntas'|'solicitudes_clase').insert`. No es un test decorativo: es la regla que sostiene el modelo de seguridad.

Rate limit: RPC `check_form_rate_limit(p_key, p_max_requests, p_window_seconds)` con la IP hasheada en SHA-256. La clave incluye el `kind` (`consulta:<hash>`), así que el tope es **5 pedidos por cada tipo** por 10 min — una misma IP puede mandar 15 en total entre los tres. `/api/track-click` usa 60 (navegar 20 tarjetas es uso normal).

Turnstile se verifica en `lib/turnstile.ts`, que además compara el `hostname` que devuelve Cloudflare contra `TURNSTILE_EXPECTED_HOSTNAME` (normaliza `www.`). Si `TURNSTILE_SECRET_KEY` no está seteada, el endpoint acepta el token literal `rate-limit-only`. **Ese atajo solo, sin embargo, no alcanza para probar formularios en local**: el rate limit se consulta igual y usa la service role, así que sin `SUPABASE_SERVICE_ROLE_KEY` el endpoint devuelve 503.

### Avisos de formulario: fallan en silencio

Hay **tres** triggers de Postgres, uno por tabla de formulario, y todos llaman a la misma función `notify_edge_function()`, que vía `net.http_post` invoca la Edge Function `supabase/functions/notificar/` (Telegram, único canal desde el 01/08/2026):

| Tabla | Trigger |
|---|---|
| `consultas` | `on_consulta_insert` |
| `solicitudes_clase` | `on_solicitud_clase_insert` |
| `faq_preguntas` | `on_faq_pregunta_insert` |

**Ya existen y funcionan: no crear triggers nuevos**, duplicarlos duplica los avisos (`sql/2026-07-27_webhook_notificar.sql` lo advierte en mayúsculas).

Como `net.http_post` encola sin bloquear, **el `INSERT` responde 201 aunque la notificación se caiga**. Pasó del 20 al 27/07/2026: se le agregó validación de secreto a la función y el trigger nunca se actualizó.

Cada vez que se toque `WEBHOOK_SECRET`, la función `notificar` o el trigger, hay que verificar a mano — el procedimiento SQL está en `PENDIENTES.md` y en `sql/2026-07-27_webhook_notificar.sql`. Un `401` en `net._http_response` significa que los secretos no coinciden.

### Revalidación on-demand

Hay una **segunda familia de triggers**, que no tiene nada que ver con los avisos: `notify_revalidar()` (en `sql/2026-08-07_revalidar_on_demand.sql`) cuelga de las cuatro tablas de contenido y le pega a `POST /api/revalidar`, que llama a `revalidatePath`. Sin esto, publicar contenido no se veía hasta que venciera el `revalidate` de la página —o hasta el próximo deploy, en las que no declaran ninguno—.

| Tabla | Trigger de aviso | Trigger de revalidación |
|---|---|---|
| `carreras` | — | `on_carreras_revalidar` |
| `novedades` | — | `on_novedades_revalidar` |
| `materias` | — | `on_materias_revalidar` |
| `faq_preguntas` | `on_faq_pregunta_insert` | `on_faq_preguntas_revalidar` |

`faq_preguntas` tiene uno de cada familia: son distintos y los dos tienen que estar.

El endpoint no recibe la fila entera sino los campos con los que arma las rutas (`slug`, `nombre`, `prefix`, `nivel` y los anteriores, para cubrir el renombre). El mapeo tabla → rutas vive en `rutasA()`; **una tabla nueva sin mapear devuelve 400 a propósito**, para que el trigger no dispare contra la nada en silencio. `tabla: 'todo'` rehace el sitio entero, sin deploy.

Se autentica con `REVALIDATE_SECRET` (Vercel), que tiene que coincidir con el literal del cuerpo del trigger. Igual que con los avisos, `net.http_post` encola: si esto falla el `UPDATE` responde ok lo mismo y la página queda vieja. Se diagnostica en `net._http_response` — 401 secretos distintos, 503 falta la variable en Vercel, 400 tabla sin mapear.

### Panel admin

Rutas `/admin/*` y `/api/admin/*`, todas protegidas por `proxy.ts`. La cadena de control:

1. Sin sesión → las páginas redirigen a `/admin/login`, las APIs devuelven 401.
2. Sin fila en `profesores` → se crea una con `estado: 'pendiente'`, `rol: 'profesor'` (auto-registro al primer login).
3. `estado !== 'aprobado'` → `/admin/pendiente` o 403.
4. `/admin` (dashboard) y todo `/api/admin/*` exigen además `rol === 'admin'`; un profesor cae en `/admin/clases-apoyo`.

Públicas dentro de `/admin`: `login`, `auth/callback`, `reset-password`, `pendiente`. `next.config.ts` le pone `X-Robots-Tag: noindex, nofollow` a todo `/admin`.

### Taxonomía de carreras

`components/index/types.ts` es la fuente de verdad y la usan la home, `/carreras/[slug]` y `sitemap.ts` por igual:

- **`esCarreraVisible()`** filtra los niveles fuera de la oferta (Posgrado, APLV-Extragrado, Certificación, Curso). Las filas siguen en Supabase; simplemente no tienen categoría, así que no se listan, no se pueden elegir en el formulario y no tienen página. **Aplicar este filtro en cualquier lectura nueva de `carreras`**, o se publican páginas de carreras que no se dictan.
- `getCategoryForCarrera()` mapea `nivel` → las 5 categorías del catálogo (licenciaturas, tecnicaturas, Identidad Argentina, Teclab Tecnología, Teclab Gestión).
- `getAreaForCarrera()` y `getDurationGroup()` alimentan los filtros, por palabras clave sobre el nombre.
- `carreraToSlug()` arma la URL desde `prefix + nombre` (`carreraFullName()`), sin acentos. La página compara el slug pedido contra el canónico y hace `permanentRedirect` si difiere, así las URLs viejas con guión bajo no duplican contenido.

### Modales de carrera

`careers-catalog.tsx` abre siempre `career-info-modal.tsx`, que es sólo un despachador con imports dinámicos:

1. `nivel === 'Identidad Argentina'` → `ia-modal.tsx` (marca del convenio, azul `#0090C1` / amarillo `#F1CF1C`)
2. `esTeclab(carrera)` → `teclab-modal.tsx` (cian `#2ee7d7` en Tecnología, violeta `#8e2cf2` en Gestión)
3. tiene `slides` → `carousel-modal.tsx`
4. si no → `career-modal.tsx`

Las carreras sin slides *y* fuera de convenio caen en `career-modal.tsx`, que arma la ficha con los campos sueltos. Detectarlas es tarea de `npm run auditar`: hasta el 01/08/2026 lo hacía además un aviso por clic (`/api/notificar-carrera`), que se eliminó por redundante.

`components/carreras/career-content.ts` tiene los helpers puros que comparten el modal (cliente) y la página `/carreras/[slug]` (servidor) — por eso viven fuera de todo componente `'use client'`.

### SEO

Es una prioridad activa del proyecto, no un detalle; `INDEXACION.md` lleva el seguimiento de la campaña de indexación. La medición semanal la hace sola `npm run seo` (ver arriba) y el agente `estratega-seo` la interpreta.

- `app/sitemap.ts` genera todo: home, carreras visibles, materias, páginas de novedades y artículos.
- JSON-LD: `EducationalOrganization` + `LocalBusiness` con `areaServed` en `app/layout.tsx`; `Course` + `BreadcrumbList` en la página de carrera.
- Los `<title>` de carrera eligen el sufijo más largo que entre en 62 caracteres y usan `title: { absolute }` para que el template del layout no duplique la marca.
- Las fichas se enlazan entre sí: 6 del mismo nivel más 2 de otro nivel, con un corte que rota según el `id`. Es determinístico a propósito, para no romper el cache de ISR.
- `next.config.ts` concentra los redirects (apex → `www`, `/carrera/:slug` → `/carreras/:slug`, `/contactos` → `/contacto`, `/carreras` → home).

### Rendimiento y seguridad de la entrega

`next.config.ts` define la CSP completa y las cabeceras de seguridad. Si se agrega un servicio externo (script, fuente, iframe, fetch), hay que sumar su origen a la directiva correspondiente o el navegador lo bloquea.

`experimental.inlineCss: true` está activo a propósito: mete el CSS en el HTML para sacar dos `<link>` de la ruta crítica (~450 ms en móvil según PSI). Ya se midió A/B — apagarlo da peor resultado, aunque el HTML pese más. Requiere el `'unsafe-inline'` que la CSP ya permite.

El CSS es por página: `app/globals.css` y `app/navbar.css` en el layout, y cada página importa el suyo (`app/index.css`, `app/faq/faq.css`, etc.).

### Variables de entorno

Lo que usa Next en producción (plantilla en `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_EXPECTED_HOSTNAME` y `NEXT_PUBLIC_GA_ID`. `WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` los consumen las Edge Functions, no Next.

El `.env.local` de esta máquina tiene sólo `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_GA_ID`. Alcanza para levantar el sitio y leer de la base, pero **cualquier POST a `/api/formularios` devuelve 503 en local** porque falta la service role, y `vercel env pull` no la trae (está marcada Sensitive). Para probar formularios de punta a punta hay que pegarla a mano desde el gestor de contraseñas.

## Base de datos

Tablas de contenido y formularios: `carreras`, `materias`, `clases_apoyo`, `solicitudes_clase`, `consultas`, `faq_preguntas`, `novedades`, `profesores`.

Tablas de infraestructura, sin acceso desde `anon` ni `authenticated` (sólo service role, vía RPC): `form_rate_limits` (respalda `check_form_rate_limit`) y `career_clicks` (respalda `registrar_click_carrera` y el digest diario).

Los archivos de `sql/` **no son migraciones automáticas** — se corren a mano en el SQL Editor de Supabase, en orden de fecha. `sql/instrucciones.md` documenta el setup inicial de clases de apoyo. Hay jobs de `pg_cron` (limpieza de clases pasadas, digest diario de clicks) que se programan desde ahí.

## Convenciones

- Alias `@/*` → raíz del proyecto.
- El contenido HTML que viene de la base (novedades) pasa siempre por `lib/sanitize-content.ts` antes de renderizarse.
- Colores en `app/globals.css` `:root` — fondo `--color-deep-dark-bg: #013729`, acento `--color-highlight: #00c7b1`, tarjetas `--color-card-bg: #1c2f31`, dorado `--color-gold: #e69b05`, marca `--cau-brand-blue: #005587` / `--cau-brand-green: #058c70`.
- `docs/textos-whatsapp.md` son las respuestas institucionales para copiar y pegar al atender un lead a mano. **No las usa el bot**, que contesta desde `ventas/corpus/`. No llevan precios ni fechas a propósito.
- `PENDIENTES.md` es el backlog vivo, con las verificaciones manuales que no se pueden automatizar.
- `scripts/` son utilitarios de carga de datos de una sola vez (parseo e insert de carreras, descarga de assets de Teclab); no participan del build ni de `check`.
- `.claude/skills/` es una biblioteca local de skills para Claude Code: marca y patrones de diseño del CAU (`cau_brand`, `cau_design_patterns`), el procedimiento de carga de carreras (`cargar_carrera`), SEO, y guías generales de Next/React. Antes vivía en `shared_skills/` con un symlink al lado, que sólo funcionaba en Linux; ahora es un directorio real y carga en los dos sistemas.
- `docs/plans/` son planes de implementación históricos, no estado actual; además es donde escriben las skills `brainstorming` y `writing-plans`. `docs/resumen-proyecto.md` es un resumen para reutilizar patrones en otros proyectos — ante una contradicción, manda este archivo y el código.

### El material comercial: `carreras/`, `ventas/` y `herramientas/ventas/`

Nada de esto lo usa el sitio: es la base de conocimiento con la que se atiende a los leads (precios, corpus del bot de WhatsApp, fichas de carreras). Hasta el 08/08/2026 vivía todo junto en `herramientas/conocimiento-hermes/`, que era un repo git aparte metido adentro de este. Se disolvió y el contenido quedó repartido por tipo:

| Carpeta | Qué hay |
|---|---|
| `carreras/` | fichas `.md`, un JSON por carrera en `datos/`, material de Teclab en `teclab/` (PDFs y videos), y los JSON de manifiesto, alias y resoluciones |
| `ventas/` | **los `.bat` numerados del 1 al 7**, que son el menú de doble clic; precios vigentes y planillas en `precios/`, corpus del bot por institución en `corpus/`, tips de venta, y `buscador-carreras.html` y `entrenar-bot.html` (se generan) |
| `herramientas/ventas/` | los ~30 scripts `.mjs`, sus tests, `temp/` (archivos de trabajo descartables, antes `.hermes-temp/`) y `perfil-navegador/` (el perfil de Brave con las sesiones de CASA y Teclab) |

Los `.bat` viven con lo que producen y no con la lógica a propósito: se va a `ventas/` a abrir el buscador, así que el lanzador tiene que estar ahí. Cada uno hace `cd /d "%~dp0.."` para pararse en la raíz del proyecto y desde ahí llama a su `.mjs`.

Tres reglas para no romperlo:

- **Ningún script arma rutas a mano**: el mapa entero está en `herramientas/ventas/rutas.mjs` y todos importan de ahí. Si algo se muda, se toca ese archivo y nada más.
- **Las tres carpetas están gitignoradas y ancladas con `/`** (`/carreras/`, no `carreras/`). Sin la barra el patrón matchea a cualquier nivel y se comería `app/carreras/` y `components/carreras/`, que sí son código del sitio. Van gitignoradas porque el repo es público y ahí hay precios.
- **Ya no son un repo aparte, así que no viajan solas entre máquinas.** Son ~600 MB y hay que copiarlas a mano; `entorno.mjs` no las empaqueta. La historia git vieja quedó archivada en `~/Desktop/historico-repo-ventas.git`.

Ojo con `Teclab_Info/conocimiento-hermes/` en el Escritorio: es otra carpeta, de Teclab, y algunos scripts la leen. No tiene nada que ver con la que se disolvió.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
