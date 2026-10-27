# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sitio de **Universidad Siglo 21 — CAU Villa Lugano**, un centro de aprendizaje a distancia. Publica la oferta académica (Siglo 21, Teclab e Identidad Argentina), capta inscripciones y gestiona las clases de apoyo. Producción: `https://www.siglo21sur.com`, servida desde el 27/10/2026 por el Worker de Cloudflare `cau-produccion-20261026`: Astro con islas de React sobre D1, código en `cloudflare/`.

La app Next.js 16 (App Router) + Supabase de `app/`, `components/` y `lib/` es **la versión anterior**: sigue en el repo y es lo que revisa `npm run check`, pero ya no sirve producción y su base se dio de baja. Para el sitio publicado, la referencia es [`cloudflare/LEER.md`](cloudflare/LEER.md); el corte y su rollback están en [`cloudflare/CORTE.md`](cloudflare/CORTE.md); lo que falta antes de dar de baja Vercel, en [`cloudflare/PRODUCCION-PREPARACION.md`](cloudflare/PRODUCCION-PREPARACION.md).

Todo el texto de interfaz, los comentarios de código y la documentación están en español (es-AR).

En mensajes comerciales no usar nunca el emoji de bolsa de dinero (💰): puede dar la impresión de que queremos quedarnos con la plata del lead. Para aranceles usar un encabezado neutro, por ejemplo `Arancel vigente:`.

**[`docs/criterios.md`](docs/criterios.md) se lee antes de proponer nada**: las decisiones ya tomadas que no hay que volver a proponer y cómo espera el usuario que se trabaje.

## Comandos

```bash
npm run dev          # servidor de desarrollo de la app Next (no es el sitio publicado)
npm run build        # build de la app Next
npm start            # servir ese build

npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # node --test tests/*.test.mjs
npm run check        # lint + typecheck + test — correr esto antes de commitear
```

Un test suelto: `node --test tests/security.test.mjs`. Un caso puntual: `node --test --test-name-pattern "JSON-LD" tests/security.test.mjs`.

El sitio publicado es otro paquete y tiene su propio control; el `check` de la raíz **no lo mira**:

```bash
cd cloudflare
npm run dev      # Astro + workerd en local
npm run build    # build del Worker
npm run check    # control completo del paquete: tipos, datos, API, crons, navegador, build…
npm run publicar # plan del deploy, sin publicar (ver «Deploy»)
```

GitHub Actions (`.github/workflows/verificar.yml`) corre en cada push a `main` el control de secretos, `npm run check` y `npm audit --omit=dev`, más un trabajo corto que verifica el contrato de `cloudflare/produccion/wrangler.json` contra el código.

### Verificaciones que no cubre `npm run check`

`check` sólo mira el código. Lo que mira los datos y el sitio publicado vive en `herramientas/`, con un `.sh` de doble clic al lado de cada `.mjs` (la lógica se toca en el `.mjs`; el envoltorio no tiene lógica propia, y nada de esa carpeta entra al bundle): `npm run auditar` (contenido faltante en la base D1 de producción), `npm run smoke` (producción: rutas, cabeceras, redirects, sitemap y peso del HTML), `npm run capturas`, `npm run seo` (informe de Search Console) y `npm run leads` (de dónde vienen los leads: clics a WhatsApp, consultas y tráfico de Google, con el embudo). Las tres primeras salen con código 1 si encuentran algo.

`npm run calidad` es la auditoría ampliada: corre todos los controles (código, dependencias, contenido, Search Console, producción, SEO de cada URL del sitemap, integraciones y navegador) aunque uno falle, y tiene comandos por área (`calidad:web`, `calidad:seo`, `calidad:integraciones`). Un código 2 es que faltó una fuente, nunca un aprobado. Detalle en [`docs/controles-automaticos.md`](docs/controles-automaticos.md); el agente `auditor-web` interpreta la corrida.

Las pruebas de integración de la app anterior se retiraron junto con el arnés local de Supabase: el sitio publicado no usa Supabase y `npm run check` no necesita nada de eso.

