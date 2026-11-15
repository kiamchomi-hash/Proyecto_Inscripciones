import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as whatsapp from '../lib/whatsapp.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

let ruta = '/';
const componente = etiqueta => function ComponentePrueba(props) {
  return React.createElement(etiqueta, props);
};
const { default: Navbar } = cargarTypescript('components/navbar.tsx', {
  'next/link': { default: componente('a') },
  'next/image': { default: componente('img') },
  'next/navigation': { usePathname: () => ruta },
  '@/lib/rutas-preinscripcion': { esRutaPreinscripcion: () => false },
  '@/lib/whatsapp': whatsapp,
  './icons': { WhatsAppIcon: componente('svg'), FacebookIcon: componente('svg'), InstagramIcon: componente('svg') },
});

test('navbar identifica la página exacta y la sección de rutas internas', () => {
  for (const [actual, href, estado] of [
    ['/faq', '/faq', 'page'],
    ['/teclab', '/teclab', 'page'],
    ['/teclab/test-vocacional', '/teclab', 'location'],
    ['/carreras/abogacia', '/', 'location'],
  ]) {
    ruta = actual;
    const html = renderToStaticMarkup(React.createElement(Navbar));
    const enlaces = [...html.matchAll(/<a\b[^>]*>/g)].map(m => m[0]);
    const enlace = enlaces.find(a => a.includes(`href="${href}"`));
    assert.ok(enlace, `falta ${href}`);
    assert.match(enlace, new RegExp(`aria-current="${estado}"`), actual);
    assert.equal(enlaces.filter(a => a.includes('aria-current=')).length, 1);
  }
});
