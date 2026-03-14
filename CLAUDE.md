# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Website for **Universidad Siglo 21 - CAU Villa Lugano**, a distance learning university center. Showcases academic programs and facilitates student enrollments.

## Commands

```bash
# Development
npm run dev              # Next.js dev server (hot reload)

# Production
npm run build            # Next.js production build
npm start                # Serve production build

# Legacy Express server (separate tsconfig)
npm run server:build     # tsc -p tsconfig.server.json
npm run server:start     # node dist/server.js
npm run server:dev       # ts-node src/server.ts
```

No test runner or linter is configured.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss` + CSS custom properties
- **Database:** Supabase (PostgreSQL) — client in `lib/supabase.ts`
- **Validation:** Zod (schemas in `src/schemas.ts`, used by legacy Express routes)
- **Analytics:** Vercel Analytics, Speed Insights, Google Analytics (via `@next/third-parties`)
- **PDF:** jsPDF + jspdf-autotable
- **CAPTCHA:** react-turnstile
- **Fonts:** Inter (body), Unbounded (headings) — loaded via `next/font/google`
- **Language:** All UI text and code comments are in Spanish (es-AR)

## Architecture

### App Router Structure

Pages are React Server Components that fetch data from Supabase at request/revalidation time:

- `app/page.tsx` — Home: careers catalog + enrollment form. Fetches from `carreras` table. Uses `revalidate = 3600`.
- `app/faq/page.tsx` — FAQ. Fetches from `faq_preguntas` table.
- `app/clases-apoyo/page.tsx` — Support classes. Fetches from `materias` table. Uses `dynamic = 'force-dynamic'`.
- `app/clases-apoyo/[materia]/page.tsx` — Individual subject page.
- `app/novedades/[page]/page.tsx` — News (stub, pending Supabase migration).
- `app/contactos/page.tsx`, `app/sobre-nosotros/page.tsx` — Static content pages.
- `app/api/carreras/route.ts`, `app/api/novedades/route.ts` — API stubs (return 501, pending migration).

### Component Organization

- `components/navbar.tsx` — Client component (`'use client'`), shared via `app/layout.tsx`
- `components/index/` — Home page components: `hero.tsx`, `careers-catalog.tsx`, `enrollment-form.tsx`, `career-modal.tsx`, `carousel-modal.tsx`, `abogacia-modal.tsx`, `footer.tsx`, `types.ts`
- `components/clases-apoyo/` — Support classes components
- `components/faq-page.tsx` — FAQ client component
- `components/scroll-to-top.tsx` — Scroll utilities
- `components/construction-page.tsx` — "Under construction" placeholder
- `components/icons.tsx` — SVG icon components

### Data Flow

Server Components fetch from Supabase and pass data as props to Client Components. Key tables:
- `carreras` — academic programs (type defined in `components/index/types.ts`)
- `faq_preguntas` — FAQ entries
- `materias` — support class subjects

### Layout

`app/layout.tsx` provides: fonts, `<Navbar />`, scroll-to-top, analytics. Per-page CSS is imported directly in each page file (e.g., `app/index.css`, `app/faq/faq.css`).

### Color Scheme (CSS Variables)

Defined in `app/globals.css` `:root`:

| Variable | Value | Usage |
|---|---|---|
| `--color-deep-dark-bg` | `#013729` | Page background |
| `--color-card-bg` | `#1c2f31` | Card backgrounds |
| `--color-highlight` | `#00c7b1` | Primary accent (teal) |
| `--color-secondary-highlight` | `#48b3a4` | Secondary accent |
| `--color-text-light` | `#7ca19b` | Muted text |
| `--color-gold` | `#e69b05` | Gold accent |
| `--cau-brand-blue` | `#005587` | Brand blue |
| `--cau-brand-green` | `#058c70` | Brand green |

### Path Alias

`@/*` maps to project root (configured in `tsconfig.json`). Use `@/components/...`, `@/lib/...`, etc.

### Migration State

The project migrated from static HTML + Express to Next.js. Legacy files live in `migracion_pendiente/`. The Express server (`src/server.ts`) and Zod schemas (`src/schemas.ts`) are still present but the main app runs on Next.js. See `MIGRACION.md` for tracking.

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `NEXT_PUBLIC_GA_ID` — Google Analytics ID (optional)