**La vigilancia de producción ya existe, son dos y no se duplican**: el cron del Worker cada 6 horas (`0 */6`, `cloudflare/src/api/vigilancia.ts`, avisa por Telegram con la máquina apagada) y `herramientas/vigilancia.mjs` en la máquina de casa, disparado por cron. **Antes de proponer cualquier monitoreo o alerta, está hecho.** Lo que se espera de producción lo declara **un solo archivo, `lib/vigilancia-esperado.ts`**, que leen los dos: rutas, cabeceras, HSTS, noindex y redirects se tocan ahí y nada más.

**El detalle de cada script, las banderas que aceptan, los dos vigilantes y los generadores (`og:teclab`, y sin script npm `generar-og`, `generar-secretos`, `generar-favicon`) están en `docs/herramientas.md`.** Leerlo antes de correr o tocar cualquiera de ellos.

### Deploy

**Push a `main` ya no publica el sitio.** Versiona y dispara CI, pero producción es el Worker de Cloudflare y el dominio no apunta a Vercel. Se publica con un solo publicador, desde dos lugares:

- **CI, lo recomendado**: el workflow `Publicar el Worker` (`.github/workflows/publicar.yml`), disparado a mano desde Actions. Pide `ensayo` (por defecto) o `produccion`, se niega a correr fuera de `main` y usa el secreto de repositorio `CLOUDFLARE_API_TOKEN`. Así no hay credencial de producción en ninguna máquina y queda registrado quién publicó y con qué commit.
- **Local**, desde `cloudflare/`:

```bash
npm run publicar             # plan: no compila, no autentica, no toca nada
npm run publicar:ensayo      # build + wrangler deploy --dry-run (no publica)
npm run publicar:produccion  # build + deploy + smoke contra el dominio
```

La configuración es [`cloudflare/produccion/wrangler.json`](cloudflare/produccion/wrangler.json): dominios propios, base D1, colas, los cinco crons y las variables públicas. Los seis secretos viven en Cloudflare y un deploy no los pisa; las migraciones de D1 se aplican aparte. La credencial es un token acotado (`Workers Scripts:Edit`, `Workers Routes:Edit` y `Zone:Read` de la zona, `Queues:Edit` y `D1:Edit` sólo para migrar) guardado en `.env.local` o en el entorno: al proceso de wrangler viaja **sólo** esa variable, nunca el resto de `.env.local`. `wrangler login` es la alternativa, con el OAuth en texto plano en el perfil. El publicador revisa la configuración contra el código (`cloudflare/scripts/publicar.mjs`, con pruebas en `cloudflare/tests/publicacion.test.mjs`) y se niega a publicar si no cierra. Antes de un cambio grande, leer [`cloudflare/CORTE.md`](cloudflare/CORTE.md): orden, verificación y rollback. Se trabaja directo sobre `main`, sin ramas ni PRs. Commitear **sólo los archivos propios** (nada de `git add -A`: se editan cosas en paralelo).

`herramientas/5 - Subir cambios (deploy).sh` es el flujo guiado (muestra el diff, pide descripción, corre `npm run check` y recién ahí commitea y pushea). Antes del diff, del commit y del push revisa con Gitleaks que no viajen secretos ni archivos privados; se prepara una vez por máquina con `npm run secretos:instalar` y se revisa a mano con `npm run secretos`. Alcance y excepciones en [`docs/publicacion-sin-secretos.md`](docs/publicacion-sin-secretos.md).

Antes de un push manual, vaciar `GH_TOKEN` y `GITHUB_TOKEN` si están seteados: valores viejos hacen fallar el push con un error que no explica nada.

### Una sola máquina: Linux

Desde el 19/10/2026 el proyecto se trabaja sólo desde Linux. Los `.bat` que quedan en `herramientas/` son históricos; no hace falta mantener la paridad con Windows.

- **Nada de rutas absolutas** en archivos versionados: el repo es público.
- **`node herramientas/entorno.mjs exportar|importar`** respalda lo que no viaja por git: `.env.local`, la memoria de Claude Code, la credencial de Search Console, `.agents/` y `notas-locales/`. El procedimiento está en `herramientas/LEER.md`.

## Arquitectura

**De acá al final, salvo que se diga lo contrario, se describe la app Next de `app/`, que ya no sirve producción.** El sitio publicado es `cloudflare/` (Astro + islas de React, datos en D1, entrega por el Worker): su mapa está en [`cloudflare/LEER.md`](cloudflare/LEER.md).

