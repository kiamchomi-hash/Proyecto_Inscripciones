import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { insertarConsulta } from './helpers/consultas.mjs';
import { crearEnlace } from '../src/datos/enlaces.ts';
import { reservarMailPrecio } from '../src/datos/repositorio.ts';

for (const version of [1, 2, 3]) {
  test(`upgrade desde ${version} conserva datos y añade el outbox sin consumidores`, async t => {
    const dir = mkdtempSync(join(tmpdir(), 'cau-d1-upgrade-3-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const copiar = n => copyFileSync(new URL(`../migrations/000${n}.sql`, import.meta.url), join(dir, `000${n}.sql`));
    for (let n = 1; n <= version; n++) copiar(n);
    const { db, worker } = await crearD1(t, true, dir);
    await insertarCarrera(db);
    await insertarPrecio(db);
    await reservarMailPrecio(db, 'fixture@example.invalid', 1);
    const reserva = await db.prepare('SELECT * FROM reservas_mail_precio').first();
    let consultaId = null;
    let enlace = null;
    if (version >= 3) {
      consultaId = await insertarConsulta(db);
      enlace = await crearEnlace(db, consultaId);
    }
    for (let n = version + 1; n <= 5; n++) copiar(n);
    await worker.applyD1Migrations('DB');
    // Reaplicar por historial no vuelve a correr nada.
    await worker.applyD1Migrations('DB');

    assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 5);
    assert.deepEqual(await db.prepare('SELECT * FROM reservas_mail_precio').first(), reserva);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM precios_privados').first('n'), 1);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM outbox').first('n'), 0);

    if (version >= 3) {
      // Los datos sintéticos de enlaces/robot siguen iguales después del upgrade.
      assert.equal(await db.prepare('SELECT count(*) AS n FROM consultas').first('n'), 1);
      assert.equal((await db.prepare('SELECT usado_at FROM enlaces_inscripcion WHERE codigo=?1')
        .bind(enlace.codigo).first('usado_at')), null);
      assert.equal(consultaId, 1);
    }

    // El outbox nuevo tiene sus restricciones y no crea triggers ni jobs.
    await assert.rejects(db.prepare(`INSERT INTO outbox(tipo, clave) VALUES ('aviso-lead', '${'x'.repeat(121)}')`).run(), /CHECK/);
    await assert.rejects(db.prepare(`INSERT INTO outbox(tipo, clave, consulta_id) VALUES ('aviso-lead', 'k', 999)`).run(), /FOREIGN KEY/);
    await db.prepare("INSERT INTO outbox(tipo, clave) VALUES ('aviso-lead', 'k')").run();
    await assert.rejects(db.prepare("INSERT INTO outbox(tipo, clave) VALUES ('aviso-lead', 'k')").run(), /UNIQUE/);
    assert.equal(await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='trigger'").first('n'), 0);
    // Sin fila de consulta, la clave de efectos no inventa un id: la FK lo impide.
    assert.equal(await db.prepare("SELECT count(*) AS n FROM outbox WHERE clave LIKE 'consulta:%'").first('n'), 0);
  });
}

test('el outbox no guarda datos personales ni mensajes del proveedor', async t => {
  const { db } = await crearD1(t);
  const columnas = (await db.prepare('PRAGMA table_info(outbox)').all()).results.map(c => c.name);
  assert.deepEqual(columnas, [
    'id', 'tipo', 'clave', 'consulta_id', 'detalle', 'estado', 'intentos', 'ultimo_error',
    'created_at', 'updated_at', 'faq_id', 'clase_id',
  ]);

  // El fallo guarda sólo el código saneado: ni el mensaje del proveedor ni la persona.
  const { marcarError, leerEfecto } = await import('../src/operativa/outbox.ts');
  await db.prepare("INSERT INTO outbox(tipo, clave) VALUES ('aviso-lead', 'consulta:1')").run();
  const id = await db.prepare('SELECT id FROM outbox').first('id');
  await marcarError(db, id, 'lead@example.invalid: 550 rechazado por el servidor');
  const guardado = (await leerEfecto(db, id)).ultimo_error;
  assert.equal(guardado, 'lead-example.invalid-550-rechazado-por-el-servidor');
  assert.equal(Buffer.byteLength(guardado) <= 120, true);
  await marcarError(db, id, 'x'.repeat(400));
  assert.equal((await leerEfecto(db, id)).ultimo_error.length, 120);
});
