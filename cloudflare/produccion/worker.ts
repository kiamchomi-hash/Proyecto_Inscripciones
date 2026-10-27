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
 */
const HTML_PUBLICO = /^(?!\/(?:api|inscripcion)(?:\/|$)).*/;

function cacheDeProduccion(respuesta: Response, request: Request, url: URL): Response {
  const metodo = request.method === 'GET' || request.method === 'HEAD';
  const tipo = respuesta.headers.get('Content-Type') ?? '';
  if (!metodo || respuesta.status !== 200 || !tipo.includes('text/html')) return respuesta;
  if (!HTML_PUBLICO.test(url.pathname)) return respuesta;
  if (respuesta.headers.get('Cache-Control') !== 'no-store') return respuesta;
  const salida = new Response(respuesta.body, respuesta);
  salida.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return salida;
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
    const respuesta = cacheDeProduccion(await aplicacion.fetch(request, env, ctx), request, url);
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