### Next.js 16 + App Router

Las páginas son Server Components que leen de Supabase en el render. La home y las de Teclab (`/teclab`, `/teclab/inscripcion`, `/teclab/test-vocacional`) usan `revalidate = 3600`; `/carreras/[slug]`, `/carreras/[slug]/inscripcion`, `/novedades/[page]` y los artículos usan 86400 para no gastar ISR Writes; `/faq`, `/clases-apoyo/[materia]` e `/imagenes` no declaran ninguno, así que son estáticos puros. `/sitemap.xml` usa `dynamic = 'force-dynamic'` y se genera en cada pedido para reflejar altas, bajas y fechas sin depender de ISR; `/inscripcion/[codigo]` (enlace personalizado de inscripción) también es dinámica. Esos números son la red de abajo, no el mecanismo: lo que publica de verdad es la revalidación on-demand (ver más abajo). `/clases-apoyo` **también es estática**: mostraba un calendario relativo a hoy y por eso usaba `dynamic = 'force-dynamic'`, pero dejó de mostrarlo y el flag se sacó. La revalida el trigger de `materias`.

**Esta no es la versión de Next que conocés**: ante cualquier duda de API o convención, leer la guía en `node_modules/next/dist/docs/` antes de escribir código (ver el bloque del final).

### Los clientes de Supabase

Los dos clientes usan `Database`, generado del esquema remoto
en `lib/database.types.ts`. Regenerar con `npm run db:tipos` tras cambios de
esquema, revisar el diff y correr `check`. Los tipos no validan JSON ni sustituyen
RLS. [Procedimiento y alcance](docs/tipos-supabase.md).

Elegir mal el cliente es el error más fácil de cometer:

| Módulo | Credencial | Para qué |
|---|---|---|
| `lib/supabase.ts` | anon, sin sesión | lecturas públicas desde Server Components (carreras, materias, novedades, FAQ) |
| `lib/supabase-admin.ts` | **service role** | escrituras del público y de las APIs. Tiene `import 'server-only'`; nunca puede entrar al bundle del cliente |

Qué puede escribir cada rol (definido en `sql/2026-07-20_seguridad_*.sql`):

- **`anon`** (visitante sin sesión) es de sólo lectura. `INSERT` sobre `consultas`, `faq_preguntas` y `solicitudes_clase` está revocado tanto para `anon` como para `authenticated`; por eso los formularios públicos van sí o sí por la service role.
- **`authenticated`** (profesor logueado y aprobado) **sí escribe** con la misma anon key: `UPDATE` sobre `materias` (policy `materias_approved_update`) e `INSERT` de su propia fila en `profesores` (`profesores_register_pending`). Hoy no hay panel que lo consuma, pero las policies y la tabla siguen en la base.
- La service role está marcada Sensitive en Vercel, así que **desde la máquina local no está la credencial que saltea todo**. Para editar contenido desde acá está el rol acotado `cau_editor` (ver *Escribir contenido desde local*, más abajo); lo que quede fuera de su alcance sigue yendo por el SQL Editor del dashboard.

### Invariante: los formularios públicos no escriben directo en la base

Todo lo que envía el público pasa por `POST /api/formularios`, que discrimina con el campo `kind`: `consulta` (inscripciones), `faq` (preguntas) o `clase` (turnos de apoyo). El orden real del handler:

1. Valida el sobre (`kind` conocido, `token` presente, `payload` es objeto) → 400.
2. En un `Promise.all`, verifica Turnstile **y** consulta el rate limit. Ojo: el rate limit corre siempre, así que un pedido que falla el captcha igual consume cuota.
3. Recién en `insertConsulta`/`insertFaq`/`insertClase` valida el payload en sí (regex de email y teléfono, formato de horario, cantidad de filas).

`tests/security.test.mjs` falla si algún componente llama a `.from('consultas'|'faq_preguntas'|'solicitudes_clase').insert`, si quedan rutas u helpers del panel de administración, si vuelve el módulo de alumnos, si el JSON-LD deja de escapar contenido de la base o si el endpoint de formularios vuelve a escribir nombres de columna a mano. No es un test decorativo: es la regla que sostiene el modelo de seguridad.

### Un solo lugar declara los campos: `components/formularios/casas.ts`

