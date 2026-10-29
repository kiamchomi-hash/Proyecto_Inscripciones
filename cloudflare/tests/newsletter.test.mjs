import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearD1, insertarCarrera, insertarPrecio } from './helpers/d1.mjs';
import { manejarNewsletter } from '../src/api/newsletter.ts';
import { manejarRecordatorio } from '../src/api/recordatorio-teclab.ts';
import { ErrorAmbiguo, ErrorRechazo } from '../src/operativa/consumidores.ts';

// Sólo fixtures D1 y puertos dobles. No se llama a SMTP2GO ni a Telegram y
// ninguna prueba sale de 127.0.0.1.

const AHORA = new Date('2026-10-25T12:00:00.000Z');
const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

async function carreraTeclab(db, id = 1, cambios = {}) {
  await insertarCarrera(db, id, { nivel: 'Teclab - Tecnología', nombre: `Carrera ${id}`, ...cambios });
  await insertarPrecio(db, id, { vigente_hasta: '2099-01-01' });
}

async function suscripcion(db, { id = UUID_A, email = 'fixture@example.invalid', carreraId = 1, activo = 1, ultimo = null } = {}) {
  await db.prepare(`INSERT INTO suscripciones_newsletter(
    id, email, carrera_id, carrera_nombre, activo, ultimo_envio_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
    .bind(id, email, carreraId, carreraId === null ? null : `Carrera ${carreraId}`, activo, ultimo).run();
}

function pedir(headers = {}) {
  return new Request('https://local.test/api/newsletter', { headers });
}

const entorno = (mail, extra = {}) => ({ secretoCron: 'secreto-sintetico', mail, ahora: () => AHORA, ...extra });

async function estadoClaim(db, id = UUID_A) {
  return db.prepare('SELECT estado, ultimo_error, updated_at FROM newsletter_envios WHERE suscripcion_id = ?1')
    .bind(id).first();
}

test('newsletter: autenticación, configuración ausente y base caída fallan cerrado', async t => {
  const { db } = await crearD1(t);
  let llamadas = 0;
  const mail = async () => { llamadas += 1; return 'enviado'; };

  const sinSecreto = await manejarNewsletter(pedir(), db, { mail });
  assert.equal(sinSecreto.status, 503);
  assert.deepEqual(await sinSecreto.json(), { error: 'CRON_SECRET sin configurar' });

  const otro = await manejarNewsletter(pedir({ authorization: 'Bearer otro' }), db, entorno(mail));
  assert.equal(otro.status, 401);
  assert.deepEqual(await otro.json(), { error: 'no autorizado' });

  const sinCorreo = await manejarNewsletter(pedir({ authorization: 'Bearer secreto-sintetico' }), db, {
    secretoCron: 'secreto-sintetico', ahora: () => AHORA,
  });
  assert.equal(sinCorreo.status, 503);
  assert.match((await sinCorreo.json()).error, /transporte de correo/);

  const sinBase = await manejarNewsletter(pedir({ authorization: 'Bearer secreto-sintetico' }), null, entorno(mail));
  assert.equal(sinBase.status, 500);
  assert.equal((await sinBase.json()).error, 'No se pudo leer la base');

  const roto = {
    prepare(sql) {
      if (sql.includes('FROM carreras')) throw new Error('caída sintética');
      return db.prepare(sql);
    },
  };
  const caida = await manejarNewsletter(pedir({ authorization: 'Bearer secreto-sintetico' }), roto, entorno(mail));
  assert.equal(caida.status, 500);
  assert.equal(llamadas, 0, 'sin poder leer carreras no se manda nada');
});

test('newsletter: consentimiento, baja, siete días, plantilla y reclamo confirmado', async t => {
  const { db } = await crearD1(t);
  await carreraTeclab(db, 1);
  await suscripcion(db, { id: UUID_A, ultimo: null });
  await suscripcion(db, { id: UUID_B, email: 'otra@example.invalid', activo: 0 });

  const enviados = [];
  const mail = async pedido => { enviados.push(pedido); return 'enviado'; };
  const primera = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(mail),
  );
  assert.equal(primera.status, 200);
  assert.deepEqual(await primera.json(), { candidatas: 1, enviados: 1, salteados: 0, fallidos: 0 });
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].para, 'fixture@example.invalid');
  assert.equal(enviados[0].newsletter.bajaUrl, `https://www.siglo21sur.com/newsletter/baja?id=${UUID_A}`);
  assert.deepEqual(enviados[0].newsletter.encabezados[0], {
    header: 'List-Unsubscribe',
    value: `<https://www.siglo21sur.com/api/newsletter/baja?id=${UUID_A}>`,
  });
  assert.deepEqual(enviados[0].newsletter.encabezados[1], {
    header: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click',
  });

  const fila = await db.prepare('SELECT ultimo_envio_at, activo FROM suscripciones_newsletter WHERE id = ?1')
    .bind(UUID_A).first();
  assert.equal(fila.ultimo_envio_at, AHORA.toISOString());
  assert.equal(fila.activo, 1, 'enviar no cambia el consentimiento');
  assert.deepEqual(await estadoClaim(db), {
    estado: 'enviado', ultimo_error: null, updated_at: AHORA.toISOString(),
  });

  // Segunda corrida con la misma fecha: no vuelve a mandar.
  const segunda = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(mail),
  );
  assert.deepEqual(await segunda.json(), { candidatas: 0, enviados: 0, salteados: 0, fallidos: 0 });
  assert.equal(enviados.length, 1);

  // Frontera de los siete días: exactamente el límite vuelve a ser candidata.
  await db.prepare('UPDATE suscripciones_newsletter SET ultimo_envio_at = ?2 WHERE id = ?1')
    .bind(UUID_A, new Date(AHORA.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()).run();
  const tercera = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(mail),
  );
  assert.equal((await tercera.json()).enviados, 1);
  assert.equal(enviados.length, 2);

  // La baja se respeta: inactiva no es candidata aunque tenga precio vigente.
  await db.prepare('UPDATE suscripciones_newsletter SET activo = 0 WHERE id = ?1').bind(UUID_A).run();
  const baja = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(mail),
  );
  assert.equal((await baja.json()).candidatas, 0);
  assert.equal(enviados.length, 2);
});

