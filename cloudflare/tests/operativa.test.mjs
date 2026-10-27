import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { insertarConsulta } from './helpers/consultas.mjs';
import { sentenciaInsertConsulta } from '../src/api/filas.ts';
import {
  ESTADOS_EFECTO, leerEfecto, listarPendientes, marcarAmbiguo, marcarEnviado, marcarError,
  marcarIntento, marcarOmitido, reintentar, sentenciaEfectos, TOPE_LOTE_OUTBOX,
} from '../src/operativa/outbox.ts';
import { consumirPendientes, ErrorAmbiguo } from '../src/operativa/consumidores.ts';

async function altaConEfectos(db, efectos, cambios = {}) {
  const fila = {
    carrera: 'Carrera sintética', casa: 'teclab', tipo_formulario: 'preinscripcion',
    email: 'lead@example.invalid', telefono: '1111111111',
  };
  Object.assign(fila, cambios);
  const [alta] = await db.batch([
    sentenciaInsertConsulta(db, fila, false),
    sentenciaEfectos(db, efectos),
  ]);
  assert.equal(alta.meta.changes, 1);
  return db.prepare('SELECT max(id) AS id FROM consultas').first('id');
}

const filas = db => db.prepare('SELECT * FROM outbox ORDER BY id').all().then(r => r.results);

test('efectos: una fila por (tipo, clave), sin duplicar al repetir el alta', async t => {
  const { db } = await crearD1(t);
  const consultaId = await altaConEfectos(db, [{ tipo: 'aviso-lead' }, { tipo: 'newsletter-alta' }]);
  const [aviso, newsletter] = await filas(db);
  assert.equal(aviso.consulta_id, consultaId);
  assert.equal(aviso.clave, `consulta:${consultaId}`);
  assert.equal(aviso.estado, 'pendiente');
  assert.equal(aviso.intentos, 0);
  assert.equal(newsletter.tipo, 'newsletter-alta');
  assert.equal(newsletter.detalle, null);

  await assert.rejects(db.prepare(`INSERT INTO outbox(tipo, clave) VALUES ('tipo-inventado', 'x')`).run(), /CHECK/);
  await assert.rejects(db.prepare(`INSERT INTO outbox(tipo, clave) VALUES ('aviso-lead', '')`).run(), /CHECK/);
  assert.throws(() => sentenciaEfectos(db, [{ tipo: 'aviso-lead' }, { tipo: 'aviso-lead' }]), /repetido/);
  assert.deepEqual([...ESTADOS_EFECTO], ['pendiente', 'enviado', 'error', 'ambiguo', 'omitido']);
});

test('estados: intento persistido, enviado terminal y ambiguo nunca se reintenta solo', async t => {
  const { db } = await crearD1(t);
  const consultaId = await altaConEfectos(db, [{ tipo: 'aviso-lead' }]);
  const [efecto] = await filas(db);

  assert.equal(await marcarIntento(db, efecto.id), true);
  assert.equal(await marcarIntento(db, efecto.id), true);
  assert.equal((await leerEfecto(db, efecto.id)).intentos, 2);

  assert.equal(await marcarError(db, efecto.id, 'rechazado'), true);
  assert.equal((await leerEfecto(db, efecto.id)).estado, 'error');
  assert.equal(await reintentar(db, efecto.id), true);
  assert.equal((await leerEfecto(db, efecto.id)).estado, 'pendiente');
  assert.equal(await reintentar(db, efecto.id), false, 'un pendiente no se reintenta');

  assert.equal(await marcarAmbiguo(db, efecto.id, 'timeout'), true);
  assert.equal((await leerEfecto(db, efecto.id)).estado, 'ambiguo');
  assert.equal(await reintentar(db, efecto.id), false, 'un ambiguo no vuelve solo');
  assert.equal((await listarPendientes(db)).length, 0);

  await db.prepare("UPDATE outbox SET estado='pendiente' WHERE id=?1").bind(efecto.id).run();
  assert.equal(await marcarEnviado(db, efecto.id), true);
  // Terminal: un fallo o una entrega repetida no lo reinicia.
  assert.equal(await marcarEnviado(db, efecto.id), false);
  assert.equal(await marcarError(db, efecto.id, 'tarde'), false);
  assert.equal(await marcarOmitido(db, efecto.id, 'tarde'), false);
  assert.equal((await leerEfecto(db, efecto.id)).estado, 'enviado');
  assert.equal(await marcarEnviado(db, 9999), false);
});

