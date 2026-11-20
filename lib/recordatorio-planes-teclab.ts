/** Mensaje recurrente para revisar los planes oficiales de Teclab. */
export function mensajeRecordatorioPlanesTeclab(): string {
  return [
    'Recordatorio: revisar los planes de estudio de las carreras activas de Teclab.',
    'Comparar cada plan con sus fuentes oficiales. Si las fuentes discrepan o no se pueden verificar, no actualizar.',
  ].join('\n');
}
