/** Arma el aviso agregado: una línea por carrera, con su contador. */
export function buildAperturasDirectasDigest(fecha: string, rows: Array<{ carrera: string; clicks: number }>): string {
  const [y, m, d] = fecha.split('-');
  const total = rows.reduce((suma, fila) => suma + fila.clicks, 0);
  const lista = rows.map((fila, i) => `${i + 1}. ${fila.carrera} — *${fila.clicks}*`).join('\n');

  return [
    `📊 *Aperturas directas del ${d}/${m}/${y}*`,
    '',
    `🔗 *${total}* aperturas sobre *${rows.length}* carreras`,
    '',
    lista,
  ].join('\n');
}
