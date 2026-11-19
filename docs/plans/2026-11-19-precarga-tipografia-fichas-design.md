# Precarga de la tipografía de las fichas

El título mantiene su tipografía y `font-display: swap`; no se oculta el texto
ni se sustituye la fuente de marca. La ficha pasa al layout únicamente el WOFF2
que usa en el título: Bricolage Grotesque para Siglo 21, Manrope para
tecnicaturas y cursos de Teclab, y ninguna precarga nueva para Identidad.
Inter conserva su precarga general.

Una prueba sobre el build compilado comprueba los enlaces emitidos en el
`<head>`, `crossorigin` y la disponibilidad del archivo. La precarga adelanta
la descarga, pero no garantiza que una conexión lenta evite el cambio.
