import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('las fotos del carrusel usan los originales, tanto en portada como en cierre', () => {
  const codigo = readFileSync(new URL('../components/index/carousel-modal.tsx', import.meta.url), 'utf8');
  const imagenes = [...codigo.matchAll(/<ImagenResponsiva\b[\s\S]*?\/>/g)].map(m => m[0]);
  assert.equal(imagenes.length, 5);
  for (const imagen of imagenes) assert.match(imagen, /\boriginal\b/);
  const componente = readFileSync(new URL('../components/imagenes/imagen-responsiva.tsx', import.meta.url), 'utf8');
  assert.match(componente, /original\s*\?\s*undefined\s*:\s*srcSetDe\(ruta\)/);
});
