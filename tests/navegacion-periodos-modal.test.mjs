import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('S21 restaura el salto histórico a la derecha en desktop, sin selector nuevo', () => {
  const fuente = readFileSync('components/index/carousel-modal.tsx', 'utf8');
  assert.match(fuente, /absolute bottom-3 right-6 z-20 hidden md:flex/);
  assert.match(fuente, /Ver \{nextLabel\}/);
  assert.match(fuente, /Volver al inicio/);
  assert.doesNotMatch(fuente, /Navegación de períodos|data-periodo-destino|Siguiente período/);
});
test('Teclab conserva el índice anual desktop y el salto móvil históricos', () => {
  const fuente = readFileSync('components/index/teclab-modal.tsx', 'utf8');
  assert.match(fuente, /onClick=\{\(\) => setActivo\(i\)\}/);
  assert.match(fuente, /Ver \{siguienteAño\?\.año\}/);
  assert.doesNotMatch(fuente, /Navegación de períodos|data-periodo-destino|Siguiente período/);
});
test('el indicador flota sobre el área de lectura y no reserva una columna', () => {
  const shell = readFileSync('components/index/modal-shell.tsx', 'utf8');
  const flecha = readFileSync('components/index/flechas-de-scroll.tsx', 'utf8');
  const modales = readFileSync('components/index/modales.css', 'utf8');
  const global = readFileSync('app/globals.css', 'utf8');
  assert.doesNotMatch(shell, /modal-carril-lectura/);
  assert.doesNotMatch(modales, /modal-carril-lectura/);
  assert.match(global, /\.flechas-scroll\s*\{[^}]*pointer-events: none/);
  assert.match(global, /\.flecha-scroll\s*\{[^}]*position: absolute/);
  assert.match(flecha, /<button/);
  assert.match(flecha, /aria-label="Seguir leyendo"/);
});
test('el marco de layout no puede desplazarse al enfocar un botón', () => {
  const css = readFileSync('components/index/modales.css', 'utf8');
  assert.match(css.match(/\.modal-panel\s*\{[^}]+\}/)[0], /overflow: clip/);
});
