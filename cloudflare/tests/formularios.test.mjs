import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { insertarConsulta } from './helpers/consultas.mjs';
import { CAMPOS, CASAS, camposDe } from '../../components/formularios/casas.ts';
import { manejarFormulario } from '../src/api/formularios.ts';
import { manejarRobotGet, manejarRobotPost } from '../src/api/robot.ts';
import { crearEnlace } from '../src/datos/enlaces.ts';
import { insertarMateria, MATERIA_ID, OTRA_MATERIA_ID } from './helpers/materias.mjs';

// Sólo fixtures sintéticos: el captcha y los pases son puertos dobles y ningún
// efecto externo se ejecuta (no hay fetch en los módulos bajo prueba).

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

test('consulta con preinscripción: precio vigente, mail encolado y efectos atómicos', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  await insertarPrecio(db, 1, { vigente_hasta: '2999-01-01' });
  const carrera = await db.prepare('SELECT nombre FROM carreras WHERE id=1').first('nombre');

  const respuesta = await pedir(sobre('consulta', legajoTeclab({ carrera: carrera.nombre, newsletter: true }), { pase: '' }), { db });
  assert.equal(respuesta.status, 201);
  const cuerpo = await respuesta.json();
  assert.equal(cuerpo.ok, true);
  assert.equal(cuerpo.estado, 'vigente');
  assert.equal(cuerpo.precio.total, 'importe sintético');
  assert.equal(cuerpo.pase, undefined, 'sin el puerto del pase no se inventa uno');

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

test('autoinscripción: legajo completo, carrera con autoinscripción y pase de un solo uso', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  await insertarCarrera(db, 2, { nivel: 'Grado' });
  const carrera = await db.prepare('SELECT nombre FROM carreras WHERE id=1').first('nombre');

  const incompleto = await pedir(sobre('autoinscripcion', { carreraId: 1, email: 'lead@example.invalid' }), { db });
  assert.equal(incompleto.status, 400);
  assert.equal((await incompleto.json()).error, 'Datos inválidos');

  const sinAuto = await pedir(sobre('autoinscripcion', legajoTeclab({ carreraId: 2 })), { db });
  assert.equal(sinAuto.status, 400);
  assert.equal((await sinAuto.json()).error, 'Carrera inválida');

  const ok = await pedir(sobre('autoinscripcion', legajoTeclab({ carrera: carrera.nombre })), { db });
  assert.equal(ok.status, 201);
  const fila = await db.prepare('SELECT * FROM consultas').first();
  assert.equal(fila.tipo, 'Autoinscripción');
  assert.equal(fila.tipo_formulario, 'autoinscripcion');
  assert.equal(fila.dni, '30156456');
  const efectos = (await filas(db)).map(f => f.tipo).sort();
  assert.ok(efectos.includes('aviso-lead') && efectos.includes('robot-encolar'), efectos.join(','));
  // La carrera del fixture no tiene opción en la landing de la sede: no se encola.
  assert.equal(efectos.includes('lead-sede'), false);

  // Un pase ya usado responde como captcha inválido, aunque el captcha sea válido.
  const iat = Date.now() - 60_000;
  const conPase = entorno({
    verificarCaptcha: async () => { throw new Error('no debería llamarse'); },
    verificarPase: (pase, email, carreraId) => (pase === 'pase-sintetico' && carreraId === 1 ? { iat } : null),
  });
  const reuso = await pedir({ kind: 'autoinscripcion', pase: 'pase-sintetico', payload: legajoTeclab({ carrera: carrera.nombre }) }, { db, entorno: conPase });
  assert.equal(reuso.status, 403);
  assert.equal((await reuso.json()).error, 'CAPTCHA inválido');

  const paseAjeno = await pedir({ kind: 'autoinscripcion', pase: 'pase-sintetico', payload: legajoTeclab({ carreraId: 2 }) }, { db, entorno: conPase });
  assert.equal(paseAjeno.status, 403);
});

