import test from 'node:test';
import assert from 'node:assert/strict';
import { construirLlmsTxt } from '../src/entrega/llms-txt.ts';
import { carreraFullName, carreraToSlug } from '../../components/index/types.ts';

// `/llms.txt` según la convención llmstxt.org: un H1, un bloque `>` de
// resumen y secciones `##` con listas de enlaces markdown. Estas pruebas son
// del módulo puro: no tocan D1 ni red.

const CARRERAS = [
  {
    nombre: 'Licenciatura en Administración', prefix: 'Licenciatura', nivel: 'Grado',
    descripcion: 'Formación en gestión de organizaciones.', duracion: '4 años',
    titulo: 'Licenciatura en Administración', modalidad: 'A distancia', proximamente: false,
  },
  {
    nombre: 'Contador Público', prefix: null, nivel: 'Grado',
    descripcion: 'Formación contable y tributaria.', duracion: '4 años y medio',
    titulo: 'Contador/a Público/a', modalidad: 'Distancia', proximamente: false,
  },
  {
    nombre: 'Tecnicatura en Administración y Gestión', prefix: 'Tecnicatura', nivel: 'Pregrado',
    descripcion: 'Formación técnica en gestión.', duracion: '2 años',
    titulo: 'Técnico/a en Administración', modalidad: 'A distancia', proximamente: false,
  },
  {
    nombre: 'Negocios Agroecológicos', prefix: 'Pregrado / Tecnicatura en', nivel: 'Pregrado',
    descripcion: 'Formación integral en la gestión de negocios.', duracion: '2.5 años',
    titulo: 'Técnico Universitario en Negocios Agroecológicos', modalidad: 'Distancia',
    proximamente: true,
  },
  {
    nombre: 'Tecnicatura Superior en Programación', prefix: 'Tecnicatura Superior en',
    nivel: 'Teclab - Tecnología',
    descripcion: 'Estudiá programación a distancia. Empresas de desarrollo de software.',
    duracion: '2 años', titulo: 'Técnico Superior en Programación', modalidad: '100% Online',
    proximamente: false,
  },
  {
    nombre: 'Diplomatura en Oratoria', prefix: 'Diplomatura', nivel: 'Identidad Argentina',
    descripcion: 'Mejorar la confianza. Desarrollar habilidades de planificación de discursos. '
      + 'Docente: Lic. Marisol Poletti. Escuela de Liderazgo — Convenio Academia Identidad Argentina.',
    duracion: '2 meses', titulo: 'Certificación Nacional e Internacional', modalidad: 'A distancia',
    proximamente: false,
  },
  {
    // Fuera de la oferta: la taxonomía compartida la esconde y no se publica.
    nombre: 'Maestría en Gestión Educativa', prefix: 'Maestría', nivel: 'Posgrado',
    descripcion: 'No se publica.', duracion: '2 años', titulo: 'Magíster', modalidad: 'A distancia',
    proximamente: false,
  },
];

const MATERIAS = [{
  slug: 'matematica',
  label: 'Matemática',
  descripcion: JSON.stringify(['Clases <strong>presenciales</strong>, individuales o en grupo reducido.']),
}];

const markdown = construirLlmsTxt({ carreras: CARRERAS, materias: MATERIAS });

test('el archivo tiene la forma de llmstxt.org: H1, resumen y secciones con listas', () => {
  const lineas = markdown.split('\n');
  assert.equal(lineas[0], '# Universidad Siglo 21 — CAU Villa Lugano');
  assert.equal(lineas[1], '');
  assert.match(lineas[2], /^> /);
  assert.equal(lineas[3], '');
  assert.match(lineas[4], /^El contenido está en español/);

  // Cada sección es un `##` seguido de una lista de enlaces markdown.
  let enSeccion = false;
  for (const linea of lineas) {
    if (linea === '') continue;
    if (linea.startsWith('# ')) continue;
    if (linea.startsWith('> ')) continue;
    if (linea.startsWith('## ')) { enSeccion = true; continue; }
    if (!enSeccion) {
      // El párrafo de contexto va entre el resumen y la primera sección.
      assert.match(linea, /^El contenido/);
      continue;
    }
    assert.match(linea, /^- \[.+\]\(https:\/\/www\.siglo21sur\.com(\/[^)]*)?\)(: .+)?$/, linea);
  }
  assert.ok(markdown.endsWith('\n'));
});

