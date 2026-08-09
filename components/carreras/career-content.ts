// Helpers puros para armar el contenido de una carrera.
// Viven aca (y no dentro de un componente 'use client') porque los usa tanto el
// modal del catalogo como la pagina server-rendered de /carreras/[slug].

import type {
  Carrera,
  SlidePortada,
  SlidePlanEstudios,
  SlideCierre,
} from '@/components/index/types';
import { carreraFullName } from '@/components/index/types';
import type { TeclabPeriodo } from '@/components/index/teclab';
// Primer import de runtime del modulo: hasta ahora solo traia tipos, que el type
// stripping borra. O sea que este archivo ya no se puede abrir con node pelado
// desde herramientas/ -- el alias `@/` lo resuelve el bundler, no Node.
import { esCursoTeclab, esTeclab, parsePlanTeclab } from '@/components/index/teclab';

/** Separa el nombre en prefijo ("Licenciatura en") y nombre limpio. */
export function getCareerPrefix(carrera: Carrera): { prefix: string; cleanName: string } {
  if (carrera.prefix !== null || carrera.nombre_corto !== null) {
    return { prefix: carrera.prefix || '', cleanName: carrera.nombre_corto || carrera.nombre };
  }
  let prefix = '';
  let cleanName = carrera.nombre;
  const nameLower = carrera.nombre.toLowerCase();
  const prefixMap = [
    { match: 'licenciatura', display: 'Licenciatura', len: 12 },
    { match: 'tecnicatura', display: 'Tecnicatura', len: 11 },
    { match: 'maestría', display: 'Maestria', len: 8 },
    { match: 'maestria', display: 'Maestria', len: 8 },
    { match: 'especialización', display: 'Especializacion', len: 15 },
    { match: 'especializacion', display: 'Especializacion', len: 15 },
    { match: 'diplomatura', display: 'Diplomatura', len: 11 },
    { match: 'certificado', display: 'Certificado', len: 11 },
    { match: 'curso de ', display: 'Curso de', len: 9 },
    { match: 'curso', display: 'Curso', len: 5 },
  ];
  for (const p of prefixMap) {
    if (nameLower.startsWith(p.match)) {
      prefix = p.display;
      cleanName = carrera.nombre.substring(p.len).trim();
      break;
    }
  }
  cleanName = cleanName.replace(/Universitaria|Universitario|Univ\./g, '').replace(/\s*\(CCC\)/gi, '').replace(/\s*-\s*CCC\b/gi, '').replace(/\s+CCC$/i, '').replace(/\s\s+/g, ' ').trim();
  if (cleanName.toLowerCase().startsWith('en ')) {
    prefix += ' en';
    cleanName = cleanName.substring(3).trim();
  }
  if (cleanName.length > 0) {
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }
  return { prefix, cleanName };
}

/** Parsea el campo enfoque de Identidad Argentina en metadatos estructurados. */
export function parseIAMeta(enfoque: string): { modalidad: string; certificacion: string } {
  const lines = enfoque.split('\n');
  let modalidad = '100% Online';
  let certificacion = 'Nacional e Internacional';
  for (const line of lines) {
    if (line.startsWith('Modalidad:')) modalidad = line.replace('Modalidad:', '').trim();
    if (line.startsWith('Certificación:')) certificacion = line.replace('Certificación:', '').trim();
  }
  return { modalidad, certificacion };
}

/** Parsea el plan_estudios de Identidad Argentina en modulos. */
export function parsePlanModulos(plan: string): { titulo: string; contenido: string }[] {
  const blocks = plan.split(/\n\n+/);
  const modulos: { titulo: string; contenido: string }[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const firstLine = lines[0]?.trim() || '';
    if (firstLine.startsWith('Módulo ') || firstLine.startsWith('Masterclass ')) {
      modulos.push({ titulo: firstLine, contenido: lines.slice(1).join('\n').trim() });
    } else {
      modulos.push({ titulo: '', contenido: block.trim() });
    }
  }
  return modulos;
}

/** Parsea seccion_modalidad de Identidad Argentina en docente + bio. */
export function parseDocente(raw: string): { nombre: string; bio: string[] } {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  return { nombre: lines[0] || '', bio: lines.slice(1).map(l => l.replace(/^·\s*/, '')) };
}

// ── Acceso a los slides ──

export function getPortada(carrera: Pick<Carrera, 'slides'>): SlidePortada | null {
  return (carrera.slides?.find(s => s.type === 'portada') as SlidePortada) ?? null;
}

export function getPlanSlide(carrera: Carrera): SlidePlanEstudios | null {
  return (carrera.slides?.find(s => s.type === 'plan_estudios') as SlidePlanEstudios) ?? null;
}

export function getCierre(carrera: Carrera): SlideCierre | null {
  return (carrera.slides?.find(s => s.type === 'cierre') as SlideCierre) ?? null;
}

