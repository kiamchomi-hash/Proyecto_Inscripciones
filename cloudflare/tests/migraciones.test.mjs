import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
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

test('0011 da de baja la autoinscripción: borra sus dos tablas y conserva lo demás', async t => {
  const directorio = mkdtempSync(join(tmpdir(), 'cau-d1-baja-autoinscripcion-'));
  t.after(() => rmSync(directorio, { recursive: true, force: true }));
  const migraciones = readdirSync(new URL('../migrations/', import.meta.url))
    .filter(nombre => /^\d{4}.*\.sql$/.test(nombre)).sort();
  const baja = migraciones.find(nombre => nombre.startsWith('0011'));
  assert.ok(baja, 'falta la migración de baja de la autoinscripción');
  const copiar = nombre => copyFileSync(
    new URL(`../migrations/${nombre}`, import.meta.url), join(directorio, nombre),
  );
  for (const nombre of migraciones.filter(nombre => nombre !== baja)) copiar(nombre);
  const { db, worker } = await crearD1(t, true, directorio);

  await insertarCarrera(db);
  await insertarPrecio(db);
  const consultaId = await db.prepare(`INSERT INTO consultas(email) VALUES ('fixture@example.invalid') RETURNING id`)
    .first('id');
  // Las dos tablas quedaron así de vacías en producción; igual se prueba con filas.
  await db.prepare(`INSERT INTO enlaces_inscripcion(codigo, consulta_id) VALUES ('SinteticoSinUso1234567890ABCD', ?1)`)
    .bind(consultaId).run();
  await db.prepare('INSERT INTO robot_autoinscripciones(consulta_id) VALUES (?1)').bind(consultaId).run();

  copiar(baja);
  await worker.applyD1Migrations('DB');
  await worker.applyD1Migrations('DB');

  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), migraciones.length);
  for (const retirada of ['enlaces_inscripcion', 'robot_autoinscripciones']) {
    assert.equal(await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name=?1")
      .bind(retirada).first('n'), 0, retirada);
  }
  assert.equal(await db.prepare('SELECT count(*) AS n FROM consultas').first('n'), 1);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM carreras').first('n'), 1);
  assert.deepEqual(await leerPrecioPrivado(db, 1), {
    conceptos: [], total: 'importe sintético', nota: null, vigente_hasta: '2028-02-29',
  });
  // El CHECK de `outbox.tipo` es un superconjunto a propósito: no se reconstruye.
  await db.prepare("INSERT INTO outbox(tipo, clave) VALUES ('robot-encolar', 'sintetica')").run();
  assert.equal(await db.prepare("SELECT count(*) AS n FROM outbox WHERE tipo='robot-encolar'").first('n'), 1);
});
