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

- **`seo`** (`herramientas/seo-semanal.mjs`) baja Search Console firmando un JWT con la service account de `~/.gsc/service_account.json` (la misma del MCP `gsc`), así que no agrega ninguna dependencia. Deja `herramientas/vigilancia-logs/seo-ultimo.md` con páginas cuyo CTR está por debajo de lo esperable **para su posición y para su mezcla de intención**, consultas cerca de los primeros lugares con la página que las recibe, racimos de consultas genéricas fuera del top 10, caídas de posición y URLs del sitemap sin indexar.

**Separa consultas de marca de consultas genéricas, y eso cambia todo el informe.** Quien escribe "martillero publico siglo 21" quiere 21.edu.ar: nos ve quinto y nos saltea. Medido en agosto de 2026, la marca se lleva el 78% de las impresiones nombradas y clickea a un tercio de lo que predice la curva de CTR. Sin separarlas, el informe encabezaba cada semana con nueve páginas de marca (77% a 96% de sus consultas con "siglo 21" adentro) prometiendo ~190 clics inalcanzables, y tapaba las pocas genéricas con margen. Ahora los dos factores se **miden en cada corrida** contra la curva —no hay ningún número fijo en el código— y el CTR esperado de cada página se corrige por su propia mezcla. Ojo con la muestra: Search Console anonimiza la cola larga, así que las filas nombradas cubren ~27% de las impresiones y el share de marca que sale de ahí es un techo.

Acepta `--rapido` (saltea la inspección URL por URL), `--dias=` y `--sitio=`. La ventana termina tres días antes de hoy porque GSC consolida con atraso. **Las carreras fuera de la oferta quedan afuera del informe**: redirigen a la home y está bien, pero si no se filtran copan la lista — para saber cuáles son lee la oferta vigente de Supabase. Sale con código 1 sólo ante algo roto (página caída del índice, canónica cambiada por Google, caída fuerte de tráfico), no ante una sugerencia. El criterio de qué hacer con los números lo pone el agente `estratega-seo`, que lo lee cuando se lo invoca a mano.

### Vigilancia de producción: ya existe, son dos y no se duplican

**Antes de proponer cualquier monitoreo, alerta o "que avise si el sitio se cae", leer esto: está hecho.** Hay dos vigilantes, a propósito, y ninguno reemplaza al otro:

| | `app/api/vigilancia` (cron de Vercel) | `herramientas/vigilancia.mjs` (local) |
|---|---|---|
| Cuándo | cada 6 horas, declarado en `vercel.json` | cuando lo dispara el Programador de tareas |
| Dónde | en la nube, con la máquina apagada | en la máquina de casa |
| Qué mira | rutas, cabeceras, noindex, redirects y el sitemap entero | eso mismo vía `smoke`, más `deps`, `contenido` y `seo` |
| Cómo avisa | Telegram | archivo `REVISAR-SITIO.txt` en el escritorio + Telegram |

El de Vercel es el que cubre las caídas de verdad, porque no depende de que la PC esté prendida. Se autentica con `CRON_SECRET` y **con `?prueba=1` manda un aviso de prueba sin correr los chequeos**, que es la forma de confirmar que el canal de Telegram sigue vivo sin esperar a que algo se rompa. No mide el peso comprimido del HTML a propósito: eso necesita leer los bytes del socket sin descomprimir y `fetch` descomprime solo, así que ese chequeo vive únicamente en `smoke.mjs`.

