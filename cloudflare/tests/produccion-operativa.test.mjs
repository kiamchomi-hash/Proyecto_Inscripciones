import test from 'node:test';
import assert from 'node:assert/strict';
import { registrarAlias } from './helpers/alias.mjs';

registrarAlias();
const { configEnvios, transportesProduccion, manejarColaProduccion,
  manejarProgramado, CRONES, COLA_EFECTOS } = await import('../src/operativa/produccion.ts');

test('sin credenciales no se arma ningún transporte: nada sale por defecto', () => {
  assert.deepEqual(configEnvios({}), {});
  assert.deepEqual(configEnvios({ APP_STAGE: 'produccion' }), {});
  // Un chat sin token, o un repo sin token, tampoco habilitan el canal.
  assert.deepEqual(configEnvios({ TELEGRAM_CHAT_ID: '1' }), {});
  assert.deepEqual(configEnvios({ GITHUB_REPO: 'x/y' }), {});
  assert.deepEqual(transportesProduccion({}, {}), {});
});

test('cada canal aparece sólo con su credencial completa', () => {
  assert.deepEqual(configEnvios({ TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: 'c' }),
    { telegram: { token: 't', chatId: 'c' } });
  assert.deepEqual(configEnvios({ SMTP2GO_API_KEY: 'k' }), { smtp: { clave: 'k' } });
  assert.deepEqual(configEnvios({ HUBSPOT_HABILITADO: 'no' }), {});
  assert.deepEqual(configEnvios({ HUBSPOT_HABILITADO: 'si' }), { hubspot: { habilitado: true } });
  assert.deepEqual(configEnvios({ GITHUB_REPO: 'x/y', GITHUB_TOKEN: 'g' }),
    { github: { repo: 'x/y', token: 'g' } });
});

test('la operativa exige etapa de producción y la cola autorizada', async () => {
  const db = { prepare() { throw new Error('no debe consultar'); } };
  const lote = { queue: COLA_EFECTOS, messages: [] };
  for (const entorno of [{}, { DB: db }, { APP_STAGE: 'staging', DB: db },
    { APP_STAGE: 'local', DB: db }]) {
    await assert.rejects(manejarColaProduccion(lote, entorno), /sin configurar/);
  }
  await assert.rejects(
    manejarColaProduccion({ queue: 'otra-cola', messages: [] }, { APP_STAGE: 'produccion', DB: db }),
    /no autorizada/,
  );
});

test('un lote vacío no envía nada aunque haya credenciales', async () => {
  const db = {};
  let red = 0;
  const resumen = await manejarColaProduccion(
    { queue: COLA_EFECTOS, messages: [] },
    { APP_STAGE: 'produccion', DB: db, SMTP2GO_API_KEY: 'k' },
    async () => { red += 1; return new Response('{}'); },
  );
  assert.equal(red, 0);
  assert.equal(resumen.total, 0);
});

test('los programados se despachan por expresión y una desconocida falla', async () => {
  const contexto = {
    db: null,
    secretoCron: 'secreto-de-prueba',
    origen: 'https://ensayo.invalid',
    buscar: async () => new Response('{}'),
  };
  await assert.rejects(manejarProgramado('*/5 * * * *', contexto), /Cron no autorizado/);

  // Sin transporte de vigilancia el handler responde 503 en vez de correr.
  const sinTransporte = await manejarProgramado(CRONES.vigilancia, { ...contexto, buscar: undefined });
  assert.equal(sinTransporte.tarea, 'vigilancia');
  assert.equal(sinTransporte.status, 503);

  // Con transporte simulado corre contra el doble: no hay red real.
  const vigilancia = await manejarProgramado(CRONES.vigilancia, contexto);
  assert.equal(vigilancia.status, 200);

  // Sin `CRON_SECRET` el handler falla cerrado (503) antes de tocar datos o red.
  const sinSecreto = await manejarProgramado(CRONES.newsletter, { ...contexto, secretoCron: undefined });
  assert.equal(sinSecreto.status, 503);
  assert.match(JSON.stringify(sinSecreto.cuerpo), /CRON_SECRET/);
});

const { construirDigest, construirDigestDirectas, fechaArgentina } = await import('../src/operativa/digest.ts');

