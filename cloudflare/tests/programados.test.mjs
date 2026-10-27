import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from './helpers/d1.mjs';
import { consumirEfecto } from '../src/operativa/consumidores.ts';
import { barridoDeEfectos } from '../src/operativa/colas.ts';
import { manejarColaLocal, manejarProgramadoLocal, CRON_EFECTOS } from '../src/operativa/programados.ts';
import { reintentar } from '../src/operativa/outbox.ts';
import { manejarRobotPost } from '../src/api/robot.ts';

async function aviso(db, clave = 'fixture') {
  return (await db.prepare("INSERT INTO outbox(tipo,clave,consulta_id) VALUES ('aviso-lead',?1,1) RETURNING id")
    .bind(clave).first()).id;
}
async function consulta(db) {
  await db.prepare("INSERT INTO consultas(id,email) VALUES (1,'sintetico@example.invalid')").run();
}

test('cron y entregas concurrentes reclaman una sola intención antes del transporte', async t => {
  const { db } = await crearD1(t);
  await consulta(db);
  const id = await aviso(db);
  let llamadas = 0;
  let liberar;
  const espera = new Promise(resolve => { liberar = resolve; });
  let entrar;
  const entrada = new Promise(resolve => { entrar = resolve; });
  const transportes = { telegram: async () => { llamadas++; entrar(); if (llamadas === 1) await espera; return 'enviado'; } };
  const primero = consumirEfecto(db, id, transportes);
  await entrada;
  await Promise.all(Array.from({ length: 12 }, () => consumirEfecto(db, id, transportes)));
  await barridoDeEfectos(db, transportes);
  liberar();
  await primero;
  assert.equal(llamadas, 1);
});

test('excepción inesperada del transporte es ambigua y nunca se reenvía sola', async t => {
  const { db } = await crearD1(t);
  await consulta(db);
  const id = await aviso(db);
  let llamadas = 0;
  const transportes = { telegram: async () => { llamadas++; throw new Error('resultado incierto'); } };
  assert.equal(await consumirEfecto(db, id, transportes), 'ambiguo');
  await consumirEfecto(db, id, transportes);
  await barridoDeEfectos(db, transportes);
  assert.equal(llamadas, 1);
});

test('pendientes sin transporte no impiden avanzar el barrido entre invocaciones', async t => {
  const { db } = await crearD1(t);
  await consulta(db);
  for (let i = 0; i < 25; i++) await aviso(db, `sin-transporte:${i}`);
  const id = (await db.prepare("INSERT INTO outbox(tipo,clave,consulta_id) VALUES ('newsletter-alta','newsletter',1) RETURNING id").first()).id;
  await barridoDeEfectos(db, {});
  await barridoDeEfectos(db, {});
  assert.equal((await db.prepare('SELECT estado FROM outbox WHERE id=?1').bind(id).first()).estado, 'enviado');
});

test('sin stage, DB, cola o nombre autorizado los handlers fallan cerrados', async () => {
  for (const entorno of [{}, { APP_STAGE: 'production', DB: {}, EFECTOS: {} },
    { APP_STAGE: 'local', DB: {} }, { APP_STAGE: 'local', EFECTOS: {} }]) {
    await assert.rejects(manejarProgramadoLocal({ cron: CRON_EFECTOS }, entorno), /sin configurar/);
    await assert.rejects(manejarColaLocal({ queue: 'cau-efectos-local', messages: [] }, entorno), /sin configurar/);
  }
  const entorno = { APP_STAGE: 'local', DB: {}, EFECTOS: {} };
  await assert.rejects(manejarProgramadoLocal({ cron: '* * * * *' }, entorno), /no autorizado/);
  await assert.rejects(manejarColaLocal({ queue: 'ajena', messages: [] }, entorno), /no autorizada/);
});

