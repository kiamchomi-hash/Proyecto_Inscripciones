import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crearD1 } from './helpers/d1.mjs';
import { manejarAlertaAnalytics } from '../src/api/alertas-analytics.ts';
import { normalizarOrigen, registrarClickWhatsapp } from '../src/datos/whatsapp.ts';

// El clic a WhatsApp es la conversión más transitada del sitio y desde el corte
// a Cloudflare no la medía nadie. Estos tests fijan las tres reglas que la
// sostienen: se cuenta en los dos dispositivos, el aviso de Telegram sigue
// siendo sólo del móvil, y nada de esto puede romper la navegación.

const hash = ip => createHash('sha256').update(ip).digest('hex');

const pedirAlerta = (cuerpo, headers = {}) => new Request('https://local.test/api/alertas-analytics', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(cuerpo),
});

const filas = db => db.prepare('SELECT fecha, origen, movil, clicks FROM whatsapp_clicks ORDER BY origen, movil')
  .all().then(r => r.results);

const telegram = () => {
  const enviados = [];
  const fn = async texto => { enviados.push(texto); return true; };
  return { enviados, fn };
};

test('el clic se cuenta desde móvil y desde escritorio, con el día de Argentina', async t => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();
  const ip = n => ({ 'cf-connecting-ip': `203.0.113.${n}` });

  for (const [n, movil] of [[1, 1], [2, 0], [3, 1]]) {
    const r = await manejarAlertaAnalytics(
      pedirAlerta({ evento: 'whatsapp', datos: { origen: '/carreras/x', movil } }, ip(n)), db, { telegram: fn },
    );
    assert.equal(r.status, 200);
  }

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  assert.deepEqual(await filas(db), [
    { fecha: hoy, origen: '/carreras/x', movil: 0, clicks: 1 },
    { fecha: hoy, origen: '/carreras/x', movil: 1, clicks: 2 },
  ]);

  // Dos clics de móvil, un aviso cada uno; el de escritorio no avisa.
  assert.equal(enviados.length, 2);
});

test('el origen se normaliza: sin query ni hash, y sólo rutas del sitio', async t => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();

  await manejarAlertaAnalytics(
    pedirAlerta({ evento: 'whatsapp', datos: { origen: '/teclab?utm=x#formulario', movil: 0 } },
      { 'cf-connecting-ip': '203.0.113.9' }), db, { telegram: fn },
  );
  const [fila] = await filas(db);
  assert.equal(fila.origen, '/teclab');
  assert.equal(enviados.length, 0);

  assert.equal(normalizarOrigen('https://evil.example/x'), null);
  assert.equal(normalizarOrigen(''), null);
  assert.equal(normalizarOrigen(null), null);

  // Un origen que no es ruta se rechaza antes de escribir (allowlist del aviso).
  const r = await manejarAlertaAnalytics(
    pedirAlerta({ evento: 'whatsapp', datos: { origen: 'https://evil.example', movil: 1 } },
      { 'cf-connecting-ip': '203.0.113.10' }), db, { telegram: fn },
  );
  assert.equal(r.status, 400);
  assert.equal((await filas(db)).length, 1);
});

test('el cupo por IP corta el lazo sin devolver error al navegador', async t => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();
  const headers = { 'cf-connecting-ip': '203.0.113.50' };

  // Se deja el cupo en el máximo: el siguiente clic ya no suma.
  const ahora = await db.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS ahora").first('ahora');
  await db.prepare(`INSERT INTO form_rate_limits(key, window_started_at, request_count)
    VALUES (?1, ?2, 60)`).bind(`whatsapp:${hash('203.0.113.50')}`, ahora).run();

  const r = await manejarAlertaAnalytics(
    pedirAlerta({ evento: 'whatsapp', datos: { origen: '/', movil: 1 } }, headers), db, { telegram: fn },
  );
  assert.equal(r.status, 200);
  assert.deepEqual(await filas(db), []);
  // El aviso tampoco sale: el cupo es anterior a cualquier efecto.
  assert.equal(enviados.length, 0);
});

test('sin base o con la tabla caída, la respuesta sigue siendo 200', async t => {
  const { db } = await crearD1(t);
  await db.prepare('DROP TABLE whatsapp_clicks').run();
  const r = await manejarAlertaAnalytics(
    pedirAlerta({ evento: 'whatsapp', datos: { origen: '/', movil: 1 } },
      { 'cf-connecting-ip': '203.0.113.7' }), db, { telegram: async () => true },
  );
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: false });
});

test('registrarClickWhatsapp rechaza un origen que no es ruta', async t => {
  const { db } = await crearD1(t);
  assert.equal(await registrarClickWhatsapp(db, 'no-es-ruta', true, '203.0.113.8'), false);
  assert.deepEqual(await filas(db), []);
});
