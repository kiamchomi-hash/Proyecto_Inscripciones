import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const leer = archivo => readFile(path.join(root, archivo), 'utf8');
const existe = archivo => access(path.join(root, archivo)).then(() => true, () => false);

test('computación separa Python disponible de los próximos lenguajes', async () => {
  const herramientas = await leer('components/clases-apoyo/computacion/herramientas.tsx');
  const computacion = await leer('components/clases-apoyo/computacion/computacion-pixel.tsx');

  assert.match(computacion, /<Herramientas \/>[\s\S]*?<Programacion \/>[\s\S]*?<ReservaClase/);
  assert.match(herramientas, /export function Programacion\(/);
  const programacion = herramientas.slice(herramientas.indexOf('export function Programacion('));
  assert.match(programacion, /primeros pasos en programación y automatizar tareas/);
  assert.match(programacion, /Disponible/);
  assert.match(programacion, /Próximamente/);
  for (const nombre of ['C++', 'HTML', 'CSS', 'JavaScript', 'PostgreSQL', 'SQL']) {
    assert.ok(programacion.includes(`'${nombre}'`));
  }
  assert.match(programacion, /useState\(tecnologias\[0\]\)/);
  assert.match(programacion, /aria-pressed=\{elegida.logo === tecnologia.logo\}/);
  assert.match(programacion, /onClick=\{\(\) => setElegida\(tecnologia\)\}/);
  assert.doesNotMatch(programacion, /<a\s|<form|<ReservaClase/);
});

// Cada /clases-apoyo/[materia] es una página independiente: volver, contenido
// propio, reserva y otras materias. La app con barra lateral compartida ya no
// existe (docs/plans/2026-09-26-materias-independientes-design.md).

test('la página de materia arma sus piezas y no monta la app vieja', async () => {
  const page = await leer('app/clases-apoyo/[materia]/page.tsx');

  assert.doesNotMatch(page, /clases-apoyo-page/);
  assert.match(page, /reserva-clase/);
  assert.match(page, /navegacion-materia/);
  assert.match(page, /computacion-pixel/);
  assert.equal(await existe('components/clases-apoyo/clases-apoyo-page.tsx'), false);
});

test('el bloque de reserva conserva el envío y la medición', async () => {
  const reserva = await leer('components/clases-apoyo/reserva/reserva-clase.tsx');

  assert.match(reserva, /fetch\('\/api\/formularios'/);
  assert.match(reserva, /kind: 'clase'/);
  assert.match(reserva, /trackDiaClase\(/);
  assert.match(reserva, /trackHorarioClase\(/);
  assert.match(reserva, /trackSolicitudClase\(/);
});

test('computación no escribe el teléfono a mano: sale de la base', async () => {
  const computacion = await leer('components/clases-apoyo/computacion/computacion-pixel.tsx');

  assert.doesNotMatch(computacion, /\d{2}\s?\d{4}[\s-]?\d{4}/);
});

test('el CSS de clases de apoyo ya no tiene el shell de la app', async () => {
  const css = await leer('app/clases-apoyo/clases-apoyo.css');

  assert.doesNotMatch(css, /\.ca-sidebar\b/);
  assert.doesNotMatch(css, /\.ca-mobile-tabs\b/);
  assert.doesNotMatch(css, /\.ca-app\b/);
});

test('computación integra el regreso y presenta su descripción después de la reserva', async () => {
  const computacion = await leer('components/clases-apoyo/computacion/computacion-pixel.tsx');
  const page = await leer('app/clases-apoyo/[materia]/page.tsx');
  const css = await leer('app/clases-apoyo/computacion.css');

  assert.match(computacion, /<header className="cp-encabezado">[\s\S]*?<VolverAClases compacto \/>[\s\S]*?<h1/);
  assert.ok(computacion.indexOf('<Herramientas />') < computacion.indexOf('<ReservaClase'));
  assert.ok(computacion.indexOf('<ComputacionTexto') > computacion.indexOf('encabezadoHorarios='));
  assert.match(page, /\{!esComputacion && <VolverAClases \/>\}/);
  assert.match(page, /!esComputacion && <TextoMateria/);
  assert.match(css, /\.cp-reserva \.rc-horarios\s*\{[^}]*padding-bottom:\s*1rem/);
});

test('programación usa logos locales seguros para cada tecnología', async () => {
  const herramientas = await leer('components/clases-apoyo/computacion/herramientas.tsx');
  assert.doesNotMatch(herramientas, />\.py</);
  for (const logo of ['python', 'cpp', 'html', 'css', 'javascript', 'postgresql', 'sql']) {
    const svg = await leer(`public/imagenes/clases-apoyo/computacion/programacion/${logo}.svg`);
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script|<foreignObject|(?:href|src)=["'](?:https?:|\/\/)|\bon[a-z]+=/i);
  }
  assert.match(herramientas, /pg-logo/);
});


test('computación presenta consultas primero y programación con las mismas superficies que herramientas', async () => {
  const computacion = await leer('components/clases-apoyo/computacion/computacion-pixel.tsx');
  const herramientas = await leer('components/clases-apoyo/computacion/herramientas.tsx');
  const css = await leer('app/clases-apoyo/computacion.css');
  assert.match(computacion, /<\/header>\s*<div className="cp-contacto">[\s\S]*?<Herramientas \/>/);
  assert.equal((computacion.match(/<WhatsappClase/g) ?? []).length, 1);
  assert.doesNotMatch(css, /\.pg \.hr-ficha-logo/);
  assert.doesNotMatch(css, /pg-escena|pg-inventario|pg-casilla/);
  assert.match(css, /\.hr-inventario\s*\{[^}]*grid-auto-rows:\s*1fr/);
  const programacion = herramientas.slice(herramientas.indexOf('export function Programacion'));
  assert.match(programacion, /className="hr-escena"/);
  assert.match(programacion, /className="hr-inventario"/);
  assert.match(herramientas, /texto: 'Estructura del contenido de las páginas web.'/);
  assert.match(herramientas, /texto: 'Consultas para leer y organizar datos.'/);
  assert.doesNotMatch(herramientas, /pg-descripcion/);
});

test('programación selecciona la ficha superior desde sus rectángulos', async () => {
  const herramientas = await leer('components/clases-apoyo/computacion/herramientas.tsx');
  const programacion = herramientas.slice(herramientas.indexOf('export function Programacion'));
  assert.match(programacion, /<button[\s\S]*?type="button"[\s\S]*?className="hr-casilla"/);
  assert.match(programacion, /<span className="hr-casilla-nombre">[\s\S]*?Java<br \/>Script[\s\S]*?Postgre<br \/>SQL/);
  assert.match(programacion, /className="hr-fichas" aria-live="polite"/);
  assert.match(programacion, /aria-hidden=\{!activa\}/);
  assert.match(programacion, /className="hr-ficha-uso">\{tecnologia.texto\}/);
  assert.match(programacion, /tecnologia.logo === 'python' \? 'Disponible' : 'Próximamente'/);
  const inventario = programacion.slice(programacion.indexOf('<ul'));
  assert.doesNotMatch(inventario, /texto|pg-estado|pg-disponible|<p/);
});
