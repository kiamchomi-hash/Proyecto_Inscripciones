import aplicacion from '../dist/server/entry.mjs';
import { manejarColaProduccion, manejarProgramado } from '../src/operativa/produccion.ts';
import { resolverDb } from '../src/datos/binding.ts';
import { enviarTelegramSeguro } from '../src/operativa/telegram.ts';
import { crearTransportes, type ConfigEnvios, type CorreoBinding } from '../src/operativa/transportes.ts';
import { usuariosActivos } from '../src/operativa/analytics.ts';
import {
  CANONICO, claveDeCache, copiaParaGuardar, normalizarParaCache, servirDesdeCopia,
} from '../src/entrega/cache-borde.ts';

/**
 * Entry de producción.
 *
 * No lleva ninguna capa de ensayo: ni Basic auth, ni `noindex` global, ni robots
 * cerrado, ni lista blanca de destinatarios. Los secretos y la base llegan por
 * bindings del Worker, nunca por el paquete.
 *
 * La única excepción es la dirección temporal `*.workers.dev`: ahí se agrega
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

/**
 * Copia de borde del HTML público. La normalización de cabeceras y la clave
 * viven en `src/entrega/cache-borde.ts`, que sí se puede probar: el entry
 * arrastra el build de Astro. Acá queda sólo el cableado con la Cache API.
 */
const cacheDeBorde = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // El dominio ápice no sirve contenido: manda a `www` con 308 y conserva la
    // ruta y la query.
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
    const clave = cacheDeBorde ? claveDeCache(request, url) : null;
    if (clave) {
      const copia = await cacheDeBorde!.match(clave);
      if (copia) return servirDesdeCopia(copia);
    }

    const { respuesta, publica } = normalizarParaCache(
      await aplicacion.fetch(request, env, ctx), request, url,
    );

    if (clave && publica) {
      ctx.waitUntil(cacheDeBorde!.put(clave, copiaParaGuardar(respuesta)));
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
      EMAIL?: CorreoBinding; SMTP2GO_API_KEY?: string;
      CF_ANALYTICS_TOKEN?: string; CF_ACCOUNT_TAG?: string; CF_RUM_SITE_TAG?: string;
    };
    const db = resolverDb(entorno);
    const buscar = (url: string, init: RequestInit) => fetch(url, init);
    const telegramConfig = entorno.TELEGRAM_BOT_TOKEN && entorno.TELEGRAM_CHAT_ID
      ? { token: entorno.TELEGRAM_BOT_TOKEN, chatId: entorno.TELEGRAM_CHAT_ID }
      : undefined;
    // El binding de correo, si está configurado, tiene prioridad sobre la clave
    // de SMTP2GO: no hay credencial que custodiar ni rotar.
    const correo: ConfigEnvios = {
      ...(entorno.EMAIL ? { email: entorno.EMAIL } : {}),
      ...(entorno.SMTP2GO_API_KEY ? { smtp: { clave: entorno.SMTP2GO_API_KEY } } : {}),
    };
    await manejarProgramado(evento.cron, {
      db,
      secretoCron: entorno.CRON_SECRET,
      origen: 'https://www.siglo21sur.com',
      buscar,
      telegramConfig,
      correo: entorno.EMAIL,
      smtpClave: entorno.SMTP2GO_API_KEY,
      telegram: (texto, timeoutMs) => enviarTelegramSeguro(telegramConfig, buscar, texto, timeoutMs),
      mail: Object.keys(correo).length > 0
        ? crearTransportes(correo, buscar, db!).mail
        : undefined,
      usuariosActivos: (fecha) => usuariosActivos(fecha, {
        token: entorno.CF_ANALYTICS_TOKEN,
        cuenta: entorno.CF_ACCOUNT_TAG,
        siteTag: entorno.CF_RUM_SITE_TAG,
      }),
    });
  },
} satisfies ExportedHandler<Env>;
