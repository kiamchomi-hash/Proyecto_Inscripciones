import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NovedadesPage from '@/components/novedades/novedades-page';
import type { Novedad } from '@/components/novedades/novedades-page';
import '../novedades.css';

const ITEMS_PAGE_1 = 3;
const ITEMS_PER_PAGE = 6;

export const revalidate = 3600;

export async function generateStaticParams() {
  const { count } = await supabase
    .from('novedades')
    .select('id', { count: 'exact', head: true })
    .eq('publicada', true)
    .eq('pinned', false);

  const total = count ?? 0;
  const totalPages = Math.max(1, 1 + Math.ceil(Math.max(0, total - ITEMS_PAGE_1) / ITEMS_PER_PAGE));

  return Array.from({ length: totalPages }, (_, i) => ({ page: String(i + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const pageNum = parseInt(page, 10);
  const suffix = pageNum > 1 ? ` — Página ${pageNum}` : '';
  return {
    title: `Novedades${suffix}`,
    description: 'Últimas novedades del CAU Villa Lugano — Universidad Siglo 21.',
    keywords: ['novedades', 'noticias', 'siglo 21', 'villa lugano', 'CAU'],
    alternates: { canonical: `/novedades/${page}` },
  };
}

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageNum = parseInt(page, 10);
  if (isNaN(pageNum) || pageNum < 1) notFound();

  // Contar items activos no-fijados para calcular total de páginas
  const { count: totalCount } = await supabase
    .from('novedades')
    .select('id', { count: 'exact', head: true })
    .eq('publicada', true)
    .eq('pinned', false);

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, 1 + Math.ceil(Math.max(0, total - ITEMS_PAGE_1) / ITEMS_PER_PAGE));

  if (pageNum > totalPages) notFound();

  let pinnedItem: Novedad | null = null;
  let items: Novedad[] = [];

  if (pageNum === 1) {
    // Obtener novedad fijada
    const { data: pinnedData } = await supabase
      .from('novedades')
      .select('id, titulo, extracto, fecha, tag, imagen_url, href, slug, pinned')
      .eq('publicada', true)
      .eq('pinned', true)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    pinnedItem = pinnedData as Novedad | null;

    // Obtener primeras 3 no-fijadas
    const { data: itemsData } = await supabase
      .from('novedades')
      .select('id, titulo, extracto, fecha, tag, imagen_url, href, slug, pinned')
      .eq('publicada', true)
      .eq('pinned', false)
      .order('fecha', { ascending: false })
      .range(0, ITEMS_PAGE_1 - 1);

    items = (itemsData ?? []) as Novedad[];
  } else {
    // Páginas 2+: offset después de los items de página 1
    const offset = ITEMS_PAGE_1 + (pageNum - 2) * ITEMS_PER_PAGE;
    const { data: itemsData } = await supabase
      .from('novedades')
      .select('id, titulo, extracto, fecha, tag, imagen_url, href, slug, pinned')
      .eq('publicada', true)
      .eq('pinned', false)
      .order('fecha', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    items = (itemsData ?? []) as Novedad[];
  }

  return (
    <NovedadesPage
      pinnedItem={pinnedItem}
      items={items}
      currentPage={pageNum}
      totalPages={totalPages}
    />
  );
}
