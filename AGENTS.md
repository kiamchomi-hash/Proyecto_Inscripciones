# AGENTS.md

This file provides guidance to Codex and other agents that read AGENTS.md when working with code in this repository.

## Proyecto

Sitio de **Universidad Siglo 21 — CAU Villa Lugano**, un centro de aprendizaje a distancia. Publica la oferta académica (Siglo 21, Teclab e Identidad Argentina), capta inscripciones y gestiona las clases de apoyo. Producción: `https://www.siglo21sur.com`, servida desde el 27/10/2026 por el Worker de Cloudflare `cau-produccion-20261026`: Astro con islas de React sobre D1, código en `cloudflare/`.

El sitio publicado y su configuración están en `cloudflare/`. El código compartido vive en `components/`, `lib/` y `estilos/`.

Todo el texto de interfaz, los comentarios de código y la documentación están en español (es-AR).

En mensajes comerciales no usar nunca el emoji de bolsa de dinero (💰): puede dar la impresión de que queremos quedarnos con la plata del lead. Para aranceles usar un encabezado neutro, por ejemplo `Arancel vigente:`.

**[`docs/criterios.md`](docs/criterios.md) se lee antes de proponer nada**: las decisiones ya tomadas que no hay que volver a proponer y cómo espera el usuario que se trabaje.

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

### Verificaciones que no cubre `npm run check`

`check` sólo mira el código. Lo que mira los datos y el sitio publicado vive en `herramientas/`, con un `.sh` de doble clic al lado de cada `.mjs` (la lógica se toca en el `.mjs`; el envoltorio no tiene lógica propia, y nada de esa carpeta entra al bundle): `npm run auditar` (contenido faltante en la base D1 de producción), `npm run smoke` (producción: rutas, cabeceras, redirects, sitemap y peso del HTML), `npm run capturas`, `npm run seo` (informe de Search Console) y `npm run leads` (de dónde vienen los leads: clics a WhatsApp, consultas y tráfico de Google, con el embudo). Las tres primeras salen con código 1 si encuentran algo.

`npm run calidad` es la auditoría ampliada: corre todos los controles (código, dependencias, contenido, Search Console, producción, SEO de cada URL del sitemap y navegador) aunque uno falle, y tiene comandos por área (`calidad:web`, `calidad:seo`). Un código 2 es que faltó una fuente, nunca un aprobado. Detalle en [`docs/controles-automaticos.md`](docs/controles-automaticos.md); el agente `auditor-web` interpreta la corrida.

**La vigilancia de producción ya existe, son dos y no se duplican**: el cron del Worker cada 6 horas (`0 */6`, `cloudflare/src/api/vigilancia.ts`, avisa por Telegram con la máquina apagada) y `herramientas/vigilancia.mjs` en la máquina de casa, disparado por cron. **Antes de proponer cualquier monitoreo o alerta, está hecho.** Lo que se espera de producción lo declara **un solo archivo, `lib/vigilancia-esperado.ts`**, que leen los dos: rutas, cabeceras, HSTS, noindex y redirects se tocan ahí y nada más.

**El detalle de cada script, las banderas que aceptan, los dos vigilantes y los generadores (`og:teclab`, y sin script npm `generar-og`, `generar-favicon`) están en `docs/herramientas.md`.** Leerlo antes de correr o tocar cualquiera de ellos.

### Deploy

**Push a `main` publica el sitio después de verificar.** El workflow `Verificaciones` corre los controles y, si ambos pasan, el job `Publicar Worker después de verificar` despliega ese mismo commit con el secreto `CLOUDFLARE_API_TOKEN`. Antes de desplegar comprueba que el SHA siga siendo la punta de `main`; si llegó un push nuevo, no publica el viejo. El grupo de concurrencia `publicar-worker` es el mismo del workflow manual, así que dos deploys nunca corren a la vez.

- **Manual**: el workflow `Publicar el Worker` (`.github/workflows/publicar.yml`) conserva el `ensayo` (por defecto, no publica) y el `produccion` desde Actions. Se niega a correr fuera de `main` y verifica rutas fijas, cabeceras y redirects.
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
- `.claude/skills/` es una biblioteca local de skills: marca y patrones de diseño del CAU (`cau_brand`, `cau_design_patterns`), el procedimiento de carga de carreras (`cargar_carrera`), piezas gráficas por casa, SEO, y guías generales de Next/React. `.claude/agents/` tiene los agentes de revisión del proyecto (`auditor-contenido`, `auditor-dependencias`, `auditor-web`, `estratega-seo`, `verificador-produccion`); ninguno escribe ni commitea.
- `docs/plans/` es donde escriben planes nuevos las skills `brainstorming` y `writing-plans`. `docs/resumen-proyecto.md` es un resumen para reutilizar patrones en otros proyectos — ante una contradicción, manda este archivo y el código.
- `carreras/`, `ventas/` y `herramientas/ventas/` son la base de conocimiento comercial (precios, corpus del bot de WhatsApp, fichas), **no las usa el sitio**. Las tres están gitignoradas y ancladas con `/` (si no se comerían `app/carreras/` y `components/carreras/`): **el repo es público y ahí hay precios, no commitearlas**. Grep no las ve; buscar ahí con Bash. Ningún script arma rutas a mano: el mapa está en `herramientas/ventas/rutas.mjs`. Detalle en `docs/material-comercial.md`.
- `conocimiento/` es la versión versionada y sin precios de esa base (información académica de las tres casas, para piezas). La genera `herramientas/ventas/exportar-conocimiento.mjs`: no se edita a mano. Ver `conocimiento/LEER.md`.
