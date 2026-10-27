import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from './helpers/d1.mjs';
import { insertarMateria, MATERIA_ID, OTRA_MATERIA_ID } from './helpers/materias.mjs';
import { listarMateriasPublicas, listarNavegacionMaterias, leerMateriaPublica } from '../src/datos/materias.ts';
import { manejarFormulario } from '../src/api/formularios.ts';

test('materias: esquema completo, UUID, slug único, JSON y booleanos', async t => {
  const { db } = await crearD1(t);
  assert.deepEqual((await db.prepare('PRAGMA table_info(materias)').all()).results.map(f => f.name).sort(), [
    'id', 'slug', 'label', 'nombre_profesor', 'whatsapp', 'telefono_display', 'descripcion',
    'imagenes', 'en_construccion', 'activa', 'orden', 'modo_manana', 'dias_bloqueados',
    'horarios_bloqueados', 'texto_seo', 'created_at', 'updated_at',
  ].sort());
  await insertarMateria(db);
  for (const cambio of [
    { id: 'corto' }, { id: 'x'.repeat(36) }, { activa: 2 }, { modo_manana: -1 },
    { en_construccion: 2 }, { descripcion: 'no-json' }, { orden: 32768 },
  ]) {
    await assert.rejects(insertarMateria(db, { id: OTRA_MATERIA_ID, slug: 'otra', ...cambio }));
  }
  await assert.rejects(insertarMateria(db, { id: OTRA_MATERIA_ID }), /UNIQUE/);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM materias').first('n'), 1);
});

test('materias: proyecciones públicas conservan contenido sin transportar campos ajenos', async t => {
  const { db } = await crearD1(t);
  await insertarMateria(db, { descripcion: '["Álgebra <strong>local</strong>"]', imagenes: '["/foto.webp"]',
    dias_bloqueados: '["miércoles"]', horarios_bloqueados: '["9:00-11:00"]',
    texto_seo: '["Texto sintético"]', modo_manana: 1, orden: 2 });
  await insertarMateria(db, { id: OTRA_MATERIA_ID, slug: 'otra', orden: 1, en_construccion: 1 });
  await insertarMateria(db, { id: crypto.randomUUID(), slug: 'oculta', activa: 0, orden: -1 });
  const lista = await listarMateriasPublicas(db);
  assert.deepEqual(lista.map(f => f.slug), ['otra', 'materia-sintetica']);
  assert.equal(lista[0].en_construccion, true);
  assert.equal(lista[1].en_construccion, false);
  assert.deepEqual(lista[1].descripcion, ['Álgebra <strong>local</strong>']);
  assert.deepEqual(Object.keys(lista[1]).sort(), ['id', 'slug', 'label', 'en_construccion', 'descripcion'].sort());
  const nav = await listarNavegacionMaterias(db);
  assert.equal(nav[1].foto, '/foto.webp');
  assert.deepEqual(Object.keys(nav[1]).sort(), ['id', 'slug', 'label', 'en_construccion', 'foto'].sort());
  const ficha = await leerMateriaPublica(db, 'materia-sintetica');
  assert.equal(ficha.id, MATERIA_ID);
  assert.equal(ficha.modo_manana, true);
  assert.deepEqual(ficha.dias_bloqueados, ['miércoles']);
  assert.deepEqual(ficha.horarios_bloqueados, ['9:00-11:00']);
  assert.deepEqual(ficha.texto_seo, ['Texto sintético']);
  assert.equal(Object.hasOwn(ficha, 'created_at'), false);
  assert.equal(Object.hasOwn(ficha, 'activa'), false);
  assert.equal(await leerMateriaPublica(db, 'oculta'), null);
  assert.equal(await leerMateriaPublica(db, "' OR 1=1 --"), null);
});

test('materias: vacío válido, JSON null y datos corruptos no se ocultan como vacío o 404', async t => {
  const { db } = await crearD1(t);
  assert.deepEqual(await listarMateriasPublicas(db), []);
  await insertarMateria(db, { descripcion: 'null', imagenes: 'null', dias_bloqueados: 'null',
    horarios_bloqueados: '[]', texto_seo: null });
  assert.equal((await listarMateriasPublicas(db))[0].descripcion, null);
  assert.equal((await listarNavegacionMaterias(db))[0].foto, null);
  const ficha = await leerMateriaPublica(db, 'materia-sintetica');
  assert.deepEqual(ficha.descripcion, []);
  assert.deepEqual(ficha.imagenes, []);
  assert.deepEqual(ficha.dias_bloqueados, []);
  assert.equal(ficha.texto_seo, null);
  await db.prepare('UPDATE materias SET descripcion = ? WHERE id = ?').bind('["válido",42]', MATERIA_ID).run();
  await assert.rejects(listarMateriasPublicas(db), /descripcion\[1\]/);
  await assert.rejects(leerMateriaPublica(db, 'materia-sintetica'), /descripcion\[1\]/);
  await db.prepare('UPDATE materias SET descripcion = ?, imagenes = ? WHERE id = ?').bind('[]', '{}', MATERIA_ID).run();
  await assert.rejects(listarNavegacionMaterias(db), /imagenes/);
  await db.prepare('DROP TABLE materias').run();
  await assert.rejects(listarMateriasPublicas(db));
  await assert.rejects(leerMateriaPublica(db, 'materia-sintetica'));
});

test('clases: FK real rechaza huérfanas y revierte filas/outbox sin devolver cuota', async t => {
  const { db } = await crearD1(t);
  await insertarMateria(db);
  const fila = materia_id => ({ materia_id, telefono: '1111111111', dias: ['lunes'], horarios: ['9:00-11:00'] });
  const pedir = rows => manejarFormulario(new Request('https://local.test/api/formularios', {
    method: 'POST', headers: { 'cf-connecting-ip': '203.0.113.42' },
    body: JSON.stringify({ kind: 'clase', token: 'sintetico', payload: { rows } }),
  }), db, { captchaConfigurado: true, verificarCaptcha: async () => true });
  assert.equal((await pedir([fila(MATERIA_ID), fila(OTRA_MATERIA_ID)])).status, 500);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM solicitudes_clase').first('n'), 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM outbox').first('n'), 0);
  assert.equal(await db.prepare('SELECT request_count FROM form_rate_limits').first('request_count'), 1);
  assert.equal((await pedir([fila(MATERIA_ID)])).status, 201);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM outbox').first('n'), 1);
  // Sin acción remota confirmada no se inventa cascade: una materia referida no se borra.
  await assert.rejects(db.prepare('DELETE FROM materias WHERE id = ?').bind(MATERIA_ID).run(), /FOREIGN KEY/);
  assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results, []);
});
