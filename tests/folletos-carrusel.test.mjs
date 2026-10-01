import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { reducirCarrusel } from '../components/folletos-carrusel.ts';

test('el carrusel avanza y vuelve al primer folleto', () => {
  assert.deepEqual(reducirCarrusel({ indice: 2, detenido: false }, { tipo: 'avanzar' }, 3), { indice: 0, detenido: false });
});
test('la interacción detiene definitivamente el avance automático', () => {
  const detenido = reducirCarrusel({ indice: 0, detenido: false }, { tipo: 'detener' }, 3);
  assert.deepEqual(reducirCarrusel(detenido, { tipo: 'avanzar' }, 3), detenido);
  assert.deepEqual(reducirCarrusel(detenido, { tipo: 'seleccionar', indice: 2 }, 3), { indice: 2, detenido: true });
});
test('la integración contempla movimiento reducido e interacción accesible', () => {
  const componente = readFileSync(new URL('../components/videos-institucionales.tsx', import.meta.url), 'utf8');
  for (const patron of [/prefers-reduced-motion/, /onPointerEnter/, /onFocusCapture/, /onPointerDown/, /aria-roledescription=\{carrusel \? 'carrusel' : undefined\}/]) assert.match(componente, patron);
});


test('los cuatro folletos aprobados existen y mantienen sus dimensiones', async () => {
  const { default: sharp } = await import('sharp');
  for (const nombre of ['siglo21-licenciaturas', 'siglo21-tecnicaturas', 'siglo21-complementacion', 'teclab-tecnicaturas']) {
    const { width, height } = await sharp(fileURLToPath(new URL(`../public/folletos/${nombre}-2026-09.webp`, import.meta.url))).metadata();
    assert.equal(width, 1080);
    assert.equal(height, nombre.startsWith('siglo21') ? 1350 : 1240);
  }
});

test('el espacio sobrante queda debajo del folleto, antes del enlace de destino', () => {
  const css = readFileSync(new URL('../app/sobre-nosotros/sobre-nosotros.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css.match(/\.vi-caption\s*\{([^}]+)\}/)[1], /flex:\s*1\s*;/);
  assert.match(css, /\.vi-folletos\s*\{[^}]*flex:\s*1\s*;/);
});

test('los tres controles distribuyen el ancho y conservan contador y pausa', () => {
 const componente = readFileSync(new URL('../components/videos-institucionales.tsx', import.meta.url), 'utf8');
 assert.match(componente, /vi-carrusel-estado/);
 assert.match(componente, /En pausa/);
 const css = readFileSync(new URL('../app/sobre-nosotros/sobre-nosotros.css', import.meta.url), 'utf8');
 assert.ok(css.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'));
});
