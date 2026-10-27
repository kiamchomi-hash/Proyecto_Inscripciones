import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crearD1 } from './helpers/d1.mjs';
import { comprobarCupo, SQL_CUPO, consumirCupoFormulario, consumirCupoAlerta,
  comprobarEntradaFormulario } from '../src/datos/control.ts';

const hash = ip => createHash('sha256').update(ip).digest('hex');
const instante = '2026-10-24T12:00:00.000Z';

test('24 pedidos concurrentes no superan el cupo de 5 ni extienden la ventana al rechazar', async t => {
  const { db } = await crearD1(t);
  const resultados = await Promise.all(Array.from({ length: 24 }, () => comprobarCupo(db, 'fixture', 5, 600)));
  assert.equal(resultados.filter(Boolean).length, 5);
  const antes = await db.prepare("SELECT * FROM form_rate_limits WHERE key='fixture'").first();
  assert.equal(antes.request_count, 5);
  assert.equal(await comprobarCupo(db, 'fixture', 5, 600), false);
  assert.deepEqual(await db.prepare("SELECT * FROM form_rate_limits WHERE key='fixture'").first(), antes);
});

test('frontera estricta: a 600 segundos no reinicia; a 600 segundos y 1 ms sí', async t => {
  const { db } = await crearD1(t);
  const pedir = ahora => db.prepare(SQL_CUPO).bind('frontera', 1, 600, ahora).first('permitido');
  assert.equal(await pedir(instante), 1);
  assert.equal(await pedir('2026-10-24T12:09:59.999Z'), null);
  assert.equal(await pedir('2026-10-24T12:10:00.000Z'), null);
  const nuevo = '2026-10-24T12:10:00.001Z';
  const resultados = await Promise.all(Array.from({ length: 12 }, () => pedir(nuevo)));
  assert.equal(resultados.filter(x => x === 1).length, 1);
  assert.deepEqual(await db.prepare("SELECT window_started_at,request_count FROM form_rate_limits WHERE key='frontera'").first(), {
    window_started_at: nuevo, request_count: 1,
  });
});

test('ventana fija, claves exactas independientes y parámetros de cada llamada', async t => {
  const { db } = await crearD1(t);
  const pedir = (key, max, secs, ahora = instante) => db.prepare(SQL_CUPO).bind(key, max, secs, ahora).first('permitido');
  for (const key of ['A', 'a', '', ' A ']) assert.equal(await pedir(key, 2, 600), 1);
  assert.equal(await pedir('A', 2, 600, '2026-10-24T12:09:00.000Z'), 1);
  assert.equal(await db.prepare("SELECT window_started_at FROM form_rate_limits WHERE key='A'").first('window_started_at'), instante);
  assert.equal(await pedir('A', 2, 600, '2026-10-24T12:10:00.000Z'), null);
  assert.equal(await pedir('A', 3, 600), 1, 'un máximo distinto se aplica al contador existente');
  assert.equal(await pedir('A', 1, 1, '2026-10-24T12:00:01.001Z'), 1);
});

test('peculiaridades SQL conservadas: primera concesión con máximo 0, null y ventana negativa', async t => {
  const { db } = await crearD1(t);
  assert.equal(await comprobarCupo(db, 'cero', 0, 600), true);
  assert.equal(await comprobarCupo(db, 'cero', 0, 600), false);
  assert.equal(await comprobarCupo(db, 'negativo', -1, 600), true);
  assert.equal(await comprobarCupo(db, 'negativo', -1, 600), false);
  for (let i = 0; i < 3; i++) assert.equal(await comprobarCupo(db, 'sin-maximo', null, null), true);
  const pedir = ahora => db.prepare(SQL_CUPO).bind('sin-ventana', 1, null, ahora).first('permitido');
  assert.equal(await pedir(instante), 1);
  assert.equal(await pedir('2027-10-24T12:00:00.000Z'), null);
  for (let i = 0; i < 3; i++) assert.equal(await db.prepare(SQL_CUPO).bind('negativa', 1, -1, instante).first('permitido'), 1);
  const cero = ahora => db.prepare(SQL_CUPO).bind('ventana-cero', 1, 0, ahora).first('permitido');
  assert.equal(await cero(instante), 1);
  assert.equal(await cero(instante), null);
  assert.equal(await cero('2026-10-24T12:00:00.001Z'), 1);
});

