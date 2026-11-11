# Lighthouse: error de consola del beacon y áreas táctiles del carrusel

- https://developers.cloudflare.com/web-analytics/ — beacon de Web Analytics: `data-cf-beacon` y la opción `send.to` para fijar el destino de los datos.
- https://static.cloudflareinsights.com/beacon.min.js — script que inyecta el beacon; lee el primer `script[data-cf-beacon]` del DOM.
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — WCAG 2.2.8 Target Size (Minimum): 24×24 px o espacio suficiente alrededor.
- https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html — WCAG 2.5.3 Label in Name: el texto visible tiene que estar dentro del nombre accesible.
- https://github.com/dequelabs/axe-core/blob/develop/doc/rules.md#target-size — regla `target-size` de axe (experimental: el control del repo no la corre, Lighthouse sí).
- https://github.com/dequelabs/axe-core/blob/develop/doc/rules.md#label-content-name-mismatch — regla `label-content-name-mismatch` de axe.
- https://developer.chrome.com/docs/lighthouse/overview — auditorías de Lighthouse y cómo se ponderan.

Descartado:

- `https://cloudflareinsights.com/cdn-cgi/rum` como destino del beacon: responde 404 y sin cabeceras CORS; el error de consola que Lighthouse marcaba en buenas prácticas.
- El `aria-label` con el nombre completo de la carrera (`Ver detalles de ...`): el nombre accesible no contenía el texto visible de la tarjeta, que es lo que WCAG 2.5.3 pide, y dos carreras homónimas quedaban con el mismo nombre.
- `aria-label` en el botón de filtros: con texto visible dentro del botón, la regla falla siempre; se resolvió con el rótulo oculto (`sr-only`) y el nombre accesible como texto visible.
