import test from 'node:test';
import assert from 'node:assert/strict';
import { reservarMailPrecio, SQL_RESERVA_MAIL } from '../src/datos/repositorio.ts';
import { crearD1, insertarCarrera } from './helpers/d1.mjs';

test('24 reservas concurrentes permiten una sola: alta, rechazo sin renovar y renovación expirada', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db);
  const resultados = await Promise.all(Array.from({ length: 24 }, (_, i) =>
    reservarMailPrecio(db, i % 2 ? ' Fixture@Example.Invalid ' : 'fixture@example.invalid', 1)));
  assert.equal(resultados.filter(Boolean).length, 1);
  const antes = await db.prepare('SELECT * FROM reservas_mail_precio').first();
  assert.equal(antes.email, 'fixture@example.invalid');
  assert.equal(await reservarMailPrecio(db, 'fixture@example.invalid', 1), false);
  assert.deepEqual(await db.prepare('SELECT * FROM reservas_mail_precio').first(), antes);
  await db.prepare("UPDATE reservas_mail_precio SET reservado_at = strftime('%Y-%m-%dT%H:%M:%fZ','now','-169 hours')").run();
  const renovaciones = await Promise.all(Array.from({ length: 24 }, () =>
    reservarMailPrecio(db, 'fixture@example.invalid', 1)));
  assert.equal(renovaciones.filter(Boolean).length, 1);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM reservas_mail_precio').first('n'), 1);
});

test('mismo SQL: antes de 168 horas rechaza, en la frontera exacta permite y después también', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db);
  const ejecutar = ahora => db.prepare(SQL_RESERVA_MAIL)
    .bind('fixture@example.invalid', 1, ahora).first('reservado');
  assert.equal(await ejecutar('2026-10-24T12:00:00.000Z'), 1);
  assert.equal(await ejecutar('2026-10-31T11:59:59.999Z'), null);
  assert.equal(await ejecutar('2026-10-31T12:00:00.000Z'), 1);
  assert.equal(await ejecutar('2026-11-07T12:00:00.001Z'), 1);
  assert.equal(await ejecutar('2026-10-01T00:00:00.000Z'), null);
});

test('reservas por carrera/correo independientes y reloj real de base en el repositorio', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db);
  await insertarCarrera(db, 2);
  assert.deepEqual(await Promise.all([
    reservarMailPrecio(db, 'uno@example.invalid', 1),
    reservarMailPrecio(db, 'uno@example.invalid', 2),
    reservarMailPrecio(db, 'dos@example.invalid', 1),
  ]), [true, true, true]);
  const fila = await db.prepare('SELECT reservado_at FROM reservas_mail_precio LIMIT 1').first();
  const reloj = await db.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now') AS ahora").first('ahora');
  assert.ok(Math.abs(Date.parse(reloj) - Date.parse(fila.reservado_at)) < 10000);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM reservas_mail_precio').first('n'), 3);
});

test('parámetros inválidos no reservan y carrera inexistente falla por FK sin ocultar el error', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db);
  for (const [email, id] of [[null, 1], ['', 1], ['ab', 1], ['x'.repeat(255), 1],
    ['fixture@example.invalid', 0], ['fixture@example.invalid', 1.1], ['fixture@example.invalid', '1']]) {
    assert.equal(await reservarMailPrecio(db, email, id), false);
  }
  await assert.rejects(reservarMailPrecio(db, 'fixture@example.invalid', 99), /FOREIGN KEY/);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM reservas_mail_precio').first('n'), 0);
});
