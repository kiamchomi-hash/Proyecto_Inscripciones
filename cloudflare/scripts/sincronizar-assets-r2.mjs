#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  mkdtemp, readFile, readdir, rm, writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ejecutar = promisify(execFile);
const aqui = fileURLToPath(new URL('../', import.meta.url));
const VERSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CARPETAS = new Set(['_astro', 'derivados', 'folletos', 'fuentes', 'imagenes', 'planes']);
const RAIZ = new Set(['apple-touch-icon.png', 'favicon.ico', 'icon.png', 'icon-192.png', 'icon-512.png']);

// Los objetos se guardan por hash de su contenido (`objects/<sha256>`) y nunca
// cambian, así que el bucket funciona como un conjunto que sólo crece. Este
// índice dice qué digests ya están subidos para no volver a mandarlos: subirlos
// todos en cada deploy costaba más de 400s porque se paga el arranque de
// wrangler una vez por objeto.
const INDICE = 'indices/objetos.json';
const CACHE_INDICE = 'no-store';
const DIGEST = /^[a-f0-9]{64}$/i;
const MIME = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
]);

async function archivosDe(directorio) {
  const archivos = [];
  for (const entrada of await readdir(directorio, { withFileTypes: true })) {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) archivos.push(...await archivosDe(ruta));
    else if (entrada.isFile()) archivos.push(ruta);
  }
  return archivos;
}

export async function construirManifiestoAssets(directorio, version) {
  if (!VERSION.test(version)) throw new TypeError('ID de versión inválido.');
  const base = resolve(directorio);
  const manifiesto = { version, files: {} };
  const objetos = new Map();
  for (const archivo of await archivosDe(base)) {
    const ruta = relative(base, archivo).split(sep).join('/');
    const carpeta = ruta.split('/')[0];
    if (!CARPETAS.has(carpeta) && !(carpeta === ruta && RAIZ.has(ruta))) continue;
    const extension = ruta.slice(ruta.lastIndexOf('.')).toLowerCase();
    const contentType = MIME.get(extension);
    if (!contentType) throw new Error(`Tipo de asset sin MIME declarado: ${ruta}`);
    const contenido = await readFile(archivo);
    const digest = createHash('sha256').update(contenido).digest('hex');
    manifiesto.files[ruta] = { digest, contentType, size: contenido.byteLength };
    if (!objetos.has(digest)) objetos.set(digest, { archivo, contentType, size: contenido.byteLength });
  }
  if (Object.keys(manifiesto.files).length === 0) throw new Error('El build no contiene assets publicables a R2.');
  return { manifiesto, objetos };
}

export function comandoSubida(
  bucket, key, archivo, contentType, config,
  cacheControl = 'public, max-age=31536000, immutable',
) {
  return {
    binario: process.execPath,
    args: [
      'node_modules/wrangler/bin/wrangler.js',
      'r2', 'object', 'put', `${bucket}/${key}`,
      '--remote', '--file', archivo, '--content-type', contentType,
      '--cache-control', cacheControl,
      '--config', config,
    ],
  };
}

export function comandoLectura(bucket, key, archivo, config) {
  return {
    binario: process.execPath,
    args: [
      'node_modules/wrangler/bin/wrangler.js',
      'r2', 'object', 'get', `${bucket}/${key}`,
      '--remote', '--file', archivo,
      '--config', config,
    ],
  };
}

export function entornoSubidaR2(env = process.env, tokenR2 = env.CLOUDFLARE_R2_API_TOKEN) {
  const salida = {};
  for (const clave of ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TZ', 'CI', 'NO_COLOR', 'XDG_CONFIG_HOME']) {
    if (env[clave] !== undefined) salida[clave] = env[clave];
  }
  if (tokenR2) salida.CLOUDFLARE_API_TOKEN = tokenR2;
  return salida;
}

async function ejecutarConLimite(items, limite, accion) {
  let indice = 0;
  const trabajadores = Array.from({ length: Math.min(limite, items.length) }, async () => {
    while (indice < items.length) {
      const actual = items[indice++];
      await accion(actual);
    }
  });
  await Promise.all(trabajadores);
}

/**
 * Digests que ya están en el bucket, según su índice.
 *
 * Si el índice no existe —primer deploy con este mecanismo, o bucket vacío— se
 * devuelve un conjunto vacío y se sube todo: es más lento, pero correcto. Un
 * índice ilegible se trata igual, para no dejar assets sin publicar por un
 * archivo de estado roto.
 */
