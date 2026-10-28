/**
 * Alertas de Cloudflare Notifications reenviadas a Telegram.
 *
 * Cloudflare publica un pedido por cada alerta contra un destino webhook y
 * firma ese pedido con el «webhook secret» del destino, en la cabecera
 * `cf-webhook-auth`. Sin `ALERTA_CLOUDFLARE_SECRETO` el handler falla cerrado
 * (503): el endpoint es público y sin secreto cualquiera podría llenar el chat.
 *
 * Del cuerpo sólo se usan `name` y `text`, recortados y sin caracteres de
 * control. El resto de lo que manda Cloudflare (`data`, `ts`, `policy_id`) se
 * descarta: la alerta que llega al chat tiene que ser el texto del aviso, no un
 * volcado del payload.
 */

import { consumirCupoAlerta } from '../datos/control.ts';
import { ipConfiable } from './ip.ts';

const MAXIMO_NOMBRE = 80;
const MAXIMO_TEXTO = 700;

export type EntornoAlertaCloudflare = {
  telegram?: (texto: string) => Promise<boolean>;
  secreto?: string;
};

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const esRegistro = (valor: unknown): valor is Record<string, unknown> =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor);

function texto(valor: unknown, max: number): string {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Comparación de longitud constante: no filtra cuántos caracteres acertaron. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

export async function manejarAlertaCloudflare(
  request: Request, db: D1Database | null, entorno: EntornoAlertaCloudflare,
): Promise<Response> {
  try {
    if (!entorno.secreto) return respuesta({ ok: false, error: 'sin-configurar' }, 503);
    const recibido = request.headers.get('cf-webhook-auth') ?? '';
    if (!iguales(recibido, entorno.secreto)) return respuesta({ ok: false }, 401);

    let cuerpo: unknown;
    try {
      cuerpo = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return respuesta({ ok: false }, 400);
    }
    if (!esRegistro(cuerpo)) return respuesta({ ok: false }, 400);

    const nombre = texto(cuerpo.name, MAXIMO_NOMBRE);
    const detalle = texto(cuerpo.text, MAXIMO_TEXTO);
    if (!nombre && !detalle) return respuesta({ ok: false }, 400);

    // El cupo se consume recién después de validar el secreto: un pedido sin
    // firma no gasta base ni cuenta contra el tope de quien sí lo tiene. Sin
    // base se pierde el tope antes que el aviso: la alerta es el objetivo.
    if (db) {
      const permitido = await consumirCupoAlerta(db, 'alerta-cloudflare', ipConfiable(request));
      if (!permitido) return respuesta({ ok: true, skipped: true });
    }

    if (!entorno.telegram) return respuesta({ ok: false }, 502);
    const aviso = [`Cloudflare: ${nombre || 'alerta'}`, detalle].filter(Boolean).join('\n');
    const enviado = await entorno.telegram(aviso);
    return respuesta({ ok: enviado }, enviado ? 200 : 502);
  } catch (error) {
    console.error('[alerta-cloudflare]', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
    return respuesta({ ok: false });
  }
}