test('barrido: transportes simulados, error conocido, ambiguo sin reintento y sin transporte', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  await insertarPrecio(db, 1, { vigente_hasta: '2999-01-01' });
  await altaConEfectos(db, [{ tipo: 'aviso-lead' }]);
  await altaConEfectos(db, [{ tipo: 'mail-precio', detalle: { carreraId: 1, limitar: false } }], {
    email: 'rechazado@example.invalid',
  });
  await altaConEfectos(db, [{ tipo: 'mail-precio', detalle: { carreraId: 1, limitar: false } }], {
    email: 'ambiguo@example.invalid',
  });
  // Una carrera del fixture no tiene opción en la landing de la sede: se omite.
  await altaConEfectos(db, [{ tipo: 'lead-sede' }]);

  const enviadosTelegram = [];
  const resumen = await consumirPendientes(db, {
    telegram: async pedido => { enviadosTelegram.push(pedido); return 'enviado'; },
    mail: async pedido => {
      if (pedido.para.startsWith('ambiguo')) throw new ErrorAmbiguo('timeout');
      return 'rechazado';
    },
  });
  assert.deepEqual(resumen, {
    leidos: 4, enviados: 1, errores: 1, ambiguos: 1, omitidos: 1, sinTransporte: 0,
  });
  assert.equal(enviadosTelegram.length, 1);
  assert.equal(enviadosTelegram[0].tipo, 'aviso-lead');

  const porTipo = new Map((await filas(db)).map(f => [f.tipo, f]));
  assert.equal(porTipo.get('aviso-lead').estado, 'enviado');
  assert.equal(porTipo.get('lead-sede').estado, 'omitido');
  const comercial = (await filas(db)).filter(f => f.tipo === 'mail-precio');
  assert.deepEqual(comercial.map(f => `${f.estado}:${f.ultimo_error ?? ''}`).sort(),
    ['ambiguo:timeout', 'error:rechazado']);

  // El ambiguo no vuelve a salir en un barrido nuevo; el error sí, sólo si se pide.
  const segundo = await consumirPendientes(db, {
    telegram: async () => 'enviado', hubspot: async () => 'enviado', mail: async () => 'enviado',
  });
  assert.equal(segundo.leidos, 0);

  const error = comercial.find(f => f.estado === 'error');
  assert.equal(await reintentar(db, error.id), true);
  const tercero = await consumirPendientes(db, { mail: async () => 'enviado' });
  assert.equal(tercero.enviados, 1);
  assert.equal((await leerEfecto(db, error.id)).intentos, 2);
});

test('sin transporte configurado la intención sigue pendiente y no se marca enviada', async t => {
  const { db } = await crearD1(t);
  await altaConEfectos(db, [{ tipo: 'aviso-lead' }]);
  const resumen = await consumirPendientes(db, {});
  assert.equal(resumen.sinTransporte, 1);
  const [efecto] = await filas(db);
  assert.equal(efecto.estado, 'pendiente');
  assert.equal(efecto.intentos, 0);

  // El tope del barrido no es una política de reintentos: sólo acota el lote.
  assert.equal(TOPE_LOTE_OUTBOX, 20);
  await assert.rejects(listarPendientes(db, 101), /Límite/);
});

