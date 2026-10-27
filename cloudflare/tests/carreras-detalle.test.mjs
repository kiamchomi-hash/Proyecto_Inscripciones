import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';
import './helpers/alias.mjs';

// `/api/carreras-detalle` del paquete contra el contrato de
// `app/api/carreras-detalle/route.ts`: mismo mapa, mismo 502 ante slides
// inválidos, nada de precios ni descuentos y la misma política de caché.
//
// Corre sobre el build en workerd con un D1 efímero sembrado desde el fixture
// compartido; la red externa no participa.

const CONFIG = './dist/server/wrangler.json';

const CAMPOS_DETALLE = ['descripcion', 'enfoque', 'plan_estudios',
  'seccion_duracion', 'seccion_modalidad', 'slides'].sort();

async function servidor(t) {
  const server = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => server.close());
  await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');
  return { server, db: (await worker.getEnv()).DB };
}

test('GET devuelve el mapa de fichas visibles, con la proyección exacta', async t => {
  const { server, db } = await servidor(t);
  await insertarCatalogo(db);

  const respuesta = await server.fetch('/api/carreras-detalle');
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get('content-type') ?? '', /^application\/json/);

  const mapa = await respuesta.json();
  // Visibles: las de Grado, Pregrado, Teclab y la de Identidad Argentina. Quedan
  // afuera el Posgrado (fuera de la taxonomía) y la que está apagada.
  assert.deepEqual(Object.keys(mapa).sort(), ['11', '12', '13', '14', '15', '16', '19']);
  assert.equal(mapa[17], undefined, 'el Posgrado no se publica');
  assert.equal(mapa[18], undefined, 'una carrera inactiva no se publica');

  for (const [id, detalle] of Object.entries(mapa)) {
    assert.deepEqual(Object.keys(detalle).sort(), CAMPOS_DETALLE, `campos de ${id}`);
  }
  assert.deepEqual(mapa[11], {
    slides: null,
    plan_estudios: 'Primer año | 1er cuatrimestre\n• Administración I',
    seccion_modalidad: 'Cursada virtual con tutorías.',
    seccion_duracion: 'Cuatro años.',
    descripcion: 'Formación en gestión de organizaciones.',
    enfoque: 'Gestión y estrategia.',
  });
  // El JSON de los slides se entrega parseado, no como TEXT.
  assert.deepEqual(mapa[12].slides, [{ type: 'portada', bullets: ['Ficha sintética'] }]);
  // Una fila sin texto no inventa contenido.
  assert.deepEqual(mapa[13], {
    slides: null, plan_estudios: null, seccion_modalidad: null, seccion_duracion: null,
    descripcion: '', enfoque: '',
  });

  // Ni precios ni descuentos ni el resto de la fila, aunque existan en la base.
  await db.prepare(`INSERT INTO precios_privados
    (carrera_id, institucion, conceptos, total, vigente_hasta)
    VALUES (11, 'teclab', '[]', '$ 1', '2099-01-01')`).run();
  await db.prepare(`UPDATE carreras SET descuento_especial = '{"privado":true}' WHERE id = 11`).run();
  const texto = await (await server.fetch('/api/carreras-detalle')).text();
  for (const privado of ['precios_privados', 'descuento_especial', 'privado', '$ 1']) {
    assert.equal(texto.includes(privado), false, `no debe publicarse «${privado}»`);
  }

  // El middleware no pisa la caché que declara el handler (la misma que Next);
  // el noindex de API sí se agrega por ruta.
  assert.equal(respuesta.headers.get('x-robots-tag'), 'noindex');
  assert.equal(respuesta.headers.get('cache-control'),
    'public, s-maxage=86400, stale-while-revalidate=604800');
});

test('sin datos responde 200 con el mapa vacío y no inventa filas', async t => {
  const { server } = await servidor(t);
  const respuesta = await server.fetch('/api/carreras-detalle');
  assert.equal(respuesta.status, 200);
  assert.deepEqual(await respuesta.json(), {});
});

