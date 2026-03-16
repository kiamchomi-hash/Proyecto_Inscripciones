import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { carreraToSlug } from '@/components/index/types';

const ITEMS_PAGE_1 = 3;
const ITEMS_PER_PAGE = 6;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.siglo21sur.com';

  // 1. Calcular total de páginas de novedades (News)
  const { count } = await supabase
    .from('novedades')
    .select('id', { count: 'exact', head: true })
    .eq('publicada', true)
    .eq('pinned', false);

  const total = count ?? 0;
  const totalPages = Math.max(1, 1 + Math.ceil(Math.max(0, total - ITEMS_PAGE_1) / ITEMS_PER_PAGE));

  const novedadesEntries: MetadataRoute.Sitemap = Array.from({ length: totalPages }, (_, i) => ({
    url: `${baseUrl}/novedades/${i + 1}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: i === 0 ? 0.8 : 0.5,
  }));

  // 2. Obtener todas las carreras (Careers)
  const { data: carreras } = await supabase
    .from('carreras')
    .select('nombre')
    .eq('activa', true);

  const careerEntries: MetadataRoute.Sitemap = (carreras || []).map((c) => ({
    url: `${baseUrl}/carrera/${carreraToSlug(c.nombre)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // 3. Páginas estáticas y combinación final
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/clases-apoyo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sobre-nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...careerEntries,
    ...novedadesEntries,
  ];
}
