// El check recibe los bytes del árbol Git, nunca archivos del working tree.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { esRutaPrivada } from './secretos.mjs';

function within(root, target) {
  const path = relative(root, target);
  return path !== '' && !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`);
}
export function checkEnvironment(home) {
  // Lista permitida: no heredamos tokens, NODE_OPTIONS, configuración npm/Git
  // ni variables de servicios de producción. HOME también es temporal.
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|LANG|LC_ALL|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)) env[key] = value;
  }
  return { ...env, HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home,
    CI: '1', NEXT_TELEMETRY_DISABLED: '1', PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
    GIT_CONFIG_GLOBAL: join(home, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', GIT_LITERAL_PATHSPECS: '1',
    npm_config_userconfig: join(home, 'npmrc'), npm_config_globalconfig: join(home, 'npmrc-global'),
    npm_config_cache: join(home, 'npm-cache'), npm_config_ignore_scripts: 'true', npm_config_audit: 'false', npm_config_fund: 'false',
  };
}
function git(cwd, env, args, input) {
  return execFileSync('git', ['--no-pager', ...args], { cwd, env, input, maxBuffer: 512 * 1024 * 1024, stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const cachePath = path => /^(node_modules|\.next)(\/|$)/.test(path) || path === 'tsconfig.tsbuildinfo';
function verifySnapshot(root, expected) {
  const found = new Map();
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const target = join(dir, entry.name);
      const path = relative(root, target).split(sep).join('/');
      // No se siguen enlaces; los caches nunca reemplazan un archivo versionado.
      if (cachePath(path) && !expected.has(path)) continue;
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) throw new Error('El check creó un enlace en el código candidato. No publicar.');
      if (stat.isDirectory()) visit(target);
      else if (stat.isFile()) found.set(path, { hash: hash(readFileSync(target)), executable: Boolean(stat.mode & 0o111) });
      else throw new Error('El check alteró el tipo de archivo candidato. No publicar.');
    }
  }
  visit(root);
  if (found.size !== expected.size || [...expected].some(([path, item]) => {
    const actual = found.get(path);
    return !actual || actual.hash !== item.hash || (process.platform !== 'win32' && actual.executable !== item.executable);
  })) throw new Error('El check modificó el código candidato. No publicar; revisar el comando que escribe archivos y normalizar la selección antes de reintentar.');
}
function command(cwd, env, args) {
  try {
    if (process.platform === 'win32') {
      // Sólo tokens constantes, ninguna ruta/entrada humana dentro del comando.
      execFileSync(env.ComSpec || env.COMSPEC || 'cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], { cwd, env, stdio: 'inherit', timeout: 300_000 });
    } else execFileSync('npm', args, { cwd, env, stdio: 'inherit', timeout: 300_000 });
  } catch { throw new Error(`${args[0] === 'ci' ? 'npm ci' : 'npm run check'} falló en el árbol seleccionado. No se commiteó ni publicó nada.`); }
}
export function checkLocal(snapshot, env) {
  const lock = JSON.parse(readFileSync(join(snapshot, 'package-lock.json'), 'utf8'));
  if (Object.values(lock.packages || {}).some(item => item.link || /^(?:file:|link:|\/|\\|[A-Za-z]:)/.test(item.resolved || ''))) {
    throw new Error('El lock usa enlaces o dependencias locales. No se puede verificar de forma aislada; usar dependencias publicadas antes de reintentar.');
  }
  command(snapshot, env, ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--include=dev']);
  // Los tests de secretos necesitan el scanner real fijado por el candidato.
  // No copiamos el binario mutable del node_modules de la máquina.
  if (existsSync(join(snapshot, 'herramientas', 'secretos.mjs'))) {
    try { execFileSync(process.execPath, ['herramientas/secretos.mjs', 'instalar'], { cwd: snapshot, env, stdio: 'inherit', timeout: 180_000 }); }
    catch { throw new Error('No se pudo preparar Gitleaks en el candidato. No publicar; revisar conexión y volver a ejecutar el publicador.'); }
  }
  command(snapshot, env, ['run', 'check', '--ignore-scripts']);
}
export async function checkCandidate(cwd, tree, check = checkLocal) {
  if (!/^[a-f0-9]{40,64}$/.test(tree)) throw new Error('Identidad del árbol candidato inválida.');
  const base = realpathSync(tmpdir());
  const temp = mkdtempSync(join(base, 'deploy-check-'));
  try {
    const home = join(temp, 'home');
    const snapshot = join(temp, 'candidato');
    mkdirSync(home); mkdirSync(snapshot);
    for (const file of ['gitconfig', 'npmrc', 'npmrc-global']) writeFileSync(join(home, file), '');
    const env = checkEnvironment(home);
    const entries = git(cwd, env, ['ls-tree', '-r', '-z', tree]).toString('utf8').split('\0').filter(Boolean).map(record => {
      const index = record.indexOf('\t');
      const [mode, type, oid] = record.slice(0, index).split(' ');
      const path = record.slice(index + 1);
      const target = resolve(snapshot, path);
      if (index < 0 || type !== 'blob' || !['100644', '100755'].includes(mode) || !within(snapshot, target)
        || path.split('/').some(part => !part || part === '..' || part === '.git' || /[\\\x00-\x1f]/.test(part))
        || esRutaPrivada(path) || cachePath(path)) throw new Error('El candidato contiene rutas privadas, caches, enlaces o submódulos no soportados. Retirarlos de la selección y reintentar.');
      if (process.platform === 'win32' && path.split('/').some(part => /[<>:"|?*]|[ .]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error('El candidato contiene una ruta no representable en Windows. No publicar.');
      return { mode, oid, path, target };
    });
    const destinations = entries.map(entry => process.platform === 'win32' ? entry.target.toLowerCase() : entry.target);
    if (new Set(destinations).size !== entries.length) throw new Error('El candidato tiene rutas que colisionan en este sistema. No publicar.');
    const blobs = entries.length ? git(cwd, env, ['cat-file', '--batch'], `${entries.map(entry => entry.oid).join('\n')}\n`) : Buffer.alloc(0);
    let offset = 0;
    const expected = new Map();
    for (const entry of entries) {
      const end = blobs.indexOf(10, offset);
      const [oid, type, length] = blobs.subarray(offset, end).toString('ascii').split(' ');
      const size = Number(length);
      offset = end + 1;
      if (end < 0 || oid !== entry.oid || type !== 'blob' || !Number.isSafeInteger(size) || size < 0 || offset + size >= blobs.length || blobs[offset + size] !== 10) throw new Error('No se pudo materializar el árbol Git completo. No publicar.');
      const bytes = blobs.subarray(offset, offset + size);
      mkdirSync(dirname(entry.target), { recursive: true });
      writeFileSync(entry.target, bytes);
      chmodSync(entry.target, entry.mode === '100755' ? 0o755 : 0o644);
      expected.set(entry.path, { hash: hash(bytes), executable: entry.mode === '100755' });
      offset += size + 1;
    }
    if (offset !== blobs.length) throw new Error('Lectura del árbol Git inconsistente. No publicar.');
    await check(snapshot, env);
    verifySnapshot(snapshot, expected);
  } finally {
    // Nunca eliminar una ruta calculada fuera del temporal creado por esta llamada.
    if (!within(base, temp) || !within(base, realpathSync(temp))) throw new Error('No se pudo validar la ruta temporal para limpieza.');
    rmSync(temp, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
