// Rutas cubiertas por la comparación viva de paridad (la home se guarda aparte).
export const RUTAS_REFERENCIA = [
  { ruta: '/teclab' },
  { ruta: '/teclab/inscripcion', sinPie: true, sinNavbar: true },
  { ruta: '/contacto' }, { ruta: '/sobre-nosotros' }, { ruta: '/calendario-academico' },
  { ruta: '/imagenes', sinPie: true }, { ruta: '/test-vocacional', sinPie: true },
  { ruta: '/teclab/test-vocacional', sinPie: true },
  { ruta: '/faq', sinMain: true }, { ruta: '/clases-apoyo' },
  ...['matematica', 'computacion', 'arte'].map(nombre => ({ ruta: `/clases-apoyo/${nombre}`, sinMain: true })),
  ...['', '?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '?listo=1',
    '?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&id=otro'].map(query => ({ ruta: `/newsletter/baja${query}`, sinPie: true })),
  ...['licenciatura-en-administracion', 'contador-publico', 'tecnicatura-en-programacion',
    'tecnicatura-en-desarrollo-de-software', 'diplomatura-en-oratoria'].map(slug => ({ ruta: `/carreras/${slug}` })),
  ...['licenciatura-en-administracion', 'tecnicatura-en-programacion'].map(slug => ({
    ruta: `/carreras/${slug}/inscripcion`, sinPie: true, sinNavbar: true,
  })),
  ...[1, 2, 3].map(id => ({ ruta: `/novedades/${id}` })),
  ...[1, 14, 15, 16, 17].map(id => ({ ruta: `/novedades/articulo/novedad-sintetica-${id}` })),
];

import { canonical, decodificar, enlaces, enlacesDe, idioma, jsonLd, metas, normalizarTexto, textoPrincipal, titulo } from './html.mjs';

export function proyectarPagina(html, { sinMain = false, sinNavbar = false, sinPie = false } = {}) {
  let region = '';
  if (sinMain) {
    const inicio = html.search(/<(?:div class="ca-materia-pagina"|section class="faq-section)/);
    const fin = html.indexOf('<footer', inicio);
    if (inicio < 0 || fin <= inicio) throw new Error('Falta el cuerpo de materia o su pie');
    region = html.slice(inicio, fin);
  }
  const meta = metas(html);
  const claves = ['description', 'author', 'creator', 'og:type', 'og:locale', 'og:url', 'og:site_name',
    'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt',
    'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'google-site-verification', 'keywords', 'robots'];
  const seleccion = Object.fromEntries(claves.filter(k => meta[k] !== undefined).map(k => [k, meta[k]]));
  return {
    idioma: idioma(html), titulo: titulo(html), canonical: canonical(html), metas: seleccion,
    imagenesOg: [...html.matchAll(/<meta\b[^>]*property="og:image"[^>]*>/g)]
      .map(([tag]) => decodificar(/content="([^"]*)"/.exec(tag)[1])),
    jsonLd: jsonLd(html), texto: sinMain ? normalizarTexto(region) : textoPrincipal(html),
    principal: sinMain ? enlaces(region) : enlacesDe(html, { apertura: /<main\b/, cierre: '</main>' }).sort(),
    navegacion: sinNavbar ? null : enlacesDe(html, { apertura: /<nav\b[^>]*class="main-navbar"/, cierre: '</nav>' }).sort(),
    pie: sinPie ? null : enlacesDe(html, { apertura: /<footer\b/, cierre: '</footer>' }).sort(),
  };
}
