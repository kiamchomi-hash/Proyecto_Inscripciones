// Copia de borde del HTML público, separada del entry para poder probarla.
//
// El paquete deja `no-store` por defecto, que es lo correcto para el ensayo y
// para desarrollo, pero no para el sitio publicado: Next respondía
// `public, max-age=0, must-revalidate`. Acá se replica sólo esa forma y sólo
// para HTML público de lectura; las rutas que fijan su propio `Cache-Control`
// (sitemap, robots, APIs) no se tocan.
//
// Las cabeceras solas no alcanzan: Cloudflare no guarda en su caché las
// respuestas que genera un Worker, así que la copia se guarda con la Cache API,
// que es por centro de datos. Consecuencias, dichas sin adornos: cada PoP arma
// su propia copia y publicar contenido puede tardar hasta `EDGE_SEGUNDOS` en
// verse desde otro PoP. Es el mismo orden de atraso que tenía el ISR de Next
// (1 h en la home, 24 h en las fichas) y por eso el TTL es corto.
//
// `Cloudflare-CDN-Cache-Control` sólo lo entiende Cloudflare y manda sobre el
// `Cache-Control` del navegador, así que el HTML no se le sirve viejo a quien
// recarga: el borde revalida cada cinco minutos y, si venció, entrega la copia
// anterior mientras arma la nueva.

/** Una sola URL canónica: el ápice redirige acá y no entra a la copia. */
export const CANONICO = 'www.siglo21sur.com';

/** Todo menos las APIs: son las únicas respuestas que nunca se publican. */
export const HTML_PUBLICO = /^(?!\/api(?:\/|$)).*/;

export const EDGE_SEGUNDOS = 300;
export const EDGE_SWR_SEGUNDOS = 3600;

const FRESCURA_BORDE = `public, max-age=${EDGE_SEGUNDOS}, stale-while-revalidate=${EDGE_SWR_SEGUNDOS}`;
const FRESCURA_NAVEGADOR = 'public, max-age=0, must-revalidate';

export interface EntregaCache {
  respuesta: Response;
  /** Si este entry declaró la respuesta cacheable. */
  publica: boolean;
}

/**
 * Normaliza la respuesta del sitio y dice si se puede guardar.
 *
 * `publica` no se deduce del status y el tipo en el lugar del guardado: una
 * página que fija su propio `no-store` a propósito —hoy no hay ninguna, pero es
 * la clase de ruta que se agrega mañana— quedaría cacheada igual y el guardado
 * le pisaría la cabecera. La decisión se toma una sola vez, acá.
 */
export function normalizarParaCache(
  respuesta: Response, request: Request, url: URL,
): EntregaCache {
  const metodo = request.method === 'GET' || request.method === 'HEAD';
  const tipo = respuesta.headers.get('Content-Type') ?? '';
  const publica = metodo && respuesta.status === 200 && tipo.includes('text/html')
    && HTML_PUBLICO.test(url.pathname)
    && respuesta.headers.get('Cache-Control') === 'no-store';
  if (!publica) return { respuesta, publica: false };

  const salida = new Response(respuesta.body, respuesta);
  salida.headers.set('Cache-Control', FRESCURA_NAVEGADOR);
  salida.headers.set('Cloudflare-CDN-Cache-Control', FRESCURA_BORDE);
  return { respuesta: salida, publica: true };
}

/** Sólo GET, sólo el dominio publicado, y nunca las rutas privadas o de API. */
export function claveDeCache(request: Request, url: URL): Request | null {
  if (request.method !== 'GET') return null;
  if (url.hostname !== CANONICO) return null;
  if (!HTML_PUBLICO.test(url.pathname)) return null;
  return new Request(url.toString(), { method: 'GET' });
}

/**
 * La copia que se guarda lleva su propia frescura: el `max-age=0` del navegador
 * haría que el borde revalidara en cada pedido y no habría caché.
 */
export function copiaParaGuardar(respuesta: Response): Response {
  const copia = new Response(respuesta.clone().body, respuesta);
  copia.headers.set('Cache-Control', `public, max-age=${EDGE_SEGUNDOS}`);
  return copia;
}

/**
 * Lo que se devuelve al navegador desde una copia del borde: la misma forma que
 * antes (`max-age=0`), así una recarga nunca lee HTML de su propio caché.
 */
export function servirDesdeCopia(copia: Response): Response {
  const servida = new Response(copia.body, copia);
  servida.headers.set('Cache-Control', FRESCURA_NAVEGADOR);
  servida.headers.set('Cloudflare-CDN-Cache-Control', FRESCURA_BORDE);
  return servida;
}