El local avisa por Telegram **sólo en los cambios de estado** (`ok → problema` y `problema → ok`), no en cada corrida: un chequeo diario que falla una semana tiene que ser un mensaje, no siete. Su chequeo `smoke` lleva `avisaVercel: true` y queda fuera del aviso, porque el cron ya manda ese mensaje — sin eso, una caída llegaría dos veces. Necesita `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en `.env.local`; si faltan, el aviso queda sólo en el escritorio y el chequeo no se rompe.

Lo que se espera de producción lo declara **un solo archivo, `lib/vigilancia-esperado.ts`**, que leen los dos (`smoke.mjs` lo carga con Node pelado, que strippea los tipos). Rutas, cabeceras, HSTS, noindex y redirects se tocan ahí y nada más: duplicar esa lista deja a uno de los dos viejo sin que nadie se entere.

Los redirects llevan un tercer campo opcional con el **código exacto**, en vez de aceptar cualquier 3xx. Se usa donde el código lo decide algo que no vive en el repo. Hoy es el apex: `next.config.ts` lo declara con `permanent: true`, pero esa regla **no se ejecuta en producción** porque Vercel tiene su propio redirect a nivel de dominio que corre en el borde antes que la app. Venía con 307 de fábrica, así que el código decía 308 y producción servía 307 desde marzo sin que ningún diff lo mostrara; se corrigió el 25/08/2026 en el panel de Vercel y quedó fijado acá para que no vuelva a pasar en silencio. **Tocarlo en `next.config.ts` no cambia nada mientras el del dominio exista.**

Para los avisos de formulario (Telegram) está `herramientas/verificar-avisos.sql`: prueba los tres triggers de una sola pasada, con los pasos separados porque `pg_net` recién despacha el pedido cuando la transacción commitea.

También en `herramientas/`, sin script npm: `generar-og.mjs` produce por cada novedad dos derivados de 1200×630 desde las fotos de `public/` — la foto limpia (`public/imagenes/novedades/<slug>.jpg`, para `imagen_url`) y la versión con el título compuesto encima (`public/imagenes/og/<slug>.jpg`, para el og:image). Depende de `sharp` (declarado como devDependency).

`generar-favicon.mjs`, también sin script npm, rehace `public/favicon.ico` (16/32/48) y `public/icon.png` recortando el isologo del vector `public/imagenes/imagenes_cau/siglo21-marca.svg` — el panel del "21" es un cuadrado exacto de 268 unidades ahí adentro, y el favicon es ese cuadrado con los colores invertidos. **No copiar a mano el favicon de 21.edu.ar**: el que publican es un JPEG de 48×48 con el "1" cortado y no hay versión más grande (`?width=` de HubSpot no agranda, y no tienen `apple-touch-icon` ni manifest).

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
- La service role está marcada Sensitive en Vercel, así que **desde la máquina local no está la credencial que saltea todo**. Para editar contenido desde acá está el rol acotado `cau_editor` (ver *Escribir contenido desde local*, más abajo); lo que quede fuera de su alcance sigue yendo por el SQL Editor del dashboard.

### Invariante: los formularios públicos no escriben directo en la base

Todo lo que envía el público pasa por `POST /api/formularios`, que discrimina con el campo `kind`: `consulta` (inscripciones), `faq` (preguntas) o `clase` (turnos de apoyo). El orden real del handler:

1. Valida el sobre (`kind` conocido, `token` presente, `payload` es objeto) → 400.
2. En un `Promise.all`, verifica Turnstile **y** consulta el rate limit. Ojo: el rate limit corre siempre, así que un pedido que falla el captcha igual consume cuota.
3. Recién en `insertConsulta`/`insertFaq`/`insertClase` valida el payload en sí (regex de email y teléfono, formato de horario, cantidad de filas).

`tests/security.test.mjs` falla si algún componente fuera de `components/admin/` llama a `.from('consultas'|'faq_preguntas'|'solicitudes_clase').insert`. No es un test decorativo: es la regla que sostiene el modelo de seguridad.

### Un solo lugar declara los campos: `components/formularios/casas.ts`

El sitio tiene **dos formularios por casa** —contacto y preinscripción— y un único componente que los pinta, `components/formularios/formulario-lead.tsx`. Lo que cambia entre uno y otro no está en el componente sino en `casas.ts`, que declara tres cosas:

- **`CAMPOS`**: los campos que existen y, al lado de cada uno, **la columna de `consultas` donde se guarda**. Ahí está el punto: `insertConsulta` arma la fila con `columnaDe()` y no tiene ni un nombre de columna escrito a mano. El 23/08/2026 el endpoint apuntó a nueve columnas inexistentes y, como PostgREST rechaza la fila entera cuando una no existe (PGRST204), **dejaron de entrar todas las consultas del sitio** —home, `/contacto` y los dos de `/teclab`— porque los tres mandan `kind: 'consulta'`. Un test de `security.test.mjs` falla si vuelve a aparecer un literal de columna en el endpoint.
- **`CASAS`**: qué pide cada casa (`siglo21`, `teclab`, `identidad`) en cada modo, y cuáles bloquean el envío. Los obligatorios bloquean **sólo en preinscripción**: un legajo a medias no sirve, una consulta que rebota es un lead perdido. Ojo con las diferencias reales — Siglo 21 pide tipo de documento, tipo de domicilio, torre y barrio, y **no** pide nivel de estudios, colegio ni medio de pago, que son de Teclab.
- **`armarPayload()`**: qué viaja. Los campos que la casa no pide siguen en el estado del componente —si el lead vuelve a esa carrera los encuentra como los dejó— pero no se mandan.

En la home la casa **la define la carrera elegida** y el formulario cambia solo; en `/teclab` va fija por props. `casa` y `tipo_formulario` se guardan en la fila, y con eso el aviso de Telegram encabeza "PREINSCRIPCIÓN — Teclab" o "Consulta — Siglo 21".

Va todo en un archivo a propósito: Node strippea los tipos y corre los `.ts` en los tests, pero **no resuelve imports de valor entre `.ts` sin extensión**, y el `tsconfig` usa `moduleResolution: bundler` sin `allowImportingTsExtensions`. Separarlo deja la lógica sin poder testearse.

Antes de agregar un campo, **verificar que la columna exista de verdad**: desde local se puede con la anon key, `GET /rest/v1/consultas?select=<columna>&limit=1` — un `42703` en la respuesta es la columna que falta. Y después, mandar una consulta real: el incidente pasó porque el `INSERT` nunca se ejecutó contra la tabla.

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

Es una prioridad activa del proyecto, no un detalle; `docs/indexacion.md` lleva el seguimiento de la campaña de indexación. La medición semanal la hace sola `npm run seo` (ver arriba) y el agente `estratega-seo` la interpreta.

- `app/sitemap.ts` genera todo: home, carreras visibles, materias, páginas de novedades y artículos.
- JSON-LD: `EducationalOrganization` + `LocalBusiness` con `areaServed` en `app/layout.tsx`; `Course` + `BreadcrumbList` en la página de carrera.
- Los `<title>` de carrera eligen el sufijo más largo que entre en 62 caracteres y usan `title: { absolute }` para que el template del layout no duplique la marca.
- Las fichas se enlazan entre sí: 6 del mismo nivel más 2 de otro nivel. Las tres primeras del nivel y la primera cruzada salen del **área** de la carrera (`getAreaForCarrera()`), y el resto de una rotación por `id`. Es determinístico a propósito, para no romper el cache de ISR. El área adelante porque Procurador enlazaba a videojuegos, redes y programación: ocho enlaces y ninguno de derecho, que no le dice nada a Google sobre el tema de la página. Con el cambio, los enlaces dentro de la misma área pasaron de 17% a 41%. **Antes de tocar ese criterio hay que simular el grafo y contar enlaces entrantes por ficha**: al meter el área, el paso de la rotación cruzada quedó en 2 recorriendo un solo lugar, o sea sólo índices pares, y dejó al curso de Teclab —único de su nivel, así que sólo puede recibir cruzadas— en cero enlaces entrantes. Con paso 1 vuelve a recorrer todo: mínimo 2, máximo 12, ninguna en cero.
- `next.config.ts` concentra los redirects (apex → `www`, `/carrera/:slug` → `/carreras/:slug`, `/contactos` → `/contacto`, `/carreras` → home).

### Rendimiento y seguridad de la entrega

`next.config.ts` define la CSP completa y las cabeceras de seguridad. Si se agrega un servicio externo (script, fuente, iframe, fetch), hay que sumar su origen a la directiva correspondiente o el navegador lo bloquea.

`experimental.inlineCss: true` está activo a propósito: mete el CSS en el HTML para sacar dos `<link>` de la ruta crítica (~450 ms en móvil según PSI). Ya se midió A/B — apagarlo da peor resultado, aunque el HTML pese más. Requiere el `'unsafe-inline'` que la CSP ya permite.

El CSS es por página: `app/globals.css` y `app/navbar.css` en el layout, y cada página importa el suyo (`app/index.css`, `app/faq/faq.css`, etc.).

### Variables de entorno

Lo que usa Next en producción (plantilla en `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_EXPECTED_HOSTNAME` y `NEXT_PUBLIC_GA_ID`, más `REVALIDATE_SECRET` (`/api/revalidar`) y `CRON_SECRET` (`/api/vigilancia`). `WEBHOOK_SECRET` es la única que consumen sólo las Edge Functions; `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` las usan **las dos partes** — las Edge Functions `notificar`, `alerta-firewall` y `digest-clicks`, y también `/api/vigilancia`, que es Next.

El `.env.local` de esta máquina tiene sólo `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_GA_ID`. Alcanza para levantar el sitio y leer de la base, pero **cualquier POST a `/api/formularios` devuelve 503 en local** porque falta la service role, y `vercel env pull` no la trae (está marcada Sensitive). Para probar formularios de punta a punta hay que pegarla a mano desde el gestor de contraseñas.

## Base de datos

Tablas de contenido y formularios: `carreras`, `materias`, `solicitudes_clase`, `consultas`, `faq_preguntas`, `novedades`, `profesores`.

`clases_apoyo` **no existe**: `sql/setup_completo.sql` la crea en el papel y le pone una policy, pero en la base no está y ningún componente la lee — la agenda de clases de apoyo sale toda de `materias`. Verificado el 28/08/2026.

Tablas de infraestructura, sin acceso desde `anon` ni `authenticated` (sólo service role, vía RPC): `form_rate_limits` (respalda `check_form_rate_limit`) y `career_clicks` (respalda `registrar_click_carrera` y el digest diario).

### Escribir contenido desde local: el rol `cau_editor`

`npm run db "<sql>"` (o `npm run db -- --archivo x.sql`) corre SQL contra la base con un rol de Postgres acotado, definido en `sql/2026-08-28_rol_editor_contenido.sql`. Es lo que evita copiar cada `UPDATE` al SQL Editor.

No es la service role con buenos modales: es un rol distinto, con su propia contraseña, que **sólo tiene privilegios sobre las tablas de contenido**.

| Tabla | Qué puede |
|---|---|
| `carreras`, `novedades`, `materias` | `SELECT`, `INSERT`, `UPDATE` |
| `faq_preguntas` | `SELECT`/`UPDATE` **por columna**, sin `contacto` ni `nombre_contacto` |
| `consultas` | `SELECT`, `DELETE` — **no** `INSERT`/`UPDATE` (`sql/2026-08-28_editor_consultas.sql`) |
| `solicitudes_clase`, `profesores`, `form_rate_limits`, `career_clicks` | nada |

`DELETE` no está en ninguna de las de contenido: una carrera sale de la oferta cambiando `nivel`/`activa`, una novedad se despublica. Sobre `consultas` es al revés — lee y borra, pero no escribe: se agregó el 28/08/2026 para poder limpiar la fila que deja probar el formulario contra producción, y las consultas siguen entrando sólo por `/api/formularios`. Contra el resto de las tablas de formularios la respuesta es `permission denied for table solicitudes_clase`, y eso es el rol funcionando, no un bug — esa consulta va al dashboard.

Se conecta por Postgres directo con `EDITOR_DATABASE_URL` (`postgresql://cau_editor:<clave>@db.<ref>.supabase.co:5432/postgres`), no por PostgREST: no hay que tocar el JWT ni el `authenticator`. Se descartó firmar un JWT con el secreto del proyecto justamente porque ese secreto también emite tokens `service_role` — habría sido una credencial más poderosa que la que se quería evitar.

