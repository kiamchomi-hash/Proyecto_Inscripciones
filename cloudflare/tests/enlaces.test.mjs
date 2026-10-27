import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1, insertarCarrera } from './helpers/d1.mjs';
import { insertarConsulta } from './helpers/consultas.mjs';
import { crearEnlace, leerEnlace, reservarEnlace, liberarEnlace, SQL_RESERVAR_ENLACE } from '../src/datos/enlaces.ts';
import { estadoEnlace, validarPayloadEnlace } from '../../components/formularios/casas.ts';

test('códigos seguros de 32, límites 22/64 y vigencia de 7 días; no duplicar código', async t => {
  const { db } = await crearD1(t);
  const id = await insertarConsulta(db);
  const enlace = await crearEnlace(db, id);
  assert.match(enlace.codigo, /^[A-Za-z0-9]{32}$/);
  assert.equal(Date.parse(enlace.vence_at) - Date.parse(enlace.creado_at), 7 * 86400000);
  assert.equal(enlace.usado_at, null);
  for (const largo of [22, 64]) await crearEnlace(db, id, 'A'.repeat(largo));
  for (const codigo of ['A'.repeat(21), 'A'.repeat(65), '_'.repeat(32), 'á'.repeat(32), 'A'.repeat(31) + '\n']) {
    await assert.rejects(crearEnlace(db, id, codigo), /Código/);
    assert.equal(await leerEnlace(db, codigo), null);
    await assert.rejects(db.prepare('INSERT INTO enlaces_inscripcion(codigo,consulta_id) VALUES (?1,?2)').bind(codigo, id).run(), /CHECK/);
  }
  await assert.rejects(crearEnlace(db, id, enlace.codigo), /UNIQUE/);
  assert.equal(validarPayloadEnlace({ codigo: enlace.codigo, newsletter: 'true' }).newsletter, false);
});

test('16 consumos concurrentes del mismo enlace sólo conceden uno', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  const id = await insertarConsulta(db);
  const enlace = await crearEnlace(db, id);
  const resultados = await Promise.all(Array.from({ length: 16 }, () => reservarEnlace(db, enlace.codigo)));
  assert.equal(resultados.filter(Boolean).length, 1);
  const consumo = resultados.find(Boolean);
  assert.equal(consumo.datos.carreraId, 1);
  assert.equal((await leerEnlace(db, enlace.codigo)).usado_at, consumo.enlace.usado_at);
  assert.equal(await reservarEnlace(db, enlace.codigo), null);
});

test('vencido a igualdad; usado prevalece y los códigos de una consulta son independientes', async t => {
  const { db } = await crearD1(t);
  const id = await insertarConsulta(db);
  const enlace = await crearEnlace(db, id);
  await db.prepare('UPDATE enlaces_inscripcion SET vence_at=?1').bind('2026-10-24T12:00:00.000Z').run();
  const pedir = ahora => db.prepare(SQL_RESERVAR_ENLACE).bind(enlace.codigo, ahora).first();
  assert.equal(await pedir('2026-10-24T12:00:00.000Z'), null);
  assert.equal(await pedir('2026-10-24T12:00:00.001Z'), null);
  const fila = await pedir('2026-10-24T11:59:59.999Z');
  assert.ok(fila);
  assert.equal(estadoEnlace(fila, new Date('2026-10-25T00:00:00.000Z')), 'usado');
  const otro = await crearEnlace(db, id);
  assert.equal(otro.usado_at, null, 'no hay unicidad por consulta ni por persona en los enlaces');
});

test('casa, tipo, carrera próxima y legajo inválido no consumen; no añadir filtro activa inexistente', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología', activa: 0 });
  const id = await insertarConsulta(db);
  const enlace = await crearEnlace(db, id);
  await db.prepare("UPDATE consultas SET dni='123' WHERE id=?1").bind(id).run();
  assert.equal(await reservarEnlace(db, enlace.codigo), null);
  await db.prepare("UPDATE consultas SET dni='12345678',casa='siglo21' WHERE id=?1").bind(id).run();
  assert.equal(await reservarEnlace(db, enlace.codigo), null);
  await db.prepare("UPDATE consultas SET casa='teclab',tipo_formulario='contacto' WHERE id=?1").bind(id).run();
  assert.equal(await reservarEnlace(db, enlace.codigo), null);
  await db.prepare("UPDATE consultas SET tipo_formulario='preinscripcion' WHERE id=?1").bind(id).run();
  await db.prepare('UPDATE carreras SET proximamente=1').run();
  assert.equal(await reservarEnlace(db, enlace.codigo), null);
  await db.prepare("UPDATE carreras SET proximamente=0,nivel='Grado'").run();
  assert.equal(await reservarEnlace(db, enlace.codigo), null);
  assert.equal((await leerEnlace(db, enlace.codigo)).usado_at, null);
  await db.prepare("UPDATE carreras SET nivel='Teclab - Tecnología'").run();
  assert.ok(await reservarEnlace(db, enlace.codigo));
});

test('compensación explícita permite reintento; batch fallido revierte la reserva', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  const id = await insertarConsulta(db);
  const enlace = await crearEnlace(db, id);
  assert.ok(await reservarEnlace(db, enlace.codigo));
  assert.equal(await liberarEnlace(db, enlace.codigo), true);
  assert.equal(await liberarEnlace(db, enlace.codigo), false);
  const ahora = (await db.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now') AS ahora").first()).ahora;
  await assert.rejects(db.batch([
    db.prepare(SQL_RESERVAR_ENLACE).bind(enlace.codigo, ahora),
    db.prepare('INSERT INTO robot_autoinscripciones(consulta_id) VALUES (99999)'),
  ]), /FOREIGN KEY/);
  assert.equal((await leerEnlace(db, enlace.codigo)).usado_at, null);
  assert.ok(await reservarEnlace(db, enlace.codigo));
});

test('FK/cascade y errores D1 sin efectos externos', async t => {
  const { db } = await crearD1(t);
  const id = await insertarConsulta(db);
  await crearEnlace(db, id);
  await assert.rejects(db.prepare('INSERT INTO enlaces_inscripcion(codigo,consulta_id) VALUES (?1,99999)').bind('A'.repeat(32)).run(), /FOREIGN KEY/);
  await db.prepare('DELETE FROM consultas WHERE id=?1').bind(id).run();
  assert.equal(await db.prepare('SELECT count(*) AS n FROM enlaces_inscripcion').first('n'), 0);
  await db.exec('DROP TABLE enlaces_inscripcion');
  await assert.rejects(leerEnlace(db, 'A'.repeat(32)), /no such table/);
});
