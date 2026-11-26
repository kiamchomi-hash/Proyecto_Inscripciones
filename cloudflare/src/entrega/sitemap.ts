import {
  carreraToSlug, esCarreraVisible, type CarreraSlide,
} from '../../../components/index/types.ts';
import { esTeclab, getPortadaTeclab } from '../../../components/index/teclab.ts';
import { CARRERAS_NO_INDEXADAS } from './noindex.ts';
import { BASE, type EntradaSitemap } from './sitemap-xml.ts';
import { baseDeSitio, type Sitio } from './sitios.ts';

// Misma lista, mismo orden y mismos metadatos que `app/sitemap.ts`. Los datos
// llegan de D1 (`src/datos/sitemap.ts`) y acá sólo se proyectan; ninguna ruta
// nueva ni de prueba entra al sitemap.
//
// Hay dos sitemaps: el del CAU, que ya no incluye las diplomaturas de
// Identidad Argentina porque en ese dominio responden 410, y el de topykly,
// que publica sólo esas fichas y su portada.
const ITEMS_PAGE_1 = 3;
const ITEMS_PER_PAGE = 6;

export interface CarreraSitemap {
  nombre: string;
  prefix: string | null;
  nivel: string;
  slides: CarreraSlide[] | null;
  updated_at: string | null;
  proximamente: boolean;
}

export interface MateriaSitemap {
  slug: string;
}

export interface NovedadSitemap {
  slug: string;
  fecha: string | null;
  imagen_url: string | null;
}

export interface DatosSitemap {
  carreras: CarreraSitemap[];
  materias: MateriaSitemap[];
  totalNovedades: number;
  articulos: NovedadSitemap[];
}

export interface OpcionesSitemap {
  sitio?: Sitio;
}

/** URLs percent-encodeadas igual que `new URL(ruta, baseUrl).href` de Next. */
export const urlImagen = (ruta: string, base = BASE) => new URL(ruta, base).href;

/**
 * La portada de la ficha: la de Teclab si la tiene, si no la primera imagen de
 * su slide de portada. Es el mismo criterio que `app/sitemap.ts`; se resuelve
 * acá sin el fallback genérico para no repetir la misma foto en decenas de URLs.
 */
function imagenDeCarrera(carrera: CarreraSitemap): string | null {
  const portadaTeclab = esTeclab(carrera) ? getPortadaTeclab(carrera) : null;
  if (portadaTeclab) return portadaTeclab;
  const portada = carrera.slides?.find(slide => slide.type === 'portada');
  return portada?.imagen_desktop || portada?.imagen_mobile || null;
}

/** Réplica de `Math.max(1, 1 + ceil((total - 3) / 6))` del sitemap vigente. */
export function totalPaginasNovedades(total: number): number {
  return Math.max(1, 1 + Math.ceil(Math.max(0, total - ITEMS_PAGE_1) / ITEMS_PER_PAGE));
}

export function construirSitemap(datos: DatosSitemap, { sitio = 'principal' }: OpcionesSitemap = {}): EntradaSitemap[] {
  const base = baseDeSitio(sitio);
  const identidad = sitio === 'identidad';

  // Identidad Argentina deja de listarse en el sitemap del CAU: sus fichas se
  // sirven en topykly y desde acá responden 410. En el sitio nuevo son las
  // únicas carreras que entran.
  const carreras: EntradaSitemap[] = datos.carreras
    .filter(carrera => esCarreraVisible(carrera))
    .filter(carrera => identidad
      ? carrera.nivel === 'Identidad Argentina'
      : carrera.nivel !== 'Identidad Argentina')
    .filter(carrera => !CARRERAS_NO_INDEXADAS.has(`/carreras/${carreraToSlug(carrera)}`))
    .map(carrera => {
      const imagen = imagenDeCarrera(carrera);
      return {
        url: `${base}/carreras/${carreraToSlug(carrera)}`,
        ...(carrera.updated_at ? { lastModified: new Date(carrera.updated_at).toISOString() } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        ...(imagen ? { images: [urlImagen(imagen, base)] } : {}),
      };
    });

  if (identidad) {
    return [
      { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
      ...carreras,
    ];
  }

  // Sin lastmod: `materias.updated_at` cambia cuando un profesor toca horarios,
  // aunque la página ya no muestre calendario.
  const materias: EntradaSitemap[] = datos.materias.map(materia => ({
    url: `${base}/clases-apoyo/${materia.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const paginasNovedades: EntradaSitemap[] = Array.from(
    { length: totalPaginasNovedades(datos.totalNovedades) },
    (_, i) => ({
      url: `${base}/novedades/${i + 1}`,
      changeFrequency: 'weekly',
      priority: i === 0 ? 0.8 : 0.5,
    }),
  );

  // La foto limpia del artículo, no la OG compuesta con el título encima.
  const articulos: EntradaSitemap[] = datos.articulos.map(articulo => ({
    url: `${base}/novedades/articulo/${articulo.slug}`,
    ...(articulo.fecha ? { lastModified: new Date(articulo.fecha).toISOString() } : {}),
    changeFrequency: 'monthly',
    priority: 0.6,
    ...(articulo.imagen_url ? { images: [urlImagen(articulo.imagen_url, base)] } : {}),
  }));

  return [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    {
      url: `${base}/teclab`,
      changeFrequency: 'monthly',
      priority: 0.8,
      images: [`${base}/imagenes/teclab/carreras/marketing-digital.webp`],
    },
    { url: `${base}/teclab/test-vocacional`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/clases-apoyo`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contacto`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/test-vocacional`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/calendario-academico`, changeFrequency: 'monthly', priority: 0.7 },
    {
      url: `${base}/sobre-nosotros`,
      changeFrequency: 'monthly',
      priority: 0.6,
      images: [
        `${base}/imagenes/imagenes_cau/Foto-entrada.webp`,
        `${base}/imagenes/imagenes_cau/logo_cau.png`,
      ],
    },
    ...carreras,
    ...materias,
    ...paginasNovedades,
    ...articulos,
  ];
}