**Ese host se publica sólo por IPv6**, y la máquina de Windows lo alcanza. Si la de Linux no tiene IPv6, ahí hay que pasar al pooler: mismo string con el host `aws-<n>-<región>.pooler.supabase.com`, puerto 6543 y el usuario `cau_editor.<ref>` (el sufijo del proyecto es obligatorio en el pooler).

El certificado del servidor lo firma la PKI propia de Supabase (`Supabase Root 2021 CA`), que no está en el almacén de Node: verificar la cadena falla con `SELF_SIGNED_CERT_IN_CHAIN`. `db.mjs` pincha ese root si encuentra `herramientas/supabase-ca.crt` (se baja del dashboard, *Connect → SSL certificate*) y, si no está, avisa y sigue sin verificar — la contraseña viaja cifrada igual, pero sin protección contra alguien en el medio.

`herramientas/db.mjs` **frena los `UPDATE` y `DELETE` sin `WHERE`** antes de mandarlos (`--sin-red` los deja pasar). El rol cubre escribir en la tabla equivocada; esto cubre escribir en la correcta sin acotar la fila.

Los permisos concedidos se verifican con la consulta del final del archivo SQL: si ahí aparece una tabla de formularios, se concedió de más.

Los archivos de `sql/` **no son migraciones automáticas** — se corren a mano en el SQL Editor de Supabase, en orden de fecha. `sql/instrucciones.md` documenta el setup inicial de clases de apoyo. Hay jobs de `pg_cron` (limpieza de clases pasadas, digest diario de clicks) que se programan desde ahí.

