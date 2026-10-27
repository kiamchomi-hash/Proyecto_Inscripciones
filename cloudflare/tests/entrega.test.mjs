import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';
import {
  buscarRedireccion, redireccionDeHost, ubicacionRedireccion,
} from '../src/entrega/redirects.ts';
import { aplicarCabeceras, cabecerasAssets, robotsDeRuta } from '../src/entrega/cabeceras.ts';
import { generarRobots, generarSitemap } from '../src/entrega/sitemap-xml.ts';
import {
  CABECERAS_ESPERADAS, HSTS_ESPERADO, NOINDEX,
} from '../../lib/vigilancia-esperado.ts';

const CONFIG = './dist/server/wrangler.json';

// Unidad: serialización, redirects y política de cabeceras. No toca red ni D1.
test('robots.txt reproduce exactamente las reglas de app/robots.ts', () => {
  assert.equal(
    generarRobots(),
    'User-Agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://www.siglo21sur.com/sitemap.xml\n',
  );
});

test('el sitemap serializa igual que Next, con xmlns:image sólo si hay imágenes', () => {
  const simple = generarSitemap([
    { url: 'https://www.siglo21sur.com', changeFrequency: 'monthly', priority: 1 },
  ]);
  assert.equal(simple, '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + '<url>\n<loc>https://www.siglo21sur.com</loc>\n<changefreq>monthly</changefreq>\n<priority>1</priority>\n</url>\n'
    + '</urlset>\n');

  const conImagen = generarSitemap([{
    url: 'https://www.siglo21sur.com/novedades/articulo/x',
    images: ['https://www.siglo21sur.com/imagenes/x.webp'],
    lastModified: '2026-10-24T00:00:00.000Z',
    changeFrequency: 'monthly',
    priority: 0.6,
  }]);
  assert.match(conImagen, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  assert.equal(conImagen.indexOf('<image:image>') < conImagen.indexOf('<lastmod>'), true);
  assert.match(conImagen, /<image:loc>https:\/\/www\.siglo21sur\.com\/imagenes\/x\.webp<\/image:loc>/);
});

test('redirects: códigos exactos, barra final y query conservada', () => {
  const casos = [
    ['/index.html', '/', 308],
    ['/contactos', '/contacto', 308],
    ['/novedades', '/novedades/1', 308],
    ['/carreras', '/', 308],
    ['/clases-apoyo/fisico-quimica', '/clases-apoyo/fisica', 301],
    ['/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto', '/novedades/articulo/inicio-de-clases', 301],
    ['/novedades/articulo/teclab-tecnicaturas-online', '/teclab', 301],
    ['/carrera/licenciatura-en-administracion', '/carreras/licenciatura-en-administracion', 308],
    ['/carreras/licenciatura-en-agroinformatica', '/', 301],
    ['/carreras/tecnicatura-superior-en-fintech', '/', 308],
    ['/carreras/diplomatura-en-inteligencia-artificial', '/', 302],
    ['/carreras/tecnicatura-superior-en-energias-renovables', '/', 301],
    ['/carreras/tecnicatura-superior-en-gestion-de-energias-renovables', '/', 301],
    ['/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos',
      '/carreras/tecnicatura-en-videojuegos', 301],
  ];
  for (const [ruta, destino, estado] of casos) {
    const redireccion = buscarRedireccion(ruta);
    assert.ok(redireccion, ruta);
    assert.equal(redireccion.estado, estado, ruta);
    assert.equal(redireccion.destino, destino, ruta);
    assert.equal(ubicacionRedireccion(redireccion, '?origen=prueba'), `${destino}?origen=prueba`, ruta);
    // La barra final se normaliza antes de buscar, como en Next.
    const conBarra = buscarRedireccion(`${ruta}/`);
    assert.equal(conBarra?.destino ?? destino, destino, `${ruta}/`);
  }

  // Rutas que no son un redirect de config: la ficha existe o está diferida.
  for (const ruta of [
    '/carreras/licenciatura-en-administracion',
    '/carreras/licenciatura-en-administracion/inscripcion',
    '/carrera/una/ruta/con/barras',
    '/no-existe',
  ]) {
    assert.equal(buscarRedireccion(ruta), null, ruta);
  }
});

test('redirects de host: apex y alias al dominio propio, sin bucles ni localhost', () => {
  for (const host of ['siglo21sur.com', 'siglo21sur.com:443', 'proyecto-inscripciones.vercel.app']) {
    const redireccion = redireccionDeHost(host, '/carreras/x');
    assert.deepEqual(redireccion, { destino: 'https://www.siglo21sur.com/carreras/x', estado: 308 }, host);
    assert.equal(ubicacionRedireccion(redireccion, '?a=1'),
      'https://www.siglo21sur.com/carreras/x?a=1', host);
  }
  for (const host of ['www.siglo21sur.com', '127.0.0.1:4329', 'localhost:4329', 'preview.example']) {
    assert.equal(redireccionDeHost(host, '/'), null, host);
  }
});

test('X-Robots-Tag se decide por ruta: público sin noindex, privado y 404 con noindex', () => {
  const casos = [
    ['/', 200, null],
    ['/carreras/licenciatura-en-administracion', 200, null],
    ['/novedades/1', 200, null],
    ['/api/formularios', 405, 'noindex'],
    ['/imagenes', 200, 'noindex, nofollow'],
    ['/carreras/licenciatura-en-administracion/inscripcion', 200, 'noindex, follow'],
    ['/no-existe', 404, 'noindex, nofollow'],
  ];
  for (const [ruta, estado, esperado] of casos) {
    assert.equal(robotsDeRuta(ruta, estado), esperado, ruta);
  }
  // La autoinscripción se dio de baja el 27/10/2026: ninguna ruta `/inscripcion/`
  // tiene regla propia; si no existe, la cubre el 404.
  assert.equal(robotsDeRuta('/inscripcion/codigo', 404), 'noindex, nofollow');
  assert.equal(robotsDeRuta('/inscripcion/codigo', 200), null);

  // No pisa lo que la ruta ya decidió (no-referrer y cache propio), y agrega
  // las cabeceras globales que sí vienen de next.config.ts.
  const original = new Response('x', { status: 200, headers: {
    'Cache-Control': 'public, max-age=0, must-revalidate', 'Referrer-Policy': 'no-referrer',
  } });
  const respuesta = aplicarCabeceras(original, { ruta: '/carreras/licenciatura-en-administracion/inscripcion', estado: 200 });
  assert.equal(respuesta.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(respuesta.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(respuesta.headers.get('X-Robots-Tag'), 'noindex, follow');
  assert.match(respuesta.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  assert.equal(respuesta.headers.get('Strict-Transport-Security'),
    'max-age=63072000; includeSubDomains; preload');
});

test('_headers de assets lleva seguridad y cache, sin cabeceras de HTML', () => {
  const contenido = cabecerasAssets();
  assert.match(contenido, /^\/\*\n/m);
  assert.match(contenido, /Content-Security-Policy: .*frame-ancestors 'none'/);
  assert.match(contenido, /Strict-Transport-Security: max-age=63072000/);
  assert.match(contenido, /X-Content-Type-Options: nosniff/);
  assert.match(contenido, /\/_astro\/\*\n  Cache-Control: public, max-age=31536000, immutable/);
  assert.doesNotMatch(contenido, /X-Robots-Tag|no-store/i);
});

// Integración: build compilado en workerd y D1 efímero, sin red externa.
test('sitemap, robots y cabeceras reales en el build compilado', async t => {
  assert.ok(existsSync(CONFIG),
    'Falta el build de Astro: correr `npm --prefix cloudflare run build` antes de test:entrega.');
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);

  const sitemap = await astro.fetch('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.equal(sitemap.headers.get('content-type'), 'application/xml');
  assert.equal(sitemap.headers.get('x-robots-tag'), null);
  assert.equal(sitemap.headers.get('cache-control'), 'no-store');
  assert.match(sitemap.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const xml = await sitemap.text();
  const locales = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.deepEqual(locales, [
    'https://www.siglo21sur.com',
    'https://www.siglo21sur.com/teclab',
    'https://www.siglo21sur.com/teclab/inscripcion',
    'https://www.siglo21sur.com/teclab/test-vocacional',
    'https://www.siglo21sur.com/clases-apoyo',
    'https://www.siglo21sur.com/contacto',
    'https://www.siglo21sur.com/faq',
    'https://www.siglo21sur.com/test-vocacional',
    'https://www.siglo21sur.com/calendario-academico',
    'https://www.siglo21sur.com/sobre-nosotros',
    'https://www.siglo21sur.com/carreras/licenciatura-en-administracion',
    'https://www.siglo21sur.com/carreras/contador-publico',
    'https://www.siglo21sur.com/carreras/tecnicatura-superior-en-programacion',
    'https://www.siglo21sur.com/carreras/tecnicatura-en-desarrollo-de-software',
    'https://www.siglo21sur.com/carreras/curso-de-inteligencia-artificial',
    // Identidad Argentina vuelve a indexarse desde el 26/10/2026: va al sitemap.
    'https://www.siglo21sur.com/carreras/diplomatura-en-oratoria',
    'https://www.siglo21sur.com/carreras/tecnicatura-en-programacion',
    'https://www.siglo21sur.com/clases-apoyo/matematica',
    'https://www.siglo21sur.com/clases-apoyo/computacion',
    'https://www.siglo21sur.com/novedades/1',
    'https://www.siglo21sur.com/novedades/2',
    'https://www.siglo21sur.com/novedades/3',
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17]
      .map(id => `https://www.siglo21sur.com/novedades/articulo/novedad-sintetica-${id}`),
  ]);
  for (const excluida of [
    '/carreras/maestria-en-gestion-educativa',
    '/carreras/licenciatura-en-agroinformatica', '/clases-apoyo/arte',
    '/clases-apoyo/oculta', '/novedades/articulo/novedad-sintetica-13', '/novedades/4',
    '/api/', '.env',
  ]) {
    assert.ok(!locales.some(url => url.includes(excluida)), `${excluida} no debe publicarse`);
  }
  assert.match(xml, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);

  const robots = await astro.fetch('/robots.txt');
  assert.equal(robots.status, 200);
  assert.equal(robots.headers.get('content-type'), 'text/plain');
  assert.equal(robots.headers.get('x-robots-tag'), null);
  assert.equal(robots.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
  assert.equal(await robots.text(), generarRobots());

  // Cabeceras globales en HTML, y ninguna en los redirects (como Next).
  const home = await astro.fetch('/');
  assert.equal(home.status, 200);
  for (const [cabecera, valor] of [
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
    ['permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
    ['strict-transport-security', 'max-age=63072000; includeSubDomains; preload'],
  ]) {
    assert.equal(home.headers.get(cabecera), valor, cabecera);
  }
  assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(home.headers.get('x-robots-tag'), null);

  // La lista que vigila producción (`lib/vigilancia-esperado.ts`) se cumple
  // sobre la home y sobre las rutas que exige noindex, sin relajarla.
  for (const [cabecera, patron] of Object.entries(CABECERAS_ESPERADAS)) {
    assert.match(home.headers.get(cabecera) ?? '', patron, cabecera);
  }
  assert.match(home.headers.get('strict-transport-security') ?? '', HSTS_ESPERADO);
  const respuestasNoindex = {
    '/api/formularios': await astro.fetch('/api/formularios', { method: 'POST' }),
    '/carreras/tecnicatura-superior-en-programacion/inscripcion':
      await astro.fetch('/carreras/tecnicatura-superior-en-programacion/inscripcion'),
  };
  for (const [ruta, patron] of NOINDEX) {
    const respuesta = respuestasNoindex[ruta];
    assert.ok(respuesta, ruta);
    assert.match(respuesta.headers.get('x-robots-tag') ?? '', patron, ruta);
  }

  const noExiste = await astro.fetch('/no-existe');
  assert.equal(noExiste.status, 404);
  assert.equal(noExiste.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(noExiste.headers.get('cache-control'), 'no-store');

  const api = await astro.fetch('/api/formularios', { method: 'POST' });
  assert.equal(api.status, 400);
  assert.equal(api.headers.get('x-robots-tag'), 'noindex');
  assert.equal((await astro.fetch('/imagenes')).headers.get('x-robots-tag'), 'noindex, nofollow');
  const inscripcion = await astro.fetch('/carreras/licenciatura-en-administracion/inscripcion');
  assert.equal(inscripcion.headers.get('x-robots-tag'), 'noindex, follow');
  // La autoinscripción se dio de baja el 27/10/2026: la ruta del enlace ya no existe.
  assert.equal((await astro.fetch('/inscripcion/EnlaceSinteticoLocal1234567890ABCD')).status, 404);

  // Assets: Workers Assets los sirve fuera del Worker; `_headers` les lleva
  // seguridad y cache, pero no X-Robots-Tag ni no-store de HTML.
  for (const ruta of ['/favicon.ico', '/imagenes/og/default.jpg']) {
    const asset = await astro.fetch(ruta);
    assert.equal(asset.status, 200, ruta);
    assert.equal(asset.headers.get('x-robots-tag'), null, ruta);
    assert.notEqual(asset.headers.get('cache-control'), 'no-store', ruta);
    assert.equal(asset.headers.get('strict-transport-security'),
      'max-age=63072000; includeSubDomains; preload', ruta);
    assert.match(asset.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.doesNotMatch(asset.headers.get('content-type') ?? '', /text\/html/, ruta);
  }
  assert.ok(readFileSync(new URL('../dist/client/_headers', import.meta.url), 'utf8').includes('Content-Security-Policy'));
});

test('sitemap con D1 vacío: sólo las páginas fijas y /novedades/1', async t => {
  assert.ok(existsSync(CONFIG), 'Falta el build de Astro.');
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  await astro.getWorker().applyD1Migrations('DB');

  const respuesta = await astro.fetch('/sitemap.xml');
  assert.equal(respuesta.status, 200);
  const locales = [...(await respuesta.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.deepEqual(locales, [
    'https://www.siglo21sur.com',
    'https://www.siglo21sur.com/teclab',
    'https://www.siglo21sur.com/teclab/inscripcion',
    'https://www.siglo21sur.com/teclab/test-vocacional',
    'https://www.siglo21sur.com/clases-apoyo',
    'https://www.siglo21sur.com/contacto',
    'https://www.siglo21sur.com/faq',
    'https://www.siglo21sur.com/test-vocacional',
    'https://www.siglo21sur.com/calendario-academico',
    'https://www.siglo21sur.com/sobre-nosotros',
    'https://www.siglo21sur.com/novedades/1',
  ]);
  assert.equal((await astro.fetch('/robots.txt')).status, 200);
});

test('redirects y códigos reales desde el Worker, con query y sin seguir el salto', async t => {
  assert.ok(existsSync(CONFIG), 'Falta el build de Astro.');
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  await astro.getWorker().applyD1Migrations('DB');
  await insertarCatalogo((await astro.getWorker().getEnv()).DB);

  const casos = [
    ['/index.html?x=1', 308, '/?x=1'],
    ['/contactos?x=1', 308, '/contacto?x=1'],
    ['/novedades?pagina=2', 308, '/novedades/1?pagina=2'],
    ['/carreras?y=2', 308, '/?y=2'],
    ['/carrera/licenciatura-en-administracion?q=1', 308, '/carreras/licenciatura-en-administracion?q=1'],
    ['/clases-apoyo/fisico-quimica?z=3', 301, '/clases-apoyo/fisica?z=3'],
    ['/novedades/articulo/teclab-tecnicaturas-online?z=2', 301, '/teclab?z=2'],
    ['/carreras/licenciatura-en-agroinformatica?q=1', 301, '/?q=1'],
    ['/carreras/diplomatura-en-inteligencia-artificial', 302, '/'],
    ['/carreras/tecnicatura-superior-en-energias-renovables', 301, '/'],
    ['/carreras/tecnicatura-superior-en-gestion-de-energias-renovables', 301, '/'],
    ['/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos', 301,
      '/carreras/tecnicatura-en-videojuegos'],
  ];
  for (const [ruta, estado, destino] of casos) {
    const respuesta = await astro.fetch(ruta, { redirect: 'manual' });
    assert.equal(respuesta.status, estado, ruta);
    assert.equal(respuesta.headers.get('location'), destino, ruta);
    // Next no agrega cabeceras de seguridad a un redirect de config.
    assert.equal(respuesta.headers.get('content-security-policy'), null, ruta);
    assert.equal(respuesta.headers.get('x-robots-tag'), null, ruta);
  }
});
