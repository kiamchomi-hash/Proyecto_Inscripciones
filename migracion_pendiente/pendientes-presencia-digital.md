# Pendientes de presencia digital (requieren imágenes)

## Prioridad baja

### 1. PWA — manifest e íconos
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
- [x] **Sitemap de imágenes (29/07/2026)**: `app/sitemap.ts` declara la imagen que cada página realmente muestra — el hero de cada ficha de carrera (foto Teclab o portada de los slides, sin el fallback genérico), la foto limpia de cada artículo (`imagen_url`, no la og compuesta con título) y las dos de `/sobre-nosotros` (entrada + logo del CAU). Las rutas con espacios/acentos van percent-encodeadas vía `new URL()`. Expectativa medida en GSC antes de hacerlo: Google Imágenes trajo ~90 impresiones y 0 clicks en 3 meses (casi todo búsquedas del logo), así que es una mejora de costo cero, no una apuesta de tráfico.
