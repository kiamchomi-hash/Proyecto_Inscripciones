// Serialización pura de sitemap y robots, copiada del resolvedor de Next
// (`next/dist/build/webpack/loaders/metadata/resolve-route-data.js`). El orden
// de etiquetas, los saltos de línea y el `xmlns:image` condicional tienen que
// ser los mismos: la paridad se compara byte a byte contra `/sitemap.xml` del
// Next vigente.
//
// Este módulo no importa nada del sitio para que las pruebas unitarias lo
// puedan abrir con Node pelado. Los datos y la taxonomía viven en `sitemap.ts`.

export const BASE = 'https://www.siglo21sur.com';

export type Frecuencia = 'monthly' | 'weekly';

export interface EntradaSitemap {
  url: string;
  lastModified?: string;
  changeFrequency?: Frecuencia;
  priority?: number;
  images?: string[];
}

export function generarSitemap(entradas: readonly EntradaSitemap[]): string {
  const hayImagenes = entradas.some(entrada => Boolean(entrada.images?.length));
  let contenido = '<?xml version="1.0" encoding="UTF-8"?>\n';
  contenido += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  if (hayImagenes) contenido += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
  contenido += '>\n';
  for (const entrada of entradas) {
    contenido += '<url>\n';
    contenido += `<loc>${entrada.url}</loc>\n`;
    if (entrada.images?.length) {
      for (const imagen of entrada.images) {
        contenido += `<image:image>\n<image:loc>${imagen}</image:loc>\n</image:image>\n`;
      }
    }
    if (entrada.lastModified) contenido += `<lastmod>${entrada.lastModified}</lastmod>\n`;
    if (entrada.changeFrequency) contenido += `<changefreq>${entrada.changeFrequency}</changefreq>\n`;
    if (typeof entrada.priority === 'number') contenido += `<priority>${entrada.priority}</priority>\n`;
    contenido += '</url>\n';
  }
  contenido += '</urlset>\n';
  return contenido;
}

/** Mismo texto que produce `app/robots.ts` al serializarlo Next. */
export function generarRobots(): string {
  return `User-Agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${BASE}/sitemap.xml\n`;
}
