'use client';

import Image from 'next/image';
import Link from 'next/link';

/* ── Types ── */
export interface Novedad {
  id: number;
  titulo: string;
  extracto: string | null;
  fecha: string;
  tag: string;
  imagen_url: string | null;
  href: string;
  slug: string;
  pinned: boolean;
}

interface Props {
  pinnedItem: Novedad | null;
  items: Novedad[];
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
    <div className={`news-placeholder flex items-center justify-center w-full h-full ${tall ? 'min-h-[280px]' : ''}`}>
      <svg className={`${tall ? 'w-14 h-14' : 'w-8 h-8'} relative z-10`} style={{ color: 'rgba(72,179,164,0.2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

/* ── Pinned Hero Card (página 1, izquierda) ── */
function PinnedCard({ item }: { item: Novedad }) {
  return (
    <Link
      href={`/novedades/articulo/${item.slug}`}
      className="news-card group block rounded-xl overflow-hidden news-animate news-animate--d1 flex flex-col h-full md:h-[580px]"
      style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.06)' }}
    >
      <div className="news-card__img relative flex-shrink-0 h-[260px] overflow-hidden">
        {item.imagen_url ? (
          <Image src={item.imagen_url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
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
      <div className="flex-1 flex flex-col p-6 pb-7">
        <time className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <CalendarIcon />
          {formatDate(item.fecha)}
        </time>
        <h3 className="news-card__title text-2xl sm:text-[1.85rem] font-extrabold leading-[1.2] tracking-tight text-white">
          {item.titulo}
        </h3>
        {item.extracto && (
          <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {item.extracto}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-3.5">
          <span className="news-tag text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ color: 'var(--color-highlight)', background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.18)' }}>
            {item.tag}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Sub Card (página 1 derecha + páginas 2+) ── */
function SubCard({ item, delay }: { item: Novedad; delay: number }) {
  return (
    <Link
      href={`/novedades/articulo/${item.slug}`}
      className={`news-card group block rounded-xl overflow-hidden news-animate news-animate--d${delay} flex-1 min-h-0`}
      style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.06)' }}
    >
      <div className="flex flex-col sm:flex-row h-full">
        <div className="news-card__img w-full sm:w-[40%] sm:max-w-[240px] flex-shrink-0 overflow-hidden h-[160px] sm:h-auto relative">
          {item.imagen_url ? (
            <Image src={item.imagen_url} alt="" fill className="object-cover" sizes="200px" />
          ) : (
            <ImagePlaceholder />
          )}
          {item.tag?.toLowerCase() === 'barrio' && (
            <span
              className="absolute top-3 left-3 z-[3] text-[0.6rem] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md"
              style={{ color: '#013729', background: 'var(--color-highlight)', boxShadow: '0 2px 12px rgba(0,199,177,0.4)' }}
            >
              Barrio
            </span>
          )}
        </div>
        <div className="flex-1 p-5 px-6 flex flex-col justify-center">
          <time className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold mb-2" style={{ color: 'var(--color-secondary-highlight)' }}>
            <CalendarIcon />
            {formatDate(item.fecha)}
          </time>
          <h3 className="news-card__title text-base font-extrabold leading-snug text-white">
            {item.titulo}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            <span className="news-tag text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ color: 'var(--color-highlight)', background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.18)' }}>
              {item.tag}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Pagination ── */
function Pagination({ current, total, className = "mt-10 mb-6" }: { current: number; total: number; className?: string }) {
  if (total <= 1) return null;

  const pageHref = (p: number) => `/novedades/${p}`;
  const prevPage = Math.max(1, current - 1);
  const nextPage = Math.min(total, current + 1);
  const isFirst = current === 1;
  const isLast = current === total;

  const MAX_DESKTOP = 5;
  const MAX_MOBILE = 3;

  function getRange(max: number) {
    let start: number;
    let end: number;
    if (total <= max) {
      start = 1;
      end = total;
    } else if (current < max) {
      start = 1;
      end = max;
    } else {
      start = current - Math.floor(max / 2);
      end = start + max - 1;
      if (end > total) {
        end = total;
        start = total - max + 1;
      }
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  const desktopPages = getRange(MAX_DESKTOP);
  const mobilePages = getRange(MAX_MOBILE);

  const btnBase = "inline-flex items-center justify-center min-w-9 h-9 px-2 text-sm font-bold rounded-md";
  const btnStyle = { color: '#ffffff', background: '#07241f', border: '1px solid rgba(0,199,177,0.4)' };
  const btnActive = { color: '#013729', background: 'var(--color-highlight)', borderColor: 'var(--color-highlight)' };

  return (
    <nav className={`flex items-center justify-center flex-wrap ${className}`} aria-label="Paginación de novedades">
      <Link
        href={pageHref(1)}
        className={`page-btn page-btn--back ${btnBase} gap-1 text-xs uppercase tracking-wide px-3 mr-1 ${isFirst ? 'opacity-30 pointer-events-none' : ''}`}
        style={btnStyle}
        aria-label="Primera página"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" /></svg>
        <span>Primera</span>
      </Link>

      <Link
        href={pageHref(prevPage)}
        className={`page-btn page-btn--back ${btnBase} gap-1 text-xs uppercase tracking-wide px-3 ${isFirst ? 'opacity-30 pointer-events-none' : ''}`}
        style={btnStyle}
        aria-label="Página anterior"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        <span>Ant.</span>
      </Link>

      {/* Desktop: 5 páginas */}
      <span className="hidden sm:inline-flex items-center justify-center gap-1 w-[14.5rem]">
        {desktopPages.map(p => (
          p === current ? (
            <span key={p} className={`page-btn page-btn--active ${btnBase} pointer-events-none`} style={{ ...btnStyle, ...btnActive }} aria-current="page">{p}</span>
          ) : (
            <Link key={p} href={pageHref(p)} className={`page-btn ${btnBase}`} style={btnStyle}>{p}</Link>
          )
        ))}
      </span>
      {/* Mobile: 3 páginas */}
      <span className="inline-flex sm:hidden items-center justify-center gap-1 w-[8.75rem]">
        {mobilePages.map(p => (
          p === current ? (
            <span key={p} className={`page-btn page-btn--active ${btnBase} pointer-events-none`} style={{ ...btnStyle, ...btnActive }} aria-current="page">{p}</span>
          ) : (
            <Link key={p} href={pageHref(p)} className={`page-btn ${btnBase}`} style={btnStyle}>{p}</Link>
          )
        ))}
      </span>

      <Link
        href={pageHref(nextPage)}
        className={`page-btn page-btn--nav ${btnBase} gap-1 text-xs uppercase tracking-wide px-3 ${isLast ? 'opacity-30 pointer-events-none' : ''}`}
        style={btnStyle}
        aria-label="Página siguiente"
      >
        <span>Sig.</span>
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
      </Link>

      <Link
        href={pageHref(total)}
        className={`page-btn page-btn--nav ${btnBase} gap-1 text-xs uppercase tracking-wide px-3 ml-1 ${isLast ? 'opacity-30 pointer-events-none' : ''}`}
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
export default function NovedadesPage({ pinnedItem, items, currentPage, totalPages }: Props) {
  const isPage1 = currentPage === 1;

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-28 sm:pb-0">

      {/* Paginación superior */}
      <Pagination current={currentPage} total={totalPages} className="-mt-2 mb-4" />

      {/* Contenido */}
      {isPage1 && pinnedItem ? (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PinnedCard item={pinnedItem} />
            <div className="flex flex-col gap-5">
              {items.map((item, i) => (
                <SubCard key={item.id} item={item} delay={i + 2} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Columna izquierda */}
            <div className="flex flex-col gap-5 md:min-h-[580px]">
              {[0, 1, 2].map(i => (
                items[i] ? (
                  <SubCard key={items[i].id} item={items[i]} delay={(i % 4) + 1} />
                ) : (
                  <div key={`empty-l-${i}`} className="flex-1 min-h-0" />
                )
              ))}
            </div>
            {/* Columna derecha */}
            <div className="flex flex-col gap-5 md:min-h-[580px]">
              {[3, 4, 5].map(i => (
                items[i] ? (
                  <SubCard key={items[i].id} item={items[i]} delay={(i % 4) + 1} />
                ) : (
                  <div key={`empty-r-${i}`} className="flex-1 min-h-0" />
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Paginación inferior */}
      <Pagination current={currentPage} total={totalPages} className="mt-4 mb-6" />
    </main>
  );
}