El sitio tiene dos formularios por casa (contacto y preinscripción) y un único componente que los pinta. Lo que cambia entre uno y otro no está en el componente sino en `casas.ts`, que declara los campos con **la columna de `consultas` donde se guarda cada uno** y qué pide cada casa (`siglo21`, `teclab`, `identidad`): `insertConsulta` arma la fila con `columnaDe()` y no tiene ni un nombre de columna escrito a mano. El 23/08/2026 el endpoint apuntó a nueve columnas inexistentes y **dejaron de entrar todas las consultas del sitio**, porque PostgREST rechaza la fila entera cuando una no existe (PGRST204). Un test de `security.test.mjs` falla si vuelve a aparecer un literal de columna en el endpoint.

**Antes de agregar o mover un campo, leer `docs/formularios-por-casa.md`**: qué pide cada casa, cuáles bloquean el envío, cómo viaja el payload y cómo verificar que la columna exista de verdad (`GET /rest/v1/consultas?select=<columna>&limit=1` con la anon key; un `42703` es la columna que falta) antes de mandar una consulta real.

### Avisos de formulario: fallan en silencio

Hay **tres** triggers de Postgres, uno por tabla de formulario, y todos llaman a la misma función `notify_edge_function()`, que vía `net.http_post` invoca la Edge Function `supabase/functions/notificar/` (Telegram, único canal desde el 01/08/2026):

| Tabla | Trigger |
|---|---|
| `consultas` | `on_consulta_insert` |
| `solicitudes_clase` | `on_solicitud_clase_insert` |
| `faq_preguntas` | `on_faq_pregunta_insert` |

**Ya existen y funcionan: no crear triggers nuevos**, duplicarlos duplica los avisos (`sql/2026-07-27_webhook_notificar.sql` lo advierte en mayúsculas).

Como `net.http_post` encola sin bloquear, **el `INSERT` responde 201 aunque la notificación se caiga**. Pasó del 20 al 27/07/2026: se le agregó validación de secreto a la función y el trigger nunca se actualizó.

Cada vez que se toque `WEBHOOK_SECRET`, la función `notificar` o el trigger, hay que verificar a mano — el procedimiento SQL está en [las notas operativas](docs/notas-operativas.md) y en `sql/2026-08-28_rotar_secretos.sql`. Un `401` en `net._http_response` significa que los secretos no coinciden. **Verificar ahí y no por lo que responde el formulario**, que da 201 igual.

**El secreto ya no vive en el cuerpo del trigger sino en el Vault** (`sql/2026-08-28_secretos_al_vault.sql`, 28/08/2026): las dos funciones lo leen de `vault.decrypted_secrets` y por eso las dos son `SECURITY DEFINER`. `WEBHOOK_SECRET` lo validan **dos** Edge Functions, `notificar` y `digest-clicks`; rotarlo obliga a probar las dos. `alerta-firewall` no entra: usa `VERCEL_WEBHOOK_SECRET`, que es otro secreto.

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

Se autentica con `REVALIDATE_SECRET` (Vercel), que tiene que coincidir con el que guarda el Vault de Supabase — hasta el 28/08/2026 estaba escrito como literal en el cuerpo del trigger, que es donde cualquier rol con conexión podía leerlo. Igual que con los avisos, `net.http_post` encola: si esto falla el `UPDATE` responde ok lo mismo y la página queda vieja. Se diagnostica en `net._http_response` — 401 secretos distintos, 503 falta la variable en Vercel, 400 tabla sin mapear.

### Taxonomía de carreras

`components/index/types.ts` es la fuente de verdad y la usan la home, `/carreras/[slug]` y `sitemap.ts` por igual:

- **`esCarreraVisible()`** filtra los niveles fuera de la oferta (Posgrado, APLV-Extragrado, Certificación y los cursos históricos de Siglo 21; de los cursos sólo se publica `Teclab - Curso`). Las filas siguen en Supabase; simplemente no tienen categoría, así que no se listan, no se pueden elegir en el formulario y no tienen página. **Aplicar este filtro en cualquier lectura nueva de `carreras`**, o se publican páginas de carreras que no se dictan.
- `getCategoryForCarrera()` mapea `nivel` → las 5 categorías del catálogo (licenciaturas, tecnicaturas, Identidad Argentina, Teclab Tecnología, Teclab Gestión).
- `getAreaForCarrera()` y `getDurationGroup()` alimentan los filtros, por palabras clave sobre el nombre.
- `carreraToSlug()` arma la URL desde `prefix + nombre` (`carreraFullName()`), sin acentos. La página compara el slug pedido contra el canónico y hace `permanentRedirect` si difiere, así las URLs viejas con guión bajo no duplican contenido.

