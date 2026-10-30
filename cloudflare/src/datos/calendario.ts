import { comprobarCupo, fechaClicksDesdeUTC } from './control.ts';
import { leerRelojBase } from './reloj.ts';

/**
 * Contador de salidas del calendario académico hacia la oferta.
 *
 * Mismo patrón que `registrarClickWhatsapp`: primero el cupo por IP —que además
 * garantiza que la IP nunca se guarde en claro— y después el UPSERT que suma una
 * salida al agregado del día. No hay filas por visita ni por persona.
 *
 * Una persona puede tocar varios enlaces seguidos mientras compara carreras, así
 * que el cupo es alto; alcanza para un uso real y frena un lazo.
 */

const MAXIMO_POR_IP = 60;
const VENTANA_SEGUNDOS = 600;

/** Los mismos destinos que clasifica `destinoDesdeCalendario` en `lib/analytics.ts`. */
export const DESTINOS_CALENDARIO = ['oferta', 'teclab', 'carrera', 'preinscripcion', 'contacto'] as const;

export type DestinoCalendario = (typeof DESTINOS_CALENDARIO)[number];

export function destinoCalendarioValido(valor: unknown): valor is DestinoCalendario {
  return typeof valor === 'string' && (DESTINOS_CALENDARIO as readonly string[]).includes(valor);
}

export const SQL_SALIDA_CALENDARIO = `
  INSERT INTO calendario_salidas(fecha, destino, salidas) VALUES (?1, ?2, 1)
  ON CONFLICT (fecha, destino) DO UPDATE SET salidas = calendario_salidas.salidas + 1`;

/** Misma derivación que `claveIp` de whatsapp.ts, con prefijo propio. */
async function claveIp(ip: string): Promise<string> {
  if (typeof ip !== 'string') throw new TypeError('IP inválida.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return `calendario:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Suma una salida. Devuelve `false` cuando el destino no está en la lista o la
 * IP ya gastó su cupo; en los dos casos la respuesta al navegador sigue siendo
 * 200, porque la telemetría no puede romper la navegación.
 */
export async function registrarSalidaCalendario(
  db: D1Database, destino: unknown, ip: string,
): Promise<boolean> {
  if (!destinoCalendarioValido(destino)) return false;
  if (!await comprobarCupo(db, await claveIp(ip), MAXIMO_POR_IP, VENTANA_SEGUNDOS)) return false;
  const dia = fechaClicksDesdeUTC(await leerRelojBase(db));
  await db.prepare(SQL_SALIDA_CALENDARIO).bind(dia, destino).run();
  return true;
}

export interface SalidasCalendario {
  fecha: string;
  destino: string;
  salidas: number;
}

/** Lectura para el informe de leads: una fila por (día, destino). */
export async function leerSalidasCalendario(
  db: D1Database, desde: string, hasta: string,
): Promise<SalidasCalendario[]> {
  const fechaValida = (valor: string) => /^\d{4}-\d{2}-\d{2}$/.test(valor)
    && Number.isFinite(Date.parse(`${valor}T00:00:00Z`));
  if (!fechaValida(desde) || !fechaValida(hasta)) throw new TypeError('Fecha inválida.');
  return (await db.prepare(`SELECT fecha, destino, salidas FROM calendario_salidas
    WHERE fecha BETWEEN ?1 AND ?2 ORDER BY fecha, salidas DESC`).bind(desde, hasta).all<SalidasCalendario>()).results;
}
