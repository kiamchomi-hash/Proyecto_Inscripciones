import { comprobarCupo } from '../src/datos/control.ts';

/**
 * Ruta de correo controlado, EXCLUSIVA de staging.
 *
 * No la importa nada de `src/`, así que no existe en el build de producción ni
 * en la aplicación Astro: sólo entra al Worker publicado por
 * `staging/publicar-worker.ts`. Falla cerrada: sin `STAGING_CORREO_HABILITADO`,
 * sin clave de SMTP2GO, sin destinatario autorizado o sin transporte cableado
 * responde 503 y no toca la base ni la red.
 *
 * El cupo durable vive en `form_rate_limits`, la misma tabla y el mismo UPSERT
 * atómico que usan los formularios: se registra ANTES del despacho, así que un
 * reintento (incluso después de un resultado ambiguo) no puede duplicar el
 * correo. No se agregó ninguna tabla ni migración.
 */

export const URL_SMTP2GO = 'https://api.smtp2go.com/v3/email/send';
export const REMITENTE = 'CAU Online <inscripciones@siglo21sur.com>';
/** Segundo ensayo autorizado explícitamente el 26/10. ID fijo del servidor:
 * no cambia con el deploy ni se recibe del pedido. La reserva del primer ensayo
 * (staging-correo-control:<digest>) permanece intacta, incluso si fue ambiguo.
 */
export const CLAVE_CUPO = 'staging-correo-control:autorizado-20261026-02';
export const MAXIMO_ENVIOS = 1;
export const VENTANA_SEGUNDOS = 31536000;
const TIMEOUT_MS = 8000;
const TOPE_CUERPO = 2048;

export type BuscarCorreo = (url: string, init: RequestInit) => Promise<Response>;

export interface EntornoCorreoControlado {
  DB?: D1Database;
  SMTP2GO_API_KEY?: string;
  STAGING_CORREO_PARA?: string;
  STAGING_CORREO_HABILITADO?: string;
}

const REGEX_CORREO = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

/** Trim + minúsculas + una única dirección simple; comas, cabeceras y lotes no pasan. */
export function normalizarDestinatario(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim().toLowerCase();
  if (limpio.length < 6 || limpio.length > 254) return null;
  if (!REGEX_CORREO.test(limpio)) return null;
  return limpio;
}

export type PedidoControl =
  | { ok: true; para: string }
  | { ok: false; status: number; codigo: string };

/**
 * El cuerpo admite un único campo, `para`. Cualquier otro nombre se rechaza con
 * su código: así `cc`, `bcc`, `cco`, `lista`, `lote` o un array de destinatarios
 * fallan explícitamente en vez de ignorarse.
 */
export function validarPedidoControl(cuerpo: unknown, autorizado: string | null): PedidoControl {
  if (!autorizado) return { ok: false, status: 503, codigo: 'allowlist-sin-configurar' };
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return { ok: false, status: 400, codigo: 'cuerpo-invalido' };
  }
  const datos = cuerpo as Record<string, unknown>;
  const extra = Object.keys(datos).filter(clave => clave !== 'para');
  if (extra.length > 0) {
    const nombre = extra[0].toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'desconocido';
    return { ok: false, status: 400, codigo: `campo-no-admitido:${nombre}` };
  }
  const para = normalizarDestinatario(datos.para);
  if (!para) return { ok: false, status: 400, codigo: 'destinatario-invalido' };
  if (para !== autorizado) return { ok: false, status: 403, codigo: 'destinatario-no-autorizado' };
  return { ok: true, para };
}

/** Texto neutro de comprobación: no es cotización, inscripción ni aviso de clases. */
function armarControl() {
  const asunto = 'Prueba de correo del entorno de staging';
  const texto = [
    'Este es un mensaje de prueba del entorno de staging del sitio del CAU Villa Lugano.',
    '',
    'No es una cotización, una inscripción ni un aviso de clases. Se envía una sola vez',
    'para comprobar el canal de correo.',
    '',
    'Si lo recibiste por error, ignoralo.',
  ].join('\n');
  const html = `<p>Este es un mensaje de prueba del entorno de staging del sitio del CAU Villa Lugano.</p>
<p>No es una cotizaci&oacute;n, una inscripci&oacute;n ni un aviso de clases. Se env&iacute;a una sola vez para comprobar el canal de correo.</p>
<p>Si lo recibiste por error, ignoralo.</p>`;
  return { asunto, texto, html };
}

async function digest(valor: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valor));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

function respuesta(cuerpo: Record<string, unknown>, status: number): Response {
  return Response.json(cuerpo, { status });
}

const registro = (valor: unknown): Record<string, unknown> | null =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? valor as Record<string, unknown> : null;

