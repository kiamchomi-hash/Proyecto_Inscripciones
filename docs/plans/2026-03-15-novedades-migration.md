# Novedades Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the legacy novedades (news) section from static HTML + vanilla JS to Next.js App Router with Supabase, preserving the exact visual layout and adding dynamic pagination.

**Architecture:** Server Component (`app/novedades/[page]/page.tsx`) fetches paginated data from Supabase table `novedades` and passes it to a Client Component (`components/novedades/novedades-page.tsx`). Page 1 uses a hero layout (1 pinned card left + 3 sub cards right). Pages 2+ use a 2×3 grid of sub cards (6 per page). If a page has fewer than 6 items, the grid maintains its structure with empty slots. Pagination is rendered with First/Prev/numbers/Next/Last. CRUD is managed via Supabase dashboard.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (PostgreSQL), Tailwind CSS v4, CSS custom properties.

**Layout rules:**
- Page 1: pinned card (the most recent with `fijada = true`) on the left + 3 sub cards on the right = 4 items total
- Pages 2+: 6 sub cards in a 2-column × 3-row grid
- Grid maintains structure even with fewer than 6 items (min-height on columns)
- If items exceed 6 per page, a new pagination page is created automatically
- Total pages = `1 + ceil((total_items - items_page_1) / 6)`

---

### Task 1: Create Supabase table `novedades`

**Files:**
- Migration via Supabase MCP tool

**Step 1: Create the table**

```sql
CREATE TABLE novedades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  extracto TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tag TEXT NOT NULL DEFAULT 'Institucional',
  imagen_url TEXT,
  href TEXT DEFAULT '#',
  fijada BOOLEAN NOT NULL DEFAULT FALSE,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for the main query pattern: active items ordered by pinned first, then date
CREATE INDEX idx_novedades_activa_fecha ON novedades (activa, fijada DESC, fecha DESC);

-- Enable RLS
ALTER TABLE novedades ENABLE ROW LEVEL SECURITY;

-- Public read policy (anon key can read active novedades)
CREATE POLICY "Novedades are publicly readable"
  ON novedades FOR SELECT
  USING (activa = TRUE);
```

**Step 2: Seed with data from legacy JSON**

Insert the pinned item and all 57 news items from `migracion_pendiente/novedades_data.json`. The pinned item gets `fijada = true`. All items get `activa = true`. Use the existing `date`, `title`, `tag`, `href`, and `img` (as `imagen_url`) fields.

