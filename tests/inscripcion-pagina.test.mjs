import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as taxonomia from '../components/index/types.ts';
import * as teclab from '../components/index/teclab.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// Pagina propia de inscripcion de las carreras de Teclab:
// /carreras/<slug>/inscripcion. Se prueba con los modulos reales y la base
// simulada, sin servidor ni render.

const BASE = 'https://www.siglo21sur.com';

const vacia = {
  duracion: null, titulo: null, modalidad: null, prefix: null, nombre_corto: null,
  orden: null, activa: true, destacada: false, nueva: false, proximamente: false,
  descripcion: null, enfoque: null, plan_estudios: null, seccion_modalidad: null,
  seccion_duracion: null, slides: null, updated_at: '2026-09-30T12:00:00Z',
};

const filas = [
  {
    ...vacia, id: 1, nombre: 'Tecnicatura Superior en Programación', prefix: 'Tecnicatura Superior en',
    nombre_corto: 'Programación', nivel: 'Teclab - Tecnología', duracion: '2 años',
    titulo: 'Técnico Superior en Programación', modalidad: '100% Online',
    enfoque: 'Modalidad: 100% Online\r\nDuración: 2 años\r\nTítulo: Técnico Superior en Programación\r\nCertificado intermedio: Auxiliar en Programación\r\nCocreación: Avenga',
  },
  {
    ...vacia, id: 2, nombre: 'Tecnicatura Superior en Planificación y Organización de Eventos',
    prefix: 'Tecnicatura Superior en', nombre_corto: 'Planificación y Organización de Eventos',
    nivel: 'Teclab - Gestión', duracion: '2 años',
    titulo: 'Técnico Superior en Planificación y Organización de Eventos', modalidad: '100% Online',
    enfoque: 'Modalidad: 100% Online\r\nDuración: 2 años\r\nTítulo: Técnico Superior en Planificación y Organización de Eventos\r\nCertificado intermedio: Asistente de Organización de Eventos',
  },
  {
    ...vacia, id: 3, nombre: 'Actualización Profesional en Inteligencia Artificial', prefix: 'Curso de',
    nombre_corto: 'Actualización Profesional en Inteligencia Artificial', nivel: 'Teclab - Curso',
    duracion: '4 semanas', titulo: 'Certificado oficial de Teclab', modalidad: 'Online en vivo',
    enfoque: 'Modalidad: Online en vivo\r\nDuración: 4 semanas\r\nTítulo: Certificado oficial de Teclab',
  },
  { ...vacia, id: 4, nombre: 'Abogacía', nivel: 'Grado', duracion: '5 años', enfoque: 'Derecho' },
  { ...vacia, id: 5, nombre: 'Diplomatura en Oratoria', nivel: 'Identidad Argentina' },
  { ...vacia, id: 6, nombre: 'Maestría en Finanzas', nivel: 'Posgrado' },
  {
    ...vacia, id: 7, nombre: 'Tecnicatura Superior en Seguros', prefix: 'Tecnicatura Superior en',
    nombre_corto: 'Seguros', nivel: 'Teclab - Gestión', proximamente: true,
  },
];

const slugTeclab = [
  'tecnicatura-superior-en-programacion',
  'tecnicatura-superior-en-planificacion-y-organizacion-de-eventos',
  'curso-de-actualizacion-profesional-en-inteligencia-artificial',
];

const jsx = { jsx: () => null, jsxs: () => null, Fragment: 'fragment' };

function cargarInscripcion() {
  return cargarTypescript('components/carreras/inscripcion-carrera.tsx', {
    '@/components/index/types': taxonomia,
    '@/components/index/teclab': teclab,
    'react/jsx-runtime': jsx,
  }, () => ({}));
}

function consultaDe(datos) {
  const consulta = new Proxy({}, { get: (_, metodo) => {
    if (metodo === 'then') return resolver => resolver({ data: datos, count: 0, error: null });
    if (metodo === 'throwOnError') return () => Promise.resolve({ data: datos, count: 0 });
    return () => consulta;
  } });
  return consulta;
}

