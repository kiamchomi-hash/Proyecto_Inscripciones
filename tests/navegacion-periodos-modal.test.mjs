import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
for (const archivo of ['carousel-modal.tsx', 'teclab-modal.tsx']) {
  test(`${archivo}: navegación de periodos explícita fuera del scroll`, () => {
    const fuente = readFileSync(`components/index/${archivo}`, 'utf8');
    assert.match(fuente, /aria-label="Navegación de períodos"/);
    assert.match(fuente, /data-periodo-destino/);
    assert.match(fuente, /Siguiente período/);
  });
}
test('el indicador tiene un carril estructural y es un botón accesible', () => {
  const shell = readFileSync('components/index/modal-shell.tsx', 'utf8');
  const flecha = readFileSync('components/index/flechas-de-scroll.tsx', 'utf8');
  assert.match(shell, /modal-carril-lectura/);
  assert.match(flecha, /<button/);
  assert.match(flecha, /aria-label="Seguir leyendo"/);
});
test('el marco de layout no puede desplazarse al enfocar un botón', () => {
  const css = readFileSync('components/index/modales.css', 'utf8');
  assert.match(css.match(/\.modal-contenido\s*\{[^}]+\}/)[0], /overflow: clip/);
});
