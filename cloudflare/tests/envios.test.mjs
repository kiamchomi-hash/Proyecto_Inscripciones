import test from 'node:test';
import assert from 'node:assert/strict';
import { registrarAlias } from './helpers/alias.mjs';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { insertarConsulta } from './helpers/consultas.mjs';
import { insertarMateria, MATERIA_ID } from './helpers/materias.mjs';

// Transportes reales con `fetch` inyectado: ninguna prueba sale a la red ni
// manda un aviso, un mail o un despacho de verdad. Todo el contenido es
// sintético (`example.invalid`).

registrarAlias();
const { crearTransporteMail, crearTransportes, remitenteEstructurado, TIMEOUT_TELEGRAM_MS } = await import('../src/operativa/transportes.ts');
const { manejarCorreoPrueba } = await import('../src/api/correo-prueba.ts');
const {
  consumirEfecto, consumirPendientes, ErrorAmbiguo, ErrorRechazo,
} = await import('../src/operativa/consumidores.ts');
const { manejarLote, publicarEfectos, barridoDeEfectos } = await import('../src/operativa/colas.ts');
const { leerEfecto } = await import('../src/operativa/outbox.ts');
const { manejarFormulario } = await import('../src/api/formularios.ts');
const { CAMPOS, camposDe } = await import('../../components/formularios/casas.ts');

/** Un `buscar` que registra el pedido y responde lo que diga el escenario. */
function espia(responder = () => new Response('{}', { status: 200 })) {
  const llamadas = [];
  const buscar = async (url, init) => {
    llamadas.push({ url, init });
    return responder(url, init);
  };
  return { buscar, llamadas };
}

const json = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

/** Fila de outbox anclada a una consulta, sin pasar por la API. */
async function efectoDeConsulta(db, tipo, detalle = null) {
  const consultaId = await insertarConsulta(db);
  const id = await db.prepare(`INSERT INTO outbox(tipo, clave, consulta_id, detalle)
    VALUES (?1, ?2, ?3, ?4) RETURNING id`)
    .bind(tipo, `consulta:${consultaId}`, consultaId, detalle).first('id');
  return { id, consultaId };
}

const filaOutbox = (db, id) => db.prepare('SELECT * FROM outbox WHERE id = ?1').bind(id).first();

// ── Telegram ──

test('telegram: el aviso de una consulta va con Markdown y el chat configurado', async t => {
  const { db } = await crearD1(t);
  const { id } = await efectoDeConsulta(db, 'aviso-lead');
  const { buscar, llamadas } = espia(() => new Response('{"ok":true}', { status: 200 }));
  const transportes = crearTransportes({ telegram: { token: 'token-sintetico', chatId: '-100123' } }, buscar, db);

  assert.equal(await consumirEfecto(db, id, transportes), 'enviado');
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].url, 'https://api.telegram.org/bottoken-sintetico/sendMessage');
  assert.equal(llamadas[0].init.method, 'POST');
  assert.equal(llamadas[0].init.headers['Content-Type'], 'application/json');
  assert.ok(llamadas[0].init.signal instanceof AbortSignal);
  const cuerpo = JSON.parse(llamadas[0].init.body);
  assert.equal(cuerpo.chat_id, '-100123');
  assert.equal(cuerpo.parse_mode, 'Markdown');
  assert.match(cuerpo.text, /Fixture sintético/);

  const fila = await filaOutbox(db, id);
  assert.equal(fila.estado, 'enviado');
  assert.equal(fila.intentos, 1);
  assert.equal(TIMEOUT_TELEGRAM_MS, 8_000);
});

