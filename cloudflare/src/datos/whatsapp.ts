import { comprobarCupo, fechaClicksDesdeUTC } from './control.ts';
import { leerRelojBase } from './reloj.ts';

/**
 * Contador de clics al botón de WhatsApp del CAU.
 *
 * Es el mismo patrón que `registrarApertura` de `control.ts`: primero el cupo
 * por IP (que además garantiza que la IP nunca se guarde en claro) y después el
 * UPSERT que suma un clic al agregado del día. La tabla no tiene filas por
 * visita: sólo (día, página, móvil).
 *
 * El cupo es más alto que el de las alertas de Telegram a propósito: acá se
 * cuenta todo clic, también los de escritorio, y una persona puede tocar el
 * botón más de una vez mientras compara carreras. Con 60 cada diez minutos por
 * IP sobra para una persona real y frena un lazo.
 */

const MAXIMO_POR_IP = 60;
const VENTANA_SEGUNDOS = 600;

export const SQL_CLICK_WHATSAPP = `
  INSERT INTO whatsapp_clicks(fecha, origen, movil, clicks) VALUES (?1, ?2, ?3, 1)
  ON CONFLICT (fecha, origen, movil) DO UPDATE SET clicks = whatsapp_clicks.clicks + 1`;

/**
 * El origen es el pathname donde se tocó el botón: lo manda el navegador, así
 * que se recorta y se valida. Sin query ni hash, porque si no cada variante de
 * campaña sería una fila distinta y la tabla crecería sin techo.
 */
export function normalizarOrigen(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const sinQuery = valor.split('#')[0].split('?')[0].trim();
  if (!sinQuery.startsWith('/')) return null;
  return sinQuery.slice(0, 120);
}

/** Misma derivación que `claveHash` de `control.ts`, local para no acoplar módulos. */
async function claveIp(ip: string): Promise<string> {
  if (typeof ip !== 'string') throw new TypeError('IP inválida.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return `whatsapp:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Suma un clic. Devuelve `false` cuando el origen no sirve o cuando la IP ya
 * gastó su cupo; en los dos casos la respuesta al navegador sigue siendo 200,
 * porque la telemetría no puede romper la navegación.
 */
export async function registrarClickWhatsapp(
  db: D1Database, origen: unknown, movil: boolean, ip: string,
): Promise<boolean> {
  const ruta = normalizarOrigen(origen);
  if (!ruta) return false;
  if (!await comprobarCupo(db, await claveIp(ip), MAXIMO_POR_IP, VENTANA_SEGUNDOS)) return false;
  const dia = fechaClicksDesdeUTC(await leerRelojBase(db));
  await db.prepare(SQL_CLICK_WHATSAPP).bind(dia, ruta, movil ? 1 : 0).run();
  return true;
}

export interface ClicksWhatsapp {
  fecha: string;
  origen: string;
  movil: number;
  clicks: number;
}

/** Lectura para el informe de leads: una fila por (día, página, dispositivo). */
export async function leerClicksWhatsapp(db: D1Database, desde: string, hasta: string): Promise<ClicksWhatsapp[]> {
  const fechaValida = (valor: string) => /^\d{4}-\d{2}-\d{2}$/.test(valor)
    && Number.isFinite(Date.parse(`${valor}T00:00:00Z`));
  if (!fechaValida(desde) || !fechaValida(hasta)) throw new TypeError('Fecha inválida.');
  return (await db.prepare(`SELECT fecha, origen, movil, clicks FROM whatsapp_clicks
    WHERE fecha BETWEEN ?1 AND ?2 ORDER BY fecha, clicks DESC`).bind(desde, hasta).all<ClicksWhatsapp>()).results;
}
