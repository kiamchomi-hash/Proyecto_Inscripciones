import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as casas from '../components/formularios/casas.ts';
import * as tipos from '../components/index/types.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const { SlideCierreView } = cargarTypescript('components/index/carousel-modal.tsx', {
  './types': tipos,
  '@/lib/sanitize-content': { sanitizeContent: valor => valor },
  '@/components/carreras/career-content': { mensajeWhatsAppPrecios: () => 'Consulta' },
  './use-compartir': {}, './icono-compartir': {},
  '@/components/formularios/elegir-carrera': {},
  '@/components/formularios/casas': casas,
  './ver-precio-teclab': { AccesoVerPrecio: () => React.createElement(React.Fragment, null,
    React.createElement('button', { className: 'vp-boton' }, 'Ver precio'),
    React.createElement('a', { className: 'vp-whatsapp vp-whatsapp-lleno', href: '#whatsapp' }, 'Consultar por WhatsApp')) },
});
const slide = { type: 'cierre', imagen: '/imagenes/sede.jpg', titulo: 'Estudiá con nosotros', beneficios: [] };
const pintar = nivel => renderToStaticMarkup(React.createElement(SlideCierreView, {
  slide, carrera: { nivel, nombre: 'Prueba' }, onInscribir() {}, onVerPrecio() {},
}));

test('el cierre de Siglo 21 muestra estudio a distancia en ambos encuadres', () => {
  const html = pintar('Grado');
  assert.equal((html.match(/src="\/imagenes\/novedades\/carreras-de-grado-a-distancia.jpg"/g) || []).length, 2);
  assert.equal((html.match(/alt="Estudiante con una computadora portátil y un cuaderno"/g) || []).length, 2);
  assert.match(html, /siglo21-cierre-acciones/);
  assert.match(html, /siglo21-cierre-foto/);
  assert.match(html, /object-fit:contain/);
  assert.doesNotMatch(html, /src="\/imagenes\/sede.jpg"/);
});

test('otras casas conservan la imagen y el contenedor originales', () => {
  for (const nivel of ['Teclab - Gestión', 'Identidad Argentina']) {
    const html = pintar(nivel);
    assert.equal((html.match(/src="\/imagenes\/sede.jpg"/g) || []).length, 2);
    assert.doesNotMatch(html, /siglo21-cierre-acciones|siglo21-cierre-foto|carreras-de-grado-a-distancia/);
  }
});

test('las acciones de Siglo 21 comparten columnas y conservan superficies táctiles', () => {
  const css = readFileSync('components/index/modales.css', 'utf8');
  assert.match(css, /\.siglo21-cierre-acciones\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /\.siglo21-cierre-acciones > [^{]+\{[^}]*width:\s*100%;[^}]*min-height:\s*44px/);
  assert.match(css, /@media\s*\(min-width:\s*768px\)\s*\{[\s\S]*?\.siglo21-cierre-acciones\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});
