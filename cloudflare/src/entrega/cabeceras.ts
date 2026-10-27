// Cabeceras de entrega del paquete. Los valores globales salen de
// `next.config.ts` (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy) y
// la lista que vigila producción vive en `lib/vigilancia-esperado.ts`.
//
// La CSP conserva sólo los orígenes que este paquete usa: no carga Supabase,
// Google Analytics ni un proveedor de analítica externo, así que no se autorizan. Sí necesita
// `challenges.cloudflare.com` para Turnstile, que Next también declara, y
// `static.cloudflareinsights.com` para el beacon de Cloudflare Web Analytics:
// sin ese origen la CSP bloquea el script y el sitio queda sin medición de
// visitas. El beacon manda sus datos a `cloudflareinsights.com`, por eso también
// figura en `connect-src`.
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
const INSCRIPCION_CARRERA = /^\/carreras\/[^/]+\/inscripcion\/?$/;

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
  if (INSCRIPCION_CARRERA.test(ruta)) return 'noindex, follow';
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
 */
export function cabecerasAssets(): string {
  const lineas = ['/*'];
  for (const [nombre, valor] of Object.entries(CABECERAS_SEGURIDAD)) lineas.push(`  ${nombre}: ${valor}`);
  const cacheImagenes = '  Cache-Control: public, max-age=86400, stale-while-revalidate=604800';
  return `${lineas.join('\n')}

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/imagenes/*
${cacheImagenes}

/fuentes/*
${cacheImagenes}
`;
}
