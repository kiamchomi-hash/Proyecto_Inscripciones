import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { CAMPOS, CASAS, camposDe } from '../../components/formularios/casas.ts';
import { manejarFormulario } from '../src/api/formularios.ts';
import { insertarMateria, MATERIA_ID, OTRA_MATERIA_ID } from './helpers/materias.mjs';

// Sólo fixtures sintéticos: el captcha es un puerto doble y ningún efecto
// externo se ejecuta (no hay fetch en los módulos bajo prueba).

const entorno = (extra = {}) => ({
  captchaConfigurado: true,
  pruebaLocal: false,
  verificarCaptcha: async () => true,
  ...extra,
});

let ip = 0;
const pedir = (cuerpo, { headers = {}, entorno: config = entorno(), db } = {}) => {
  ip += 1;
  const request = new Request('https://local.test/api/formularios', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': `203.0.113.${ip}`, ...headers },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });
  return manejarFormulario(request, db, config);
};

const sobre = (kind, payload, extra = {}) => ({ kind, token: 'token-sintetico', payload, ...extra });

function legajoTeclab(extra = {}) {
  const payload = {};
  for (const campo of camposDe('teclab', 'preinscripcion')) {
    payload[campo] = CAMPOS[campo].opciones?.[0] ?? 'Fixture sintético';
  }
  return {
    ...payload, casa: 'teclab', tipoFormulario: 'preinscripcion',
    dni: '30156456', email: 'lead@example.invalid', telefono: '11 1234-5678', carreraId: 1, ...extra,
  };
}

const filas = db => db.prepare('SELECT * FROM outbox ORDER BY id').all().then(r => r.results);

test('sobre: los 400 del handler vigente y el 503 sin servicio', async t => {
  const { db } = await crearD1(t);

  const casos = [
    ['{"kind":', 'Solicitud inválida'],
    [[], 'Solicitud inválida'],
    [{ kind: 'consulta', token: 'x', payload: {} }, 'Datos de contacto inválidos'],
    [{ kind: 'otro', token: 'x', payload: {} }, 'Solicitud inválida'],
    [{ kind: 'consulta', payload: {} }, 'Solicitud inválida'],
    [{ kind: 'consulta', token: 'x', payload: [] }, 'Solicitud inválida'],
    // La autoinscripción de Teclab y el enlace personalizado se dieron de baja
    // el 27/10/2026: sus `kind` ya no existen y el sobre no los acepta.
    [{ kind: 'autoinscripcion', token: 'x', payload: { carreraId: 1 } }, 'Solicitud inválida'],
    [{ kind: 'enlace', token: 'x', payload: { codigo: 'A'.repeat(32) } }, 'Solicitud inválida'],
  ];
  for (const [cuerpo, mensaje] of casos) {
    const respuesta = await pedir(cuerpo, { db });
    assert.equal(respuesta.status, 400, JSON.stringify(cuerpo));
    assert.equal((await respuesta.json()).error, mensaje);
  }

  const sinBase = await pedir(sobre('consulta', {}), { db: null });
  assert.equal(sinBase.status, 503);
  assert.equal((await sinBase.json()).error, 'Servicio temporalmente no disponible');

  // Sin captcha configurado no se acepta nada: 503 antes de tocar la base.
  const sinCaptcha = await pedir(sobre('consulta', { email: 'lead@example.invalid' }), {
    db, entorno: entorno({ captchaConfigurado: false }),
  });
  assert.equal(sinCaptcha.status, 503);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM consultas').first('n')), 0);
});

test('captcha y cuota: 403, 429 y el intento concedido no se reembolsa', async t => {
  const { db } = await crearD1(t);
  const payload = { casa: 'teclab', tipoFormulario: 'contacto', email: 'lead@example.invalid', telefono: '1111111111' };

  const rechazado = await pedir(sobre('consulta', payload), {
    db, entorno: entorno({ verificarCaptcha: async () => false }),
  });
  assert.equal(rechazado.status, 403);
  assert.equal((await rechazado.json()).error, 'CAPTCHA inválido');
  assert.equal((await db.prepare('SELECT count(*) AS n FROM consultas').first('n')), 0);
  // El intento fallido ya consumió cupo: quedan 4 de 5.
  assert.equal((await db.prepare('SELECT request_count AS n FROM form_rate_limits').first('n')), 1);

  const headers = { 'cf-connecting-ip': '198.51.100.7' };
  for (let i = 0; i < 5; i += 1) {
    const ok = await pedir(sobre('consulta', payload), { db, headers });
    assert.equal(ok.status, 201);
  }
  const excedido = await pedir(sobre('consulta', payload), { db, headers });
  assert.equal(excedido.status, 429);
  assert.equal((await excedido.json()).error, 'Demasiadas solicitudes');

  // La cuota se cuenta por formulario: el cupo de `precio` sigue intacto.
  const otroFormulario = await pedir(sobre('precio', { carreraId: 1, email: 'lead@example.invalid' }), { db, headers });
  assert.equal(otroFormulario.status, 400, 'sin carrera con precio el payload falla después de la cuota');
});

test('campos por casa: se guarda lo declarado y los booleanos siempre', async t => {
  const { db } = await crearD1(t);
  const payload = {
    casa: 'teclab', tipoFormulario: 'contacto', nombre: 'Ana', apellido: 'Pérez',
    email: 'ana@example.invalid', telefono: '11 1234-5678', equivalencias: 'sí', dni: '30156456',
    barrio: 'Lugano',
  };
  const respuesta = await pedir(sobre('consulta', payload), { db });
  assert.equal(respuesta.status, 201);
  assert.deepEqual(await respuesta.json(), { ok: true });

  const fila = await db.prepare('SELECT * FROM consultas').first();
  assert.equal(fila.casa, 'teclab');
  assert.equal(fila.tipo_formulario, 'contacto');
  assert.equal(fila.nombre, 'Ana');
  // `equivalencias` no es un checkbox válido (sólo `true`) y Teclab no lo pide:
  // queda false y no rompe el INSERT.
  assert.equal(fila.equivalencias, 0);
  // Un campo no declarado por la casa y el modo no se guarda.
  assert.equal(fila.barrio, null);
  assert.equal(fila.dni, null);

  const contactoInvalido = await pedir(sobre('consulta', { casa: 'teclab', tipoFormulario: 'contacto' }), { db });
  assert.equal(contactoInvalido.status, 400);
  assert.equal((await contactoInvalido.json()).error, 'Datos de contacto inválidos');
});

test('el formulario rápido del lateral entra como consulta de contacto', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });

  // Lo que manda `components/carreras/formulario-rapido.tsx`: los cuatro datos y
  // la carrera de la ficha, sin `newsletter` (no hay casilla a la vista).
  const respuesta = await pedir(sobre('consulta', {
    casa: 'teclab',
    tipoFormulario: 'contacto',
    carrera: 'Tecnicatura Superior en Programación',
    carreraId: 1,
    nombre: 'Ana',
    apellido: 'Pérez',
    email: 'lead@example.invalid',
    telefono: '11 1234-5678',
  }), { db });
  assert.equal(respuesta.status, 201);
  assert.deepEqual(await respuesta.json(), { ok: true });

  const fila = await db.prepare('SELECT * FROM consultas').first();
  assert.equal(fila.casa, 'teclab');
  assert.equal(fila.tipo_formulario, 'contacto');
  assert.equal(fila.carrera, 'Tecnicatura Superior en Programación');
  assert.equal(fila.nombre, 'Ana');
  assert.equal(fila.apellido, 'Pérez');
  assert.equal(fila.email, 'lead@example.invalid');
  assert.equal(fila.telefono, '11 1234-5678');

  // Sin consentimiento no se suscribe a nadie.
  const efectos = (await filas(db)).map(f => f.tipo).sort();
  assert.deepEqual(efectos, ['aviso-lead']);
});

