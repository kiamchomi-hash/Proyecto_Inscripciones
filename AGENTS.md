# AGENTS.md

This file provides guidance to Codex and other agents that read AGENTS.md when working with code in this repository.

## Proyecto

Sitio de **Universidad Siglo 21 — CAU Villa Lugano**, un centro de aprendizaje a distancia. Publica la oferta académica (Siglo 21, Teclab e Identidad Argentina), capta inscripciones y gestiona las clases de apoyo. Producción: `https://www.siglo21sur.com`, servida desde el 27/10/2026 por el Worker de Cloudflare `cau-produccion-20261026`: Astro con islas de React sobre D1, código en `cloudflare/`.

El sitio publicado y su configuración están en `cloudflare/`. El código compartido vive en `components/`, `lib/` y `estilos/`.

Todo el texto de interfaz, los comentarios de código y la documentación están en español (es-AR).

En mensajes comerciales no usar nunca el emoji de bolsa de dinero (💰): puede dar la impresión de que queremos quedarnos con la plata del lead. Para aranceles usar un encabezado neutro, por ejemplo `Arancel vigente:`.

**[`docs/criterios.md`](docs/criterios.md) se lee antes de proponer nada**: las decisiones ya tomadas que no hay que volver a proponer y cómo espera el usuario que se trabaje.

## Coordinación entre T3, Codex y OpenCode

### Navegador integrado de T3

- Si el usuario pide abrir una URL en el navegador integrado, usar `preview_open` directamente con esa URL. No tomar `preview_status.available: false` o `tabId: null` como prueba de que el navegador no existe: puede significar simplemente que el chat aún no tiene una pestaña abierta.
- Si el usuario pide «abrir el campus» o «campus virtual» sin pasar URL, usar `https://ecampus.uesiglo21.edu.ar/menu/`; no pedir el enlace de nuevo.
- Si hace falta consultar el estado, llamar a `preview_open` igualmente cuando no haya pestaña. Sólo informar que no está disponible si la herramienta no está expuesta en la sesión o si `preview_open` falla; comunicar el error observado sin pedir al usuario que repita el enlace ya proporcionado.
- El acceso del agente al navegador se configura en T3 en Settings → Browser y el cambio aplica a sesiones nuevas. Esta instrucción guía al agente, pero no puede habilitar una herramienta que T3 no exponga en esa sesión.

- Para una tarea especializada, consultar las instrucciones existentes antes de
  reproducirlas: los perfiles de revisión de este proyecto están en
  `~/.config/opencode/agents/` (`auditor-contenido`, `auditor-dependencias`,
  `auditor-web`, `estratega-seo` y `verificador-produccion`, con extensión
  `.md`). Son archivos locales y pueden no estar presentes en otra máquina.
- Las skills propias viven en `.claude/skills/<nombre>/SKILL.md`; leer sólo las
  pertinentes a la tarea. Consultar también las skills y herramientas que el
  entorno actual ya expone, sin duplicar servidores MCP por precaución.
- Los perfiles para Codex se preparan en `.codex/agents/`: los cinco de revisión
  y los de arquitectura, frontend, backend, base de datos, QA e integración;
  sus instrucciones están adaptadas de OpenCode, no son sus permisos. Los
  agentes heredan los permisos efectivos del padre: las instrucciones de sólo
  lectura no son una barrera técnica. No fijan modelo ni proveedor. Su
  descubrimiento en un nuevo prompt local se comprobó en este worktree; eso no
  prueba la ejecución ni la disponibilidad en otras conversaciones.
- Los enlaces selectivos en `.agents/skills/` apuntan a skills propias de
  `.claude/skills/`. Git permite incluir únicamente los trece enlaces declarados; el
  resto de `.agents/` sigue ignorado. Los enlaces están versionados y viajan
  con el repositorio. El descubrimiento depende de la
  sesión; se comprobó en un nuevo prompt local de este worktree, no en otras
  conversaciones. No ejecutar acciones remotas ni con efectos por
  el solo hecho de que un perfil o skill las mencione: respetar la autorización
  vigente.
