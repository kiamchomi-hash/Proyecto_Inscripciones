// Recordatorio semanal de los seguimientos de fondo de Teclab (`docs/rutinas.md`,
// sección Teclab). No se cierran: se recuerdan una vez por semana por Telegram
// desde `/api/recordatorio-teclab`, para no tener que releerlos cada vez que se
// trabaja en Teclab.

export interface FichaTeclab {
  nombre: string;
  descripcion: string | null;
}

/** Las intros reescritas desde la página oficial abren con "Estudiá <tema> a distancia". */
export function sinIntroNueva<T extends FichaTeclab>(fichas: T[]): T[] {
  return fichas.filter(f => !(f.descripcion ?? '').trim().startsWith('Estudiá '));
}

/** `null` cuando no se pudo leer la base: el recordatorio sale igual. */
export function mensajeRecordatorioTeclab(fichas: FichaTeclab[] | null): string {
  const pendientes = fichas ? sinIntroNueva(fichas) : null;
  const estadoIntros =
    pendientes === null
      ? 'No se pudo leer la base para revisar las intros; mirarlo a mano.'
      : pendientes.length === 0
        ? 'Hoy todas las fichas vigentes tienen la intro nueva.'
        : ['Fichas sin la intro nueva:', ...pendientes.map(f => `• ${f.nombre}`)].join('\n');

  return [
    'Recordatorio semanal de Teclab (docs/rutinas.md)',
    '',
    '1. Mejorar el diseño de las fichas de Teclab: quedan mejoras por definir.',
    '2. Cada carrera nueva de Teclab lleva su intro reescrita a partir de la página oficial.',
    '',
    estadoIntros,
  ].join('\n');
}
