# AGENTS.md

Sitio de **Universidad Siglo 21 — CAU Villa Lugano**. Next.js 16 (App Router) + Supabase, en Vercel: `https://www.siglo21sur.com`.

**La documentación completa es [`CLAUDE.md`](CLAUDE.md) — leerla antes de tocar nada.** Este archivo es el resumen para agentes que no la cargan solos: están acá nada más las reglas que, si se ignoran, rompen algo en producción.

Todo el texto de interfaz, los comentarios y la documentación van en **español (es-AR)**.

[`docs/criterios.md`](docs/criterios.md) es el otro que hay que leer: las decisiones ya tomadas que no hay que volver a proponer y cómo espera el usuario que se trabaje.

## Antes de commitear

```bash
npm run check    # lint + typecheck + test
```

**Push a `main` = deploy automático.** Se trabaja directo sobre `main`, sin ramas ni PRs. Commitear **sólo los archivos propios** (nada de `git add -A`: se editan cosas en paralelo). Si el push falla con un error que no explica nada, vaciar `GH_TOKEN` y `GITHUB_TOKEN`.

## Las reglas que rompen cosas

### 1. Elegir bien el cliente de Supabase

Hay cuatro y elegir mal es el error más fácil de cometer:

| Módulo | Credencial | Para qué |
|---|---|---|
| `lib/supabase.ts` | anon, sin sesión | lecturas públicas desde Server Components |
| `lib/supabase-auth.ts` | anon + sesión | **todo el panel admin**, incluidas sus escrituras |
| `lib/supabase-server.ts` | anon + sesión | sesión en Server Components (hoy no lo importa nadie) |
| `lib/supabase-admin.ts` | **service role** | escrituras del público y de las APIs; lleva `import 'server-only'` |

El profesor logueado **escribe con la anon key** (policies `materias_approved_update` y `profesores_register_pending`): no metas service role en el panel.

Desde la máquina local **no hay credencial de escritura** — la service role está marcada Sensitive en Vercel. Todo `INSERT`/`UPDATE` manual va por el SQL Editor del dashboard, y los archivos de `sql/` **no son migraciones automáticas**: se corren a mano, en orden de fecha.

### 2. Los formularios públicos no escriben directo en la base

Todo lo que envía el público pasa por `POST /api/formularios`, que discrimina con el campo `kind` (`consulta`, `faq`, `clase`). `tests/security.test.mjs` falla si un componente fuera de `components/admin/` llama a `.from('consultas'|'faq_preguntas'|'solicitudes_clase').insert`. No es un test decorativo: es la regla que sostiene el modelo de seguridad.

### 3. Los campos de los formularios se declaran en un solo archivo

`components/formularios/casas.ts` declara los campos, la columna de `consultas` donde se guarda cada uno, y qué pide cada casa (`siglo21`, `teclab`, `identidad`). `insertConsulta` arma la fila con `columnaDe()` y **no tiene ni un nombre de columna escrito a mano**; hay un test que falla si vuelve a aparecer un literal de columna en el endpoint.

El 23/08/2026 el endpoint apuntó a nueve columnas inexistentes y, como PostgREST rechaza la fila entera (PGRST204), **dejaron de entrar todas las consultas del sitio**. Antes de agregar un campo: verificar que la columna exista (`GET /rest/v1/consultas?select=<columna>&limit=1` con la anon key; un `42703` es la columna que falta) y después mandar una consulta real.

### 4. Filtrar las carreras que no se dictan

`components/index/types.ts` es la fuente de verdad de la taxonomía. **Aplicar `esCarreraVisible()` en cualquier lectura nueva de `carreras`**, o se publican páginas de carreras que no se dictan (las filas siguen en Supabase a propósito).

### 5. Los triggers ya existen — no crear triggers nuevos

Dos familias distintas, las dos ya montadas:

- **Avisos** (`notify_edge_function()` → Edge Function `notificar` → Telegram): `on_consulta_insert`, `on_solicitud_clase_insert`, `on_faq_pregunta_insert`.
- **Revalidación on-demand** (`notify_revalidar()` → `POST /api/revalidar`): `on_carreras_revalidar`, `on_novedades_revalidar`, `on_materias_revalidar`, `on_faq_preguntas_revalidar`.

Duplicarlos duplica los avisos. `faq_preguntas` tiene uno de cada familia: son distintos y los dos tienen que estar.

Como `net.http_post` encola sin bloquear, **el `INSERT` responde 201 aunque la notificación se caiga**. Se diagnostica en `net._http_response`: 401 es que los secretos no coinciden, 503 que falta la variable en Vercel, 400 que la tabla no está mapeada en `rutasA()`.

### 6. La vigilancia de producción ya existe, son dos y no se duplican

**No proponer monitoreo, alertas ni "que avise si el sitio se cae": está hecho.** El cron de Vercel (`app/api/vigilancia`, cada 6 h, avisa por Telegram con la máquina apagada) y el local (`herramientas/vigilancia.mjs`, disparado por el Programador de tareas). Lo que se espera de producción lo declara **un solo archivo, `lib/vigilancia-esperado.ts`**, que leen los dos: rutas, cabeceras, HSTS, noindex y redirects se tocan ahí y en ningún otro lado.

## Lo que no es obvio del repo

- **`proxy.ts` en la raíz es el middleware** — Next 16 renombró `middleware.ts` a `proxy.ts`. Ahí vive el control de acceso del panel admin.
- **Esta no es la versión de Next que conocés.** Ante cualquier duda de API o convención, leer la guía en `node_modules/next/dist/docs/` antes de escribir código.
- **`next.config.ts` concentra la CSP, las cabeceras y los redirects.** Si se agrega un servicio externo (script, fuente, iframe, fetch), hay que sumar su origen o el navegador lo bloquea.
- **`experimental.inlineCss: true` está activo a propósito.** Ya se midió A/B: apagarlo da peor resultado aunque el HTML pese menos.
- **`carreras/`, `ventas/` y `herramientas/ventas/` están gitignoradas** (ancladas con `/`, si no se comerían `app/carreras/` y `components/carreras/`). Son la base de conocimiento comercial: **el repo es público y ahí hay precios, no commitearlas**. Grep no las ve — buscar ahí con Bash. El mapa de rutas está en `herramientas/ventas/rutas.mjs` y ningún script arma rutas a mano.
- **`herramientas/` no entra al bundle.** Cada verificación es un `.mjs` con un `.bat` y un `.sh` al lado; la lógica se toca en el `.mjs`, los envoltorios no tienen lógica propia. `npm run auditar | smoke | capturas | seo` son las verificaciones que `check` no cubre.
- **`PENDIENTES.md` es el backlog vivo**, con las verificaciones manuales que no se pueden automatizar. `docs/plans/` son planes históricos, no estado actual.

## Windows y Linux

El proyecto se trabaja desde las dos máquinas, con el mismo repo:

- **Nada de rutas absolutas de una máquina** en archivos versionados.
- **`.gitattributes` fija los finales de línea**: un `.sh` con CRLF falla con `bad interpreter: ^M`.
- **`fs.cpSync` recursivo no se usa**: en Node 24 sobre Windows revienta el proceso (0xC0000409, sin lanzar excepción) si la ruta tiene un carácter no ASCII, y la de este proyecto tiene un acento.
- **`node herramientas/entorno.mjs exportar|importar`** mueve lo que no viaja por git (`.env.local`, credenciales, `.agents/`, `notas-locales/`). El procedimiento está en `herramientas/LEER.md`.