## Convenciones

- Alias `@/*` → raíz del proyecto.
- El contenido HTML que viene de la base (novedades) pasa siempre por `lib/sanitize-content.ts` antes de renderizarse.
- Colores en `app/globals.css` `:root` — fondo `--color-deep-dark-bg: #013729`, acento `--color-highlight: #00c7b1`, tarjetas `--color-card-bg: #1c2f31`, dorado `--color-gold: #e69b05`, marca `--cau-brand-blue: #005587` / `--cau-brand-green: #058c70`.
- `docs/textos-whatsapp.md` son las respuestas institucionales para copiar y pegar al atender un lead a mano. **No las usa el bot**, que contesta desde `ventas/corpus/`. No llevan precios ni fechas a propósito.
- `PENDIENTES.md` es el backlog vivo, con las verificaciones manuales que no se pueden automatizar.
- `docs/criterios.md` son las decisiones ya tomadas (no volver a proponerlas) y las preferencias de trabajo del usuario. Lo leen Claude Code y Codex por igual: lo que está ahí no va en la memoria de ninguno de los dos, porque la memoria no cruza de herramienta ni de máquina.
- `scripts/` son utilitarios de carga de datos de una sola vez (parseo e insert de carreras, descarga de assets de Teclab); no participan del build ni de `check`.
- `.claude/skills/` es una biblioteca local de skills para Claude Code: marca y patrones de diseño del CAU (`cau_brand`, `cau_design_patterns`), el procedimiento de carga de carreras (`cargar_carrera`), SEO, y guías generales de Next/React. Antes vivía en `shared_skills/` con un symlink al lado, que sólo funcionaba en Linux; ahora es un directorio real y carga en los dos sistemas.
- `docs/plans/` son planes de implementación históricos, no estado actual; además es donde escriben las skills `brainstorming` y `writing-plans`. `docs/resumen-proyecto.md` es un resumen para reutilizar patrones en otros proyectos — ante una contradicción, manda este archivo y el código.

### El material comercial: `carreras/`, `ventas/` y `herramientas/ventas/`

Nada de esto lo usa el sitio: es la base de conocimiento con la que se atiende a los leads (precios, corpus del bot de WhatsApp, fichas de carreras). Hasta el 08/08/2026 vivía todo junto en `herramientas/conocimiento-hermes/`, que era un repo git aparte metido adentro de este. Se disolvió y el contenido quedó repartido por tipo:

| Carpeta | Qué hay |
|---|---|
| `carreras/` | **una carpeta por casa**: `siglo21/` (fichas `.md`, un JSON por carrera en `datos/`, y los JSON de manifiesto, alias, planes y resoluciones), `teclab/` (PDFs y videos por carrera, planes, contenidos y calendario) e `identidad/` |
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
