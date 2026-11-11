// La versión markdown de la página de contacto: `/contacto.md`.
//
// Los datos de la sede viven en `lib/sede.ts`, que ya usan el JSON-LD del
// layout y la página: acá no se copia ninguno.

import { PAGINAS } from '@/lib/paginas';
import { LINEAS_DE_CONTACTO } from './markdown-sede.ts';

export function construirMarkdownContacto(url: string): string {
  const bloques: string[] = [
    '# Contacto',
    '',
    `> ${PAGINAS.contacto.descripcion}`,
    '',
    ...LINEAS_DE_CONTACTO,
    `- **Página:** ${url}`,
  ];

  return `${bloques.join('\n').trim()}\n`;
}