/** Un año del plan, aplanado desde las paginas del slide (izquierda + derecha). */
export interface AnioPlan {
  anio: string;
  cuatrimestres: { label: string; materias: string[] }[];
}

/** Aplana el slide de plan de estudios en una lista de años lista para renderizar. */
export function planSlideToAnios(slide: SlidePlanEstudios): AnioPlan[] {
  const anios: AnioPlan[] = [];
  for (const pagina of slide.paginas) {
    for (const lado of [pagina.izquierda, pagina.derecha]) {
      if (lado?.año) anios.push({ anio: lado.año, cuatrimestres: lado.cuatrimestres });
    }
  }
  return anios;
}

/** Bloques extra del plan (titulos de intermedio, practicas, etc). */
export function planSlideToExtras(slide: SlidePlanEstudios): { titulo: string; items: string[]; nota?: string }[] {
  return slide.paginas.flatMap(p => p.extras ?? []);
}

/**
 * El plan de Teclab viene por periodo ("Primer Año | 1er cuatrimestre"); la
 * pagina los agrupa por año para reusar el mismo bloque que el resto de las
 * carreras.
 */
export function periodosTeclabToAnios(periodos: TeclabPeriodo[]): AnioPlan[] {
  const anios: AnioPlan[] = [];
  for (const periodo of periodos) {
    let anio = anios.find(a => a.anio === periodo.año);
    if (!anio) {
      anio = { anio: periodo.año, cuatrimestres: [] };
      anios.push(anio);
    }
    anio.cuatrimestres.push({ label: periodo.label, materias: periodo.materias });
  }
  return anios;
}

/** Cuenta las materias del plan: sirve para decidir si vale la pena mostrarlo. */
export function contarMaterias(slide: SlidePlanEstudios): number {
  return planSlideToAnios(slide).reduce(
    (total, a) => total + a.cuatrimestres.reduce((n, c) => n + c.materias.length, 0),
    0,
  );
}

/**
 * Si la ficha llega a pintar la seccion de plan de estudios. El dato vive en
 * tres lugares distintos segun la familia -- modulos de texto en Identidad
 * Argentina, periodos en Teclab, o la columna suelta en las de Siglo 21 -- asi
 * que el criterio se comparte en vez de reescribirse en cada lado.
 *
 * Lo usa la meta description para decidir si puede prometer el plan. Prometerlo
 * sin tenerlo es la peor version del problema que estamos arreglando: alguien
 * hace clic buscando el plan, no lo encuentra y se vuelve a Google.
 */
export function tienePlanDeEstudios(carrera: Carrera): boolean {
  // Un curso corto no tiene plan: su columna plan_estudios guarda como se cursa
  // y la ficha la pinta en su propia seccion.
  if (esCursoTeclab(carrera)) return false;

  if (esTeclab(carrera)) {
    return periodosTeclabToAnios(parsePlanTeclab(carrera.plan_estudios)).length > 0;
  }

  const slide = getPlanSlide(carrera);
  const conMaterias = Boolean(slide && contarMaterias(slide) > 0);

  // parsePlanModulos('') devuelve un modulo vacio, no una lista vacia: sin este
  // guarda toda carrera de convenio sin plan diria que si.
  if (carrera.nivel === 'Identidad Argentina') {
    return conMaterias || (Boolean(carrera.plan_estudios) && parsePlanModulos(carrera.plan_estudios!).length > 0);
  }
  return conMaterias || Boolean(carrera.plan_estudios);
}

/**
 * El texto con el que se abre WhatsApp desde la ficha y desde los cuatro modales.
 * Los asteriscos son la negrita de WhatsApp: el lead manda el mensaje sin leerlo,
 * asi que del otro lado el nombre tiene que saltar sin buscarlo en el renglon.
 *
 * Va `carreraFullName` y no `nombre` para que no se pierda el tipo: en las filas
 * de Siglo 21 el "Licenciatura en" vive en `prefix`, y esa funcion ademas le saca
 * el "Grado / " de adelante y no lo duplica en Teclab, que ya lo trae en el nombre.
 *
 * Cursos y diplomaturas se quedan con la redaccion vieja, sin "la carrera" ni
 * mayuscula: no son carreras, y el nombre ya dice lo que son ("sobre Diplomatura
 * en Oratoria"). Identidad Argentina entra entera por ahi -- sus doce filas son
 * diplomaturas o cursos.
 */
export function mensajeWhatsAppInfo(carrera: Pick<Carrera, 'nombre' | 'prefix' | 'nivel'>): string {
  const nombre = carreraFullName(carrera);
  if (carrera.nivel === 'Identidad Argentina' || esCursoTeclab(carrera)) {
    return `Hola, me gustaría recibir más información sobre ${nombre}`;
  }
  return `Hola, me gustaría recibir más información sobre la carrera *${nombre.toUpperCase()}*`;
}
