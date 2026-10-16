// Chequeo de la vigilancia sobre los precios privados (`precios_privados`).
//
// Que los precios queden vencidos unas horas es lo esperado: vencen a la
// medianoche y la corrida diaria de la mañana los renueva. El problema es que
// la corrida falle más de un día seguido, porque el sitio se queda sin precio
// vigente y nadie se entera. Por eso se avisa recién cuando el precio más nuevo
// de una institución lleva más de 24 h vencido.
//
// Función pura, para poder probarla sin base: la ruta de vigilancia trae las
// filas y esto decide si hay que avisar.

/** Más que esto ya no es la corrida de la mañana que todavía no pasó. */
export const HORAS_VENCIDO_TOLERADAS = 24;

const NOMBRES: Record<string, string> = { siglo21: 'Siglo 21', teclab: 'Teclab' };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function fechaArgentina(ahora: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(ahora);
}

const legible = (fecha: string) => fecha.split('-').reverse().join('/');

/**
 * Aviso para Telegram si alguna institución tiene todos sus precios vencidos
 * hace más de `HORAS_VENCIDO_TOLERADAS`, o null si no hace falta avisar.
 * `vigente_hasta` es una fecha (`AAAA-MM-DD`) y el precio vale todo ese día.
 */
export function preciosVencidos(
  filas: { institucion: string; vigente_hasta: string }[],
  ahora: Date,
): string | null {
  const ultima = new Map<string, string>();
  for (const { institucion, vigente_hasta } of filas) {
    const fecha = vigente_hasta.slice(0, 10);
    if (!FECHA.test(fecha)) continue;
    const previa = ultima.get(institucion);
    if (!previa || fecha > previa) ultima.set(institucion, fecha);
  }

  // Vencido hace más de 24 h: el último día vigente es anterior al de ayer.
  const ayer = fechaArgentina(new Date(ahora.getTime() - HORAS_VENCIDO_TOLERADAS * 3_600_000));
  const vencidas = [...ultima]
    .filter(([, fecha]) => fecha < ayer)
    .map(([institucion, fecha]) => `${NOMBRES[institucion.toLowerCase()] ?? institucion} (vigentes hasta el ${legible(fecha)})`);
  if (vencidas.length === 0) return null;

  return `Los precios de ${vencidas.join(' y ')} llevan más de un día vencidos y el sitio no tiene un precio vigente para mostrar. Revisar la corrida diaria de precios.`;
}
