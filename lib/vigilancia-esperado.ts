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
  '/teclab',
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
 *
 * El tercer elemento, cuando esta, fija el codigo exacto y no solo "algun 3xx".
 * Se usa donde el codigo lo decide algo que no vive en este repo y por lo tanto
 * puede cambiar sin que nadie lo note en un diff: hoy, el apex.
 *
 * El caso testigo es de agosto de 2026. `next.config.ts` declara el apex con
 * `permanent: true`, o sea 308, pero produccion devolvia **307**: el redirect no
 * lo hacia Next sino Vercel a nivel de dominio, que corre en el borde antes que
 * la app y traia `redirectStatusCode: 307` de fabrica. La regla del repo nunca
 * se ejecutaba. Un 307 le dice a Google que la mudanza es temporal, asi que
 * nunca consolidaba el apex en www y seguia gastando un pedido por cada URL sin
 * www que tenia anotada — la inspeccion de URLs mostraba `referringUrls:
 * ["https://siglo21sur.com/sitemap.xml"]`, apex, en fichas que nunca llego a
 * rastrear. Se corrigio en el dominio, no en el codigo.
 *
 * Por eso queda fijado aca: si alguien lo vuelve a mover desde el panel de
 * Vercel, los dos vigilantes lo cantan.
 */
export function redirectsEsperados(base: string): Array<[string, string, number?]> {
  return [
    ['https://siglo21sur.com/', 'https://www.siglo21sur.com/', 308],
    ['https://proyecto-inscripciones.vercel.app/', 'https://www.siglo21sur.com/'],
    [`${base}/contactos`, `${base}/contacto`],
    [`${base}/carreras`, `${base}/`],
    [`${base}/novedades`, `${base}/novedades/1`],
    [
      `${base}/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos`,
      `${base}/carreras/tecnicatura-en-videojuegos`,
      301,
    ],
    [
      `${base}/carreras/tecnicatura-superior-en-customer-experience`,
      `${base}/carreras/tecnicatura-superior-en-experiencia-del-cliente`,
      301,
    ],
  ];
}