test('el digest reproduce el texto del contrato, incluidos los bordes', () => {
  assert.equal(construirDigest('2026-10-25', []),
    '📊 *Resumen del 25/10/2026*\n\nSin aperturas de tarjetas ese día.');

  const uno = construirDigest('2026-10-25', [{ carrera: 'Abogacía', clicks: 1 }]);
  assert.match(uno, /👆 \*1\* apertura desde tarjetas en \*1\* carrera/);
  assert.match(uno, /🥇 Abogacía — \*1\*/);

  const muchos = construirDigest('2026-10-25', Array.from({ length: 12 }, (_, i) => ({
    carrera: i === 3 ? 'Gestión (RRHH) *especial*' : `Carrera ${i + 1}`,
    clicks: 12 - i,
  })));
  assert.match(muchos, /👆 \*78\* aperturas desde tarjetas en \*12\* carreras/);
  assert.match(muchos, /🥉 /);
  assert.match(muchos, /_y 2 carreras más_/);
  assert.ok(muchos.includes('Gestión (RRHH) \\*especial\\*'), 'el Markdown se escapa');
  assert.ok(!muchos.includes('13. '), 'no lista más de diez');
});

test('las aperturas directas usan su propio encabezado y lista completa', () => {
  const dos = construirDigestDirectas('2026-10-25', [
    { carrera: 'A', clicks: 1 }, { carrera: 'B', clicks: 1 },
  ]);
  assert.match(dos, /\*Aperturas directas del 25\/10\/2026\*/);
  assert.match(dos, /\*2\* aperturas directas en \*2\* carreras/);
  assert.match(dos, /1\. A — \*1\*/);
});

test('la fecha por defecto es ayer en Buenos Aires, no el día UTC', () => {
  // 2026-10-26T02:30Z todavía es 25/10 en Buenos Aires.
  const ahora = new Date('2026-10-26T02:30:00Z');
  assert.equal(fechaArgentina(0, ahora), '2026-10-25');
  assert.equal(fechaArgentina(-1, ahora), '2026-10-24');
});

test('el cron del digest sin base o sin canal falla en vez de avisar vacío', async () => {
  const contexto = { db: null, secretoCron: 's', origen: 'https://ensayo.invalid', buscar: async () => new Response('{}') };
  await assert.rejects(manejarProgramado(CRONES.digest, contexto), /sin base/);
  await assert.rejects(manejarProgramado(CRONES.digest, { ...contexto, db: {} }), /sin canal/);
});

const { usuariosActivos: leerVisitantes } = await import('../src/operativa/analytics.ts');

test('visitantes: sólo con token, cuenta y sitio; nunca inventa un cero', async () => {
  const base = { token: 't', cuenta: 'c', siteTag: 's' };
  assert.equal(await leerVisitantes('2026-10-25', { ...base, token: '' }), null);
  assert.equal(await leerVisitantes('25/10/2026', base), null);

  const sinDatos = await leerVisitantes('2026-10-25', { ...base, buscar: async () => Response.json({ data: { viewer: { accounts: [{ rumPageloadEventsAdaptiveGroups: [] }] } } }) });
  assert.equal(sinDatos, null);

  const conDatos = await leerVisitantes('2026-10-25', { ...base, buscar: async () => Response.json({ data: { viewer: { accounts: [{ rumPageloadEventsAdaptiveGroups: [{ count: 40, sum: { visits: 12 }, dimensions: { date: '2026-10-25' } }] }] } } }) });
  assert.equal(conDatos, 12);

  const caida = await leerVisitantes('2026-10-25', { ...base, buscar: async () => { throw new Error('red'); } });
  assert.equal(caida, null);

  // La consulta pide la ventana explícita: sin ella la API rechaza el rango.
  let cuerpo = null;
  await leerVisitantes('2026-10-25', { ...base, buscar: async (_u, init) => { cuerpo = JSON.parse(init.body); return Response.json({ data: { viewer: { accounts: [{ rumPageloadEventsAdaptiveGroups: [] }] } } }); } });
  assert.equal(cuerpo.variables.desde, '2026-10-25');
  assert.equal(cuerpo.variables.hasta, '2026-10-25');
  assert.match(cuerpo.query, /rumPageloadEventsAdaptiveGroups/);
});