```sql
-- Pinned item
INSERT INTO novedades (titulo, extracto, fecha, tag, href, imagen_url, fijada)
VALUES (
  'Inscripciones Abiertas: Primer Semestre 2026',
  'Ya podés inscribirte para el primer semestre. Conocé toda la oferta académica disponible y asegurá tu lugar en la universidad.',
  '2026-02-13',
  'Institucional',
  '/',
  NULL,
  TRUE
);

-- Rest of items (fijada = FALSE by default)
INSERT INTO novedades (titulo, fecha, tag, href, imagen_url) VALUES
  ('Charla Informativa Online este Jueves', '2026-02-10', 'Evento', '#', NULL),
  ('Beneficios por Pago Anticipado de Matrícula', '2026-02-06', 'Aviso', '#', NULL),
  ('Nuevas Carreras Disponibles en Modalidad a Distancia', '2026-01-28', 'Académico', '#', NULL),
  ('Taller Gratuito de Orientación Vocacional', '2026-01-20', 'Evento', '#', NULL),
  ('Renovación del Convenio con Empresas Asociadas', '2026-01-15', 'Institucional', '#', NULL),
  ('Calendario Académico 2026 Disponible', '2026-01-10', 'Académico', '#', NULL),
  ('Resultados de Exámenes Finales Diciembre 2025', '2025-12-28', 'Académico', '#', NULL),
  ('Cierre Administrativo por Fiestas', '2025-12-20', 'Aviso', '#', NULL),
  ('Acto de Colación Diciembre 2025', '2025-12-15', 'Evento', '#', NULL),
  ('Nuevo Laboratorio de Informática Inaugurado', '2025-12-10', 'Institucional', '#', NULL),
  ('Becas Disponibles para Ingresantes 2026', '2025-12-01', 'Aviso', '#', NULL),
  ('Semana de la Ciencia en el CAU', '2025-11-25', 'Evento', '#', NULL),
  ('Encuesta de Satisfacción Estudiantil 2025', '2025-11-18', 'Institucional', '#', NULL),
  ('Jornada de Puertas Abiertas Noviembre', '2025-11-10', 'Evento', '#', NULL),
  ('Nuevos Horarios de Atención Administrativa', '2025-11-05', 'Aviso', '#', NULL),
  ('Convenio con Municipalidad de CABA', '2025-10-28', 'Institucional', '#', NULL),
  ('Taller de Redacción Académica', '2025-10-20', 'Académico', '#', NULL),
  ('Resultados Parciales Segundo Cuatrimestre', '2025-10-15', 'Académico', '#', NULL),
  ('Feria del Libro Universitario en el CAU', '2025-10-08', 'Evento', '#', NULL),
  ('Programa de Tutorías para Ingresantes', '2025-10-01', 'Académico', '#', NULL),
  ('Charla sobre Salida Laboral en Tecnología', '2025-09-25', 'Evento', '#', NULL),
  ('Ampliación del Horario de Biblioteca', '2025-09-18', 'Aviso', '#', NULL),
  ('Concurso de Ensayos Universitarios 2025', '2025-09-12', 'Académico', '#', NULL),
  ('Nuevo Sistema de Gestión de Trámites Online', '2025-09-05', 'Institucional', '#', NULL),
  ('Semana del Estudiante: Actividades Especiales', '2025-09-01', 'Evento', '#', NULL),
  ('Inscripciones Abiertas: Segundo Semestre 2025', '2025-08-25', 'Institucional', '#', NULL),
  ('Workshop de Marketing Digital Gratuito', '2025-08-18', 'Evento', '#', NULL),
  ('Resultados de Exámenes Finales Julio 2025', '2025-08-10', 'Académico', '#', NULL),
  ('Receso Invernal: Fechas y Horarios', '2025-07-28', 'Aviso', '#', NULL),
  ('Acto de Colación Julio 2025', '2025-07-20', 'Evento', '#', NULL),
  ('Nuevo Espacio de Coworking para Estudiantes', '2025-07-12', 'Institucional', '#', NULL),
  ('Charla Informativa: Carreras de Salud', '2025-07-05', 'Evento', '#', NULL),
  ('Descuentos Especiales para Familiares de Alumnos', '2025-06-28', 'Aviso', '#', NULL),
  ('Jornada de Networking Profesional', '2025-06-20', 'Evento', '#', NULL),
  ('Actualización del Plan de Estudios de Abogacía', '2025-06-15', 'Académico', '#', NULL),
  ('Mesa de Exámenes Extraordinaria Junio', '2025-06-08', 'Académico', '#', NULL),
  ('Convenio con Cámara de Comercio Local', '2025-06-01', 'Institucional', '#', NULL),
  ('Taller de Oratoria y Presentación', '2025-05-25', 'Evento', '#', NULL),
  ('Beca al Mérito Académico: Convocatoria Abierta', '2025-05-18', 'Aviso', '#', NULL),
  ('Resultados Parciales Primer Cuatrimestre', '2025-05-10', 'Académico', '#', NULL),
  ('Día del Trabajador: Sin Actividad Administrativa', '2025-05-01', 'Aviso', '#', NULL),
  ('Charla sobre Inteligencia Artificial en Educación', '2025-04-25', 'Evento', '#', NULL),
  ('Nuevas Aulas Virtuales Disponibles', '2025-04-18', 'Institucional', '#', NULL),
  ('Sorteo de Notebooks entre Ingresantes', '2025-04-10', 'Evento', '#', NULL),
  ('Semana Santa: Horarios Especiales', '2025-04-05', 'Aviso', '#', NULL),
  ('Programa de Pasantías con Empresas Líderes', '2025-03-28', 'Institucional', '#', NULL),
  ('Taller de Emprendedurismo para Alumnos', '2025-03-20', 'Evento', '#', NULL),
  ('Inicio de Clases Primer Cuatrimestre 2025', '2025-03-15', 'Académico', '#', NULL),
  ('Feria de Carreras: Conocé tu Vocación', '2025-03-08', 'Evento', '#', NULL),
  ('Renovación de Infraestructura del CAU', '2025-03-01', 'Institucional', '#', NULL),
  ('Inscripciones Abiertas: Primer Semestre 2025', '2025-02-20', 'Institucional', '#', NULL),
  ('Calendario Académico 2025 Publicado', '2025-02-10', 'Académico', '#', NULL),
  ('Charla de Bienvenida para Nuevos Estudiantes', '2025-02-05', 'Evento', '#', NULL),
  ('Resultados de Exámenes Finales Diciembre 2024', '2025-01-28', 'Académico', '#', NULL),
  ('Cierre Administrativo Enero 2025', '2025-01-15', 'Aviso', '#', NULL),
  ('Resumen del Año Académico 2024', '2025-01-05', 'Institucional', '#', NULL),
  ('Acto de Colación Diciembre 2024', '2024-12-18', 'Evento', '#', NULL);
```