test('consulta con preinscripción: precio vigente, mail encolado y efectos atómicos', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  await insertarPrecio(db, 1, { vigente_hasta: '2999-01-01' });
  const carrera = await db.prepare('SELECT nombre FROM carreras WHERE id=1').first('nombre');

  const respuesta = await pedir(sobre('consulta', legajoTeclab({ carrera: carrera.nombre, newsletter: true })), { db });
  assert.equal(respuesta.status, 201);
  const cuerpo = await respuesta.json();
  assert.equal(cuerpo.ok, true);
  assert.equal(cuerpo.estado, 'vigente');
  assert.equal(cuerpo.precio.total, 'importe sintético');

  const efectos = (await filas(db)).map(f => f.tipo).sort();
  assert.deepEqual(efectos, ['aviso-lead', 'mail-precio', 'newsletter-alta']);
  const mail = (await filas(db)).find(f => f.tipo === 'mail-precio');
  assert.deepEqual(JSON.parse(mail.detalle), { carreraId: 1, limitar: false });

  // Precio vencido: el estado viaja como referencia pero no se encola ningún mail.
  await db.prepare("UPDATE precios_privados SET vigente_hasta='2000-01-01'").run();
  const vencido = await pedir(sobre('consulta', legajoTeclab({ carrera: carrera.nombre })), { db });
  assert.equal(vencido.status, 201);
  assert.equal((await vencido.json()).estado, 'vencido');
  assert.equal((await filas(db)).filter(f => f.tipo === 'mail-precio').length, 1);
});

