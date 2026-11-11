// La versión markdown de un artículo de novedades: `/novedades/articulo/<slug>.md`.
//
// El contenido del artículo es HTML guardado en la base: se limpia como lo
// hace la página y recién después se pasa a markdown.

import { sanitizeContent } from '@/lib/sanitize-content';
import { htmlAMarkdown } from '../../../lib/html-markdown.ts';
import { BASE } from './sitemap-xml.ts';

export interface ArticuloMarkdown {
  titulo: string;
  slug: string;
  extracto: string | null;
  fecha: string | null;
  tag: string | null;
  contenido: string | null;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fechaLarga(fecha: string | null): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha ?? '');
  if (!partes) return '';
  const [, anio, mes, dia] = partes;
  return `${Number(dia)} de ${MESES[Number(mes) - 1]} de ${anio}`;
}

export function construirMarkdownArticulo(articulo: ArticuloMarkdown, url: string): string {
  const bloques: string[] = [`# ${articulo.titulo}`];

  const extracto = articulo.extracto?.trim();
  if (extracto) bloques.push('', `> ${extracto.replace(/\s+/g, ' ')}`);

  bloques.push('');
  for (const item of [
    articulo.fecha ? `- **Fecha:** ${fechaLarga(articulo.fecha)}` : null,
    articulo.tag ? `- **Sección:** ${articulo.tag}` : null,
    `- **Página:** ${url}`,
  ]) {
    if (item) bloques.push(item);
  }

  if (articulo.contenido) {
    const cuerpo = htmlAMarkdown(sanitizeContent(articulo.contenido)).trim();
    if (cuerpo) bloques.push('', cuerpo);
  }

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

/** La URL pública del artículo: la misma que usa el sitemap. */
export const urlArticulo = (slug: string): string => `${BASE}/novedades/articulo/${slug}`;