test('fallo D1 después del envío conserva ambigüedad y reclamo aun con redelivery', async t => {
  const { db } = await crearD1(t);
  await consulta(db);
  const id = await aviso(db);
  await db.prepare(`CREATE TRIGGER fallo_resultado BEFORE UPDATE OF estado ON outbox
    WHEN NEW.estado='enviado' BEGIN SELECT RAISE(ABORT,'fallo sintético'); END`).run();
  let llamadas = 0;
  const transportes = { telegram: async () => { llamadas++; return 'enviado'; } };
  await assert.rejects(consumirEfecto(db, id, transportes));
  assert.equal((await db.prepare('SELECT estado FROM outbox WHERE id=?1').bind(id).first()).estado, 'ambiguo');
  assert.equal(await reintentar(db, id), false);
  assert.equal(await consumirEfecto(db, id, transportes), 'no-pendiente');
  await barridoDeEfectos(db, transportes);
  assert.equal(llamadas, 1);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM outbox_reclamos').first()).n, 1);
});

test('reclamo abandonado no se roba ni por antigüedad; otras intenciones siguen', async t => {
  const { db } = await crearD1(t);
  await consulta(db);
  const id = await aviso(db);
  await db.prepare("INSERT INTO outbox_reclamos VALUES (?1,'proceso-interrumpido','2000-01-01')").bind(id).run();
  const segundo = await aviso(db, 'segunda');
  let llamadas = 0;
  const transportes = { telegram: async () => { llamadas++; return 'enviado'; } };
  await barridoDeEfectos(db, transportes);
  assert.equal(llamadas, 1);
  assert.equal((await db.prepare('SELECT estado FROM outbox WHERE id=?1').bind(id).first()).estado, 'pendiente');
  assert.equal((await db.prepare('SELECT estado FROM outbox WHERE id=?1').bind(segundo).first()).estado, 'enviado');
});

test('robot publica sólo el aviso confirmado; fallo de cola no cambia el 200', async t => {
  const { db } = await crearD1(t);
  await db.prepare("INSERT INTO consultas(id,casa,tipo_formulario) VALUES (1,'teclab','autoinscripcion')").run();
  await db.prepare('INSERT INTO robot_autoinscripciones(id,consulta_id) VALUES (1,1)').run();
  const publicados = [];
  const request = () => new Request('https://local.invalid/api/robot', {
    method: 'POST', headers: { authorization: 'Bearer secreto-ficticio' },
    body: JSON.stringify({ id: 1, estado: 'error', detalle: 'fixture' }),
  });
  const respuesta = await manejarRobotPost(request(), db, 'secreto-ficticio', {
    send: async mensaje => { publicados.push(mensaje); throw new Error('cola local caída'); },
  });
  assert.equal(respuesta.status, 200);
  assert.equal(publicados.length, 1);
  assert.deepEqual(Object.keys(publicados[0]).sort(), ['id', 'tipo']);
  const efecto = await db.prepare('SELECT estado,tipo FROM outbox WHERE id=?1').bind(publicados[0].id).first();
  assert.deepEqual(efecto, { estado: 'pendiente', tipo: 'aviso-robot-error' });
});

test('presupuesto del barrido actual: lote de 20 sin transporte usa 103 consultas D1', async t => {
  const { db } = await crearD1(t);
  await consulta(db);
  for (let i = 0; i < 20; i++) await aviso(db, `presupuesto:${i}`);
  let consultas = 0;
  const contado = { prepare(sql) { consultas++; return db.prepare(sql); } };
  await barridoDeEfectos(contado, {});
  assert.equal(consultas, 103, 'Free permite 50: requiere reducir/batchear el lote o Paid antes del corte');
});

test('error conocido libera el reclamo pero sólo vuelve a enviar por reintento explícito', async t => {
  const { db } = await crearD1(t);
  await consulta(db);
  const id = await aviso(db);
  let llamadas = 0;
  const transportes = { telegram: async () => ++llamadas === 1 ? 'rechazado' : 'enviado' };
  assert.equal(await consumirEfecto(db, id, transportes), 'error');
  assert.equal(await consumirEfecto(db, id, transportes), 'no-pendiente');
  await barridoDeEfectos(db, transportes);
  assert.equal(llamadas, 1);
  assert.equal(await reintentar(db, id), true);
  assert.equal(await consumirEfecto(db, id, transportes), 'enviado');
  assert.equal(llamadas, 2);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM outbox_reclamos').first()).n, 0);
});
