import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as tipos from '../components/index/types.ts';
import * as teclab from '../components/index/teclab.ts';
import * as adaptadores from '../lib/datos/carrera-detalle.ts';
import { carreraHubspotDe } from '../components/formularios/casas.ts';
import { perfilDe, recomendar, PREGUNTAS } from '../components/test-vocacional-teclab/puntaje.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';
import { buscarRedireccion } from '../cloudflare/src/entrega/redirects.ts';

// Las nueve tecnicaturas nuevas de Teclab de los bloques 2 y 3 (capacitaciones
// de admisión del 16/10/2026). Entran con inscripción abierta: ficha, página de
// inscripción, catálogo y los dos tests vocacionales.

const FIXTURE = new URL('./fixtures/teclab-bloques-2-y-3.json', import.meta.url);

// nombre, nivel, área del catálogo, tipo (Gestión) o categoría (Tecnología)
const NUEVAS = [
  ['Tecnicatura Superior en Administración de Empresas', 'Teclab - Gestión', 'negocios', 'Negocios'],
  ['Tecnicatura Superior en Administración de Negocios Digitales Financieros', 'Teclab - Gestión', 'negocios', 'Negocios'],
  ['Tecnicatura Superior en Logística', 'Teclab - Gestión', 'negocios', 'Gestión'],
  ['Tecnicatura Superior en Comercio Exterior', 'Teclab - Gestión', 'negocios', 'Negocios'],
  ['Tecnicatura Superior en Administración de Riesgos Empresariales', 'Teclab - Gestión', 'negocios', 'Gestión'],
  ['Tecnicatura Superior en Diseño de Producto Digital', 'Teclab - Tecnología', 'tecnologia', 'Desarrollo'],
  ['Tecnicatura Superior en Diseño de Experiencia de Usuario (User Experience)', 'Teclab - Tecnología', 'tecnologia', 'Desarrollo'],
  ['Tecnicatura Superior en Agile Coaching', 'Teclab - Gestión', 'rrhh', 'Gestión'],
  ['Tecnicatura Superior en Recursos Humanos', 'Teclab - Gestión', 'rrhh', 'Gestión'],
].map(([nombre, nivel, area, grupo]) => ({ nombre, nivel, area, grupo }));

// Renombres posteriores al alta: el SQL del alta queda como se corrió.
const RENOMBRES = new Map([
  ['Tecnicatura Superior en Gestión de Equipos Ágiles (Agile Coaching)', 'Tecnicatura Superior en Agile Coaching'],
]);
const nombreActual = nombre => RENOMBRES.get(nombre) ?? nombre;

// ── Taxonomía ──

test('cada una cae en su área sin mezclarse con las carreras de Siglo 21', () => {
  for (const { nombre, area } of NUEVAS) assert.equal(tipos.getAreaForCarrera({ nombre }), area, nombre);
  // Las de Siglo 21 con palabras en común no cambian de área.
  assert.equal(tipos.getAreaForCarrera({ nombre: 'Gestión de Recursos Humanos' }), 'rrhh');
  assert.equal(tipos.getAreaForCarrera({ nombre: 'Administración' }), 'negocios');
  assert.equal(tipos.getAreaForCarrera({ nombre: 'Administración Pública' }), 'gobierno');
});

test('las de Gestión tienen tipo y las de Tecnología entran en un filtro', () => {
  for (const { nombre, nivel, grupo } of NUEVAS) {
    if (nivel === 'Teclab - Gestión') {
      assert.equal(teclab.getTipoTeclab({ nombre, nivel }), grupo, nombre);
      assert.ok(teclab.TIPOS_GESTION.includes(grupo), grupo);
    } else {
      assert.equal(teclab.getCategoriaTeclabTecnologia({ nombre, nivel }), grupo, nombre);
    }
  }
  // Producto Digital (id 245, dada de baja el 09/10/2026) sigue sin categoría.
  assert.equal(teclab.getCategoriaTeclabTecnologia({ nombre: 'Tecnicatura Superior en Producto Digital', nivel: 'Teclab - Tecnología' }), null);
});