test('precio: validación, carrera sin precio y mail con reserva de 168 h', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  await insertarCarrera(db, 2, { nivel: 'Posgrado' });
  await insertarPrecio(db, 1, { vigente_hasta: '2999-01-01' });

  const invalido = await pedir(sobre('precio', { carreraId: 1, email: 'no-es-mail' }), { db });
  assert.equal(invalido.status, 400);
  assert.equal((await invalido.json()).error, 'Datos inválidos');

  const sinPrecio = await pedir(sobre('precio', { carreraId: 2, email: 'lead@example.invalid' }), { db });
  assert.equal(sinPrecio.status, 400);
  assert.equal((await sinPrecio.json()).error, 'Carrera inválida');

  const ok = await pedir(sobre('precio', { carreraId: 1, email: 'Precio@Example.invalid', newsletter: true }), { db });
  assert.equal(ok.status, 201);
  const cuerpo = await ok.json();
  assert.equal(cuerpo.estado, 'vigente');
  const fila = await db.prepare('SELECT * FROM consultas').first();
  assert.equal(fila.tipo, 'Ver precio');
  assert.equal(fila.tipo_formulario, 'precio');
  assert.equal(fila.equivalencias, 0);
  const mail = (await filas(db)).find(f => f.tipo === 'mail-precio');
  assert.deepEqual(JSON.parse(mail.detalle), { carreraId: 1, limitar: true });
  assert.deepEqual((await filas(db)).map(f => f.tipo).sort(), ['aviso-lead', 'mail-precio', 'newsletter-alta']);
});

test('fallo del alta: el batch revierte y no queda ni consulta ni efecto', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });

  // Un trigger que aborta el INSERT de la consulta: el batch entero revierte,
  // incluidos el aviso y el alta del newsletter que van en el mismo lote.
  await db.prepare(`CREATE TRIGGER fallo_sintetico BEFORE INSERT ON consultas
    BEGIN SELECT RAISE(ABORT, 'fallo sintético'); END`).run();
  const respuesta = await pedir(sobre('consulta', legajoTeclab({ newsletter: true })), { db });
  assert.equal(respuesta.status, 500);
  assert.equal((await respuesta.json()).error, 'No se pudo guardar la solicitud');
  assert.equal(await db.prepare('SELECT count(*) AS n FROM consultas').first('n'), 0);
  assert.equal((await filas(db)).length, 0);
});

test('faq: validación, fila privada por defecto y efectos en el mismo batch', async t => {
  const { db } = await crearD1(t);
  const invalida = await pedir(sobre('faq', { titulo: 'ab', contacto: 'x' }), { db });
  assert.equal(invalida.status, 400);
  assert.equal((await invalida.json()).error, 'Pregunta inválida');

  const publica = await pedir(sobre('faq', {
    titulo: 'Pregunta sintética', descripcion: 'Detalle sintético',
    contacto: 'Ana@Example.invalid', newsletter: true,
  }), { db });
  assert.equal(publica.status, 201);
  assert.deepEqual(await publica.json(), { ok: true });

  const fila = await db.prepare('SELECT * FROM faq_preguntas').first();
  assert.equal(fila.titulo, 'Pregunta sintética');
  assert.equal(fila.modo, 'publica');
  assert.equal(fila.nombre_contacto, null);
  // Nace fuera de la vista pública: la página filtra estado='aprobada' y destacada.
  assert.equal(fila.estado, 'pendiente');
  assert.equal(fila.destacada, 0);
  assert.equal(fila.respuesta, null);

  const efectos = (await filas(db)).map(f => `${f.tipo}:${f.clave}`).sort();
  assert.deepEqual(efectos, [`aviso-lead:faq:${fila.id}`, `newsletter-alta:faq:${fila.id}`]);

  // Privada: guarda el nombre de quien pregunta y no suscribe si el contacto no es mail.
  const privada = await pedir(sobre('faq', {
    titulo: 'Otra pregunta', contacto: '+54 11 1234-5678', modo: 'privada',
    nombre_contacto: 'Ana', newsletter: true,
  }), { db });
  assert.equal(privada.status, 201);
  const segunda = await db.prepare('SELECT * FROM faq_preguntas ORDER BY id DESC LIMIT 1').first();
  assert.equal(segunda.modo, 'privada');
  assert.equal(segunda.nombre_contacto, 'Ana');
  assert.equal((await filas(db)).filter(f => f.faq_id === segunda.id).length, 1, 'sin mail no hay newsletter');
});

