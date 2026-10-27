import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crearD1 } from './helpers/d1.mjs';
import { registrarClickCarrera, registrarApertura, leerClicks, fechaClicksDesdeUTC,
  SQL_CLICK } from '../src/datos/control.ts';

test('32 incrementos concurrentes sin lost updates, segregados por origen y carrera, sin FK', async t => {
  const { db } = await crearD1(t);
  await Promise.all(Array.from({ length: 32 }, () => registrarClickCarrera(db, 'Carrera sintética')));
  await registrarClickCarrera(db, 'Carrera sintética', 'directa');
  await registrarClickCarrera(db, 'Otra sintética');
  const filas = (await db.prepare('SELECT * FROM career_clicks ORDER BY clicks DESC').all()).results;
  assert.equal(filas[0].clicks, 32);
  assert.equal(filas.length, 3);
  assert.equal((await leerClicks(db, filas[0].fecha))[0].clicks, 32);
  assert.deepEqual(await leerClicks(db, filas[0].fecha, 'directa'), [{ carrera: 'Carrera sintética', clicks: 1 }]);
});

test('fecha argentina cambia a las 03 UTC, no a medianoche UTC; histórico usa IANA', async t => {
  const { db } = await crearD1(t);
  const anterior = fechaClicksDesdeUTC('2026-10-25T02:59:59.999Z');
  const siguiente = fechaClicksDesdeUTC('2026-10-25T03:00:00.000Z');
  assert.equal(anterior, '2026-10-24');
  assert.equal(siguiente, '2026-10-25');
  // Buenos Aires usaba horario de verano (-02) en esta fecha: no fijar -03 en SQL.
  assert.equal(fechaClicksDesdeUTC('2008-01-02T02:30:00.000Z'), '2008-01-02');
  for (const dia of [anterior, siguiente]) await db.prepare(SQL_CLICK).bind('Fixture', 'modal', dia).run();
  assert.equal((await leerClicks(db, anterior))[0].clicks, 1);
  assert.equal((await leerClicks(db, siguiente))[0].clicks, 1);
  await assert.rejects(leerClicks(db, '2027-02-29'), /Fecha/);
});

test('24 aperturas directas concurrentes conceden sólo 20 y el contador coincide', async t => {
  const { db } = await crearD1(t);
  const resultados = await Promise.all(Array.from({ length: 24 }, () =>
    registrarApertura(db, ' Fixture ', 'directa', '192.0.2.3')));
  assert.equal(resultados.filter(Boolean).length, 20);
  assert.equal(await db.prepare('SELECT clicks FROM career_clicks').first('clicks'), 20);
  assert.equal(await db.prepare('SELECT request_count FROM form_rate_limits').first('request_count'), 20);
});

test('modal usa click: y tope 60, directa direct-open: y tope 20; validación precede a cuota', async t => {
  const { db } = await crearD1(t);
  const ip = '192.0.2.4';
  const digest = createHash('sha256').update(ip).digest('hex');
  for (const [origen, prefijo, max] of [['modal', 'click', 60], ['directa', 'direct-open', 20]]) {
    await db.prepare('INSERT INTO form_rate_limits(key,request_count) VALUES (?1,?2)').bind(`${prefijo}:${digest}`, max - 1).run();
    assert.equal(await registrarApertura(db, "  Árbol '  ", origen, ip), true);
    assert.equal(await registrarApertura(db, "  Árbol '  ", origen, ip), false);
  }
  for (const carrera of ['', '  ', 'x'.repeat(201), null]) {
    await assert.rejects(registrarApertura(db, carrera, 'modal', 'unknown'), /Carrera/);
  }
  assert.equal(await db.prepare('SELECT count(*) AS n FROM form_rate_limits').first('n'), 2);
  assert.ok((await db.prepare('SELECT carrera FROM career_clicks').all()).results.every(c => c.carrera === "Árbol '"));
});

test('fallo SQL de contador conserva la cuota ya consumida; no se ocultan errores', async t => {
  const { db } = await crearD1(t);
  await db.exec("CREATE TRIGGER fallo_click BEFORE INSERT ON career_clicks BEGIN SELECT RAISE(ABORT,'fallo contador sintético'); END");
  await assert.rejects(registrarApertura(db, 'Fixture', 'modal', 'unknown'), /fallo contador/);
  assert.equal(await db.prepare('SELECT request_count FROM form_rate_limits').first('request_count'), 1);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM career_clicks').first('n'), 0);
});

test('contrato RPC sin nuevo recorte: texto vacío aceptado, origen inválido y overflow rechazados', async t => {
  const { db } = await crearD1(t);
  await registrarClickCarrera(db, '');
  await registrarClickCarrera(db, 'x'.repeat(201));
  await assert.rejects(registrarClickCarrera(db, null), /Carrera/);
  await assert.rejects(registrarClickCarrera(db, 'Fixture', 'otro'), /Origen/);
  await db.prepare('UPDATE career_clicks SET clicks=2147483647 WHERE carrera=?1').bind('').run();
  await assert.rejects(registrarClickCarrera(db, ''), /CHECK/);
  assert.equal(await db.prepare("SELECT clicks FROM career_clicks WHERE carrera=''").first('clicks'), 2147483647);
});