test('newsletter: dos corridas simultáneas reclaman una sola vez', async t => {
  const { db } = await crearD1(t);
  await carreraTeclab(db);
  await suscripcion(db);

  let llamadas = 0;
  let entrar;
  let liberar;
  const entrada = new Promise(resolve => { entrar = resolve; });
  const espera = new Promise(resolve => { liberar = resolve; });
  const mail = async () => {
    llamadas += 1;
    entrar();
    await espera;
    return 'enviado';
  };

  const primera = manejarNewsletter(pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(mail));
  await entrada;
  const segunda = await manejarNewsletter(pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(mail));
  liberar();
  const resultado = await primera;

  assert.equal((await resultado.json()).enviados, 1);
  assert.equal((await segunda.json()).salteados, 1);
  assert.equal(llamadas, 1);
});

test('newsletter: ambiguo no se reintenta solo; rechazo conocido sí', async t => {
  const { db } = await crearD1(t);
  await carreraTeclab(db);
  await suscripcion(db);

  let llamadas = 0;
  const ambiguo = async () => { llamadas += 1; throw new ErrorAmbiguo('TimeoutError'); };
  const primera = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(ambiguo),
  );
  assert.equal((await primera.json()).fallidos, 1);
  assert.equal((await estadoClaim(db)).estado, 'ambiguo');
  assert.equal((await db.prepare('SELECT ultimo_envio_at FROM suscripciones_newsletter WHERE id = ?1')
    .bind(UUID_A).first()).ultimo_envio_at, null);

  const segunda = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(ambiguo),
  );
  assert.equal((await segunda.json()).salteados, 1);
  assert.equal(llamadas, 1, 'un ambiguo no se reenvía automáticamente');

  // Un rechazo explícito deja estado `error` y la próxima corrida reintenta.
  const { db: db2 } = await crearD1(t);
  await carreraTeclab(db2);
  await suscripcion(db2);
  let rechazos = 0;
  const rechazo = async () => { rechazos += 1; throw new ErrorRechazo('E_0011'); };
  await manejarNewsletter(pedir({ authorization: 'Bearer secreto-sintetico' }), db2, entorno(rechazo));
  assert.deepEqual(await estadoClaim(db2), {
    estado: 'error', ultimo_error: 'E_0011', updated_at: AHORA.toISOString(),
  });
  const reintento = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db2, entorno(rechazo),
  );
  assert.equal((await reintento.json()).fallidos, 1);
  assert.equal(rechazos, 2, 'un rechazo conocido se puede volver a intentar');
});

test('newsletter: si falla la confirmación local el reclamo no se libera', async t => {
  const { db } = await crearD1(t);
  await carreraTeclab(db);
  await suscripcion(db);
  await db.prepare(`CREATE TRIGGER fallo_newsletter BEFORE UPDATE OF ultimo_envio_at
    ON suscripciones_newsletter BEGIN SELECT RAISE(ABORT, 'fallo sintético'); END`).run();

  let llamadas = 0;
  const mail = async () => { llamadas += 1; return 'enviado'; };
  const primera = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(mail),
  );
  assert.equal((await primera.json()).fallidos, 1);
  assert.equal((await estadoClaim(db)).estado, 'en-curso');
  const segunda = await manejarNewsletter(
    pedir({ authorization: 'Bearer secreto-sintetico' }), db, entorno(mail),
  );
  assert.equal((await segunda.json()).salteados, 1);
  assert.equal(llamadas, 1, 'el mail ya salió: no se repite a ciegas');
});

