/**
 * Estructura del ciclo 2027 de Universidad Siglo 21, modalidades a distancia
 * (ED + EDH).
 *
 * Acá no hay fechas de 2027: la universidad no publicó todavía el calendario de
 * ese año —el del portal de estudiantes sigue siendo el 2026— y extrapolarlo de
 * 2026 sería inventar condiciones de cursada. Lo que sí es estable y está en el
 * reglamento es la estructura: dos semestres, cada uno con dos tramos de nueve
 * semanas, y en qué semana cae cada instancia.
 *
 * Fuente: https://contenidos.21.edu.ar/microsites/reglamento/index.php?put=5-1-calendario-academico
 * (apartados 3.3.2 y 5.1.3). Verificado el 30/10/2026.
 */

export const REGLAMENTO =
  'https://contenidos.21.edu.ar/microsites/reglamento/index.php?put=5-1-calendario-academico';

/** Semanas de un tramo. Las primeras ocho son de cursada; la novena, de exámenes. */
export const SEMANAS_POR_TRAMO = 9;

/** Tramos por semestre: dos. Con dos semestres, cuatro aperturas de cursada al año. */
export const TRAMOS_POR_SEMESTRE = 2;

/** Las aperturas que anuncia la universidad en la ficha oficial de cada carrera. */
export const APERTURAS = ['marzo', 'mayo', 'agosto', 'octubre'];

/** Qué pasa en cada semana de un tramo de nueve, para las materias bimestrales. */
export const SEMANAS_DEL_TRAMO: { desde: string; hasta: string; instancia: string }[] = [
  { desde: '1', hasta: '4', instancia: 'Primer parcial' },
  { desde: '5', hasta: '8', instancia: 'Segundo parcial' },
  { desde: '9', hasta: '9', instancia: 'Recuperatorio e integrador' },
];

/** Las materias de Intervención Profesional (MIP) se cursan a lo largo del semestre. */
export const MATERIAS_CUATRIMESTRALES = {
  semanas: 18,
  instancias: [
    { desde: '1', hasta: '8', instancia: 'Primer parcial' },
    { desde: '10', hasta: '17', instancia: 'Segundo parcial' },
    { desde: '18', hasta: '18', instancia: 'Recuperatorio e integrador' },
  ],
};

/**
 * Entregas de trabajos prácticos por tipología de materia y semana límite.
 * El reglamento las fija por semana de cursada, no por fecha, así que valen
 * igual en cualquier ciclo.
 */
export const ENTREGAS = [
  { tipo: 'MIA', detalle: 'Materias de Integración y Aplicación', semanas: ['4', '5', '7', '8'] },
  { tipo: 'MEC', detalle: 'Materias de Exploración y Conceptualización', semanas: ['5', '5', '8', '8'] },
  { tipo: 'MIP', detalle: 'Materias de Intervención Profesional', semanas: ['5', '9', '12', '16'] },
] as const;

/**
 * Las preguntas que la página responde. Ninguna lleva fechas del ciclo: mientras
 * el calendario 2027 no salga, la respuesta honesta es la estructura y el aviso
 * de que el inicio exacto se confirma en la sede.
 */
export const PREGUNTAS: { pregunta: string; respuesta: string; enlace?: { texto: string; href: string } }[] = [
  {
    pregunta: '¿Cuándo empiezan las clases en 2027?',
    respuesta:
      'Universidad Siglo 21 abre la cursada varias veces al año: marzo, mayo, agosto y ' +
      'octubre. Las fechas exactas del ciclo 2027 se publican en el calendario académico ' +
      'oficial, que la universidad difunde antes del inicio de clases. La inscripción ya ' +
      'está abierta y en el CAU te confirmamos a cuál de las aperturas llegás con tu trámite.',
    enlace: { texto: 'Ver las carreras', href: '/?casa=siglo21#filtros-categoria' },
  },
  {
    pregunta: '¿Cuántas veces al año se puede empezar a cursar a distancia?',
    respuesta:
      `Cuatro veces. El año se divide en dos semestres y cada uno en ${TRAMOS_POR_SEMESTRE} tramos de ` +
      `${SEMANAS_POR_TRAMO} semanas, así que hay cuatro aperturas de cursada. Aparte están las ` +
      'materias de Intervención Profesional, que se cursan a lo largo de todo el semestre.',
  },
  {
    pregunta: '¿Cómo se organiza un tramo de nueve semanas?',
    respuesta:
      `Las primeras ocho semanas son de cursada y la novena es la de recuperatorio e integrador. ` +
      'El primer parcial se rinde entre la semana 1 y la 4, y el segundo entre la 5 y la 8: ' +
      'dentro de esas ventanas elegís la fecha y la franja horaria cuando te inscribís al parcial.',
  },
  {
    pregunta: '¿Cuánto duran las materias cuatrimestrales?',
    respuesta:
      `Las materias de Intervención Profesional (MIP) no entran en un tramo: duran ` +
      `${MATERIAS_CUATRIMESTRALES.semanas} semanas, todo el semestre. Ahí el primer parcial va de la ` +
      'semana 1 a la 8, el segundo de la 10 a la 17, y la semana 18 es la del recuperatorio e ' +
      'integrador.',
  },
  {
    pregunta: '¿Cuándo se entregan los trabajos prácticos?',
    respuesta:
      'Depende de la tipología de la materia y se cuenta por semana de cursada, no por fecha: en ' +
      'las MIA las entregas cierran en las semanas 4, 5, 7 y 8; en las MEC, en la 5, 5, 8 y 8; y ' +
      'en las MIP, en la 5, 9, 12 y 16. Entregar tarde descuenta un 5% de la nota del trabajo por ' +
      'día, con un tope de 50 puntos.',
  },
  {
    pregunta: '¿Teclab usa este mismo calendario?',
    respuesta:
      'No. Esta estructura es la de Universidad Siglo 21 en modalidad a distancia (ED y EDH). ' +
      'Teclab Instituto Técnico Superior maneja un calendario propio, con sus propias fechas de ' +
      'inicio y de inscripción. Si la carrera que te interesa es de Teclab, la oferta y el ' +
      'contacto están en su página.',
    enlace: { texto: 'Ver Teclab', href: '/teclab' },
  },
];
