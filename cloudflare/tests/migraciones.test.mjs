import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { reservarMailPrecio, leerPrecioPrivado } from '../src/datos/repositorio.ts';

test('actualiza una base 2A con datos a 2B sin perder catálogo, precio ni reserva', async t => {
  const directorio = mkdtempSync(join(tmpdir(), 'cau-d1-migraciones-'));
  t.after(() => rmSync(directorio, { recursive: true, force: true }));
  copyFileSync(new URL('../migrations/0001.sql', import.meta.url), join(directorio, '0001.sql'));
  const { db, worker } = await crearD1(t, true, directorio);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 1);
  await insertarCarrera(db);
  await insertarPrecio(db);
  await reservarMailPrecio(db, 'fixture@example.invalid', 1);
  const antes = await db.prepare('SELECT * FROM reservas_mail_precio').first();
  const precio = await leerPrecioPrivado(db, 1);
  copyFileSync(new URL('../migrations/0002.sql', import.meta.url), join(directorio, '0002.sql'));
  await worker.applyD1Migrations('DB');
  await worker.applyD1Migrations('DB');
  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 2);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM carreras').first('n'), 1);
  assert.deepEqual(await leerPrecioPrivado(db, 1), precio);
  assert.deepEqual(await db.prepare('SELECT * FROM reservas_mail_precio').first(), antes);
  for (const tabla of ['form_rate_limits', 'career_clicks']) {
    assert.equal(await db.prepare(`SELECT count(*) AS n FROM ${tabla}`).first('n'), 0);
  }
});
