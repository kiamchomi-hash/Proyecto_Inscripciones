import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const icono = props => React.createElement('svg', props);
const { default: FaqPage } = cargarTypescript('components/faq-page.tsx', {
  './icons': {
    WhatsAppIcon: icono,
    FacebookIcon: icono,
    InstagramIcon: icono,
    ChevronDownIcon: icono,
  },
  '@/components/turnstile-widget': { default: () => null, __esModule: true },
  '@/lib/sede': { MAPS_URL: 'https://example.test/mapa', MAPS_EMBED_SRC: 'https://example.test/embed', MAPS_TITLE: 'Mapa' },
  '@/lib/analytics': { trackPreguntaFaq: () => {} },
});

test('cada pregunta del FAQ controla un panel que existe', () => {
  const html = renderToStaticMarkup(React.createElement(FaqPage));
  const controles = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(m => m[1]);
  assert.ok(controles.length > 3, `se esperaban varios paneles, hay ${controles.length}`);
  for (const id of controles) {
    assert.ok(html.includes(`id="${id}"`), `falta el panel ${id}`);
  }
  const gatillos = [...html.matchAll(/aria-expanded="[^"]*"/g)].length;
  assert.equal(controles.length, gatillos);
});
