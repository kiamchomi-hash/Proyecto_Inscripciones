import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';
import { createTestHarness } from 'wrangler';
import childProcess from 'node:child_process';

const original = JSON.parse(readFileSync(new URL('../wrangler.json', import.meta.url)));
const DLQ = original.queues.consumers[0].dead_letter_queue;

async function esperar(leer, cumple, contexto) {
  const plazo = Date.now() + 15_000;
  let valor;
  do {
    valor = await leer();
    if (cumple(valor)) return valor;
    await setTimeout(25);
  } while (Date.now() < plazo);
  assert.fail(`${contexto}: ${JSON.stringify(valor)}`);
}

async function crear(t, fase = 'normal') {
  // El outboundService del harness delega en globalThis.fetch (Wrangler fijado).
  // Bloquea TODO destino externo, también desde workerd; sólo permite loopback.
  const buscar = globalThis.fetch;
  const bloqueados = [];
  const iniciar = childProcess.spawn;
  const procesos = [];
  childProcess.spawn = (comando, ...args) => {
    const proceso = iniciar(comando, ...args);
    if (String(comando).includes('workerd')) procesos.push(proceso);
    return proceso;
  };
  globalThis.fetch = (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      bloqueados.push(url.hostname);
      return Promise.reject(new Error('Red externa bloqueada por prueba'));
    }
    return buscar(input, init);
  };
  let server;
  t.after(async () => {
    try { await server?.close(); } finally {
      globalThis.fetch = buscar;
      childProcess.spawn = iniciar;
    }
  });
  const opciones = (fase, revision = '1') => ({ workers: [{ config: {
    ...original,
    main: './tests/fixtures/worker-recuperacion.ts',
    dev: { ip: '127.0.0.1', port: 0 },
    vars: { APP_STAGE: 'local', FASE: fase, REVISION: revision },
    queues: { ...original.queues, consumers: [
      // Misma política de tres retries; sólo se acelera la espera del fixture.
      { ...original.queues.consumers[0], retry_delay: 0, max_batch_timeout: 0 },
      { queue: DLQ, max_batch_size: 10, max_batch_timeout: 0, max_retries: 0 },
    ] },
  } }] });
  server = createTestHarness(opciones(fase));
  await server.listen();
  let worker = server.getWorker();
  await worker.applyD1Migrations('DB');
  let env = await worker.getEnv();
  for (const sql of [
    'CREATE TABLE fixture_pausas(fase TEXT,instancia TEXT)',
    'CREATE TABLE fixture_intentos(instancia TEXT)',
    'CREATE TABLE fixture_entregas(instancia TEXT)',
    'CREATE TABLE fixture_cola(msg_id TEXT,intento INTEGER,cuerpo TEXT)',
    'CREATE TABLE fixture_finalizados(msg_id TEXT)',
    'CREATE TABLE fixture_dlq(msg_id TEXT,cuerpo TEXT,fecha TEXT)',
    "INSERT INTO consultas(id,email) VALUES (1,'sintetico@example.invalid')",
    "INSERT INTO outbox(id,tipo,clave,consulta_id) VALUES (1,'aviso-lead','recuperacion',1)",
  ]) await env.DB.prepare(sql).run();
  return {
    server, bloqueados,
    get db() { return env.DB; },
    get cola() { return env.EFECTOS; },
    async contar(tabla) { return (await env.DB.prepare(`SELECT count(*) AS n FROM ${tabla}`).first()).n; },
    async estado() { return env.DB.prepare('SELECT estado FROM outbox WHERE id=1').first('estado'); },
    async cron() { return worker.scheduled({ cron: '*/5 * * * *', scheduledTime: new Date() }); },
    async recargar() {
      const anterior = await (await server.fetch('/instancia')).json();
      const anteriores = procesos.filter(p => p.exitCode === null && p.signalCode === null);
      assert.ok(anteriores.length > 0, 'capturar workerd real, no simular una caída con excepción');
      await server.update(opciones('normal', crypto.randomUUID()));
      worker = server.getWorker();
      env = await worker.getEnv();
      const actual = await (await server.fetch('/instancia')).json();
      assert.notEqual(actual.instancia, anterior.instancia, 'el isolate debe cambiar de instancia');
      assert.ok(anteriores.some(p => p.signalCode === 'SIGKILL'), 'el harness debe interrumpir realmente workerd');
      assert.equal(await env.DB.prepare('SELECT count(*) AS n FROM consultas').first('n'), 1, 'D1 sobrevive a la recarga');
    },
  };
}

