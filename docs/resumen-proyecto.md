# Resumen del Proyecto — CAU Villa Lugano

Documento de referencia para reutilizar patrones, stack y decisiones en futuros proyectos.

---

## Stack principal

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework | Next.js (App Router) | 16 | React Server Components por defecto |
| UI | React | 19 | `use client` solo donde hay interactividad |
| Estilos | Tailwind CSS v4 | via `@tailwindcss/postcss` | CSS custom properties para colores de marca |
| Base de datos | Supabase (PostgreSQL) | SDK v2 | Client en `lib/supabase.ts`, sin ORM |
| Hosting | Vercel | — | Deploy automático desde `main` |
| Analytics | Vercel Analytics + Speed Insights + Google Analytics | — | GA via `@next/third-parties` |
| Validación | Zod | v4 | Schemas tipados para datos de formularios |
| CI/CD | GitHub Actions | — | Cron diario para sync de datos externos |
| CAPTCHA | Cloudflare Turnstile | via `react-turnstile` | Invisible, verificación server-side |
| PDF | jsPDF + jspdf-autotable | — | Generación client-side de documentos |
| Email | Resend | — | Envío transaccional desde API routes |
| Tipografía | Inter (body) + Unbounded (headings) | — | `next/font/google`, sin request externo |

---

## Arquitectura — Patrones clave

### 1. Server Components + Client Components

```
app/page.tsx (Server Component)
  └── fetch de Supabase
  └── pasa data como props a →
      components/index/careers-catalog.tsx ('use client')
```

**Regla**: el Server Component hace el fetch y el Client Component maneja la interactividad (modales, filtros, formularios). Nunca fetch desde `'use client'`.

### 2. Revalidación

```tsx
// Página que cambia poco — ISR cada 1h
export const revalidate = 3600;

// Página que necesita datos frescos
export const dynamic = 'force-dynamic';
```

### 3. Rutas dinámicas con `generateStaticParams`

```tsx
// app/carreras/[slug]/page.tsx
export async function generateStaticParams() {
  const { data } = await supabase.from('carreras').select('nombre, prefix').eq('activa', true);
  return (data ?? []).map(c => ({ slug: carreraToSlug(c) }));
}
```

Pre-renderiza todas las rutas conocidas en build time. Nuevas rutas se generan on-demand y se cachean.

### 4. Layout global

`app/layout.tsx` provee:
- Fonts (variables CSS `--font-inter`, `--font-unbounded`)
- `<Navbar />` compartido
- Scroll-to-top
- Analytics (GA, Vercel Analytics, Speed Insights)
- Schema.org JSON-LD (WebSite + EducationalOrganization)
- Skip link de accesibilidad

### 5. Organización de componentes

```
components/
  navbar.tsx                    # Global, client component
  scroll-to-top.tsx             # Global
  icons.tsx                     # SVG reutilizables
  index/                        # Home page
    hero.tsx
    careers-catalog.tsx
    enrollment-form.tsx
    career-modal.tsx
    carousel-modal.tsx
    footer.tsx
    types.ts                    # Tipos + helpers (carreraToSlug, etc.)
  clases-apoyo/                 # Feature-specific
  novedades/                    # Feature-specific
  faq-page.tsx
  contacto/
```

**Convención**: una carpeta por feature/página, `types.ts` local si hay tipos compartidos entre componentes de esa feature.

---

## SEO implementado

| Feature | Archivo | Detalle |
|---|---|---|
| Metadata global | `app/layout.tsx` | `metadataBase`, Open Graph, Twitter, favicon, verificación Google |
| Metadata por página | Cada `page.tsx` | `title`, `description`, `canonical`, OG/Twitter donde aplica |
| `generateMetadata` dinámica | `app/novedades/articulo/[slug]/page.tsx` | Título e imagen OG desde Supabase |
| Sitemap dinámico | `app/sitemap.ts` | Genera URLs de: páginas estáticas, carreras, materias, novedades (listado + artículos individuales) |
| robots.txt | `app/robots.ts` | Permite `/`, bloquea `/api/`, `/admin/`, `/migracion_pendiente/` |
| Schema.org JSON-LD | `app/layout.tsx` (global) + `app/faq/page.tsx` (FAQPage) | Structured data para Google |
| Redirects | `next.config.ts` | non-www → www, legacy `.html` → clean URLs |
| Canonical URLs | Cada página | `alternates.canonical` |

