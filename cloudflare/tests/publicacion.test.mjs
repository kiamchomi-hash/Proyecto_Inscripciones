// El publicador y su configuración son la única forma de tocar producción: si
// se desvían del código, el deploy publica otra cosa que la que se probó. Estas
// pruebas son de contrato, sin red y sin credenciales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entornoWrangler, leerConfig, revisar, tokenDelEntorno } from '../scripts/publicar.mjs';

const raiz = fileURLToPath(new URL('../', import.meta.url));

test('el push publica sólo tras ambos controles y no despliega un commit viejo', () => {
  const workflow = readFileSync(join(raiz, '../.github/workflows/verificar.yml'), 'utf8');
  assert.match(workflow, /needs:\s*\[codigo,\s*worker\]/);
  assert.match(workflow, /github\.event_name\s*==\s*'push'/);
  assert.match(workflow, /group:\s*publicar-worker/);
  assert.match(workflow, /git ls-remote --exit-code origin refs\/heads\/main/);
  assert.match(workflow, /node scripts\/publicar\.mjs --publicar --smoke-rapido/);
  const manual = readFileSync(join(raiz, '../.github/workflows/publicar.yml'), 'utf8');
  assert.match(manual, /group:\s*publicar-worker/);
  assert.match(manual, /git ls-remote --exit-code origin refs\/heads\/main/);
  assert.match(manual, /node scripts\/publicar\.mjs --ensayo/);
});

/** Los cron de `CRONES` tal como están escritos en el código, sin importarlo. */
function cronsDelCodigo() {
  const fuente = readFileSync(join(raiz, 'src', 'operativa', 'produccion.ts'), 'utf8');
  const bloque = fuente.split('export const CRONES = {')[1]?.split('} as const')[0];
  assert.ok(bloque, 'no se encontró el bloque CRONES en produccion.ts');
  return [...bloque.matchAll(/'([^']+)'/g)].map(fila => fila[1]).sort();
}

test('la configuración de producción pasa la revisión del publicador', () => {
  const { problemas } = revisar(leerConfig());
  assert.deepEqual(problemas, []);
});

test('los programados del Worker son exactamente los del código', () => {
  const config = leerConfig();
  assert.deepEqual([...config.triggers.crons].sort(), cronsDelCodigo());
});

test('la configuración apunta al Worker, la base y los dominios de producción', () => {
  const config = leerConfig();
  assert.equal(config.name, 'cau-produccion-20261026');
  assert.equal(config.main, 'worker.ts');
  assert.equal(config.assets.run_worker_first, true);
  assert.deepEqual(config.d1_databases, [{
    binding: 'DB',
    database_name: 'cau-produccion',
    database_id: '4a1cc90c-8c55-493f-9753-d40ac5cbc3cb',
  }]);
  assert.deepEqual(config.routes.map(r => r.pattern).sort(), ['siglo21sur.com', 'www.siglo21sur.com']);
  assert.equal(config.vars.APP_STAGE, 'produccion');
  assert.equal(config.vars.DB_STAGE, 'produccion');
});

test('las variables públicas no llevan secretos', () => {
  const { vars } = leerConfig();
  const nombres = Object.keys(vars);
  assert.ok(!nombres.some(nombre => /SECRET|PASSWORD|_TOKEN$|PRIV/i.test(nombre)), nombres.join(', '));
  // La única clave que viaja en `vars` es la pública de Turnstile, que ya va en el HTML.
  assert.equal(vars.PUBLIC_TURNSTILE_SITE_KEY?.startsWith('0x'), true);
});

test('publicar sin banderas sólo informa el plan y no compila ni publica', () => {
  const resultado = spawnSync(process.execPath, ['scripts/publicar.mjs'], {
    cwd: raiz, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  assert.equal(resultado.status, 0, resultado.stderr);
  assert.match(resultado.stdout, /No se compiló ni se publicó nada/);
  assert.doesNotMatch(resultado.stdout, /\[1\/3\]/);
});

test('el publicador no acepta banderas contradictorias', () => {
  const resultado = spawnSync(process.execPath, ['scripts/publicar.mjs', '--publicar', '--ensayo'], {
    cwd: raiz, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stderr, /no van juntos/);
});

test('el token sale de .env.local sin arrastrar el resto de las credenciales', () => {
  const carpeta = mkdtempSync(join(tmpdir(), 'cau-publicar-'));
  try {
    const archivo = join(carpeta, '.env.local');
    writeFileSync(archivo, [
      'SECRETO_AJENO_DE_PRUEBA=no-viaja',
      'CLOUDFLARE_API_TOKEN="token-de-prueba"',
      'SMTP2GO_API_KEY=tampoco',
      '',
    ].join('\n'));
    const credencial = tokenDelEntorno({ HOME: carpeta }, archivo);
    assert.deepEqual(credencial, { origen: 'CLOUDFLARE_API_TOKEN de .env.local', token: 'token-de-prueba' });

    const entorno = entornoWrangler(credencial, {
      PATH: '/usr/bin', HOME: carpeta, SECRETO_AJENO_DE_PRUEBA: 'no-viaja', SMTP2GO_API_KEY: 'tampoco',
    });
    assert.equal(entorno.CLOUDFLARE_API_TOKEN, 'token-de-prueba');
    assert.deepEqual(Object.keys(entorno).sort(), ['CLOUDFLARE_API_TOKEN', 'HOME', 'PATH'].sort());

    // El entorno gana sobre el archivo: no hay sorpresas si alguien exporta otro.
    assert.equal(tokenDelEntorno({ CLOUDFLARE_API_TOKEN: 'del-entorno' }, archivo).token, 'del-entorno');
  } finally {
    rmSync(carpeta, { recursive: true, force: true });
  }
});

test('sin credencial no se publica', () => {
  const carpeta = mkdtempSync(join(tmpdir(), 'cau-publicar-sin-'));
  try {
    const resultado = spawnSync(process.execPath, ['scripts/publicar.mjs', '--publicar', '--smoke-rapido'], {
      cwd: raiz, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: carpeta },
    });
    assert.notEqual(resultado.status, 0);
    assert.match(resultado.stderr, /No hay credencial de Cloudflare/);
    // La bandera del smoke en CI se acepta: el rechazo es por la credencial, no
    // por argumentos, y llega antes de compilar.
    assert.doesNotMatch(resultado.stderr, /Bandera desconocida/);
    assert.doesNotMatch(resultado.stdout, /\[1\/3\]/);
  } finally {
    rmSync(carpeta, { recursive: true, force: true });
  }
});