### Modales de carrera

`careers-catalog.tsx` abre siempre `career-info-modal.tsx`, que es sólo un despachador con imports dinámicos:

1. `nivel === 'Identidad Argentina'` → `ia-modal.tsx` (marca del convenio, azul `#0090C1` / amarillo `#F1CF1C`)
2. `esTeclab(carrera)` o `esCursoTeclab(carrera)` → `teclab-modal.tsx` (cian `#2ee7d7` en Tecnología, violeta `#8e2cf2` en Gestión)
3. tiene `slides` → `carousel-modal.tsx`
4. si no → `career-modal.tsx`

Las carreras sin slides *y* fuera de convenio caen en `career-modal.tsx`, que arma la ficha con los campos sueltos. Detectarlas es tarea de `npm run auditar`: hasta el 01/08/2026 lo hacía además un aviso por clic (`/api/notificar-carrera`), que se eliminó por redundante.

`components/carreras/career-content.ts` tiene los helpers puros que comparten el modal (cliente) y la página `/carreras/[slug]` (servidor) — por eso viven fuera de todo componente `'use client'`.

### SEO

Es una prioridad activa del proyecto, no un detalle; `docs/indexacion.md` lleva el seguimiento de la campaña de indexación. La medición semanal la hace sola `npm run seo` (ver arriba) y el agente `estratega-seo` la interpreta.

- `app/sitemap.ts` genera todo: home, carreras visibles, materias, páginas de novedades y artículos, las de Teclab y las páginas fijas. Las `/carreras/<slug>/inscripcion` no van: llevan `noindex` desde el 20/10/2026.
- JSON-LD: `EducationalOrganization` + `LocalBusiness` con `areaServed` en `app/layout.tsx`; `Course` + `BreadcrumbList` en la página de carrera.
- Los `<title>` de carrera eligen el sufijo más largo que entre en 61 caracteres y usan `title: { absolute }` para que el template del layout no duplique la marca. El presupuesto se prueba primero con el nombre completo y recién después con `nombre_corto`, o sea que **primero se suelta "a Distancia" y después el prefijo académico**. Es a propósito y está medido (02/09/2026, 90 días): las consultas que dicen "tecnicatura" o "licenciatura" traen 25 de los 99 clics y las que dicen "a distancia" traen 6. Dar vuelta ese orden ya se simuló y deja 83 de 88 fichas sin el nombre largo — no rehacerlo.
- Las fichas se enlazan entre sí: 6 del mismo nivel más 2 de otro nivel. Las tres primeras del nivel y la primera cruzada salen del **área** de la carrera (`getAreaForCarrera()`), y el resto de una rotación por `id`. Es determinístico a propósito, para no romper el cache de ISR. El área adelante porque Procurador enlazaba a videojuegos, redes y programación: ocho enlaces y ninguno de derecho, que no le dice nada a Google sobre el tema de la página. Con el cambio, los enlaces dentro de la misma área pasaron de 17% a 41%. **Antes de tocar ese criterio hay que simular el grafo y contar enlaces entrantes por ficha**: al meter el área, el paso de la rotación cruzada quedó en 2 recorriendo un solo lugar, o sea sólo índices pares, y dejó al curso de Teclab —único de su nivel, así que sólo puede recibir cruzadas— en cero enlaces entrantes. Con paso 1 vuelve a recorrer todo: mínimo 2, máximo 12, ninguna en cero.
- `next.config.ts` concentra los redirects (apex → `www`, `/index.html` → `/`, `/carrera/:slug` → `/carreras/:slug`, `/contactos` → `/contacto`, `/novedades` → `/novedades/1`, `/carreras` → home, y las fichas renombradas o dadas de baja).

### Rendimiento y seguridad de la entrega

`next.config.ts` define la CSP completa y las cabeceras de seguridad. Si se agrega un servicio externo (script, fuente, iframe, fetch), hay que sumar su origen a la directiva correspondiente o el navegador lo bloquea.