test('telegram: un aviso de una clase sale de la fila de la solicitud', async t => {
  const { db } = await crearD1(t);
  await insertarMateria(db);
  const claseId = crypto.randomUUID();
  await db.prepare(`INSERT INTO solicitudes_clase(id, materia_id, dias, horarios, nombre, telefono)
    VALUES (?1, ?2, '["lunes"]', '["18:00"]', 'Fixture Sintético', '1111111111')`)
    .bind(claseId, MATERIA_ID).run();
  const outboxId = await db.prepare(`INSERT INTO outbox(tipo, clave, clase_id)
    VALUES ('aviso-lead', ?1, ?2) RETURNING id`).bind(`clase:${claseId}`, claseId).first('id');

  const { buscar, llamadas } = espia(() => new Response('{"ok":true}', { status: 200 }));
  const transportes = crearTransportes({ telegram: { token: 't', chatId: '123' } }, buscar, db);
  assert.equal(await consumirEfecto(db, outboxId, transportes), 'enviado');
  assert.match(JSON.parse(llamadas[0].init.body).text, /Fixture Sintético/);
});

test('telegram: una fila inexistente es rechazo conocido, no ambigüedad', async t => {
  const { db } = await crearD1(t);
  const sinAncla = await db.prepare(`INSERT INTO outbox(tipo, clave, consulta_id)
    VALUES ('aviso-lead', 'consulta:999', NULL) RETURNING id`).first('id');
  const { buscar, llamadas } = espia();
  const transportes = crearTransportes({ telegram: { token: 't', chatId: '1' } }, buscar, db);

  assert.equal(await consumirEfecto(db, sinAncla, transportes), 'omitido');
  assert.equal(llamadas.length, 0, 'sin ancla no se llama al proveedor');
  assert.equal((await filaOutbox(db, sinAncla)).ultimo_error, 'sin-ancla');

  // Anclada a una fila que no está: el transporte no inventa el aviso.
  await assert.rejects(
    () => transportes.telegram({ tipo: 'aviso-lead', fuente: 'consulta', id: 999 }),
    error => error instanceof ErrorRechazo && error.codigo === 'fila-inexistente',
  );
  assert.equal(llamadas.length, 0);
});

test('telegram: sin configuración la intención queda pendiente y sin intentos', async t => {
  const { db } = await crearD1(t);
  const { id } = await efectoDeConsulta(db, 'aviso-lead');
  const { buscar, llamadas } = espia();
  const transportes = crearTransportes({}, buscar, db);

  assert.equal(await consumirEfecto(db, id, transportes), 'sin-transporte');
  assert.equal(llamadas.length, 0);
  const fila = await filaOutbox(db, id);
  assert.equal(fila.estado, 'pendiente', 'sin proveedor la intención es recuperable');
  assert.equal(fila.intentos, 1, 'el intento se persiste aunque el transporte no esté');
});

// ── Clasificación de fallos ──

test('fallos: un no-2xx es rechazo conocido y se puede reintentar', async t => {
  const { db } = await crearD1(t);
  const { id } = await efectoDeConsulta(db, 'aviso-lead');
  const { buscar } = espia(() => new Response('no', { status: 500 }));
  const transportes = crearTransportes({ telegram: { token: 't', chatId: '1' } }, buscar, db);

  assert.equal(await consumirEfecto(db, id, transportes), 'error');
  const fila = await filaOutbox(db, id);
  assert.equal(fila.estado, 'error');
  assert.equal(fila.ultimo_error, 'http-500');
});

test('fallos: una excepción de red después de enviar es ambigua y no se reintenta sola', async t => {
  const { db } = await crearD1(t);
  const { id } = await efectoDeConsulta(db, 'aviso-lead');
  const { buscar } = espia(() => { throw new TypeError('red caída'); });
  const transportes = crearTransportes({ telegram: { token: 't', chatId: '1' } }, buscar, db);

  assert.equal(await consumirEfecto(db, id, transportes), 'ambiguo');
  const fila = await filaOutbox(db, id);
  assert.equal(fila.estado, 'ambiguo');
  assert.equal(fila.ultimo_error, 'TypeError');
  assert.equal(fila.intentos, 1, 'el intento se registró antes de llamar');

  // El barrido sólo toma pendientes: el ambiguo no vuelve a salir.
  const resumen = await consumirPendientes(db, transportes);
  assert.equal(resumen.leidos, 0);
  assert.equal((await filaOutbox(db, id)).intentos, 1);
});

