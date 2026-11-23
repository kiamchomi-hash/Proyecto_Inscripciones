import { eventoValido, grupoValido, pasoValido, slugValido, superficieValida } from '../../../lib/teclab-embudo.ts';
import { comprobarCupo, fechaClicksDesdeUTC } from './control.ts';
import { leerRelojBase } from './reloj.ts';

/**
 * Recorrido de las carreras de Teclab (modal y ficha) contado en D1. Mismo
 * patrón que `registrarEventoVocacional`: primero el cupo por IP —con la IP
 * sólo como digest— y después el UPSERT del agregado del día.
 *
 * Una visita que recorre todo manda unos diez eventos: el cupo frena un lazo,
 * no a alguien que mira varias carreras seguidas.
 */

/** Importado por las pruebas: el tope real del cupo por IP. */
export const MAXIMO_POR_IP = 240;
const VENTANA_SEGUNDOS = 600;

export const SQL_EMBUDO_TECLAB = `
  INSERT INTO teclab_embudo(fecha, superficie, carrera, evento, paso, movil, grupo, veces) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1)
  ON CONFLICT (fecha, superficie, carrera, evento, paso, movil, grupo) DO UPDATE SET veces = teclab_embudo.veces + 1`;

async function claveIp(ip: string): Promise<string> {
  if (typeof ip !== 'string') throw new TypeError('IP inválida.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return `teclab-embudo:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Suma un paso. Devuelve `false` si algún dato no es válido o la IP gastó su
 * cupo; el navegador recibe 200 igual, porque medir no puede romper la página.
 *
 * `grupo` es el de la prueba A/B de los tickets. Sin él (el modal, o una
 * página abierta antes del deploy) va `sin-prueba`; con un valor fuera de la
 * lista, el evento no se cuenta.
 */
export async function registrarEventoTeclab(
  db: D1Database, datos: Record<string, unknown>, ip: string,
): Promise<boolean> {
  const { superficie, carrera, evento, paso, movil } = datos;
  const grupo = datos.grupo ?? 'sin-prueba';
  if (!superficieValida(superficie) || !slugValido(carrera)) return false;
  if (!eventoValido(superficie, evento) || !pasoValido(superficie, paso)) return false;
  if (movil !== 0 && movil !== 1) return false;
  if (!grupoValido(grupo) || (superficie === 'modal' && grupo !== 'sin-prueba')) return false;
  if (!await comprobarCupo(db, await claveIp(ip), MAXIMO_POR_IP, VENTANA_SEGUNDOS)) return false;
  const dia = fechaClicksDesdeUTC(await leerRelojBase(db));
  try {
    await db.prepare(SQL_EMBUDO_TECLAB).bind(dia, superficie, carrera, evento, paso, movil, grupo).run();
  } catch (error) {
    // El código se publica antes de aplicar la migración 0017: mientras la
    // columna `grupo` no exista, se cuenta como antes, sin grupo.
    if (!/no column named grupo|has no column/i.test(String(error))) throw error;
    await db.prepare(SQL_EMBUDO_TECLAB_SIN_GRUPO).bind(dia, superficie, carrera, evento, paso, movil).run();
  }
  return true;
}

/** El UPSERT de antes de la 0017; se va cuando la migración esté aplicada. */
export const SQL_EMBUDO_TECLAB_SIN_GRUPO = `
  INSERT INTO teclab_embudo(fecha, superficie, carrera, evento, paso, movil, veces) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)
  ON CONFLICT (fecha, superficie, carrera, evento, paso, movil) DO UPDATE SET veces = teclab_embudo.veces + 1`;
