import aplicacion from '../dist/server/entry.mjs';
import { manejarColaProduccion, manejarProgramado } from '../src/operativa/produccion.ts';
import { resolverDb } from '../src/datos/binding.ts';
import { enviarTelegramSeguro } from '../src/operativa/telegram.ts';
import { crearTransportes } from '../src/operativa/transportes.ts';
import { usuariosActivos } from '../src/operativa/analytics.ts';

/**
 * Entry de producción.
 *
 * No lleva ninguna capa de ensayo: ni Basic auth, ni `noindex` global, ni robots
 * cerrado, ni lista blanca de destinatarios. Los secretos y la base llegan por
 * bindings del Worker, nunca por el paquete.
 *
 * La única excepción es la dirección temporal `*.workers.dev`, que existe sólo
 * mientras el dominio real sigue apuntando a Vercel: ahí se agrega
 * `X-Robots-Tag: noindex` y un `robots.txt` cerrado para que esa copia no compita
 * con el sitio publicado. En el dominio real no se toca nada.
 *
 * Deliberadamente no declara `queue` ni `scheduled`: los ejecutores reales del
 * outbox y los programados son otra etapa y todavía no están autorizados.
 * Mientras no existan, las intenciones quedan pendientes en el outbox.
 */

const esDireccionTemporal = (url: URL) => url.hostname.endsWith('.workers.dev');

/** La raíz redirige a `www`, igual que hoy: una sola URL canónica. */
const RAIZ = 'siglo21sur.com';
const CANONICO = 'www.siglo21sur.com';

/**
 * El paquete deja `no-store` por defecto, que es lo correcto para el ensayo y
 * para desarrollo, pero no para el sitio publicado: hoy Next responde
 * `public, max-age=0, must-revalidate`. Se replica sólo esa forma y sólo para
 * HTML público de lectura; las rutas que fijan su propio `Cache-Control`
 * (`/inscripcion/[codigo]`, sitemap, APIs) no se tocan.
 *
 * Además del navegador se cachea en el borde, con una ventana corta y
 * `stale-while-revalidate`: sin eso cada visita renderiza contra D1 y el TTFB
 * queda entre 0,4 y 0,75 s (medido el 27/10/2026 en las 123 URLs del sitemap).
 * `Cloudflare-CDN-Cache-Control` sólo lo entiende Cloudflare y manda sobre el
 * `Cache-Control` del navegador, así que el HTML no se le sirve viejo a quien
 * recarga: el borde revalida cada 5 minutos y, si venció, entrega la copia
 * anterior mientras arma la nueva.
 */
const HTML_PUBLICO = /^(?!\/api(?:\/|$)).*/;
const EDGE_SEGUNDOS = 300;
const EDGE_SWR_SEGUNDOS = 3600;

function cacheDeProduccion(respuesta: Response, request: Request, url: URL): Response {
  const metodo = request.method === 'GET' || request.method === 'HEAD';
  const tipo = respuesta.headers.get('Content-Type') ?? '';
  if (!metodo || respuesta.status !== 200 || !tipo.includes('text/html')) return respuesta;
  if (!HTML_PUBLICO.test(url.pathname)) return respuesta;
  if (respuesta.headers.get('Cache-Control') !== 'no-store') return respuesta;
  const salida = new Response(respuesta.body, respuesta);
  salida.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  salida.headers.set(
    'Cloudflare-CDN-Cache-Control',
    `public, max-age=${EDGE_SEGUNDOS}, stale-while-revalidate=${EDGE_SWR_SEGUNDOS}`,
  );
  return salida;
}

/**
 * Copia de borde del HTML público. Las cabeceras solas no alcanzan: Cloudflare
 * no guarda en su caché las respuestas que genera un Worker —lo comprobé con la
 * regla de caché activa y `Cloudflare-CDN-Cache-Control` puesto, y el
 * `cf-cache-status` no aparecía—, así que la copia se guarda con la Cache API,
 * que es por centro de datos.
 *
 * Consecuencias, dichas sin adornos: cada PoP arma su propia copia, y publicar
 * contenido puede tardar hasta `EDGE_SEGUNDOS` en verse desde otro PoP. Es el
 * mismo orden de atraso que tenía el ISR de Next (1 h en la home, 24 h en las
 * fichas) y por eso el TTL es corto.
 */
const cacheDeBorde = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;

