import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_PROD, RUTAS, NOINDEX, redirectsEsperados } from '../../lib/vigilancia-esperado.ts';
import { correrChequeos, manejarVigilancia } from '../src/api/vigilancia.ts';

// Todo el transporte HTTP es un doble: ninguna prueba audita producción. Las
// URLs permitidas salen de la lista fija y una `<loc>` externa no se pide.

const CABECERAS_HOME = {
  'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=()',
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
};

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${BASE_PROD}/</loc></url>
<url><loc>${BASE_PROD}/teclab</loc></url>
</urlset>`;

function mapaRedirecciones() {
  const mapa = new Map();
  for (const [desde, hasta, codigo] of redirectsEsperados(BASE_PROD)) {
    mapa.set(desde, { hasta, codigo: codigo ?? 308 });
  }
  return mapa;
}

function redEscenario({ falloFaq = false, homeSinCsp = false, sitemap = SITEMAP, evil = false } = {}) {
  const redirecciones = mapaRedirecciones();
  const llamadas = [];
  const buscar = async (url, init) => {
    llamadas.push({ url, init });
    if (evil && url.includes('evil.example')) return new Response('no', { status: 200 });
    if (url === `${BASE_PROD}/sitemap.xml`) {
      return new Response(sitemap, { status: 200, headers: { 'content-type': 'application/xml' } });
    }
    const redireccion = redirecciones.get(url);
    if (redireccion) {
      return new Response(null, {
        status: redireccion.codigo,
        headers: { location: redireccion.hasta },
      });
    }
    if (url === `${BASE_PROD}/faq` && falloFaq) return new Response('error', { status: 500 });
    const noindex = NOINDEX.find(([ruta]) => url === `${BASE_PROD}${ruta}`);
    if (noindex) {
      return new Response('api', { status: 200, headers: { 'x-robots-tag': 'noindex' } });
    }
    if (url === `${BASE_PROD}/`) {
      const headers = homeSinCsp ? { ...CABECERAS_HOME } : CABECERAS_HOME;
      if (homeSinCsp) delete headers['content-security-policy'];
      return new Response('<html></html>', { status: 200, headers });
    }
    return new Response('<html></html>', { status: 200, headers: CABECERAS_HOME });
  };
  return { buscar, llamadas };
}

const telegramOk = (textos) => async texto => { textos.push(texto); return 'enviado'; };

const pedir = (ruta = '/api/vigilancia', headers = {}) =>
  new Request(`https://local.test${ruta}`, { headers });

test('vigilancia: sin secreto 503, con otro secreto 401 y sin transporte 503', async t => {
  const sinSecreto = await manejarVigilancia(pedir(), { buscar: async () => new Response('') });
  assert.equal(sinSecreto.status, 503);
  assert.deepEqual(await sinSecreto.json(), { error: 'CRON_SECRET sin configurar' });

  const otro = await manejarVigilancia(pedir('/api/vigilancia', { authorization: 'Bearer otro' }), {
    secretoCron: 'secreto-sintetico', buscar: async () => new Response(''),
  });
  assert.equal(otro.status, 401);

  const sinTransporte = await manejarVigilancia(
    pedir('/api/vigilancia', { authorization: 'Bearer secreto-sintetico' }), { secretoCron: 'secreto-sintetico' },
  );
  assert.equal(sinTransporte.status, 503);
});

