/** Etiquetas de wiring, no prueba de identidad remota: ésta exige preflight.
 * Staging no toma la base de desarrollo ni depende de una cola para leer.
 */
export type EntornoDb = {
  DB?: D1Database;
  APP_STAGE?: string;
  DB_STAGE?: string;
  DB_NAME?: string;
  EFECTOS?: unknown;
};

export function resolverDb(entorno: EntornoDb): D1Database | null {
  if (entorno.APP_STAGE === 'local') {
    // Compatibilidad del entorno local ya probado; etiquetas parciales o
    // contradictorias no pueden convertir un binding de staging en local.
    if (entorno.DB_STAGE !== undefined || entorno.DB_NAME !== undefined) return null;
    return entorno.EFECTOS ? entorno.DB ?? null : null;
  }
  if (entorno.APP_STAGE === 'staging') {
    if (entorno.DB_STAGE !== 'staging'
      || typeof entorno.DB_NAME !== 'string'
      || !/^cau-staging-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entorno.DB_NAME)
      || /(?:^|-)(?:prod|production|produccion|local|dev)(?:-|$)/.test(entorno.DB_NAME)
      || entorno.EFECTOS !== undefined) return null;
    return entorno.DB ?? null;
  }
  // Producción: nombre exacto y etiqueta exacta. No admite patrones ni alias, así
  // que un binding de staging o de desarrollo no puede pasar por productivo, y
  // tampoco al revés. Sin colas configuradas igual devuelve la base: las
  // intenciones quedan pendientes en el outbox, que es el comportamiento previsto.
  if (entorno.APP_STAGE === 'produccion') {
    if (entorno.DB_STAGE !== 'produccion' || entorno.DB_NAME !== 'cau-produccion') return null;
    return entorno.DB ?? null;
  }
  return null;
}