test('fallos: el transporte traduce a las dos clases de error, sin mensaje del proveedor', async t => {
  const { db } = await crearD1(t);
  const { consultaId } = await efectoDeConsulta(db, 'aviso-lead');
  const pedido = { tipo: 'aviso-lead', fuente: 'consulta', id: consultaId };
  const rechazo = crearTransportes(
    { telegram: { token: 't', chatId: '1' } }, espia(() => new Response('x', { status: 429 })).buscar, db,
  );
  await assert.rejects(
    () => rechazo.telegram(pedido),
    error => error instanceof ErrorRechazo && error.codigo === 'http-429',
  );
  const ambiguo = crearTransportes(
    { telegram: { token: 't', chatId: '1' } }, espia(() => { throw new Error('timeout'); }).buscar, db,
  );
  await assert.rejects(
    () => ambiguo.telegram(pedido),
    error => error instanceof ErrorAmbiguo && error.codigo === 'Error',
  );
});

// ── Correo ──

async function prepararPrecio(db) {
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnicatura', nombre: 'Carrera sintética', prefix: null });
  await insertarPrecio(db);
}

const mailPendiente = db =>
  efectoDeConsulta(db, 'mail-precio', JSON.stringify({ carreraId: 1, limitar: false }));

async function escenarioMail(db) {
  await prepararPrecio(db);
  return mailPendiente(db);
}

test('sin binding de correo no hay envío y la fila sigue pendiente', async t => {
  const { db } = await crearD1(t);
  const { id } = await escenarioMail(db);
  const { buscar, llamadas } = espia();
  assert.equal(await consumirEfecto(db, id, crearTransportes({}, buscar, db)), 'sin-transporte');
  assert.equal(llamadas.length, 0);
  assert.equal((await filaOutbox(db, id)).estado, 'pendiente');
});

// ── Binding de correo (Cloudflare Email Sending) ──

/** Un binding `send_email` de mentira: registra los mensajes y hace lo que se le pida. */
function bindingCorreo(comportamiento) {
  const enviados = [];
  return {
    enviados,
    email: {
      async send(mensaje) {
        enviados.push(mensaje);
        if (comportamiento) return comportamiento(mensaje);
        return { messageId: 'mensaje-sintetico' };
      },
    },
  };
}

test('remitente: el nombre y la dirección salen del mismo dueño', () => {
  assert.deepEqual(remitenteEstructurado('CAU Online <inscripciones@siglo21sur.com>'),
    { email: 'inscripciones@siglo21sur.com', name: 'CAU Online' });
  assert.deepEqual(remitenteEstructurado('inscripciones@siglo21sur.com'),
    { email: 'inscripciones@siglo21sur.com' });
  assert.deepEqual(remitenteEstructurado('<solo@example.invalid>'), { email: 'solo@example.invalid' });
});

test('binding: manda por Cloudflare sin clave y con el remitente estructurado', async t => {
  const { db } = await crearD1(t);
  const { id } = await escenarioMail(db);
  const { email, enviados } = bindingCorreo();
  const { buscar, llamadas } = espia();
  const transportes = crearTransportes({ email }, buscar, db);

  assert.equal(await consumirEfecto(db, id, transportes), 'enviado');
  // El binding no usa `fetch`: si se llamara, no habría forma de verlo acá.
  assert.equal(llamadas.length, 0);
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].to, 'fixture@example.invalid');
  assert.deepEqual(enviados[0].from, { email: 'inscripciones@siglo21sur.com', name: 'CAU Online' });
  assert.match(enviados[0].subject, /Precios/);
  assert.ok(enviados[0].html.length > 0 && enviados[0].text.length > 0);
  assert.equal(enviados[0].headers, undefined);
});

test('binding: el error con código es rechazo y sin código es ambiguo', async t => {
  const { db } = await crearD1(t);
  await prepararPrecio(db);

  const rechazado = bindingCorreo(() => {
    throw Object.assign(new Error('sin remitente verificado'), { code: 'E_SENDER_NOT_VERIFIED' });
  });
  const { id } = await mailPendiente(db);
  assert.equal(await consumirEfecto(db, id, crearTransportes({ email: rechazado.email }, espia().buscar, db)), 'error');
  assert.equal((await filaOutbox(db, id)).ultimo_error, 'E_SENDER_NOT_VERIFIED');

  const roto = bindingCorreo(() => { throw new TypeError('falla del runtime'); });
  const otro = await mailPendiente(db);
  assert.equal(await consumirEfecto(db, otro.id, crearTransportes({ email: roto.email }, espia().buscar, db)), 'ambiguo');
  assert.equal((await filaOutbox(db, otro.id)).estado, 'ambiguo');
});

