import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { altPortadaCarrera } from '../components/carreras/alt-portadas.ts';

test('la descripción pertenece a la imagen y no se aplica a una portada distinta', () => {
  assert.equal(altPortadaCarrera('/imagenes/teclab/carreras/logistica.webp'),
    'Una persona maneja un montacargas en un depósito');
  assert.equal(altPortadaCarrera('/imagenes/otra-portada.webp'), '');
});

test('las portadas descritas no quedan ocultas a lectores de pantalla', () => {
  const componente = readFileSync(new URL('../components/carreras/career-detail.tsx', import.meta.url), 'utf8');
  assert.match(componente, /aria-hidden=\{heroAlt \? undefined : true\}/);
  assert.match(componente, /alt=\{heroAlt\}/);
});
