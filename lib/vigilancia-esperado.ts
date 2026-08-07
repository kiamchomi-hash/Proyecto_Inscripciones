// Lo que produccion tiene que cumplir, en un solo lugar.
//
// Hay dos programas que miran esto mismo desde lugares distintos:
//
//   herramientas/smoke.mjs   a mano, desde una maquina, con sockets crudos
//                            para poder medir los bytes que viajan de verdad.
//   app/api/vigilancia       el cron de Vercel, cada 6 horas, con fetch.
//
// El transporte de cada uno es distinto y esta bien que lo sea; lo que no puede
// duplicarse es la lista de que se espera, porque entonces uno de los dos queda
// viejo y nadie se entera. Este archivo es esa lista. No importa nada de Next
// ni de React a proposito: smoke.mjs lo carga con Node pelado (v24 strippea los
// tipos), igual que auditar-contenido.mjs hace con components/index/types.ts.

export const BASE_PROD = 'https://www.siglo21sur.com';

/** Rutas que siempre tienen que devolver 200. */
export const RUTAS = [
  '/',
  '/clases-apoyo',
  '/contacto',
  '/faq',
  '/sobre-nosotros',
  '/novedades/1',
  '/robots.txt',
  '/sitemap.xml',
];

/** Cabeceras de seguridad de next.config.ts, medidas sobre la home. */
export const CABECERAS_ESPERADAS: Record<string, RegExp> = {
  'content-security-policy': /frame-ancestors 'none'/,
  'x-content-type-options': /^nosniff$/,
  'referrer-policy': /strict-origin-when-cross-origin/,
  'permissions-policy': /camera=\(\)/,
};

/** HSTS solo tiene sentido sobre https, por eso va aparte. */
export const HSTS_ESPERADO = /max-age=63072000/;

/** Donde tiene que haber X-Robots-Tag noindex si o si. */
export const NOINDEX: Array<[string, RegExp]> = [
  ['/admin/login', /noindex/],
  ['/api/formularios', /noindex/],
];

/**
 * Redirects declarados en next.config.ts. Solo se prueban contra el dominio
 * propio: contra localhost o un preview no existen.
 */
export function redirectsEsperados(base: string): Array<[string, string]> {
  return [
    ['https://siglo21sur.com/', 'https://www.siglo21sur.com/'],
    ['https://proyecto-inscripciones.vercel.app/', 'https://www.siglo21sur.com/'],
    [`${base}/contactos`, `${base}/contacto`],
    [`${base}/carreras`, `${base}/`],
    [`${base}/novedades`, `${base}/novedades/1`],
  ];
}
