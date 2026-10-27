import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { insertarConsulta } from './helpers/consultas.mjs';
import { sentenciaEfectos } from '../src/operativa/outbox.ts';
import { sentenciaInsertConsulta } from '../src/api/filas.ts';
import { reservarMailPrecio } from '../src/datos/repositorio.ts';
import { suscribirNewsletter } from '../src/datos/newsletter.ts';

for (const version of [1, 2, 3, 4]) {
  test(`upgrade desde ${version} agrega faq, clases y newsletter sin tocar lo anterior`, async t => {
    const dir = mkdtempSync(join(tmpdir(), 'cau-d1-upgrade-3b-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const copiar = n => copyFileSync(new URL(`../migrations/000${n}.sql`, import.meta.url), join(dir, `000${n}.sql`));
    for (let n = 1; n <= version; n++) copiar(n);
    const { db, worker } = await crearD1(t, true, dir);
    await insertarCarrera(db);
    await insertarPrecio(db);
    await reservarMailPrecio(db, 'fixture@example.invalid', 1);
    const reserva = await db.prepare('SELECT * FROM reservas_mail_precio').first();
    let consultaId = null;
    let efecto = null;
    if (version >= 3) consultaId = await insertarConsulta(db);
    if (version >= 4) {
      await db.batch([
        sentenciaInsertConsulta(db, { carrera: 'Carrera sintética', email: 'a@b.invalid' }, false),
        sentenciaEfectos(db, [{ tipo: 'aviso-lead' }]),
      ]);
      efecto = await db.prepare('SELECT * FROM outbox').first();
    }
    for (let n = version + 1; n <= 5; n++) copiar(n);
    await worker.applyD1Migrations('DB');
    await worker.applyD1Migrations('DB');

    assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 5);
    assert.deepEqual(await db.prepare('SELECT * FROM reservas_mail_precio').first(), reserva);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM precios_privados').first('n'), 1);
    for (const tabla of ['faq_preguntas', 'solicitudes_clase', 'suscripciones_newsletter']) {
      assert.equal(await db.prepare(`SELECT count(*) AS n FROM ${tabla}`).first('n'), 0, tabla);
    }
    if (version >= 3) {
      // 2C deja una preinscripción; 3A le suma la consulta que encola efectos.
      assert.equal(await db.prepare('SELECT count(*) AS n FROM consultas').first('n'), version >= 4 ? 2 : 1);
    }
    if (version >= 4) {
      // La fila del outbox se conserva y gana las columnas nuevas en null.
      const despues = await db.prepare('SELECT * FROM outbox').first();
      assert.equal(despues.id, efecto.id);
      assert.equal(despues.clave, efecto.clave);
      assert.equal(despues.consulta_id, efecto.consulta_id);
      assert.equal(despues.faq_id, null);
      assert.equal(despues.clase_id, null);
    }
    assert.equal(await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='trigger'").first('n'), 0);
    void consultaId;
  });
}

test('las tres tablas nuevas conservan las restricciones del contrato', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nombre: 'Carrera sintética' });

  // faq_preguntas: modo acotado; nace fuera de la vista pública.
  await assert.rejects(db.prepare(`INSERT INTO faq_preguntas(titulo,modo,contacto)
    VALUES ('Pregunta sintética','otro','x')`).run(), /CHECK/);
  const faq = await db.prepare(`INSERT INTO faq_preguntas(titulo,modo,contacto)
    VALUES ('Pregunta sintética','publica','lead@example.invalid') RETURNING *`).first();
  assert.equal(faq.estado, 'pendiente');
  assert.equal(faq.destacada, 0);

  // solicitudes_clase: JSON válido y uuid de 36.
  await assert.rejects(db.prepare(`INSERT INTO solicitudes_clase(id,materia_id,dias,horarios,telefono)
    VALUES ('${crypto.randomUUID()}','11111111-1111-1111-1111-111111111111','no-json','[]','1')`).run(), /CHECK/);
  await assert.rejects(db.prepare(`INSERT INTO solicitudes_clase(id,materia_id,dias,horarios,telefono)
    VALUES ('corto','11111111-1111-1111-1111-111111111111','[]','[]','1')`).run(), /CHECK/);

  // newsletter: una general por mail y una por carrera; la baja no borra.
  const id = await suscribirNewsletter(db, { email: 'Lead@Example.invalid', carrera: null });
  assert.equal(await suscribirNewsletter(db, { email: 'lead@example.invalid', carrera: null }), id);
  const conCarrera = await suscribirNewsletter(db, { email: 'lead@example.invalid', carrera: { id: 1, nombre: 'Carrera sintética' } });
  assert.notEqual(conCarrera, id);
  const filas = (await db.prepare('SELECT * FROM suscripciones_newsletter ORDER BY email, carrera_id').all()).results;
  assert.equal(filas.filter(f => f.carrera_id === null).length, 1);
  assert.equal(filas.filter(f => f.carrera_id === 1).length, 1);
  // FK real a carreras: un id inexistente no entra.
  await assert.rejects(db.prepare(`INSERT INTO suscripciones_newsletter(id,email,carrera_id)
    VALUES ('${crypto.randomUUID()}','otro@example.invalid', 999)`).run(), /FOREIGN KEY/);
});
