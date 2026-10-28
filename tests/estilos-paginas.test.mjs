import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('Tailwind incluye los cuerpos de página usados por el Worker', () => {
  const estilos = readFileSync(new URL('../estilos/globals.css', import.meta.url), 'utf8');
  assert.match(estilos, /@source\s+["']\.\.\/paginas["']\s*;/);
});
