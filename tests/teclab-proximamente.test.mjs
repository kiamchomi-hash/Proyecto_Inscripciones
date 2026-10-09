import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as tipos from '../components/index/types.ts';
import * as teclab from '../components/index/teclab.ts';
import * as adaptadores from '../lib/datos/carrera-detalle.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// Las carreras de Teclab anunciadas sin inscripción abierta: filas con
// `proximamente = true` y sin duración, título, enfoque, plan ni slides. La ficha,
// la meta description, el modal y los formularios no pueden prometer nada que no
// esté confirmado.

const vacia = {
  duracion: null, titulo: null, modalidad: '100% Online', orden: 1101, activa: true,
  destacada: false, nueva: false, proximamente: true, enfoque: null, plan_estudios: null,
  seccion_modalidad: null, seccion_duracion: null, slides: null,
};

const fintech = {
  ...vacia, id: 9101, nombre: 'Tecnicatura Superior en Fintech', prefix: 'Tecnicatura Superior en',
  nombre_corto: 'Fintech', nivel: 'Teclab - Tecnología',
  descripcion: 'Estudiá fintech a distancia: la tecnología que cambió cómo se paga, se presta y se invierte, desde billeteras virtuales y pagos digitales hasta banca online y análisis de datos financieros. Es un área donde se cruzan las finanzas y el desarrollo de productos digitales, y una de las que más crece en la Argentina. La salida laboral está en fintechs, bancos digitales, billeteras, procesadoras de pago y áreas de innovación financiera.',
};

const alimentos = {
  ...vacia, id: 9104, orden: 1104, nombre: 'Tecnicatura Superior en Gestión de Alimentos',
  prefix: 'Tecnicatura Superior en', nombre_corto: 'Gestión de Alimentos', nivel: 'Teclab - Gestión',
  descripcion: 'Estudiá gestión de alimentos a distancia y aprendé cómo se organiza la producción, la calidad y la seguridad de lo que comemos, de la materia prima a la góndola. Es un campo donde pesan la higiene y la inocuidad, las normas de calidad y la logística de una cadena que no puede cortarse. La salida laboral está en industrias alimenticias, servicios de comida, gastronomía, supermercados y áreas de calidad.',
};

const agro = {
  ...vacia, id: 9001, nombre: 'Agroinformática', prefix: null, nombre_corto: null, nivel: 'Grado',
  duracion: '4 años', titulo: 'Licenciado/a en Agroinformática', enfoque: 'Tecnología aplicada al agro',
  modalidad: 'Educación distribuida', descripcion: 'Aplicá la tecnología al agro.',
};

// ── Ficha /carreras/[slug] ──

const vacio = () => null;
const dependencias = {
  '@/components/index/types': tipos,
  '@/components/index/teclab': teclab,
  '@/lib/whatsapp': { numeroWhatsAppDe: () => '5491100000000' },
  'next/image': { default: vacio, __esModule: true },
  'next/link': { default: ({ children, ...props }) => React.createElement('a', { href: props.href }, children), __esModule: true },
  '@/components/index/identidad-argentina': { getEscuelaIA: () => null },
  '@/components/index/ia-isotipo': { default: vacio, __esModule: true },
  // Marca visible: la ficha de una `proximamente` no puede decir que todavía
  // hay tiempo de inscribirse.
  '@/components/index/aviso-inicio-teclab': { default: () => React.createElement('p', null, 'AVISO-INICIO'), __esModule: true },
  './career-info-button': { default: vacio, __esModule: true },
  './sticky-enrollment-cta': { default: vacio, __esModule: true },
  './resaltar-inscripcion': { default: vacio, __esModule: true },
};
dependencias['./career-content'] = cargarTypescript('components/carreras/career-content.ts', dependencias);
dependencias['./inscripcion-carrera'] = cargarTypescript('components/carreras/inscripcion-carrera.tsx', dependencias);
const CareerDetail = cargarTypescript('components/carreras/career-detail.tsx', dependencias).default;
const ficha = fila => renderToStaticMarkup(React.createElement(CareerDetail, { carrera: adaptadores.carreraAPublica(fila), relacionadas: [] }));