**Step 3: Verify data**

```sql
SELECT COUNT(*) FROM novedades WHERE activa = TRUE;
-- Expected: 58 (1 pinned + 57 items)

SELECT COUNT(*) FROM novedades WHERE fijada = TRUE;
-- Expected: 1
```

---

### Task 2: Create CSS file `app/novedades/novedades.css`

**Files:**
- Create: `app/novedades/novedades.css`

**Step 1: Write the CSS**

Only include styles that Tailwind cannot handle (transitions, complex hover states, pseudo-elements). Cards use Tailwind utilities for layout, spacing, and typography. CSS handles:

- `news-card` hover effects (border-color + box-shadow + transform transition)
- `news-placeholder` pattern (diagonal stripes + radial glow via `::before`/`::after`)
- `news-animate` entrance animation (`fadeSlideUp` keyframes with staggered delays)
- Pagination button transitions
- Mobile responsiveness overrides

```css
/* ── Novedades — Solo estilos que NO se pueden hacer con Tailwind ── */

/* Entrance animation */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.news-animate {
  opacity: 0;
  animation: fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.news-animate--d1 { animation-delay: 0.08s; }
.news-animate--d2 { animation-delay: 0.18s; }
.news-animate--d3 { animation-delay: 0.28s; }
.news-animate--d4 { animation-delay: 0.38s; }
.news-animate--d5 { animation-delay: 0.48s; }
.news-animate--d6 { animation-delay: 0.58s; }

/* Card hover */
.news-card {
  transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
}
.news-card:hover {
  border-color: rgba(0, 199, 177, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 199, 177, 0.1);
  transform: translateY(-3px);
}
.news-card:hover .news-card__title {
  color: var(--color-highlight);
}
.news-card:hover .news-card__img img {
  transform: scale(1.05);
}
.news-card:hover .news-tag {
  background: rgba(0, 199, 177, 0.15);
  border-color: rgba(0, 199, 177, 0.35);
}

/* Image zoom transition */
.news-card__img img {
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Title color transition */
.news-card__title {
  transition: color 0.25s ease;
}

/* Tag transition */
.news-tag {
  transition: background 0.2s, border-color 0.2s;
}

/* Placeholder pattern */
.news-placeholder {
  position: relative;
  overflow: hidden;
  background: #0c2b24;
}
.news-placeholder::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 8px,
    rgba(0, 199, 177, 0.03) 8px,
    rgba(0, 199, 177, 0.03) 9px
  );
}
.news-placeholder::after {
  content: '';
  position: absolute;
  width: 60%;
  height: 60%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(0, 199, 177, 0.06) 0%, transparent 70%);
  border-radius: 50%;
}

/* Pagination buttons */
.page-btn {
  transition: all 0.25s ease;
}
.page-btn:hover {
  color: white;
  background: rgba(0, 199, 177, 0.2);
  border-color: rgba(0, 199, 177, 0.5);
}
.page-btn--nav:hover svg {
  transform: translateX(2px);
}
.page-btn--back:hover svg {
  transform: translateX(-2px);
}
.page-btn--nav svg {
  transition: transform 0.2s ease;
}

/* Mobile pagination: hide nav text, keep icons */
@media (max-width: 767px) {
  .page-btn--nav span {
    display: none;
  }
}
```

---

### Task 3: Create Client Component `components/novedades/novedades-page.tsx`

**Files:**
- Create: `components/novedades/novedades-page.tsx`

**Step 1: Write the component**

The component receives all data as props from the Server Component: the pinned novedad (if page 1), the page items, current page number, and total pages.

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

/* ── Types ── */
export interface Novedad {
  id: string;
  titulo: string;
  extracto: string | null;
  fecha: string;
  tag: string;
  imagen_url: string | null;
  href: string;
  fijada: boolean;
}

interface Props {
  pinned: Novedad | null;       // only on page 1
  items: Novedad[];             // 3 items on page 1, up to 6 on pages 2+
  currentPage: number;
  totalPages: number;
}