test('el bloqueo de red externa se aplica también al fetch del Worker', async t => {
  const h = await crear(t);
  assert.equal((await h.server.fetch('/red-bloqueada')).status, 503);
  assert.deepEqual(h.bloqueados, ['red-prohibida.invalid']);
});

for (const fase of ['antes-claim', 'antes-efecto', 'durante-efecto', 'despues-efecto', 'despues-resultado']) {
  test(`recarga del isolate en ${fase}: D1 conserva intención y no reenvía a ciegas`, { timeout: 30_000 }, async t => {
    const h = await crear(t, fase);
    await h.cola.send({ tipo: 'efecto', id: 1 });
    await esperar(() => h.contar('fixture_pausas'), n => n === 1, 'punto de interrupción');
    const estado = await h.estado();
    assert.equal(estado, fase.startsWith('antes-') ? 'pendiente' : fase === 'despues-resultado' ? 'enviado' : 'ambiguo');
    const entregas = await h.contar('fixture_entregas');
    assert.equal(entregas, fase.startsWith('despues-') ? 1 : 0);
    if (fase === 'antes-efecto' || fase === 'durante-efecto') {
      // El broker local no admite concurrencia de consumers. Competidores HTTP
      // del fixture invocan el MISMO consumidor compilado contra el claim D1.
      const competidores = await Promise.all(Array.from({ length: 8 }, async () =>
        (await h.server.fetch('/competir')).json()));
      await h.cron();
      assert.ok(competidores.every(c => c.resultado === 'no-pendiente'));
      assert.equal(await h.contar('fixture_intentos'), fase === 'antes-efecto' ? 0 : 1);
      assert.equal(await h.contar('fixture_pausas'), 1);
    }
    await h.recargar();
    assert.equal(await h.estado(), estado);
    // La recarga local no acredita redelivery durable del broker. Se republica
    // expresamente la referencia para probar el consumidor nuevo contra D1 viejo.
    await h.cola.send({ tipo: 'efecto', id: 1 });
    assert.equal((await h.cron()).outcome, 'ok');
    await esperar(() => h.contar('fixture_cola'), n => n >= 2, 'entrega repetida al nuevo isolate');
    await esperar(() => h.contar('fixture_finalizados'), n => n >= 1, 'consumidor repetido terminado antes de reconciliar');
    if (fase === 'antes-claim') {
      await esperar(() => h.estado(), e => e === 'enviado', 'recuperación automática del pendiente sin reclamo');
      assert.equal(await h.contar('fixture_entregas'), 1);
    } else {
      assert.equal(await h.estado(), estado);
      assert.equal(await h.contar('fixture_entregas'), entregas);
      assert.equal(await h.contar('outbox_reclamos'), 1, 'no robar el reclamo tras la caída');
      // Reconciliación manual LOCAL con el envío anterior detenido. Token CAS;
      // no existe endpoint que convierta ambiguos en pendientes automáticamente.
      const { token } = await h.db.prepare('SELECT token FROM outbox_reclamos WHERE efecto_id=1').first();
      if (fase === 'antes-efecto') {
        assert.equal(await h.contar('fixture_intentos'), 0, 'evidencia controlada de que no comenzó el proveedor');
        await h.db.prepare("DELETE FROM outbox_reclamos WHERE efecto_id=1 AND token=?1 AND EXISTS (SELECT 1 FROM outbox WHERE id=1 AND estado='pendiente')").bind(token).run();
        await h.cron();
        assert.equal(await h.estado(), 'enviado');
        assert.equal(await h.contar('fixture_entregas'), 1);
      } else if (fase === 'durante-efecto') {
        // Sin recibo NO hay prueba general de no entrega: conservar incertidumbre.
        assert.equal(await h.estado(), 'ambiguo');
      } else {
        assert.equal(entregas, 1, 'recibo durable del proveedor ficticio para reconciliar como entregado');
        await h.db.batch([
          h.db.prepare("UPDATE outbox SET estado='enviado' WHERE id=1 AND estado IN ('ambiguo','enviado') AND EXISTS (SELECT 1 FROM outbox_reclamos WHERE efecto_id=1 AND token=?1)").bind(token),
          h.db.prepare("DELETE FROM outbox_reclamos WHERE efecto_id=1 AND token=?1 AND EXISTS (SELECT 1 FROM outbox WHERE id=1 AND estado='enviado')").bind(token),
        ]);
        await h.cola.send({ tipo: 'efecto', id: 1 });
        await h.cron();
        await esperar(() => h.contar('fixture_finalizados'), n => n >= 2, 'reentrega terminal confirmada');
        assert.equal(await h.estado(), 'enviado');
        assert.equal(await h.contar('fixture_entregas'), 1);
      }
    }
    assert.deepEqual(h.bloqueados, [], 'ningún transporte externo intentado');
  });
}

