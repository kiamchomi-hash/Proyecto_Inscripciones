# Verificación práctica de cambios

Elegí las comprobaciones por lo que cambió; no ejecutes la auditoría completa
por rutina. Antes de probar, mirá `git diff` y clasificá los archivos afectados.
Si un cambio cruza áreas, sumá los controles de cada una.

## Recorrido breve

1. Revisá el diff y confirmá que sólo incluya el trabajo de esta tarea.
2. Elegí los controles de la tabla y los casos de regresión de
   [`checklist-confiabilidad.md`](checklist-confiabilidad.md) que active el diff.
3. Corré primero la prueba más específica; después, el control del paquete
   correspondiente.
4. Si algo falla, investigá la causa. No repitas hasta que pase ni cambies una
   referencia visual sólo para silenciar una diferencia.
5. Informá qué se ejecutó, el resultado y cualquier control que no pudo hacerse.

## Referencias visuales de un componente compartido

Las capturas del E2E se comparan por medida exacta: cualquier cambio de alto en
un formulario o encabezado cambia la captura de **todas** las rutas que lo
montan, no sólo de la que se estaba mirando. Ir de a una ruta por corrida es lo
que hace que el mismo cambio parezca fallar tres veces.

Cuando el cambio altera el alto de algo compartido:

1. Enumerá las rutas afectadas antes de tocar nada: `codegraph_explore` sobre el
   componente muestra las páginas que lo renderizan.
2. Corré el E2E una sola vez con el comparador intacto y leé los diagnósticos
   `dimensiones anteriores … actuales …`: las rutas que sólo difieren en alto
   son las que hay que refrescar, y todas quedan listadas en la misma corrida.
3. Confirmá que cada diferencia corresponde al cambio acordado —no a una
   regresión— mirando la captura nueva contra la referencia.
4. Regenerá sólo esas referencias con `scripts/actualizar-referencias-visuales.mjs`
   y volvé a correr el E2E completo, sin relajar tolerancias ni medidas.

**No se afloja la comparación para que pase.** Permitir que una captura cambie
de alto convierte una regresión de layout en un falso verde y deja de proteger
justo lo que la referencia vigila.

## El alto del navbar no se mide desde JS

`--navbar-height` (`estilos/navbar.css`) es la fuente única de dónde se pegan la
barra de búsqueda del catálogo y los saltos de ancla de las fichas y de clases
de apoyo. Se escribe como una cuenta con las medidas que arman el navbar —no
como un número— porque el alto sale de su contenido y de la base `rem`, que
cambia por breakpoint y sube a 120% en pantallas grandes. Antes lo escribía el
componente midiendo con `getBoundingClientRect`; si ese JS no corría, quedaba el
respaldo y la barra aparecía corrida.

Si cambia una medida del navbar, se actualiza la cuenta en el mismo lugar. El
E2E lo vigila: compara el borde inferior del navbar con el alto de la barra
pegajosa en móvil y escritorio, y falla si queda un hueco o si el CSS calcula
otra cosa que la caja real.

Desde JS el alto se lee de la caja con `lib/navbar-alto.ts`.
`getPropertyValue('--navbar-height')` devuelve el texto del `calc()` y no un
número, así que `parseFloat` da `NaN` y cualquier respaldo fijo desalinea otra
vez.

## El E2E no corre el entry de producción

`test:e2e` levanta el sitio con el servidor de desarrollo. El sitio publicado
sale por `cloudflare/produccion/worker.ts`, que además versiona las referencias
de assets dentro del HTML (`versionarRespuestaHtml`) y guarda una copia de borde.
Un E2E en verde no dice nada sobre ese paso.

Si el cambio toca `cloudflare/produccion/`, `cloudflare/src/entrega/` o el HTML
que arma el Worker, corré `npm --prefix cloudflare run test:entrega`: sus pruebas
levantan el entry real con wrangler y comparan bytes, no sólo el render.

En `HTMLRewriter`, `Text.replace` y `Element.setInnerContent` escriben el
contenido como texto HTML y escapan `&`, `<` y `>`. Aplicado al texto de un
`<script>` inline, el `&&` llega como `&amp;&amp;`, el navegador no lo parsea y
la página queda sin hidratar: los formularios no responden, los menús no abren y
las islas de React no toman el control. Para reescribir código o estilos hace
falta `{ html: true }`.

## Controles según el cambio

| Cambio | Verificación local |
|---|---|
| Código compartido en `components/`, `lib/` o `estilos/` | `npm run check`. Si lo consume el Worker, agregá también el build de Cloudflare o el test afectado. |
| Interfaz o estilos del sitio publicado | `npm run check`, `npm --prefix cloudflare run build` y revisión visual en escritorio y celular. Enviá capturas visibles en el chat. |
| Worker, API, datos o crons | Ejecutá la suite específica disponible, por ejemplo `npm --prefix cloudflare run test:api`, `test:datos` o `test:crons`. Para cambios amplios, `npm --prefix cloudflare run check`. |
| E2E o paridad del Worker | `npm --prefix cloudflare run test:e2e` o `test:paridad`, según el comportamiento tocado. Ambos están incluidos en el `check` de ese paquete. |
| Rutas, redirects, metadatos o SEO | Ejecutá `npm run check` y la prueba de rutas/regresión afectada; si el cambio toca la entrega del Worker, sumá su prueba correspondiente. |
| Workflow, publicación o contrato de configuración | Corré el test del contrato afectado y revisá el diff del workflow/configuración. El CI valida el contrato del publicador, pero no ejecuta el `check` completo de Cloudflare. |
| Skills de `.claude/skills` | `npm run skills` (ya lo corre `check`): frontmatter, tamaño, rutas absolutas, referencias y enlaces de `.agents/skills`. Si cambió un `name`, corré además `node herramientas/sincronizar-skills.mjs` y revisá el enlace de `.agents/skills`. |
| Sólo documentación | Revisá enlaces relativos, comandos y afirmaciones contra la fuente vigente; no hace falta correr suites de aplicación. |

El publicador local (`herramientas/5 - Subir cambios (deploy).sh`) informa el
nivel de riesgo del diff seleccionado. Los cambios que afecten `cloudflare/`
agregan el build; los de riesgo alto agregan las pruebas del área y el `check`
completo de Cloudflare. Si el diff mezcla áreas, aplica el nivel más alto.

CodeQL corre en GitHub en modo observación y publica alertas; todavía no bloquea
por hallazgos de código preexistentes o nuevos. El job sí debe terminar bien
antes de que el workflow publique. La activación de un bloqueo por hallazgos
nuevos requiere establecer primero la línea base.

Los controles de la raíz y de `cloudflare/` son independientes: `npm run check`
no prueba el paquete Cloudflare. El `check` de Cloudflare tampoco equivale a una
auditoría del sitio publicado. Los controles remotos, escrituras en D1 y
publicaciones requieren autorización explícita para el destino y la operación;
no se deducen de una prueba local.

La auditoría ampliada (`npm run calidad`) y sus controles por área están
documentados en [`controles-automaticos.md`](controles-automaticos.md). No la
uses como sustituto de revisar visualmente el cambio ni presentes sus límites
como una aprobación.