test('cada una tiene portada propia y ninguna tiene ficha oficial inventada', () => {
  const portadas = new Set();
  for (const { nombre } of NUEVAS) {
    // Diseño de Producto Digital es la excepción: Teclab publicó su ficha con el
    // bloque 4 (30/10/2026), así que dejó de ser anunciada. Se verifica aparte.
    if (nombre !== 'Tecnicatura Superior en Diseño de Producto Digital') {
      assert.equal(teclab.getFichaTeclab({ nombre }), null, nombre);
    }
    const portada = teclab.getPortadaTeclab({ nombre });
    assert.match(portada ?? '', /^\/imagenes\/teclab\/carreras\/.+\.webp$/, nombre);
    assert.ok(existsSync(`public${portada}`), portada);
    portadas.add(portada);
  }
  assert.equal(portadas.size, NUEVAS.length);
});

test('las dos altas oficiales del bloque 4 tienen ficha con su foto', () => {
  const fichas = [
    ['Tecnicatura Superior en Diseño de Producto Digital', 'tecnico-superior-en-diseno-de-producto-digital'],
    ['Tecnicatura Superior en Comercio Electrónico (e-commerce)', 'tecnico-superior-en-comercio-electronico'],
  ];
  for (const [nombre, slug] of fichas) {
    const ficha = teclab.getFichaTeclab({ nombre });
    assert.ok(ficha, nombre);
    assert.equal(ficha.url, `https://teclab.edu.ar/carrera/${slug}/`, nombre);
    for (const imagen of [ficha.imagen, ficha.imagenCierre]) {
      assert.ok(existsSync(`public${imagen}`), `${nombre}: ${imagen}`);
    }
  }
});

