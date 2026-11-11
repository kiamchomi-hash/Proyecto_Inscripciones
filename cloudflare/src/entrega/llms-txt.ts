// `/llms.txt`: el mapa del sitio para agentes de IA, según la convención
// llmstxt.org (https://llmstxt.org/). Un agente que llega al sitio recibe acá
// qué hay y dónde, sin tener que rastrearlo.
//
// Módulo puro: recibe los datos ya proyectados y devuelve el markdown. La
// lectura de D1 vive en `src/datos/llms-txt.ts` y la ruta en
// `src/pages/llms.txt.ts`, igual que el sitemap separa datos, proyección y
// serialización.
//
// Importa sólo la taxonomía compartida (`carreraToSlug`, `getCategoryForCarrera`)
// para que las pruebas lo abran con Node pelado.

import {
  CATEGORIES, carreraFullName, carreraToSlug, esCarreraVisible, getCategoryForCarrera,
} from '../../../components/index/types.ts';
import { PAGINAS as TEXTOS } from '../../../lib/paginas.ts';
import { BASE } from './sitemap-xml.ts';

// ── Datos ───────────────────────────────────────────────────────────────────

export interface CarreraLlms {
  nombre: string;
  prefix: string | null;
  nivel: string;
  descripcion: string | null;
  duracion: string | null;
  titulo: string | null;
  modalidad: string | null;
  proximamente: boolean;
}

export interface MateriaLlms {
  slug: string;
  label: string;
  descripcion: string | null;
}

export interface ArticuloLlms {
  slug: string;
  titulo: string;
  extracto: string | null;
  fecha: string | null;
}

export interface DatosLlmsTxt {
  carreras: CarreraLlms[];
  materias: MateriaLlms[];
  articulos: ArticuloLlms[];
}

// ── Encabezado ──────────────────────────────────────────────────────────────

const TITULO = 'Universidad Siglo 21 — CAU Villa Lugano';

/**
 * El bloque `>` de la especificación: de qué trata el sitio, en dos líneas.
 * Los aranceles no se publican (viven en `precios_privados` y sólo se ven
 * con «Ver precio» o por WhatsApp), así que se dice cómo se consultan en vez
 * de inventar una cifra.
 */
const RESUMEN = '> Centro de Aprendizaje Universitario (CAU) de Universidad Siglo 21, en Guaminí 4876, '
  + 'Villa Lugano, Comuna 8, CABA. El sitio publica la oferta académica de Siglo 21 (licenciaturas y '
  + 'tecnicaturas a distancia), los programas de Identidad Argentina, las tecnicaturas de Teclab y las '
  + 'clases de apoyo presenciales del CAU. Los aranceles no se publican: se consultan por WhatsApp o '
  + 'desde el formulario de inscripción de cada carrera.';

const CONTEXTO = 'El contenido está en español (es-AR). El mapa completo de URLs del sitio está en '
  + `<${BASE}/sitemap.xml>.`;

// ── Secciones ───────────────────────────────────────────────────────────────

/**
 * Orden y título de las secciones de carreras. El id es el de la categoría de
 * la taxonomía compartida (`getCategoryForCarrera`), así que una categoría
 * nueva no se pierde: cae en una sección con la etiqueta de `CATEGORIES`.
 */
const SECCIONES: ReadonlyArray<{ id: string; titulo: string }> = [
  { id: 'licenciaturas', titulo: 'Licenciaturas de Universidad Siglo 21' },
  { id: 'tecnicaturas', titulo: 'Tecnicaturas de Universidad Siglo 21' },
  { id: 'identidad_argentina', titulo: 'Diplomaturas y cursos de Identidad Argentina' },
  { id: 'teclab_tecnologia', titulo: 'Tecnicaturas y cursos de Teclab (Tecnología)' },
  { id: 'teclab_gestion', titulo: 'Tecnicaturas de Teclab (Gestión)' },
];

/**
 * Las páginas fijas del sitio. Las descripciones son las mismas que declaran
 * las páginas (`descripcion` del layout), para que el archivo no prometa
 * nada que la página no diga.
 */