test('vigilancia: corrida limpia sin avisos y dentro del dominio propio', async t => {
  const { buscar, llamadas } = redEscenario();
  const textos = [];
  const respuesta = await manejarVigilancia(
    pedir('/api/vigilancia', { authorization: 'Bearer secreto-sintetico' }),
    {
      secretoCron: 'secreto-sintetico',
      buscar,
      telegram: telegramOk(textos),
      precios: async () => [],
      ahora: () => new Date('2026-10-25T12:00:00.000Z'),
    },
  );
  const cuerpo = await respuesta.json();
  assert.equal(respuesta.status, 200);
  assert.equal(cuerpo.ok, true);
  assert.deepEqual(cuerpo.fallos, []);
  assert.equal(cuerpo.urlsSitemap, 2);
  assert.equal(cuerpo.aviso, 'no hacia falta');
  assert.equal(typeof cuerpo.segundos, 'number');
  assert.equal(textos.length, 0);
  assert.ok(llamadas.length >= RUTAS.length);
  for (const llamada of llamadas) {
    assert.match(llamada.url, /^https:\/\/(?:www\.)?siglo21sur\.com\//);
    assert.ok(llamada.init.signal instanceof AbortSignal);
  }
});

test('vigilancia: los fallos se explican y se avisan una sola vez', async t => {
  const { buscar } = redEscenario({ falloFaq: true, homeSinCsp: true, sitemap: '<urlset></urlset>' });
  const textos = [];
  const respuesta = await manejarVigilancia(
    pedir('/api/vigilancia', { authorization: 'Bearer secreto-sintetico' }),
    {
      secretoCron: 'secreto-sintetico',
      buscar,
      telegram: telegramOk(textos),
      precios: async () => { throw new Error('base caída'); },
      ahora: () => new Date('2026-10-25T12:00:00.000Z'),
    },
  );
  const cuerpo = await respuesta.json();
  assert.equal(cuerpo.ok, false);
  assert.ok(cuerpo.fallos.some(f => f.startsWith('/faq — HTTP 500')));
  assert.ok(cuerpo.fallos.some(f => f.startsWith('content-security-policy')));
  assert.ok(cuerpo.fallos.some(f => f.startsWith('/sitemap.xml — no devolvio')));
  assert.ok(cuerpo.fallos.some(f => f.startsWith('precios vencidos')));
  assert.equal(cuerpo.aviso, 'enviado');
  assert.equal(textos.length, 1);
  assert.match(textos[0], /La página \/faq no está disponible/);
  assert.match(textos[0], /mapa de páginas del sitio está vacío/);
  assert.match(textos[0], /No se pudo revisar la vigencia de los precios/);
});

test('vigilancia: una <loc> externa se informa y no se pide (sin SSRF)', async t => {
  const { buscar, llamadas } = redEscenario({
    evil: true,
    sitemap: `<urlset><url><loc>https://evil.example/robar</loc></url></urlset>`,
  });
  const textos = [];
  const { fallos, urlsSitemap } = await correrChequeos(BASE_PROD, {
    buscar,
    telegram: telegramOk(textos),
    precios: async () => [],
  });
  assert.equal(urlsSitemap, 1);
  assert.ok(fallos.some(f => f.startsWith('URL del sitemap') && f.includes('fuera del dominio')));
  assert.equal(llamadas.some(llamada => llamada.url.includes('evil.example')), false);
});

test('vigilancia: ?prueba manda sólo el aviso y no corre chequeos', async t => {
  const { buscar, llamadas } = redEscenario();
  const textos = [];
  const respuesta = await manejarVigilancia(
    pedir('/api/vigilancia?prueba=1', { authorization: 'Bearer secreto-sintetico' }),
    { secretoCron: 'secreto-sintetico', buscar, telegram: telegramOk(textos) },
  );
  assert.deepEqual(await respuesta.json(), { prueba: true, aviso: 'enviado' });
  assert.equal(llamadas.length, 0);
  assert.equal(textos.length, 1);
  assert.match(textos[0], /Prueba de vigilancia/);

  const sinCanal = await manejarVigilancia(
    pedir('/api/vigilancia?prueba=1', { authorization: 'Bearer secreto-sintetico' }),
    { secretoCron: 'secreto-sintetico', buscar },
  );
  assert.deepEqual(await sinCanal.json(), { prueba: true, aviso: 'sin configurar' });
});

test('vigilancia: un lector ausente se informa, no se omite', async () => {
  const { buscar } = redEscenario();
  const { fallos } = await correrChequeos(BASE_PROD, { buscar });
  assert.ok(fallos.some(f => f.startsWith('precios vencidos') && f.includes('sin lector')));
});