test('un slide inválido invalida la respuesta entera con 502, sin caché', async t => {
  const { server, db } = await servidor(t);
  await insertarCatalogo(db);
  // El CHECK de la tabla acepta cualquier JSON válido; el formato lo valida el
  // módulo compartido. `portada` exige bullets como lista de textos.
  await db.prepare(`UPDATE carreras SET slides = '[{"type":"portada","bullets":[42]}]' WHERE id = 12`).run();

  const respuesta = await server.fetch('/api/carreras-detalle');
  assert.equal(respuesta.status, 502);
  assert.deepEqual(await respuesta.json(), { error: 'no se pudo leer el detalle' });
  assert.doesNotMatch(respuesta.headers.get('cache-control') ?? '', /s-maxage/);
});

test('sólo GET: otro método responde 405 y no busca parámetros', async t => {
  const { server, db } = await servidor(t);
  await insertarCatalogo(db);

  for (const method of ['POST', 'PUT', 'DELETE']) {
    const respuesta = await server.fetch('/api/carreras-detalle', { method });
    assert.equal(respuesta.status, 405, method);
    assert.equal(respuesta.headers.get('allow'), 'GET');
    assert.deepEqual(await respuesta.json(), { error: 'Método no permitido' });
  }
  // La ruta no recibe parámetros: un query inesperado no cambia el mapa (igual
  // que el handler vigente, que ignora la URL del pedido).
  const conQuery = await (await server.fetch('/api/carreras-detalle?id=11&slug=x')).json();
  assert.deepEqual(Object.keys(conQuery).sort(), ['11', '12', '13', '14', '15', '16', '19']);
});

test('el handler declara la caché pública del sitio antes de las guardas locales', async () => {
  // Se importa el módulo puro con el alias de resolución de `@/`, que sólo
  // traduce rutas: no ejecuta red ni toca D1.
  const { responderDetalle } = await import('../src/api/carreras-detalle.ts');
  const dbVacia = { prepare: () => ({ all: async () => ({ results: [] }) }) };

  const vacia = await responderDetalle(dbVacia);
  assert.equal(vacia.status, 200);
  assert.equal(vacia.headers.get('cache-control'),
    'public, s-maxage=86400, stale-while-revalidate=604800');
  assert.deepEqual(await vacia.json(), {});

  // Sin binding el paquete local falla cerrado; el sitio vigente no tiene ese
  // estado porque su credencial está siempre.
  const sinBase = await responderDetalle(null);
  assert.equal(sinBase.status, 503);
  assert.deepEqual(await sinBase.json(), { error: 'Servicio temporalmente no disponible' });
});

test('el registro de un detalle inválido lleva la fila y la ruta, nunca el contenido', async t => {
  // En workerd no se puede observar `console`, así que el formato del mensaje
  // se comprueba llamando al handler puro con una fila corrupta.
  const { responderDetalle } = await import('../src/api/carreras-detalle.ts');
  const dbCorrupta = {
    prepare: () => ({
      all: async () => ({
        results: [{
          id: 12, nivel: 'Grado', slides: '[{"type":"portada","bullets":[42]}]',
          plan_estudios: null, seccion_modalidad: null, seccion_duracion: null,
          descripcion: null, enfoque: null,
        }],
      }),
    }),
  };
  const errores = t.mock.method(console, 'error', () => {});
  const respuesta = await responderDetalle(dbCorrupta);
  assert.equal(respuesta.status, 502);
  assert.equal(respuesta.headers.get('cache-control'), null);
  assert.deepEqual(await respuesta.json(), { error: 'no se pudo leer el detalle' });
  assert.deepEqual(errores.mock.calls.at(-1).arguments, [
    'Detalle de carrera inválido:', { id: 12, ruta: 'slides[0].bullets[0]' },
  ]);
  assert.equal(JSON.stringify(errores.mock.calls).includes('bullets'), true);
  assert.equal(JSON.stringify(errores.mock.calls).includes('"portada"'), false);
});
