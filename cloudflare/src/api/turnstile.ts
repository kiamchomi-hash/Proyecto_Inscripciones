/**
 * Verificación de Turnstile, con el mismo contrato que `lib/turnstile.ts`:
 * `siteverify`, timeout de 8 s, `success === true` y —si hay lista configurada—
 * el `hostname` devuelto tiene que coincidir ignorando `www.`, protocolo, puerto
 * y path. Sin secreto lanza, como el original: quien decide el 503 es el handler.
 *
 * `buscar` se inyecta para que ninguna prueba salga a la red. El adaptador del
 * Worker le pasa `fetch`; las pruebas, un doble que devuelve respuestas sintéticas.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const TIMEOUT_TURNSTILE_MS = 8_000;

export interface OpcionesTurnstile {
  secreto: string;
  /** `TURNSTILE_EXPECTED_HOSTNAME`, separado por comas. */
  hostnamesPermitidos?: string;
  /** Guardas adicionales del ensayo de staging; no cambian consumidores existentes. */
  hostnameExacto?: string;
  accionEsperada?: string;
  buscar: (url: string, init: RequestInit) => Promise<Response>;
}

// Normaliza para comparar: minúsculas, sin protocolo, sin path ni puerto y sin el
// "www." inicial, así el apex y el subdominio www cuentan como el mismo sitio.
export function normalizarHost(valor: unknown): string {
  const host = typeof valor === 'string' ? valor : '';
  return host.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[/:].*$/, '')
    .replace(/^www\./, '');
}

export function hostsPermitidos(valor: string | undefined): string[] {
  return (valor ?? '').split(',').map(normalizarHost).filter(Boolean);
}

export async function verificarTurnstile(
  token: string, ip: string | undefined, opciones: OpcionesTurnstile,
): Promise<boolean> {
  if (!opciones.secreto) throw new Error('Turnstile no configurado');

  const cuerpo = new URLSearchParams({ secret: opciones.secreto, response: token });
  if (ip) cuerpo.set('remoteip', ip);

  let respuesta: Response;
  try {
    respuesta = await opciones.buscar(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: cuerpo,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_TURNSTILE_MS),
    });
  } catch {
    // Red caída o timeout: un captcha que no se pudo verificar no es válido.
    console.error('[turnstile] No se pudo consultar siteverify');
    return false;
  }

  if (!respuesta.ok) {
    console.error('[turnstile] siteverify respondió', respuesta.status);
    return false;
  }

  let resultado: { success?: boolean; hostname?: string; action?: string; 'error-codes'?: string[] };
  try {
    resultado = await respuesta.json() as typeof resultado;
  } catch {
    console.error('[turnstile] siteverify devolvió una respuesta ilegible');
    return false;
  }

  if (resultado.success !== true) {
    // Sólo los códigos: nunca el token ni la IP.
    console.error('[turnstile] Token rechazado', { codes: resultado['error-codes'] ?? [] });
    return false;
  }

  if ((opciones.hostnameExacto && resultado.hostname !== opciones.hostnameExacto)
    || (opciones.accionEsperada && resultado.action !== opciones.accionEsperada)) return false;
  const permitidos = hostsPermitidos(opciones.hostnamesPermitidos);
  if (permitidos.length && !permitidos.includes(normalizarHost(resultado.hostname ?? ''))) {
    console.error('[turnstile] Hostname inesperado', {
      recibido: resultado.hostname, esperados: permitidos,
    });
    return false;
  }
  return true;
}
