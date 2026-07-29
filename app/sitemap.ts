import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import type { Carrera } from '@/components/index/types';
import { carreraToSlug, esCarreraVisible } from '@/components/index/types';
import { esTeclab, getFichaTeclab } from '@/components/index/teclab';
import { getPortada } from '@/components/carreras/career-content';

const ITEMS_PAGE_1 = 3;
const ITEMS_PER_PAGE = 6;

type CarreraFila = Pick<Carrera, 'nombre' | 'prefix' | 'nivel' | 'slides'>;

// La foto que la ficha usa de hero, con la misma resolucion que career-detail.tsx
// pero sin su fallback generico: repetir la misma foto de archivo en decenas de
// URLs no le dice nada a Google Imagenes.
function imagenDeCarrera(c: CarreraFila): string | null {
  const ficha = esTeclab(c) ? getFichaTeclab(c) : null;
  if (ficha) return ficha.imagen;
  const portada = getPortada(c);
  return portada?.imagen_desktop || portada?.imagen_mobile || null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.siglo21sur.com';

  // Varias imagenes de slides viven en rutas con espacios y acentos
  // (/imagenes/Modales/Abogacía/...): el estandar de sitemaps exige URLs
  // percent-encodeadas, y new URL() encodea sin duplicar un % ya existente.
  // Sirve igual para las imagen_url absolutas: ahi ignora el base.
  const urlImagen = (ruta: string) => new URL(ruta, baseUrl).href;

  // Carreras activas de la oferta vigente. Los niveles que quedaron fuera del
  // catalogo (Posgrado, APLV, Certificacion, Curso) ya no tienen pagina.
  const { data: carreras } = await supabase
    .from('carreras')
    .select('nombre, prefix, nivel, slides')
    .eq('activa', true);

  const carrerasEntries: MetadataRoute.Sitemap = ((carreras || []) as CarreraFila[])
    .filter(esCarreraVisible)
    .map(c => {
      const imagen = imagenDeCarrera(c);
      return {
        url: `${baseUrl}/carreras/${carreraToSlug(c)}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        ...(imagen ? { images: [urlImagen(imagen)] } : {}),
      };
    });

  // Materias activas (clases de apoyo)
  const { data: materias } = await supabase
    .from('materias')
    .select('slug')
    .eq('activa', true);

  const materiasEntries: MetadataRoute.Sitemap = (materias || []).map(m => ({
    url: `${baseUrl}/clases-apoyo/${m.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Calcular total de páginas de novedades
  const { count } = await supabase
    .from('novedades')
    .select('id', { count: 'exact', head: true })
    .eq('publicada', true)
    .eq('pinned', false);

  const total = count ?? 0;
  const totalPages = Math.max(1, 1 + Math.ceil(Math.max(0, total - ITEMS_PAGE_1) / ITEMS_PER_PAGE));

  const novedadesPageEntries: MetadataRoute.Sitemap = Array.from({ length: totalPages }, (_, i) => ({
    url: `${baseUrl}/novedades/${i + 1}`,
    changeFrequency: 'weekly',
    priority: i === 0 ? 0.8 : 0.5,
  }));

  // Artículos individuales de novedades
  const { data: novedades } = await supabase
    .from('novedades')
    .select('slug, fecha, imagen_url')
    .eq('publicada', true)
    .not('slug', 'is', null);

  // La foto limpia del articulo (imagen_url), no la og compuesta: la og lleva el
  // titulo estampado encima y para Google Imagenes vale mas la foto sola.
  const novedadesArticuloEntries: MetadataRoute.Sitemap = (novedades || []).map(n => ({
    url: `${baseUrl}/novedades/articulo/${n.slug}`,
    ...(n.fecha ? { lastModified: new Date(n.fecha) } : {}),
    changeFrequency: 'monthly',
    priority: 0.6,
    ...(n.imagen_url ? { images: [urlImagen(n.imagen_url)] } : {}),
  }));

  return [
    {
      url: baseUrl,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/clases-apoyo`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacto`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sobre-nosotros`,
      changeFrequency: 'monthly',
      priority: 0.6,
      // Las dos imagenes propias de la pagina: la entrada del local y el logo del
      // CAU (las busquedas de imagenes que recibe el sitio son casi todas de logo).
      images: [
        `${baseUrl}/imagenes/imagenes_cau/Foto-entrada.webp`,
        `${baseUrl}/imagenes/imagenes_cau/logo_cau.png`,
      ],
    },
    ...carrerasEntries,
    ...materiasEntries,
    ...novedadesPageEntries,
    ...novedadesArticuloEntries,
  ];
}
