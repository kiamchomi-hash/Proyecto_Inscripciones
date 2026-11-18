import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  comandoLectura, comandoSubida, construirManifiestoAssets, entornoSubidaR2, sincronizarAssetsR2,
} from '../scripts/sincronizar-assets-r2.mjs';

const VERSION = 'f2663f9a-d5b8-4577-a2f6-debc5f34ad48';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'cau-r2-test-'));
  await mkdir(join(root, 'imagenes'), { recursive: true });
  await mkdir(join(root, '_astro'), { recursive: true });
  await writeFile(join(root, 'imagenes', 'logo.webp'), 'misma imagen');
  await writeFile(join(root, '_astro', 'logo-copy.webp'), 'misma imagen');
  await writeFile(join(root, '_astro', 'app.js'), 'import("./chunk.js")');
  await writeFile(join(root, 'google-verification.html'), 'no es un asset');
  return root;
}

test('el manifiesto incluye sólo assets de entrega y deduplica bytes repetidos por SHA-256', async t => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const { manifiesto, objetos } = await construirManifiestoAssets(root, VERSION);
  assert.equal(manifiesto.version, VERSION);
  assert.deepEqual(Object.keys(manifiesto.files).sort(), [
    '_astro/app.js', '_astro/logo-copy.webp', 'imagenes/logo.webp',
  ]);
  assert.equal(objetos.size, 2);
  assert.equal(manifiesto.files['imagenes/logo.webp'].digest, manifiesto.files['_astro/logo-copy.webp'].digest);
});

test('rechaza ID de versión inválido y MIME no soportado', async t => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(construirManifiestoAssets(root, 'main'), /ID de versión inválido/);
  await writeFile(join(root, 'imagenes', 'desconocido.xyz'), 'archivo');
  await assert.rejects(construirManifiestoAssets(root, VERSION), /MIME declarado/);
});

test('el comando Wrangler pasa rutas como argumentos separados y sin shell', () => {
  const comando = comandoSubida('cau-assets-historicos', 'objects/digest', '/tmp/a b.webp', 'image/webp', '/tmp/wrangler.json');
  assert.equal(comando.binario, process.execPath);
  assert.ok(comando.args.includes('/tmp/a b.webp'));
  assert.ok(comando.args.includes('--remote'));
  assert.ok(!comando.args.join(' ').includes('sh -c'));

  const lectura = comandoLectura('cau-assets-historicos', 'indices/objetos.json', '/tmp/a b.json', '/tmp/wrangler.json');
  assert.ok(lectura.args.includes('get'));
  assert.ok(lectura.args.includes('/tmp/a b.json'));
  assert.ok(!lectura.args.join(' ').includes('sh -c'));
});

test('el proceso de upload recibe sólo la credencial R2 y el entorno mínimo', () => {
  const env = entornoSubidaR2({
    PATH: '/usr/bin',
    HOME: '/home/test',
    CLOUDFLARE_API_TOKEN: 'token-general-no-se-copia',
    CLOUDFLARE_R2_API_TOKEN: 'token-r2',
    SMTP2GO_API_KEY: 'no-viaja',
  });
  assert.deepEqual(env, {
    PATH: '/usr/bin',
    HOME: '/home/test',
    CLOUDFLARE_API_TOKEN: 'token-r2',
  });
});

test('por defecto sólo calcula; la escritura sube objetos deduplicados y publica el manifiesto al final', async t => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const seco = await sincronizarAssetsR2({ version: VERSION, directorio: root });
  assert.equal(seco.escrito, false);

  const llamados = [];
  const resultado = await sincronizarAssetsR2({
    version: VERSION,
    directorio: root,
    confirmarEscritura: true,
    tokenR2: 'token-de-prueba',
    ejecutarComando: async (_binario, args) => {
      llamados.push(args);
      // Sin índice en el bucket (primer deploy con este mecanismo).
      if (args.includes('get')) throw new Error('no existe el objeto');
      if (args.includes('manifests')) {
        const ruta = args[args.indexOf('--file') + 1];
        const manifiesto = JSON.parse(await readFile(ruta, 'utf8'));
        assert.equal(manifiesto.version, VERSION);
      }
    },
  });
  assert.equal(resultado.escrito, true);
  assert.equal(resultado.subidos, 2);
  assert.equal(resultado.yaEstaban, 0);
  // Lectura del índice + dos objetos + índice + manifiesto.
  assert.equal(llamados.length, 5);
  assert.ok(llamados.at(-1)[4].startsWith('cau-assets-historicos/manifests/'));
});

test('sólo sube los objetos que faltan y deja el índice completo', async t => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const { manifiesto } = await construirManifiestoAssets(root, VERSION);
  const yaEstaba = manifiesto.files['imagenes/logo.webp'].digest;
  const faltaba = manifiesto.files['_astro/app.js'].digest;

  const subidos = [];
  const resultado = await sincronizarAssetsR2({
    version: VERSION,
    directorio: root,
    confirmarEscritura: true,
    tokenR2: 'token-de-prueba',
    ejecutarComando: async (_binario, args) => {
      if (args.includes('get')) {
        await writeFile(args[args.indexOf('--file') + 1], JSON.stringify({ digests: [yaEstaba] }));
        return;
      }
      subidos.push(args[4]);
      if (args[4].endsWith('indices/objetos.json')) {
        const { digests } = JSON.parse(await readFile(args[args.indexOf('--file') + 1], 'utf8'));
        assert.deepEqual(digests.sort(), [yaEstaba, faltaba].sort());
      }
    },
  });

  assert.equal(resultado.objetos, 2);
  assert.equal(resultado.subidos, 1);
  assert.equal(resultado.yaEstaban, 1);
  assert.deepEqual(subidos, [
    `cau-assets-historicos/objects/${faltaba}`,
    'cau-assets-historicos/indices/objetos.json',
    `cau-assets-historicos/manifests/${VERSION}.json`,
  ]);
});

test('un índice ilegible no deja assets sin subir', async t => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const objetosSubidos = [];
  const resultado = await sincronizarAssetsR2({
    version: VERSION,
    directorio: root,
    confirmarEscritura: true,
    tokenR2: 'token-de-prueba',
    ejecutarComando: async (_binario, args) => {
      if (args.includes('get')) {
        await writeFile(args[args.indexOf('--file') + 1], '{ esto no es json');
        return;
      }
      if (args[4].includes('/objects/')) objetosSubidos.push(args[4]);
    },
  });

  assert.equal(resultado.subidos, 2);
  assert.equal(objetosSubidos.length, 2);
});

test('no escribe si falta la credencial R2 separada', async t => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(
    sincronizarAssetsR2({
      version: VERSION, directorio: root, confirmarEscritura: true, tokenR2: null,
      ejecutarComando: async () => assert.fail('no debe llamar a Wrangler'),
    }),
    /CLOUDFLARE_R2_API_TOKEN/,
  );
});
