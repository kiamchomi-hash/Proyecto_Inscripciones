import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const leer = archivo => readFile(path.join(root, archivo), 'utf8');
const existe = archivo => access(path.join(root, archivo)).then(() => true, () => false);

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
