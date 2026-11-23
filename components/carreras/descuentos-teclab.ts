// Descuentos de Teclab para los tickets de la ficha: matrícula y bimestres.
//
// Salen de `precios_privados` (lo carga la corrida diaria de precios), pero a la
// página viajan sólo los porcentajes y la fecha de vigencia: ningún monto. Los
// montos siguen detrás de «Ver precio».
//
// Al 23/11/2026, de las 27 tecnicaturas activas, 25 traen los dos descuentos
// (matrícula 75 o 100 %, bimestres 20, 25 o 35 %) y 2 no tienen precio.

export interface PromoTeclab {
  /** Porcentaje entero de la matrícula, o null si no tiene. */
  matricula: number | null;
  /** Porcentaje entero de los bimestres, o null si no tiene. */
  bimestres: number | null;
  /** `AAAA-MM-DD`: el precio vale todo ese día. */
  vigenteHasta: string;
}

/** Compatibilidad con el nombre anterior. */
export type PromoBimestres = PromoTeclab;

function porcentajes(conceptos: unknown[], patron: RegExp, maximo: number): number[] {
  return conceptos.flatMap((linea) => {
    if (!linea || typeof linea !== 'object') return [];
    const { concepto, descuento } = linea as { concepto?: unknown; descuento?: unknown };
    if (typeof concepto !== 'string' || !patron.test(concepto.trim())) return [];
    const valor = typeof descuento === 'number' ? descuento : Number(descuento);
    return Number.isFinite(valor) && valor > 0 && valor <= maximo ? [Math.round(valor)] : [];
  });
}

/**
 * Los descuentos de matrícula y de bimestres. Si dos líneas del mismo concepto
 * traen porcentajes distintos se toma el menor, para no prometer de más. Con la
 * promo vencida, o sin ningún descuento, no hay tickets.
 */
export function promoTeclab(conceptos: unknown[], vigenteHasta: string, hoy: string): PromoTeclab | null {
  const fecha = vigenteHasta.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < hoy) return null;
  // La matrícula puede ir bonificada entera (100 %); un bimestre no.
  const matricula = porcentajes(conceptos, /^matr[ií]cula/i, 100);
  const bimestres = porcentajes(conceptos, /^bimestre/i, 99);
  if (matricula.length === 0 && bimestres.length === 0) return null;
  return {
    matricula: matricula.length ? Math.min(...matricula) : null,
    bimestres: bimestres.length ? Math.min(...bimestres) : null,
    vigenteHasta: fecha,
  };
}

/** Hoy en Argentina, `AAAA-MM-DD`. */
export function hoyArgentina(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).format(ahora);
}
