// Los dos sitios que comparte este paquete.
//
// El principal es el CAU (Siglo 21 + Teclab + Identidad). El segundo es el de
// la Academia Identidad Argentina en topykly.com: sirve sólo sus fichas y sus
// formularios, y todo lo demás vuelve al principal. La elección viaja por
// `APP_SITIO` en producción y, en desarrollo, por el host, para poder probar
// los dos sin tocar la configuración del Worker.

export type Sitio = 'principal' | 'identidad';

export const BASE_PRINCIPAL = 'https://www.siglo21sur.com';
export const BASE_IDENTIDAD = 'https://topykly.com';

export const HOST_CANONICO_PRINCIPAL = 'www.siglo21sur.com';
export const HOST_APEX_PRINCIPAL = 'siglo21sur.com';
export const HOST_CANONICO_IDENTIDAD = 'topykly.com';
export const HOST_WWW_IDENTIDAD = 'www.topykly.com';

export function normalizarHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '');
}

/**
 * `APP_SITIO` manda cuando está definido: el Worker de topykly no depende de
 * que el pedido llegue con el host correcto. Sin esa variable (local, tests,
 * previews) decide el host.
 */
export function sitioDe(host: string, appSitio?: string): Sitio {
  const forzado = (appSitio ?? '').trim().toLowerCase();
  if (forzado === 'identidad') return 'identidad';
  if (forzado === 'principal') return 'principal';
  const nombre = normalizarHost(host);
  return nombre === HOST_CANONICO_IDENTIDAD || nombre === HOST_WWW_IDENTIDAD
    ? 'identidad' : 'principal';
}

export function baseDeSitio(sitio: Sitio): string {
  return sitio === 'identidad' ? BASE_IDENTIDAD : BASE_PRINCIPAL;
}

/** Sólo estos archivos de la raíz viajan al sitio de Identidad. */
const ARCHIVOS_RAIZ = /^\/(?:favicon\.ico|favicon\.svg|icon(?:-\d+)?\.png|apple-touch-icon\.png|og-image\.png|manifest\.webmanifest|site\.webmanifest)$/;

const CARPETAS_ASSETS = /^\/(?:_astro|imagenes|derivados|fuentes|folletos)(?:\/|$)/;

/** Las rutas que el sitio de Identidad sí sirve. */
export function rutaDeIdentidadPermitida(ruta: string): boolean {
  const normalizada = ruta.length > 1 && ruta.endsWith('/') ? ruta.slice(0, -1) : ruta;
  if (normalizada === '/' || normalizada === '/robots.txt' || normalizada === '/sitemap.xml') return true;
  if (/^\/carreras\/[^/]+(?:\/inscripcion)?$/.test(normalizada)) return true;
  if (/^\/api(?:\/|$)/.test(normalizada)) return true;
  if (CARPETAS_ASSETS.test(normalizada)) return true;
  return ARCHIVOS_RAIZ.test(normalizada);
}

/**
 * Prefijos del sitio principal. Si una URL vieja de topykly apunta a uno de
 * estos caminos, se manda al principal; cualquier otra cosa (el chat viejo,
 * `/tema/...`, `/archivo`, `/dashboard.html`) vuelve a la home nueva en vez de
 * aterrizar en un 404 del CAU.
 */
const PREFIJOS_PRINCIPAL = [
  '/contacto', '/faq', '/teclab', '/clases-apoyo', '/novedades', '/sobre-nosotros',
  '/calendario-academico', '/test-vocacional', '/newsletter', '/imagenes', '/llms.txt',
];

export function rutaConocidaDelPrincipal(ruta: string): boolean {
  return PREFIJOS_PRINCIPAL.some(prefijo => ruta === prefijo || ruta.startsWith(`${prefijo}/`));
}

/**
 * Fichas de Identidad que la Academia dejó de ofrecer. No están activas en D1,
 * así que la ficha no se renderiza; su URL vieja se manda a la portada de
 * topykly para no perder el tráfico en un 404. Si alguna vuelve, basta con
 * activarla en la base: la ficha existe y esta lista deja de aplicarse.
 */
export const CARRERAS_IDENTIDAD_RETIRADAS = new Set([
  'diplomatura-en-oratoria',
]);

export function esCarreraIdentidadRetirada(slug: string): boolean {
  return CARRERAS_IDENTIDAD_RETIRADAS.has(slug);
}

/**
 * Adónde va una ruta que no pertenece al sitio de Identidad. `null` significa
 * que se sirve normalmente.
 */
export function destinoFueraDeIdentidad(ruta: string, query = ''): { destino: string; estado: 301 } | null {
  if (rutaDeIdentidadPermitida(ruta)) return null;
  if (rutaConocidaDelPrincipal(ruta)) {
    return { destino: `${BASE_PRINCIPAL}${ruta}${query}`, estado: 301 };
  }
  // Contenido retirado del dominio (el chat efímero): vuelve a la home nueva,
  // sin arrastrar query ni rutas que ya no existen.
  return { destino: `${BASE_IDENTIDAD}/`, estado: 301 };
}
