// Las agregaciones de Vercel usan timestamp; las filas de Supabase ya traen día UTC.
export function conciliarPorDia(eventos, consultas) {
  const dias = new Map();
  for (const fila of consultas) {
    const actual = dias.get(fila.dia_utc) ?? { dia: fila.dia_utc, eventos: eventos === null ? null : 0, filas: 0 };
    actual.filas++; dias.set(fila.dia_utc, actual);
  }
  for (const evento of eventos ?? []) {
    const fecha = new Date(evento.timestamp);
    if (!Number.isFinite(fecha.getTime()) || !Number.isFinite(evento.count)) throw new Error('El desglose diario de Vercel no tiene el formato esperado');
    const dia = fecha.toISOString().slice(0, 10);
    const actual = dias.get(dia) ?? { dia, eventos: 0, filas: 0 };
    actual.eventos += evento.count; dias.set(dia, actual);
  }
  return [...dias.values()].sort((a, b) => a.dia.localeCompare(b.dia));
}
