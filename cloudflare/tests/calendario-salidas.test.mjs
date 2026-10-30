import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crearD1 } from './helpers/d1.mjs';
import { manejarAlertaAnalytics } from '../src/api/alertas-analytics.ts';
import {
  DESTINOS_CALENDARIO, destinoCalendarioValido, leerSalidasCalendario, registrarSalidaCalendario,
} from '../src/datos/calendario.ts';

// El calendario académico trae 2.900 impresiones al mes desde Google y hasta acá
// no se sabía si esa visita terminaba en una carrera: el evento se quedaba en
// memoria del navegador. Estas pruebas fijan las tres reglas del contador: se
// guarda por día y destino, sólo acepta destinos de la lista cerrada, y no manda
// aviso de Telegram.

const hash = ip => createHash('sha256').update(ip).digest('hex');

const pedirAlerta = (cuerpo, headers = {}) => new Request('https://local.test/api/alertas-analytics', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(cuerpo),
});

const filas = db => db.prepare('SELECT fecha, destino, salidas FROM calendario_salidas ORDER BY destino')
  .all().then(r => r.results);

const telegram = () => {
  const enviados = [];
  const fn = async texto => { enviados.push(texto); return true; };
  return { enviados, fn };
};

test('la salida del calendario se cuenta por día y destino, sin aviso de Telegram', async t => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();
  const ip = n => ({ 'cf-connecting-ip': `198.51.100.${n}` });

  for (const [n, destino] of [[1, 'oferta'], [2, 'oferta'], [3, 'teclab'], [4, 'preinscripcion']]) {
    const r = await manejarAlertaAnalytics(
      pedirAlerta({ evento: 'calendario-salida', datos: { destino } }, ip(n)), db, { telegram: fn },
    );
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  }

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  assert.deepEqual(await filas(db), [
    { fecha: hoy, destino: 'oferta', salidas: 2 },
    { fecha: hoy, destino: 'preinscripcion', salidas: 1 },
    { fecha: hoy, destino: 'teclab', salidas: 1 },
  ]);
  assert.deepEqual(enviados, []);

  // La lectura del informe devuelve el día y no inventa filas vacías.
  assert.deepEqual(await leerSalidasCalendario(db, hoy, hoy), [
    { fecha: hoy, destino: 'oferta', salidas: 2 },
    { fecha: hoy, destino: 'preinscripcion', salidas: 1 },
    { fecha: hoy, destino: 'teclab', salidas: 1 },
  ]);
});

test('un destino fuera de la lista no se guarda ni rompe la respuesta', async t => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();

  for (const destino of ['todo', '/carreras/abogacia', 'Oferta', '', 7, null, undefined, { a: 1 }]) {
    const r = await manejarAlertaAnalytics(
      pedirAlerta({ evento: 'calendario-salida', datos: { destino } },
        { 'cf-connecting-ip': '198.51.100.20' }), db, { telegram: fn },
    );
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: false });
  }

  assert.deepEqual(await filas(db), []);
  assert.deepEqual(enviados, []);
});

test('la lista de destinos es la misma que clasifica el navegador', async () => {
  const { readFileSync } = await import('node:fs');
  const analytics = readFileSync(new URL('../../lib/analytics.ts', import.meta.url), 'utf8');

  assert.deepEqual([...DESTINOS_CALENDARIO], ['oferta', 'teclab', 'carrera', 'preinscripcion', 'contacto']);
  for (const destino of DESTINOS_CALENDARIO) {
    assert.ok(analytics.includes(`'${destino}'`), `el navegador no clasifica ${destino}`);
    assert.equal(destinoCalendarioValido(destino), true);
  }
});

test('cada IP tiene cupo: un lazo no infla el contador', async t => {
  const { db } = await crearD1(t);
  const ip = '198.51.100.30';

  let guardadas = 0;
  for (let i = 0; i < 70; i += 1) {
    if (await registrarSalidaCalendario(db, 'oferta', ip)) guardadas += 1;
  }

  assert.equal(guardadas, 60);
  const [fila] = await filas(db);
  assert.equal(fila.salidas, 60);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM form_rate_limits').first('n') > 0, true);
  // La IP no se guarda en claro en ninguna parte.
  const claves = await db.prepare('SELECT key FROM form_rate_limits').all()
    .then(r => r.results.map(f => f.key));
  assert.ok(claves.every(clave => !clave.includes(ip)));
  assert.ok(claves.some(clave => clave === `calendario:${hash(ip)}`));
});