const supabase = { from: tabla => consultaDe(tabla === 'carreras' ? filas : []) };

function cargarSitemap() {
  const careerContent = cargarTypescript('components/carreras/career-content.ts', {
    '@/components/index/types': taxonomia,
    '@/components/index/teclab': teclab,
  });
  return cargarTypescript('app/sitemap.ts', {
    '@/lib/supabase': { supabase },
    '@/components/index/types': taxonomia,
    '@/components/index/teclab': teclab,
    '@/components/carreras/career-content': careerContent,
    '@/components/carreras/inscripcion-carrera': cargarInscripcion(),
  }, () => ({}));
}

class Redireccion extends Error {
  constructor(destino) { super(`redirect ${destino}`); this.destino = destino; }
}

function cargarPagina() {
  return cargarTypescript('app/carreras/[slug]/inscripcion/page.tsx', {
    '@/lib/supabase': { supabase },
    '@/lib/json-ld': { jsonLdScript: JSON.stringify },
    '@/components/index/types': taxonomia,
    '@/components/index/teclab': teclab,
    '@/components/carreras/inscripcion-carrera': cargarInscripcion(),
    'next/navigation': {
      notFound: () => { throw new Error('404'); },
      permanentRedirect: destino => { throw new Redireccion(destino); },
    },
    'next/font/google': { Poppins: () => ({ variable: '' }) },
    'react/jsx-runtime': jsx,
  }, () => ({}));
}

const params = slug => ({ params: Promise.resolve({ slug }) });

test('el sitemap publica la inscripcion solo de las carreras de Teclab con inscripcion abierta', async () => {
  const entradas = await cargarSitemap().default();
  const inscripciones = entradas.map(e => e.url).filter(url => url.startsWith(`${BASE}/carreras/`) && url.endsWith('/inscripcion'));
  assert.deepEqual(inscripciones.sort(), slugTeclab.map(s => `${BASE}/carreras/${s}/inscripcion`).sort());
  // La inscripción genérica de Teclab, con el selector de todas sus carreras.
  assert.ok(entradas.some(e => e.url === `${BASE}/teclab/inscripcion`));
  // La ficha sigue publicada aparte: la inscripcion no la reemplaza.
  assert.ok(entradas.some(e => e.url === `${BASE}/carreras/${slugTeclab[0]}`));
});

test('la ruta de inscripcion parte del slug canonico de la ficha', () => {
  const { rutaInscripcion, tieneInscripcionPropia } = cargarInscripcion();
  assert.equal(rutaInscripcion(filas[0]), `/carreras/${slugTeclab[0]}/inscripcion`);
  assert.deepEqual(filas.filter(tieneInscripcionPropia).map(f => f.id), [1, 2, 3]);
});

test('solo se pre-generan las paginas de Teclab', async () => {
  const slugs = (await cargarPagina().generateStaticParams()).map(p => p.slug);
  assert.deepEqual(slugs.sort(), [...slugTeclab].sort());
});

test('la metadata es propia, entra en el resultado de Google y se declara canonica', async () => {
  const pagina = cargarPagina();
  const vistas = new Set();
  for (const slug of slugTeclab) {
    const meta = await pagina.generateMetadata(params(slug));
    const titulo = meta.title.absolute;
    assert.match(titulo, /^Inscripción a/);
    assert.match(titulo, /Teclab/);
    assert.ok(titulo.length <= 66, `${titulo} (${titulo.length})`);
    assert.ok(meta.description.length <= 165, meta.description);
    assert.equal(meta.alternates.canonical, `${BASE}/carreras/${slug}/inscripcion`);
    assert.equal(meta.openGraph.url, `${BASE}/carreras/${slug}/inscripcion`);
    assert.equal(meta.robots, undefined);
    vistas.add(meta.description);
  }
  assert.equal(vistas.size, slugTeclab.length);

  const programacion = await pagina.generateMetadata(params(slugTeclab[0]));
  assert.ok(programacion.title.absolute.length <= 61);
  assert.match(programacion.title.absolute, /Tecnicatura en Programación/);
  assert.equal(programacion.openGraph.images[0], '/imagenes/og/default-teclab-tecnologia.jpg');
  const curso = await pagina.generateMetadata(params(slugTeclab[2]));
  assert.ok(curso.title.absolute.length <= 61, curso.title.absolute);
});

