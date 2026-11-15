import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const { default: AvisoCompartir } = cargarTypescript('components/index/aviso-compartir.tsx', {});

const compartir = cargarTypescript('components/index/use-compartir.ts', {});
const { default: CopyLinkButton } = cargarTypescript('components/novedades/copy-link-button.tsx', {
  '@/components/index/use-compartir': compartir,
  '@/components/index/aviso-compartir': { default: AvisoCompartir, __esModule: true },
  '@/components/index/icono-compartir': {
    default: props => React.createElement('svg', { 'data-estado': props.estado }),
    __esModule: true,
  },
});

test('el aviso de compartir anuncia cada resultado y calla cuando no pasó nada', () => {
  const pintar = estado => renderToStaticMarkup(React.createElement(AvisoCompartir, { estado }));
  assert.match(pintar('copiado'), /role="status"[^>]*>Enlace copiado</);
  assert.match(pintar('error'), /role="status"[^>]*>No se pudo copiar el enlace</);
  assert.doesNotMatch(pintar('idle'), /Enlace copiado|No se pudo copiar/);
});

test('la región viva del botón de copiar queda fuera del botón', () => {
  const html = renderToStaticMarkup(React.createElement(CopyLinkButton, { url: 'https://example.test/a' }));
  const boton = html.match(/<button[\s\S]*?<\/button>/)?.[0] ?? '';
  assert.ok(boton, 'falta el botón');
  assert.doesNotMatch(boton, /aria-live/);
  assert.doesNotMatch(boton, /role="status"/);
  assert.match(html.slice(html.indexOf('</button>')), /role="status"/);
});
