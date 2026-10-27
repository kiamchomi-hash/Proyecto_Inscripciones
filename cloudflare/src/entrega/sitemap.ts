import {
  carreraToSlug, esCarreraVisible, type CarreraSlide,
} from '../../../components/index/types.ts';
import { esTeclab, getPortadaTeclab } from '../../../components/index/teclab.ts';
import { BASE, type EntradaSitemap } from './sitemap-xml.ts';

// Misma lista, mismo orden y mismos metadatos que `app/sitemap.ts`. Los datos
// llegan de D1 (`src/datos/sitemap.ts`) y acá sólo se proyectan; ninguna ruta
// nueva ni de prueba entra al sitemap.
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

/** URLs percent-encodeadas igual que `new URL(ruta, baseUrl).href` de Next. */
export const urlImagen = (ruta: string) => new URL(ruta, BASE).href;

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

export function construirSitemap(datos: DatosSitemap): EntradaSitemap[] {
  // Las diplomaturas de Identidad Argentina se listan porque vuelven a indexarse
  // desde el 26/10/2026 (commit b90fb95 del sitio), aunque no se enlacen desde
  // ningún lado. Los niveles fuera de la oferta los descarta la taxonomía
  // compartida.
  const carreras: EntradaSitemap[] = datos.carreras
    .filter(carrera => esCarreraVisible(carrera))
    .map(carrera => {
      const imagen = imagenDeCarrera(carrera);
      return {
        url: `${BASE}/carreras/${carreraToSlug(carrera)}`,
        ...(carrera.updated_at ? { lastModified: new Date(carrera.updated_at).toISOString() } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        ...(imagen ? { images: [urlImagen(imagen)] } : {}),
      };
    });

  // Sin lastmod: `materias.updated_at` cambia cuando un profesor toca horarios,
  // aunque la página ya no muestre calendario.
  const materias: EntradaSitemap[] = datos.materias.map(materia => ({
    url: `${BASE}/clases-apoyo/${materia.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const paginasNovedades: EntradaSitemap[] = Array.from(
    { length: totalPaginasNovedades(datos.totalNovedades) },
    (_, i) => ({
      url: `${BASE}/novedades/${i + 1}`,
      changeFrequency: 'weekly',
      priority: i === 0 ? 0.8 : 0.5,
    }),
  );

  // La foto limpia del artículo, no la OG compuesta con el título encima.
  const articulos: EntradaSitemap[] = datos.articulos.map(articulo => ({
    url: `${BASE}/novedades/articulo/${articulo.slug}`,
    ...(articulo.fecha ? { lastModified: new Date(articulo.fecha).toISOString() } : {}),
    changeFrequency: 'monthly',
    priority: 0.6,
    ...(articulo.imagen_url ? { images: [urlImagen(articulo.imagen_url)] } : {}),
  }));

  return [
    { url: BASE, changeFrequency: 'monthly', priority: 1 },
    {
      url: `${BASE}/teclab`,
      changeFrequency: 'monthly',
      priority: 0.8,
      images: [`${BASE}/imagenes/teclab/carreras/marketing-digital.webp`],
    },
    { url: `${BASE}/teclab/inscripcion`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/teclab/test-vocacional`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/clases-apoyo`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/contacto`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/test-vocacional`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/calendario-academico`, changeFrequency: 'monthly', priority: 0.7 },
    {
      url: `${BASE}/sobre-nosotros`,
      changeFrequency: 'monthly',
      priority: 0.6,
      images: [
        `${BASE}/imagenes/imagenes_cau/Foto-entrada.webp`,
        `${BASE}/imagenes/imagenes_cau/logo_cau.png`,
      ],
    },
    ...carreras,
    ...materias,
    ...paginasNovedades,
    ...articulos,
  ];
}
