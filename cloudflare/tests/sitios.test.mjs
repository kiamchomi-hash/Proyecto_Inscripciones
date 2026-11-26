import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_IDENTIDAD, BASE_PRINCIPAL, baseDeSitio, destinoFueraDeIdentidad,
  normalizarHost, rutaConocidaDelPrincipal, rutaDeIdentidadPermitida, sitioDe,
} from '../src/entrega/sitios.ts';
import { generarRobots } from '../src/entrega/sitemap-xml.ts';

test('el sitio se decide por APP_SITIO y, en local, por el host', () => {
  assert.equal(sitioDe('www.siglo21sur.com'), 'principal');
  assert.equal(sitioDe('siglo21sur.com'), 'principal');
  assert.equal(sitioDe('localhost:4329'), 'principal');
  assert.equal(sitioDe('topykly.com'), 'identidad');
  assert.equal(sitioDe('www.topykly.com:443'), 'identidad');
  assert.equal(sitioDe('localhost:4329', 'identidad'), 'identidad');
  assert.equal(sitioDe('topykly.com', 'principal'), 'principal');
  assert.equal(normalizarHost(' WWW.TOPYKLY.COM:443 '), 'www.topykly.com');
  assert.equal(baseDeSitio('principal'), BASE_PRINCIPAL);
  assert.equal(baseDeSitio('identidad'), BASE_IDENTIDAD);
});

test('topykly sirve sólo su portada, sus fichas, las APIs y los assets', () => {
  for (const ruta of [
    '/', '/robots.txt', '/sitemap.xml',
    '/carreras/diplomatura-en-oratoria',
    '/carreras/diplomatura-en-oratoria/',
    '/carreras/diplomatura-en-oratoria/inscripcion',
    '/api/formularios', '/api/estado',
    '/_astro/pagina.css', '/imagenes/og/default.jpg', '/derivados/x-960.webp',
    '/fuentes/inter-latin.woff2', '/folletos/alta.pdf',
    '/favicon.ico', '/icon-192.png', '/apple-touch-icon.png',
  ]) {
    assert.equal(rutaDeIdentidadPermitida(ruta), true, ruta);
  }
  for (const ruta of [
    '/contacto', '/teclab', '/clases-apoyo', '/novedades/1', '/sobre-nosotros',
    '/carreras', '/llms.txt', '/index.md', '/planes/x.pdf', '/tema/1/x',
  ]) {
    assert.equal(rutaDeIdentidadPermitida(ruta), false, ruta);
  }
});

test('lo que no es de topykly vuelve al CAU o a la portada nueva', () => {
  assert.equal(destinoFueraDeIdentidad('/'), null);
  assert.equal(destinoFueraDeIdentidad('/carreras/diplomatura-en-oratoria'), null);

  assert.deepEqual(destinoFueraDeIdentidad('/contacto', '?a=1'),
    { destino: `${BASE_PRINCIPAL}/contacto?a=1`, estado: 301 });
  assert.deepEqual(destinoFueraDeIdentidad('/teclab/test-vocacional'),
    { destino: `${BASE_PRINCIPAL}/teclab/test-vocacional`, estado: 301 });

  // El chat viejo no tiene equivalente: su tráfico aterriza en la portada nueva.
  assert.deepEqual(destinoFueraDeIdentidad('/tema/123/una-charla', '?x=1'),
    { destino: `${BASE_IDENTIDAD}/`, estado: 301 });
  assert.deepEqual(destinoFueraDeIdentidad('/index.md'),
    { destino: `${BASE_IDENTIDAD}/`, estado: 301 });
});

test('cada sitio anuncia su propio sitemap en robots.txt', () => {
  assert.match(generarRobots(), /Sitemap: https:\/\/www\.siglo21sur\.com\/sitemap\.xml\n$/);
  assert.match(generarRobots(BASE_IDENTIDAD),
    /Sitemap: https:\/\/topykly\.com\/sitemap\.xml\n$/);
});

test('los prefijos del CAU no se confunden con rutas de topykly', () => {
  for (const ruta of ['/contacto', '/contacto/x', '/teclab', '/novedades/1', '/imagenes/x']) {
    assert.equal(rutaConocidaDelPrincipal(ruta), true, ruta);
  }
  for (const ruta of ['/contacto2', '/teclabx', '/tema/1/x', '/']) {
    assert.equal(rutaConocidaDelPrincipal(ruta), false, ruta);
  }
});