test('cada carrera visible sale con la URL que usa el sitio', () => {
  for (const carrera of CARRERAS.filter(c => c.nivel !== 'Posgrado')) {
    const nombre = carreraFullName(carrera);
    const esperado = `- [${nombre}](https://www.siglo21sur.com/carreras/${carreraToSlug(carrera)}): `;
    assert.ok(markdown.includes(esperado), `${nombre} no sale con su URL`);
  }
});

test('las carreras fuera de la oferta no se publican', () => {
  assert.ok(!markdown.includes('Maestría en Gestión Educativa'));
  assert.ok(!markdown.includes('maestria-en-gestion-educativa'));
});

test('las secciones siguen el orden de la taxonomía compartida', () => {
  const titulos = [...markdown.matchAll(/^## (.+)$/gm)].map(m => m[1]);
  assert.deepEqual(titulos, [
    'Licenciaturas de Universidad Siglo 21',
    'Tecnicaturas de Universidad Siglo 21',
    'Diplomaturas y cursos de Identidad Argentina',
    'Tecnicaturas y cursos de Teclab (Tecnología)',
    'Clases de apoyo',
    'Páginas del sitio',
  ]);
});

test('la nota lleva modalidad, duración y título cuando difiere del enlace', () => {
  assert.ok(markdown.includes(
    '- [Contador Público](https://www.siglo21sur.com/carreras/contador-publico): '
    + 'Distancia, 4 años y medio. Título: Contador/a Público/a. Formación contable y tributaria.'));
  // Cuando el título es el mismo que el nombre del enlace, no se repite.
  assert.ok(markdown.includes(
    '- [Licenciatura en Administración](https://www.siglo21sur.com/carreras/licenciatura-en-administracion): '
    + 'A distancia, 4 años. Formación en gestión de organizaciones.'));
});

test('la cola con el docente no describe la carrera y no se publica', () => {
  const linea = markdown.split('\n').find(l => l.includes('diplomatura-en-oratoria'));
  assert.ok(linea);
  assert.ok(!linea.includes('Docente:'));
  assert.ok(!linea.includes('Escuela de Liderazgo'));
  assert.ok(linea.includes('Mejorar la confianza.'));
});

test('una carrera sin inscripción abierta lo dice', () => {
  const linea = markdown.split('\n').find(l => l.includes('negocios-agroecologicos'));
  assert.ok(linea);
  assert.ok(linea.includes('Inscripción todavía no abierta.'));
});

test('las clases de apoyo salen sin las etiquetas de HTML', () => {
  const linea = markdown.split('\n').find(l => l.includes('/clases-apoyo/matematica'));
  assert.ok(linea);
  assert.ok(!linea.includes('<strong>'));
  assert.ok(linea.includes('Clases presenciales, individuales o en grupo reducido.'));
});

test('no se publica ningún arancel: el archivo no tiene cifras de precio', () => {
  assert.doesNotMatch(markdown, /\$\s?\d/);
  assert.doesNotMatch(markdown, /\d+\s?pesos/i);
});

test('los enlaces son absolutos y no se repiten', () => {
  const enlaces = [...markdown.matchAll(/^- \[.+\]\((\S+?)\)(:|$)/gm)].map(m => m[1]);
  assert.ok(enlaces.length > 0);
  for (const enlace of enlaces) assert.match(enlace, /^https:\/\/www\.siglo21sur\.com(\/|$)/);
  assert.equal(new Set(enlaces).size, enlaces.length);
});

test('una descripción larga se recorta en un límite de oración', () => {
  const larga = 'Primera oración de la carrera. Segunda oración de la carrera. '
    + 'Tercera oración de la carrera. Cuarta oración de la carrera.';
  const salida = construirLlmsTxt({
    carreras: [{
      nombre: 'Carrera Larga', prefix: 'Licenciatura', nivel: 'Grado',
      descripcion: larga.repeat(12), duracion: '4 años', titulo: 'Licenciado/a',
      modalidad: 'A distancia', proximamente: false,
    }],
    materias: [],
  });
  const nota = salida.split('\n').find(l => l.includes('/carreras/licenciatura-en-carrera-larga'));
  assert.ok(nota);
  // Corta en una oración entera: no queda a mitad de frase.
  assert.ok(nota.endsWith('.'), nota);
  assert.ok(nota.length < 600, `la nota quedó demasiado larga: ${nota.length}`);
});
