import { comprobarCupo } from '../src/datos/control.ts';
import { consumirEfecto } from '../src/operativa/consumidores.ts';
import { crearTransportes } from '../src/operativa/transportes.ts';

/**
 * Aviso de Telegram controlado, EXCLUSIVO de staging.
 *
 * No lo importa nada de `src/`, así que no existe en el build de producción ni
 * en la aplicación Astro: sólo entra al Worker publicado por
 * `staging/publicar-worker.ts`. Consume **la** fila `aviso-lead` pendiente con el
 * transporte real, sin barrido, sin cola y sin cron.
 *
 * Falla cerrada: sin bandera, sin token, sin chat autorizado o sin base responde
 * 503 sin tocar la base ni la red. El cupo durable se registra ANTES del
 * despacho; el propio outbox agrega reclamo y estado `ambiguo` conservador, así
 * que un reintento no duplica el mensaje.
 */

export const URL_TELEGRAM_PREFIJO = 'https://api.telegram.org/bot';
export const URL_TELEGRAM_SUFIJO = '/sendMessage';
/** ID fijo del servidor: no cambia con el deploy ni se recibe del pedido. */
export const CLAVE_CUPO = 'staging-telegram-control:autorizado-20261026-01';
export const MAXIMO_ENVIOS = 1;
export const VENTANA_SEGUNDOS = 31536000;

export type BuscarTelegram = (url: string, init: RequestInit) => Promise<Response>;

export interface EntornoTelegramControlado {
  DB?: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  STAGING_TELEGRAM_CHAT_SHA256?: string;
  STAGING_TELEGRAM_HABILITADO?: string;
}

function respuesta(cuerpo: Record<string, unknown>, status: number): Response {
  return Response.json(cuerpo, { status });
}

async function digest(valor: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valor));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

/** Token con la forma que espera el endpoint; el chat es un entero con signo. */
const tokenUtilizable = (valor: string | undefined): valor is string =>
  typeof valor === 'string' && /^\d+:[A-Za-z0-9_-]{20,}$/.test(valor);
const chatUtilizable = (valor: string | undefined): valor is string =>
  typeof valor === 'string' && /^-?\d{1,20}$/.test(valor);

/**
 * El cuerpo sólo puede ser `{}`: cualquier campo se rechaza con su código para
 * que `chat_id`, `cc`, `lote` o un array de destinatarios fallen explícitamente.
 */
export function validarPedido(cuerpo: unknown): { ok: true } | { ok: false; status: number; codigo: string } {
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return { ok: false, status: 400, codigo: 'cuerpo-invalido' };
  }
  const claves = Object.keys(cuerpo as Record<string, unknown>);
  if (claves.length > 0) {
    const nombre = claves[0].toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'desconocido';
    return { ok: false, status: 400, codigo: `campo-no-admitido:${nombre}` };
  }
  return { ok: true };
}

type Resultado = 'enviado' | 'error' | 'ambiguo' | 'sin-transporte' | 'no-pendiente' | 'inexistente' | 'omitido';

const ESTADOS: Record<Resultado, { estado: Resultado; status: number }> = {
  enviado: { estado: 'enviado', status: 200 },
  error: { estado: 'error', status: 502 },
  ambiguo: { estado: 'ambiguo', status: 502 },
  'sin-transporte': { estado: 'sin-transporte', status: 503 },
  'no-pendiente': { estado: 'no-pendiente', status: 409 },
  inexistente: { estado: 'inexistente', status: 409 },
  omitido: { estado: 'omitido', status: 409 },
};

/**
 * Un único despacho sobre la fila pendiente que dejó el formulario real.
 *
 * Se exige exactamente una `aviso-lead` pendiente: con cero o con varias no se
 * elige a ciegas. `accepted` no se inventa: sólo `enviado` cuando el transporte
 * devolvió 2xx de Telegram.
 */
