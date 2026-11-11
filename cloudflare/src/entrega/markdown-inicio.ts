// La versión markdown de la home: `/index.md`.
//
// La home es el catálogo: su texto no vive en la base ni en un módulo propio,
// sino en los componentes que la pintan. Lo que sí se puede dar a un agente es
// lo que la página muestra en estructura —el título, la oferta agrupada por
// área y los datos de la sede—, con los mismos nombres, URLs y notas que el
// `/llms.txt`, que sigue siendo el mapa completo del sitio.

import {
  CATEGORIES, categoriasPresentes, esCarreraVisible, getCategoryForCarrera,
} from '../../../components/index/types.ts';
import { PAGINAS } from '@/lib/paginas';
import { BASE } from './sitemap-xml.ts';
import { LINEAS_DE_CONTACTO } from './markdown-sede.ts';
import { lineaDeCarrera, type CarreraLlms } from './llms-txt.ts';

/**
 * Las carreras que muestra la home. Son las visibles menos Identidad
 * Argentina, que la home oculta aunque su ficha siga publicada: el mismo
 * filtro que `carrerasDeHome` en `src/datos/home.ts`.
 */
export function carrerasDeInicio(carreras: CarreraLlms[]): CarreraLlms[] {
  return carreras
    .filter(esCarreraVisible)
    .filter(carrera => carrera.nivel !== 'Identidad Argentina');
}

export function construirMarkdownInicio(carreras: CarreraLlms[], url: string): string {
  const bloques: string[] = [
    '# Universidad Siglo 21 online: carreras e inscripciones',
    '',
    `> ${PAGINAS.home.descripcion}`,
    '',
    `- **Página:** ${url}`,
    `- **Índice del sitio para agentes:** ${BASE}/llms.txt`,
  ];

  // Mismo orden y mismos títulos que las píldoras del catálogo.
  const grupos = new Map<string, CarreraLlms[]>();
  for (const carrera of carrerasDeInicio(carreras)) {
    const id = getCategoryForCarrera(carrera);
    const lista = grupos.get(id) ?? [];
    lista.push(carrera);
    grupos.set(id, lista);
  }

  const presentes = new Set(categoriasPresentes(carrerasDeInicio(carreras)).map(categoria => categoria.id));
  const secciones = CATEGORIES
    .filter(categoria => categoria.id !== 'all' && presentes.has(categoria.id))
    .map(categoria => ({ titulo: categoria.label, carreras: grupos.get(categoria.id) ?? [] }));
  // Una categoría nueva en la taxonomía no se pierde: cae con su id de título.
  for (const [id, lista] of grupos) {
    if (CATEGORIES.some(categoria => categoria.id === id)) continue;
    secciones.push({ titulo: id, carreras: lista });
  }

  if (secciones.length) {
    bloques.push('', '## Oferta académica');
    for (const seccion of secciones) {
      bloques.push('', `### ${seccion.titulo}`, '');
      for (const carrera of seccion.carreras) {
        const { nombre, url: destino, nota } = lineaDeCarrera(carrera);
        bloques.push(`- [${nombre}](${destino}): ${nota}`);
      }
    }
  }

  bloques.push(
    '',
    '## Inscripción',
    '',
    '- **Contacto:** el formulario de contacto está en la misma página de inicio.',
    '- **Preinscripción:** el formulario de preinscripción está en la misma página de inicio.',
    '- **Por carrera:** cada ficha tiene su página de inscripción, en `/carreras/<slug>/inscripcion`.',
    '',
    '## Contacto',
    '',
    ...LINEAS_DE_CONTACTO,
  );

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
