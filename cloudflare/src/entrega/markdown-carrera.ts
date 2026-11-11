// La versión markdown de la ficha de una carrera: `/carreras/<slug>.md`.
//
// La convención llmstxt.org pide que las páginas tengan una versión markdown
// limpia en la misma URL, para que un agente no tenga que leer el HTML.
//
// Todo lo que sale acá viene de la base: la descripción, el plan de estudios,
// las preguntas frecuentes y los datos de la ficha. No se escribe una línea de
// texto que no esté en el sitio.

import type { Carrera } from '@/components/index/types';
import { CASAS, casaDelNivel, carreraFullName } from '@/components/index/types';
import {
  esCursoTeclab, esTeclab, partirDescripcionTeclab, parseCompetenciasTeclab, parsePlanTeclab,
} from '@/components/index/teclab';
import {
  getPlanSlide, getPortada, parseDocente, parseIAMeta, parsePlanModulos,
  planSlideToAnios, planSlideToExtras, periodosTeclabToAnios, tienePlanDeEstudios,
} from '@/components/carreras/career-content';
import { numeroWhatsAppDe } from '../../../lib/whatsapp.ts';
import { BASE } from './sitemap-xml.ts';

/** Los rótulos que la ficha usa para los datos de arriba. */
const INSTITUCIONES: Record<string, string> = {
  siglo21: 'Universidad Siglo 21',
  teclab: 'Teclab · Instituto Técnico Superior',
  identidad: 'Academia Identidad Argentina',
};

function linea(titulo: string, valor: string | null | undefined): string | null {
  if (!valor) return null;
  return `- **${titulo}:** ${valor}`;
}

/** Los datos de la cabecera: los mismos que la ficha muestra arriba. */
function datosDeCarrera(carrera: Carrera): string[] {
  const esIA = carrera.nivel === 'Identidad Argentina';
  const casa = casaDelNivel(carrera.nivel);
  const lineas: (string | null)[] = [
    linea('Institución', INSTITUCIONES[casa ?? ''] ?? CASAS.find(c => c.id === casa)?.label),
  ];

  if (esIA) {
    const meta = parseIAMeta(carrera.enfoque || '');
    lineas.push(linea('Escuela', carrera.prefix || 'Diplomatura'));
    lineas.push(linea('Duración', carrera.duracion));
    lineas.push(linea('Modalidad', meta.modalidad));
    lineas.push(linea('Certificación', meta.certificacion));
  } else if (esTeclab(carrera) || esCursoTeclab(carrera)) {
    lineas.push(linea('Duración', carrera.duracion));
    lineas.push(linea('Título', carrera.titulo));
    lineas.push(linea('Modalidad', carrera.modalidad || '100% online'));
  } else {
    lineas.push(linea('Nivel', carrera.nivel));
    lineas.push(linea('Duración', carrera.duracion));
    lineas.push(linea('Título', carrera.titulo));
    lineas.push(linea('Modalidad', carrera.modalidad || 'Educación distribuida'));
  }
  return lineas.filter((linea): linea is string => linea !== null);
}

/** El plan de estudios: por años y cuatrimestres, como lo muestra la ficha. */
function planEnMarkdown(carrera: Carrera): string[] {
  if (carrera.nivel === 'Identidad Argentina') {
    const modulos = parsePlanModulos(carrera.plan_estudios || '');
    if (!modulos.length) return [];
    const bloques: string[] = ['## Plan de estudios', ''];
    for (const modulo of modulos) {
      if (modulo.titulo) bloques.push(`### ${modulo.titulo}`);
      for (const linea of modulo.contenido.split('\n').map(l => l.trim()).filter(Boolean)) {
        bloques.push(`- ${linea.replace(/^[•·*-]\s*/, '')}`);
      }
    }
    return bloques;
  }

  if (esTeclab(carrera)) {
    const anios = periodosTeclabToAnios(parsePlanTeclab(carrera.plan_estudios));
    if (!anios.length) return [];
    return ['## Plan de estudios', '', ...aniosEnMarkdown(anios)];
  }

  const slide = getPlanSlide(carrera);
  if (!slide) return [];
  const anios = planSlideToAnios(slide);
  if (!anios.length) return [];
  const bloques = ['## Plan de estudios', '', ...aniosEnMarkdown(anios)];
  for (const extra of planSlideToExtras(slide)) {
    bloques.push(`### ${extra.titulo}`);
    for (const item of extra.items) bloques.push(`- ${item}`);
    if (extra.nota) bloques.push(extra.nota);
  }
  return bloques;
}

