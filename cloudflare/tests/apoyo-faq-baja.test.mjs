import test from 'node:test';
import assert from 'node:assert/strict';
import { registrarAlias } from './helpers/alias.mjs';
import { crearD1 } from './helpers/d1.mjs';
import { insertarApoyoFaq, SUSCRIPCION_ID } from './fixtures/apoyo-faq.mjs';
registrarAlias();
const { manejarBaja } = await import('../src/api/newsletter-baja.ts');
const { listarFaqPublicas } = await import('../src/datos/faq.ts');
const { suscribirNewsletter } = await import('../src/datos/newsletter.ts');
const pedir = (query = '', body = new URLSearchParams({ id: SUSCRIPCION_ID })) => new Request(`http://127.0.0.1/api/newsletter/baja${query}`, { method: 'POST', body });

test('FAQ: proyección, filtros, cinco, nulos al final y fecha descendente', async t => {
  const { db } = await crearD1(t);
  await insertarApoyoFaq(db);
  await db.prepare('UPDATE faq_preguntas SET orden = 1 WHERE id = 3').run();
  const lista = await listarFaqPublicas(db);
  assert.deepEqual(lista.map(f => f.id), [3, 2, 4, 5, 6]);
  assert.deepEqual(Object.keys(lista[0]).sort(), ['id', 'titulo', 'descripcion', 'respuesta', 'created_at'].sort());
  assert.ok(!JSON.stringify(lista).includes('privado@example.invalid'));
  await db.prepare('DELETE FROM faq_preguntas').run();
  assert.deepEqual(await listarFaqPublicas(db), []);
  await db.prepare('DROP TABLE faq_preguntas').run();
  await assert.rejects(listarFaqPublicas(db));
});

test('baja: inválidos, query prevalente, cuerpo ilegible y sin DB fallan cerrados', async () => {
  for (const request of [pedir('?id='), pedir('?id=mal'), pedir('', 'ilegible'), pedir('', new URLSearchParams()), pedir('', new URLSearchParams({ id: "' OR 1=1 --" }))]) {
    const r = await manejarBaja(request, null);
    assert.equal(r.status, 400);
    assert.deepEqual(await r.json(), { error: 'Solicitud inválida' });
  }
  assert.equal((await manejarBaja(pedir(), null)).status, 503);
});

test('baja: formulario 303, one-click 200, inexistente y repetida no revelan existencia', async t => {
  const { db } = await crearD1(t);
  await insertarApoyoFaq(db);
  const antes = await db.prepare('SELECT consentimiento_at FROM suscripciones_newsletter').first('consentimiento_at');
  const r = await manejarBaja(pedir(), db);
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), 'http://127.0.0.1/newsletter/baja?listo=1');
  const conocido = await manejarBaja(pedir(`?id=${SUSCRIPCION_ID}`, new URLSearchParams({ 'List-Unsubscribe': 'One-Click' })), db);
  const desconocido = await manejarBaja(pedir('?id=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), db);
  assert.equal(conocido.status, 200);
  assert.equal(desconocido.status, conocido.status);
  assert.deepEqual(await desconocido.json(), await conocido.json());
  const fila = await db.prepare('SELECT * FROM suscripciones_newsletter').first();
  assert.equal(fila.activo, 0);
  assert.equal(fila.consentimiento_at, antes);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM outbox').first('n'), 0);
});

test('baja: UUID mayúscula, concurrencia e idempotencia; alta posterior renueva consentimiento', async t => {
  const { db } = await crearD1(t);
  await insertarApoyoFaq(db);
  const respuestas = await Promise.all(Array.from({ length: 16 }, () => manejarBaja(pedir(`?id=${SUSCRIPCION_ID.toUpperCase()}`), db)));
  assert.ok(respuestas.every(r => r.status === 200));
  assert.equal(await db.prepare('SELECT activo FROM suscripciones_newsletter').first('activo'), 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM suscripciones_newsletter').first('n'), 1);
  const id = await suscribirNewsletter(db, { email: 'baja@example.invalid', carrera: null, ahora: '2026-10-26T00:00:00.000Z' });
  assert.equal(id, SUSCRIPCION_ID);
  const fila = await db.prepare('SELECT activo, consentimiento_at FROM suscripciones_newsletter').first();
  assert.deepEqual(fila, { activo: 1, consentimiento_at: '2026-10-26T00:00:00.000Z' });
});

test('baja: error D1 no informa éxito ni filtra token, email o SQL en respuesta/log', async t => {
  const mensajes = [];
  t.mock.method(console, 'error', (...args) => mensajes.push(args));
  const db = { prepare() { throw new Error(`SQL ${SUSCRIPCION_ID} privado@example.invalid`); } };
  const r = await manejarBaja(pedir(), db);
  assert.equal(r.status, 500);
  assert.equal(r.headers.get('location'), null);
  assert.deepEqual(await r.json(), { error: 'No se pudo procesar la baja' });
  assert.equal(JSON.stringify(mensajes).includes(SUSCRIPCION_ID), false);
  assert.equal(JSON.stringify(mensajes).includes('example.invalid'), false);
});
