/** Estado del relevamiento, independiente de la publicación y la promoción. */
export interface Actualizacion2027 {
  version: 1;
  periodo: '1A';
  ultimoIntento: { estado: 'en_curso' | 'incompleta' | 'completa'; fecha: string };
  ultimoExito: string | null;
}

export function normalizarActualizacion2027(valor: unknown): Actualizacion2027 | null {
  if (!valor || typeof valor !== 'object') return null;
  const dato = valor as Actualizacion2027;
  const fechaValida = (fecha: unknown): fecha is string => typeof fecha === 'string'
    && /^\d{4}-\d\d-\d\dT/.test(fecha) && Number.isFinite(Date.parse(fecha));
  if (dato.version !== 1 || dato.periodo !== '1A' || !dato.ultimoIntento
      || !['en_curso', 'incompleta', 'completa'].includes(dato.ultimoIntento.estado)
      || !fechaValida(dato.ultimoIntento.fecha)
      || (dato.ultimoExito !== null && !fechaValida(dato.ultimoExito))) return null;
  return { version: 1, periodo: '1A', ultimoIntento: { estado: dato.ultimoIntento.estado, fecha: dato.ultimoIntento.fecha }, ultimoExito: dato.ultimoExito };
}

export function estadoActualizacion2027(valor: unknown, ahora = new Date()) {
  // Autocontenida: también se incorpora al HTML portátil con toString().
  const dato = valor as Actualizacion2027 | null;
  const advertencia = (titulo: string) => ({ nivel: 'advertencia', titulo,
    detalle: 'Valores de referencia.' });
  if (!dato || dato.version !== 1 || dato.periodo !== '1A' || !dato.ultimoIntento) return advertencia('Precios de referencia');
  if (dato.ultimoIntento.estado === 'incompleta') return advertencia('Actualización incompleta');
  if (dato.ultimoIntento.estado !== 'completa') return advertencia('Actualización sin completar');
  const fecha = Date.parse(dato.ultimoIntento.fecha);
  const dia = (valor: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).format(valor);
  if (!Number.isFinite(fecha) || fecha > ahora.getTime() || dato.ultimoExito !== dato.ultimoIntento.fecha) return advertencia('Precios de referencia');
  if (dia(fecha) !== dia(ahora.getTime())) return advertencia('Actualización diaria pendiente');
  return { nivel: 'ok', titulo: 'Actualización diaria completa', detalle: 'Siglo 21 · 1A 2027: relevamiento completo del día.' };
}

/** La vigencia comercial no demuestra que se completó la actualización diaria. */
export function promocionVencida(fecha: string | null | undefined, ahora = new Date()) {
  const partes = fecha?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!partes) return false;
  const dia = `${partes[3]}-${partes[2].padStart(2, '0')}-${partes[1].padStart(2, '0')}`;
  const hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).format(ahora);
  return dia < hoy;
}
