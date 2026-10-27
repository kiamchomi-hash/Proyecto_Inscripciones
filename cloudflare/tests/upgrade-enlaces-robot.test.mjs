import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { reservarMailPrecio } from '../src/datos/repositorio.ts';

for (const version of [1, 2]) {
  test(`upgrade desde 2${version === 1 ? 'A' : 'B'} conserva datos y añade enlaces/robot sin jobs`, async t => {
    const dir = mkdtempSync(join(tmpdir(), 'cau-d1-upgrade-2c-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const copiar = n => copyFileSync(new URL(`../migrations/000${n}.sql`, import.meta.url), join(dir, `000${n}.sql`));
    for (let n = 1; n <= version; n++) copiar(n);
    const { db, worker } = await crearD1(t, true, dir);
    await insertarCarrera(db);
    await insertarPrecio(db);
    await reservarMailPrecio(db, 'fixture@example.invalid', 1);
    const reserva = await db.prepare('SELECT * FROM reservas_mail_precio').first();
    if (version === 2) {
      await db.prepare("INSERT INTO form_rate_limits(key,request_count) VALUES ('fixture',3)").run();
      await db.prepare("INSERT INTO career_clicks(fecha,carrera,clicks) VALUES ('2026-10-24','Fixture',4)").run();
    }
    for (let n = version + 1; n <= 3; n++) copiar(n);
    await worker.applyD1Migrations('DB');
    await worker.applyD1Migrations('DB');
    assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 3);
    assert.deepEqual(await db.prepare('SELECT * FROM reservas_mail_precio').first(), reserva);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM precios_privados').first('n'), 1);
    if (version === 2) {
      assert.equal(await db.prepare('SELECT request_count FROM form_rate_limits').first('request_count'), 3);
      assert.equal(await db.prepare('SELECT clicks FROM career_clicks').first('clicks'), 4);
    }
    for (const tabla of ['consultas', 'enlaces_inscripcion', 'robot_autoinscripciones']) {
      assert.equal(await db.prepare(`SELECT count(*) AS n FROM ${tabla}`).first('n'), 0);
    }
    assert.equal((await db.prepare('PRAGMA table_info(consultas)').all()).results.length, 34);
    assert.equal(await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='trigger'").first('n'), 0);
  });
}
