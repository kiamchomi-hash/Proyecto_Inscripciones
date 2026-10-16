import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as tipos from '../components/index/types.ts';
import * as teclab from '../components/index/teclab.ts';
import * as adaptadores from '../lib/datos/carrera-detalle.ts';
import { carreraHubspotDe } from '../components/formularios/casas.ts';
import { perfilDe } from '../components/test-vocacional-teclab/puntaje.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// Las nueve tecnicaturas nuevas de Teclab de los bloques 2 y 3 (capacitaciones
// de admisión del 16/10/2026). Entran con inscripción abierta: ficha, página de
// inscripción, catálogo y los dos tests vocacionales.

const SQL = 'sql/2026-10-16_teclab_bloques_2_y_3.sql';

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
    assert.equal(teclab.getFichaTeclab({ nombre }), null, nombre);
    const portada = teclab.getPortadaTeclab({ nombre });
    assert.match(portada ?? '', /^\/imagenes\/teclab\/carreras\/.+\.webp$/, nombre);
    assert.ok(existsSync(`public${portada}`), portada);
    portadas.add(portada);
  }
  assert.equal(portadas.size, NUEVAS.length);
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

// ── SQL de alta ──

function filasDelSql() {
  const sql = readFileSync(SQL, 'utf8');
  const bloques = sql.split(/insert into public\.carreras/).slice(1);
  return bloques.map(bloque => {
    const [, nombre, nivel, nombreCorto, descripcion, duracion, titulo] = bloque.match(
      /select\s+'([^']+)', '([^']+)', 'Tecnicatura Superior en',\s+'([^']+)',\s+'([^']+)',\s+'100% Online',\s+'([^']+)',\s+'([^']+)',/,
    ) ?? [];
    const literal = texto => texto.replace(/'\s*\n\s*'/g, '').replace(/\\n/g, '\n');
    const enfoque = literal(bloque.match(/E'(Modalidad:[^']*)'/)?.[1] ?? '');
    const plan = literal(bloque.match(/E'(Primer Año[\s\S]*?)',\s*'\[/)?.[1] ?? '');
    const faq = JSON.parse(bloque.match(/'(\[\{"type": "faq"[\s\S]*?\]\}\])'::jsonb/)?.[1] ?? 'null');
    const competencias = literal(bloque.match(/E'(• [\s\S]*?)',\s*null,/)?.[1] ?? '');
    const flags = bloque.match(/(\d+), (true|false), (true|false), (true|false), (true|false)\s*where not exists/);
    return {
      id: 9600, nombre, nivel, prefix: 'Tecnicatura Superior en', nombre_corto: nombreCorto, descripcion,
      modalidad: '100% Online', duracion, titulo, enfoque, plan_estudios: plan, slides: faq,
      seccion_modalidad: competencias, seccion_duracion: null,
      orden: Number(flags?.[1]), activa: flags?.[2] === 'true', destacada: flags?.[3] === 'true',
      nueva: flags?.[4] === 'true', proximamente: flags?.[5] === 'true',
      idempotente: bloque.includes(`where not exists (\n  select 1 from public.carreras where nombre = '${nombre}'\n)`),
    };
  });
}

test('el SQL da de alta las nueve con inscripción abierta, sin duplicar', () => {
  const sql = readFileSync(SQL, 'utf8');
  assert.doesNotMatch(sql.replace(/^--.*$/gm, ''), /\b(update|drop|truncate|alter)\b|^\s*delete\b/im);
  const filas = filasDelSql();
  assert.deepEqual(filas.map(f => nombreActual(f.nombre)), NUEVAS.map(n => n.nombre));
  assert.deepEqual(filas.map(f => f.orden), [1109, 1110, 1111, 1112, 1113, 1114, 1115, 1116, 1117]);
  for (const [i, fila] of filas.entries()) {
    assert.equal(fila.nivel, NUEVAS[i].nivel, fila.nombre);
    assert.ok(fila.idempotente, `${fila.nombre}: falta where not exists por nombre`);
    assert.deepEqual([fila.activa, fila.destacada, fila.nueva, fila.proximamente], [true, false, true, false], fila.nombre);
    assert.equal(fila.duracion, '2 años');
    assert.equal(fila.titulo, fila.nombre.replace('Tecnicatura Superior en', 'Técnico Superior en'));
    assert.equal(tipos.carreraFullName(fila), fila.nombre);
    assert.ok(tipos.esCarreraVisible(fila));
  }
});

test('cada fila trae descripción, enfoque, plan, competencias y FAQ con el formato de Teclab', () => {
  for (const fila of filasDelSql()) {
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

test('ningún redirect de next.config.ts tapa los slugs nuevos', async () => {
  const { default: config } = await import('../next.config.ts');
  const fuentes = new Set((await config.redirects()).map(r => r.source));
  const slugs = new Set();
  for (const fila of filasDelSql()) {
    const slug = tipos.carreraToSlug({ ...fila, nombre: nombreActual(fila.nombre) });
    assert.ok(!fuentes.has(`/carreras/${slug}`), slug);
    assert.ok(!fuentes.has(`/carreras/${slug}/inscripcion`), slug);
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
};
dependencias['./career-content'] = cargarTypescript('components/carreras/career-content.ts', dependencias);
const inscripcion = cargarTypescript('components/carreras/inscripcion-carrera.tsx', dependencias);
dependencias['./inscripcion-carrera'] = inscripcion;
const CareerDetail = cargarTypescript('components/carreras/career-detail.tsx', dependencias).default;

test('la ficha muestra el plan y no promete la articulación', () => {
  for (const fila of filasDelSql()) {
    const html = renderToStaticMarkup(React.createElement(CareerDetail, { carrera: adaptadores.carreraAPublica(fila), relacionadas: [] }));
    assert.doesNotMatch(html, /\bnull\b|undefined|A confirmar/, fila.nombre);
    assert.doesNotMatch(html, /career-oficial-articulacion|Después podés seguir en Universidad Siglo 21/, fila.nombre);
    assert.match(html, /Práctica Profesionalizante/, fila.nombre);
  }
});

test('cada una tiene página de inscripción con un título que entra', () => {
  for (const fila of filasDelSql()) {
    assert.ok(inscripcion.tieneInscripcionPropia(fila), fila.nombre);
    const titulo = inscripcion.tituloInscripcion(fila);
    assert.ok(titulo.length <= 66, titulo);
    assert.match(titulo, /\| Teclab$/, titulo);
  }
});

test('el slug largo de Agile Coaching redirige al corto', async () => {
  const { readFileSync } = await import('node:fs');
  const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
  assert.match(config, /source: '\/carreras\/tecnicatura-superior-en-gestion-de-equipos-agiles-agile-coaching',\s*destination: '\/carreras\/tecnicatura-superior-en-agile-coaching'/);
});
