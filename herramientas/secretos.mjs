import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCHIVOS, VERSION } from './gitleaks-version.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const binario = join(ROOT, 'node_modules', '.cache', 'gitleaks', VERSION, process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks');
const env = () => ({ ...process.env, GIT_LITERAL_PATHSPECS: '1', GIT_PAGER: 'cat' });
function git(cwd, ...args) {
  try { return execFileSync('git', ['--no-pager', ...args], { cwd, env: env(), maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch { throw new Error('No se pudo leer la selección de Git. Revisar git status y la referencia base.'); }
}
const valor = (cwd, ...args) => git(cwd, ...args).toString('utf8').trim();
const partes = text => text.split('\0').filter(Boolean);

export function esRutaPrivada(path) {
  const p = path.replaceAll('\\', '/').toLowerCase();
  const name = p.split('/').at(-1);
  return /^(?:carreras|ventas|herramientas\/ventas|notas-locales|contenidos|entregables|\.agents|\.pi|\.vercel)(?:\/|$)/.test(p)
    || (name.startsWith('.env') && name !== '.env.example')
    || /(?:service_account|credentials|credenciales)/.test(name)
    || (/gsc/.test(name) && name.endsWith('.json'))
    || /\.(?:pem|p12|pfx|key)$/.test(name)
    || /^(?:\.mcp\.json|id_rsa|id_ed25519|fuentes_siglo21\.md|mensaje_.*\.md)$/.test(name);
}

export async function instalarGitleaks() {
  const asset = ARCHIVOS[`${process.platform}-${process.arch}`];
  if (!asset) throw new Error('Plataforma no soportada por el instalador de Gitleaks.');
  const dir = mkdtempSync(join(tmpdir(), 'gitleaks-instalacion-'));
  try {
    const name = `gitleaks_${VERSION}_${asset[0]}`;
    const response = await fetch(`https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/${name}`);
    if (!response.ok) throw new Error('No se pudo descargar Gitleaks desde la release oficial.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== asset[1]) throw new Error('Checksum incorrecto; Gitleaks no se instaló.');
    const archive = join(dir, name);
    writeFileSync(archive, bytes);
    const extracted = join(dir, 'extraido');
    mkdirSync(extracted);
    if (process.platform === 'win32') {
      // Rutas como argumentos, no interpoladas dentro del programa PowerShell.
      execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '& { param($a,$b) Expand-Archive -LiteralPath $a -DestinationPath $b }', archive, extracted], { stdio: 'pipe' });
    } else execFileSync('tar', ['-xzf', archive, '-C', extracted], { stdio: 'pipe' });
    mkdirSync(dirname(binario), { recursive: true });
    writeFileSync(binario, readFileSync(join(extracted, process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks')));
    if (process.platform !== 'win32') chmodSync(binario, 0o755);
    verificarBinario();
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
export function verificarBinario(path = binario) {
  try {
    if (!existsSync(path) || execFileSync(path, ['version'], { encoding: 'utf8', stdio: 'pipe' }).trim() !== VERSION) throw new Error();
  } catch { throw new Error(`Gitleaks ${VERSION} no está disponible. Ejecutar node herramientas/secretos.mjs instalar y volver a publicar.`); }
}

function scanner(args, report, cwd, config) {
  const result = spawnSync(binario, [...args, '--config', config, '--redact=100', '--ignore-gitleaks-allow', '--gitleaks-ignore-path', join(dirname(report), 'sin-excepciones'), '--report-format', 'json', '--report-path', report, '--no-banner', '--log-level', 'error'], { cwd, env: env(), encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  // Nunca imprimir stderr, Match ni Secret; tampoco persistir reportes fuera del temporal.
  if (result.error || ![0, 1].includes(result.status) || !existsSync(report)) throw new Error('El scanner no pudo completar la revisión. No publicar; ejecutar node herramientas/secretos.mjs instalar y reintentar.');
  let findings;
  try { findings = JSON.parse(readFileSync(report, 'utf8')); } catch { throw new Error('El scanner devolvió un informe inválido. No publicar.'); }
  if (!Array.isArray(findings) || (result.status === 1 && !findings.length)) throw new Error('El scanner no produjo una conclusión verificable. No publicar.');
  return findings;
}

function quitarAnonPublica(findings, leer) {
  return findings.filter(f => {
    if (f.RuleID !== 'jwt' || f.StartLine !== f.EndLine) return true;
    const line = leer(f).map(text => text.split(/\r?\n/)[f.StartLine - 1] || '').join('\n');
    const tokens = line.match(/ey[A-Za-z0-9_-]+\.ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
    // Sólo JWT de la clave pública anon de Supabase, no sesiones ni service_role.
    return !tokens.length || tokens.some(token => {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
        return payload.iss !== 'supabase' || payload.role !== 'anon' || 'sub' in payload;
      } catch { return true; }
    });
  });
}
export function revisarSecretos({ cwd, tree = valor(cwd, 'write-tree'), base = valor(cwd, 'rev-parse', '--verify', 'refs/remotes/origin/main'), head = valor(cwd, 'rev-parse', 'HEAD') }) {
  verificarBinario();
  const rango = base ? `${base}..${head}` : head;
  const commits = valor(cwd, 'rev-list', rango).split('\n').filter(Boolean);
  // Inspeccionar todas las rutas de cada commit, incluso si después se borraron.
  const trees = [tree, ...commits];
  const entries = trees.map(ref => partes(git(cwd, 'ls-tree', '-r', '-z', ref).toString('utf8')));
  const privatePaths = [...new Set(entries.flat().map(entry => entry.slice(entry.indexOf('\t') + 1)).filter(esRutaPrivada))];
  if (privatePaths.length) throw new Error(`Archivos privados: ${privatePaths.map(p => JSON.stringify(p)).join(', ')}. Retirarlos de la selección; si están en commits pendientes, revisar esos commits antes de publicar.`);
  const dir = mkdtempSync(join(tmpdir(), 'gitleaks-revision-'));
  try {
    const snapshot = join(dir, 'seleccion');
    mkdirSync(snapshot);
    const oids = entries[0].map(entry => entry.split('\t')[0].split(' ')[2]);
    const blobs = execFileSync('git', ['cat-file', '--batch'], { cwd, env: env(), input: `${oids.join('\n')}\n`, maxBuffer: 512 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
    let offset = 0;
    for (const entry of entries[0]) {
      const [meta, path] = entry.split('\t');
      const [mode, type] = meta.split(' ');
      if (type !== 'blob' || !['100644', '100755'].includes(mode)) throw new Error('La selección contiene enlaces o submódulos no revisables. No publicar.');
      const target = resolve(snapshot, path);
      if (relative(snapshot, target).startsWith(`..${sep}`) || relative(snapshot, target) === '..') throw new Error('Ruta no revisable. No publicar.');
      mkdirSync(dirname(target), { recursive: true });
      const end = blobs.indexOf(10, offset);
      const header = blobs.subarray(offset, end).toString('ascii').split(' ');
      const size = Number(header[2]);
      if (end < 0 || header[0] !== meta.split(' ')[2] || header[1] !== 'blob' || !Number.isSafeInteger(size) || size < 0) throw new Error('Snapshot Git incompleto. No publicar.');
      offset = end + 1;
      if (offset + size >= blobs.length || blobs[offset + size] !== 10) throw new Error('Snapshot Git truncado. No publicar.');
      writeFileSync(target, blobs.subarray(offset, offset + size));
      offset += size + 1;
    }
    // La política también es del candidato, nunca del working tree editable.
    const config = join(dir, 'politica.toml');
    const policy = join(snapshot, '.gitleaks.toml');
    writeFileSync(config, existsSync(policy) ? readFileSync(policy) : '[extend]\nuseDefault = true\n');
    let findings = quitarAnonPublica(scanner(['dir', snapshot], join(dir, 'seleccion.json'), cwd, config), f => [readFileSync(f.File, 'utf8')]);
    if (commits.length) findings = findings.concat(quitarAnonPublica(scanner(['git', '--log-opts', rango, cwd], join(dir, 'historia.json'), cwd, config), f => {
      // Gitleaks incluye líneas borradas. Mirar también padres; no confundir
      // una service_role borrada con una anon agregada en su lugar.
      const refs = [f.Commit, ...valor(cwd, 'rev-list', '--parents', '-n', '1', f.Commit).split(' ').slice(1)];
      return refs.flatMap(ref => {
        try { return [git(cwd, 'show', ref + ':' + f.File).toString('utf8')]; }
        catch { return []; }
      });
    }));
    if (findings.length) {
      const safe = findings.map(f => ({ ...f, File: resolve(f.File).startsWith(snapshot + sep) ? relative(snapshot, f.File).replaceAll('\\', '/') : f.File })).map(f => `${JSON.stringify(f.File)}:${Number(f.StartLine)} (${String(f.RuleID)})`);
      throw new Error(`Posibles secretos: ${safe.join(', ')}. No publicar. Si son credenciales reales, revocarlas/rotarlas antes de retirarlas del código; si son ejemplos públicos, documentar una excepción exacta en .gitleaks.toml.`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === 'instalar') { await instalarGitleaks(); console.log(`Gitleaks ${VERSION} instalado y verificado.`); }
    else {
      const ci = process.argv[2] === 'ci';
      const base = ci ? (process.env.SECRETOS_BASE && !/^0+$/.test(process.env.SECRETOS_BASE) ? process.env.SECRETOS_BASE : null) : undefined;
      if (ci && base && !/^[a-f0-9]{40}$/.test(base)) throw new Error('CI necesita SECRETOS_BASE con el SHA anterior al push.');
      revisarSecretos({ cwd: ROOT, ...(ci ? { tree: valor(ROOT, 'rev-parse', 'HEAD^{tree}'), base } : {}) });
      console.log('Archivos privados y secretos: revisión aprobada.');
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
