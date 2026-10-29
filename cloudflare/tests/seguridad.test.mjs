import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { comandoLocal, entornoLocal, PASOS_CHECK, verificarArchivosLocales } from '../scripts/local.mjs';

test('el check genera el entry de staging antes de revisar tipos', () => {
  assert.ok(PASOS_CHECK.indexOf('build') < PASOS_CHECK.indexOf('diagnostico'));
  assert.ok(PASOS_CHECK.includes('diagnostico'));
});

test('los ejecutables locales coinciden con los paquetes instalados', () => {
  for (const nombre of ['tipos', 'diagnostico', 'build', 'dev', 'preview']) {
    assert.ok(existsSync(new URL(`../${comandoLocal(nombre)[0]}`, import.meta.url)), nombre);
  }
});

test('la configuración local no declara recursos ni rutas remotas', () => {
  const config = JSON.parse(readFileSync(new URL('../wrangler.json', import.meta.url)));
  for (const key of ['account_id', 'routes', 'route', 'r2_buckets',
    'services', 'kv_namespaces', 'images', 'env']) {
    assert.equal(config[key], undefined, key);
  }
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.vars, { APP_STAGE: 'local' });
  assert.equal(config.main, 'src/worker.ts');
  assert.deepEqual(config.d1_databases, [{ binding: 'DB', database_name: 'cau-d1-local',
    database_id: '00000000-0000-0000-0000-000000000001', migrations_dir: 'migrations', remote: false }]);
  assert.deepEqual(config.triggers, { crons: ['*/5 * * * *'] });
  assert.deepEqual(config.queues, {
    producers: [{ binding: 'EFECTOS', queue: 'cau-efectos-local' }],
    consumers: [{ queue: 'cau-efectos-local', max_batch_size: 10, max_batch_timeout: 1,
      max_retries: 3, retry_delay: 10, dead_letter_queue: 'cau-efectos-dlq-local' }],
  });
});

test('el entrypoint no conecta transportes; runtime sólo proyecta configuración acotada', () => {
  for (const ruta of ['src/worker.ts', 'src/operativa/programados.ts']) {
    const fuente = readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');
    assert.doesNotMatch(fuente, /crearTransportes|TELEGRAM_BOT_TOKEN|SMTP2GO_API_KEY|GITHUB_TOKEN|HUBSPOT_TOKEN/);
  }

  // El adaptador sí lee las variables que necesita cada cron, pero no devuelve
  // el entorno completo, no lo serializa y no registra valores.
  const runtime = readFileSync(new URL('../src/api/runtime.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(runtime, /\.\.\.runtime|JSON\.stringify\(runtime|console\./);
  assert.match(runtime, /export const secretoCron/);
  assert.match(runtime, /export const transporteMail/);
  assert.match(runtime, /export const configTelegram/);
});

test('el proceso hijo no hereda secretos, flags de Node ni configuración remota', () => {
  const env = entornoLocal({
    PATH: '/bin', HOME: '/otro', LANG: 'es_AR.UTF-8',
    SECRETO_AJENO_DE_PRUEBA: 'centinela-no-publicar',
    VITE_TOKEN: 'centinela-no-publicar', PUBLIC_TOKEN: 'centinela-no-publicar',
    CLOUDFLARE_API_TOKEN: 'centinela-no-publicar', CLOUDFLARE_ENV: 'production',
    NODE_OPTIONS: '--import=remoto', NODE_EXTRA_CA_CERTS: '/otro/certificado',
    CLOUDFLARE_INCLUDE_PROCESS_ENV: 'true',
  }, '/aislado');
  assert.equal(env.PATH, '/bin');
  assert.equal(env.LANG, 'es_AR.UTF-8');
  assert.equal(env.HOME, join('/aislado', '.local', 'home'));
  assert.equal(env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV, 'false');
  assert.equal(env.CLOUDFLARE_INCLUDE_PROCESS_ENV, 'false');
  for (const key of ['SECRETO_AJENO_DE_PRUEBA', 'VITE_TOKEN', 'PUBLIC_TOKEN',
    'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ENV', 'NODE_OPTIONS', 'NODE_EXTRA_CA_CERTS']) {
    assert.equal(env[key], undefined);
  }
  assert.ok(!JSON.stringify(env).includes('centinela-no-publicar'));
});

test('sólo admite comandos locales fijos, nunca deploy o argumentos adicionales', () => {
  assert.ok(comandoLocal('build').includes('build'));
  assert.ok(comandoLocal('preview').includes('127.0.0.1'));
  // Las migraciones del comando nuevo aplican al D1 de `.wrangler/state`.
  assert.ok(comandoLocal('migrar').includes('--local'));
  assert.ok(!comandoLocal('migrar').includes('--remote'));
  for (const comando of ['deploy', 'publish', 'login', 'secret', 'build --remote', '']) {
    assert.throws(() => comandoLocal(comando), /Comando local desconocido/);
  }
});

test('rechaza archivos de entorno dentro del paquete sin leer su contenido', () => {
  const root = mkdtempSync(join(tmpdir(), 'cau-cloudflare-guardas-'));
  try {
    verificarArchivosLocales(root);
    for (const name of ['.env', '.env.local', '.env.production', '.dev.vars', '.dev.vars.local']) {
      writeFileSync(join(root, name), '');
      assert.throws(() => verificarArchivosLocales(root), /archivos de entorno/);
      rmSync(join(root, name));
    }
    mkdirSync(join(root,'staging'));
    writeFileSync(join(root,'staging','.dev.vars'),'fixture-sin-secretos');
    assert.throws(()=>verificarArchivosLocales(root),/archivos de entorno/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
