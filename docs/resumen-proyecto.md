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
| Validación | A mano en el handler | — | Regex de email/teléfono y chequeos de forma en `/api/formularios`, sin librería |
| Tareas programadas | `pg_cron` (Supabase) | — | Limpieza de clases pasadas y digest diario de clicks |
| CAPTCHA | Cloudflare Turnstile | componente propio | `components/turnstile-widget.tsx`, verificación server-side en `lib/turnstile.ts` |
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

### Cuatro clientes según credencial y contexto

```tsx
// lib/supabase.ts — anon, lecturas públicas desde Server Components
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

Además: `lib/supabase-auth.ts` (anon + sesión en cookies, panel admin en el navegador), `lib/supabase-server.ts` (sesión en Server Components) y `lib/supabase-admin.ts` (service role con `import 'server-only'`, escrituras del público vía API). La tabla completa de cuál usar está en `CLAUDE.md`.

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

### Imágenes

- Las de novedades viven en el repo: `herramientas/generar-og.mjs` produce los derivados 1200×630 (foto limpia para `imagen_url` + versión con título para og:image) en `public/imagenes/`
- Storage de Supabase sólo para lo que sube el admin: bucket público `clases-apoyo` (flyers), URLs vía `getPublicUrl()`
- Dominio de Supabase en `next.config.ts` → `images.remotePatterns`

### Tablas principales

| Tabla | Uso |
|---|---|
| `carreras` | Catálogo de carreras con slides y metadata |
| `materias` | Materias de clases de apoyo |
| `clases_apoyo` | Calendario de clases |
| `solicitudes_clase` | Turnos pedidos por el público |
| `consultas` | Formulario de inscripción/consulta |
| `faq_preguntas` | Preguntas frecuentes (estado, orden, destacada) |
| `novedades` | Artículos de noticias (título, contenido HTML, slug, imagen) |
| `profesores` | Usuarios del panel (estado, rol) |

Infraestructura sin acceso público (sólo service role vía RPC): `form_rate_limits`, `career_clicks`.

---

## Tareas programadas

Sin GitHub Actions: los cron viven en `pg_cron` dentro de Supabase (limpieza de clases pasadas, digest diario de clicks a Telegram), programados a mano desde el SQL Editor — ver `sql/`. Las notificaciones de formulario salen por triggers de Postgres + `pg_net` hacia la Edge Function `notificar`.

**Patrón reutilizable**: para datos o avisos periódicos, preferir `pg_cron` + Edge Functions dentro de Supabase antes que un runner externo — no necesita secrets fuera de la base ni repo con CI.

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
| `migracion` | Auditar estado de migración HTML → Next.js |
| `frontend-design` | Diseño de interfaces premium |
| `seo-audit` | Auditoría SEO |
| `webapp-testing` | Testing con Playwright |
| `brainstorming` | Exploración de ideas antes de implementar |

### MCP Servers usados

- **Google Search Console** (`gsc`) — el único configurado hoy: analytics de búsqueda, inspección de URLs, sitemaps. Supabase y Vercel se operan por sus CLIs (`npx supabase`, `npx vercel`), ya autenticadas.

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
SUPABASE_SERVICE_ROLE_KEY=  # solo server-side (marcada Sensitive en Vercel)
```

---

## Lecciones aprendidas

1. **Server Components primero** — hacer fetch en el server, pasar props al client. Evita waterfalls y expone menos al cliente.
2. **Supabase sin ORM** — el SDK es suficiente para CRUD. No agregar Prisma/Drizzle salvo que haya migraciones complejas.
3. **ISR > SSR** — `revalidate = 3600` para datos que cambian pocas veces al día. `force-dynamic` solo cuando es imprescindible.
4. **Tailwind v4 + CSS variables** — las variables permiten theming sin config extra de Tailwind. Usar `style={{ color: 'var(--color-highlight)' }}` para valores dinámicos.
5. **Sitemap dinámico** — genera todas las URLs desde Supabase en build/revalidation. Google indexa mejor con sitemap completo.
6. **Cron dentro de Supabase** — `pg_cron` + Edge Functions cubren limpiezas y avisos periódicos sin runner externo ni secrets duplicados.
7. **Skills de Claude Code** — crear skills custom para operaciones repetitivas (cargar datos, auditar, sincronizar). Ahorran contexto y estandarizan procesos.
8. **CSP desde el inicio** — configurar Content Security Policy temprano evita problemas cuando se agregan terceros.
9. **Imágenes en Supabase Storage** — formato `.webp`, tamaño OG (1200×630), bucket público. Configurar `remotePatterns` en Next.js.
10. **No over-engineer** — sin state management global (Zustand), sin UI library (shadcn), sin ORM. Agregar solo cuando la complejidad lo justifique.