function aniosEnMarkdown(anios: { anio: string; cuatrimestres: { label: string; materias: string[] }[] }[]): string[] {
  const bloques: string[] = [];
  for (const ano of anios) {
    bloques.push(`### ${ano.anio}`, '');
    for (const cuatrimestre of ano.cuatrimestres) {
      bloques.push(`**${cuatrimestre.label}**`, '');
      for (const materia of cuatrimestre.materias) bloques.push(`- ${materia}`);
      bloques.push('');
    }
  }
  return bloques;
}

/** Las preguntas frecuentes: viven en un slide de la propia ficha. */
function faqEnMarkdown(carrera: Carrera): string[] {
  const slide = carrera.slides?.find(s => s.type === 'faq');
  if (!slide || slide.type !== 'faq' || !slide.items.length) return [];
  const bloques = ['## Preguntas frecuentes', ''];
  for (const item of slide.items) {
    bloques.push(`### ${item.pregunta}`, '', item.respuesta, '');
  }
  return bloques;
}

export function construirMarkdownCarrera(carrera: Carrera, url: string): string {
  const nombre = carreraFullName(carrera);
  const casa = casaDelNivel(carrera.nivel);
  const esIA = carrera.nivel === 'Identidad Argentina';
  const conMaterialTeclab = esTeclab(carrera) || esCursoTeclab(carrera);

  const bloques: string[] = [`# ${nombre}`];

  // El resumen: la descripción de la base. En Teclab la descripción tiene dos
  // partes —el perfil y la salida laboral— y el perfil es el resumen.
  const descripcion = conMaterialTeclab
    ? partirDescripcionTeclab(carrera.descripcion).perfil
    : esIA
      ? (carrera.descripcion.split(/\s(?:Docente:|Escuela\s+de\b|Convenio\s+Academia)/)[0] ?? '').trim()
      : carrera.descripcion;
  if (descripcion) bloques.push('', `> ${descripcion.replace(/\s+/g, ' ').trim()}`);

  bloques.push('', ...datosDeCarrera(carrera));
  bloques.push(linea('Página', url) ?? '');

  // Lo que vas a aprender: los bullets de la portada de la ficha.
  const portada = getPortada(carrera);
  if (portada?.bullets.length) {
    bloques.push('', '## Lo que vas a aprender', '');
    for (const bullet of portada.bullets) bloques.push(`- ${bullet}`);
  }

  // En Teclab, las competencias y la salida laboral.
  if (conMaterialTeclab) {
    const competencias = parseCompetenciasTeclab(carrera.seccion_modalidad);
    if (competencias.length) {
      bloques.push('', '## Competencias', '');
      for (const competencia of competencias) bloques.push(`- ${competencia}`);
    }
    const salida = partirDescripcionTeclab(carrera.descripcion).salida;
    if (salida) bloques.push('', '## Salida laboral', '', salida);
  }

  // El docente, en Identidad Argentina.
  if (esIA && carrera.seccion_modalidad) {
    const docente = parseDocente(carrera.seccion_modalidad);
    if (docente.nombre) {
      bloques.push('', '## Tu docente', '', `**${docente.nombre}**`, '');
      for (const linea of docente.bio) bloques.push(linea, '');
    }
  }

  // En un curso de Teclab el plan es cómo se cursa, no un temario.
  if (esCursoTeclab(carrera)) {
    const cursada = parseCompetenciasTeclab(carrera.plan_estudios);
    if (cursada.length) {
      bloques.push('', '## Cómo se cursa', '');
      for (const item of cursada) bloques.push(`- ${item}`);
    }
  } else if (tienePlanDeEstudios(carrera)) {
    bloques.push('', ...planEnMarkdown(carrera));
  }

  bloques.push('', ...faqEnMarkdown(carrera));

  // Cómo seguir: los mismos dos caminos que tiene la ficha.
  const whatsapp = `https://wa.me/${numeroWhatsAppDe(casa)}`;
  bloques.push('', '## Inscripción', '',
    `- **Consultar por WhatsApp:** ${whatsapp}`,
    `- **Inscribirse:** ${url}/inscripcion`,
    '- **Aranceles:** se consultan por WhatsApp o desde el formulario de inscripción.');

  return `${bloques.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
