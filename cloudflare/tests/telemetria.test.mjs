import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crearD1 } from './helpers/d1.mjs';
import { manejarApertura } from '../src/api/tracking.ts';
import { manejarAlertaAnalytics, prepararAlerta } from '../src/api/alertas-analytics.ts';
import { manejarRevalidar, rutasA } from '../src/api/revalidar.ts';

// Telemetría, alertas y revalidación con D1 local y puertos dobles. Ningún test
// llama a Telegram, a un proveedor ni al sitio publicado.

const hash = ip => createHash('sha256').update(ip).digest('hex');

const pedirTrack = (path, cuerpo, headers = {}) => new Request(`https://local.test${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
});

const ahoraDb = db => db.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS ahora").first('ahora');

async function fijarCupo(db, clave, maximo, ventana = 600) {
  const ahora = await ahoraDb(db);
  await db.prepare(`INSERT INTO form_rate_limits(key, window_started_at, request_count)
    VALUES (?1, ?2, ?3)`).bind(clave, ahora, maximo).run();
  // La ventana es de 600 s: el valor de `ventana` documenta el contrato.
  assert.equal(ventana, 600);
}

const clicks = db => db.prepare('SELECT carrera, clicks, origen FROM career_clicks ORDER BY carrera').all()
  .then(r => r.results);

const pedirAlerta = (cuerpo, headers = {}) => new Request('https://local.test/api/alertas-analytics', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
});

const pedirRevalidar = (cuerpo, headers = {}) => new Request('https://local.test/api/revalidar', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
});

test('track-click y track-direct-open: validación, 400/200 y escritura agregada', async t => {
  const { db } = await crearD1(t);
  const base = { 'cf-connecting-ip': '203.0.113.10' };

  const invalidoTexto = await manejarApertura(pedirTrack('/api/track-click', '{'), db, 'modal');
  assert.equal(invalidoTexto.status, 200);
  assert.deepEqual(await invalidoTexto.json(), { ok: false });

  const nulo = await manejarApertura(pedirTrack('/api/track-click', null), db, 'modal');
  assert.equal(nulo.status, 200);
  assert.deepEqual(await nulo.json(), { ok: false });

  const array = await manejarApertura(pedirTrack('/api/track-click', []), db, 'modal');
  assert.equal(array.status, 400);
  assert.deepEqual(await array.json(), { error: 'Carrera inválida' });

  for (const carrera of ['', '   ', 'x'.repeat(201), 7]) {
    const respuesta = await manejarApertura(pedirTrack('/api/track-click', { carrera }), db, 'modal');
    assert.equal(respuesta.status, 400, JSON.stringify(carrera));
  }

  const ok = await manejarApertura(pedirTrack('/api/track-click', { carrera: 'Tecnicatura en Programación' }, base), db, 'modal');
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { ok: true });
  assert.deepEqual(await clicks(db), [{ carrera: 'Tecnicatura en Programación', clicks: 1, origen: 'modal' }]);

  const directa = await manejarApertura(
    pedirTrack('/api/track-direct-open', { carrera: '  Licenciatura en Administración  ' },
      { 'cf-connecting-ip': '203.0.113.11' }), db, 'directa',
  );
  assert.deepEqual(await directa.json(), { ok: true });
  const filas = await clicks(db);
  assert.deepEqual(filas.find(fila => fila.origen === 'directa'),
    { carrera: 'Licenciatura en Administración', clicks: 1, origen: 'directa' });

  // Sin base el error es conocido y no se convierte en 500.
  const sinBase = await manejarApertura(pedirTrack('/api/track-click', { carrera: 'X' }), null, 'modal');
  assert.deepEqual(await sinBase.json(), { ok: false });
  assert.equal(sinBase.status, 200);

  const rota = { prepare() { throw new Error('caída sintética'); } };
  const caida = await manejarApertura(pedirTrack('/api/track-click', { carrera: 'X' }), rota, 'modal');
  assert.deepEqual(await caida.json(), { ok: false });
  assert.equal(caida.status, 200);
});

test('tracking: el cupo es 60/20 y la IP falsificable no mueve la clave', async t => {
  const { db } = await crearD1(t);
  const ip = '198.51.100.20';
  await fijarCupo(db, `click:${hash(ip)}`, 60);
  const excedido = await manejarApertura(
    pedirTrack('/api/track-click', { carrera: 'X' }, { 'cf-connecting-ip': ip }), db, 'modal',
  );
  assert.deepEqual(await excedido.json(), { ok: true, skipped: true });
  assert.equal((await clicks(db)).length, 0);

  // Sin `cf-connecting-ip`, `x-forwarded-for` no se usa: dos valores distintos
  // comparten el mismo cupo `unknown` y el segundo queda fuera.
  const desconocida = 'unknown';
  await fijarCupo(db, `click:${hash(desconocida)}`, 59);
  const primero = await manejarApertura(
    pedirTrack('/api/track-click', { carrera: 'Una' }, { 'x-forwarded-for': '198.51.100.1' }), db, 'modal',
  );
  const segundo = await manejarApertura(
    pedirTrack('/api/track-click', { carrera: 'Otra' }, { 'x-forwarded-for': '198.51.100.2' }), db, 'modal',
  );
  assert.deepEqual(await primero.json(), { ok: true });
  assert.deepEqual(await segundo.json(), { ok: true, skipped: true });
  assert.equal((await clicks(db)).length, 1, 'la cabecera falsificada no crea una cuota nueva');

  // Directa usa 20 y una clave distinta de modal.
  await fijarCupo(db, `direct-open:${hash(ip)}`, 20);
  const directa = await manejarApertura(
    pedirTrack('/api/track-direct-open', { carrera: 'Y' }, { 'cf-connecting-ip': ip }), db, 'directa',
  );
  assert.deepEqual(await directa.json(), { ok: true, skipped: true });
});

test('tracking: 24 aperturas concurrentes respetan el tope de 20', async t => {
  const { db } = await crearD1(t);
  const ip = '198.51.100.30';
  const respuestas = await Promise.all(Array.from({ length: 24 }, (_, i) => manejarApertura(
    pedirTrack('/api/track-direct-open', { carrera: `Carrera ${i}` }, { 'cf-connecting-ip': ip }), db, 'directa',
  )));
  const cuerpos = await Promise.all(respuestas.map(r => r.json()));
  assert.equal(cuerpos.filter(c => c.ok && !c.skipped).length, 20);
  assert.equal(cuerpos.filter(c => c.skipped).length, 4);
  const total = (await clicks(db)).reduce((suma, fila) => suma + fila.clicks, 0);
  assert.equal(total, 20);
  assert.match((await db.prepare('SELECT key FROM form_rate_limits WHERE request_count >= 20').first('key')), /^direct-open:/);
});

test('alertas-analytics: allowlist por evento y campo, sin datos extra', async t => {
  const { db } = await crearD1(t);
  const enviados = [];
  const telegram = async texto => { enviados.push(texto); return true; };
  const ip = n => ({ 'cf-connecting-ip': `198.51.100.${n}` });

  const casos = [
    ['whatsapp', { origen: '/carreras/x', movil: 1, extra: 'no-debe-salir' }, /Clic móvil a WhatsApp\nPágina: \/carreras\/x/],
    ['clase-whatsapp', { materia: 'Matemática', telefono: 'no' }, /Clic a WhatsApp de clases\nMateria: Matemática/],
    ['formulario-fallo', { origen: 'contacto', motivo: 'red' }, /Origen: contacto\nTipo: red/],
    ['formulario-intento', { origen: 'home', modo: 'contacto', resultado: 'captcha' }, /Resultado: captcha/],
    ['formulario-abandonado', {
      origen: 'teclab', modo: 'preinscripcion', ultimo_campo: 'email', motivo: 'abandono', campos_completados: 2,
    }, /Campos completados: 2/],
  ];

  let n = 1;
  for (const [evento, datos, patron] of casos) {
    const respuesta = await manejarAlertaAnalytics(
      pedirAlerta({ evento, datos }, ip(n++)), db, { telegram },
    );
    assert.equal(respuesta.status, 200, evento);
    assert.deepEqual(await respuesta.json(), { ok: true }, evento);
    assert.match(enviados.at(-1), patron, evento);
    assert.doesNotMatch(enviados.at(-1), /no-debe-salir/, evento);
  }

  // Eventos y campos fuera de la allowlist no se relayan.
  const negativos = [
    ['otro', { origen: '/x' }],
    ['whatsapp', { origen: 'https://evil.example' }],
    ['formulario-fallo', { origen: 'home', motivo: 'otro' }],
    ['formulario-intento', { origen: 'home', modo: 'contacto', resultado: 'ok' }],
    ['formulario-abandonado', { origen: 'home', modo: 'contacto', ultimo_campo: '', motivo: 'abandono', campos_completados: 1 }],
    ['formulario-abandonado', { origen: 'home', modo: 'contacto', ultimo_campo: 'x', motivo: 'abandono', campos_completados: -1 }],
  ];
  for (const [evento, datos] of negativos) {
    const respuesta = await manejarAlertaAnalytics(pedirAlerta({ evento, datos }, ip(n++)), db, { telegram });
    assert.equal(respuesta.status, 400, evento);
    assert.deepEqual(await respuesta.json(), { ok: false });
  }

  // El texto de control se limpia en lugar de viajar crudo.
  const control = await manejarAlertaAnalytics(
    pedirAlerta({ evento: 'whatsapp', datos: { origen: '/x\u0000y', movil: 1 } }, ip(n++)), db, { telegram },
  );
  assert.equal(control.status, 200);
  assert.doesNotMatch(enviados.at(-1), /\u0000/);
});

test('alertas-analytics: JSON inválido, configuración y fallos de transporte', async t => {
  const { db } = await crearD1(t);
  const ip = n => ({ 'cf-connecting-ip': `198.51.100.${n}` });

  const jsonInvalido = await manejarAlertaAnalytics(pedirAlerta('{'), db, { telegram: async () => true });
  assert.equal(jsonInvalido.status, 400);
  assert.deepEqual(await jsonInvalido.json(), { ok: false });

  for (const cuerpo of [null, [], 'texto', { evento: 'whatsapp' }, { evento: 'whatsapp', datos: [] }]) {
    const respuesta = await manejarAlertaAnalytics(pedirAlerta(cuerpo), db, { telegram: async () => true });
    assert.equal(respuesta.status, 400, JSON.stringify(cuerpo));
  }

  const valido = { evento: 'whatsapp', datos: { origen: '/x', movil: 1 } };
  const sinCanal = await manejarAlertaAnalytics(pedirAlerta(valido, ip(101)), db, {});
  assert.equal(sinCanal.status, 502);
  assert.deepEqual(await sinCanal.json(), { ok: false });

  const rechazado = await manejarAlertaAnalytics(
    pedirAlerta(valido, ip(102)), db, { telegram: async () => false },
  );
  assert.equal(rechazado.status, 502);

  const excepcion = await manejarAlertaAnalytics(
    pedirAlerta(valido, ip(103)), db, { telegram: async () => { throw new Error('red'); } },
  );
  assert.equal(excepcion.status, 200);
  assert.deepEqual(await excepcion.json(), { ok: false });

  const sinBase = await manejarAlertaAnalytics(pedirAlerta(valido, ip(104)), null, { telegram: async () => true });
  assert.equal(sinBase.status, 200);
  assert.deepEqual(await sinBase.json(), { ok: false });
});

test('alertas-analytics: cupo por evento y digest de la IP de confianza', async t => {
  const { db } = await crearD1(t);
  const ip = '198.51.100.120';
  const clave = `analytics-alert:whatsapp:${hash(ip)}`;
  await fijarCupo(db, clave, 5);
  let llamadas = 0;
  const respuesta = await manejarAlertaAnalytics(
    pedirAlerta({ evento: 'whatsapp', datos: { origen: '/x', movil: 1 } },
      { 'cf-connecting-ip': ip, 'x-forwarded-for': '203.0.113.200' }),
    db, { telegram: async () => { llamadas += 1; return true; } },
  );
  assert.deepEqual(await respuesta.json(), { ok: true, skipped: true });
  assert.equal(llamadas, 0);
  assert.ok(await db.prepare('SELECT 1 FROM form_rate_limits WHERE key = ?1').bind(clave).first());

  // Otra IP con otro `x-forwarded-for` no reutiliza el cupo de la anterior.
  const otra = await manejarAlertaAnalytics(
    pedirAlerta({ evento: 'whatsapp', datos: { origen: '/y', movil: 1 } },
      { 'cf-connecting-ip': '198.51.100.121', 'x-forwarded-for': ip }),
    db, { telegram: async () => true },
  );
  assert.deepEqual(await otra.json(), { ok: true });
});

test('prepararAlerta: allowlist exacta de los cinco eventos', () => {
  assert.equal(prepararAlerta('whatsapp', { origen: '/a' }).maximo, 5);
  assert.equal(prepararAlerta('clase-whatsapp', { materia: 'X' }).maximo, 5);
  assert.equal(prepararAlerta('formulario-fallo', { origen: 'home', motivo: 'servidor' }).maximo, 5);
  assert.equal(prepararAlerta('formulario-intento', { origen: 'home', modo: 'contacto', resultado: 'validacion' }).maximo, 12);
  assert.equal(prepararAlerta('formulario-abandonado', {
    origen: 'home', modo: 'contacto', ultimo_campo: 'email', motivo: 'captcha', campos_completados: 3,
  }).maximo, 12);
  assert.equal(prepararAlerta('formulario-abandonado', {
    origen: 'home', modo: 'contacto', ultimo_campo: 'email', motivo: 'captcha', campos_completados: 3.5,
  }), null);
});

test('revalidar: contrato de autenticación, JSON y tabla sin mapear', async t => {
  const auth = { authorization: 'Bearer secreto-sintetico' };

  const sinSecreto = await manejarRevalidar(pedirRevalidar({ tabla: 'faq_preguntas' }), undefined);
  assert.equal(sinSecreto.status, 503);
  assert.deepEqual(await sinSecreto.json(), { error: 'REVALIDATE_SECRET sin configurar' });

  const otro = await manejarRevalidar(
    pedirRevalidar({ tabla: 'faq_preguntas' }, { authorization: 'Bearer otro' }), 'secreto-sintetico',
  );
  assert.equal(otro.status, 401);

  const jsonInvalido = await manejarRevalidar(pedirRevalidar('{', auth), 'secreto-sintetico');
  assert.equal(jsonInvalido.status, 400);
  assert.deepEqual(await jsonInvalido.json(), { error: 'body invalido' });

  const nulo = await manejarRevalidar(pedirRevalidar(null, auth), 'secreto-sintetico');
  assert.equal(nulo.status, 500);

  // Un JSON válido que no es un objeto con `tabla` no mapea ninguna ruta.
  for (const cuerpo of [{ tabla: 'otra' }, {}, [], 5, 'texto']) {
    const respuesta = await manejarRevalidar(
      pedirRevalidar(JSON.stringify(cuerpo), auth), 'secreto-sintetico',
    );
    assert.equal(respuesta.status, 400, JSON.stringify(cuerpo));
    assert.match((await respuesta.json()).error, /tabla sin rutas asociadas/);
  }
});

test('revalidar: mapeo conservado y sin efectos externos', async t => {
  const { db } = await crearD1(t);
  let fetchLlamado = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async () => { fetchLlamado += 1; return new Response('{}'); };
  t.after(() => { globalThis.fetch = original; });

  const auth = { authorization: 'Bearer secreto-sintetico' };
  const casos = [
    [{ tabla: 'carreras', accion: 'UPDATE', nombre: 'Tecnicatura Superior en Programación', prefix: 'Tecnicatura', nivel: 'Pregrado' },
      ['/', '/teclab', '/teclab/test-vocacional', '/api/carreras-detalle', '/carreras/tecnicatura-superior-en-programacion']],
    [{ tabla: 'carreras', accion: 'INSERT', nombre: 'Licenciatura en Administración', prefix: 'Licenciatura', nivel: 'Grado' },
      ['/', '/teclab', '/teclab/test-vocacional', '/api/carreras-detalle', '/carreras/licenciatura-en-administracion',
        '/carreras/[slug]', '/imagenes']],
    [{ tabla: 'carreras', accion: 'UPDATE', nombre: 'Nueva', prefix: 'Licenciatura', nivel: 'Grado',
      anterior: { nombre: 'Vieja', prefix: 'Licenciatura' } },
    ['/', '/teclab', '/teclab/test-vocacional', '/api/carreras-detalle', '/carreras/licenciatura-en-nueva',
      '/carreras/licenciatura-en-vieja']],
    [{ tabla: 'carreras', accion: 'UPDATE', nombre: 'Ficha oculta', prefix: 'Maestría', nivel: 'Posgrado' },
      ['/', '/teclab', '/teclab/test-vocacional', '/api/carreras-detalle']],
    [{ tabla: 'novedades', accion: 'UPDATE', slug: 'nueva', anterior: { slug: 'vieja' } },
      ['/novedades/[page]', '/novedades/articulo/nueva', '/novedades/articulo/vieja']],
    [{ tabla: 'materias', accion: 'UPDATE', slug: 'fisica', anterior: { slug: 'fisico-quimica' } },
      ['/clases-apoyo', '/clases-apoyo/fisica', '/clases-apoyo/fisico-quimica']],
    [{ tabla: 'faq_preguntas', accion: 'INSERT' }, ['/faq']],
    [{ tabla: 'todo', accion: 'INSERT' }, ['/']],
  ];

  for (const [aviso, esperadas] of casos) {
    const respuesta = await manejarRevalidar(pedirRevalidar(aviso, auth), 'secreto-sintetico');
    assert.equal(respuesta.status, 200, JSON.stringify(aviso));
    assert.deepEqual((await respuesta.json()).rutas, esperadas, JSON.stringify(aviso));
  }

  // La tabla que no corresponde no inventa rutas ni afirma una invalidación.
  assert.deepEqual(rutasA({ tabla: 'faq_preguntas', accion: 'UPDATE' }), [['/faq', 'page']]);
  assert.equal(fetchLlamado, 0, 'el endpoint no hace pedidos externos');
  assert.equal((await db.prepare('SELECT count(*) AS n FROM carreras').first('n')), 0);
});