### Template de metadata por página

```tsx
export const metadata: Metadata = {
  title: 'Nombre de Página',
  description: 'Descripción breve...',
  alternates: { canonical: '/ruta' },
  openGraph: {
    title: 'Nombre — Sitio',
    description: '...',
    url: '/ruta',
    siteName: 'Nombre del Sitio',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Nombre — Sitio',
    description: '...',
  },
};
```

---

## Estilos — Sistema de diseño

### CSS Variables (dark theme)

```css
:root {
  --color-deep-dark-bg: #013729;    /* Fondo principal */
  --color-card-bg: #1c2f31;         /* Cards */
  --color-highlight: #00c7b1;       /* Acento primario (teal) */
  --color-secondary-highlight: #48b3a4;
  --color-text-light: #7ca19b;      /* Texto secundario */
  --color-gold: #e69b05;            /* Acento dorado */
}
```

### Enfoque de estilos

- **Tailwind utilities** para todo lo posible
- **CSS custom properties** para colores de marca (compartidos entre Tailwind y CSS puro)
- **CSS por página** (`app/index.css`, `app/faq/faq.css`) para estilos muy específicos
- **`globals.css`**: solo reset, texturas de fondo (grain, suede, aurora) y variables
- **Sin librerías de componentes** (ni daisyUI ni shadcn/ui) — todo custom con Tailwind

### Texturas de fondo

Clases CSS custom para fondos premium: `.grain-overlay`, `.texture-suede`, `.texture-petroleum`, `.texture-graphite`, `.texture-aurora`, `.texture-forest`. Se aplican a secciones con `className`.

---

## Seguridad

### Content Security Policy

Configurada en `next.config.ts` → `headers()`:
- `script-src`: self + Cloudflare Turnstile + Google Tag Manager + Vercel scripts
- `img-src`: self + Supabase Storage + Unsplash
- `connect-src`: self + Supabase + GA + Vercel + Turnstile
- `frame-src`: Turnstile + Google Maps embeds

### Protección de rutas

- `/admin/*` — páginas internas, bloqueadas en `robots.txt`
- `/api/*` — bloqueado en `robots.txt`
- CAPTCHA en formularios públicos

---

## Supabase — Patrones

### Client único

```tsx
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Fetch pattern en Server Components

```tsx
const { data, error } = await supabase
  .from('tabla')
  .select('col1, col2')
  .eq('activa', true)
  .order('orden', { ascending: true })
  .limit(10);