test('recordatorio de Teclab: autenticación, filtro y fallo de base avisado', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nivel: 'Teclab - Tecnología', nombre: 'Zeta', descripcion: 'Intro vieja' });
  await insertarCarrera(db, 2, { nivel: 'Teclab - Gestión', nombre: 'Alfa', descripcion: 'Estudiá otra cosa' });
  await insertarCarrera(db, 3, { nivel: 'Teclab - Curso', nombre: 'Curso fuera' });
  await insertarCarrera(db, 4, { nivel: 'Pregrado', nombre: 'Otra casa' });

  const enviados = [];
  const telegram = async texto => { enviados.push(texto); return 'enviado'; };
  const pedirRec = (headers = {}) => new Request('https://local.test/api/recordatorio-teclab', { headers });

  const sinSecreto = await manejarRecordatorio(pedirRec(), db, { telegram });
  assert.equal(sinSecreto.status, 503);
  const otro = await manejarRecordatorio(pedirRec({ authorization: 'Bearer otro' }), db, {
    secretoCron: 'secreto-sintetico', telegram,
  });
  assert.equal(otro.status, 401);

  const respuesta = await manejarRecordatorio(pedirRec({ authorization: 'Bearer secreto-sintetico' }), db, {
    secretoCron: 'secreto-sintetico', telegram,
  });
  assert.deepEqual(await respuesta.json(), { aviso: 'enviado' });
  assert.equal(enviados.length, 1);
  assert.match(enviados[0], /Fichas sin la intro nueva:\n• Zeta/);
  assert.doesNotMatch(enviados[0], /Curso fuera|Otra casa/);
  assert.match(enviados[0], /Recordatorio semanal de Teclab/);

  // Sin Telegram configurado, el contrato vigente responde «sin configurar» 200.
  const sinCanal = await manejarRecordatorio(pedirRec({ authorization: 'Bearer secreto-sintetico' }), db, {
    secretoCron: 'secreto-sintetico',
  });
  assert.deepEqual(await sinCanal.json(), { aviso: 'sin configurar' });

  // Base caída: el aviso sale igual, avisando que no se pudo leer.
  const rota = { prepare() { throw new Error('caída sintética'); } };
  const caida = await manejarRecordatorio(pedirRec({ authorization: 'Bearer secreto-sintetico' }), rota, {
    secretoCron: 'secreto-sintetico', telegram,
  });
  assert.equal(caida.status, 200);
  assert.match(enviados.at(-1), /No se pudo leer la base/);
});

test('upgrade 0009 → 0010 conserva suscripciones y admite reaplicación', async t => {
  const directorio = mkdtempSync(join(tmpdir(), 'cau-newsletter-upgrade-'));
  t.after(() => rmSync(directorio, { recursive: true, force: true }));
  for (let i = 1; i <= 9; i += 1) {
    const nombre = `000${i}.sql`;
    copyFileSync(new URL(`../migrations/${nombre}`, import.meta.url), join(directorio, nombre));
  }
  const { db, worker } = await crearD1(t, true, directorio);
  await carreraTeclab(db);
  await suscripcion(db);
  const antes = await db.prepare('SELECT * FROM suscripciones_newsletter').first();

  copyFileSync(new URL('../migrations/0010.sql', import.meta.url), join(directorio, '0010.sql'));
  await worker.applyD1Migrations('DB');
  await worker.applyD1Migrations('DB');

  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 10);
  assert.deepEqual(await db.prepare('SELECT * FROM suscripciones_newsletter').first(), antes);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM newsletter_envios').first('n'), 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM carreras').first('n'), 1);

  await db.prepare(`INSERT INTO newsletter_envios(suscripcion_id, token, estado, updated_at)
    VALUES (?1, ?2, 'enviado', ?3)`).bind(UUID_A, UUID_B, AHORA.toISOString()).run();
  await worker.applyD1Migrations('DB');
  assert.equal((await estadoClaim(db)).estado, 'enviado');

  // El estado y el token tienen el mismo contrato cerrado y el hijo cae con la baja.
  await db.prepare('DELETE FROM newsletter_envios').run();
  await assert.rejects(db.prepare(`INSERT INTO newsletter_envios(suscripcion_id, token, estado)
    VALUES (?1, ?2, 'otro')`).bind(UUID_A, UUID_B).run(), /CHECK/);
  await assert.rejects(db.prepare(`INSERT INTO newsletter_envios(suscripcion_id, token, estado)
    VALUES (?1, 'corto', 'error')`).bind(UUID_A).run(), /CHECK/);
  await db.prepare('DELETE FROM suscripciones_newsletter WHERE id = ?1').bind(UUID_A).run();
  assert.equal(await db.prepare('SELECT count(*) AS n FROM newsletter_envios').first('n'), 0);
});
