# Pendientes de presencia digital (requieren imágenes)

## Alta prioridad

### 1. Open Graph images (og:image)
- Crear imagen de preview para compartir en redes sociales (1200x630px recomendado)
- Agregar `og:image` en `app/layout.tsx` metadata (imagen general del sitio)
- Agregar `og:image` por carrera en `app/carreras/[slug]/page.tsx` (usar imagen de portada del modal)
- Agregar `og:image` en páginas principales (FAQ, contacto, sobre-nosotros, clases-apoyo)
- Twitter cards ya están configuradas con `summary_large_image`, solo falta la imagen

## Prioridad media

### 2. Sitemap de imágenes
- Agregar imágenes al sitemap existente (`app/sitemap.ts`)
- Incluir imágenes de carreras, novedades y páginas estáticas
- Formato: `<image:image><image:loc>URL</image:loc></image:image>` dentro de cada `<url>`

## Prioridad baja

### 3. PWA — manifest e íconos
- Crear `public/manifest.json` con íconos en múltiples tamaños (192x192, 512x512)
- Necesita ícono del CAU en formato PNG cuadrado en esos tamaños
- Agregar `<link rel="manifest" href="/manifest.json">` en layout
- Opcional: service worker para cache offline

---

## Ya implementado (esta sesión)

- [x] Schema.org: EducationalOrganization + LocalBusiness en layout
- [x] Schema.org: FAQPage en /faq (dinámico desde Supabase)
- [x] Schema.org: Course en /carreras/[slug] (dinámico por carrera)
- [x] Twitter/X cards (estructura meta, falta og:image)
- [x] Keywords en todas las subpáginas
- [x] Skip-to-content link para accesibilidad
