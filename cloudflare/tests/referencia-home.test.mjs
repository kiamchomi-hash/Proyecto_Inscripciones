import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';
import { canonical, enlacesDe, idioma, jsonLd, metas, textoPrincipal, titulo } from './helpers/html.mjs';
import { proyectarPagina, RUTAS_REFERENCIA } from './helpers/referencias-rutas.mjs';

const META = ['description', 'author', 'creator', 'og:type', 'og:locale', 'og:url', 'og:site_name',
  'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt',
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'google-site-verification'];

test('home del Worker coincide con la referencia estable de Next', async t => {
  const referencia = JSON.parse(await readFile(new URL('./fixtures/paridad/home.json', import.meta.url), 'utf8'));
  const astro = createTestHarness({ workers: [{ configPath: './dist/server/wrangler.json' }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);
  const respuesta = await astro.fetch('/');
  assert.equal(respuesta.status, 200);
  const html = await respuesta.text();
  assert.equal(idioma(html), referencia.idioma);
  assert.equal(titulo(html), referencia.titulo);
  assert.equal(canonical(html), referencia.canonical);
  const actuales = metas(html);
  for (const clave of META) assert.equal(actuales[clave], referencia.metas[clave], `meta ${clave}`);
  assert.deepEqual(jsonLd(html), referencia.jsonLd);
  assert.equal(textoPrincipal(html), referencia.texto);
  assert.deepEqual(enlacesDe(html, { apertura: /<main\b/, cierre: '</main>' }).sort(), referencia.enlaces);
  assert.deepEqual(enlacesDe(html, { apertura: /<nav\b[^>]*class="main-navbar"/, cierre: '</nav>' }).sort(), referencia.navegacion);
  assert.deepEqual(enlacesDe(html, { apertura: /<footer\b/, cierre: '</footer>' }).sort(), referencia.pie);
});

test('sitemap y robots del Worker coinciden con las referencias estables de Next', async t => {
  const astro = createTestHarness({ workers: [{ configPath: './dist/server/wrangler.json' }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);
  for (const ruta of ['sitemap.xml', 'robots.txt']) {
    const referencia = await readFile(new URL(`./fixtures/paridad/${ruta}`, import.meta.url), 'utf8');
    const respuesta = await astro.fetch(`/${ruta}`);
    assert.equal(respuesta.status, 200, ruta);
    assert.equal(await respuesta.text(), referencia, ruta);
    assert.equal(respuesta.headers.get('x-robots-tag'), null, ruta);
  }
});

test('las rutas del Worker coinciden con las referencias estables de Next', async t => {
  const referencias = JSON.parse(await readFile(new URL('./fixtures/paridad/rutas.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(referencias).sort(), RUTAS_REFERENCIA.map(r => r.ruta).sort());
  const astro = createTestHarness({ workers: [{ configPath: './dist/server/wrangler.json' }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);
  for (const especificacion of RUTAS_REFERENCIA) {
    const respuesta = await astro.fetch(especificacion.ruta);
    assert.equal(respuesta.status, 200, especificacion.ruta);
    const actual = proyectarPagina(await respuesta.text(), especificacion);
    for (const campo of Object.keys(referencias[especificacion.ruta])) {
      assert.deepEqual(actual[campo], referencias[especificacion.ruta][campo], `${especificacion.ruta}: ${campo}`);
    }
  }
});

test('errores y redirects de carreras y novedades conservan el contrato', async t => {
  const astro = createTestHarness({ workers: [{ configPath: './dist/server/wrangler.json' }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);
  const casos = [
    ...['/novedades/0', '/novedades/01', '/novedades/1abc', '/novedades/-1', '/novedades/4',
      '/novedades/articulo/novedad-sintetica-13', '/novedades/articulo/inexistente',
      '/novedades/articulo/NOVEDAD-SINTETICA-1', '/clases-apoyo/oculta', '/clases-apoyo/inexistente',
      '/carreras/maestria-en-gestion-educativa', '/carreras/diplomatura-en-oratoria/inscripcion',
      '/carreras/tecnicatura-en-desarrollo-de-software/inscripcion'].map(ruta => [ruta, 404]),
    ['/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto?origen=local', 301, '/novedades/articulo/inicio-de-clases?origen=local'],
    ['/novedades/articulo/teclab-tecnicaturas-online?origen=local', 301, '/teclab?origen=local'],
    ['/carreras/LICENCIATURA_EN_ADMINISTRACION', 308, '/carreras/licenciatura-en-administracion'],
    ['/carreras/LICENCIATURA_EN_ADMINISTRACION/inscripcion', 308, '/carreras/licenciatura-en-administracion/inscripcion'],
    ['/carreras/licenciatura-en-agroinformatica', 301, '/'],
    ['/carreras/diplomatura-en-inteligencia-artificial', 302, '/'],
    ['/carreras/tecnicatura-superior-en-customer-experience', 301, '/carreras/tecnicatura-superior-en-experiencia-del-cliente'],
    ['/carreras/tecnicatura-superior-en-energias-renovables', 301, '/'],
    ['/carreras/tecnicatura-superior-en-gestion-de-energias-renovables', 301, '/'],
  ];
  for (const [ruta, estado, destino] of casos) {
    const respuesta = await astro.fetch(ruta, { redirect: 'manual' });
    assert.equal(respuesta.status, estado, ruta);
    if (destino) {
      const ubicacion = new URL(respuesta.headers.get('location'), 'https://ejemplo.invalid');
      assert.equal(ubicacion.pathname + ubicacion.search, destino, ruta);
    }
  }
});

test('el logo de Teclab se entrega desde el build local', async t => {
  const astro = createTestHarness({ workers: [{ configPath: './dist/server/wrangler.json' }] });
  t.after(() => astro.close());
  await astro.listen();
  const respuesta = await astro.fetch('/imagenes/teclab/logo-teclab.webp');
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get('content-type') ?? '', /^image\/webp\b/i);
  assert.ok((await respuesta.arrayBuffer()).byteLength > 0);
});
