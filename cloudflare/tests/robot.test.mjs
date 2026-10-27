import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from './helpers/d1.mjs';
import { insertarConsulta } from './helpers/consultas.mjs';
import { encolarRobot, listarPendientesRobot, obtenerTrabajoRobot, registrarResultadoRobot } from '../src/datos/robot.ts';

test('16 encolados de la misma consulta dejan una fila y no reinician una cargada', async t => {
  const { db } = await crearD1(t);
  const id = await insertarConsulta(db, { tipo_formulario: 'autoinscripcion' });
  const filas = await Promise.all(Array.from({ length: 16 }, () => encolarRobot(db, id)));
  assert.equal(filas.filter(f => f.creado).length, 1);
  assert.equal(new Set(filas.map(f => f.id)).size, 1);
  const trabajo = filas[0].id;
  assert.equal((await registrarResultadoRobot(db, { id: trabajo, estado: 'cargada' })).resultado, 'aplicado');
  assert.deepEqual(await encolarRobot(db, id), { id: trabajo, creado: false });
  assert.equal(await obtenerTrabajoRobot(db, trabajo), null);
  const otra = await insertarConsulta(db, { tipo_formulario: 'autoinscripcion' });
  assert.notEqual((await encolarRobot(db, otra)).id, trabajo, 'no se deduplica por DNI/persona');
});

test('barrido de 20 pendientes, error sólo por id y dos lectores no son un claim', async t => {
  const { db } = await crearD1(t);
  const ids = [];
  for (let i = 0; i < 22; i++) ids.push((await encolarRobot(db, await insertarConsulta(db, { tipo_formulario: 'autoinscripcion' }))).id);
  assert.deepEqual(await listarPendientesRobot(db), ids.slice(0, 20));
  await registrarResultadoRobot(db, { id: ids[0], estado: 'error' });
  assert.deepEqual(await listarPendientesRobot(db), ids.slice(1, 21));
  const [a, b] = await Promise.all([obtenerTrabajoRobot(db, String(ids[0])), obtenerTrabajoRobot(db, ids[0])]);
  assert.deepEqual(a, b);
  assert.equal(a.estado, 'error');
  assert.equal(a.intentos, 1);
  assert.equal(a.datos.email, 'fixture@example.invalid');
  assert.equal(await db.prepare('SELECT intentos FROM robot_autoinscripciones WHERE id=?1').bind(ids[0]).first('intentos'), 1);
});

test('24 errores concurrentes suman 24; cargada terminal, reporte repetido no se aplica', async t => {
  const { db } = await crearD1(t);
  const { id } = await encolarRobot(db, await insertarConsulta(db, { tipo_formulario: 'autoinscripcion' }));
  await Promise.all(Array.from({ length: 24 }, () => registrarResultadoRobot(db, { id, estado: 'error', detalle: ' x '.repeat(200) })));
  const fila = await db.prepare('SELECT * FROM robot_autoinscripciones WHERE id=?1').bind(id).first();
  assert.equal(fila.intentos, 24);
  assert.equal(fila.detalle.length, 300);
  await registrarResultadoRobot(db, { id, estado: 'cargada', detalle: 42 });
  const terminal = await db.prepare('SELECT * FROM robot_autoinscripciones WHERE id=?1').bind(id).first();
  assert.equal(terminal.intentos, 24);
  assert.equal(terminal.detalle, null);
  for (const estado of ['error', 'cargada']) assert.equal((await registrarResultadoRobot(db, { id, estado })).resultado, 'ya-cargada');
  assert.deepEqual(await db.prepare('SELECT * FROM robot_autoinscripciones WHERE id=?1').bind(id).first(), terminal);
});

test('cargada no puede ser pisada por errores concurrentes; no hay estados inventados', async t => {
  const { db } = await crearD1(t);
  const { id } = await encolarRobot(db, await insertarConsulta(db, { tipo_formulario: 'autoinscripcion' }));
  const resultados = await Promise.all(['error', 'cargada', ...Array(10).fill('error')].map(estado => registrarResultadoRobot(db, { id, estado })));
  const fila = await db.prepare('SELECT estado,intentos FROM robot_autoinscripciones WHERE id=?1').bind(id).first();
  assert.equal(fila.estado, 'cargada');
  assert.equal(fila.intentos, resultados.filter(r => r.resultado === 'aplicado' && r.fila.estado === 'error').length);
  await assert.rejects(registrarResultadoRobot(db, { id, estado: 'procesando' }), /Resultado/);
  await assert.rejects(db.prepare("UPDATE robot_autoinscripciones SET estado='procesando' WHERE id=?1").bind(id).run(), /CHECK/);
});

test('validación de ids/detalles, consulta elegible y errores sin escrituras parciales', async t => {
  const { db } = await crearD1(t);
  const consulta = await insertarConsulta(db);
  await assert.rejects(encolarRobot(db, consulta), /Consulta/);
  for (const id of [0, -1, 1.5, '1e1', '0000000000000001', Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(obtenerTrabajoRobot(db, id), /ID/);
    await assert.rejects(registrarResultadoRobot(db, { id, estado: 'error' }), /Resultado/);
  }
  assert.equal((await registrarResultadoRobot(db, { id: 999, estado: 'error' })).resultado, 'inexistente');
  assert.equal(await obtenerTrabajoRobot(db, 999), null);
  await assert.rejects(db.prepare('INSERT INTO robot_autoinscripciones(consulta_id) VALUES (999)').run(), /FOREIGN KEY/);
  await db.prepare("UPDATE consultas SET tipo_formulario='autoinscripcion' WHERE id=?1").bind(consulta).run();
  const { id } = await encolarRobot(db, consulta);
  await db.prepare('UPDATE robot_autoinscripciones SET intentos=2147483647 WHERE id=?1').bind(id).run();
  await assert.rejects(registrarResultadoRobot(db, { id, estado: 'error' }), /CHECK/);
  assert.equal(await db.prepare('SELECT estado FROM robot_autoinscripciones WHERE id=?1').bind(id).first('estado'), 'pendiente');
  await db.prepare('DELETE FROM consultas WHERE id=?1').bind(consulta).run();
  assert.equal(await obtenerTrabajoRobot(db, id), null);
});