const PAGINAS: ReadonlyArray<{ ruta: string; nombre: string; nota: string }> = [
  {
    ruta: '/',
    nombre: 'Inicio',
    nota: TEXTOS.home.descripcion,
  },
  {
    ruta: '/teclab',
    nombre: 'Teclab',
    nota: TEXTOS.teclab.descripcion,
  },
  {
    ruta: '/clases-apoyo',
    nombre: 'Clases de apoyo',
    nota: TEXTOS.clases.descripcion,
  },
  {
    ruta: '/contacto',
    nombre: 'Contacto',
    nota: TEXTOS.contacto.descripcion,
  },
  {
    ruta: '/faq',
    nombre: 'Preguntas frecuentes',
    nota: TEXTOS.faq.descripcion,
  },
  {
    ruta: '/calendario-academico',
    nombre: 'Calendario académico',
    nota: 'Cómo se organiza el ciclo 2027 de Universidad Siglo 21 a distancia: dos semestres, cuatro tramos de nueve semanas, parciales, entregas de trabajos prácticos y materias cuatrimestrales. Inscripción 2027 abierta en el CAU Villa Lugano.',
  },
  {
    ruta: '/sobre-nosotros',
    nombre: 'Sobre nosotros',
    // El texto vive en `paginas/sobre-nosotros/datos.tsx`, que es TSX: no se
    // puede importar desde acá sin arrastrar JSX al módulo puro.
    nota: 'Centro de Aprendizaje Universitario de Universidad Siglo 21 en el sur de CABA: Guaminí 4876, Villa Lugano, Comuna 8. Inscripciones y tutorías presenciales.',
  },
  {
    ruta: '/test-vocacional',
    nombre: 'Test vocacional',
    nota: TEXTOS.vocacional.descripcion,
  },
  {
    ruta: '/teclab/test-vocacional',
    nombre: 'Test vocacional de Teclab',
    nota: 'Siete preguntas de un toque y te mostramos las tecnicaturas Teclab que más van con vos. Sin registrarte, con asesoramiento por WhatsApp.',
  },
  {
    ruta: '/novedades/1',
    nombre: 'Novedades',
    nota: TEXTOS.novedades.descripcion,
  },
];

// ── Utilidades de texto ─────────────────────────────────────────────────────

/** Los corchetes romperían el enlace: se cambian por nada. */
function textoDeEnlace(valor: string): string {
  return valor.replace(/\s+/g, ' ').trim().replace(/[[\]]/g, '');
}

function sinHtml(valor: string): string {
  return valor.replace(/<[^>]*>/g, '');
}

function desentidades(valor: string): string {
  return valor
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Recorta en un límite de oración. Una nota cortada a la mitad se lee mal
 * para un agente; lo que no entra, no entra.
 */
function recortarEnOracion(texto: string, maximo: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length <= maximo) return limpio;
  let salida = '';
  for (const oracion of limpio.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¿])/)) {
    if (!salida) {
      if (oracion.length > maximo) return `${oracion.slice(0, maximo - 1).trimEnd()}…`;
      salida = oracion;
      continue;
    }
    if (`${salida} ${oracion}`.length > maximo) break;
    salida = `${salida} ${oracion}`;
  }
  return salida;
}

/** La cola "Docente: X. Escuela Y — Convenio ..." no describe la carrera. */
function sinColaDeDocente(texto: string): string {
  const corte = texto.search(/\s(?:Docente:|Escuela\s+de\b|Convenio\s+Academia)/);
  return corte > 0 ? texto.slice(0, corte) : texto;
}

const MAXIMO_NOTA = 400;

/**
 * La fecha como la muestra el sitio: «20 de septiembre de 2026». Se arma a
 * mano y no con `toLocaleDateString` para que el texto sea el mismo en el
 * Worker, en Node y en la prueba, sin depender de los datos de idioma de cada
 * entorno.
 */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fechaLarga(fecha: string | null): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha ?? '');
  if (!partes) return '';
  const [, anio, mes, dia] = partes;
  return `${Number(dia)} de ${MESES[Number(mes) - 1]} de ${anio}`;
}

function conPuntoFinal(texto: string): string {
  return /[.!?]$/.test(texto) ? texto : `${texto}.`;
}

// ── Notas ───────────────────────────────────────────────────────────────────

/**
 * La nota de cada carrera: modalidad y duración primero (son los dos datos
 * con los que se elige), después el título si difiere del nombre del enlace
 * y por último la descripción de la base.
 */
function notaDeCarrera(carrera: CarreraLlms, nombre: string): string {
  const partes: string[] = [];
  const datos = [carrera.modalidad, carrera.duracion].filter(Boolean).join(', ');
  if (datos) partes.push(`${datos}.`);
  // El título de la base a veces ya viene con punto: se lo saca para no
  // escribir dos.
  const titulo = carrera.titulo?.trim().replace(/\.$/, '');
  if (titulo && titulo !== nombre) partes.push(`Título: ${titulo}.`);
  const descripcion = carrera.descripcion ? sinColaDeDocente(carrera.descripcion) : '';
  const resumen = recortarEnOracion(sinHtml(descripcion), MAXIMO_NOTA);
  if (resumen) partes.push(resumen);
  if (carrera.proximamente) partes.push('Inscripción todavía no abierta.');
  return partes.join(' ');
}

/**
 * La nota de una clase de apoyo. `materias.descripcion` es un arreglo JSON de
 * párrafos con etiquetas `<strong>`: se toma el primero y se lo limpia.
 */