/* ── Helpers ── */
function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ImagePlaceholder({ tall }: { tall?: boolean }) {
  return (
    <div className={`news-placeholder flex items-center justify-center w-full ${tall ? 'min-h-[280px]' : 'min-h-full'}`}>
      <svg className={`${tall ? 'w-14 h-14' : 'w-8 h-8'} relative z-10`} style={{ color: 'rgba(72,179,164,0.2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

/* ── Pinned Hero Card (page 1 left) ── */
function PinnedCard({ item }: { item: Novedad }) {
  return (
    <a
      href={item.href}
      className="news-card news-card--main group block rounded-xl overflow-hidden news-animate news-animate--d1 flex flex-col h-full md:h-[520px]"
      style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.06)' }}
    >
      <div className="relative flex-shrink-0 h-[220px] overflow-hidden">
        {item.imagen_url ? (
          <Image src={item.imagen_url} alt="" fill className="object-cover" />
        ) : (
          <ImagePlaceholder tall />
        )}
        <div
          className="absolute top-4 left-4 z-[3] inline-flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-widest px-3 py-1 rounded-md"
          style={{ color: '#013729', background: 'var(--color-highlight)', boxShadow: '0 2px 12px rgba(0,199,177,0.4)' }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
          Destacado
        </div>
      </div>
      <div className="flex-1 flex flex-col p-5 pb-6">
        <time className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <CalendarIcon />
          {formatDate(item.fecha)}
        </time>
        <h3 className="news-card__title text-[1.65rem] font-extrabold leading-[1.2] tracking-tight text-white">
          {item.titulo}
        </h3>
        {item.extracto && (
          <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {item.extracto}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3.5">
          <span className="news-tag text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ color: 'var(--color-highlight)', background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.18)' }}>
            {item.tag}
          </span>
        </div>
      </div>
    </a>
  );
}

/* ── Sub Card (page 1 right + pages 2+) ── */
function SubCard({ item, delay }: { item: Novedad; delay: number }) {
  return (
    <a
      href={item.href}
      className={`news-card group block rounded-xl overflow-hidden news-animate news-animate--d${delay} flex-1 min-h-0`}
      style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.06)' }}
    >
      <div className="flex flex-col md:flex-row h-full">
        <div className="w-full md:w-[38%] md:max-w-[200px] flex-shrink-0 overflow-hidden h-[140px] md:h-auto news-card__img">
          {item.imagen_url ? (
            <Image src={item.imagen_url} alt="" fill className="object-cover !relative" />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        <div className="flex-1 p-4 px-5 flex flex-col justify-center">
          <time className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold mb-2" style={{ color: 'var(--color-secondary-highlight)' }}>
            <CalendarIcon />
            {formatDate(item.fecha)}
          </time>
          <h3 className="news-card__title text-[0.9rem] font-extrabold leading-snug text-white">
            {item.titulo}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            <span className="news-tag text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ color: 'var(--color-highlight)', background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.18)' }}>
              {item.tag}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

/* ── Pagination ── */
function Pagination({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;

  const pageHref = (p: number) => p === 1 ? '/novedades/1' : `/novedades/${p}`;
  const prevPage = Math.max(1, current - 1);
  const nextPage = Math.min(total, current + 1);
  const isFirst = current === 1;
  const isLast = current === total;

  // Calculate visible page numbers (max 5 on desktop)
  const MAX_VISIBLE = 5;
  let rangeStart: number;
  let rangeEnd: number;

  if (total <= MAX_VISIBLE) {
    rangeStart = 1;
    rangeEnd = total;
  } else if (current < MAX_VISIBLE) {
    rangeStart = 1;
    rangeEnd = MAX_VISIBLE;
  } else {
    rangeStart = current - Math.floor(MAX_VISIBLE / 2);
    rangeEnd = rangeStart + MAX_VISIBLE - 1;
    if (rangeEnd > total) {
      rangeEnd = total;
      rangeStart = total - MAX_VISIBLE + 1;
    }
  }

  const pages = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => rangeStart + i);

  const btnBase = "inline-flex items-center justify-center min-w-9 h-9 px-2 text-sm font-bold rounded-md";
  const btnStyle = { color: '#d0e8e4', background: '#0a2e28', border: '1px solid rgba(0,199,177,0.25)' };
  const btnActive = { color: '#013729', background: 'var(--color-highlight)', borderColor: 'var(--color-highlight)' };
  const btnDisabled = "opacity-30 pointer-events-none";

  return (
    <nav className="flex items-center justify-center gap-0 flex-wrap mt-10 mb-6" aria-label="Paginación de novedades">
      {/* Primera */}
      <Link
        href={pageHref(1)}
        className={`page-btn page-btn--back ${btnBase} gap-1 text-xs uppercase tracking-wide px-3 mr-1 ${isFirst ? btnDisabled : ''}`}
        style={btnStyle}
        aria-label="Primera página"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" /></svg>
        <span>Primera</span>
      </Link>

      {/* Anterior */}
      <Link
        href={pageHref(prevPage)}
        className={`page-btn page-btn--back ${btnBase} gap-1 text-xs uppercase tracking-wide px-3 ${isFirst ? btnDisabled : ''}`}
        style={btnStyle}
        aria-label="Página anterior"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        <span>Ant.</span>
      </Link>

      {/* Números — ancho fijo para que los nav no salten */}
      <span className="inline-flex items-center justify-center gap-1 w-[14.5rem] max-[767px]:w-[8.75rem] max-[767px]:gap-0.5">
        {pages.map(p => (
          p === current ? (
            <span key={p} className={`page-btn page-btn--active ${btnBase} pointer-events-none`} style={{ ...btnStyle, ...btnActive }} aria-current="page">{p}</span>
          ) : (
            <Link key={p} href={pageHref(p)} className={`page-btn ${btnBase}`} style={btnStyle}>{p}</Link>
          )
        ))}
      </span>

      {/* Siguiente */}
      <Link
        href={pageHref(nextPage)}
        className={`page-btn page-btn--nav ${btnBase} gap-1 text-xs uppercase tracking-wide px-3 ${isLast ? btnDisabled : ''}`}
        style={btnStyle}
        aria-label="Página siguiente"
      >
        <span>Sig.</span>
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
      </Link>

      {/* Última */}
      <Link
        href={pageHref(total)}
        className={`page-btn page-btn--nav ${btnBase} gap-1 text-xs uppercase tracking-wide px-3 ml-1 ${isLast ? btnDisabled : ''}`}
        style={btnStyle}
        aria-label="Última página"
      >
        <span>Última</span>
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
      </Link>
    </nav>
  );
}

/* ── Main Component ── */
export default function NovedadesPage({ pinned, items, currentPage, totalPages }: Props) {
  const isPage1 = currentPage === 1;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.15)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-highlight)' }} />
          <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--color-highlight)' }}>
            Centro de Aprendizaje Universitario
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Novedades</h1>
      </div>

      {/* Top pagination (pages 2+) */}
      {!isPage1 && <Pagination current={currentPage} total={totalPages} />}

      {/* Content */}
      {isPage1 && pinned ? (
        /* ── PAGE 1: Hero layout ── */
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PinnedCard item={pinned} />
            <div className="flex flex-col gap-4">
              {items.map((item, i) => (
                <SubCard key={item.id} item={item} delay={i + 2} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* ── PAGES 2+: Grid layout (2 columns × 3 rows) ── */
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="flex flex-col gap-4 md:min-h-[520px]">
              {[0, 1, 2].map(i => (
                items[i] ? (
                  <SubCard key={items[i].id} item={items[i]} delay={(i % 4) + 1} />
                ) : (
                  <div key={`empty-l-${i}`} className="flex-1 min-h-0" />
                )
              ))}
            </div>
            {/* Right column */}
            <div className="flex flex-col gap-4 md:min-h-[520px]">
              {[3, 4, 5].map(i => (
                items[i] ? (
                  <SubCard key={items[i].id} item={items[i]} delay={((i) % 4) + 1} />
                ) : (
                  <div key={`empty-r-${i}`} className="flex-1 min-h-0" />
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom pagination */}
      <Pagination current={currentPage} total={totalPages} />
    </main>
  );
}
```

---

### Task 4: Update Server Component `app/novedades/[page]/page.tsx`

**Files:**
- Modify: `app/novedades/[page]/page.tsx`

**Step 1: Rewrite the page**

The server component:
1. Extracts the page number from params
2. Counts total active novedades to calculate total pages
3. Fetches the pinned novedad (page 1 only)
4. Fetches the page's items with offset/limit
5. Passes everything to the client component

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NovedadesPage from '@/components/novedades/novedades-page';
import type { Novedad } from '@/components/novedades/novedades-page';
import '../novedades.css';

const ITEMS_PAGE_1 = 3;    // sub cards on page 1 (pinned is separate)
const ITEMS_PER_PAGE = 6;  // cards on pages 2+

export const revalidate = 3600; // revalidate every hour

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const pageNum = parseInt(page, 10);
  const suffix = pageNum > 1 ? ` — Página ${pageNum}` : '';
  return {
    title: `Novedades${suffix}`,
    description: 'Últimas novedades del CAU Villa Lugano — Universidad Siglo 21.',
    alternates: { canonical: `/novedades/${page}` },
  };
}

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageNum = parseInt(page, 10);
  if (isNaN(pageNum) || pageNum < 1) notFound();

  // Count total active items (excluding pinned)
  const { count: totalCount } = await supabase
    .from('novedades')
    .select('id', { count: 'exact', head: true })
    .eq('activa', true)
    .eq('fijada', false);

  const total = totalCount ?? 0;
  const totalPages = 1 + Math.ceil(Math.max(0, total - ITEMS_PAGE_1) / ITEMS_PER_PAGE);

  if (pageNum > totalPages) notFound();

  let pinned: Novedad | null = null;
  let items: Novedad[] = [];

  if (pageNum === 1) {
    // Fetch pinned
    const { data: pinnedData } = await supabase
      .from('novedades')
      .select('id, titulo, extracto, fecha, tag, imagen_url, href, fijada')
      .eq('activa', true)
      .eq('fijada', true)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    pinned = pinnedData as Novedad | null;

    // Fetch first 3 non-pinned items
    const { data: itemsData } = await supabase
      .from('novedades')
      .select('id, titulo, extracto, fecha, tag, imagen_url, href, fijada')
      .eq('activa', true)
      .eq('fijada', false)
      .order('fecha', { ascending: false })
      .range(0, ITEMS_PAGE_1 - 1);

    items = (itemsData ?? []) as Novedad[];
  } else {
    // Pages 2+: offset from after page 1 items
    const offset = ITEMS_PAGE_1 + (pageNum - 2) * ITEMS_PER_PAGE;
    const { data: itemsData } = await supabase
      .from('novedades')
      .select('id, titulo, extracto, fecha, tag, imagen_url, href, fijada')
      .eq('activa', true)
      .eq('fijada', false)
      .order('fecha', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    items = (itemsData ?? []) as Novedad[];
  }

  return (
    <NovedadesPage
      pinned={pinned}
      items={items}
      currentPage={pageNum}
      totalPages={totalPages}
    />
  );
}
```

---

### Task 5: Clean up API route stub

**Files:**
- Modify: `app/api/novedades/route.ts`

**Step 1: Remove the 501 stub**

The API route is no longer needed since data is fetched directly in the Server Component. Delete the file or update it to proxy Supabase if needed in the future.

Delete `app/api/novedades/route.ts` (the data is fetched server-side, no API route needed).

---

### Task 6: Verify build and test manually

**Step 1: Run dev server**

```bash
npm run dev
```

**Step 2: Test page 1**

Navigate to `http://localhost:3000/novedades/1`:
- Verify pinned card appears on the left with "Destacado" badge
- Verify 3 sub cards appear on the right
- Verify pagination shows at bottom with correct page count
- Verify page 1 has no top pagination

**Step 3: Test page 2**

Navigate to `http://localhost:3000/novedades/2`:
- Verify 6 sub cards in 2×3 grid
- Verify top pagination appears
- Verify grid maintains structure

**Step 4: Test last page (partial)**

Navigate to the last page:
- Verify fewer than 6 items still maintain grid structure (empty slots keep spacing)
- Verify "Sig." and "Última" buttons are disabled

**Step 5: Test 404**

Navigate to `http://localhost:3000/novedades/999`:
- Verify 404 page appears

**Step 6: Run production build**

```bash
npm run build
```

Expected: no errors.

**Step 7: Commit**

```bash
git add app/novedades/ components/novedades/ app/api/novedades/
git commit -m "feat: migrate novedades section to Next.js + Supabase

- Create novedades table with RLS and seed 58 items
- Server component with pagination (4 items page 1, 6 per page after)
- Client component with hero layout (page 1) and grid layout (pages 2+)
- Pagination with First/Prev/numbers/Next/Last
- Remove unused API route stub"
```

---

### Notes for Supabase Dashboard CRUD

Once deployed, novedades are managed via the Supabase dashboard:

- **Add:** Insert row with `titulo`, `fecha`, `tag`. Set `fijada = true` to pin (only one should be pinned at a time).
- **Edit:** Update any field directly in the table editor.
- **Delete:** Set `activa = false` (soft delete) or delete the row.
- **Reorder:** The query orders by `fecha DESC`, so the most recent items appear first. No explicit `orden` column needed — the date determines position.