/**
 * Un único despacho por clave de cupo. El estado devuelto es lo que informó el
 * proveedor: `accepted` no significa entregado en el buzón.
 */
export async function enviarCorreoControl(
  entorno: EntornoCorreoControlado,
  cuerpo: unknown,
  buscar?: BuscarCorreo,
): Promise<Response> {
  if (entorno.STAGING_CORREO_HABILITADO !== 'si') {
    return respuesta({ estado: 'deshabilitado', error: 'ruta-deshabilitada' }, 503);
  }
  const claveSmtp = entorno.SMTP2GO_API_KEY;
  if (!claveSmtp) return respuesta({ estado: 'deshabilitado', error: 'smtp-sin-configurar' }, 503);
  if (!buscar) return respuesta({ estado: 'deshabilitado', error: 'transporte-no-cableado' }, 503);
  const autorizado = normalizarDestinatario(entorno.STAGING_CORREO_PARA);
  if (!autorizado) return respuesta({ estado: 'deshabilitado', error: 'allowlist-sin-configurar' }, 503);
  const db = entorno.DB;
  if (!db) return respuesta({ estado: 'deshabilitado', error: 'sin-base' }, 503);

  const pedido = validarPedidoControl(cuerpo, autorizado);
  if (!pedido.ok) return respuesta({ estado: 'rechazado', error: pedido.codigo }, pedido.status);

  let permitido: boolean;
  try {
    permitido = await comprobarCupo(db, `${CLAVE_CUPO}:${await digest(pedido.para)}`, MAXIMO_ENVIOS, VENTANA_SEGUNDOS);
  } catch {
    return respuesta({ estado: 'rechazado', error: 'cupo-no-verificable' }, 503);
  }
  if (!permitido) return respuesta({ estado: 'rechazado', error: 'cupo-agotado', maximo: MAXIMO_ENVIOS }, 429);

  // Desde acá el intento ya está consumido: no se reembolsa ni se repite solo.
  const mail = armarControl();
  let respuestaHttp: Response;
  try {
    respuestaHttp = await buscar(URL_SMTP2GO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Smtp2go-Api-Key': claveSmtp },
      body: JSON.stringify({
        sender: REMITENTE,
        to: [pedido.para],
        subject: mail.asunto,
        html_body: mail.html,
        text_body: mail.texto,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // Pudo haber salido: ambiguo y sin reintento, porque el cupo ya está usado.
    return respuesta({ estado: 'ambiguo', error: error instanceof Error ? error.name : 'red' }, 502);
  }

  const cuerpoResp = registro(await respuestaHttp.json().catch(() => null));
  const datos = registro(cuerpoResp?.data);
  const codigo = typeof datos?.error_code === 'string' ? datos.error_code : null;
  if (!respuestaHttp.ok) {
    return respuesta({ estado: 'rechazado', error: codigo ?? `http-${respuestaHttp.status}` }, 502);
  }
  if (!datos) return respuesta({ estado: 'ambiguo', error: 'respuesta-ilegible' }, 502);
  const aceptados = typeof datos.succeeded === 'number' ? datos.succeeded : 0;
  const fallidos = typeof datos.failed === 'number' ? datos.failed : 0;
  if (aceptados < 1 || fallidos > 0) {
    return respuesta({ estado: 'rechazado', error: codigo ?? 'sin-destinatario' }, 502);
  }
  return respuesta({
    estado: 'accepted',
    proveedor: 'smtp2go',
    aceptados,
    email_id: typeof datos.email_id === 'string' ? datos.email_id : null,
  }, 200);
}

/** Cuerpo acotado; un JSON ilegible no llega a las guardas. */
export async function leerCuerpo(request: Request): Promise<unknown> {
  const texto = await request.text();
  if (texto.length > TOPE_CUERPO) throw new Error('cuerpo-demasiado-grande');
  if (!texto.trim()) throw new Error('cuerpo-vacio');
  return JSON.parse(texto);
}

/**
 * Único egreso del ensayo: el endpoint exacto de SMTP2GO por POST y sin seguir
 * redirecciones. Cualquier otra URL o método falla antes de tocar la red.
 */
export function crearBusquedaCorreo(
  redReal: (url: string, init: RequestInit) => Promise<Response>,
): BuscarCorreo {
  return async (url, init) => {
    if (url !== URL_SMTP2GO || init?.method !== 'POST') {
      return Promise.reject(new Error('Egress de correo fuera de alcance'));
    }
    // workerd no admite redirect:error: lanza TypeError antes del transporte.
    // Manual no sigue Location ni reenvía credenciales; rechazar todos los 3xx.
    const respuesta = await redReal(url, { ...init, redirect: 'manual' });
    if (respuesta.status >= 300 && respuesta.status < 400) {
      throw new Error('Redireccion de correo no autorizada');
    }
    return respuesta;
  };
}
