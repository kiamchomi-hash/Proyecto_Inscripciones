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
    '3. Verificar en producción las preinscripciones de Teclab:',
    'Formulario de la home y de /teclab.',
    'Páginas /teclab/inscripcion y /carreras/<carrera>/inscripcion.',
    'Después de enviar: el precio, el paso Inscribirme sin captcha y el mail del precio.',
    'Ver precio desde el modal de la carrera.',
    'Enlace /inscripcion/<código> y su aviso de enlace vencido.',
    'Las carreras Próximamente no muestran precio ni mandan mail, y mientras sigan vencidos los precios del 15/10 tampoco las demás.',
    '4. Seguimiento de los tests vocacionales general y Teclab:',
    'Medición del embudo publicada el 16/10/2026.',
    'Primera revisión de datos: 23/10/2026. Si hay pocos intentos, ampliar la observación antes de decidir mejoras.',
    '',
    estadoIntros,
  ].join('\n');
}