- Conservar las reglas de costo y seguridad existentes. Sol y Astra requieren
  autorización explícita para la tarea; no seleccionarlos por sustitución.
  No modificar la configuración de OpenCode para aplicar esta guía.
- T3 selecciona el proveedor por tarea y disponibilidad; OpenCode es un
  proveedor independiente, con contexto y permisos propios. Un perfil TOML de
  Codex no habilita OpenCode. Antes de trabajo paralelo, acordar contratos y
  superficies exclusivas; pedir aprobación al usuario antes de integrar.
  No cambiar a un modelo pago sin autorización. La base de datos requiere
  autorización explícita y toda operación remota requiere destino, operación y
  sesión o credencial explícitamente autorizados. No modificar `main`, hacer
  merge ni push sin autorización.
- T3 expone la selección de modelo de una conversación y de proveedor por
  tarea. No se comprobó equivalencia con `/auto`, `/codex` o `/free` de
  OpenCode ni conservación del contexto al cambiar de proveedor; los perfiles
  y enlaces no implementan esos comandos.

### Reparto solicitado para T3

Los nombres `/auto` y `/free` identifican aquí el reparto de OpenCode que se
quiere reproducir; **no son comandos de T3**. Esta guía no cambia el proveedor o
modelo del coordinador en el turno actual ni configura un selector de modos.
El coordinador conserva el proveedor y modelo que ya tiene; el reparto elegido
determina los modelos de las delegaciones. Estas instrucciones no son permisos
ni bloqueos técnicos.

| Reparto | Función | Proveedor y modelo | Límite de la tarea |
| --- | --- | --- | --- |
| auto | Coordinador original de OpenCode | `opencode-go/deepseek-v4.1-flash` | Referencia; T3 no necesita cambiar de coordinador. |
| auto | `borrador` | `opencode-go/claude-haiku-5-5` | Texto; sin edición ni shell, hasta 12 pasos. |
| auto | `dificil` | `opencode-go/claude-haiku-5-5` | Depuración y revisión; un intento por pedido, hasta 20 pasos; puede reproducir con comandos, no editar. |
| auto | `lote` | `opencode-go/qwen3.8-flash` | Clasificar, extraer y resumir; sin edición ni shell, hasta 8 pasos. |
| auto | `codex_rapido` | Luna, OpenAI/ChatGPT | Segunda opinión breve; sin edición, hasta 6 pasos. |
| auto | `revision_final` | Terra, OpenAI/ChatGPT | Revisión final cuando corresponda; sin edición, hasta 12 pasos. |
| free | Coordinador original de OpenCode | `opencode/deepseek-v4.1-flash-free` | Referencia; T3 no necesita cambiar de coordinador. |
| free | `free_lote` | `opencode/glm-5.3-flash-free` | Clasificar, extraer, resumir y redactar en volumen; sin edición ni shell, hasta 8 pasos. |
| free | `free_opinion` | `opencode/beam-free` | Segunda opinión breve; sin edición, hasta 6 pasos. |

**Aplicación en T3:**

1. El usuario elige el reparto de las delegaciones. El coordinador actual no
   tiene que cambiar de proveedor ni de modelo. No alternar automáticamente
   entre repartos.
2. Cuando una delegación esté autorizada y corresponda, consultar una vez por
   conversación `orchestrator_capabilities` antes de la primera `delegate_task`.
   Identificar allí el proveedor y modelo exactos de la fila; pasar su
   `providerInstanceId` y `model` en `target` de `delegate_task`, con la función,
   alcance, límites y verificaciones en `task`. Seguir el resultado y su `next`.
   Si el entorno exige la herramienta nativa para una delegación del mismo
   proveedor y modelo, respetar esa regla. Un listado no acredita cuota ni
   garantiza que la ejecución vaya a funcionar.
3. En free delegar exclusivamente a las filas gratuitas, sin OpenCode Go ni
   ChatGPT para esas delegaciones; el coordinador conserva su propio modelo y
   cuota. Verificar los resultados gratuitos; no confiarles escrituras
   ni decisiones irreversibles. En auto, no ejecutar `revision_final` si el
   coordinador ya es Codex ni duplicar una revisión ya realizada.
