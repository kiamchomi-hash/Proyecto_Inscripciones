// La versión markdown de una clase de apoyo: `/clases-apoyo/<slug>.md`.
//
// Mismo criterio que la ficha de carrera: todo sale de la base y ninguna línea
// de texto es nueva.

import { sanitizeContent } from '@/lib/sanitize-content';
import { htmlAMarkdown } from '../../../lib/html-markdown.ts';
import { BASE } from './sitemap-xml.ts';

/** Lo que la ficha trae de la base, sin el HTML. */
export interface MateriaMarkdown {
  slug: string;
  label: string;
  nombre_profesor: string | null;
  whatsapp: string | null;
  telefono_display: string | null;
  descripcion: string[];
  texto_seo: string[];
}

/** Los párrafos de la base, sin etiquetas: el markdown no lleva HTML. */
function parrafos(lista: string[]): string[] {
  return lista
    .map(parrafo => htmlAMarkdown(sanitizeContent(parrafo)).trim())
    .filter(Boolean);
}

function linea(titulo: string, valor: string | null | undefined): string | null {
  if (!valor) return null;
  return `- **${titulo}:** ${valor}`;
}

export function construirMarkdownMateria(materia: MateriaMarkdown, url: string): string {
  const descripcion = parrafos(materia.descripcion);
  const texto = parrafos(materia.texto_seo);

  const bloques: string[] = [`# Clases particulares de ${materia.label} en Villa Lugano`];
  if (descripcion[0]) bloques.push('', `> ${descripcion[0]}`);
  for (const parrafo of descripcion.slice(1)) bloques.push('', parrafo);

  bloques.push('');
  for (const item of [
    linea('Materia', materia.label),
    linea('Profesor', materia.nombre_profesor),
    linea('Teléfono', materia.telefono_display),
    linea('WhatsApp', materia.whatsapp ? `https://wa.me/${materia.whatsapp}` : null),
    linea('Página', url),
  ]) {
    if (item) bloques.push(item);
  }

  if (texto.length) {
    bloques.push('', '## Clases de apoyo');
    for (const parrafo of texto) bloques.push('', parrafo);
  }

  bloques.push('', '## Reservar un turno', '',
    `- **Formulario de reserva:** ${url}`,
    `- **WhatsApp:** https://wa.me/${materia.whatsapp ?? '5491132973801'}`);

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

/** La URL pública de la clase: la misma que usa el sitemap. */
export const urlMateria = (slug: string): string => `${BASE}/clases-apoyo/${slug}`;
