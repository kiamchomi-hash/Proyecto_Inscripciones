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

/**
 * Las preguntas que la pagina ya contesta, escritas como preguntas.
 *
 * No es relleno de SEO: son las consultas con las que la gente llega
 * ("cuando empiezan las clases", "hasta cuando me puedo anotar") y hasta el
 * 29/08/2026 la pagina las respondia solo a traves de tarjetas de fechas, que
 * un motor de respuestas no sabe leer como respuesta.
 *
 * Las fechas salen de PERIODOS y de CUATRIMESTRALES, no escritas a mano: dos
 * copias de la misma fecha se desincronizan el dia que cambia el calendario, y
 * la que quedaria vieja es justamente la que Google levanta como respuesta.
 */
export const PREGUNTAS: { pregunta: string; respuesta: string }[] = (() => {
  const inicios = PERIODOS.map(p => formatearFecha(p.inicio));
  const cierres = PERIODOS.map(p => formatearFecha(p.inscripcion));
  const enumerar = (xs: string[]) => `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;
  // El calendario tiene cuatro tramos desde siempre, pero la palabra tambien
  // sale del dato: si algun ano son tres, el texto no puede seguir diciendo
  // "cuatro" mientras las tarjetas de arriba muestran tres.
  const NUMEROS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
  const cuantos = NUMEROS[PERIODOS.length] ?? String(PERIODOS.length);

  return [
    {
      pregunta: '¿Cuándo empiezan las clases en Universidad Siglo 21 en 2026?',
      respuesta:
        `En 2026 hay ${cuantos} fechas de inicio: ${enumerar(inicios)}. La modalidad a ` +
        `distancia divide el año en ${cuantos} tramos de nueve semanas y cada uno abre su ` +
        'propia inscripción, así que no hace falta esperar a marzo para empezar.',
    },
    {
      pregunta: '¿Hasta cuándo me puedo inscribir a materias?',
      respuesta:
        'Cada tramo cierra la inscripción a materias dos semanas después de arrancar la ' +
        `cursada: ${enumerar(cierres)} de 2026. Pasada esa fecha ya no se puede sumar ` +
        'materias a ese tramo y hay que esperar al siguiente.',
    },
    {
      pregunta: '¿Cuántas veces al año se puede empezar a cursar a distancia?',
      respuesta:
        `${cuantos[0].toUpperCase()}${cuantos.slice(1)} veces. El año se divide en ` +
        `${cuantos} tramos de nueve semanas, dos por semestre, y cada uno abre su propia ` +
        'inscripción a materias. Aparte están las materias cuatrimestrales, que arrancan ' +
        'junto con el primer tramo de cada semestre y se cursan a lo largo de todo el ' +
        'semestre.',
    },
    {
      pregunta: '¿Cuánto dura cada tramo de cursada?',
      respuesta:
        'Nueve semanas. Las primeras ocho son de cursada y la novena es siempre la de ' +
        'recuperatorio e integrador. Las materias cuatrimestrales son la excepción: duran ' +
        `${CUATRIMESTRALES[0].semanas} semanas en el primer semestre y ` +
        `${CUATRIMESTRALES[1].semanas} en el segundo.`,
    },
    {
      pregunta: '¿Teclab y la Academia Identidad Argentina usan este mismo calendario?',
      respuesta:
        'No. Estas fechas son las de Universidad Siglo 21 en modalidad a distancia (ED y ' +
        'EDH). Teclab Instituto Técnico Superior y la Academia Identidad Argentina manejan ' +
        'calendarios propios, con sus propias fechas de inicio y de inscripción. Si la ' +
        'carrera que te interesa es de alguna de las dos, escribinos y te pasamos las suyas.',
    },
  ];
})();