`experimental.inlineCss: true` está activo a propósito: mete el CSS en el HTML para sacar dos `<link>` de la ruta crítica (~450 ms en móvil según PSI). Ya se midió A/B — apagarlo da peor resultado, aunque el HTML pese más. Requiere el `'unsafe-inline'` que la CSP ya permite.

El CSS es por página: `app/globals.css` y `app/navbar.css` en el layout, y cada página importa el suyo (`app/index.css`, `app/faq/faq.css`, etc.).

### Variables de entorno

La plantilla completa está en `.env.example` y el reparto de cuál usa Next, cuál las Edge Functions y cuál las herramientas, en `docs/variables-de-entorno.md`.

Lo que hay que tener presente siempre: **el `.env.local` de esta máquina no tiene `SUPABASE_SERVICE_ROLE_KEY`** (está marcada Sensitive y `vercel env pull` no la trae). Alcanza para levantar el sitio y leer de la base, pero **un POST válido a `/api/formularios` devuelve 503 en local** (un sobre inválido devuelve 400 antes de consultar la base). Para recorrer los formularios en local sin escribir está el modo demo (`NEXT_PUBLIC_FORMULARIOS_DEMO=1`, sólo con `next dev`, ver `lib/formularios-demo.ts`): valida igual, saltea el captcha y no guarda nada. Para probar de punta a punta hay que pegar la clave a mano desde el gestor de contraseñas.

## Base de datos

**La base del sitio publicado es D1**, no Supabase: se consulta con `npm run db:d1` (lectura; escritura con `--escribir`) y su esquema está en `cloudflare/migrations/`. Lo que sigue describe el esquema de la app anterior, que se dio de baja; se conserva como referencia del modelo.

Tablas de contenido y formularios: `carreras`, `materias`, `solicitudes_clase`, `consultas`, `faq_preguntas`, `novedades`, `profesores`.

Tablas de precios, inscripción y newsletter: `precios_carreras`, `precios_meta`, `precios_privados`, `descuentos`, `enlaces_inscripcion`, `robot_autoinscripciones`, `suscripciones_newsletter`, `reservas_mail_precio` ([límite de mails de «Ver precio»](docs/limite-mails-precio.md)) y `plantillas_mensajes`. La lista al día es la de `lib/database.types.ts`.

`clases_apoyo` **no existe**: `sql/setup_completo.sql` la crea en el papel y le pone una policy, pero en la base no está y ningún componente la lee — la agenda de clases de apoyo sale toda de `materias`. Verificado el 28/08/2026.

Tablas de infraestructura, sin acceso desde `anon` ni `authenticated` (sólo service role, vía RPC): `form_rate_limits` (respalda `check_form_rate_limit`) y `career_clicks` (respalda `registrar_click_carrera` y el digest diario).

No hay backups programados ni PITR (plan Free); el estado de la recuperación está en [`docs/recuperacion-supabase.md`](docs/recuperacion-supabase.md).

### Escribir contenido desde local: el rol `cau_editor`

`npm run db "<sql>"` (o `npm run db -- --archivo x.sql`) corre SQL contra la base con un rol de Postgres acotado: escribe en las tablas de contenido (`carreras`, `novedades`, `materias`, y `faq_preguntas` por columna) y en `precios_privados`, y sobre `consultas` sólo lee y borra. Contra el resto de las tablas de formularios responde `permission denied`, y eso es el rol funcionando: esa consulta va al SQL Editor del dashboard. `herramientas/db.mjs` además frena los `UPDATE` y `DELETE` sin `WHERE`.

**El alcance tabla por tabla, la cadena de conexión, el certificado de Supabase y qué hacer si la máquina no tiene IPv6 están en `docs/rol-editor.md`.**

Los archivos de `sql/` **no son migraciones automáticas** — se corren a mano en el SQL Editor de Supabase, en orden de fecha. Hay jobs de `pg_cron` (limpieza de clases pasadas, digest diario de clicks) que se programan desde ahí.

## Convenciones