test('la ficha de una Teclab próximamente nombra a Teclab y no promete datos', () => {
  const html = ficha(fintech);
  assert.match(html, /Teclab anunció esta carrera/);
  assert.doesNotMatch(html, /Universidad Siglo 21 anunció/);
  assert.match(html, /A confirmar/);
  assert.doesNotMatch(html, /Al finalizar el primer año/);
  assert.doesNotMatch(html, /\bnull\b|undefined/);
  assert.doesNotMatch(html, /career-oficial-articulacion|Después podés seguir en Universidad Siglo 21/);
  assert.doesNotMatch(html, /AVISO-INICIO|Ver precio|teclab\.edu\.ar|id="plan"/);
  assert.match(html, /Avisame cuando abra/);
  // La última oración de la descripción es la salida laboral: tiene que verse
  // aunque la carrera no tenga competencias cargadas.
  assert.match(html, /La salida laboral está en fintechs/);
});

test('las demás próximamente conservan el aviso de Universidad Siglo 21', () => {
  const html = ficha(agro);
  assert.match(html, /Universidad Siglo 21 anunció esta carrera/);
  assert.doesNotMatch(html, /Teclab anunció/);
});

test('un curso de Teclab próximamente se anuncia como curso', () => {
  const curso = { ...fintech, id: 9200, nivel: 'Teclab - Curso', nombre: 'Curso de Finanzas Personales', prefix: 'Curso de', nombre_corto: 'Finanzas Personales' };
  assert.match(ficha(curso), /Teclab anunció este curso/);
});

// ── Meta description ──

function consultaDe(datos) {
  const consulta = {
    select: () => consulta, eq: () => consulta, order: () => consulta,
    throwOnError: () => Promise.resolve({ data: datos }),
  };
  return consulta;
}

function cargarPagina(filas) {
  return cargarTypescript('app/carreras/[slug]/page.tsx', {
    '@/lib/supabase': { supabase: { from: () => consultaDe(filas) } },
    '@/components/index/types': tipos,
    '@/components/index/teclab': teclab,
    '@/lib/datos/carrera-detalle': adaptadores,
    '@/components/carreras/career-content': dependencias['./career-content'],
    'next/font/google': { Poppins: () => ({ variable: '' }) },
  }, () => ({}));
}

test('la description de una Teclab próximamente no promete duración ni título y es propia', async () => {
  const pagina = cargarPagina([fintech, alimentos]);
  const descripciones = [];
  for (const slug of ['tecnicatura-superior-en-fintech', 'tecnicatura-superior-en-gestion-de-alimentos']) {
    const { description, openGraph } = await pagina.generateMetadata({ params: Promise.resolve({ slug }) });
    assert.doesNotMatch(description, /\bnull\b|undefined|Recibite|\ben ,|\s,|años|Título/);
    assert.match(description, /Teclab/);
    assert.match(description, /Todavía no abrió la inscripción/);
    assert.ok(description.length <= 165, description);
    assert.equal(openGraph.description, description);
    descripciones.push(description);
  }
  assert.match(descripciones[0], /Fintech/);
  assert.match(descripciones[1], /Gestión de Alimentos/);
  assert.notEqual(descripciones[0], descripciones[1]);
});

// ── Articulación, modal y formularios ──

