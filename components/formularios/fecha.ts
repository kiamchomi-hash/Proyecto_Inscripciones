/** Muestra una fecha ISO de calendario como DD/MM/AAAA, sin crear un instante. */
export function fechaIsoAEntrada(valor: string): string {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  return coincidencia ? `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}` : '';
}

/** Da formato a los dígitos ingresados, también cuando vienen pegados sin barras. */
export function normalizarEntradaFecha(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/** Convierte DD/MM/AAAA a ISO sólo si representa una fecha real. */
export function fechaEntradaAIso(valor: string): string | null {
  const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!coincidencia) return null;

  const dia = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const anio = Number(coincidencia[3]);
  if (anio < 1 || mes < 1 || mes > 12) return null;

  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasDelMes = mes === 2 ? (bisiesto ? 29 : 28)
    : [4, 6, 9, 11].includes(mes) ? 30 : 31;
  if (dia < 1 || dia > diasDelMes) return null;

  return `${coincidencia[3]}-${coincidencia[2]}-${coincidencia[1]}`;
}