test('mail del precio: la reserva de 168 h omite el reenvío y no se libera por fallo', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología' });
  await insertarPrecio(db, 1, { vigente_hasta: '2999-01-01' });
  await altaConEfectos(db, [{ tipo: 'mail-precio', detalle: { carreraId: 1, limitar: true } }], {
    email: 'precio@example.invalid',
  });

  const enviados = [];
  const primero = await consumirPendientes(db, { mail: async pedido => { enviados.push(pedido); return 'enviado'; } });
  assert.equal(primero.enviados, 1);
  assert.equal(enviados[0].para, 'precio@example.invalid');
  assert.equal(enviados[0].precio.estado, 'vigente');
  const reserva = await db.prepare('SELECT * FROM reservas_mail_precio').all();
  assert.equal(reserva.results.length, 1);

  // Un segundo lead del mismo mail y carrera dentro de la ventana no manda otro mail.
  await altaConEfectos(db, [{ tipo: 'mail-precio', detalle: { carreraId: 1, limitar: true } }], {
    email: 'Precio@Example.invalid',
  });
  const segundo = await consumirPendientes(db, { mail: async () => 'enviado' });
  assert.equal(segundo.omitidos, 1);
  const omitido = (await filas(db)).find(f => f.estado === 'omitido');
  assert.equal(omitido.ultimo_error, 'reserva-vigente');

  // «Ver precio» sin precio vigente no inventa un envío.
  await db.prepare("UPDATE precios_privados SET vigente_hasta='2000-01-01'").run();
  await db.prepare("UPDATE reservas_mail_precio SET reservado_at='2000-01-01T00:00:00.000Z'").run();
  await altaConEfectos(db, [{ tipo: 'mail-precio', detalle: { carreraId: 1, limitar: true } }], {
    email: 'otro@example.invalid',
  });
  await consumirPendientes(db, { mail: async () => 'enviado' });
  const sinVigencia = (await filas(db)).filter(f => f.estado === 'omitido').map(f => f.ultimo_error);
  assert.deepEqual(sinVigencia.sort(), ['reserva-vigente', 'sin-precio-vigente']);
});

test('newsletter: alta por carrera, general única, renovación y baja sin borrar', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nombre: 'Carrera sintética' });
  await altaConEfectos(db, [{ tipo: 'newsletter-alta', detalle: { carreraId: 1 } }], {
    email: 'Ana@Example.invalid', carrera: 'Carrera sintética',
  });
  const primero = await consumirPendientes(db, {});
  assert.equal(primero.enviados, 1);

  let suscripciones = (await db.prepare('SELECT * FROM suscripciones_newsletter').all()).results;
  assert.equal(suscripciones.length, 1);
  assert.equal(suscripciones[0].email, 'ana@example.invalid');
  assert.equal(suscripciones[0].carrera_id, 1);
  assert.equal(suscripciones[0].carrera_nombre, 'Carrera sintética');
  assert.equal(suscripciones[0].activo, 1);
  assert.match(suscripciones[0].id, /^[0-9a-f-]{36}$/);

  // Repetir la suscripción la renueva: misma fila, consentimiento nuevo.
  const consentimiento = suscripciones[0].consentimiento_at;
  await db.prepare("UPDATE suscripciones_newsletter SET consentimiento_at='2020-01-01T00:00:00.000Z', activo=0").run();
  await altaConEfectos(db, [{ tipo: 'newsletter-alta', detalle: { carreraId: 1 } }], {
    email: 'ana@example.invalid', carrera: 'Carrera sintética',
  });
  await consumirPendientes(db, {});
  suscripciones = (await db.prepare('SELECT * FROM suscripciones_newsletter').all()).results;
  assert.equal(suscripciones.length, 1);
  assert.equal(suscripciones[0].activo, 1);
  assert.notEqual(suscripciones[0].consentimiento_at, '2020-01-01T00:00:00.000Z');
  assert.notEqual(suscripciones[0].consentimiento_at, consentimiento);

  // Sin carrera es una general por mail, aunque se repita.
  for (const email of ['general@example.invalid', 'GENERAL@example.invalid']) {
    await altaConEfectos(db, [{ tipo: 'newsletter-alta', detalle: { carreraId: null } }], { email });
    await consumirPendientes(db, {});
  }
  const generales = (await db.prepare('SELECT * FROM suscripciones_newsletter WHERE carrera_id IS NULL').all()).results;
  assert.equal(generales.length, 1);
  assert.equal(generales[0].carrera_nombre, null);

  // La baja marca activo=0: la fila se conserva y el cron deja de tomarla.
  const { darDeBaja } = await import('../src/datos/newsletter.ts');
  assert.equal(await darDeBaja(db, generales[0].id), true);
  assert.equal((await db.prepare('SELECT activo FROM suscripciones_newsletter WHERE id=?1')
    .bind(generales[0].id).first('activo')), 0);
  await assert.rejects(darDeBaja(db, 'no-es-uuid'), /ID de suscripción inválido/);
  await assert.rejects(db.prepare(`INSERT INTO suscripciones_newsletter(id,email,carrera_id)
    VALUES ('${crypto.randomUUID()}','otro@example.invalid', 1)`).run().then(() =>
    db.prepare(`INSERT INTO suscripciones_newsletter(id,email,carrera_id)
      VALUES ('${crypto.randomUUID()}','otro@example.invalid', 1)`).run()), /UNIQUE/);
});

