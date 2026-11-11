// Cabeceras de entrega del paquete. Los valores globales salen de
// `next.config.ts` (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy) y
// la lista que vigila producción vive en `lib/vigilancia-esperado.ts`.
//
// La CSP conserva sólo los orígenes que este paquete usa. Necesita
// `challenges.cloudflare.com` para Turnstile, que Next también declara, y
// `static.cloudflareinsights.com` para el beacon de Cloudflare Web Analytics:
// sin ese origen la CSP bloquea el script y el sitio queda sin medición de
// visitas. El beacon postea a `/cdn-cgi/rum` del propio dominio, que ya
// cubre `connect-src 'self'`; `cloudflareinsights.com` queda autorizado igual,
// por si el beacon vuelve a usar su destino por defecto.
// `frame-src` mantiene Google Maps y YouTube porque `/contacto` y
// `/sobre-nosotros` los embeben igual que el sitio vigente.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://images.unsplash.com",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
  "frame-src https://challenges.cloudflare.com https://www.google.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** Cabeceras que `next.config.ts` aplica a todas las respuestas. */
export const CABECERAS_SEGURIDAD: Readonly<Record<string, string>> = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

const API = /^\/api(?:\/|$)/;
const IMAGENES = /^\/imagenes\/?$/;
const INSCRIPCION = /^\/(?:carreras\/[^/]+\/inscripcion|teclab\/inscripcion)\/?$/;

/**
 * La convención llmstxt.org: la cabecera `Link` con `rel="describedby"` apunta
 * al `/llms.txt` que cubre la página. Como el archivo está en la raíz, cubre
 * todo el sitio.
 *
 * Va en las páginas HTML y en nada más: el propio archivo, el sitemap, las
 * APIs y los assets no son páginas que describir. La forma de cabecera se
 * prefiere a un `<link>` en el HTML porque no toca el marcado —las referencias
 * visuales y de paridad comparan el documento— y porque la especificación
 * dice que también sirve para recursos que no son HTML.
 */
export const LINK_LLMS = '</llms.txt>; rel="describedby"';

/** Las páginas que tienen versión markdown propia. */
const VERSION_MARKDOWN: RegExp[] = [
  /^\/carreras\/[^/]+$/,
  /^\/clases-apoyo\/[^/]+$/,
  /^\/novedades\/articulo\/[^/]+$/,
  /^\/novedades\/\d+$/,
  /^\/(?:faq|contacto|calendario-academico|sobre-nosotros|teclab|clases-apoyo|test-vocacional)$/,
];

/** La URL del markdown de esa página, si lo tiene. */
export function versionMarkdown(ruta: string): string | null {
  if (ruta.endsWith('.md')) return null;
  // La home no es un directorio: su markdown es `/index.md`, no `/.md`.
  if (ruta === '/') return '/index.md';
  return VERSION_MARKDOWN.some(patron => patron.test(ruta)) ? `${ruta}.md` : null;
}

/**
 * La cabecera `Link` de una respuesta:
 * - `rel="alternate"` apunta a la versión markdown de esa misma página;
 * - `rel="describedby"` apunta al `/llms.txt` que la cubre.
 *
 * La llevan las páginas HTML y los archivos markdown. El propio `/llms.txt`
 * no: no se describe a sí mismo.
 */
export function cabeceraLink(ruta: string, tipo: string): string | null {
  if (ruta === '/llms.txt') return null;
  const markdown = tipo.includes('text/html') ? versionMarkdown(ruta) : null;
  if (markdown) return `<${markdown}>; rel="alternate"; type="text/markdown", ${LINK_LLMS}`;
  if (tipo.includes('text/html') || tipo.includes('text/markdown')) return LINK_LLMS;
  return null;
}

/**
 * `X-Robots-Tag` por ruta, como los bloques de `headers()` de `next.config.ts`.
 * No hay noindex global: una página pública tiene que poder indexarse. El 404
 * sí lo lleva porque no hay contenido que ofrecer, y la ruta privada repite el
 * noindex que ya declara en su HTML.
 */
export function robotsDeRuta(ruta: string, estado: number): string | null {
  if (estado === 404) return 'noindex, nofollow';
  if (API.test(ruta)) return 'noindex';
  if (IMAGENES.test(ruta)) return 'noindex, nofollow';
  if (INSCRIPCION.test(ruta)) return 'noindex, follow';
  return null;
}

export interface ContextoCabeceras {
  ruta: string;
  estado: number;
}

/**
 * Aplica las cabeceras sobre la respuesta ya generada. Respeta lo que la ruta
 * haya decidido antes: los endpoints de robots/sitemap fijan su propio
 * `Cache-Control`. Todo lo demás queda `no-store`, como las páginas dinámicas
 * de Next en desarrollo.
 */
export function aplicarCabeceras(respuesta: Response, { ruta, estado }: ContextoCabeceras): Response {
  for (const [nombre, valor] of Object.entries(CABECERAS_SEGURIDAD)) {
    if (nombre === 'Referrer-Policy' && respuesta.headers.has(nombre)) continue;
    respuesta.headers.set(nombre, valor);
  }
  if (!respuesta.headers.has('Cache-Control')) respuesta.headers.set('Cache-Control', 'no-store');
  const robots = robotsDeRuta(ruta, estado);
  if (robots) respuesta.headers.set('X-Robots-Tag', robots);
  // Sólo las páginas que se sirven con éxito: un 404 no describe nada y los
  // recursos que no son HTML no son páginas. El archivo markdown se describe a
  // sí mismo: la especificación dice que la cabecera también sirve para los
  // recursos que no son HTML.
  if (estado === 200 && !respuesta.headers.has('Link')) {
    const enlace = cabeceraLink(ruta, respuesta.headers.get('Content-Type') ?? '');
    if (enlace) respuesta.headers.set('Link', enlace);
  }
  return respuesta;
}

/**
 * Contenido de `_headers` para los assets estáticos. Workers Assets los sirve
 * sin pasar por el Worker, así que el middleware no puede tocarlos: esta regla
 * lleva las mismas cabeceras globales que Next aplica también a sus archivos.
 * No incluye `X-Robots-Tag` ni `no-store`: un asset no es una página.
 *
 * Las imágenes y las fuentes salen con TTL propio. Workers Assets responde
 * `public, max-age=0, must-revalidate` por defecto, así que cada visita volvía a
 * pedir cada foto: en una ficha de carrera son decenas de pedidos y el LCP es
 * una de esas imágenes. Un día de navegador y una semana de `stale-while-revalidate`
 * alcanza para no repetirlas sin dejar una foto vieja pegada un año.
 *
 * Los programas de Teclab (`/planes/`) pesan entre 500 KB y 2,6 MB y salían con
 * el `max-age=0` por defecto: cada descarga volvía a cruzar el mundo entero. Se
 * cachean como las imágenes y no como `/_astro/*`: el archivo se reemplaza en el
 * mismo lugar cuando Teclab actualiza un plan, así que un año de `immutable`
 * dejaría el programa viejo pegado en el navegador de quien ya lo bajó.
 */
export function cabecerasAssets(): string {
  const lineas = ['/*'];
  for (const [nombre, valor] of Object.entries(CABECERAS_SEGURIDAD)) lineas.push(`  ${nombre}: ${valor}`);
  const cacheImagenes = '  Cache-Control: public, max-age=86400, stale-while-revalidate=604800';
  return `${lineas.join('\n')}

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/derivados/*
  Cache-Control: public, max-age=31536000, immutable

/imagenes/*
${cacheImagenes}

/fuentes/*
${cacheImagenes}

/planes/*
${cacheImagenes}
`;
}