test('otra casa da 404 y un slug viejo redirige a la inscripcion canonica', async () => {
  const pagina = cargarPagina();
  await assert.rejects(pagina.default(params('abogacia')), /404/);
  await assert.rejects(pagina.default(params('tecnicatura-superior-en-seguros')), /404/);
  await assert.rejects(pagina.default(params('Tecnicatura_Superior_en_Programacion')), err => (
    err instanceof Redireccion && err.destino === `/carreras/${slugTeclab[0]}/inscripcion`
  ));
});

test('las preguntas salen de los datos de la carrera y le hablan a quien se inscribe', () => {
  const { preguntasInscripcion, PASOS_INSCRIPCION } = cargarInscripcion();
  const tecnicatura = preguntasInscripcion(filas[0]);
  assert.equal(tecnicatura.length, 2);
  const texto = JSON.stringify(tecnicatura);
  assert.match(texto, /100% online/);
  assert.match(texto, /2 años/);
  assert.match(texto, /Técnico Superior en Programación/);
  assert.match(texto, /Auxiliar en Programación/);
  assert.match(JSON.stringify(preguntasInscripcion(filas[2])), /online en vivo/);
  // Sin datos no se afirma nada.
  assert.equal(preguntasInscripcion({ ...filas[0], duracion: '', titulo: '', enfoque: 'Modalidad: Presencial' }).length, 0);

  assert.equal(PASOS_INSCRIPCION.length, 3);
  const todo = JSON.stringify([PASOS_INSCRIPCION, tecnicatura]);
  assert.match(todo, /DNI, sin puntos/);
  assert.doesNotMatch(todo, /\$|\b20\d\d\b|\b[12][AB]\b|PENDIENTE|inter[eé]s/i);
});

test('lo que se pide tener a mano existe en la preinscripcion de Teclab', () => {
  const casas = readFileSync('components/formularios/casas.ts', 'utf8');
  const teclabCampos = casas.match(/teclab: \{[\s\S]*?preinscripcion: \[([\s\S]*?)\]/)[1];
  for (const campo of ['dni', 'domicilio', 'colegio', 'colegioLocalidad', 'email', 'telefono']) {
    assert.match(teclabCampos, new RegExp(`'${campo}'`), campo);
  }
});

test('la ficha de Teclab enlaza a su pagina de inscripcion', () => {
  const ficha = readFileSync('components/carreras/career-detail.tsx', 'utf8');
  assert.match(ficha, /rutaInscripcion\(carrera\)/);
  assert.match(ficha, /Cómo inscribirte/);
});

test('el formulario va arriba de todo, solo con el H1 y la fecha antes', () => {
  const pagina = readFileSync('app/carreras/[slug]/inscripcion/page.tsx', 'utf8');
  const jsxPagina = pagina.slice(pagina.indexOf('return ('));
  const h1 = jsxPagina.indexOf('<h1>');
  const formulario = jsxPagina.indexOf('<FormularioLead');
  assert.ok(h1 > 0 && formulario > h1, 'el H1 va antes del formulario');
  // Entre el H1 y el formulario no se cuela nada que lo empuje hacia abajo.
  assert.doesNotMatch(jsxPagina.slice(0, formulario), /career-hero|<Image|GuiaInscripcion|href="#preinscripcion"/);
  assert.ok(jsxPagina.indexOf('<GuiaInscripcion') > formulario, 'la guia va despues del formulario');
  // Las migas visibles se fueron a una linea, pero el dato estructurado sigue.
  assert.match(pagina, /'@type': 'BreadcrumbList'/);
});
