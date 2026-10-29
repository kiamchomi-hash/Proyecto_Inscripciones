import test from 'node:test';
import assert from 'node:assert/strict';
import { extraerDatosPublicos, lectorD1Produccion, sqlDatosPublicos } from '../scripts/copia-datos-publicos.mjs';
import { CONTRATO } from '../scripts/datos-publicos.mjs';
import { crearD1 } from './helpers/d1.mjs';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';

test('consulta únicamente columnas y filas públicas, sin tablas privadas', async () => {
  const consultas = [];
  const db = { prepare(sql) {
    consultas.push(sql);
    return { async all() { return { results: [] }; } };
  } };
  const snapshot = await extraerDatosPublicos(db);
  assert.deepEqual(snapshot, { version: 1, tablas: Object.fromEntries(Object.keys(CONTRATO).map(t => [t, []])) });
  assert.equal(consultas.length, 4);
  assert.match(consultas[0], /FROM carreras WHERE activa = 1 ORDER BY id/);
  assert.match(consultas[1], /FROM materias WHERE activa = 1 ORDER BY id/);
  assert.match(consultas[2], /FROM novedades WHERE publicada = 1 ORDER BY id/);
  assert.match(consultas[3], /FROM faq_preguntas WHERE estado = 'aprobada' AND destacada = 1 AND modo = 'publica' ORDER BY id/);
  for (const sql of consultas) {
    assert.doesNotMatch(sql, /SELECT \*|contacto|consultas|precios_privados/i);
  }
});

test('rechaza booleanos de D1 que no sean cero o uno', async () => {
  const db = { prepare() { return { async all() { return { results: [{ activa: 2 }] }; } }; } };
  await assert.rejects(() => extraerDatosPublicos(db), /booleano/i);
});

test('extrae un catálogo D1 local y omite carreras no visibles', async t => {
  const { db } = await crearD1(t);
  await insertarCatalogo(db);
  const snapshot = await extraerDatosPublicos(db);
  assert.ok(snapshot.tablas.carreras.some(c => c.id === 11));
  assert.ok(!snapshot.tablas.carreras.some(c => c.id === 18));
  assert.ok(!snapshot.tablas.carreras.some(c => c.id === 17));
  assert.ok(snapshot.tablas.novedades.length > 0);
});

test('adaptador de producción sólo ejecuta las cuatro consultas explícitas', async () => {
  const llamadas = [];
  const db = lectorD1Produccion({ ejecutar: async (binario, args) => {
    llamadas.push({ binario, args });
    return { stdout: '' };
  } });
  await extraerDatosPublicos(db);
  assert.equal(llamadas.length, 4);
  for (const { binario, args } of llamadas) {
    assert.equal(binario, process.execPath);
    assert.match(args[0], /herramientas\/d1\.mjs$/);
    assert.match(args[1], /^SELECT /);
    assert.doesNotMatch(args[1], /contacto|consultas|precios_privados/i);
  }
  assert.throws(() => db.prepare('SELECT * FROM consultas'), /contrato público/);
});

test('genera SQL que carga en otra D1 local el catálogo público', async t => {
  const { db: origen } = await crearD1(t);
  const { db: destino } = await crearD1(t);
  await insertarCatalogo(origen);
  const snapshot = await extraerDatosPublicos(origen);
  const sql = sqlDatosPublicos(snapshot);
  assert.doesNotMatch(sql, /INSERT INTO (?:consultas|precios_privados)/i);
  // Las sentencias pueden contener saltos de línea y punto y coma en textos;
  // el parser de SQLite ejecuta el script completo, no se separa con split.
  const { DatabaseSync } = await import('node:sqlite');
  const memoria = new DatabaseSync(':memory:');
  try {
    for (const [tabla, spec] of Object.entries(CONTRATO)) {
      const columnas = [...spec.columnas, ...(tabla === 'faq_preguntas' ? ['contacto'] : [])];
      memoria.exec(`CREATE TABLE ${tabla} (${columnas.map(c => `"${c}"`).join(',')})`);
    }
    memoria.exec(sql);
    assert.equal(memoria.prepare('SELECT count(*) AS n FROM carreras').get().n, snapshot.tablas.carreras.length);
    assert.equal(await destino.prepare('SELECT count(*) AS n FROM consultas').first('n'), 0);
  } finally { memoria.close(); }
});