async function leerIndiceDeObjetos({ bucket, config, temporal, tokenR2, ejecutarComando }) {
  const destino = join(temporal, 'indice-remoto.json');
  const { binario, args } = comandoLectura(bucket, INDICE, destino, config);
  try {
    await ejecutarComando(binario, args, {
      cwd: aqui, maxBuffer: 2 * 1024 * 1024, env: entornoSubidaR2(process.env, tokenR2),
    });
    const { digests } = JSON.parse(await readFile(destino, 'utf8'));
    if (!Array.isArray(digests)) return new Set();
    return new Set(digests.filter(digest => typeof digest === 'string' && DIGEST.test(digest)));
  } catch {
    return new Set();
  }
}

export async function sincronizarAssetsR2({
  version,
  directorio = join(aqui, 'dist', 'client'),
  bucket = 'cau-assets-historicos',
  config = join(aqui, 'produccion', 'wrangler.json'),
  confirmarEscritura = false,
  tokenR2 = process.env.CLOUDFLARE_R2_API_TOKEN,
  ejecutarComando = ejecutar,
}) {
  const { manifiesto, objetos } = await construirManifiestoAssets(directorio, version);
  const resumen = {
    version,
    objetos: objetos.size,
    rutas: Object.keys(manifiesto.files).length,
    bytes: [...objetos.values()].reduce((total, objeto) => total + objeto.size, 0),
  };
  if (!confirmarEscritura) return { ...resumen, escrito: false };
  if (!tokenR2) throw new Error('Falta CLOUDFLARE_R2_API_TOKEN, credencial separada para escribir assets R2.');

  const temporal = await mkdtemp(join(tmpdir(), 'cau-assets-r2-'));
  try {
    const manifiestoLocal = join(temporal, 'manifiesto.json');
    await writeFile(manifiestoLocal, `${JSON.stringify(manifiesto)}\n`, { mode: 0o600 });

    const yaSubidos = await leerIndiceDeObjetos({ bucket, config, temporal, tokenR2, ejecutarComando });
    const pendientes = [...objetos].filter(([digest]) => !yaSubidos.has(digest));
    await ejecutarConLimite(pendientes, 6, async ([digest, objeto]) => {
      const { binario, args } = comandoSubida(bucket, `objects/${digest}`, objeto.archivo, objeto.contentType, config);
      await ejecutarComando(binario, args, {
        cwd: aqui, maxBuffer: 2 * 1024 * 1024, env: entornoSubidaR2(process.env, tokenR2),
      });
    });

    // El índice se reescribe sólo si hubo algo nuevo, y antes del manifiesto:
    // así un manifiesto publicado siempre tiene sus objetos y su índice en el
    // bucket. Si esto falla, el próximo deploy vuelve a subir lo que falte.
    if (pendientes.length) {
      const indiceLocal = join(temporal, 'indice.json');
      const digests = [...new Set([...yaSubidos, ...objetos.keys()])].sort();
      await writeFile(indiceLocal, `${JSON.stringify({ digests })}\n`, { mode: 0o600 });
      const { binario, args } = comandoSubida(
        bucket, INDICE, indiceLocal, 'application/json; charset=utf-8', config, CACHE_INDICE,
      );
      await ejecutarComando(binario, args, {
        cwd: aqui, maxBuffer: 2 * 1024 * 1024, env: entornoSubidaR2(process.env, tokenR2),
      });
    }

    const { binario, args } = comandoSubida(
      bucket, `manifests/${version}.json`, manifiestoLocal,
      'application/json; charset=utf-8', config,
    );
    await ejecutarComando(binario, args, {
      cwd: aqui, maxBuffer: 2 * 1024 * 1024, env: entornoSubidaR2(process.env, tokenR2),
    });
    return {
      ...resumen,
      subidos: pendientes.length,
      yaEstaban: objetos.size - pendientes.length,
      escrito: true,
    };
  } finally {
    await rm(temporal, { recursive: true, force: true });
  }
}

async function main(argumentos) {
  const version = argumentos.find(arg => arg.startsWith('--version='))?.slice('--version='.length);
  const confirmarEscritura = argumentos.includes('--confirmar-escritura');
  const desconocidos = argumentos.filter(arg => arg !== '--confirmar-escritura' && !arg.startsWith('--version='));
  if (desconocidos.length || !version) {
    throw new Error('Uso: node scripts/sincronizar-assets-r2.mjs --version=<UUID> [--confirmar-escritura]');
  }
  const resultado = await sincronizarAssetsR2({ version, confirmarEscritura });
  console.log(JSON.stringify(resultado));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(`No se pudieron sincronizar los assets de R2: ${error.message}`);
    process.exitCode = 1;
  });
}