export async function enviarTelegramControl(
  entorno: EntornoTelegramControlado,
  cuerpo: unknown,
  redReal?: (url: string, init: RequestInit) => Promise<Response>,
): Promise<Response> {
  if (entorno.STAGING_TELEGRAM_HABILITADO !== 'si') {
    return respuesta({ estado: 'deshabilitado', error: 'ruta-deshabilitada' }, 503);
  }
  const token = entorno.TELEGRAM_BOT_TOKEN;
  const chatId = entorno.TELEGRAM_CHAT_ID;
  if (!tokenUtilizable(token) || !chatUtilizable(chatId)) {
    return respuesta({ estado: 'deshabilitado', error: 'telegram-sin-configurar' }, 503);
  }
  const esperado = entorno.STAGING_TELEGRAM_CHAT_SHA256;
  if (typeof esperado !== 'string' || !/^[a-f0-9]{64}$/.test(esperado)) {
    return respuesta({ estado: 'deshabilitado', error: 'chat-sin-autorizar' }, 503);
  }
  if (await digest(chatId) !== esperado) {
    return respuesta({ estado: 'rechazado', error: 'chat-no-autorizado' }, 403);
  }
  if (!redReal) return respuesta({ estado: 'deshabilitado', error: 'transporte-no-cableado' }, 503);
  const db = entorno.DB;
  if (!db) return respuesta({ estado: 'deshabilitado', error: 'sin-base' }, 503);

  const pedido = validarPedido(cuerpo);
  if (!pedido.ok) return respuesta({ estado: 'rechazado', error: pedido.codigo }, pedido.status);

  let pendientes: { id: number }[];
  try {
    pendientes = (await db.prepare(
      "SELECT id FROM outbox WHERE tipo = 'aviso-lead' AND estado = 'pendiente' ORDER BY id",
    ).all<{ id: number }>()).results;
  } catch {
    return respuesta({ estado: 'rechazado', error: 'base-no-consultable' }, 503);
  }
  if (pendientes.length === 0) return respuesta({ estado: 'inexistente', error: 'sin-aviso-pendiente' }, 409);
  if (pendientes.length > 1) {
    return respuesta({ estado: 'rechazado', error: 'multiples-avisos-pendientes', pendientes: pendientes.length }, 409);
  }

  let permitido: boolean;
  try {
    permitido = await comprobarCupo(db, CLAVE_CUPO, MAXIMO_ENVIOS, VENTANA_SEGUNDOS);
  } catch {
    return respuesta({ estado: 'rechazado', error: 'cupo-no-verificable' }, 503);
  }
  if (!permitido) return respuesta({ estado: 'rechazado', error: 'cupo-agotado', maximo: MAXIMO_ENVIOS }, 429);

  // Desde acá el intento ya está consumido: no se reembolsa ni se repite solo.
  let resultado: Resultado;
  try {
    const transportes = crearTransportes(
      { telegram: { token, chatId } },
      crearBusquedaTelegram(redReal),
      db,
    );
    resultado = await consumirEfecto(db, pendientes[0].id, transportes) as Resultado;
  } catch {
    // Pudo haber salido: ambiguo y sin reintento, porque el cupo ya está usado.
    return respuesta({ estado: 'ambiguo', error: 'transporte-incierto', noReintentar: true }, 502);
  }
  const mapeado = ESTADOS[resultado] ?? { estado: 'error' as Resultado, status: 502 };
  return respuesta({
    estado: mapeado.estado,
    ...(mapeado.estado === 'enviado' ? { aceptado: true } : { noReintentar: mapeado.estado === 'ambiguo' }),
  }, mapeado.status);
}

/**
 * Único egreso del ensayo: `sendMessage` del bot autorizado por POST y sin seguir
 * redirecciones. Cualquier otra URL o método falla antes de tocar la red.
 */
export function crearBusquedaTelegram(
  redReal: (url: string, init: RequestInit) => Promise<Response>,
): BuscarTelegram {
  return async (url, init) => {
    if (init?.method !== 'POST' || !url.startsWith(URL_TELEGRAM_PREFIJO) || !url.endsWith(URL_TELEGRAM_SUFIJO)) {
      return Promise.reject(new Error('Egreso de Telegram fuera de alcance'));
    }
    const respuestaHttp = await redReal(url, { ...init, redirect: 'manual' });
    if (respuestaHttp.status >= 300 && respuestaHttp.status < 400) {
      throw new Error('Redireccion de Telegram no autorizada');
    }
    return respuestaHttp;
  };
}