test('ninguna promete articulación con Siglo 21: la fuente no la menciona', () => {
  for (const { nombre, nivel } of NUEVAS) {
    assert.equal(teclab.articulaConSiglo21({ nombre, nivel, proximamente: false }), false, nombre);
  }
  assert.equal(teclab.articulaConSiglo21({ nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' }), true);
  assert.equal(teclab.articulaConSiglo21({ nombre: 'Tecnicatura Superior en Relaciones Laborales', nivel: 'Teclab - Gestión' }), true);
});

// ── Formularios ──

test('ninguna se manda a HubSpot con la opción de otra carrera', () => {
  for (const { nombre } of NUEVAS) assert.equal(carreraHubspotDe(nombre), null, nombre);
});

// ── Tests vocacionales ──

test('las nueve tienen perfil propio en el test vocacional de Teclab', () => {
  const perfiles = NUEVAS.map(({ nombre }) => perfilDe({ nombre }));
  perfiles.forEach((perfil, i) => assert.ok(perfil, `${NUEVAS[i].nombre} sin perfil`));
  assert.equal(new Set(perfiles).size, NUEVAS.length);
  // No le roban el perfil a las que ya estaban.
  assert.equal(perfilDe({ nombre: 'Tecnicatura Superior en Experiencia del Cliente', nombre_corto: 'Customer Experience' }), 'experiencia-cliente');
  assert.equal(perfilDe({ nombre: 'Tecnicatura Superior en Seguros' }), 'seguros');
  assert.equal(perfilDe({ nombre: 'Tecnicatura Superior en Relaciones Laborales' }), 'relaciones-laborales');
});

test('Comercio Electrónico tiene perfil propio y sale primero con respuestas de e-commerce', () => {
  const ecommerce = { nombre: 'Tecnicatura Superior en Comercio Electrónico (e-commerce)' };
  assert.equal(perfilDe(ecommerce), 'comercio-electronico');
  // Ni se queda con el perfil de Comercio Exterior ni le deja el suyo.
  assert.equal(perfilDe({ nombre: 'Tecnicatura Superior en Comercio Exterior' }), 'comercio-exterior');

  // Respuestas coherentes con la carrera: vender online, campañas, logística y
  // números. Tiene que quedar arriba de Marketing Digital e Inbound.
  const opcion = (eje, texto) => {
    const pregunta = PREGUNTAS.find(p => p.eje === eje);
    return pregunta.opciones.findIndex(o => o.texto === texto);
  };
  const respuestas = [
    opcion('Mundo', 'Marcas, ventas y clientes'),
    opcion('Tarea', 'Crear contenido y campañas'),
    opcion('Lugar', 'Desde casa, frente a la compu'),
    opcion('Logro', 'Que una marca venda más'),
    opcion('Material', 'Números y documentos'),
    opcion('Tema', 'Finanzas y seguros'),
    opcion('Desafío', 'Que un pedido llegue a tiempo'),
  ];
  const catalogo = [
    ecommerce,
    { nombre: 'Tecnicatura Superior en Marketing Digital' },
    { nombre: 'Tecnicatura Superior en Inbound Marketing' },
    { nombre: 'Tecnicatura Superior en Logística' },
  ].map((carrera, orden) => ({ id: orden + 1, orden, ...carrera }));
  assert.equal(recomendar(catalogo, respuestas)[0].carrera.nombre, ecommerce.nombre);
});

test('el test vocacional general tiene una ruta específica para cada una', () => {
  const fuente = readFileSync('components/test-vocacional/test-vocacional.tsx', 'utf8');
  const normalizar = texto => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es');
  const terminos = [...fuente.matchAll(/terminos: \[([^\]]*)\]/g)]
    .flatMap(([, lista]) => [...lista.matchAll(/'([^']+)'/g)].map(([, termino]) => normalizar(termino)));
  // Palabras que no dicen nada de la carrera: con sólo estas no hay ruta propia.
  const genericas = new Set(['administracion', 'digital', 'diseno', 'comercio', 'negocios']);
  for (const { nombre } of NUEVAS) {
    const propios = terminos.filter(termino => normalizar(nombre).includes(termino) && !genericas.has(termino));
    assert.ok(propios.length > 0, `${nombre} sin término propio`);
  }
});

// ── Datos de las fichas para las pruebas ──

const filasDeFixture = () => JSON.parse(readFileSync(FIXTURE, 'utf8'));

test('las nueve fichas históricas conservan sus datos de alta', () => {
  const filas = filasDeFixture();
  assert.deepEqual(filas.map(f => nombreActual(f.nombre)), NUEVAS.map(n => n.nombre));
  assert.deepEqual(filas.map(f => f.orden), [1109, 1110, 1111, 1112, 1113, 1114, 1115, 1116, 1117]);
  for (const [i, fila] of filas.entries()) {
    assert.equal(fila.nivel, NUEVAS[i].nivel, fila.nombre);
    assert.deepEqual([fila.activa, fila.destacada, fila.nueva, fila.proximamente], [true, false, true, false], fila.nombre);
    assert.equal(fila.duracion, '2 años');
    assert.equal(fila.titulo, fila.nombre.replace('Tecnicatura Superior en', 'Técnico Superior en'));
    assert.equal(tipos.carreraFullName(fila), fila.nombre);
    assert.ok(tipos.esCarreraVisible(fila));
  }
});

test('cada fila trae descripción, enfoque, plan, competencias y FAQ con el formato de Teclab', () => {
  for (const fila of filasDeFixture()) {
    const { perfil, salida } = teclab.partirDescripcionTeclab(fila.descripcion);
    assert.match(perfil, /^Estudiá .+ a distancia/, fila.nombre);
    assert.ok(salida.length > 20, `${fila.nombre}: falta la salida laboral al final`);
    assert.doesNotMatch(salida, /^Estudiá/);

    const enfoque = teclab.parseEnfoqueTeclab(fila.enfoque);
    assert.equal(enfoque.titulo, fila.titulo);
    assert.equal(enfoque.duracion, '2 años');
    assert.match(enfoque.certificado, /^Asistente en /, fila.nombre);

    const plan = teclab.parsePlanTeclab(fila.plan_estudios);
    assert.deepEqual(plan.map(p => `${p.año} | ${p.label}`), ['Primer Año | Bimestres 1 a 4', 'Segundo Año | Bimestres 5 a 8'], fila.nombre);
    assert.equal(plan[0].materias.length, 8, fila.nombre);
    assert.equal(plan[1].materias.length, 7, fila.nombre);
    assert.equal(plan[1].materias.at(-1), 'Práctica Profesionalizante');

    assert.ok(teclab.parseCompetenciasTeclab(fila.seccion_modalidad).length >= 6, fila.nombre);
    const [{ type, items }] = fila.slides;
    assert.equal(type, 'faq');
    assert.equal(items.length, 5, fila.nombre);
    for (const item of items) assert.ok(item.pregunta.endsWith('?') && item.respuesta.endsWith('.'), item.pregunta);
  }
});

test('ningún redirect tapa los slugs nuevos', () => {
  const slugs = new Set();
  for (const fila of filasDeFixture()) {
    const slug = tipos.carreraToSlug({ ...fila, nombre: nombreActual(fila.nombre) });
    assert.equal(buscarRedireccion(`/carreras/${slug}`), null, slug);
    assert.equal(buscarRedireccion(`/carreras/${slug}/inscripcion`), null, slug);
    slugs.add(slug);
  }
  assert.equal(slugs.size, NUEVAS.length);
});

// ── Ficha e inscripción ──

const vacio = () => null;
const dependencias = {
  '@/components/index/types': tipos,
  '@/components/index/teclab': teclab,
  '@/lib/whatsapp': { numeroWhatsAppDe: () => '5491100000000' },
  'next/image': { default: vacio, __esModule: true },
  'next/link': { default: ({ children, ...props }) => React.createElement('a', { href: props.href }, children), __esModule: true },
  '@/components/index/identidad-argentina': { getEscuelaIA: () => null },
  '@/components/index/ia-isotipo': { default: vacio, __esModule: true },
  '@/components/index/aviso-inicio-teclab': { default: vacio, __esModule: true },
  './career-info-button': { default: vacio, __esModule: true },
  './sticky-enrollment-cta': { default: vacio, __esModule: true },
  './resaltar-inscripcion': { default: vacio, __esModule: true },
  '@/components/index/resoluciones-teclab': cargarTypescript('components/index/resoluciones-teclab.ts', {}),
  '@/components/index/planes-teclab': cargarTypescript('components/index/planes-teclab.ts', {}),
  './descargar-plan': { default: vacio, __esModule: true },
  './formulario-rapido': { default: vacio, __esModule: true },
};
dependencias['./career-content'] = cargarTypescript('components/carreras/career-content.ts', dependencias);
const inscripcion = cargarTypescript('components/carreras/inscripcion-carrera.tsx', dependencias);
dependencias['./inscripcion-carrera'] = inscripcion;
const CareerDetail = cargarTypescript('components/carreras/career-detail.tsx', dependencias).default;

test('la ficha muestra el plan y no promete la articulación', () => {
  for (const fila of filasDeFixture()) {
    const html = renderToStaticMarkup(React.createElement(CareerDetail, { carrera: adaptadores.carreraAPublica(fila), relacionadas: [] }));
    assert.doesNotMatch(html, /\bnull\b|undefined|A confirmar/, fila.nombre);
    assert.doesNotMatch(html, /career-oficial-articulacion|Después podés seguir en Universidad Siglo 21/, fila.nombre);
    assert.match(html, /Práctica Profesionalizante/, fila.nombre);
  }
});

test('cada una tiene página de inscripción con un título que entra', () => {
  for (const fila of filasDeFixture()) {
    assert.ok(inscripcion.tieneInscripcionPropia(fila), fila.nombre);
    const titulo = inscripcion.tituloInscripcion(fila);
    assert.ok(titulo.length <= 66, titulo);
    assert.match(titulo, /\| Teclab$/, titulo);
  }
});

test('el slug largo de Agile Coaching redirige al corto', () => {
  assert.deepEqual(buscarRedireccion('/carreras/tecnicatura-superior-en-gestion-de-equipos-agiles-agile-coaching'), {
    origen: '/carreras/tecnicatura-superior-en-gestion-de-equipos-agiles-agile-coaching',
    destino: '/carreras/tecnicatura-superior-en-agile-coaching',
    estado: 308,
  });
});
