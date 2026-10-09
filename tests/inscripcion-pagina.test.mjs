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

const elemento = (type, props) => ({ type, props });
const jsx = { jsx: elemento, jsxs: elemento, Fragment: 'fragment' };

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

function cargarPagina(archivo = 'app/carreras/[slug]/inscripcion/page.tsx') {
  return cargarTypescript(archivo, {
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

test('el formulario encabeza la página dedicada sin contenido auxiliar extenso', () => {
  const pagina = readFileSync('app/carreras/[slug]/inscripcion/page.tsx', 'utf8');
  assert.match(pagina, /<h1 className="sr-only">/);
  assert.match(pagina, /<FormularioLead/);
  assert.doesNotMatch(pagina, /GuiaInscripcion|PreguntasInscripcion|SiteFooter/);
  assert.match(pagina, /'@type': 'BreadcrumbList'/);
});

test('ambas páginas explican los próximos pasos sin competir con el formulario', async () => {
  const recorrer = nodo => {
    if (!nodo || typeof nodo !== 'object') return [];
    if (Array.isArray(nodo)) return nodo.flatMap(recorrer);
    return [nodo, ...recorrer(nodo.props?.children)];
  };
  const texto = nodo => {
    if (typeof nodo === 'string') return nodo;
    if (Array.isArray(nodo)) return nodo.map(texto).join(' ');
    return nodo && typeof nodo === 'object' ? texto(nodo.props?.children) : '';
  };
  for (const archivo of ['app/carreras/[slug]/inscripcion/page.tsx', 'app/teclab/inscripcion/page.tsx']) {
    const arbol = await cargarPagina(archivo).default(params(slugTeclab[1]));
    const nodos = recorrer(arbol);
    const bloque = nodos.find(nodo => nodo.props?.className === 'inscripcion-proximos');
    assert.ok(bloque, archivo);
    assert.equal(texto(recorrer(bloque).find(nodo => nodo.type === 'h2')), 'Próximos pasos');
    assert.doesNotMatch(texto(bloque), /Al enviar|solicitás la gestión|ningún cobro/);
    assert.doesNotMatch(texto(bloque), /continuar con Inscribirme/);
    assert.match(texto(bloque), /portal del alumno/);
    const tarjeta = recorrer(bloque).find(nodo => nodo.props?.className === 'inscripcion-proximos-tarjeta');
    assert.ok(tarjeta, 'el contenido queda en una tarjeta centrada');
    const contenido = recorrer(tarjeta).find(nodo => nodo.props?.className === 'inscripcion-proximos-contenido');
    assert.deepEqual(recorrer(contenido).filter(nodo => nodo.type === 'p').map(texto), [
      'Teclab te envía por mail el acceso al portal del alumno una vez gestionada la inscripción. Desde allí elegís el medio de pago y abonás.',
    ]);

    assert.doesNotMatch(texto(bloque), /[¿?]|Lugano|CAU|sede|\d|horas|minutos/i);
    assert.equal(recorrer(bloque).filter(nodo => ['a', 'button'].includes(nodo.type)).length, 0);
    assert.equal(nodos.filter(nodo => ['nav', 'footer'].includes(nodo.type)).length, 0);
    const formulario = nodos.find(nodo => nodo.props?.modo === 'preinscripcion');
    assert.ok(formulario?.props.alinearAlLlegar);
    assert.equal(formulario.props.casa, 'teclab');
    assert.ok(nodos.indexOf(formulario) < nodos.indexOf(bloque));
  }
});

test('el bloque de próximos pasos tiene una única columna de lectura centrada', () => {
  const css = readFileSync('app/carreras/[slug]/inscripcion/inscripcion.css', 'utf8');
  const bloque = css.slice(css.indexOf('.inscripcion-proximos-contenido'));
  assert.match(bloque, /max-width: 48rem/);
  assert.match(bloque, /margin-inline: auto/);
  assert.match(bloque, /text-align: center/);
  assert.doesNotMatch(bloque, /repeat\(2|p \+ p|border-left/);
});

test('la página dedicada envía con «Preinscribirme» y sin nota debajo del botón', () => {
  // Que no se cobra lo dicen los próximos pasos, debajo del formulario.
  const formulario = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
  assert.doesNotMatch(formulario, /Solicitar inscripción/);
  assert.match(formulario, /solicitudDirecta \? 'Preinscribirme' : flujoAuto \? 'Inscribirme'/);
  assert.match(formulario, /\{flujoAuto && !solicitudDirecta && <AvisoSinPago \/>\}/);
  const aviso = readFileSync('components/formularios/autoinscripcion-teclab.tsx', 'utf8');
  assert.doesNotMatch(aviso, /solicitás la gestión/);
});
