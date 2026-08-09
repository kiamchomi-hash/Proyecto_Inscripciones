/**
 * Calendario Academico 2026 de Universidad Siglo 21, modalidad Distancia
 * (ED + EDH). Transcripto del PDF oficial de la universidad:
 * https://contenidos.21.edu.ar/descargas/calendarios-2026/5-calendario-academico-2026-ed-edh-arccnbcod-0030.pdf
 *
 * El PDF nombra los tramos "sub periodo 1A/1B/2A/2B". Ese codigo es vocabulario
 * interno de la universidad y no significa nada para quien busca "calendario
 * siglo 21 2026": aca los tramos se identifican por su fecha de inicio.
 *
 * Las fechas son ISO para poder compararlas; la UI las formatea.
 */

export const PDF_OFICIAL =
  'https://contenidos.21.edu.ar/descargas/calendarios-2026/5-calendario-academico-2026-ed-edh-arccnbcod-0030.pdf';

export type Periodo = {
  semestre: 'Primer semestre' | 'Segundo semestre';
  /** Primer dia de cursada. */
  inicio: string;
  /** Ultimo dia para anotarse a materias de ese tramo. */
  inscripcion: string;
  /** Ultimo dia de la novena semana. */
  fin: string;
  /** La novena semana es siempre recuperatorio e integrador. */
  integradorDesde: string;
};

/** Los cuatro tramos de nueve semanas en que se divide el año. */
export const PERIODOS: Periodo[] = [
  {
    semestre: 'Primer semestre',
    inicio: '2026-03-16',
    inscripcion: '2026-03-29',
    fin: '2026-05-16',
    integradorDesde: '2026-05-11',
  },
  {
    semestre: 'Primer semestre',
    inicio: '2026-05-18',
    inscripcion: '2026-05-31',
    fin: '2026-07-18',
    integradorDesde: '2026-07-13',
  },
  {
    semestre: 'Segundo semestre',
    inicio: '2026-08-03',
    inscripcion: '2026-08-16',
    fin: '2026-10-03',
    integradorDesde: '2026-09-28',
  },
  {
    semestre: 'Segundo semestre',
    inicio: '2026-10-05',
    inscripcion: '2026-10-18',
    fin: '2026-12-05',
    integradorDesde: '2026-11-30',
  },
];

/**
 * Las tutorias cuatrimestrales corren en paralelo a los tramos cortos: arrancan
 * junto con el primero de cada semestre y siguen hasta el cierre del semestre.
 */
export const CUATRIMESTRALES = [
  { semestre: 'Primer semestre', inicio: '2026-03-16', fin: '2026-07-18', semanas: 14 },
  { semestre: 'Segundo semestre', inicio: '2026-08-03', fin: '2026-12-05', semanas: 18 },
] as const;

/**
 * Feriados que el calendario oficial marca sobre las semanas de cursada. El del
 * 30/09 aplica solo a la sede Cordoba y por eso no se lista: confundiria a
 * quien cursa desde Buenos Aires.
 */
export const FERIADOS = [
  { fecha: '2026-03-23', nombre: 'Feriado turístico' },
  { fecha: '2026-03-24', nombre: 'Día Nacional de la Memoria por la Verdad y la Justicia' },
  { fecha: '2026-04-02', nombre: 'Día del Veterano y de los Caídos en la Guerra de Malvinas' },
  { fecha: '2026-04-02', nombre: 'Jueves Santo' },
  { fecha: '2026-04-03', nombre: 'Viernes Santo' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajador' },
  { fecha: '2026-05-25', nombre: 'Día de la Revolución de Mayo' },
  { fecha: '2026-06-15', nombre: 'Paso a la Inmortalidad del Gral. Güemes' },
  { fecha: '2026-06-20', nombre: 'Paso a la Inmortalidad del Gral. Belgrano' },
  { fecha: '2026-07-09', nombre: 'Día de la Independencia' },
  { fecha: '2026-07-10', nombre: 'Feriado turístico' },
  { fecha: '2026-08-17', nombre: 'Paso a la Inmortalidad del Gral. San Martín' },
  { fecha: '2026-09-21', nombre: 'Día del Estudiante' },
  { fecha: '2026-10-12', nombre: 'Día del Respeto a la Diversidad Cultural' },
  { fecha: '2026-11-23', nombre: 'Día de la Soberanía Nacional' },
];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "2026-08-03" → "3 de agosto". Sin `new Date()`: parsea el ISO a mano para
 *  que la fecha no se corra un dia segun la zona horaria del navegador. */
export function formatearFecha(iso: string): string {
  const [, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]}`;
}

/** "2026-08-03" → "3/8". Para la tabla, donde el nombre entero no entra. */
export function formatearCorto(iso: string): string {
  const [, mes, dia] = iso.split('-').map(Number);
  return `${dia}/${mes}`;
}
