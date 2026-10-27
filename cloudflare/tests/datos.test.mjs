import test from 'node:test';
import assert from 'node:assert/strict';
import { listarCatalogoPublico, leerPrecioPrivado } from '../src/datos/repositorio.ts';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';

test('migración desde cero y segunda aplicación por historial sin cambios', async t => {
  const { db, worker } = await crearD1(t, false);
  assert.equal(await db.prepare("SELECT name FROM sqlite_master WHERE name='carreras'").first(), null);
  await worker.applyD1Migrations('DB');
  await insertarCarrera(db);
  await worker.applyD1Migrations('DB');
  assert.equal(await db.prepare('SELECT count(*) AS n FROM carreras').first('n'), 1);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 12);
  const tablas = (await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()).results.map(r => r.name);
  for (const nombre of ['carreras', 'precios_privados', 'reservas_mail_precio', 'form_rate_limits', 'career_clicks', 'consultas', 'outbox',
    'faq_preguntas', 'solicitudes_clase', 'suscripciones_newsletter', 'newsletter_envios', 'materias', 'novedades']) assert.ok(tablas.includes(nombre));
  // `0011` da de baja la autoinscripción de Teclab: las dos tablas que usaba ya no están.
  for (const retirada of ['enlaces_inscripcion', 'robot_autoinscripciones']) {
    assert.ok(!tablas.includes(retirada), `${retirada} sigue en el esquema`);
  }
  assert.equal((await db.prepare('PRAGMA table_info(carreras)').all()).results.length, 23);
});

test('catálogo conserva IDs, tildes, nulos y booleanos sin precios ni detalle', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 9007199254740991, {
    nombre: "Árbol ' de prueba", prefix: null, orden: 2, proximamente: 1,
    slides: '[{"type":"portada","bullets":[]}]',
    descuento_especial: '{"privado":"no-publicar"}',
  });
  await insertarPrecio(db, 9007199254740991);
  const [fila] = await listarCatalogoPublico(db);
  assert.equal(fila.id, 9007199254740991);
  assert.equal(fila.nombre, "Árbol ' de prueba");
  assert.equal(fila.prefix, null);
  assert.equal(fila.duracion, null);
  assert.equal(fila.activa, true);
  assert.equal(fila.destacada, false);
  assert.equal(fila.proximamente, true);
  assert.equal(fila.tieneSlides, true);
  assert.deepEqual(Object.keys(fila).sort(), ['id', 'nombre', 'nivel', 'duracion', 'titulo',
    'modalidad', 'prefix', 'nombre_corto', 'orden', 'activa', 'destacada', 'nueva', 'proximamente', 'tieneSlides'].sort());
  assert.ok(!JSON.stringify(fila).includes('no-publicar'));
  assert.ok(!JSON.stringify(fila).includes('importe sintético'));
});

test('filtro de oferta compartido, inactivas fuera y próximas visibles; orden estable con nulos al final', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1);
  await insertarCarrera(db, 2, { nivel: 'Posgrado', orden: 0 });
  await insertarCarrera(db, 3, { activa: 0, orden: 0 });
  await insertarCarrera(db, 4, { nivel: 'Teclab - Curso', orden: 1, proximamente: 1 });
  await insertarCarrera(db, 5, { nivel: 'Identidad Argentina', orden: 1, slides: '[]' });
  const filas = await listarCatalogoPublico(db);
  assert.deepEqual(filas.map(c => c.id), [4, 5, 1]);
  assert.equal(filas[1].tieneSlides, false);
  assert.equal(filas[2].tieneSlides, false);
});

test('lectura privada conserva JSON, nota nula y fecha date sin convertirla a UTC', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db);
  const conceptos = [{ concepto: 'Concepto sintético', monto: 'importe sintético', descuento: null }];
  await insertarPrecio(db, 1, { conceptos: JSON.stringify(conceptos) });
  assert.deepEqual(await leerPrecioPrivado(db, 1), {
    conceptos, total: 'importe sintético', nota: null, vigente_hasta: '2028-02-29',
  });
  assert.equal(await leerPrecioPrivado(db, 2), null);
  for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1 OR 1=1"]) {
    await assert.rejects(leerPrecioPrivado(db, id), /ID de carrera/);
  }
});

test('D1 rechaza JSON inválido, conceptos no-array, booleanos e IDs fuera de contrato', async t => {
  const { db } = await crearD1(t);
  await assert.rejects(insertarCarrera(db, 0), /CHECK/);
  await assert.rejects(insertarCarrera(db, 9007199254740992), /CHECK/);
  await assert.rejects(insertarCarrera(db, 1, { activa: 2 }), /CHECK/);
  await assert.rejects(insertarCarrera(db, 1, { slides: 'no-json' }), /malformed JSON|CHECK/);
  await insertarCarrera(db);
  await assert.rejects(insertarPrecio(db, 1, { conceptos: '{}' }), /CHECK/);
  await assert.rejects(insertarPrecio(db, 1, { vigente_hasta: '2027-02-29' }), /CHECK/);
  await assert.rejects(insertarPrecio(db, 1, { vigente_hasta: '2028-02-29T00:00:00Z' }), /CHECK/);
});

test('claves únicas, FK y cascade se ejecutan en D1 local', async t => {
  const { db } = await crearD1(t);
  await assert.rejects(insertarPrecio(db, 99), /FOREIGN KEY/);
  await insertarCarrera(db);
  await assert.rejects(db.prepare(`INSERT INTO precios_privados(institucion,conceptos,total,vigente_hasta)
    VALUES ('fixture','[]','sintético','2028-02-29')`).run(), /NOT NULL/);
  await insertarPrecio(db);
  await assert.rejects(insertarPrecio(db), /UNIQUE/);
  await db.prepare("INSERT INTO reservas_mail_precio(email,carrera_id) VALUES ('fixture@example.invalid',1)").run();
  await db.prepare('DELETE FROM carreras WHERE id=1').run();
  assert.equal(await db.prepare('SELECT count(*) AS n FROM precios_privados').first('n'), 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM reservas_mail_precio').first('n'), 0);
});

test('un batch fallido revierte también la escritura anterior', async t => {
  const { db } = await crearD1(t);
  await assert.rejects(db.batch([
    db.prepare("INSERT INTO carreras(id,nombre,nivel,modalidad) VALUES (1,'Fixture','Pregrado','A distancia')"),
    db.prepare("INSERT INTO precios_privados(carrera_id,institucion,conceptos,total,vigente_hasta) VALUES (99,'fixture','[]','sintético','2028-02-29')"),
  ]), /FOREIGN KEY/);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM carreras').first('n'), 0);
});