test('faq: un fallo del alta revierte la pregunta y sus efectos', async t => {
  const { db } = await crearD1(t);
  await db.prepare(`CREATE TRIGGER fallo_faq BEFORE INSERT ON faq_preguntas
    BEGIN SELECT RAISE(ABORT, 'fallo sintético'); END`).run();
  const respuesta = await pedir(sobre('faq', { titulo: 'Pregunta sintética', contacto: 'lead@example.invalid' }), { db });
  assert.equal(respuesta.status, 500);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM faq_preguntas').first('n'), 0);
  assert.equal((await filas(db)).length, 0);
});

test('clase: una fila por materia y hora, con su aviso y arrays JSON', async t => {
  const { db } = await crearD1(t);
  await insertarMateria(db);
  await insertarMateria(db, { id: OTRA_MATERIA_ID, slug: 'otra' });
  const invalida = await pedir(sobre('clase', { rows: [] }), { db });
  assert.equal(invalida.status, 400);
  assert.equal((await invalida.json()).error, 'Solicitud inválida');

  const ocho = Array.from({ length: 8 }, (_, i) => ({
    materia_id: `${String(i).repeat(8)}-1111-1111-1111-111111111111`,
    telefono: '11 1234-5678', dias: ['lunes'], horarios: ['18:00-20:00'],
  }));
  assert.equal((await pedir(sobre('clase', { rows: ocho }), { db })).status, 400);

  const filasPedido = [
    { materia_id: '11111111-1111-1111-1111-111111111111', telefono: '11 1234-5678', dias: ['lunes', 'miércoles'], horarios: ['18:00-20:00', '9:00-11:00'], nombre: 'Ana' },
    { materia_id: '22222222-2222-2222-2222-222222222222', telefono: '11 1234-5678', dias: ['martes'], horarios: ['18:00-20:00'], bloqueo_semanal: true },
  ];
  const ok = await pedir(sobre('clase', { rows: filasPedido }), { db });
  assert.equal(ok.status, 201);
  assert.deepEqual(await ok.json(), { ok: true });

  const guardadas = (await db.prepare('SELECT * FROM solicitudes_clase ORDER BY id').all()).results;
  assert.equal(guardadas.length, 2);
  for (const fila of guardadas) assert.match(fila.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  const primera = guardadas.find(f => f.materia_id.startsWith('1111'));
  assert.deepEqual(JSON.parse(primera.dias), ['lunes', 'miércoles']);
  assert.deepEqual(JSON.parse(primera.horarios), ['18:00-20:00', '9:00-11:00']);
  assert.equal(primera.nombre, 'Ana');
  assert.equal(primera.bloqueo_semanal, 0);
  assert.equal(guardadas.find(f => f.materia_id.startsWith('2222')).bloqueo_semanal, 1);

  const avisos = (await filas(db)).filter(f => f.tipo === 'aviso-lead');
  assert.deepEqual(avisos.map(f => f.clave).sort(), guardadas.map(f => `clase:${f.id}`).sort());
  assert.deepEqual(avisos.map(f => f.clase_id).sort(), guardadas.map(f => f.id).sort());
});

test('clase: si una fila no entra, no entra ninguna ni se encola nada', async t => {
  const { db } = await crearD1(t);
  await insertarMateria(db, { id: MATERIA_ID });
  await insertarMateria(db, { id: OTRA_MATERIA_ID, slug: 'otra' });
  // El trigger sintético aborta la segunda fila: el batch entero revierte.
  const respuesta = await pedir(sobre('clase', { rows: [
    { materia_id: '11111111-1111-1111-1111-111111111111', telefono: '11 1234-5678', dias: ['lunes'], horarios: ['18:00-20:00'] },
    { materia_id: '22222222-2222-2222-2222-222222222222', telefono: '11 1234-5678', dias: ['martes'], horarios: ['18:00-20:00'] },
  ] }), { db });
  assert.equal(respuesta.status, 201);
  await db.prepare(`CREATE TRIGGER fallo_clase BEFORE INSERT ON solicitudes_clase
    WHEN NEW.materia_id LIKE '2222%'
    BEGIN SELECT RAISE(ABORT, 'fallo sintético'); END`).run();
  const falla = await pedir(sobre('clase', { rows: [
    { materia_id: '11111111-1111-1111-1111-111111111111', telefono: '11 1234-5678', dias: ['lunes'], horarios: ['18:00-20:00'] },
    { materia_id: '22222222-2222-2222-2222-222222222222', telefono: '11 1234-5678', dias: ['martes'], horarios: ['18:00-20:00'] },
  ] }), { db });
  assert.equal(falla.status, 500);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM solicitudes_clase').first('n'), 2, 'sólo la primera solicitud');
  assert.equal((await filas(db)).filter(f => f.tipo === 'aviso-lead').length, 2);
});

test('modo demo: 201 con la misma forma y sin tocar base, cuota ni outbox', async t => {
  const { db } = await crearD1(t);
  const demo = entorno({ demo: true, verificarCaptcha: async () => { throw new Error('no debería llamarse'); } });

  for (const kind of ['consulta', 'faq', 'clase', 'precio']) {
    const payload = {
      consulta: legajoTeclab({ carrera: 'Carrera sintética' }),
      faq: { titulo: 'Pregunta sintética', contacto: 'lead@example.invalid' },
      clase: { rows: [{ materia_id: '11111111-1111-1111-1111-111111111111', telefono: '1111111111', dias: ['lunes'], horarios: ['18:00-20:00'] }] },
      precio: { carreraId: 1, email: 'lead@example.invalid' },
    }[kind];
    const respuesta = await pedir({ kind, token: 'demo', payload }, { db, entorno: demo });
    assert.equal(respuesta.status, 201, kind);
    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.ok, true, kind);
    if (kind === 'consulta' || kind === 'precio') {
      assert.equal(cuerpo.estado, 'vigente', kind);
      assert.match(cuerpo.precio.total, /^\$ /);
      assert.match(cuerpo.precio.nota, /demostración/);
    }
  }
  // La autoinscripción ya no existe: su `kind` no entra ni en modo demo.
  const retirada = await pedir({ kind: 'autoinscripcion', token: 'demo', payload: legajoTeclab() }, { db, entorno: demo });
  assert.equal(retirada.status, 400);
  assert.equal((await retirada.json()).error, 'Solicitud inválida');

  assert.equal(await db.prepare('SELECT count(*) AS n FROM consultas').first('n'), 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM faq_preguntas').first('n'), 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM solicitudes_clase').first('n'), 0);
  assert.equal((await filas(db)).length, 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM form_rate_limits').first('n'), 0);

  // Lo inválido sigue dando 400 y no depende de la base.
  const invalida = await pedir({ kind: 'faq', token: 'demo', payload: { titulo: 'ab', contacto: 'x' } }, { db, entorno: demo });
  assert.equal(invalida.status, 400);
  assert.equal((await invalida.json()).error, 'Pregunta inválida');

  // Fuera de local la bandera no existe: el mismo envío vuelve a la base.
  const real = await pedir({ kind: 'faq', token: 'x', payload: { titulo: 'Pregunta real', contacto: 'lead@example.invalid' } }, { db });
  assert.equal(real.status, 201);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM faq_preguntas').first('n'), 1);
});

test('si el lote no devuelve los ids del outbox, los efectos se publican igual', async t => {
  const { db } = await crearD1(t);
  const payload = { casa: 'teclab', tipoFormulario: 'contacto', email: 'lead@example.invalid', telefono: '1111111111' };

  // Envoltorio que vacía `results` de cada sentencia del lote: reproduce lo que
  // hace producción, donde el RETURNING no llegaba al handler.
  const sinResultados = {
    prepare: sql => db.prepare(sql),
    batch: async sentencias => (await db.batch(sentencias)).map(r => ({ ...r, results: [] })),
  };
  const publicados = [];
  const cola = { send: async mensaje => { publicados.push(mensaje.id); } };

  const respuesta = await pedir(sobre('consulta', payload), {
    db: sinResultados, entorno: entorno({ cola }),
  });
  assert.equal(respuesta.status, 201);

  const pendientes = (await filas(db)).filter(fila => fila.estado === 'pendiente').map(fila => fila.id).sort((a, b) => a - b);
  assert.ok(pendientes.length > 0, 'el alta tiene que dejar efectos pendientes');
  assert.deepEqual([...publicados].sort((a, b) => a - b), pendientes, 'se publican los efectos de este alta');
});
