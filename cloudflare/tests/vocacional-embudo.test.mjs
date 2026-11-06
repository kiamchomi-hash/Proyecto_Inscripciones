import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { crearD1 } from './helpers/d1.mjs';
import { manejarAlertaAnalytics } from '../src/api/alertas-analytics.ts';
import { EVENTOS_VOCACIONAL_MEDIDOS } from '../../lib/vocacional-analytics.ts';
import {
  MAXIMO_POR_IP, eventoEmbudoValido, leerEmbudoVocacional, registrarEventoVocacional,
} from '../src/datos/vocacional-embudo.ts';

// Desde el corte a Cloudflare el embudo vocacional se quedaba en memoria del
// navegador y no se podía leer en qué pregunta se caía la gente. Estas pruebas
// fijan las reglas del contador: se guarda por día, test, evento y pregunta;
// sólo acepta los pasos de la lista cerrada; y no manda aviso de Telegram.

const hash = ip => createHash('sha256').update(ip).digest('hex');

const pedirAlerta = (cuerpo, headers = {}) => new Request('https://local.test/api/alertas-analytics', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(cuerpo),
});

const filas = db => db.prepare(
  'SELECT fecha, test, evento, pregunta, veces FROM vocacional_embudo ORDER BY test, evento, pregunta',
).all().then(r => r.results);

const telegram = () => {
  const enviados = [];
  const fn = async texto => { enviados.push(texto); return true; };
  return { enviados, fn };
};

test('cada paso del test se cuenta por día, test, evento y pregunta, sin aviso', async t => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();
  const ip = n => ({ 'cf-connecting-ip': `198.51.100.${n}` });

  const pasos = [
    [1, { test: 'general', evento: 'vocacional-iniciado', pregunta: 1 }],
    [2, { test: 'general', evento: 'vocacional-pregunta', pregunta: 2 }],
    [3, { test: 'general', evento: 'vocacional-pregunta', pregunta: 2 }],
    [4, { test: 'general', evento: 'vocacional-completado', pregunta: 10 }],
    [5, { test: 'teclab', evento: 'vocacional-iniciado', pregunta: 1 }],
    [6, { test: 'teclab', evento: 'vocacional-salida', pregunta: 4 }],
  ];

  for (const [n, { test: casa, evento, pregunta }] of pasos) {
    const r = await manejarAlertaAnalytics(
      pedirAlerta({ evento, datos: { test: casa, pregunta, total: 10, respondidas: pregunta } }, ip(n)),
      db, { telegram: fn },
    );
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  }

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  assert.deepEqual(await filas(db), [
    { fecha: hoy, test: 'general', evento: 'vocacional-completado', pregunta: 10, veces: 1 },
    { fecha: hoy, test: 'general', evento: 'vocacional-iniciado', pregunta: 1, veces: 1 },
    { fecha: hoy, test: 'general', evento: 'vocacional-pregunta', pregunta: 2, veces: 2 },
    { fecha: hoy, test: 'teclab', evento: 'vocacional-iniciado', pregunta: 1, veces: 1 },
    { fecha: hoy, test: 'teclab', evento: 'vocacional-salida', pregunta: 4, veces: 1 },
  ]);
  assert.deepEqual(enviados, []);

  // La lectura del informe filtra por test y no inventa filas vacías.
  assert.deepEqual(await leerEmbudoVocacional(db, hoy, hoy, 'teclab'), [
    { fecha: hoy, test: 'teclab', evento: 'vocacional-iniciado', pregunta: 1, veces: 1 },
    { fecha: hoy, test: 'teclab', evento: 'vocacional-salida', pregunta: 4, veces: 1 },
  ]);
  assert.equal((await leerEmbudoVocacional(db, hoy, hoy)).length, 5);
});