test('formularios y alertas usan prefijos, umbrales y 600 segundos actuales sin guardar IP', async t => {
  const { db } = await crearD1(t);
  const ip = '192.0.2.1';
  for (const kind of ['consulta', 'faq', 'clase', 'precio', 'autoinscripcion', 'enlace']) {
    const key = `${kind}:${hash(ip)}`;
    await db.prepare('INSERT INTO form_rate_limits(key,request_count) VALUES (?1,4)').bind(key).run();
    assert.equal(await consumirCupoFormulario(db, kind, ip), true);
    assert.equal(await consumirCupoFormulario(db, kind, ip), false);
  }
  for (const [evento, max] of [['whatsapp', 5], ['clase-whatsapp', 5], ['formulario-fallo', 5],
    ['formulario-intento', 12], ['formulario-abandonado', 12]]) {
    const key = `analytics-alert:${evento}:${hash(ip)}`;
    await db.prepare('INSERT INTO form_rate_limits(key,request_count) VALUES (?1,?2)').bind(key, max - 1).run();
    assert.equal(await consumirCupoAlerta(db, evento, ip), true);
    assert.equal(await consumirCupoAlerta(db, evento, ip), false);
  }
  const claves = (await db.prepare('SELECT key FROM form_rate_limits').all()).results;
  assert.ok(claves.every(({ key }) => key.endsWith(hash(ip)) && !key.includes(ip)));
  assert.equal(await consumirCupoFormulario(db, 'consulta', 'unknown'), true);
  // El SQL de frontera anterior prueba la ventana; no se agregan cuotas distintas.
});

test('captcha falso/excepción y fallo posterior de payload consumen el intento sin reembolso', async t => {
  const { db } = await crearD1(t);
  const ip = '192.0.2.2';
  const resultado = await comprobarEntradaFormulario(db, 'consulta', ip, async () => false);
  assert.deepEqual(resultado, { captchaOk: false, permitido: true });
  // Esperar también la cuota si la otra rama rechaza; Promise.all por sí solo falla pronto.
  await assert.rejects(comprobarEntradaFormulario(db, 'consulta', ip, async () => { throw new Error('captcha sintético'); }), /captcha sintético/);
  const entrada = await comprobarEntradaFormulario(db, 'consulta', ip, async () => true);
  assert.equal(entrada.permitido, true);
  assert.throws(() => { throw new TypeError('payload sintético inválido'); });
  assert.equal(await db.prepare('SELECT request_count FROM form_rate_limits WHERE key=?1').bind(`consulta:${hash(ip)}`).first('request_count'), 3);
});

test('integer inválido o clave nula fallan sin escribir; error real D1 no permite por defecto', async t => {
  const { db } = await crearD1(t);
  for (const n of [1.1, NaN, Infinity, 2147483648, -2147483649, '5', undefined]) {
    await assert.rejects(comprobarCupo(db, 'invalido', n, 600), /integer/);
    await assert.rejects(comprobarCupo(db, 'invalido', 5, n), /integer/);
  }
  await assert.rejects(comprobarCupo(db, null, 5, 600), /Clave/);
  await assert.rejects(consumirCupoFormulario(db, 'otro', 'unknown'), /Formulario/);
  await assert.rejects(consumirCupoAlerta(db, 'otro', 'unknown'), /Evento/);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM form_rate_limits').first('n'), 0);
  await db.exec('DROP TABLE form_rate_limits');
  await assert.rejects(comprobarCupo(db, 'fallo', 5, 600), /no such table/);
});
