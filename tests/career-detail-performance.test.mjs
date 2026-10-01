import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const leer = archivo => readFile(new URL(`../${archivo}`, import.meta.url), 'utf8');

test('todas las fichas comparten el título renderizado en el servidor', async () => {
  const [page, detail] = await Promise.all([
    leer('app/carreras/[slug]/page.tsx'),
    leer('components/carreras/career-detail.tsx'),
  ]);
  assert.match(page, /<CareerDetail carrera=\{carrera\}/);
  assert.match(detail, /<h1>\{cleanName\}<\/h1>/);
  assert.doesNotMatch(detail, /^['"]use client['"]/);
});

test('el título de las fichas es visible desde el primer render sin animación de entrada', async () => {
  const css = await leer('app/carreras/career-detail.css');
  const regla = css.match(/\.career-hero h1\s*\{([^}]+)\}/)?.[1];
  assert.ok(regla, 'Debe existir la regla compartida del título');
  assert.match(regla, /animation:\s*none\s*;/);
  assert.doesNotMatch(regla, /opacity:\s*0(?:\s|;)|visibility:\s*hidden|transform:/);
});