# Plan de Migración — CAU Villa Lugano

## Páginas migradas
- faq.html → app/faq/page.tsx
- clases-apoyo.html → app/clases-apoyo/page.tsx
- novedades.html (x10) → app/novedades/[page]/page.tsx
- 404.html → app/not-found.tsx
- sobre-nosotros.html → app/sobre-nosotros/page.tsx

## Páginas en progreso

### index.html → app/page.tsx — EN PROGRESO (avanzado)
Catálogo de carreras, búsqueda fuzzy, formulario de inscripción, modales con slides ya funcionan.

Pendiente:
- Filtro por área (medicina, finanzas) en el buscador
- Cambiar SVG deportistas federados
- Badge de nuevo/descuento en carreras


## Archivos legacy en migracion_pendiente/
- index.html — referencia para migración de index
- server.ts, schemas.ts, tsconfig.server.json — server Express legacy