test('avisos de faq y clase: la fuente y el id viajan al transporte', async t => {
  const { db } = await crearD1(t);
  const { insertarMateria } = await import('./helpers/materias.mjs');
  await insertarMateria(db);
  const { sentenciaEfectosFaq, sentenciaEfectosClase } = await import('../src/operativa/outbox.ts');
  const { sentenciaInsertFaq, sentenciaInsertClases } = await import('../src/api/filas.ts');

  // FAQ: su aviso se ancla en `faq_id` y el newsletter en el contacto.
  await db.batch([
    sentenciaInsertFaq(db, { titulo: 'Pregunta sintética', modo: 'privada', contacto: 'lead@example.invalid' }),
    sentenciaEfectosFaq(db, [{ tipo: 'aviso-lead' }, { tipo: 'newsletter-alta' }]),
  ]);
  const faqId = await db.prepare('SELECT max(id) AS id FROM faq_preguntas').first('id');

  // Clases: un aviso por fila, con el id ya generado.
  const ids = [crypto.randomUUID(), crypto.randomUUID()];
  await db.batch([
    sentenciaInsertClases(db, ids.map(id => ({
      materia_id: '11111111-1111-1111-1111-111111111111', telefono: '1111111111',
      dias: ['lunes'], horarios: ['18:00-20:00'], nombre: null, bloqueo_semanal: false,
    })), ids),
    sentenciaEfectosClase(db, ids, [{ tipo: 'aviso-lead' }]),
  ]);

  const pedidos = [];
  const resumen = await consumirPendientes(db, {
    telegram: async pedido => { pedidos.push(pedido); return 'enviado'; },
  });
  assert.equal(resumen.enviados, 4);
  assert.deepEqual(
    pedidos.filter(p => p.tipo === 'aviso-lead').map(p => `${p.fuente}:${p.id}`).sort(),
    [`clase:${ids[0]}`, `clase:${ids[1]}`, `faq:${faqId}`].sort(),
  );
  // El newsletter de la FAQ se suscribe general, con el contacto como mail.
  const suscripcion = await db.prepare('SELECT * FROM suscripciones_newsletter').first();
  assert.equal(suscripcion.email, 'lead@example.invalid');
  assert.equal(suscripcion.carrera_id, null);

  // Un ancla sin fila de origen no se marca enviada: queda omitida y visible.
  await db.prepare(`INSERT INTO outbox(tipo, clave) VALUES ('aviso-lead', 'huerfano:1')`).run();
  const otro = await consumirPendientes(db, { telegram: async () => 'enviado' });
  assert.equal(otro.omitidos, 1);
  assert.equal((await db.prepare("SELECT ultimo_error FROM outbox WHERE clave='huerfano:1'").first('ultimo_error')), 'sin-ancla');
});
