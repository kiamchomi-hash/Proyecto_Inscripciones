# El material comercial: `carreras/`, `ventas/` y `herramientas/ventas/`

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
