import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const { slugs } = JSON.parse(readFileSync('components/carreras/og-teclab.json', 'utf8'));

test('cada carrera de Teclab de la lista tiene su imagen para compartir', () => {
  assert.ok(slugs.length > 0);
  assert.equal(new Set(slugs).size, slugs.length, 'sin slugs repetidos');
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9-]+$/, slug);
    assert.ok(existsSync(`public/imagenes/og/teclab/${slug}.jpg`), `falta la imagen de ${slug}`);
  }
});

test('la ficha usa la imagen propia de la lista y, si no está, la de la familia', () => {
  const fuente = readFileSync('app/carreras/[slug]/page.tsx', 'utf8');
  assert.match(fuente, /if \(OG_TECLAB\.has\(slug\)\) return `\/imagenes\/og\/teclab\/\$\{slug\}\.jpg`;/);
  assert.match(fuente, /default-teclab-\$\{familia\}\.jpg/);
});