4. Si el proveedor o modelo elegido no está disponible o falla, informar el
   resultado y no sustituirlo ni cambiar de reparto automáticamente. No usar Sol
   o Astra sin autorización explícita para la tarea. Los límites de pasos y de
   edición son instrucciones al delegado: no suponen un bloqueo técnico de T3.
   Las restricciones de seguridad, integración y operaciones remotas anteriores
   siguen vigentes.

## Comandos

```bash
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

Para cambios sólo visuales, verificar la página en escritorio y celular y correr
`npm run build` en `cloudflare/`, además del `check` de la raíz antes de
commitear. No ejecutar por defecto el `check` completo de `cloudflare/`: incluye
pruebas extensas de datos, API y crons que no hacen falta para cada ajuste visual.
Si cambia esa lógica, ejecutar las pruebas del área afectada; reservar el control
completo para cambios amplios o cuando corresponda una revisión integral. GitHub
no ejecuta ese `check` completo: no presentarlo como si lo hiciera.

La ruta breve por tipo de cambio y los disparadores para revisar regresiones
conocidas están en [`docs/verificacion.md`](docs/verificacion.md) y
[`docs/checklist-confiabilidad.md`](docs/checklist-confiabilidad.md).

### Verificaciones que no cubre `npm run check`

`check` sólo mira el código. Lo que mira los datos y el sitio publicado vive en `herramientas/`, con un `.sh` de doble clic al lado de cada `.mjs` (la lógica se toca en el `.mjs`; el envoltorio no tiene lógica propia, y nada de esa carpeta entra al bundle): `npm run auditar` (contenido faltante en la base D1 de producción), `npm run smoke` (producción: rutas, cabeceras, redirects, sitemap y peso del HTML), `npm run capturas`, `npm run seo` (informe de Search Console) y `npm run leads` (de dónde vienen los leads: clics a WhatsApp, consultas y tráfico de Google, con el embudo). Las tres primeras salen con código 1 si encuentran algo.

`npm run calidad` es la auditoría ampliada: corre todos los controles (código, dependencias, contenido, Search Console, producción, SEO de cada URL del sitemap y navegador) aunque uno falle, y tiene comandos por área (`calidad:web`, `calidad:seo`). Un código 2 es que faltó una fuente, nunca un aprobado. Detalle en [`docs/controles-automaticos.md`](docs/controles-automaticos.md); el agente `auditor-web` interpreta la corrida.

**La vigilancia de producción ya existe, son dos y no se duplican**: el cron del Worker cada 6 horas (`0 */6`, `cloudflare/src/api/vigilancia.ts`, avisa por Telegram con la máquina apagada) y `herramientas/vigilancia.mjs` en la máquina de casa, disparado por cron. **Antes de proponer cualquier monitoreo o alerta, está hecho.** Lo que se espera de producción lo declara **un solo archivo, `lib/vigilancia-esperado.ts`**, que leen los dos: rutas, cabeceras, HSTS, noindex y redirects se tocan ahí y nada más.

**El detalle de cada script, las banderas que aceptan, los dos vigilantes y los generadores (`og:teclab`, y sin script npm `generar-og`, `generar-favicon`) están en `docs/herramientas.md`.** Leerlo antes de correr o tocar cualquiera de ellos.

### Deploy

**Push a `main` publica el sitio después de verificar y de tu aprobación.** El workflow `Verificaciones` corre los controles y, si ambos pasan, el job `Publicar Worker después de verificar` queda esperando: el environment `produccion` de GitHub pide un revisor (el dueño del repo) y una espera de 30 minutos (desde el 23/11/2026). Aprobado, despliega ese mismo commit con el secreto `CLOUDFLARE_API_TOKEN`. Antes de desplegar comprueba que el SHA siga siendo la punta de `main`; si llegó un push nuevo, no publica el viejo. El grupo de concurrencia `publicar-worker` es el mismo del workflow manual, así que dos deploys nunca corren a la vez.

- **Manual**: el workflow `Publicar el Worker` (`.github/workflows/publicar.yml`) conserva el `ensayo` (por defecto, no publica) y el `produccion` desde Actions. Se niega a correr fuera de `main` y verifica rutas fijas, cabeceras y redirects.
- **Local**, desde `cloudflare/`:

```bash
npm run publicar             # plan: no compila, no autentica, no toca nada
npm run publicar:ensayo      # build + wrangler deploy --dry-run (no publica)
npm run publicar:produccion  # build + deploy + smoke contra el dominio
```

La configuración es [`cloudflare/produccion/wrangler.json`](cloudflare/produccion/wrangler.json): dominios propios, base D1, colas, los ocho crons y las variables públicas. Los ocho secretos viven en Cloudflare y un deploy no los pisa; las migraciones de D1 se aplican aparte. La credencial es un token acotado (`Workers Scripts:Edit`, `Workers Routes:Edit` y `Zone:Read` de la zona, `Queues:Edit` y `D1:Edit` sólo para migrar) guardado en `.env.local` o en el entorno: al proceso de wrangler viaja **sólo** esa variable, nunca el resto de `.env.local`. `wrangler login` es la alternativa, con el OAuth en texto plano en el perfil. El publicador revisa la configuración contra el código (`cloudflare/scripts/publicar.mjs`, con pruebas en `cloudflare/tests/publicacion.test.mjs`) y se niega a publicar si no cierra. Antes de un cambio grande, leer [`cloudflare/CORTE.md`](cloudflare/CORTE.md): orden, verificación y rollback. Se trabaja directo sobre `main`, sin ramas ni PRs. Commitear **sólo los archivos propios** (nada de `git add -A`: se editan cosas en paralelo).

`herramientas/5 - Subir cambios (deploy).sh` es el flujo guiado (muestra el diff, pide descripción, corre `npm run check` y recién ahí commitea y pushea). Antes del diff, del commit y del push revisa con Gitleaks que no viajen secretos ni archivos privados; se prepara una vez por máquina con `npm run secretos:instalar` y se revisa a mano con `npm run secretos`. Alcance y excepciones en [`docs/publicacion-sin-secretos.md`](docs/publicacion-sin-secretos.md).

Antes de un push manual, vaciar `GH_TOKEN` y `GITHUB_TOKEN` si están seteados: valores viejos hacen fallar el push con un error que no explica nada.

### Una sola máquina: Linux

Desde el 19/10/2026 el proyecto se trabaja sólo desde Linux. Los `.bat` de `herramientas/` se retiraron el 29/10/2026 (quedaron sólo los `.sh`); los de `ventas/` siguen en esa carpeta gitignorada. No hace falta mantener la paridad con Windows.

- **Nada de rutas absolutas** en archivos versionados: el repo es público.
- **`node herramientas/entorno.mjs exportar|importar`** respalda lo que no viaja por git: `.env.local`, la memoria de Claude Code, la credencial de Search Console, `.agents/` y `notas-locales/`. El procedimiento está en `herramientas/LEER.md`.

## Arquitectura y base de datos

El sitio publicado vive en `cloudflare/`: Astro con componentes React, un
Worker y la base D1. Las migraciones de D1 están en `cloudflare/migrations/`.

Los formularios pasan por `cloudflare/src/api/formularios.ts`: validan el
pedido y guardan en D1 la fila y sus efectos. Los avisos y demás efectos se
gestionan mediante el outbox y las colas del Worker. Los campos de cada casa
se declaran en `components/formularios/casas.ts`; antes de modificarlos, leer
`docs/formularios-por-casa.md` y verificar las columnas en D1.

Para consultar D1 se usa `npm run db:d1`. Una escritura requiere `--escribir`;
revisar la sentencia antes de ejecutarla. Los SQL puntuales se preparan en
`sql/` y no son migraciones automáticas.

El código compartido para catálogo, fichas, estilos y formularios también es
usado por el Worker. Antes de retirarlo o modificarlo, verificar sus imports
y ejecutar los controles correspondientes.

## Convenciones

- Alias `@/*` → raíz del proyecto.
- El contenido HTML que viene de la base (novedades) pasa siempre por `lib/sanitize-content.ts` antes de renderizarse.
- Colores en `estilos/globals.css` `:root` — fondo `--color-deep-dark-bg: #013729`, acento `--color-highlight: #00c7b1`, tarjetas `--color-card-bg: #1c2f31`, dorado `--color-gold: #e69b05`, marca `--cau-brand-blue: #005587` / `--cau-brand-green: #058c70`.
- `docs/textos-whatsapp.md` son las respuestas institucionales para copiar y pegar al atender un lead a mano. **No las usa el bot**, que contesta desde `ventas/corpus/`. No llevan precios ni fechas a propósito.
- [`PENDIENTES.md`](PENDIENTES.md) es la lista breve de tareas abiertas. Sus rutinas ([`docs/rutinas.md`](docs/rutinas.md)), detalles, historial y procedimientos están enlazados desde ahí; no mezclar esos registros con la lista rápida.
- `docs/seguridad.md` es el historial de seguridad: qué se endureció y cuándo, el mapa de qué defiende cada pieza, los cinco pasos de una revisión y la bitácora de las que se hicieron. Antes de proponer un endurecimiento, mirar ahí si ya está hecho; después de revisar, anotar el resultado.
- **Al dar de alta, renombrar o abrir una carrera, recorrer [`docs/alta-de-carrera.md`](docs/alta-de-carrera.md)**: lo que se busca por nombre (áreas, tipos de Teclab, HubSpot, test vocacional, bot, folletos) no se actualiza solo.
- `docs/criterios.md` son las decisiones ya tomadas (no volver a proponerlas) y las preferencias de trabajo del usuario. Lo leen Claude Code y Codex por igual: lo que está ahí no va en la memoria de ninguno de los dos, porque la memoria no cruza de herramienta ni de máquina.
- `referencias/AAAA-MM-DD-<tema>.md` guarda los links que se usaron en cada trabajo; los docs los citan desde ahí.
- `odd/tasks/` son los documentos de seguimiento de cada funcionalidad (objetivo, tareas y verificación).
- `contenidos/` es el material gráfico y de video por casa (`cau/`, `siglo21/`, `teclab/`, `identidad/`; lo general y lo de la sede es del CAU; cada una con `oficial/`, `en-curso/`, `aprobados/` y `remotion/`, donde viven sus proyectos de video). Pesa más de 11 GB y está fuera de git, de TypeScript y de ESLint. **No se explora, no se lista ni se busca adentro salvo que el usuario lo pida** o que el trabajo sea una pieza gráfica o un video (ahí mandan las skills `lienzo-de-diseno`, `piezas_teclab` y `remotion`). Cómo se usa: `contenidos/LEER.md`.
- `scripts/` son utilitarios de una sola vez (descarga de assets de Teclab, generadores de folletos); no participan del build ni de `check`.
- `.claude/skills/` es una biblioteca local de skills: marca y patrones de diseño del CAU (`cau_brand`, `cau_design_patterns`), el procedimiento de carga de carreras (`cargar_carrera`), piezas gráficas por casa, SEO, y guías generales de Next/React. Las instrucciones de los agentes de revisión del proyecto (`auditor-contenido`, `auditor-dependencias`, `auditor-web`, `estratega-seo`, `verificador-produccion`) viven en `~/.config/opencode/agents/`, fuera del repo; ninguno escribe ni commitea.
- `docs/plans/` es donde escriben planes nuevos las skills `brainstorming` y `writing-plans`. `docs/resumen-proyecto.md` es un resumen para reutilizar patrones en otros proyectos — ante una contradicción, manda este archivo y el código.
- `carreras/`, `ventas/` y `herramientas/ventas/` son la base de conocimiento comercial (precios, corpus del bot de WhatsApp, fichas), **no las usa el sitio**. Las tres están gitignoradas y ancladas con `/` (si no se comerían `app/carreras/` y `components/carreras/`): **el repo es público y ahí hay precios, no commitearlas**. Grep no las ve; buscar ahí con Bash. Ningún script arma rutas a mano: el mapa está en `herramientas/ventas/rutas.mjs`. Detalle en `docs/material-comercial.md`.
- `conocimiento/` es la versión versionada y sin precios de esa base (información académica de las tres casas, para piezas). La genera `herramientas/ventas/exportar-conocimiento.mjs`: no se edita a mano. Ver `conocimiento/LEER.md`.
