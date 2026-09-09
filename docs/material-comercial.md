# El material comercial: `carreras/`, `ventas/` y `herramientas/ventas/`

Nada de esto lo usa el sitio: es la base de conocimiento con la que se atiende a los leads (precios, corpus del bot de WhatsApp, fichas de carreras). Hasta el 08/08/2026 vivía todo junto en `herramientas/conocimiento-hermes/`, que era un repo git aparte metido adentro de este. Se disolvió y el contenido quedó repartido por tipo:

| Carpeta | Qué hay |
|---|---|
| `carreras/` | **una carpeta por casa**: `siglo21/` (fichas `.md`, un JSON por carrera en `datos/`, y los JSON de manifiesto, alias, planes y resoluciones), `teclab/` (PDFs y videos por carrera, planes, contenidos y calendario) e `identidad/` |
| `ventas/` | **los `.bat` numerados del 1 al 7**, que son el menú de doble clic; precios vigentes y planillas en `precios/`, corpus del bot por institución en `corpus/`, fuentes internas de Teclab en `fuentes/teclab/`, tips de venta, y `buscador-carreras.html` y `entrenar-bot.html` (se generan) |
| `herramientas/ventas/` | los ~30 scripts `.mjs`, sus tests, `temp/` (archivos de trabajo descartables, antes `.hermes-temp/`) y `perfil-navegador/` (el perfil de Brave con las sesiones de CASA y Teclab) |

Los `.bat` viven con lo que producen y no con la lógica a propósito: se va a `ventas/` a abrir el buscador, así que el lanzador tiene que estar ahí. Cada uno hace `cd /d "%~dp0.."` para pararse en la raíz del proyecto y desde ahí llama a su `.mjs`.

Tres reglas para no romperlo:

- **Ningún script arma rutas a mano**: el mapa entero está en `herramientas/ventas/rutas.mjs` y todos importan de ahí. Si algo se muda, se toca ese archivo y nada más.
- **Las tres carpetas están gitignoradas y ancladas con `/`** (`/carreras/`, no `carreras/`). Sin la barra el patrón matchea a cualquier nivel y se comería `app/carreras/` y `components/carreras/`, que sí son código del sitio. Van gitignoradas porque el repo es público y ahí hay precios.
- **El material comercial vive dentro del proyecto, pero git lo ignora.** Las fuentes de Identidad Argentina están en `carreras/identidad/fuentes/`; `entorno.mjs` no las empaqueta porque contienen precios y material comercial. La historia git vieja quedó archivada en `~/Desktop/historico-repo-ventas.git`.

Las fuentes internas que antes estaban en `Teclab_Info/conocimiento-hermes/` quedaron copiadas en `ventas/fuentes/teclab/`. Los planes, PDFs y videos por carrera ya viven en `carreras/teclab/`.

## Actualizaciones de financiación Teclab

La ruta operativa es el [Dashboard Comercial de Teclab](https://informacion.teclab.edu.ar/hubfs/ADMISION/CALIDAD%20Y%20%20TRAINING/Dashboard_Comercial_Teclab%20(Agentes).html), sección **Arancelar → Medios de pago**. Ahí se consultan las condiciones vigentes de tarjetas, cuotas y suscripción. El cotizador indica que hay que entrar al [Portal Administrativo](https://portaladministrativo.teclab.edu.ar/login), copiar los valores actuales de matrícula y aranceles junto con sus descuentos, y dejar que calcule el resto; si la modalidad es cuatrimestral, también se activa **Arancel 2**.

Antes de actualizar respuestas del bot hay que revisar esa sección y renovar el snapshot de `carreras/teclab/financiacion-teclab-oficial.json`. Los valores de tarjetas y condiciones no se consideran permanentes.

La verificación se ejecuta también al comienzo de `actualizar-todo.mjs` (incluido el `.bat` automático al encender). Descarga la placa a `herramientas/ventas/temp/`, compara su huella con `carreras/teclab/financiacion-teclab-panel.json` y devuelve código 1 si cambió; así el flujo queda fallido y no publica condiciones sin revisar. Para ejecutarla sola: `node herramientas/ventas/actualizar-financiacion-teclab.mjs`. Luego de revisar la placa y actualizar el snapshot oficial, se registra la nueva base con `--registrar`.
