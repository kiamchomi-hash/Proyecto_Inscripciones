import { getNovedades } from '@/lib/data';
import type { Metadata } from 'next';
import Link from 'next/link';

const ITEMS_PER_PAGE = 5;

export const metadata: Metadata = {
  title: 'Novedades',
  description: 'Ultimas novedades del CAU Villa Lugano - Universidad Siglo 21.',
};

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ page: String(i + 1) }));
}

export default async function NovedadesPage({ params }: { params: Promise<{ page: string }> }) {
  const { page: pageStr } = await params;
  const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
  const data = getNovedades();

  const totalPages = Math.ceil(data.items.length / ITEMS_PER_PAGE);
  const start = (pageNum - 1) * ITEMS_PER_PAGE;
  const items = data.items.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Pinned */}
      {pageNum === 1 && (
        <div className="mb-8 p-6 rounded-xl" style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.2)' }}>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ background: 'rgba(0,199,177,0.15)', color: 'var(--color-highlight)' }}>
            {data.pinned.tag}
          </span>
          <h2 className="text-2xl font-black text-white mt-3 mb-2">{data.pinned.title}</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-light)' }}>{data.pinned.excerpt}</p>
          <time className="text-xs" style={{ color: 'var(--color-text-light)' }}>{data.pinned.date}</time>
        </div>
      )}

      {/* Items */}
      <div className="space-y-4">
        {items.map((item, i) => (
          <article key={`${item.date}-${i}`} className="p-4 rounded-lg flex items-center justify-between gap-4" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(0,199,177,0.08)' }}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded mr-2" style={{ background: 'rgba(0,199,177,0.1)', color: 'var(--color-secondary-highlight)' }}>
                {item.tag}
              </span>
              <h3 className="text-white font-bold mt-1">{item.title}</h3>
            </div>
            <time className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'var(--color-text-light)' }}>{item.date}</time>
          </article>
        ))}
      </div>

      {/* Pagination */}
      <nav className="flex items-center justify-center gap-2 mt-10">
        {pageNum > 1 && (
          <Link href={`/novedades/${pageNum - 1}`} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: 'var(--color-card-bg)', color: 'var(--color-highlight)' }}>
            Anterior
          </Link>
        )}
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
          <Link
            key={i + 1}
            href={`/novedades/${i + 1}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold"
            style={{
              background: pageNum === i + 1 ? 'var(--color-highlight)' : 'var(--color-card-bg)',
              color: pageNum === i + 1 ? '#013729' : 'var(--color-text-light)',
            }}
          >
            {i + 1}
          </Link>
        ))}
        {pageNum < totalPages && (
          <Link href={`/novedades/${pageNum + 1}`} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: 'var(--color-card-bg)', color: 'var(--color-highlight)' }}>
            Siguiente
          </Link>
        )}
      </nav>
    </div>
  );
}
