import { EVENTOS_VOCACIONAL_MEDIDOS } from '../../../lib/vocacional-analytics.ts';
import { comprobarCupo, fechaClicksDesdeUTC } from './control.ts';
import { leerRelojBase } from './reloj.ts';

/**
 * Embudo del test vocacional contado en D1.
 *
 * Hasta el corte a Cloudflare el recorrido se leía en Vercel Web Analytics; en
 * el Worker los eventos se quedaban en memoria del navegador. Esto guarda sólo
 * el paso alcanzado, agregado por día: ni respuestas, ni perfil, ni filas por
 * visita. Mismo patrón que `registrarSalidaCalendario`: primero el cupo por IP
 * —que además garantiza que la IP nunca se guarde en claro— y después el UPSERT.
 *
 * Un intento completo manda once o doce eventos, así que el cupo es holgado:
 * frena un lazo, no el uso real. Varias personas pueden compartir IP por el
 * CGNAT de las operadoras.
 */

/** Importado por las pruebas: el tope real del cupo por IP. */
export const MAXIMO_POR_IP = 240;
const VENTANA_SEGUNDOS = 600;

/** Igual que el CHECK de `vocacional_embudo.pregunta`. */
const TOPE_PREGUNTA = 30;

export type EventoEmbudo = (typeof EVENTOS_VOCACIONAL_MEDIDOS)[number];

export type TestEmbudo = 'general' | 'teclab';

export function eventoEmbudoValido(valor: unknown): valor is EventoEmbudo {
  return typeof valor === 'string' && (EVENTOS_VOCACIONAL_MEDIDOS as readonly string[]).includes(valor);
}

export function testEmbudoValido(valor: unknown): valor is TestEmbudo {
  return valor === 'general' || valor === 'teclab';
}

export function preguntaEmbudoValida(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor)
    && valor >= 1 && valor <= TOPE_PREGUNTA;
}

export const SQL_EMBUDO = `
  INSERT INTO vocacional_embudo(fecha, test, evento, pregunta, veces) VALUES (?1, ?2, ?3, ?4, 1)
  ON CONFLICT (fecha, test, evento, pregunta) DO UPDATE SET veces = vocacional_embudo.veces + 1`;

/** Misma derivación que `claveIp` de whatsapp.ts, con prefijo propio. */
async function claveIp(ip: string): Promise<string> {
  if (typeof ip !== 'string') throw new TypeError('IP inválida.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return `vocacional:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Suma un paso del embudo. Devuelve `false` cuando el evento, el test o la
 * pregunta no son válidos, o cuando la IP gastó su cupo; la respuesta al
 * navegador sigue siendo 200, porque la medición no puede romper el test.
 */
export async function registrarEventoVocacional(
  db: D1Database, evento: unknown, datos: Record<string, unknown>, ip: string,
): Promise<boolean> {
  if (!eventoEmbudoValido(evento)) return false;
  if (!testEmbudoValido(datos.test) || !preguntaEmbudoValida(datos.pregunta)) return false;
  if (!await comprobarCupo(db, await claveIp(ip), MAXIMO_POR_IP, VENTANA_SEGUNDOS)) return false;
  const dia = fechaClicksDesdeUTC(await leerRelojBase(db));
  await db.prepare(SQL_EMBUDO).bind(dia, datos.test, evento, datos.pregunta).run();
  return true;
}

export interface FilaEmbudo {
  fecha: string;
  test: string;
  evento: string;
  pregunta: number;
  veces: number;
}

/** Lectura para el informe: una fila por (día, test, evento, pregunta). */
export async function leerEmbudoVocacional(
  db: D1Database, desde: string, hasta: string, test?: TestEmbudo,
): Promise<FilaEmbudo[]> {
  const fechaValida = (valor: string) => /^\d{4}-\d{2}-\d{2}$/.test(valor)
    && Number.isFinite(Date.parse(`${valor}T00:00:00Z`));
  if (!fechaValida(desde) || !fechaValida(hasta)) throw new TypeError('Fecha inválida.');
  if (test !== undefined && !testEmbudoValido(test)) throw new TypeError('Test inválido.');
  const filtro = test ? 'AND test = ?3' : '';
  const sentencia = `SELECT fecha, test, evento, pregunta, veces FROM vocacional_embudo
    WHERE fecha BETWEEN ?1 AND ?2 ${filtro} ORDER BY fecha, test, evento, pregunta`;
  const enlace = db.prepare(sentencia);
  return (await (test ? enlace.bind(desde, hasta, test) : enlace.bind(desde, hasta))
    .all<FilaEmbudo>()).results;
}
