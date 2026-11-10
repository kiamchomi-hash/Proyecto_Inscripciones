import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crearD1, insertarCarrera } from './helpers/d1.mjs';
import { manejarIndexNow, MAXIMO_POR_PEDIDO } from '../src/api/indexnow.ts';

// El aviso a IndexNow no puede salir del workflow de publicación: Cloudflare
// devuelve 403 al leer `/sitemap.xml` desde las IPs de GitHub (10/11/2026). Lo
// hace el cron del Worker, que arma la lista desde D1. Estas pruebas fijan las
// tres reglas que importan: se avisa sólo lo nuevo o cambiado, lo que falla se
// reintenta, y una URL que sale del sitemap se olvida.

const filas = db => db.prepare('SELECT url, huella FROM indexnow_avisadas ORDER BY url').all()
  .then(r => r.results);

/** Doble de IndexNow: guarda lo avisado y responde lo que se le pida. */
const espia = (estado = 200) => {
  const pedidos = [];
  const avisar = async urls => { pedidos.push(urls); return estado; };
  return { pedidos, avisar, todas: () => pedidos.flat() };
};

const conCarrera = async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nombre: 'Carrera de prueba', nivel: 'Pregrado' });
  return db;
};

test('la primera corrida avisa el sitemap entero y la segunda no manda nada', async t => {
  const db = await conCarrera(t);
  const { pedidos, avisar, todas } = espia();

  const primera = await manejarIndexNow(db, { avisar });
  assert.equal(primera.estado, 200);
  assert.equal(primera.nuevas, primera.urls);
  assert.ok(primera.nuevas > 5, 'el sitemap tiene las páginas fijas y la carrera');
  assert.equal(pedidos.length, 1, 'un solo pedido, no uno por URL');
  assert.ok(
    todas().every(url => url === 'https://www.siglo21sur.com' || url.startsWith('https://www.siglo21sur.com/')),
    'sólo URLs del dominio',
  );
  assert.ok(todas().some(url => url.includes('/carreras/')), 'entra la ficha de la carrera');
  assert.equal((await filas(db)).length, primera.urls, 'quedan anotadas todas');

  const segunda = await manejarIndexNow(db, { avisar });
  assert.deepEqual(
    { nuevas: segunda.nuevas, estado: segunda.estado, quitadas: segunda.quitadas },
    { nuevas: 0, estado: null, quitadas: 0 },
  );
  assert.equal(pedidos.length, 1, 'sin cambios no se avisa de nuevo');
});

test('una ficha editada se vuelve a avisar aunque ya estuviera anotada', async t => {
  const db = await conCarrera(t);
  const { avisar, todas } = espia();
  await manejarIndexNow(db, { avisar });

  await db.prepare("UPDATE carreras SET updated_at = '2026-11-10T12:00:00.000Z' WHERE id = 1").run();
  const { pedidos, avisar: avisar2 } = espia();
  const corrida = await manejarIndexNow(db, { avisar: avisar2 });

  assert.equal(corrida.nuevas, 1, 'sólo la ficha que cambió');
  assert.match(pedidos[0][0], /\/carreras\//);
  assert.equal(todas().length > 0, true);
  const guardada = (await filas(db)).find(fila => fila.url === pedidos[0][0]);
  assert.equal(guardada.huella, '2026-11-10T12:00:00.000Z');
});

test('una URL que sale del sitemap se borra, sin avisar bajas', async t => {
  const db = await conCarrera(t);
  const { avisar, todas } = espia();
  await manejarIndexNow(db, { avisar });
  const ficha = todas().find(url => url.includes('/carreras/'));

  await db.prepare('UPDATE carreras SET activa = 0 WHERE id = 1').run();
  const { pedidos, avisar: avisar2 } = espia();
  const corrida = await manejarIndexNow(db, { avisar: avisar2 });

  assert.equal(corrida.quitadas, 1);
  assert.equal(pedidos.length, 0, 'una baja no se avisa a IndexNow');
  assert.equal((await filas(db)).some(fila => fila.url === ficha), false);
});

test('si IndexNow no contesta, no se anota nada y la corrida siguiente reintenta', async t => {
  const db = await conCarrera(t);

  const caida = espia(null);
  const corrida = await manejarIndexNow(db, { avisar: caida.avisar });
  assert.equal(corrida.estado, null);
  assert.ok(corrida.nuevas > 0);
  assert.deepEqual(await filas(db), [], 'nada anotado: se reintenta');

  const { avisar, todas } = espia();
  const reintento = await manejarIndexNow(db, { avisar });
  assert.equal(reintento.nuevas, corrida.nuevas, 'vuelve a mandar lo mismo');
  assert.equal(todas().length, corrida.nuevas);
  assert.equal((await filas(db)).length, corrida.nuevas);
});

test('la migración declara la tabla que usa el cron', () => {
  const migracion = readFileSync(
    new URL('../migrations/0015_indexnow_avisadas.sql', import.meta.url), 'utf8',
  );
  assert.match(migracion, /CREATE TABLE indexnow_avisadas/);
  assert.match(migracion, /url TEXT NOT NULL PRIMARY KEY/);
  assert.match(migracion, /huella TEXT NOT NULL/);
  // El tope del protocolo está en el código; la tabla no guarda más que eso.
  assert.equal(MAXIMO_POR_PEDIDO, 10000);
});