test('enlace: una sola transacción de consumo, alta y outbox; 16 simultáneos dan uno', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  const carrera = await db.prepare('SELECT nombre FROM carreras WHERE id=1').first('nombre');
  const previa = await insertarConsulta(db, { carrera, email: 'previa@example.invalid' });
  const enlace = await crearEnlace(db, previa);

  const inexistente = await pedir(sobre('enlace', { codigo: 'A'.repeat(32) }), { db });
  assert.equal(inexistente.status, 400);
  assert.equal((await inexistente.json()).error, 'El enlace ya no es válido');

  const antes = await db.prepare('SELECT count(*) AS n FROM consultas').first('n');
  const respuestas = await Promise.all(Array.from({ length: 16 }, () =>
    pedir(sobre('enlace', { codigo: enlace.codigo, newsletter: true }), { db })));
  const estados = respuestas.map(r => r.status);
  assert.equal(estados.filter(estado => estado === 201).length, 1);
  assert.equal(estados.filter(estado => estado === 400).length, 15);
  // El enlace responde sólo el ok, como el handler vigente: el precio no viaja acá.
  const ganadora = respuestas.find(r => r.status === 201);
  assert.deepEqual(await ganadora.json(), { ok: true });

  // La perdedora no deja ni consulta ni efectos.
  assert.equal(await db.prepare('SELECT count(*) AS n FROM consultas').first('n'), antes + 1);
  const fila = await db.prepare("SELECT * FROM consultas WHERE tipo_formulario='autoinscripcion'").first();
  assert.equal(fila.casa, 'teclab');
  assert.equal(fila.carrera, carrera);
  const delAlta = (await filas(db)).filter(f => f.consulta_id === fila.id).map(f => f.tipo).sort();
  assert.deepEqual(delAlta, ['aviso-lead', 'newsletter-alta', 'robot-encolar']);
  assert.notEqual((await db.prepare('SELECT usado_at FROM enlaces_inscripcion WHERE codigo=?1').bind(enlace.codigo).first('usado_at')), null);
});

test('fallo del alta: el batch revierte y el enlace no queda consumido', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  const carrera = await db.prepare('SELECT nombre FROM carreras WHERE id=1').first('nombre');
  const previa = await insertarConsulta(db, { carrera, email: 'previa@example.invalid' });
  const enlace = await crearEnlace(db, previa);

  // Un trigger que aborta el INSERT de la consulta nueva: el batch entero revierte.
  await db.prepare(`CREATE TRIGGER fallo_sintetico BEFORE INSERT ON consultas
    WHEN NEW.tipo_formulario = 'autoinscripcion'
    BEGIN SELECT RAISE(ABORT, 'fallo sintético'); END`).run();
  const respuesta = await pedir(sobre('enlace', { codigo: enlace.codigo }), { db });
  assert.equal(respuesta.status, 500);
  assert.equal((await respuesta.json()).error, 'No se pudo guardar la solicitud');
  assert.equal((await db.prepare('SELECT usado_at FROM enlaces_inscripcion WHERE codigo=?1').bind(enlace.codigo).first('usado_at')), null);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM consultas').first('n'), 1);
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

  for (const kind of ['consulta', 'faq', 'clase', 'precio', 'autoinscripcion', 'enlace']) {
    const payload = {
      consulta: legajoTeclab({ carrera: 'Carrera sintética' }),
      faq: { titulo: 'Pregunta sintética', contacto: 'lead@example.invalid' },
      clase: { rows: [{ materia_id: '11111111-1111-1111-1111-111111111111', telefono: '1111111111', dias: ['lunes'], horarios: ['18:00-20:00'] }] },
      precio: { carreraId: 1, email: 'lead@example.invalid' },
      autoinscripcion: legajoTeclab(),
      enlace: { codigo: 'A'.repeat(32) },
    }[kind];
    const respuesta = await pedir({ kind, token: 'demo', payload }, { db, entorno: demo });
    assert.equal(respuesta.status, 201, kind);
    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.ok, true, kind);
    if (kind === 'consulta' || kind === 'precio' || kind === 'autoinscripcion') {
      assert.equal(cuerpo.estado, 'vigente', kind);
      assert.match(cuerpo.precio.total, /^\$ /);
      assert.match(cuerpo.precio.nota, /demostración/);
    }
  }
  // La preinscripción de Teclab trae pase de demo; el resto, sólo el ok.
  const preinscripcion = await pedir({ kind: 'consulta', token: 'demo', payload: legajoTeclab() }, { db, entorno: demo });
  assert.equal((await preinscripcion.json()).pase, 'demo');

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

