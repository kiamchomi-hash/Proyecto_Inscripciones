/**
 * Comparación de bytes en tiempo constante. `SubtleCrypto` no expone el
 * equivalente de `timingSafeEqual` de Node, así que el bucle recorre siempre
 * todos los bytes: la comparación directa de textos corta en el primero distinto.
 */
export function igualdadTiempoConstante(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) diferencia |= a[i]! ^ b[i]!;
  return diferencia === 0;
}

const ALFABETO_BASE64URL = /^[A-Za-z0-9_-]+$/;

export function aBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** `null` si el texto no es base64url: sirve para rechazar una firma adulterada. */
export function deBase64Url(texto: unknown): Uint8Array | null {
  if (typeof texto !== 'string' || texto.length === 0 || !ALFABETO_BASE64URL.test(texto)) return null;
  const relleno = texto.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(texto.length / 4) * 4, '=');
  try {
    const binario = atob(relleno);
    return Uint8Array.from(binario, caracter => caracter.charCodeAt(0));
  } catch {
    return null;
  }
}

export const bytesDeTexto = (texto: string) => new TextEncoder().encode(texto);

export async function huellaSha256(texto: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytesDeTexto(texto)));
}

/** Clave HMAC-SHA256 derivada de otra clave: `HMAC(secreto, dominio)`. */
export async function derivarClaveHmac(secreto: string, dominio: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw', bytesDeTexto(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const derivada = new Uint8Array(await crypto.subtle.sign('HMAC', base, bytesDeTexto(dominio)));
  return crypto.subtle.importKey('raw', derivada, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function firmarHmac(clave: CryptoKey, texto: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign('HMAC', clave, bytesDeTexto(texto)));
}