test('una próximamente no articula con Siglo 21 aunque sea Teclab', () => {
  assert.equal(teclab.articulaConSiglo21({ nombre: fintech.nombre, nivel: fintech.nivel, proximamente: true }), false);
  assert.equal(teclab.articulaConSiglo21({ nombre: fintech.nombre, nivel: fintech.nivel, proximamente: false }), true);
  assert.equal(teclab.articulaConSiglo21({ nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' }), true);
});

test('el modal muestra A confirmar y no ofrece título oficial en una próximamente', () => {
  assert.equal(teclab.datoTeclab(''), 'A confirmar');
  assert.equal(teclab.datoTeclab(null), 'A confirmar');
  assert.equal(teclab.datoTeclab('2 años'), '2 años');
  assert.equal(teclab.credencialTeclab({ nivel: 'Teclab - Gestión', proximamente: true }), 'Próximamente');
  assert.equal(teclab.credencialTeclab({ nivel: 'Teclab - Gestión', proximamente: false }), 'Título oficial');
  assert.equal(teclab.credencialTeclab({ nivel: 'Teclab - Curso' }), 'Certificado oficial');
});

test('la salida laboral sale de la última oración de las cinco descripciones', () => {
  for (const fila of [fintech, alimentos]) {
    const { perfil, salida } = teclab.partirDescripcionTeclab(fila.descripcion);
    assert.match(salida, /^La salida laboral está en /);
    assert.doesNotMatch(perfil, /salida laboral/);
    assert.match(perfil, /^Estudiá /);
  }
});

test('la preinscripción no ofrece próximamente; el contacto sí, para pedir el aviso', () => {
  const opciones = [
    { id: 1, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' },
    { id: 2, nombre: fintech.nombre, nivel: fintech.nivel, proximamente: true },
    { id: 3, nombre: 'Agroinformática', nivel: 'Grado', proximamente: true },
  ];
  assert.deepEqual(tipos.opcionesDelModo(opciones, 'preinscripcion').map(o => o.id), [1]);
  assert.deepEqual(tipos.opcionesDelModo(opciones, 'contacto').map(o => o.id), [1, 2, 3]);
});

// ── SQL de alta ──

const SQL = 'sql/2026-10-09_teclab_carreras_proximamente.sql';

function filasDelSql() {
  const sql = readFileSync(SQL, 'utf8');
  const tuplas = [...sql.matchAll(/\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+)\s*\)/g)];
  return tuplas.map(([, nombre, nivel, nombreCorto, descripcion, orden], i) => ({
    ...vacia, id: 9300 + i, nombre, nivel, nombre_corto: nombreCorto, descripcion,
    orden: Number(orden), prefix: 'Tecnicatura Superior en',
  }));
}

test('el SQL da de alta las cinco sin duplicar y sin inventar datos', () => {
  const sql = readFileSync(SQL, 'utf8');
  const filas = filasDelSql();
  assert.equal(filas.length, 5);
  assert.deepEqual(filas.map(f => f.orden), [1101, 1102, 1103, 1104, 1105]);
  assert.match(sql, /where not exists \(\s*select 1 from public\.carreras c where c\.nombre = nuevas\.nombre\s*\)/);
  assert.match(sql, /null, null, null, null, null, null, null,\s*nuevas\.orden, true, false, false, true/);
  assert.doesNotMatch(sql.replace(/^--.*$/gm, ''), /\b(update|drop|truncate|alter)\b|^\s*delete\b/im);
  const slugs = new Set();
  for (const fila of filas) {
    assert.ok(tipos.esCarreraVisible(fila), fila.nombre);
    assert.ok(teclab.esTeclab(fila), fila.nombre);
    assert.equal(tipos.carreraFullName(fila), fila.nombre);
    assert.equal(teclab.getFichaTeclab(fila), null, `${fila.nombre} no tiene ficha oficial todavía`);
    const { perfil, salida } = teclab.partirDescripcionTeclab(fila.descripcion);
    assert.match(salida, /^La salida laboral está en .+\.$/, fila.nombre);
    assert.match(perfil, /^Estudiá /);
    assert.doesNotMatch(perfil, /salida laboral/);
    slugs.add(tipos.carreraToSlug(fila));
  }
  assert.equal(slugs.size, 5);
});

test('las cinco quedan con fichas y descriptions propias', async () => {
  const filas = filasDelSql();
  const pagina = cargarPagina(filas);
  const vistas = new Set();
  for (const fila of filas) {
    const { description } = await pagina.generateMetadata({ params: Promise.resolve({ slug: tipos.carreraToSlug(fila) }) });
    assert.ok(description.includes(fila.nombre_corto), description);
    assert.ok(description.length <= 165, description);
    vistas.add(description);
    const html = ficha(fila);
    assert.match(html, /Teclab anunció esta carrera/);
    assert.doesNotMatch(html, /\bnull\b|undefined|Universidad Siglo 21 anunció|career-oficial-articulacion/);
  }
  assert.equal(vistas.size, 5);
});

test('las cinco carreras anunciadas de Teclab entran en un filtro del catálogo', () => {
  const casos = [
    ['Tecnicatura Superior en Fintech', 'Teclab - Tecnología', 'Desarrollo'],
    ['Tecnicatura Superior en Producto Digital', 'Teclab - Tecnología', 'Desarrollo'],
    ['Tecnicatura Superior en Gestión de Energías Renovables', 'Teclab - Tecnología', 'Infraestructura'],
  ];
  for (const [nombre, nivel, categoria] of casos) {
    assert.equal(teclab.getCategoriaTeclabTecnologia({ nombre, nivel }), categoria, nombre);
  }
  assert.equal(teclab.getTipoTeclab({ nombre: 'Tecnicatura Superior en Acompañamiento Terapéutico', nivel: 'Teclab - Gestión' }), 'Servicios');
  assert.equal(teclab.getTipoTeclab({ nombre: 'Tecnicatura Superior en Gestión de Alimentos', nivel: 'Teclab - Gestión' }), 'Gestión');
});

test('Gestión de Alimentos y Proyectos Mineros entran en el área Ambiente y Agro', () => {
  assert.equal(tipos.getAreaForCarrera({ nombre: 'Tecnicatura Superior en Gestión de Alimentos' }), 'ambiente');
  assert.equal(tipos.getAreaForCarrera({ nombre: 'Tecnicatura Superior en Gestión de Proyectos Mineros' }), 'ambiente');
  assert.equal(teclab.getTipoTeclab({ nombre: 'Tecnicatura Superior en Gestión de Proyectos Mineros', nivel: 'Teclab - Gestión' }), 'Gestión');
});

test('las carreras anunciadas de Teclab tienen portada propia y las demás conservan la de su ficha', () => {
  for (const nombre of [
    'Tecnicatura Superior en Fintech',
    'Tecnicatura Superior en Acompañamiento Terapéutico',
    'Tecnicatura Superior en Producto Digital',
    'Tecnicatura Superior en Gestión de Alimentos',
    'Tecnicatura Superior en Gestión de Energías Renovables',
    'Tecnicatura Superior en Gestión de Proyectos Mineros',
  ]) {
    const portada = teclab.getPortadaTeclab({ nombre });
    assert.match(portada ?? '', /^\/imagenes\/teclab\/carreras\/.+\.webp$/, nombre);
    assert.ok(existsSync(`public${portada}`), portada);
  }
  assert.equal(
    teclab.getPortadaTeclab({ nombre: 'Tecnicatura Superior en Programación' }),
    teclab.getFichaTeclab({ nombre: 'Tecnicatura Superior en Programación' }).imagen,
  );
});

test('el slug provisorio de Energías Renovables redirige al del nombre oficial', () => {
  const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
  assert.match(config, /source: '\/carreras\/tecnicatura-superior-en-energias-renovables',\s*destination: '\/carreras\/tecnicatura-superior-en-gestion-de-energias-renovables',\s*permanent: true/);
  assert.equal(
    tipos.carreraToSlug({ prefix: 'Tecnicatura Superior en', nombre: 'Tecnicatura Superior en Gestión de Energías Renovables', nombre_corto: 'Gestión de Energías Renovables', nivel: 'Teclab - Tecnología' }),
    'tecnicatura-superior-en-gestion-de-energias-renovables',
  );
});