test('binding: el newsletter pasa los encabezados RFC 8058 como objeto', async t => {
  const { email, enviados } = bindingCorreo();
  const mail = crearTransporteMail({ email }, espia().buscar);
  const bajaUrl = 'https://www.siglo21sur.com/newsletter/baja?id=11111111-1111-4111-8111-111111111111';

  assert.equal(await mail({
    para: 'sintetico@example.invalid',
    carrera: {
      id: 1, nombre: 'Carrera sintética', nivel: 'Teclab - Tecnología',
      prefix: null, duracion: '2 años', nombre_corto: 'Sintética',
    },
    precio: { estado: 'vigente', precio: {
      conceptos: [{ concepto: 'Matrícula', monto: '$ 1', descuento: null }],
      total: '$ 1', nota: null, vigenteHasta: '2099-01-01',
    } },
    limitar: false,
    newsletter: {
      bajaUrl,
      encabezados: [
        { header: 'List-Unsubscribe', value: `<${bajaUrl}>` },
        { header: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
      ],
    },
  }), 'enviado');

  assert.deepEqual(enviados[0].headers, {
    'List-Unsubscribe': `<${bajaUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  });
  assert.match(enviados[0].text, /Anular suscripción/);
});

// ── HubSpot ──

test('hubspot: reenvía la URL y el cuerpo ya armados; apagado no llama a la red', async t => {
  const { buscar, llamadas } = espia(() => new Response(null, { status: 204 }));
  const pedido = { url: 'https://api.hsforms.test/submit', body: { fields: [], context: {} } };

  const apagado = crearTransportes({ hubspot: { habilitado: false } }, buscar, {});
  assert.equal(await apagado.hubspot(pedido), 'sin-configurar');
  assert.equal(llamadas.length, 0);

  const encendido = crearTransportes({ hubspot: { habilitado: true } }, buscar, {});
  assert.equal(await encendido.hubspot(pedido), 'enviado');
  assert.equal(llamadas[0].url, 'https://api.hsforms.test/submit');
  assert.equal(llamadas[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(llamadas[0].init.body), { fields: [], context: {} });
});

// ── Queues y barrido ──

function mensaje(cuerpo, intentos = 1) {
  const registro = { cuerpo, intentos, ack: 0, retry: 0 };
  return {
    registro,
    mensaje: {
      body: cuerpo,
      attempts: intentos,
      ack() { registro.ack += 1; },
      retry() { registro.retry += 1; },
    },
  };
}

test('lote: acusa lo inválido, omite lo ya enviado y envía lo pendiente', async t => {
  const { db } = await crearD1(t);
  const { id } = await efectoDeConsulta(db, 'aviso-lead');
  await db.prepare(`UPDATE outbox SET estado = 'enviado' WHERE id = ?1`).bind(id).run();
  const pendiente = await efectoDeConsulta(db, 'aviso-lead');

  const { buscar, llamadas } = espia(() => new Response('{"ok":true}', { status: 200 }));
  const transportes = crearTransportes({ telegram: { token: 't', chatId: '1' } }, buscar, db);

  const invalido = mensaje({ tipo: 'efecto', id: 'uno' });
  const repetido = mensaje({ tipo: 'efecto', id });
  const nuevo = mensaje({ tipo: 'efecto', id: pendiente.id });
  const ajeno = mensaje({ nope: true });

  const resumen = await manejarLote({ messages: [invalido.mensaje, repetido.mensaje, nuevo.mensaje, ajeno.mensaje] }, db, transportes);
  assert.deepEqual(resumen, {
    total: 4, enviados: 1, omitidos: 0, errores: 0, ambiguos: 0,
    sinTransporte: 0, ignorados: 1, invalidos: 2, reintentos: 0,
  });
  assert.equal(invalido.registro.ack, 1);
  assert.equal(ajeno.registro.ack, 1);
  assert.equal(repetido.registro.ack, 1);
  assert.equal(nuevo.registro.ack, 1);
  assert.equal(llamadas.length, 1, 'una entrega repetida no vuelve a llamar al proveedor');
});

test('lote: un error de base se reintenta con el backoff de Queues', async t => {
  const roto = { prepare() { throw new Error('base caída'); } };
  const { registro, mensaje: uno } = mensaje({ tipo: 'efecto', id: 1 });
  const resumen = await manejarLote({ messages: [uno] }, roto, {});
  assert.equal(resumen.reintentos, 1);
  assert.equal(registro.retry, 1);
  assert.equal(registro.ack, 0);
});

test('barrido: recupera lo pendiente y respeta el estado de cada fila', async t => {
  const { db } = await crearD1(t);
  const primero = await efectoDeConsulta(db, 'aviso-lead');
  const segundo = await efectoDeConsulta(db, 'aviso-lead');
  await db.prepare(`UPDATE outbox SET estado = 'ambiguo' WHERE id = ?1`).bind(segundo.id).run();

  const { buscar, llamadas } = espia(() => new Response('{"ok":true}', { status: 200 }));
  const transportes = crearTransportes({ telegram: { token: 't', chatId: '1' } }, buscar, db);
  const resumen = await barridoDeEfectos(db, transportes);
  assert.deepEqual(resumen, { leidos: 1, enviados: 1, errores: 0, ambiguos: 0, omitidos: 0, sinTransporte: 0 });
  assert.equal(llamadas.length, 1);
  assert.equal((await filaOutbox(db, primero.id)).estado, 'enviado');
  assert.equal((await filaOutbox(db, segundo.id)).estado, 'ambiguo');
});

test('publicar: sólo ids válidos, sin duplicados y sin lanzar si la cola falla', async () => {
  const enviados = [];
  const cola = { async send(cuerpo) { enviados.push(cuerpo); } };
  assert.equal(await publicarEfectos(cola, [3, 3, 0, -1, 2.5, 7]), 2);
  assert.deepEqual(enviados, [{ tipo: 'efecto', id: 3 }, { tipo: 'efecto', id: 7 }]);

  const rota = { async send() { throw new TypeError('cola caída'); } };
  assert.equal(await publicarEfectos(rota, [1]), 0);
  assert.equal(await publicarEfectos(undefined, [1]), 0);
  assert.equal(await publicarEfectos(cola, []), 0);
});

// ── Publicación desde la API ──

function legajo(extra = {}) {
  const payload = {};
  for (const campo of camposDe('teclab', 'preinscripcion')) {
    payload[campo] = CAMPOS[campo].opciones?.[0] ?? 'Fixture Sintético';
  }
  return {
    ...payload, casa: 'teclab', tipoFormulario: 'preinscripcion',
    dni: '30156456', email: 'lead@example.invalid', telefono: '11 1234-5678', ...extra,
  };
}

let ip = 0;
function pedir(cuerpo, { entorno = {}, db } = {}) {
  ip += 1;
  const request = new Request('https://local.test/api/formularios', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': `198.51.100.${ip}` },
    body: JSON.stringify(cuerpo),
  });
  return manejarFormulario(request, db, {
    captchaConfigurado: true, pruebaLocal: false, verificarCaptcha: async () => true, ...entorno,
  });
}

test('api: publica sólo las filas recién escritas y responde 201 aunque la cola falle', async t => {
  const { db } = await crearD1(t);
  const enviados = [];
  const respuesta = await pedir(
    { kind: 'consulta', token: 't', payload: legajo() },
    { db, entorno: { cola: { async send(cuerpo) { enviados.push(cuerpo); } } } },
  );
  assert.equal(respuesta.status, 201);
  const filas = await db.prepare('SELECT id FROM outbox ORDER BY id').all();
  assert.equal(filas.results.length, enviados.length);
  assert.deepEqual(enviados.map(m => m.id), filas.results.map(fila => fila.id));
  assert.ok(enviados.every(m => m.tipo === 'efecto'));

  const rota = await pedir(
    { kind: 'consulta', token: 't', payload: legajo({ email: 'otro@example.invalid' }), telefono: '11 5555-5555' },
    { db, entorno: { cola: { async send() { throw new Error('cola caída'); } } } },
  );
  assert.equal(rota.status, 201);
  const pendientes = await db.prepare(`SELECT count(*) AS n FROM outbox WHERE estado = 'pendiente'`).first('n');
  assert.equal(pendientes, 2, 'el aviso de cada alta sigue pendiente para el barrido');
});

test('api: sin cola no publica nada y la respuesta no cambia', async t => {
  const { db } = await crearD1(t);
  const respuesta = await pedir({ kind: 'consulta', token: 't', payload: legajo() }, { db });
  assert.equal(respuesta.status, 201);
  assert.equal(await db.prepare(`SELECT count(*) AS n FROM outbox`).first('n'), 1);
});

// ── Prueba de correo desde el Worker ──

const pedirPrueba = (autorizacion, entorno) => manejarCorreoPrueba(
  new Request('https://www.siglo21sur.com/api/correo-prueba', {
    method: 'POST',
    ...(autorizacion ? { headers: { authorization: `Bearer ${autorizacion}` } } : {}),
  }),
  entorno,
);

test('correo-prueba: sin secreto 503 y con otro bearer 401', async () => {
  const sinSecreto = await pedirPrueba(null, { destino: 'x@example.invalid', mail: async () => 'enviado' });
  assert.equal(sinSecreto.status, 503);
  assert.deepEqual(await sinSecreto.json(), { error: 'CORREO_PRUEBA_SECRETO sin configurar' });

  const otro = await pedirPrueba('otro', {
    secreto: 's', destino: 'x@example.invalid', mail: async () => 'enviado',
  });
  assert.equal(otro.status, 401);
});

test('correo-prueba: sin destino o sin transporte no manda nada', async () => {
  const sinDestino = await pedirPrueba('s', { secreto: 's', mail: async () => 'enviado' });
  assert.equal(sinDestino.status, 503);
  assert.match((await sinDestino.json()).error, /CORREO_PRUEBA_DESTINO/);

  let llamadas = 0;
  const sinTransporte = await pedirPrueba('s', {
    secreto: 's', destino: 'x@example.invalid', mail: undefined,
  });
  assert.equal(sinTransporte.status, 503);
  assert.equal(llamadas, 0);
});

test('correo-prueba: manda al destino fijo y no inventa un ok ajeno', async () => {
  const enviados = [];
  const ok = await pedirPrueba('s', {
    secreto: 's',
    destino: 'destino-fijo@example.invalid',
    mail: async (para) => { enviados.push(para); return 'enviado'; },
  });
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { ok: true });
  assert.deepEqual(enviados, ['destino-fijo@example.invalid']);

  const omitido = await pedirPrueba('s', {
    secreto: 's', destino: 'x@example.invalid', mail: async () => 'sin-configurar',
  });
  assert.equal(omitido.status, 503);
  assert.deepEqual(await omitido.json(), { ok: false, resultado: 'sin-configurar' });
});

test('correo-prueba: rechazo con código 502 y ambiguo 504, sin mensaje del proveedor', async () => {
  const rechazo = await pedirPrueba('s', {
    secreto: 's',
    destino: 'x@example.invalid',
    mail: async () => { throw new ErrorRechazo('E_SENDER_NOT_VERIFIED'); },
  });
  assert.equal(rechazo.status, 502);
  assert.deepEqual(await rechazo.json(), { error: 'E_SENDER_NOT_VERIFIED' });

  const ambiguo = await pedirPrueba('s', {
    secreto: 's',
    destino: 'x@example.invalid',
    mail: async () => { throw new ErrorAmbiguo('TypeError'); },
  });
  assert.equal(ambiguo.status, 504);
  assert.deepEqual(await ambiguo.json(), { error: 'TypeError' });
});
