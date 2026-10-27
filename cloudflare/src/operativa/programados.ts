import { manejarLote, barridoDeEfectos, type LoteCola, type ProductorCola } from './colas.ts';
import type { Transportes } from './consumidores.ts';

export interface EntornoOperativo {
  APP_STAGE?: string;
  DB?: D1Database;
  EFECTOS?: ProductorCola;
}

export const CRON_EFECTOS = '*/5 * * * *';
export const COLA_EFECTOS = 'cau-efectos-local';

export function exigirOperativaLocal(entorno: EntornoOperativo): D1Database {
  if (entorno.APP_STAGE !== 'local' || !entorno.DB || !entorno.EFECTOS) {
    throw new Error('Operativa local sin configurar');
  }
  return entorno.DB;
}

/** El entrypoint no pasa transportes: sólo pruebas pueden inyectar dobles. */
export async function manejarColaLocal(
  lote: LoteCola & { queue: string }, entorno: EntornoOperativo, transportes: Transportes = {},
) {
  const db = exigirOperativaLocal(entorno);
  if (lote.queue !== COLA_EFECTOS) throw new Error('Cola no autorizada');
  return manejarLote(lote, db, transportes);
}

export async function manejarProgramadoLocal(
  evento: { cron: string }, entorno: EntornoOperativo, transportes: Transportes = {},
) {
  const db = exigirOperativaLocal(entorno);
  if (evento.cron !== CRON_EFECTOS) throw new Error('Cron no autorizado');
  return barridoDeEfectos(db, transportes);
}
