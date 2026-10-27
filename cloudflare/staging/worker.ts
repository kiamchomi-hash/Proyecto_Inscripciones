import { resolverDb, type EntornoDb } from '../src/datos/binding.ts';

/** Barrera de preparación, NO es aún el sitio Astro detrás de autenticación.
 * Hasta aprobar un verificador real, no se confía en cabeceras/cookies ni se
 * importa la aplicación. Tampoco se expone un binding ASSETS que la saltee.
 */
export async function buscarStaging(_url: string): Promise<never> {
  throw new Error('Egress de staging deshabilitado');
}

export default {
  async fetch(_request: Request, _env?: unknown): Promise<Response> {
    return barreraCerrada(_request);
  },
  async queue(): Promise<never> {
    throw new Error('Cola de staging no autorizada');
  },
  async scheduled(): Promise<never> {
    throw new Error('Cron de staging no autorizado');
  },
};

/** Sólo el fixture local inyecta el renderizador compilado. El entrypoint por
 * defecto NO lo importa ni lo habilita por variables/cookies/cabeceras.
 * No es un verificador de acceso ni debe publicarse este ensayo.
 */
export function crearEnsayoStaging(
  renderizar: (request: Request) => Promise<Response>,
) {
  return {
    async fetch(request: Request, entorno: EntornoDb & {
      STAGING_ACCESS?: string; OUTBOUND_MODE?: string;
    }): Promise<Response> {
      const cerrada = barreraCerrada(request);
      const ruta = new URL(request.url).pathname;
      if (entorno.APP_STAGE !== 'staging' || !resolverDb(entorno)
        || entorno.STAGING_ACCESS !== 'deny-all' || entorno.OUTBOUND_MODE !== 'disabled'
        // No delegar una API codificada a la normalización interna de Astro.
        || request.method !== 'GET' || ruta.includes('%')
        || /^\/+api(?:\/|$)/i.test(ruta)) return cerrada;
      try {
        const original = await renderizar(request);
        // Nunca conservar Location, Set-Cookie o cache de la aplicación.
        if (original.status !== 200 || !original.headers.get('content-type')?.includes('text/html')) return cerrada;
        const headers = new Headers(cerrada.headers);
        headers.set('Content-Type', 'text/html; charset=utf-8');
        return new Response(original.body, { status: 503, headers });
      } catch { return cerrada; }
    },
    async queue(): Promise<never> { throw new Error('Cola de staging no autorizada'); },
    async scheduled(): Promise<never> { throw new Error('Cron de staging no autorizado'); },
  };
}

function barreraCerrada(_request: Request): Response {
  return new Response(null, { status: 503, headers: {
    'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
  } });
}
