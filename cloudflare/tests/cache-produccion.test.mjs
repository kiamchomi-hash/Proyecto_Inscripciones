import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CANONICO, EDGE_SEGUNDOS, EDGE_SWR_SEGUNDOS,
  claveDeCache, copiaParaGuardar, normalizarParaCache, servirDesdeCopia,
} from '../src/entrega/cache-borde.ts';

// El HTML público se cachea en el borde desde el Worker de producción. La lógica
// vive en `src/entrega/cache-borde.ts` justamente para poder probarla: el entry
// no se puede importar desde node porque arrastra el build de Astro. Abajo
// quedan dos guardias sobre el cableado y, arriba, las pruebas de la función.

const worker = readFileSync(new URL('../produccion/worker.ts', import.meta.url), 'utf8');
const cabeceras = readFileSync(new URL('../src/entrega/cabeceras.ts', import.meta.url), 'utf8');

const url = (ruta) => new URL(`https://${CANONICO}${ruta}`);

const html = (cabecera = 'no-store', status = 200) => new Response('<html></html>', {
  status,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cabecera },
});

test('el HTML público anuncia su TTL de borde y respeta el del navegador', () => {
  const pedido = new Request(url('/').toString());
  const { respuesta, publica } = normalizarParaCache(html(), pedido, url('/'));

  assert.equal(publica, true);
  assert.equal(
    respuesta.headers.get('Cloudflare-CDN-Cache-Control'),
    `public, max-age=${EDGE_SEGUNDOS}, stale-while-revalidate=${EDGE_SWR_SEGUNDOS}`,
  );
  assert.equal(respuesta.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
});

test('no se publica lo que no es 200 HTML de una ruta pública', () => {
  const casos = [
    ['404', html('no-store', 404), '/'],
    ['JSON', new Response('{}', { headers: { 'Content-Type': 'application/json' } }), '/'],
    ['API', html(), '/api/formularios'],
  ];
  for (const [nombre, respuesta, ruta] of casos) {
    const entrada = new Request(url(ruta).toString());
    assert.equal(normalizarParaCache(respuesta, entrada, url(ruta)).publica, false, nombre);
  }
  assert.equal(normalizarParaCache(html(), new Request(url('/').toString(), { method: 'POST' }), url('/')).publica, false);
});

test('una página que fija su propio Cache-Control no se publica ni se toca', () => {
  // Es el agujero que tenía el guardado: miraba sólo status y Content-Type, así
  // que una ruta con `private, no-store` quedaba cacheada 300 s y el guardado le
  // pisaba la cabecera. La decisión se toma una sola vez, en la normalización.
  const propia = html('private, no-store');
  const { respuesta, publica } = normalizarParaCache(
    propia, new Request(url('/contacto').toString()), url('/contacto'),
  );
  assert.equal(publica, false);
  assert.equal(respuesta.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(respuesta.headers.get('Cloudflare-CDN-Cache-Control'), null);
});

test('la clave de caché es sólo GET del dominio canónico y nunca rutas privadas', () => {
  assert.equal(claveDeCache(new Request(url('/').toString(), { method: 'POST' }), url('/')), null);
  assert.equal(
    claveDeCache(new Request('https://preview.workers.dev/'), new URL('https://preview.workers.dev/')),
    null,
  );
  for (const ruta of ['/api', '/api/formularios', '/api/revalidar']) {
    assert.equal(claveDeCache(new Request(url(ruta).toString()), url(ruta)), null, ruta);
  }

  const clave = claveDeCache(new Request(url('/carreras/x?utm=1').toString()), url('/carreras/x?utm=1'));
  assert.equal(clave.method, 'GET');
  assert.equal(clave.url, url('/carreras/x?utm=1').toString());
});

test('la copia se guarda con frescura de borde y se sirve con la del navegador', () => {
  const { respuesta } = normalizarParaCache(html(), new Request(url('/').toString()), url('/'));

  const copia = copiaParaGuardar(respuesta);
  assert.equal(copia.headers.get('Cache-Control'), `public, max-age=${EDGE_SEGUNDOS}`);
  // El original no se toca: `copiaParaGuardar` trabaja sobre un clon.
  assert.equal(respuesta.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');

  const servida = servirDesdeCopia(copia);
  assert.equal(servida.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(
    servida.headers.get('Cloudflare-CDN-Cache-Control'),
    `public, max-age=${EDGE_SEGUNDOS}, stale-while-revalidate=${EDGE_SWR_SEGUNDOS}`,
  );
});

test('el entry cablea la copia y guarda sólo lo que la normalización autorizó', () => {
  assert.match(worker, /caches\?\.default/);
  assert.match(worker, /cacheDeBorde!\.match\(clave\)/);
  assert.match(worker, /servirDesdeCopia\(copia\)/);
  // El guardado no repite la condición por status y tipo: si lo hiciera, una
  // respuesta con `no-store` propio volvería a colarse.
  assert.match(worker, /if \(clave && publica\)/);
  assert.match(worker, /ctx\.waitUntil\(cacheDeBorde!\.put\(clave, copiaParaGuardar\(respuesta\)\)\)/);
});

test('las imágenes y las fuentes salen con TTL propio desde _headers', () => {
  assert.match(cabeceras, /\/imagenes\/\*/);
  assert.match(cabeceras, /\/fuentes\/\*/);
  assert.match(cabeceras, /max-age=86400, stale-while-revalidate=604800/);
});
