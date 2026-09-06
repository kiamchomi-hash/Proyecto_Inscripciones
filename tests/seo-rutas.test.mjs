import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.ts';
import { resolverRutaSeo, consolidarFilasSeo } from '../herramientas/seo-rutas.mjs';

const base = 'https://www.siglo21sur.com';
const resolver = resolverRutaSeo(await config.redirects());

test('los redirects reales consolidan renombres y conservan las bajas fuera de la home', () => {
  assert.equal(resolver('/carreras/diplomatura-en-fraude-financiero-y-digital'), '/carreras/diplomatura-en-prevencion-de-fraude-financiero-y-digital');
  assert.equal(resolver('/carreras/tecnicatura-superior-en-customer-experience'), '/carreras/tecnicatura-superior-en-experiencia-del-cliente');
  assert.equal(resolver('/carreras/licenciatura-en-agroinformatica'), '/carreras/licenciatura-en-agroinformatica');
  assert.equal(resolver('/novedades/articulo/teclab-tecnicaturas-online'), '/teclab');
});

test('se suman clics e impresiones y se ponderan posiciones por consulta y destino', () => {
  const filas = [
    { keys: ['consulta', base + '/novedades/articulo/teclab-tecnicaturas-online'], clicks: 2, impressions: 20, position: 10 },
    { keys: ['consulta', base + '/teclab'], clicks: 8, impressions: 80, position: 5 },
    { keys: ['otra consulta', base + '/teclab'], clicks: 0, impressions: 10, position: 30 },
  ];
  const salida = consolidarFilasSeo(filas, 1, resolver, base);
  assert.equal(salida.length, 2);
  assert.equal(salida[0].clicks, 10);
  assert.equal(salida[0].impressions, 100);
  assert.equal(salida[0].position, 6);
  assert.equal(salida[0].ctr, 0.1);
  assert.equal(filas[0].keys[1], base + '/novedades/articulo/teclab-tecnicaturas-online');
});

test('una cadena hacia la home o un ciclo no absorbe filas de bajas', () => {
  const r = resolverRutaSeo([{ source: '/a', destination: '/b' }, { source: '/b', destination: '/' }]);
  assert.equal(r('/a'), '/a');
  const ciclo = resolverRutaSeo([{ source: '/a', destination: '/b' }, { source: '/b', destination: '/a' }]);
  assert.equal(ciclo('/a'), '/a');
});