test('un paso fuera de la lista, un test desconocido o una pregunta inválida no se guardan', async t => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();
  const cabeceras = { 'cf-connecting-ip': '198.51.100.20' };

  const invalidos = [
    { evento: 'vocacional-cta', datos: { test: 'general', pregunta: 1 } },
    { evento: 'vocacional-retroceso', datos: { test: 'general', pregunta: 1 } },
    { evento: 'vocacional-reiniciado', datos: { test: 'general', pregunta: 1 } },
    { evento: 'vocacional-iniciado', datos: { test: 'identidad', pregunta: 1 } },
    { evento: 'vocacional-iniciado', datos: { test: 'General', pregunta: 1 } },
    { evento: 'vocacional-iniciado', datos: { test: 'general', pregunta: 0 } },
    { evento: 'vocacional-iniciado', datos: { test: 'general', pregunta: 31 } },
    { evento: 'vocacional-iniciado', datos: { test: 'general', pregunta: 1.5 } },
    { evento: 'vocacional-iniciado', datos: { test: 'general', pregunta: '2' } },
    { evento: 'vocacional-iniciado', datos: { test: 'general' } },
    { evento: 'vocacional-iniciado', datos: {} },
  ];

  for (const cuerpo of invalidos) {
    const r = await manejarAlertaAnalytics(pedirAlerta(cuerpo, cabeceras), db, { telegram: fn });
    assert.equal(r.status, 200, JSON.stringify(cuerpo));
    assert.deepEqual(await r.json(), { ok: false }, JSON.stringify(cuerpo));
  }

  assert.deepEqual(await filas(db), []);
  assert.deepEqual(enviados, []);
});

test('la lista de pasos es la misma que manda el navegador y la que acepta la base', () => {
  assert.deepEqual([...EVENTOS_VOCACIONAL_MEDIDOS], [
    'vocacional-iniciado', 'vocacional-pregunta', 'vocacional-completado', 'vocacional-salida',
  ]);

  const migracion = readFileSync(
    new URL('../migrations/0014_vocacional_embudo.sql', import.meta.url), 'utf8',
  );
  for (const evento of EVENTOS_VOCACIONAL_MEDIDOS) {
    assert.ok(eventoEmbudoValido(evento), evento);
    assert.ok(migracion.includes(`'${evento}'`), `la migración no acepta ${evento}`);
  }
  // `cta`, `retroceso` y `reiniciado` se quedan en el navegador a propósito.
  for (const afuera of ['vocacional-cta', 'vocacional-retroceso', 'vocacional-reiniciado']) {
    assert.equal(eventoEmbudoValido(afuera), false, afuera);
    assert.equal(migracion.includes(`'${afuera}'`), false, afuera);
  }
});

test('cada IP tiene cupo: un lazo no infla el contador', async t => {
  const { db } = await crearD1(t);
  const ip = '198.51.100.30';
  const clave = `vocacional:${hash(ip)}`;

  assert.equal(
    await registrarEventoVocacional(db, 'vocacional-pregunta', { test: 'general', pregunta: 2 }, ip),
    true,
  );
  const [fila] = await filas(db);
  assert.equal(fila.veces, 1);

  // La IP no se guarda en claro: queda su hash como clave del cupo.
  const claves = await db.prepare('SELECT key FROM form_rate_limits').all()
    .then(r => r.results.map(f => f.key));
  assert.ok(claves.every(clave => !clave.includes(ip)));
  assert.ok(claves.includes(clave));

  // Con el cupo agotado el paso no se suma, pero la respuesta sigue siendo 200.
  await db.prepare('UPDATE form_rate_limits SET request_count = ?1 WHERE key = ?2')
    .bind(MAXIMO_POR_IP, clave).run();
  const r = await manejarAlertaAnalytics(
    pedirAlerta({ evento: 'vocacional-pregunta', datos: { test: 'general', pregunta: 2 } },
      { 'cf-connecting-ip': ip }),
    db, { telegram: async () => true },
  );
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: false });
  assert.equal((await filas(db))[0].veces, 1);
});
