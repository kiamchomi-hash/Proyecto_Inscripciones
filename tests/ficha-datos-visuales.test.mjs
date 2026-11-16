import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('la ficha no muestra migas y conserva el enlace al catálogo', () => {
  const ficha = readFileSync('components/carreras/career-detail.tsx', 'utf8');
  assert.doesNotMatch(ficha, /className="career-breadcrumb"/);
  assert.match(ficha, /className="career-all-careers"/);
});

test('los datos de Teclab centran institución y duración y destacan la duración', () => {
  const css = readFileSync('estilos/carreras/career-detail-teclab.css', 'utf8');
  assert.match(css, /nth-child\(-n\+2\)[^{]*\{[^}]*justify-content:\s*center/s);
  assert.match(css, /nth-child\(2\) dd\s*\{[^}]*font-size:\s*1\.2rem/s);
  assert.match(css, /nth-child\(4\)\s*\{[^}]*background:\s*#423d8f/s);
});

test('la marca de Teclab centra el instituto y empareja sus divisores', () => {
  const css = readFileSync('estilos/carreras/career-detail-teclab.css', 'utf8');
  assert.match(css, /career-hero-marca span\s*\{[^}]*align-self:\s*stretch/s);
  assert.match(css, /span:not\(\.career-hero-modalidad\)\s*\{[^}]*text-align:\s*center/s);
  assert.match(css, /career-hero h1 \.career-kicker\s*\{[^}]*text-shadow:/s);
});
