import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as tipos from '../components/index/types.ts';
import * as teclab from '../components/index/teclab.ts';
import * as adaptadores from '../lib/datos/carrera-detalle.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const vacio = () => null;
const dependencias = {
  '@/components/index/types': tipos,
  '@/components/index/teclab': teclab,
  '@/lib/whatsapp': { numeroWhatsAppDe: () => '5491100000000' },
  'next/image': { default: vacio, __esModule: true },
  'next/link': { default: ({ children, prefetch: _prefetch, ...props }) => React.createElement('a', props, children), __esModule: true },
  '@/components/index/identidad-argentina': { getEscuelaIA: () => null },
  '@/components/index/ia-isotipo': { default: vacio, __esModule: true },
  '@/components/index/aviso-inicio-teclab': { default: vacio, __esModule: true },
  './career-info-button': { default: vacio, __esModule: true },
  './sticky-enrollment-cta': { default: vacio, __esModule: true },
  './resaltar-inscripcion': { default: vacio, __esModule: true },
};
dependencias['./career-content'] = cargarTypescript('components/carreras/career-content.ts', dependencias);
dependencias['./inscripcion-carrera'] = cargarTypescript('components/carreras/inscripcion-carrera.tsx', dependencias);
const CareerDetail = cargarTypescript('components/carreras/career-detail.tsx', dependencias).default;
const faq = { type: 'faq', items: [{ pregunta: '¿Qué hace <script>un procurador</script>?', respuesta: 'Gestiona expedientes & documentación.' }] };
const carrera = { id: 87, nombre: 'Procurador', nivel: 'Pregrado', prefix: 'Pregrado', nombre_corto: 'Procurador', duracion: '3 años', titulo: 'Procurador/a', modalidad: 'Distancia', descripcion: 'Gestioná expedientes.', enfoque: '', slides: null, plan_estudios: null, seccion_modalidad: null, seccion_duracion: null };

// RED observable antes de implementar: el discriminante FAQ todavía se rechaza.
test('FAQ valida texto obligatorio, proyecta sólo su contrato y no muta la entrada', () => {
  const entrada = [{ ...faq, interno: 'privado', items: [{ ...faq.items[0], nota: 'privada' }] }];
  const copia = structuredClone(entrada);
  assert.deepEqual(adaptadores.validarSlides(entrada, 87), [faq]);
  assert.deepEqual(entrada, copia);
  for (const invalida of [null, [], [{ pregunta: '', respuesta: 'Sí' }], [{ pregunta: '¿Qué?', respuesta: '  ' }], [{ pregunta: 3, respuesta: 'Sí' }]]) {
    assert.throws(() => adaptadores.validarSlides([{ type: 'faq', items: invalida }], 87), adaptadores.ErrorDetalleCarrera);
  }
  assert.throws(() => adaptadores.validarSlides([faq, faq], 87), adaptadores.ErrorDetalleCarrera);
});

test('FAQ se renderiza en HTML SSR, escapada y con controles nativos sin JavaScript', () => {
  const html = renderToStaticMarkup(React.createElement(CareerDetail, { carrera: { ...carrera, slides: [faq] }, relacionadas: [] }));
  assert.match(html, /id="preguntas-frecuentes"/);
  assert.match(html, /<details[^>]*><summary/);
  assert.match(html, /&lt;script&gt;un procurador&lt;\/script&gt;/);
  assert.match(html, /expedientes &amp; documentación/);
  assert.doesNotMatch(html, /<script>un procurador/);
  assert.match(html, /href="#preguntas-frecuentes"/);
  assert.doesNotMatch(readFileSync('components/carreras/career-detail.tsx', 'utf8'), /^['"]use client['"]/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(CareerDetail, { carrera, relacionadas: [] })), /preguntas-frecuentes|<details/);
});

test('FAQ no suma pantallas vacías al carrusel ni cambia el modal Teclab', () => {
  const carousel = cargarTypescript('components/index/carousel-modal.tsx', {
    './types': tipos, '@/lib/sanitize-content': {}, '@/components/carreras/career-content': {},
    './use-compartir': {}, './icono-compartir': {}, '@/components/formularios/elegir-carrera': {},
  });
  const portada = { type: 'portada', bullets: [] };
  assert.deepEqual(carousel.slidesDelCarrusel([portada, faq, { type: 'modalidad' }, { type: 'evaluacion' }]), [portada]);
  const modal = cargarTypescript('components/index/career-info-modal.tsx', {
    './teclab': teclab,
    'next/dynamic': { default: cargador => cargador.toString(), __esModule: true },
  }).default;
  const c = { ...carrera, nivel: 'Teclab - Gestión' };
  assert.equal(modal({ carrera: c, onClose: vacio }).type, modal({ carrera: { ...c, slides: [faq] }, onClose: vacio }).type);
});

test('Gestión Contable informa equivalencias evaluadas sin cambiar otras articulaciones', () => {
  const contable = { ...carrera, id: 227, nombre: 'Tecnicatura Superior en Gestión Contable', nivel: 'Teclab - Gestión' };
  const html = renderToStaticMarkup(React.createElement(CareerDetail, { carrera: contable, relacionadas: [] }));
  assert.match(html, /Las equivalencias se evalúan según tu trayectoria académica/);
  assert.doesNotMatch(html, /no repetís ninguna|reconociendo todas/);
  const otra = { ...contable, id: 226, nombre: 'Tecnicatura Superior en Programación' };
  assert.match(renderToStaticMarkup(React.createElement(CareerDetail, { carrera: otra, relacionadas: [] })), /no repetís ninguna/);
  const seguros = { ...contable, id: 228, nombre: 'Tecnicatura Superior en Seguros' };
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(CareerDetail, { carrera: seguros, relacionadas: [] })), /career-oficial-articulacion/);
});
