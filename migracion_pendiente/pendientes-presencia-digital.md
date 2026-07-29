# Pendientes de presencia digital (requieren imágenes)

## Prioridad media

### 1. Sitemap de imágenes
- Agregar imágenes al sitemap existente (`app/sitemap.ts`)
- Incluir imágenes de carreras, novedades y páginas estáticas
- Formato: `<image:image><image:loc>URL</image:loc></image:image>` dentro de cada `<url>`

## Prioridad baja

### 2. PWA — manifest e íconos
- Crear `public/manifest.json` con íconos en múltiples tamaños (192x192, 512x512)
- Necesita ícono del CAU en formato PNG cuadrado en esos tamaños
- Agregar `<link rel="manifest" href="/manifest.json">` en layout
- Opcional: service worker para cache offline

---

## Ya implementado

- [x] Schema.org: EducationalOrganization + LocalBusiness en layout
- [x] Schema.org: FAQPage en /faq (dinámico desde Supabase)
- [x] Schema.org: Course en /carreras/[slug] (dinámico por carrera)
- [x] Twitter/X cards con `summary_large_image`
- [x] Keywords en todas las subpáginas
- [x] Skip-to-content link para accesibilidad
- [x] **Open Graph images (29/07/2026)**: 23 imágenes de 1200×630 generadas con `herramientas/generar-og.mjs`, fallback global en `app/layout.tsx`, portada propia por carrera (Identidad Argentina y Teclab con marca del convenio) y por artículo de novedades. `/faq`, que declaraba su propio `openGraph` sin `images`, se corrigió el 29/07: ahora lleva `default.jpg` explícita y `summary_large_image`.
