import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// El pase de la autoinscripción: la prueba de que esta persona ya resolvió el
// captcha en la preinscripción. El carrusel de Teclab envía dos veces —la
// preinscripción y, si toca «Inscribirme», la autoinscripción—, y los tokens
// de Turnstile son de un solo uso: sin el pase, el segundo envío pedía otro
// desafío que, cuando fallaba, dejaba a la persona frente a un «Estamos
// verificando la conexión» sin salida.
//
// Es un HMAC-SHA256 sobre { sujeto, iat, exp }: dura 10 minutos y está atado
// al mail (normalizado) y a la carrera, así que no sirve para inscribir a otra
// persona ni en otra carrera. La clave se deriva de TURNSTILE_SECRET_KEY con
// separación de dominio: no hay variable nueva, y sin captcha configurado no
// se emite ni se acepta ningún pase.

export const VIGENCIA_PASE_MS = 10 * 60 * 1000;

const DOMINIO = 'pase-autoinscripcion-v1';
const DESFASE_MS = 30 * 1000;

function clave(): Buffer | null {
  const secreto = process.env.TURNSTILE_SECRET_KEY;
  return secreto ? createHmac('sha256', secreto).update(DOMINIO).digest() : null;
}

/** El mail en minúsculas y la carrera, hasheados: el pase no lleva el mail a la vista. */
function sujetoDe(email: string, carreraId: number) {
  return createHash('sha256').update(`${email.trim().toLowerCase()}:${carreraId}`).digest('base64url');
}

const firmar = (llave: Buffer, datos: string) => createHmac('sha256', llave).update(datos).digest();

/** Emite el pase, o `null` sin clave configurada. */
export function emitirPase(email: string, carreraId: number, ahora = Date.now()): string | null {
  const llave = clave();
  if (!llave) return null;
  const datos = Buffer.from(JSON.stringify({
    s: sujetoDe(email, carreraId),
    iat: ahora,
    exp: ahora + VIGENCIA_PASE_MS,
  })).toString('base64url');
  return `${datos}.${firmar(llave, datos).toString('base64url')}`;
}

/**
 * Verifica firma, vencimiento y que el pase sea de este mail y esta carrera.
 * Devuelve cuándo se emitió (lo usa el control de reuso) o `null` si no vale.
 */
export function verificarPase(
  pase: string, email: string, carreraId: number, ahora = Date.now(),
): { iat: number } | null {
  const llave = clave();
  if (!llave || typeof pase !== 'string') return null;
  const partes = pase.split('.');
  if (partes.length !== 2) return null;
  const [datos, firma] = partes;
  const recibida = Buffer.from(firma, 'base64url');
  const esperada = firmar(llave, datos);
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;

  let contenido: unknown;
  try {
    contenido = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!contenido || typeof contenido !== 'object') return null;
  const { s, iat, exp } = contenido as Record<string, unknown>;
  if (typeof s !== 'string' || typeof iat !== 'number' || typeof exp !== 'number') return null;
  // Un margen chico para el reloj de otra instancia; nunca más largo que la vigencia.
  if (exp <= ahora || iat > ahora + DESFASE_MS || exp - iat > VIGENCIA_PASE_MS) return null;
  if (s !== sujetoDe(email, carreraId)) return null;
  return { iat };
}
