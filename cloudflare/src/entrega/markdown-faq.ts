// La versión markdown de las preguntas frecuentes: `/faq.md`.
//
// Las respuestas del acordeón son JSX: en vez de copiarlas a un archivo de
// texto —que se desincronizaría con la página—, se renderizan y se pasan por
// el conversor de HTML a markdown. Lo que sale es lo mismo que muestra la
// página, sin el código de estilo.

import { renderToStaticMarkup } from 'react-dom/server';
import { FAQ_ITEMS } from '@/components/faq-page';
import { sanitizeContent } from '@/lib/sanitize-content';
import { htmlAMarkdown } from '../../../lib/html-markdown.ts';
import { PAGINAS } from '@/lib/paginas';

/** Las preguntas que mandan los que escriben y el centro aprueba. */
export interface PreguntaPublica {
  titulo: string;
  descripcion: string | null;
  respuesta: string | null;
}

export function construirMarkdownFaq(preguntas: PreguntaPublica[], url: string): string {
  const bloques: string[] = [
    '# Preguntas frecuentes',
    '',
    `> ${PAGINAS.faq.descripcion}`,
    '',
    `- **Página:** ${url}`,
    '',
    '## Preguntas',
  ];

  for (const item of FAQ_ITEMS) {
    bloques.push('', `### ${item.question}`, '');
    const respuesta = htmlAMarkdown(renderToStaticMarkup(item.content)).trim();
    if (respuesta) bloques.push(respuesta);
  }

  if (preguntas.length) {
    bloques.push('', '## Preguntas de usuarios', '');
    for (const pregunta of preguntas) {
      bloques.push(`### ${pregunta.titulo}`, '');
      // Las preguntas las escribe la gente: el texto viene con HTML y lo que
      // se publica es el que la página muestra, limpio.
      const descripcion = pregunta.descripcion ? limpiar(pregunta.descripcion) : '';
      if (descripcion) bloques.push(descripcion, '');
      const respuesta = pregunta.respuesta ? limpiar(pregunta.respuesta) : '';
      if (respuesta) bloques.push(respuesta, '');
    }
  }

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

/** El texto de la base, limpio de HTML y pasado a markdown. */
function limpiar(texto: string): string {
  return htmlAMarkdown(sanitizeContent(texto)).trim();
}
