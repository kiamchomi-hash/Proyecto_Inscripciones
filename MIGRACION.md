# Plan de Migración — CAU Villa Lugano

## Páginas migradas
- faq.html → app/faq/page.tsx
- clases-apoyo.html → app/clases-apoyo/page.tsx
- novedades.html (x10) → app/novedades/[page]/page.tsx
- 404.html → app/not-found.tsx
- sobre-nosotros.html → app/sobre-nosotros/page.tsx

## Páginas migradas (funcionalidad completa)

### index.html → app/page.tsx ✅
Catálogo de carreras, búsqueda fuzzy, filtro por categoría/área/duración, formulario de inscripción, modales con slides, sidebar de beneficios.

Pendiente menor:
- ~~Automatizar año en carrusel hero~~ ✅ (dinámico con `new Date().getFullYear()`)
- Descuentos en último slide de modales (futuro)


## Archivos legacy en migracion_pendiente/
- index.html — referencia para migración de index
- server.ts, schemas.ts, tsconfig.server.json — server Express legacy
