import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { crearD1, insertarCarrera } from './helpers/d1.mjs';
import { insertarMateria, MATERIA_ID } from './helpers/materias.mjs';
import { insertarConsulta } from './helpers/consultas.mjs';

async function baseAnterior(t) {
  const dir = mkdtempSync(join(tmpdir(), 'cau-d1-materias-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const copiar = n => copyFileSync(new URL(`../migrations/000${n}.sql`, import.meta.url), join(dir, `000${n}.sql`));
  for (let n = 1; n <= 5; n++) copiar(n);
  const { db, worker } = await crearD1(t, true, dir);
  const claseId = crypto.randomUUID();
  await db.prepare(`INSERT INTO solicitudes_clase(id,materia_id,dias,horarios,telefono)
    VALUES (?,?,'["miércoles"]','["9:00-11:00"]','1111111111')`).bind(claseId, MATERIA_ID).run();
  await insertarCarrera(db);
  const consultaId = await insertarConsulta(db);
  const faq = await db.prepare(`INSERT INTO faq_preguntas(titulo,modo,contacto)
    VALUES ('Pregunta sintética','publica','fixture@example.invalid') RETURNING id`).first('id');
  for (const [id, estado] of ['pendiente', 'enviado', 'error', 'ambiguo', 'omitido'].entries()) {
    await db.prepare(`INSERT INTO outbox(id,tipo,clave,clase_id,consulta_id,faq_id,estado,intentos,ultimo_error)
      VALUES (?,'aviso-lead',?,?,?,?,?,2,'ErrorSintetico')`)
      .bind(id + 1, `sintetico:${id}`, claseId, consultaId, faq, estado).run();
  }
  // Se conserva también el máximo histórico borrado, no sólo max(id) presente.
  await db.prepare(`INSERT INTO outbox(id,tipo,clave) VALUES (90,'aviso-lead','borrado')`).run();
  await db.prepare('DELETE FROM outbox WHERE id = 90').run();
  return { db, worker, copiar };
}

test('upgrade 3B: carga padres entre 0006/0007, conserva solicitudes, outbox y secuencia', async t => {
  const { db, worker, copiar } = await baseAnterior(t);
  const solicitudes = (await db.prepare('SELECT * FROM solicitudes_clase ORDER BY id').all()).results;
  const efectos = (await db.prepare('SELECT * FROM outbox ORDER BY id').all()).results;
  copiar(6);
  await worker.applyD1Migrations('DB');
  await insertarMateria(db);
  copiar(7);
  await worker.applyD1Migrations('DB');
  await worker.applyD1Migrations('DB');
  assert.deepEqual((await db.prepare('SELECT * FROM solicitudes_clase ORDER BY id').all()).results, solicitudes);
  assert.deepEqual((await db.prepare('SELECT * FROM outbox ORDER BY id').all()).results, efectos);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 7);
  const fk = (await db.prepare('PRAGMA foreign_key_list(solicitudes_clase)').all()).results;
  assert.ok(fk.some(f => f.table === 'materias' && f.from === 'materia_id' && f.on_delete === 'NO ACTION'));
  assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results, []);
  const nuevo = await db.prepare(`INSERT INTO outbox(tipo,clave) VALUES ('aviso-lead','nuevo') RETURNING id`).first('id');
  assert.equal(nuevo, 91);
  await assert.rejects(db.prepare(`INSERT INTO outbox(tipo,clave) VALUES ('aviso-lead','nuevo')`).run(), /UNIQUE/);
  await assert.rejects(db.prepare(`INSERT INTO outbox(tipo,clave,clase_id) VALUES ('aviso-lead','huerfano',?)`)
    .bind(crypto.randomUUID()).run(), /FOREIGN KEY/);
  const indices = (await db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all()).results.map(f => f.name);
  for (const indice of ['solicitudes_clase_materia', 'outbox_pendientes', 'outbox_consulta']) assert.ok(indices.includes(indice));
  // La FK anterior del outbox conserva su cascade después de reconstruir.
  await db.prepare('DELETE FROM solicitudes_clase WHERE id = ?').bind(solicitudes[0].id).run();
  assert.equal(await db.prepare('SELECT count(*) AS n FROM outbox WHERE clase_id IS NOT NULL').first('n'), 0);
});

test('upgrade 3B: huérfanas frenan 0007 sin borrar solicitudes, avisos ni historial', async t => {
  const { db, worker, copiar } = await baseAnterior(t);
  const solicitudes = (await db.prepare('SELECT * FROM solicitudes_clase ORDER BY id').all()).results;
  const efectos = (await db.prepare('SELECT * FROM outbox ORDER BY id').all()).results;
  copiar(6);
  copiar(7);
  await assert.rejects(worker.applyD1Migrations('DB'), /FOREIGN KEY/);
  assert.deepEqual((await db.prepare('SELECT * FROM solicitudes_clase ORDER BY id').all()).results, solicitudes);
  assert.deepEqual((await db.prepare('SELECT * FROM outbox ORDER BY id').all()).results, efectos);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 6);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM materias').first('n'), 0);
  assert.equal(await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name LIKE '%_nueva'").first('n'), 0);
  await insertarMateria(db);
  await worker.applyD1Migrations('DB');
  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 7);
  assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results, []);
});