test('Queues local agota tres retries, entrega a DLQ y el cron recupera la intención D1', async t => {
  const h = await crear(t, 'error-base');
  await h.cola.send({ tipo: 'efecto', id: 1 });
  await esperar(() => h.contar('fixture_dlq'), n => n === 1, 'transferencia real a DLQ local');
  const intentos = (await h.db.prepare('SELECT msg_id,intento FROM fixture_cola ORDER BY intento').all()).results;
  assert.deepEqual(intentos.map(f => f.intento), [1, 2, 3, 4]);
  assert.equal(new Set(intentos.map(f => f.msg_id)).size, 1);
  const dlq = await h.db.prepare('SELECT * FROM fixture_dlq').first();
  assert.equal(dlq.msg_id, intentos[0].msg_id);
  assert.deepEqual(JSON.parse(dlq.cuerpo), { tipo: 'efecto', id: 1 });
  assert.equal(await h.estado(), 'pendiente');
  assert.equal(await h.contar('fixture_entregas'), 0);
  await h.recargar();
  await h.cron();
  assert.equal(await h.estado(), 'enviado');
  await h.cola.send(JSON.parse(dlq.cuerpo));
  await esperar(() => h.contar('fixture_cola'), n => n >= 5, 'redrive explícito de DLQ');
  await esperar(() => h.contar('fixture_finalizados'), n => n >= 5, 'redrive terminado sin reenvío');
  await h.cron();
  assert.equal(await h.contar('fixture_entregas'), 1);
  assert.equal(await h.contar('fixture_dlq'), 1, 'no borrar evidencia de fallo durante la recuperación');
  assert.deepEqual(h.bloqueados, []);
});

test('SIMULACIÓN de referencia expirada: outbox intacto y recuperación por scheduled real local', async t => {
  const h = await crear(t, 'expiracion-simulada');
  await h.cola.send({ tipo: 'efecto', id: 1 });
  await esperar(() => h.contar('fixture_cola'), n => n === 1, 'referencia descartada por el fixture');
  assert.equal(await h.estado(), 'pendiente');
  assert.equal(await h.contar('fixture_entregas'), 0);
  await h.recargar();
  await h.cron();
  assert.equal(await h.estado(), 'enviado');
  assert.equal(await h.contar('fixture_entregas'), 1);
  assert.equal(await h.contar('fixture_dlq'), 0, 'expirar no equivale a agotar retries');
  assert.deepEqual(h.bloqueados, []);
});
