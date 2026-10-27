# Fuentes consultadas: traslado público local

- https://www.siglo21sur.com/sitemap.xml — URLs, fechas e imágenes canónicas reales para comparar con D1 local.
- https://www.siglo21sur.com/robots.txt — reglas actuales, contrastadas con el Worker local.
- https://www.siglo21sur.com/ — contenido público SSR y referencias de media; sin ejecutar JavaScript ni eventos.
- https://www.siglo21sur.com/carreras/tecnicatura-superior-en-cloud-administration — título publicado que faltaba conservar en el port.
- https://www.siglo21sur.com/carreras/tecnicatura-superior-en-gestion-hotelera — descripción publicada que faltaba conservar en el port.

El lote privado/ignorado conserva firmas de las 115 URLs del sitemap y seis
sondas de redirects/404, más las referencias de media observadas. Los datos se
leyeron de las cuatro proyecciones anon declaradas en
`cloudflare/scripts/datos-publicos.mjs`; no se usaron endpoints administrativos.
