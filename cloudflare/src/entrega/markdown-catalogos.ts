// La versión markdown de las páginas que son un catálogo: la de Teclab, la de
// las clases de apoyo y la del test vocacional.
//
// El contenido es el mismo que el `llms.txt` —mismos nombres, mismas URLs y
// mismas notas—, así que las líneas se arman con los mismos helpers.

export interface ItemCatalogo {
  nombre: string;
  url: string;
  nota: string;
}

export interface SeccionCatalogo {
  titulo: string;
  items: ItemCatalogo[];
}

export function construirMarkdownCatalogo(opciones: {
  titulo: string;
  descripcion: string;
  url: string;
  secciones: SeccionCatalogo[];
}): string {
  const bloques: string[] = [
    `# ${opciones.titulo}`,
    '',
    `> ${opciones.descripcion}`,
    '',
    `- **Página:** ${opciones.url}`,
  ];

  for (const seccion of opciones.secciones) {
    if (!seccion.items.length) continue;
    bloques.push('', `## ${seccion.titulo}`, '');
    for (const item of seccion.items) bloques.push(`- [${item.nombre}](${item.url}): ${item.nota}`);
  }

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
