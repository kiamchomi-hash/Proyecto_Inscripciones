// La versión markdown del listado de novedades: `/novedades/<n>.md`.
//
// Muestra lo mismo que la página: la destacada de la primera página y los
// artículos de la página en curso, con la misma nota que usa el `/llms.txt`.

import { PAGINAS } from '@/lib/paginas';
import { BASE } from './sitemap-xml.ts';
import { lineaDeArticulo, type ArticuloLlms } from './llms-txt.ts';

export interface NovedadesMarkdown {
  currentPage: number;
  totalPages: number;
  pinned: ArticuloLlms | null;
  items: ArticuloLlms[];
}

function linea(articulo: ArticuloLlms): string {
  const { nombre, url, nota } = lineaDeArticulo(articulo);
  return `- [${nombre}](${url}): ${nota}`;
}

export function construirMarkdownNovedades(datos: NovedadesMarkdown, url: string): string {
  const bloques: string[] = [
    '# Novedades',
    '',
    `> ${PAGINAS.novedades.descripcion}`,
    '',
    `- **Página:** ${url}`,
  ];

  if (datos.totalPages > 1) {
    bloques.push(`- **Paginación:** página ${datos.currentPage} de ${datos.totalPages}`);
  }

  if (datos.pinned) {
    bloques.push('', '## Destacada', '', linea(datos.pinned));
  }

  if (datos.items.length) {
    bloques.push('', '## Artículos', '', ...datos.items.map(linea));
  }

  if (datos.totalPages > 1) {
    bloques.push('', '## Páginas', '');
    if (datos.currentPage > 1) {
      const anterior = datos.currentPage - 1;
      bloques.push(`- [Página anterior](${BASE}/novedades/${anterior}): página ${anterior} de ${datos.totalPages}.`);
    }
    if (datos.currentPage < datos.totalPages) {
      const siguiente = datos.currentPage + 1;
      bloques.push(`- [Página siguiente](${BASE}/novedades/${siguiente}): página ${siguiente} de ${datos.totalPages}.`);
    }
  }

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
