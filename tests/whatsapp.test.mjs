import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as whatsapp from '../lib/whatsapp.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const enlace = props => React.createElement('a', props);
const imagen = props => React.createElement('img', props);
const icono = props => React.createElement('svg', props);
const { default: Footer } = cargarTypescript('components/footer.tsx', {
  'next/link': { default: enlace },
  'next/image': { default: imagen },
  '@/lib/sede': { MAPS_URL: 'https://example.test/mapa' },
  '@/lib/whatsapp': whatsapp,
  './footer-teclab.css': {},
});
const { default: Navbar } = cargarTypescript('components/navbar.tsx', {
  'next/link': { default: enlace },
  'next/image': { default: imagen },
  'next/navigation': { usePathname: () => '/teclab' },
  '@/lib/rutas-preinscripcion': { esRutaPreinscripcion: () => false },
  '@/lib/whatsapp': whatsapp,
  './icons': { WhatsAppIcon: icono, FacebookIcon: icono, InstagramIcon: icono },
});

function enlacesWhatsApp(html) {
  return [...html.matchAll(/<a\b[^>]*href="https:\/\/wa\.me\/([^?"]+)[^"]*"[^>]*>/g)];
}

test('todos los enlaces del footer Teclab llevan al número solicitado', () => {
  const enlaces = enlacesWhatsApp(renderToStaticMarkup(React.createElement(Footer, { casa: 'teclab' })));
  assert.equal(enlaces.length, 2);
  for (const enlace of enlaces) assert.equal(enlace[1], '5491166522722');
});

test('el footer de Siglo 21 conserva el número del CAU', () => {
  for (const enlace of enlacesWhatsApp(renderToStaticMarkup(React.createElement(Footer)))) {
    assert.equal(enlace[1], '5491132973801');
  }
});

test('navbar móvil y escritorio ofrecen el destino Teclab con la misma marca contextual', () => {
  const enlaces = enlacesWhatsApp(renderToStaticMarkup(React.createElement(Navbar)));
  const teclab = enlaces.filter(enlace => /class="[^"]*marca-teclab/.test(enlace[0]));
  const cau = enlaces.filter(enlace => /class="[^"]*marca-cau/.test(enlace[0]));
  assert.equal(teclab.length, 2);
  assert.equal(cau.length, 2);
  for (const enlace of teclab) assert.equal(enlace[1], '5491166522722');
  for (const enlace of cau) assert.equal(enlace[1], '5491132973801');
  const css = readFileSync('app/navbar.css', 'utf8');
  assert.match(css, /\.navbar-social-icon\.marca-teclab,\s*\.menu-footer-social a\.marca-teclab \{ display: none; \}/);
  assert.match(css, /body:has\(\.teclab-page, \.ficha-teclab, \.tvt-page\) \.navbar-social-icon\.marca-teclab,\s*body:has\(\.teclab-page, \.ficha-teclab, \.tvt-page\) \.menu-footer-social a\.marca-teclab \{ display: flex; \}/);
  assert.match(css, /body:has\(\.teclab-page, \.ficha-teclab, \.tvt-page\) \.marca-cau \{ display: none; \}/);
  assert.match(css, /body:has\(\.teclab-page, \.ficha-teclab, \.tvt-page\) \.marca-teclab \{ display: block; \}/);
});
