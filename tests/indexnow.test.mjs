import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { avisarIndexNow, INDEXNOW_HOST, INDEXNOW_KEY, urlsParaIndexNow } from '../lib/indexnow.ts';

test('la clave de IndexNow está publicada con su mismo contenido', () => {
  assert.match(INDEXNOW_KEY, /^[a-f0-9]{32}$/);
  const archivo = `public/${INDEXNOW_KEY}.txt`;
  assert.ok(existsSync(archivo), `falta ${archivo}`);
  assert.equal(readFileSync(archivo, 'utf8').trim(), INDEXNOW_KEY);
});

test('sólo se avisan URLs públicas concretas, sin repetir', () => {
  const urls = urlsParaIndexNow([
    ['/', 'page'],
    ['/teclab', 'page'],
    ['/api/carreras-detalle'],
    ['/carreras/tecnicatura-superior-en-seguros'],
    ['/carreras/tecnicatura-superior-en-seguros'],
    ['/carreras/[slug]', 'page'],
    ['/', 'layout'],
  ]);
  assert.deepEqual(urls, [
    `https://${INDEXNOW_HOST}/`,
    `https://${INDEXNOW_HOST}/teclab`,
    `https://${INDEXNOW_HOST}/carreras/tecnicatura-superior-en-seguros`,
  ]);
});

test('el aviso manda host, clave y ubicación de la clave en un solo pedido', async () => {
  const pedidos = [];
  const estado = await avisarIndexNow(['https://www.siglo21sur.com/faq'], async (url, opciones) => {
    pedidos.push({ url, cuerpo: JSON.parse(opciones.body) });
    return new Response(null, { status: 202 });
  });
  assert.equal(estado, 202);
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0].url, 'https://api.indexnow.org/indexnow');
  assert.deepEqual(pedidos[0].cuerpo, {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: ['https://www.siglo21sur.com/faq'],
  });
});

test('un IndexNow caído no lanza ni manda nada vacío', async () => {
  let llamadas = 0;
  assert.equal(await avisarIndexNow([], async () => { llamadas++; return new Response(); }), null);
  assert.equal(llamadas, 0);
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal(await avisarIndexNow(['https://www.siglo21sur.com/'], async () => { throw new Error('caído'); }), null);
  } finally {
    console.error = original;
  }
});

test('la revalidación avisa a IndexNow después de responder y sólo en producción', () => {
  const route = readFileSync('app/api/revalidar/route.ts', 'utf8');
  assert.match(route, /process\.env\.VERCEL_ENV === 'production'/);
  assert.match(route, /after\(async \(\) => \{\s*const estado = await avisarIndexNow\(urls\)/);
});
