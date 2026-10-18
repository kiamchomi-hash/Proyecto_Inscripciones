import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as tipos from '../components/index/types.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// La ficha de Teclab de marketing digital se llevaba las búsquedas «siglo 21
// marketing digital» (posición 6) por delante de la de Siglo 21 (posición 13), y
// el que buscaba la universidad no clickeaba. Las dos fichas se enlazan entre sí
// con el nombre de la casa en el texto del enlace.

const { carreraEquivalente } = cargarTypescript('components/carreras/carrera-equivalente.ts', {
  '@/components/index/types': tipos,
});

const teclab = { id: 223, nombre: 'Tecnicatura Superior en Marketing Digital', prefix: 'Tecnicatura Superior en', nivel: 'Teclab - Gestión' };
const siglo = { id: 41, nombre: 'Marketing y Publicidad Digital', prefix: 'Pregrado / Tecnicatura en', nivel: 'Pregrado' };
const otra = { id: 7, nombre: 'Abogacía', prefix: null, nivel: 'Grado' };
const carreras = [teclab, siglo, otra];

test('la ficha de Teclab enlaza a la de Siglo 21 nombrando la universidad', () => {
  const eq = carreraEquivalente(teclab, carreras);
  assert.equal(eq.carrera.id, siglo.id);
  assert.equal(eq.casa, 'Universidad Siglo 21');
});

test('la ficha de Siglo 21 enlaza de vuelta a la de Teclab', () => {
  const eq = carreraEquivalente(siglo, carreras);
  assert.equal(eq.carrera.id, teclab.id);
  assert.equal(eq.casa, 'Teclab');
});

test('sin pareja, o con la pareja fuera de la oferta, no hay enlace', () => {
  assert.equal(carreraEquivalente(otra, carreras), null);
  assert.equal(carreraEquivalente(teclab, [teclab, otra]), null);
});

test('la ficha pinta el enlace y la página se lo pasa', () => {
  const ficha = readFileSync(new URL('../components/carreras/career-detail.tsx', import.meta.url), 'utf8');
  const pagina = readFileSync(new URL('../app/carreras/[slug]/page.tsx', import.meta.url), 'utf8');
  assert.match(ficha, /career-equivalente/);
  assert.match(pagina, /carreraEquivalente\(carrera, carreras\)/);
});

test('la description de Siglo 21 dice «marketing digital» y nombra la universidad', () => {
  const pagina = readFileSync(new URL('../app/carreras/[slug]/page.tsx', import.meta.url), 'utf8');
  const m = pagina.match(/'Tecnicatura en Marketing y Publicidad Digital': \{\s*title: '([^']+)',\s*description: '([^']+)'/);
  assert.ok(m, 'falta el ajuste puntual de la ficha de Siglo 21');
  assert.match(m[2], /^Marketing digital/);
  assert.match(m[2], /Siglo 21/);
  assert.ok(m[1].length <= 61 && m[2].length <= 165);
});
