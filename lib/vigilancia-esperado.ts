// Lo que produccion tiene que cumplir, en un solo lugar.
//
// Hay dos programas que miran esto mismo desde lugares distintos:
//
//   herramientas/smoke.mjs   a mano, desde una maquina, con sockets crudos
//                            para poder medir los bytes que viajan de verdad.
//   cloudflare/src/api/vigilancia  el cron del Worker, cada 6 horas, con fetch.
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
  '/teclab/inscripcion',
  '/clases-apoyo',
  '/calendario-academico',
  '/contacto',
  '/faq',
  '/sobre-nosotros',
  '/novedades/1',
  '/robots.txt',
  '/sitemap.xml',
];

/** Cabeceras de seguridad de `cloudflare/src/entrega/cabeceras.ts`, medidas sobre la home. */
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
  ['/api/formularios', /noindex/],
  ['/carreras/tecnicatura-superior-en-programacion/inscripcion', /noindex/],
];

/**
 * Sondas que no son GET, declaradas aca por el mismo motivo que RUTAS: los dos
 * vigilantes tienen que probar lo mismo.
 *
 * Cada sonda manda datos que no existen, asi que la corrida no escribe nada: lo
 * que se mide es que el endpoint siga resolviendo su base y no responda 503.
 *
 * El caso testigo es del 30/10/2026. La baja del newsletter tomaba la base solo
 * con `APP_STAGE=local`, de modo que en produccion respondia 503 a toda baja, y
 * ninguno de los dos vigilantes podia verlo porque solo probaban GET: el sitio
 * estuvo tres dias sin permitir darse de baja sin que sonara una alarma.
 */
export const SONDAS: Array<{
  etiqueta: string;
  ruta: string;
  metodo: 'POST';
  tipo: string;
  cuerpo: string;
  esperado: number;
  /** Que significa el fallo, en una linea para el aviso de Telegram. */
  problema: string;
}> = [
  {
    etiqueta: 'baja del newsletter',
    // UUID con formato valido que no existe: la baja responde 200 y no escribe.
    ruta: '/api/newsletter/baja?id=00000000-0000-4000-8000-000000000000',
    metodo: 'POST',
    tipo: 'application/x-www-form-urlencoded',
    cuerpo: 'List-Unsubscribe=One-Click',
    esperado: 200,
    problema: 'La baja del newsletter no funciona: quien pide dejar de recibir los mails no puede darse de baja y va a seguir recibiéndolos. Revisar ese endpoint en el sitio publicado.',
  },
];

/**
 * Redirects declarados en `cloudflare/src/entrega/redirects.ts`. Solo se prueban
 * contra el dominio propio: contra localhost o un preview no existen.
 *
 * El tercer elemento, cuando esta, fija el codigo exacto y no solo "algun 3xx".
 * Se usa donde el codigo lo decide algo que no vive en este repo y por lo tanto
 * puede cambiar sin que nadie lo note en un diff: hoy, el apex.
 *
 * El caso testigo es de agosto de 2026. El repo declaraba el apex con
 * `permanent: true`, o sea 308, pero produccion devolvia **307**: el redirect no
 * lo hacia la app sino el borde, que corre antes y traia 307 de fabrica. La
 * regla del repo nunca se ejecutaba. Un 307 le dice a Google que la mudanza es
 * temporal, asi que nunca consolidaba el apex en www y seguia gastando un
 * pedido por cada URL sin www que tenia anotada — la inspeccion de URLs mostraba
 * `referringUrls: ["https://siglo21sur.com/sitemap.xml"]`, apex, en fichas que
 * nunca llego a rastrear. Se corrigio en el borde, no en el codigo.
 *
 * Por eso queda fijado aca: si alguien lo vuelve a mover desde el panel, los dos
 * vigilantes lo cantan.
 */
export function redirectsEsperados(base: string): Array<[string, string, number?]> {
  return [
    ['https://siglo21sur.com/', 'https://www.siglo21sur.com/', 308],
    [`${base}/contactos`, `${base}/contacto`],
    [`${base}/carreras`, `${base}/`],
    [`${base}/novedades`, `${base}/novedades/1`],
    [
      `${base}/carreras/tecnicatura-superior-en-customer-experience`,
      `${base}/carreras/tecnicatura-superior-en-experiencia-del-cliente`,
      301,
    ],
  ];
}
