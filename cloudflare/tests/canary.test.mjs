import test from 'node:test';
import assert from 'node:assert/strict';
import {
  argsDistribucion, ejecutarCanary, versionIdDeUpload,
} from '../scripts/canary.mjs';

const ESTABLE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const NUEVA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const SHA = 'c'.repeat(40);

const estado = versiones => ({ stdout: JSON.stringify({ versions: versiones }), stderr: '' });
const upload = { stdout: `Worker Version ID: ${NUEVA}\n`, stderr: '' };
const opciones = overrides => ({
  sha: SHA,
  riesgo: 'alto',
  tokenCloudflare: 'token-cf-test',
  tokenR2: 'token-r2-test',
  ...overrides,
});

test('Wrangler recibe porcentajes explícitos para cero, cinco y promoción', () => {
  assert.deepEqual(argsDistribucion(NUEVA, ESTABLE, 0).slice(2, 4), [`${NUEVA}@0`, `${ESTABLE}@100`]);
  assert.deepEqual(argsDistribucion(NUEVA, ESTABLE, 5).slice(2, 4), [`${NUEVA}@5`, `${ESTABLE}@95`]);
  assert.deepEqual(argsDistribucion(NUEVA, ESTABLE, 100).slice(2, 4), [`${NUEVA}@100`, `${ESTABLE}@0`]);
  assert.throws(() => argsDistribucion('no-uuid', ESTABLE, 5), /Distribución canary inválida/);
});

test('el ID del upload debe venir explícito y ser UUID', () => {
  assert.equal(versionIdDeUpload(upload.stdout), NUEVA);
  assert.throws(() => versionIdDeUpload('upload complete'), /Version ID válido/);
});

test('ejecuta upload, sincronización R2, 0%, smoke, 5%, smoke y 100% en orden', async () => {
  const llamadas = [];
  let estadoActual = [{ version_id: ESTABLE, percentage: 100 }];
  const resultado = await ejecutarCanary(opciones({
    comando: async (binario, args, opts) => {
      const texto = args.join(' ');
      llamadas.push({ texto, env: opts.env });
      if (texto.includes('deployments status')) return estado(estadoActual);
      if (texto.includes('versions upload')) return upload;
      if (texto.includes('sincronizar-assets-r2')) return { stdout: '{"escrito":true}', stderr: '' };
      if (texto.includes('versions deploy')) {
        const candidata = /bbbbbbbb-.*?@(\d+)/.exec(texto)?.[1];
        const estable = /aaaaaaaa-.*?@(\d+)/.exec(texto)?.[1];
        estadoActual = candidata === '100'
          ? [{ version_id: NUEVA, percentage: 100 }]
          : [
            { version_id: NUEVA, percentage: Number(candidata) },
            { version_id: ESTABLE, percentage: Number(estable) },
          ].filter(version => version.percentage > 0);
        return { stdout: '', stderr: '' };
      }
      if (texto.includes('smoke.mjs')) return { stdout: '', stderr: '' };
      assert.fail(`comando inesperado: ${texto}`);
    },
  }));
  assert.equal(resultado.resultado, 'promovida');
  assert.equal(resultado.versionNueva, NUEVA);
  assert.ok(llamadas.findIndex(llamada => llamada.texto.includes('sincronizar-assets-r2'))
    < llamadas.findIndex(llamada => llamada.texto.includes('versions deploy')));
  assert.deepEqual(
    llamadas.filter(llamada => llamada.texto.includes('versions deploy'))
      .map(llamada => llamada.texto.match(/@(\d+)/)?.[1]),
    ['0', '5', '100'],
  );
  assert.equal(llamadas.filter(llamada => llamada.texto.includes('smoke.mjs')).length, 2);
  assert.equal(llamadas.at(1).env.CLOUDFLARE_API_TOKEN, 'token-cf-test');
  assert.equal(llamadas.find(llamada => llamada.texto.includes('sincronizar-assets-r2'))
    .env.CLOUDFLARE_API_TOKEN, 'token-r2-test');
});

test('si falla un smoke, vuelve a la versión estable y confirma el 100%', async () => {
  const distribuciones = [];
  let estadoActual = [{ version_id: ESTABLE, percentage: 100 }];
  let fallarSmoke = true;
  const eventos = [];
  await assert.rejects(ejecutarCanary(opciones({
    registrar: evento => eventos.push(evento),
    comando: async (_binario, args) => {
      const texto = args.join(' ');
      if (texto.includes('deployments status')) return estado(estadoActual);
      if (texto.includes('versions upload')) return upload;
      if (texto.includes('sincronizar-assets-r2')) return { stdout: '', stderr: '' };
      if (texto.includes('versions deploy')) {
        distribuciones.push(texto);
        estadoActual = [{ version_id: ESTABLE, percentage: 100 }];
        return { stdout: '', stderr: '' };
      }
      if (texto.includes('smoke.mjs') && fallarSmoke) {
        fallarSmoke = false;
        throw new Error('HTTP 503');
      }
      assert.fail(`comando inesperado: ${texto}`);
    },
  })), /smoke-0: HTTP 503/);
  assert.equal(distribuciones.length, 2);
  assert.match(distribuciones.at(-1), new RegExp(`${NUEVA}@0 ${ESTABLE}@100`));
  assert.ok(eventos.some(evento => evento.estado === 'rollback'));
});

test('falla cerrado si el estado actual es ambiguo o falta la credencial R2', async () => {
  await assert.rejects(ejecutarCanary(opciones({
    comando: async () => estado([{ version_id: ESTABLE, percentage: 95 }, { version_id: NUEVA, percentage: 5 }]),
  })), /única versión estable al 100%/);
  await assert.rejects(ejecutarCanary(opciones({ tokenR2: '' })), /CLOUDFLARE_R2_API_TOKEN/);
});
