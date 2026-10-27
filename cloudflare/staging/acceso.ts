import { resolverDb, type EntornoDb } from '../src/datos/binding.ts';
import { enviarCorreoControl, leerCuerpo, type BuscarCorreo } from './correo-controlado.ts';
import { manejarConsultaStaging, ACCION, type EntornoConsultaStaging } from './formulario-controlado.ts';
import { enviarTelegramControl, type EntornoTelegramControlado } from './telegram-controlado.ts';

export type EntornoProtegido = EntornoDb & EntornoConsultaStaging & EntornoTelegramControlado & {
  STAGING_ACCESS?: string;
  STAGING_AUTH_SHA256?: string;
  OUTBOUND_MODE?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  SMTP2GO_API_KEY?: string;
  STAGING_CORREO_PARA?: string;
  STAGING_CORREO_HABILITADO?: string;
};

/** Rutas que sobreviven a la barrera además de los HTML: sólo lectura y los ensayos acotados. */
const RUTA_CORREO = '/api/staging-correo';
const RUTA_TELEGRAM = '/api/staging-telegram';

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://i.ytimg.com; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

/** Todas las respuestas pasan por acá, incluidos assets, errores y redirects. */
function proteger(response: Response, head = false): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Content-Security-Policy', CSP);
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Vary', 'Authorization');
  headers.delete('Set-Cookie');
  headers.delete('CDN-Cache-Control');
  headers.delete('Cloudflare-CDN-Cache-Control');
  return new Response(head ? null : response.body, { status: response.status, headers });
}

function rechazo(status = 503): Response {
  return proteger(Response.json({ error: 'Operación deshabilitada en staging. No se guardaron ni enviaron datos.' }, { status }));
}

async function autorizado(request: Request, digest: string): Promise<boolean> {
  const authorization = request.headers.get('Authorization') ?? '';
  if (!/^Basic [A-Za-z0-9+/]+=*$/.test(authorization) || authorization.length > 512) return false;
  const recibido = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(authorization));
  const esperado = Uint8Array.from(digest.match(/../g)!, hex => Number.parseInt(hex, 16));
  // Extensión Web Crypto de workerd; nunca comparar secretos como strings.
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual(a: ArrayBuffer | Uint8Array, b: ArrayBuffer | Uint8Array): boolean;
  };
  return subtle.timingSafeEqual(recibido, esperado);
}

/** El renderizador se inyecta después de autenticar: ni assets ni APIs lo saltean. */
export function crearStagingProtegido(
  renderizar: (request: Request, env: EntornoProtegido, ctx: ExecutionContext) => Promise<Response>,
  opciones: { buscarCorreo?: BuscarCorreo; buscarCaptcha?: BuscarCorreo; buscarTelegram?: BuscarCorreo } = {},
) {
  return {
    async fetch(request: Request, env: EntornoProtegido, ctx: ExecutionContext): Promise<Response> {
      const head = request.method === 'HEAD';
      try {
        if (env.APP_STAGE !== 'staging' || !resolverDb(env)
          || env.STAGING_ACCESS !== 'basic-sha256' || env.OUTBOUND_MODE !== 'disabled'
          || !/^[a-f0-9]{64}$/.test(env.STAGING_AUTH_SHA256 ?? '')) return rechazo();
        if (!await autorizado(request, env.STAGING_AUTH_SHA256!)) {
          return proteger(new Response(null, { status: 401, headers: {
            'WWW-Authenticate': 'Basic realm="Staging", charset="UTF-8"',
          } }));
        }
        const url = new URL(request.url);
        let ruta: string;
        try { ruta = decodeURIComponent(url.pathname); } catch { return rechazo(400); }
        if (/[\\%\u0000-\u001f]/.test(ruta) || ruta.includes('//')) return rechazo(400);
        const esCorreo = ruta === RUTA_CORREO;
        const esFormulario = ruta === '/api/formularios' && env.STAGING_FORMULARIO_HABILITADO === 'si';
        const esTelegram = ruta === RUTA_TELEGRAM && env.STAGING_TELEGRAM_HABILITADO === 'si';
        if (!['GET', 'HEAD'].includes(request.method)
          && !((esCorreo || esFormulario || esTelegram) && request.method === 'POST')) return rechazo();
        if (request.headers.get('Upgrade')) return rechazo();
        if (/^\/api(?:\/|$)/i.test(ruta)) {
          if (esFormulario && request.method === 'POST') return proteger(await manejarConsultaStaging(request, env, opciones.buscarCaptcha));
          if (esTelegram) {
            if (request.method !== 'POST') return rechazo(405);
            let cuerpo: unknown;
            try { cuerpo = await leerCuerpo(request); } catch { return rechazo(400); }
            return proteger(await enviarTelegramControl(env, cuerpo, opciones.buscarTelegram), head);
          }
          if (ruta === '/api/estado') return proteger(Response.json({ ok: true, etapa: 'staging', envios: false }), head);
          if (esCorreo) {
            // Sólo POST despacha; GET/HEAD responden 405 sin tocar la base.
            if (request.method !== 'POST') return rechazo(405);
            let cuerpo: unknown;
            try { cuerpo = await leerCuerpo(request); } catch { return rechazo(400); }
            return proteger(await enviarCorreoControl(env, cuerpo, opciones.buscarCorreo), head);
          }
          if (ruta !== '/api/carreras-detalle') return rechazo();
        }
        if (ruta === '/robots.txt') return proteger(new Response('User-agent: *\nDisallow: /\n', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }), head);
        if (ruta === '/sitemap.xml') return proteger(new Response(null, { status: 404 }));
        const headers = new Headers(request.headers);
        headers.delete('Authorization'); headers.delete('Cookie');
        const limpio = new Request(request, { headers, method: head ? 'GET' : request.method });
        const response = await renderizar(limpio, env, ctx);
        const location = response.headers.get('Location');
        if (location) {
          const destino = new URL(location, url);
          if (![url.origin, 'https://www.siglo21sur.com', 'https://siglo21sur.com'].includes(destino.origin)) return rechazo();
          const salida = new Headers(response.headers);
          salida.set('Location', destino.pathname + destino.search + destino.hash);
          return proteger(new Response(null, { status: response.status, headers: salida }));
        }
        const salida = response.headers.get('Content-Type')?.includes('text/html')
          ? new HTMLRewriter().on('meta[name="robots"], link[rel="dns-prefetch"]', {
            element(element) { element.remove(); },
          }).on('head', {
            element(element) {
              element.append('<meta name="robots" content="noindex, nofollow">', { html: true });
              if (ruta === '/contacto' && env.STAGING_FORMULARIO_HABILITADO === 'si') {
                element.append(`<meta name="turnstile-action" content="${ACCION}">`, { html: true });
                // Sólo el ensayo explica el motivo: en producción este meta no existe.
                element.append('<meta name="formularios-detalle" content="ensayo">', { html: true });
              }
            },
          }).transform(response)
          : response;
        return proteger(salida, head);
      } catch { return rechazo(); }
    },
    async queue(): Promise<never> { throw Error('Colas deshabilitadas en staging'); },
    async scheduled(): Promise<never> { throw Error('Cron deshabilitado en staging'); },
  };
}
