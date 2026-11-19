# Precarga de tipografía de fichas — plan de implementación

**Objetivo:** Adelantar la descarga de la fuente del título sin cambiar el
render final ni precargar fuentes en páginas que no las usan.

**Arquitectura:** La ruta de ficha elige la URL con los criterios de marca
vigentes y `Sitio.astro` emite la precarga junto a la de Inter.

**Tecnología:** Astro, WOFF2, Node test y workerd con D1 efímera.

1. En `cloudflare/tests/entrega.test.mjs`, comprobar los enlaces de Siglo 21,
   Teclab (tecnicatura y curso), Identidad y la portada. Confirmar el fallo sin
   la precarga nueva.
2. Pasar `preloadFuente` desde `cloudflare/src/pages/carreras/[slug].astro` y
   emitirla en `cloudflare/src/layouts/Sitio.astro` con `as="font"`,
   `type="font/woff2"` y `crossorigin`.
3. Ejecutar `npm --prefix cloudflare run build` y
   `npm --prefix cloudflare run test:entrega`. No modificar producción.
