# Fuentes locales del lote de novedades

- [Plan, bloque 4](../docs/plans/2026-10-24-cloudflare.md#bloque-4-paridad-de-páginas-y-entrega): alcance y aceptación aprobados.
- [Criterios](../docs/criterios.md): sin rediseño ni cambios productivos.
- [Listado Next](../app/novedades/[page]/page.tsx): filtros, total, orden, offsets y metadatos.
- [UI de listado](../components/novedades/novedades-page.tsx): tarjetas, fechas, paginación y enlaces.
- [Artículo Next](../app/novedades/articulo/[slug]/page.tsx): publicación, SEO, JSON-LD, contenido y compartir.
- [Sanitizador](../lib/sanitize-content.ts): política vigente reutilizada, sin permitir embeds nuevos.
- [Escapador JSON-LD](../lib/json-ld.ts): serialización segura compartida.
- [Compartir](../components/novedades/copy-link-button.tsx): comportamiento de portapapeles existente.
- [Esquema generado](../lib/database.types.ts): columnas de novedades, no un inventario remoto.
- [Redirects](../next.config.ts): las dos reglas explícitas de artículos.
- [CSS listado](../app/novedades/novedades.css) y [artículo](../app/novedades/articulo.css): mismas hojas, sin alteraciones.

No se consultaron URLs externas ni recursos de producción en este lote.