/** Sólo GET, sólo el dominio publicado, y nunca las rutas privadas o de API. */
function claveDeCache(request: Request, url: URL): Request | null {
  if (!cacheDeBorde) return null;
  if (request.method !== 'GET') return null;
  if (url.hostname !== CANONICO) return null;
  if (!HTML_PUBLICO.test(url.pathname)) return null;
  return new Request(url.toString(), { method: 'GET' });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // El dominio ápice no sirve contenido: manda a `www` con 308 y conserva la
    // ruta y la query, como hacía Vercel.
    if (url.hostname === RAIZ) {
      const destino = new URL(request.url);
      destino.hostname = CANONICO;
      destino.protocol = 'https:';
      return new Response(null, {
        status: 308,
        headers: {
          Location: destino.toString(),
          'Cache-Control': 'public, max-age=3600',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }
    const clave = claveDeCache(request, url);
    if (clave) {
      const copia = await cacheDeBorde!.match(clave);
      if (copia) {
        // La copia guardada lleva `max-age` para que el borde la conserve
        // fresca; al navegador se le devuelve la misma forma que antes
        // (`max-age=0`), así una recarga nunca lee HTML de su propio caché.
        const servida = new Response(copia.body, copia);
        servida.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        servida.headers.set(
          'Cloudflare-CDN-Cache-Control',
          `public, max-age=${EDGE_SEGUNDOS}, stale-while-revalidate=${EDGE_SWR_SEGUNDOS}`,
        );
        return servida;
      }
    }

    const respuesta = cacheDeProduccion(await aplicacion.fetch(request, env, ctx), request, url);

    if (clave && respuesta.status === 200
      && (respuesta.headers.get('Content-Type') ?? '').includes('text/html')) {
      // La copia que se guarda lleva su propia frescura: el `max-age=0` del
      // navegador haría que el borde revalidara en cada pedido y no habría caché.
      const paraCache = new Response(respuesta.clone().body, respuesta);
      paraCache.headers.set('Cache-Control', `public, max-age=${EDGE_SEGUNDOS}`);
      ctx.waitUntil(cacheDeBorde!.put(clave, paraCache));
    }

    if (!esDireccionTemporal(url)) return respuesta;

    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    const salida = new Response(respuesta.body, respuesta);
    salida.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return salida;
  },

  async queue(lote, crudo) {
    await manejarColaProduccion(lote, crudo as unknown as Parameters<typeof manejarColaProduccion>[1]);
  },

  async scheduled(evento, crudo) {
    // `env` del handler, no el del módulo: en el contexto programado el binding
    // del módulo no está disponible y la base llegaba nula.
    const entorno = crudo as unknown as {
      DB?: D1Database; APP_STAGE?: string; DB_STAGE?: string; DB_NAME?: string;
      CRON_SECRET?: string; TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string;
      SMTP2GO_API_KEY?: string; CF_ANALYTICS_TOKEN?: string; CF_ACCOUNT_TAG?: string; CF_RUM_SITE_TAG?: string;
    };
    const db = resolverDb(entorno);
    const buscar = (url: string, init: RequestInit) => fetch(url, init);
    const telegramConfig = entorno.TELEGRAM_BOT_TOKEN && entorno.TELEGRAM_CHAT_ID
      ? { token: entorno.TELEGRAM_BOT_TOKEN, chatId: entorno.TELEGRAM_CHAT_ID }
      : undefined;
    await manejarProgramado(evento.cron, {
      db,
      secretoCron: entorno.CRON_SECRET,
      origen: 'https://www.siglo21sur.com',
      buscar,
      telegramConfig,
      smtpClave: entorno.SMTP2GO_API_KEY,
      telegram: (texto, timeoutMs) => enviarTelegramSeguro(telegramConfig, buscar, texto, timeoutMs),
      mail: entorno.SMTP2GO_API_KEY
        ? crearTransportes({ smtp: { clave: entorno.SMTP2GO_API_KEY } }, buscar, db!).mail
        : undefined,
      usuariosActivos: (fecha) => usuariosActivos(fecha, {
        token: entorno.CF_ANALYTICS_TOKEN,
        cuenta: entorno.CF_ACCOUNT_TAG,
        siteTag: entorno.CF_RUM_SITE_TAG,
      }),
    });
  },
} satisfies ExportedHandler<Env>;
