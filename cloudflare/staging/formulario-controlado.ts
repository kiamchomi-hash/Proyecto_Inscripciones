import { manejarFormulario } from '../src/api/formularios.ts';
import { esRegistro, filaConsulta } from '../src/api/filas.ts';
import { verificarTurnstile } from '../src/api/turnstile.ts';
import { comprobarCupo } from '../src/datos/control.ts';

export const ACCION = 'staging_contacto';
/** Identificador fijo del ensayo, nunca recibido del cliente ni renovado al publicar. */
export const CLAVE_ENSAYO = 'staging-formulario-contacto:autorizado-20261026-01';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
type Buscar = (url: string, init: RequestInit) => Promise<Response>;
export type EntornoConsultaStaging = {
  DB?: D1Database; STAGING_FORMULARIO_HABILITADO?: string;
  STAGING_CORREO_PARA?: string; TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_EXPECTED_HOSTNAME?: string;
};
const fallo = (error: string, status: number) => Response.json({ error }, { status });

/** Campos que el ensayo acepta; cualquier otro nombre se rechaza sin repetirlo. */
export const CAMPOS_ENSAYO = ['casa', 'tipoFormulario', 'carrera', 'tipo', 'modalidad', 'equivalencias',
  'nombre', 'apellido', 'email', 'telefono', 'localidad', 'newsletter'] as const;

const texto = (valor: unknown) => (typeof valor === 'string' ? valor.trim() : null);

/**
 * Primer campo fuera del contrato del ensayo, con nombre seguro y sin valor.
 * Los textos se comparan recortados: un espacio al final del nombre o del
 * apellido no cambia el dato y no tiene por qué romper el envío. El conjunto de
 * valores admitidos es el mismo de siempre.
 */
export function campoFueraDelEnsayo(payload: Record<string, unknown>): string | null {
  if (Object.keys(payload).some(clave => !(CAMPOS_ENSAYO as readonly string[]).includes(clave))) return 'datos';
  if (payload.casa !== null || payload.tipoFormulario !== 'contacto' || payload.carrera !== null
    || payload.tipo !== null || payload.modalidad !== null || payload.equivalencias !== false) return 'datos';
  if (texto(payload.nombre) !== 'Prueba') return 'nombre';
  if (texto(payload.apellido) !== 'Staging') return 'apellido';
  if (texto(payload.telefono) !== '') return 'telefono';
  if (texto(payload.localidad) !== '') return 'localidad';
  if (payload.newsletter !== false) return 'newsletter';
  return null;
}

export function crearBusquedaCaptcha(red: Buscar): Buscar {
  return async (url, init) => {
    if (url !== SITEVERIFY || init.method !== 'POST') throw Error('Egreso captcha fuera de alcance');
    const r = await red(url, { ...init, redirect: 'manual' });
    if (r.status >= 300 && r.status < 400) throw Error('Redireccion captcha no autorizada');
    return r;
  };
}

/** Mismo handler, persistencia y outbox del sitio. Sin productor/consumidor de
 * efectos: el único aviso queda pendiente; no se simula una notificación enviada.
 */
export async function manejarConsultaStaging(request: Request, env: EntornoConsultaStaging, buscar?: Buscar): Promise<Response> {
  if (env.STAGING_FORMULARIO_HABILITADO !== 'si' || !env.DB || !buscar
    || !env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_EXPECTED_HOSTNAME || !env.STAGING_CORREO_PARA) {
    return fallo('formulario-staging-deshabilitado', 503);
  }
  const url = new URL(request.url);
  if (url.hostname !== env.TURNSTILE_EXPECTED_HOSTNAME || request.headers.get('Origin') !== url.origin) return fallo('origen-no-autorizado', 403);
  if (request.method !== 'POST' || !request.headers.get('Content-Type')?.startsWith('application/json')) return fallo('solicitud-invalida', 400);
  let body: unknown;
  try {
    const texto = await request.text();
    if (texto.length > 8192) return fallo('solicitud-invalida', 400);
    body = JSON.parse(texto);
  } catch { return fallo('solicitud-invalida', 400); }
  if (!esRegistro(body)) return fallo('solicitud-invalida', 400);
  if (Object.keys(body).some(k => !['kind', 'token', 'payload'].includes(k))) return fallo('campo-no-admitido', 400);
  if (body.kind !== 'consulta' || !esRegistro(body.payload)) return fallo('solicitud-invalida', 400);
  if (typeof body.token !== 'string' || !body.token.trim()) return fallo('token-faltante', 400);
  if (body.token.length > 2048) return fallo('solicitud-invalida', 400);
  const campo = campoFueraDelEnsayo(body.payload);
  if (campo) return Response.json({ error: 'campo-fuera-de-ensayo', campo }, { status: 400 });
  if (typeof body.payload.email !== 'string' || body.payload.email.trim().toLowerCase() !== env.STAGING_CORREO_PARA) return fallo('contacto-no-autorizado', 403);
  try { filaConsulta(body.payload); } catch { return fallo('datos-invalidos', 400); }

  let agotado = false;
  const respuesta = await manejarFormulario(new Request(request, { body: JSON.stringify(body) }), env.DB, {
    captchaConfigurado: true, pruebaLocal: false, demo: false,
    verificarCaptcha: async (token, ip) => {
      const valido = await verificarTurnstile(token, ip, { secreto: env.TURNSTILE_SECRET_KEY!,
        hostnamesPermitidos: env.TURNSTILE_EXPECTED_HOSTNAME, hostnameExacto: env.TURNSTILE_EXPECTED_HOSTNAME,
        accionEsperada: ACCION, buscar });
      if (!valido) return false;
      // Sólo un captcha real válido puede reclamar el presupuesto del ensayo.
      // Un fallo posterior no libera el cupo; nunca hay reintentos automáticos.
      const concedido = await comprobarCupo(env.DB!, CLAVE_ENSAYO, 1, 31536000);
      agotado = !concedido;
      return concedido;
    },
  });
  return agotado ? fallo('cupo-ensayo-agotado', 429) : respuesta;
}