const items = data ?? [];
```

### Storage (imágenes)

- Bucket público `novedades` para imágenes de artículos
- Formato `.webp`, 1200×630px, ratio 1.91:1 (óptimo para OG)
- URLs vía `supabase.storage.from('novedades').getPublicUrl()`
- Dominio en `next.config.ts` → `images.remotePatterns`

### Tablas principales

| Tabla | Uso |
|---|---|
| `carreras` | Catálogo de carreras con slides, precios, metadata |
| `faq_preguntas` | Preguntas frecuentes (estado, orden, destacada) |
| `materias` | Materias de clases de apoyo |
| `novedades` | Artículos de noticias (título, contenido HTML, slug, imagen) |
| `precios_carreras` | Precios por carrera y período |
| `precios_meta` | Metadata de sync de precios |
| `descuentos` | Descuentos sede y especiales |
| `inscripciones` | Formulario de inscripción |

---

## GitHub Actions

### Sync automático de datos (`sync-precios.yml`)

- **Trigger**: cron diario a las 8:00 AM Argentina (11:00 UTC)
- **Qué hace**: descarga Excel de precios de Siglo 21, parsea con ExcelJS, sube a Supabase
- **Secrets necesarios**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Patrón reutilizable**: para cualquier dato externo que cambie periódicamente, crear un script Node que parsee la fuente y lo suba a Supabase, triggereado por cron de GitHub Actions.

---

## Vercel — Configuración

### `next.config.ts` highlights

```ts
experimental: {
  optimizePackageImports: ['jspdf', 'jspdf-autotable', '@supabase/supabase-js'],
},
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'tu-proyecto.supabase.co' }],
},
```

- **Redirects**: legacy `.html` → clean URLs, non-www → www
- **Headers**: CSP global

---

## Claude Code — Skills custom utilizadas

| Skill | Propósito |
|---|---|
| `cau_brand` | Recursos visuales de marca (colores, logo, tipografía) |
| `cau_design_patterns` | Patrones de diseño del sitio |
| `cargar_carrera` | Cargar nueva carrera en Supabase con slides |
| `sync_descuentos` | Sincronizar descuentos especiales desde Excel |
| `/migracion` | Auditar estado de migración HTML → Next.js |
| `frontend-design` | Diseño de interfaces premium |
| `seo-audit` | Auditoría SEO |
| `webapp-testing` | Testing con Playwright |
| `brainstorming` | Exploración de ideas antes de implementar |

### MCP Servers usados

- **Supabase** — queries SQL, migraciones, edge functions, tipos TypeScript
- **Vercel** — deploy, dominios, configuración de proyecto
- **GitHub** — PRs, issues, code search
- **Google Search Console** — analytics de búsqueda, inspección de URLs, sitemaps
- **Brave Search** — búsqueda web para investigación
- **Context7** — documentación actualizada de librerías

---

## Checklist para nuevo proyecto similar

### Setup inicial

- [ ] `npx create-next-app@latest` con App Router + TypeScript + Tailwind
- [ ] Supabase: crear proyecto, configurar tablas, RLS policies
- [ ] Vercel: conectar repo, configurar dominio, env vars
- [ ] `next.config.ts`: CSP headers, image domains, redirects
- [ ] `app/layout.tsx`: fonts, metadata global, OG, JSON-LD, analytics
- [ ] `app/globals.css`: variables CSS de marca, reset mínimo

### SEO desde día 1

- [ ] `metadataBase` en layout
- [ ] `app/sitemap.ts` dinámico
- [ ] `app/robots.ts`
- [ ] Canonical URLs en cada página
- [ ] Open Graph + Twitter cards
- [ ] Schema.org JSON-LD
- [ ] Google Search Console: verificar propiedad, enviar sitemap

### Estructura de archivos

```
app/
  layout.tsx
  page.tsx
  globals.css
  sitemap.ts
  robots.ts
  not-found.tsx
  [feature]/
    page.tsx
    [slug]/page.tsx
  api/
    [endpoint]/route.ts
components/
  navbar.tsx
  footer.tsx
  [feature]/
    component.tsx
    types.ts
lib/
  supabase.ts
public/
  favicon.ico
  imagenes/
```

### Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GA_ID=
SUPABASE_SERVICE_ROLE_KEY=  # solo server-side / GitHub Actions
```

---

## Lecciones aprendidas

1. **Server Components primero** — hacer fetch en el server, pasar props al client. Evita waterfalls y expone menos al cliente.
2. **Supabase sin ORM** — el SDK es suficiente para CRUD. No agregar Prisma/Drizzle salvo que haya migraciones complejas.
3. **ISR > SSR** — `revalidate = 3600` para datos que cambian pocas veces al día. `force-dynamic` solo cuando es imprescindible.
4. **Tailwind v4 + CSS variables** — las variables permiten theming sin config extra de Tailwind. Usar `style={{ color: 'var(--color-highlight)' }}` para valores dinámicos.
5. **Sitemap dinámico** — genera todas las URLs desde Supabase en build/revalidation. Google indexa mejor con sitemap completo.
6. **GitHub Actions para datos externos** — cualquier Excel, API o scraping se automatiza con cron + script Node + Supabase upsert.
7. **Skills de Claude Code** — crear skills custom para operaciones repetitivas (cargar datos, auditar, sincronizar). Ahorran contexto y estandarizan procesos.
8. **CSP desde el inicio** — configurar Content Security Policy temprano evita problemas cuando se agregan terceros.
9. **Imágenes en Supabase Storage** — formato `.webp`, tamaño OG (1200×630), bucket público. Configurar `remotePatterns` en Next.js.
10. **No over-engineer** — sin state management global (Zustand), sin UI library (shadcn), sin ORM. Agregar solo cuando la complejidad lo justifique.
