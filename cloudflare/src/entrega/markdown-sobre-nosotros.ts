// La versión markdown de la página del CAU: `/sobre-nosotros.md`.
//
// El texto sale de `paginas/sobre-nosotros/datos.tsx`, que es el mismo módulo
// del que la página saca sus tarjetas, sus números y sus preguntas.

import {
  CHECKLIST, FEATURES, metadata, PREGUNTAS_SEDE, STATS,
} from '../../../paginas/sobre-nosotros/datos.tsx';
import { LINEAS_DE_CONTACTO } from './markdown-sede.ts';

export function construirMarkdownSobreNosotros(url: string): string {
  const bloques: string[] = [
    '# Sobre nosotros',
    '',
    `> ${metadata.description}`,
    '',
    `- **Página:** ${url}`,
    '',
    '## Qué es este centro',
    '',
  ];

  for (const feature of FEATURES) bloques.push(`- **${feature.title}:** ${feature.description}`);

  bloques.push('', '## La sede en números', '');
  for (const stat of STATS) bloques.push(`- **${stat.value}** — ${stat.label}`);

  bloques.push('', '## Qué se puede hacer en la sede', '');
  for (const item of CHECKLIST) bloques.push(`- ${item}`);

  bloques.push('', '## Contacto', '', ...LINEAS_DE_CONTACTO);

  bloques.push('', '## Preguntas', '');
  for (const pregunta of PREGUNTAS_SEDE) {
    bloques.push(`### ${pregunta.pregunta}`, '', pregunta.respuesta);
    if (pregunta.enlace) bloques.push('', `[Ver en el mapa](${pregunta.enlace})`);
  }

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