test('robot: secreto, barrido, legajo, 404/409 y aviso encolado en el mismo batch', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  const consultaId = await insertarConsulta(db, { carrera: 'Carrera sintética', email: 'robot@example.invalid' });
  const robotId = await db.prepare(`INSERT INTO robot_autoinscripciones(consulta_id) VALUES (?1) RETURNING id`)
    .bind(consultaId).first('id');

  const pedido = (url, init = {}, secreto = 'secreto-sintetico') => new Request(url, {
    ...init, headers: { authorization: `Bearer ${secreto}`, ...(init.headers ?? {}) },
  });
  const base = 'https://local.test/api/robot/autoinscripciones';

  const sinSecreto = await manejarRobotGet(new Request(base), db, undefined);
  assert.equal(sinSecreto.status, 503);
  assert.equal((await sinSecreto.json()).error, 'ROBOT_SECRET sin configurar');

  const ajeno = await manejarRobotGet(pedido(base, {}, 'otro'), db, 'secreto-sintetico');
  assert.equal(ajeno.status, 401);
  assert.equal(ajeno.headers.get('cache-control'), 'no-store');

  const barrido = await manejarRobotGet(pedido(base), db, 'secreto-sintetico');
  assert.deepEqual(await barrido.json(), { ids: [robotId] });

  const idInvalido = await manejarRobotGet(pedido(`${base}?id=0`), db, 'secreto-sintetico');
  assert.equal(idInvalido.status, 400);
  const noEncontrada = await manejarRobotGet(pedido(`${base}?id=999`), db, 'secreto-sintetico');
  assert.equal(noEncontrada.status, 404);

  const legajo = await manejarRobotGet(pedido(`${base}?id=${robotId}`), db, 'secreto-sintetico');
  assert.equal(legajo.status, 200);
  const datos = await legajo.json();
  assert.equal(datos.id, robotId);
  assert.equal(datos.estado, 'pendiente');
  assert.equal(datos.carrera, 'Carrera sintética');
  assert.equal(datos.datos.dni, '12345678');

  const cargada = await manejarRobotPost(pedido(base, {
    method: 'POST', body: JSON.stringify({ id: robotId, estado: 'cargada' }),
  }), db, 'secreto-sintetico');
  assert.equal(cargada.status, 200);
  assert.deepEqual(await cargada.json(), { ok: true, id: robotId, estado: 'cargada', intentos: 0 });
  assert.equal((await filas(db)).length, 0, 'cargada no encola aviso');

  const repetida = await manejarRobotPost(pedido(base, {
    method: 'POST', body: JSON.stringify({ id: robotId, estado: 'error' }),
  }), db, 'secreto-sintetico');
  assert.equal(repetida.status, 409);
  assert.equal((await repetida.json()).error, 'ya estaba cargada');

  const otra = await db.prepare(`INSERT INTO robot_autoinscripciones(consulta_id) VALUES (?1) RETURNING id`)
    .bind(await insertarConsulta(db, { email: 'robot2@example.invalid' })).first('id');
  for (const intento of [1, 2]) {
    const error = await manejarRobotPost(pedido(base, {
      method: 'POST', body: JSON.stringify({ id: otra, estado: 'error', detalle: 'motivo sintético' }),
    }), db, 'secreto-sintetico');
    assert.equal(error.status, 200);
    assert.deepEqual(await error.json(), { ok: true, id: otra, estado: 'error', intentos: intento });
  }
  const avisos = (await filas(db)).filter(f => f.tipo === 'aviso-robot-error');
  assert.deepEqual(avisos.map(f => f.clave), [`robot:${otra}:1`, `robot:${otra}:2`]);
  assert.equal((await db.prepare('SELECT detalle FROM robot_autoinscripciones WHERE id=?1').bind(otra).first('detalle')), 'motivo sintético');

  const cuerpoInvalido = await manejarRobotPost(pedido(base, { method: 'POST', body: '{"id":' }), db, 'secreto-sintetico');
  assert.equal(cuerpoInvalido.status, 400);
  const estadoInvalido = await manejarRobotPost(pedido(base, {
    method: 'POST', body: JSON.stringify({ id: otra, estado: 'pendiente' }),
  }), db, 'secreto-sintetico');
  assert.equal(estadoInvalido.status, 400);
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