function notaDeMateria(materia: MateriaLlms): string {
  const crudo = materia.descripcion ?? '';
  let primerParrafo = '';
  try {
    const lista = JSON.parse(crudo) as unknown;
    if (Array.isArray(lista)) primerParrafo = typeof lista[0] === 'string' ? lista[0] : '';
    else if (typeof lista === 'string') primerParrafo = lista;
  } catch {
    // Si algún día la columna deja de ser JSON, se usa el texto tal cual.
    primerParrafo = crudo;
  }
  const texto = desentidades(sinHtml(primerParrafo)).replace(/\s+/g, ' ').trim();
  return recortarEnOracion(texto, MAXIMO_NOTA);
}

/** La nota de un artículo: el extracto y la fecha en que se publicó. */
function notaDeArticulo(articulo: ArticuloLlms): string {
  const partes: string[] = [];
  const crudo = articulo.extracto ? sinHtml(articulo.extracto).trim() : '';
  const extracto = crudo ? recortarEnOracion(desentidades(crudo), 300) : '';
  if (extracto) partes.push(conPuntoFinal(extracto));
  const fecha = fechaLarga(articulo.fecha);
  if (fecha) partes.push(`(${fecha})`);
  return partes.join(' ');
}

// ── Construcción ────────────────────────────────────────────────────────────

export function construirLlmsTxt(datos: DatosLlmsTxt): string {
  const grupos = new Map<string, CarreraLlms[]>();
  for (const carrera of datos.carreras) {
    if (!esCarreraVisible(carrera)) continue;
    const id = getCategoryForCarrera(carrera);
    const lista = grupos.get(id) ?? [];
    lista.push(carrera);
    grupos.set(id, lista);
  }

  const secciones = SECCIONES.filter(seccion => grupos.has(seccion.id));
  for (const id of grupos.keys()) {
    if (secciones.some(seccion => seccion.id === id)) continue;
    const etiqueta = CATEGORIES.find(categoria => categoria.id === id)?.label ?? id;
    secciones.push({ id, titulo: etiqueta });
  }

  const bloques: string[] = [`# ${TITULO}`, RESUMEN, CONTEXTO];

  for (const seccion of secciones) {
    const delGrupo = grupos.get(seccion.id) ?? [];
    const lineas = delGrupo.map(carrera => {
      const { nombre, url, nota } = lineaDeCarrera(carrera);
      return `- [${nombre}](${url}): ${nota}`;
    });
    bloques.push(`## ${seccion.titulo}`, lineas.join('\n'));
  }

  if (datos.materias.length) {
    const lineas = datos.materias.map(materia => {
      const { nombre, url, nota } = lineaDeMateria(materia);
      return `- [${nombre}](${url}): ${nota}`;
    });
    bloques.push('## Clases de apoyo', lineas.join('\n'));
  }

  if (datos.articulos.length) {
    const lineas = datos.articulos.map(articulo => {
      const { nombre, url, nota } = lineaDeArticulo(articulo);
      return `- [${nombre}](${url}): ${nota}`;
    });
    bloques.push('## Artículos', lineas.join('\n'));
  }

  bloques.push('## Páginas del sitio', PAGINAS
    .map(pagina => `- [${pagina.nombre}](${pagina.ruta === '/' ? BASE : BASE + pagina.ruta}): ${pagina.nota}`)
    .join('\n'));

  return `${bloques.join('\n\n')}\n`;
}

/** La línea de una carrera: nombre, URL y nota. La usan el llms.txt y las
 * versiones markdown de las páginas de catálogo.
 */
export function lineaDeCarrera(carrera: CarreraLlms): { nombre: string; url: string; nota: string } {
  const nombre = carreraFullName(carrera);
  return {
    nombre: textoDeEnlace(nombre),
    url: `${BASE}/carreras/${carreraToSlug(carrera)}`,
    nota: notaDeCarrera(carrera, nombre),
  };
}

/** La línea de una clase de apoyo, igual que la de una carrera. */
export function lineaDeMateria(materia: MateriaLlms): { nombre: string; url: string; nota: string } {
  return {
    nombre: textoDeEnlace(materia.label),
    url: `${BASE}/clases-apoyo/${materia.slug}`,
    nota: notaDeMateria(materia),
  };
}

/** La línea de un artículo de novedades: la usan el llms.txt y el listado. */
export function lineaDeArticulo(articulo: ArticuloLlms): { nombre: string; url: string; nota: string } {
  return {
    // El título viene de la base: se le sacan las etiquetas antes de
    // escribirlo, como hace el sitio con el contenido.
    nombre: textoDeEnlace(sinHtml(articulo.titulo)),
    url: `${BASE}/novedades/articulo/${articulo.slug}`,
    nota: notaDeArticulo(articulo),
  };
}
