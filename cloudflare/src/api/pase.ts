import {
  aBase64Url, deBase64Url, derivarClaveHmac, firmarHmac, igualdadTiempoConstante, huellaSha256,
} from './seguro.ts';

/**
 * El pase de la autoinscripción, con el mismo contrato que
 * `lib/pase-autoinscripcion.ts`: HMAC-SHA256 sobre `{ s, iat, exp }`, diez
 * minutos de vigencia, atado al mail normalizado y a la carrera, y con la clave
 * derivada de `TURNSTILE_SECRET_KEY` por separación de dominio. Sin secreto no se
 * emite ni se acepta ninguno.
 *
 * La diferencia es la implementación: en el Worker no hay `node:crypto`, así que
 * usa Web Crypto. La firma se calcula sobre el texto base64url, igual que el
 * módulo vigente, para que un pase emitido allá valide acá.
 */

export const VIGENCIA_PASE_MS = 10 * 60 * 1000;

const DOMINIO = 'pase-autoinscripcion-v1';
const DESFASE_MS = 30 * 1000;

/** El mail en minúsculas y la carrera, hasheados: el pase no lleva el mail a la vista. */
async function sujetoDe(email: string, carreraId: number) {
  return aBase64Url(await huellaSha256(`${email.trim().toLowerCase()}:${carreraId}`));
}

/** Emite el pase, o `null` sin secreto configurado. */
export async function emitirPase(
  secreto: string | undefined, email: string, carreraId: number, ahora = Date.now(),
): Promise<string | null> {
  if (!secreto) return null;
  const clave = await derivarClaveHmac(secreto, DOMINIO);
  const datos = aBase64Url(new TextEncoder().encode(JSON.stringify({
    s: await sujetoDe(email, carreraId),
    iat: ahora,
    exp: ahora + VIGENCIA_PASE_MS,
  })));
  return `${datos}.${aBase64Url(await firmarHmac(clave, datos))}`;
}

/**
 * Verifica firma, vencimiento y que el pase sea de este mail y esta carrera.
 * Devuelve cuándo se emitió (lo usa el control de reuso) o `null` si no vale.
 */
export async function verificarPase(
  secreto: string | undefined, pase: unknown, email: string, carreraId: number, ahora = Date.now(),
): Promise<{ iat: number } | null> {
  if (!secreto || typeof pase !== 'string') return null;
  const partes = pase.split('.');
  if (partes.length !== 2) return null;
  const [datos, firma] = partes;

  const recibida = deBase64Url(firma);
  const esperada = await firmarHmac(await derivarClaveHmac(secreto, DOMINIO), datos!);
  // Igual que el módulo vigente: longitudes distintas ya es un pase inválido.
  if (!recibida || recibida.length !== esperada.length || !igualdadTiempoConstante(recibida, esperada)) {
    return null;
  }

  const bytes = deBase64Url(datos);
  if (!bytes) return null;
  let contenido: unknown;
  try {
    contenido = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (!contenido || typeof contenido !== 'object') return null;
  const { s, iat, exp } = contenido as Record<string, unknown>;
  if (typeof s !== 'string' || typeof iat !== 'number' || typeof exp !== 'number') return null;
  // Un margen chico para el reloj de otra instancia; nunca más largo que la vigencia.
  if (exp <= ahora || iat > ahora + DESFASE_MS || exp - iat > VIGENCIA_PASE_MS) return null;
  if (s !== await sujetoDe(email, carreraId)) return null;
  return { iat };
}
