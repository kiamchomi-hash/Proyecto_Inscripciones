import Image from 'next/image';
import Link from 'next/link';
import CopyLinkButton from '@/components/novedades/copy-link-button';
import ImagenResponsiva from '@/components/imagenes/imagen-responsiva';
import type { Articulo } from '../datos/novedades';

// Cuerpo de app/novedades/articulo/[slug]/page.tsx. El servidor entrega HTML ya
// sanitizado; no se importa el sanitizador ni ningún cliente de base en la isla.
export default function PaginaArticulo({ novedad, contenido }: {
  novedad: Pick<Articulo, 'titulo' | 'slug' | 'fecha' | 'tag' | 'imagen_url' | 'extracto'>;
  contenido: string | null;
}) {
  const shareUrl = `https://www.siglo21sur.com/novedades/articulo/${novedad.slug}`;
  const shareText = encodeURIComponent(novedad.titulo);
  const shareUrlEncoded = encodeURIComponent(shareUrl);
  const fecha = new Date(novedad.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-8 pt-6 pb-28 sm:pb-16">
      <Link href="/novedades/1" className="inline-flex items-center gap-2 text-sm font-semibold mb-6 transition-colors" style={{ color: 'var(--color-highlight)' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        Volver a novedades
      </Link>
      <article className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.1)' }}>
        {novedad.imagen_url && <div className="relative w-full h-[240px] sm:h-[360px] overflow-hidden">
          <ImagenResponsiva ruta={novedad.imagen_url} alt={novedad.titulo} fill className="object-cover" sizes="(max-width: 768px) 100vw, 720px" priority />
        </div>}
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ color: 'var(--color-highlight)', background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.18)' }}>{novedad.tag}</span>
            <time className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold" style={{ color: 'var(--color-secondary-highlight)' }}>
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" /></svg>
              {fecha}
            </time>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight mb-6">{novedad.titulo}</h1>
          {contenido !== null ? <div className="art" dangerouslySetInnerHTML={{ __html: contenido }} /> : <div className="art">
            {novedad.extracto ? <p>{novedad.extracto}</p> : <p className="italic" style={{ color: 'var(--color-text-light)' }}>Contenido próximamente.</p>}
          </div>}
          <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(0,199,177,0.12)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-light)' }}>Compartir</p>
            <div className="flex flex-wrap gap-2.5">
              <a href={`https://wa.me/?text=${shareText}%20${shareUrlEncoded}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-all hover:brightness-110" style={{ background: '#25D366', color: '#062c21' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.504 3.935 1.395 5.608L.054 23.395a.5.5 0 0 0 .611.611l5.787-1.341A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.583l-.386-.232-3.437.797.813-3.437-.232-.386A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-all hover:brightness-110" style={{ background: '#1263ce' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>Facebook
              </a>
              <CopyLinkButton url={shareUrl} titulo={novedad.titulo} />
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
