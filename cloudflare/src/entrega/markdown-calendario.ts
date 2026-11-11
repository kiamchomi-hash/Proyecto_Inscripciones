// La versión markdown del calendario académico: `/calendario-academico.md`.
//
// La estructura del ciclo vive en `paginas/calendario-academico/datos.ts`, que
// es el mismo módulo del que la página saca su contenido.

import {
  APERTURAS, ENTREGAS, MATERIAS_CUATRIMESTRALES, metadata, PREGUNTAS,
  REGLAMENTO, SEMANAS_DEL_TRAMO, SEMANAS_POR_TRAMO, TRAMOS_POR_SEMESTRE,
} from '../../../paginas/calendario-academico/datos.ts';

/** "1 a 4" o "9", según corresponda. */
function rango(desde: string, hasta: string): string {
  return desde === hasta ? desde : `${desde} a ${hasta}`;
}

export function construirMarkdownCalendario(url: string): string {
  const bloques: string[] = [
    '# Calendario académico',
    '',
    `> ${metadata.description}`,
    '',
    `- **Página:** ${url}`,
    '',
    '## Cómo está organizado el ciclo',
    '',
    `- **Aperturas de cursada:** ${APERTURAS.join(', ')}.`,
    '- **Semestres:** dos.',
    `- **Tramos por semestre:** ${TRAMOS_POR_SEMESTRE}.`,
    `- **Semanas por tramo:** ${SEMANAS_POR_TRAMO}. Las primeras ocho son de cursada y la última, de recuperatorio e integrador.`,
    `- **Reglamento:** ${REGLAMENTO}`,
    '',
    '## Qué pasa en cada semana de un tramo',
    '',
    '| Semanas | Instancia |',
    '| --- | --- |',
    ...SEMANAS_DEL_TRAMO.map(semana => `| ${rango(semana.desde, semana.hasta)} | ${semana.instancia} |`),
    '',
    '## Materias cuatrimestrales',
    '',
    `- **Duración:** ${MATERIAS_CUATRIMESTRALES.semanas} semanas, a lo largo de todo el semestre.`,
    '',
    '| Semanas | Instancia |',
    '| --- | --- |',
    ...MATERIAS_CUATRIMESTRALES.instancias
      .map(instancia => `| ${rango(instancia.desde, instancia.hasta)} | ${instancia.instancia} |`),
    '',
    '## Entregas de trabajos prácticos',
    '',
    ...ENTREGAS.map(entrega =>
      `- **${entrega.tipo} — ${entrega.detalle}:** semanas ${entrega.semanas.join(', ')}.`),
    '',
    '## Preguntas',
  ];

  for (const pregunta of PREGUNTAS) {
    bloques.push('', `### ${pregunta.pregunta}`, '', pregunta.respuesta);
    if (pregunta.enlace) bloques.push('', `[${pregunta.enlace.texto}](${pregunta.enlace.href})`);
  }

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
