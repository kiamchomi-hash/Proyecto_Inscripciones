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

test('las portadas temáticas revisadas describen lo que muestran', () => {
  assert.equal(altPortadaCarrera('/imagenes/Modales/Licenciatura en Periodismo/Foto-hero-licenciatura-en-publicidad.webp'),
    'Una periodista sostiene un micrófono frente a una cámara');
  assert.equal(altPortadaCarrera('/imagenes/Modales/Licenciatura en Gerontología/Foto-hero-licenciatura-gerontologia-ccc.webp'),
    'Un hombre acompaña a una persona mayor durante una conversación');
  assert.equal(altPortadaCarrera('/imagenes/imagenes_carreras/licenciatura-en-ambiente-y-energias-renovables.webp'),
    'Un hombre examina una maqueta de un aerogenerador');
});

test('la revisión individual incluye la actividad contable y la indumentaria sanitaria', () => {
  assert.equal(altPortadaCarrera('/imagenes/Modales/Tecnicatura en Gestión Contable e impositiva/Foto-hero-gestion-contable-e-impositiva.webp'),
    'Un hombre trabaja con documentos y una calculadora junto a una computadora');
  assert.equal(altPortadaCarrera('/imagenes/Modales/Licenciatura en Terapia Ocupacional y Desarrollo Humano/hero-lic-en-terapia-ocupacional-y-desarrollo-humano.jpg'),
    'Una persona con ropa sanitaria en un edificio');
  assert.equal(altPortadaCarrera('/imagenes/teclab/carreras/gestion-hotelera.webp'), '');
});