- Alias `@/*` → raíz del proyecto.
- El contenido HTML que viene de la base (novedades) pasa siempre por `lib/sanitize-content.ts` antes de renderizarse.
- Colores en `app/globals.css` `:root` — fondo `--color-deep-dark-bg: #013729`, acento `--color-highlight: #00c7b1`, tarjetas `--color-card-bg: #1c2f31`, dorado `--color-gold: #e69b05`, marca `--cau-brand-blue: #005587` / `--cau-brand-green: #058c70`.
- `docs/textos-whatsapp.md` son las respuestas institucionales para copiar y pegar al atender un lead a mano. **No las usa el bot**, que contesta desde `ventas/corpus/`. No llevan precios ni fechas a propósito.
- [`PENDIENTES.md`](PENDIENTES.md) es la lista breve de tareas abiertas. Sus rutinas ([`docs/rutinas.md`](docs/rutinas.md)), detalles, historial y procedimientos están enlazados desde ahí; no mezclar esos registros con la lista rápida.
- `docs/seguridad.md` es el historial de seguridad: qué se endureció y cuándo, el mapa de qué defiende cada pieza, los cinco pasos de una revisión y la bitácora de las que se hicieron. Antes de proponer un endurecimiento, mirar ahí si ya está hecho; después de revisar, anotar el resultado.
- **Al dar de alta, renombrar o abrir una carrera, recorrer [`docs/alta-de-carrera.md`](docs/alta-de-carrera.md)**: lo que se busca por nombre (áreas, tipos de Teclab, HubSpot, test vocacional, bot, folletos) no se actualiza solo.
- `docs/criterios.md` son las decisiones ya tomadas (no volver a proponerlas) y las preferencias de trabajo del usuario. Lo leen Claude Code y Codex por igual: lo que está ahí no va en la memoria de ninguno de los dos, porque la memoria no cruza de herramienta ni de máquina.
- `referencias/AAAA-MM-DD-<tema>.md` guarda los links que se usaron en cada trabajo; los docs los citan desde ahí.
- `odd/tasks/` son los documentos de seguimiento de cada funcionalidad (objetivo, tareas y verificación).
- `contenidos/` es el material gráfico y de video por casa (`cau/`, `siglo21/`, `teclab/`, `identidad/`; lo general y lo de la sede es del CAU; cada una con `oficial/`, `en-curso/`, `aprobados/` y `remotion/`, donde viven sus proyectos de video). Pesa más de 11 GB y está fuera de git, de TypeScript y de ESLint. **No se explora, no se lista ni se busca adentro salvo que el usuario lo pida** o que el trabajo sea una pieza gráfica o un video (ahí mandan las skills `lienzo-de-diseno`, `piezas_teclab` y `remotion`). Cómo se usa: `contenidos/LEER.md`.
- `scripts/` son utilitarios de una sola vez (descarga de assets de Teclab, generadores de folletos); no participan del build ni de `check`.
- `.claude/skills/` es una biblioteca local de skills: marca y patrones de diseño del CAU (`cau_brand`, `cau_design_patterns`), el procedimiento de carga de carreras (`cargar_carrera`), piezas gráficas por casa, SEO, y guías generales de Next/React. `.claude/agents/` tiene los agentes de revisión del proyecto (`auditor-contenido`, `auditor-dependencias`, `auditor-web`, `estratega-seo`, `verificador-produccion`); ninguno escribe ni commitea.
- `docs/plans/` son planes de implementación históricos, no estado actual; además es donde escriben las skills `brainstorming` y `writing-plans`. `docs/resumen-proyecto.md` es un resumen para reutilizar patrones en otros proyectos — ante una contradicción, manda este archivo y el código.
- `carreras/`, `ventas/` y `herramientas/ventas/` son la base de conocimiento comercial (precios, corpus del bot de WhatsApp, fichas), **no las usa el sitio**. Las tres están gitignoradas y ancladas con `/` (si no se comerían `app/carreras/` y `components/carreras/`): **el repo es público y ahí hay precios, no commitearlas**. Grep no las ve; buscar ahí con Bash. Ningún script arma rutas a mano: el mapa está en `herramientas/ventas/rutas.mjs`. Detalle en `docs/material-comercial.md`.
- `conocimiento/` es la versión versionada y sin precios de esa base (información académica de las tres casas, para piezas). La genera `herramientas/ventas/exportar-conocimiento.mjs`: no se edita a mano. Ver `conocimiento/LEER.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
