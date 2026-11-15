import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ejecutar = promisify(execFile);
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const estadoDir = join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'cau-actualizaciones');
const npm = join(dirname(process.execPath), 'npm');

export function interpretarNpm(codigo, salida) {
  if (![0, 1].includes(codigo)) throw new Error('npm outdated no pudo consultar');
  const datos = JSON.parse(salida);
  if (!datos || Array.isArray(datos) || typeof datos !== 'object') throw new Error('respuesta npm inválida');
  return Object.entries(datos).map(([nombre, dato]) => {
    if (!dato || typeof dato.current !== 'string' || typeof dato.latest !== 'string') {
      throw new Error(`npm no devolvió versiones completas para ${nombre}`);
    }
    return { nombre, instalada: dato.current, disponible: dato.latest };
  });
}

export function compararVersiones(instalada, disponible) {
  const parsear = v => /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v)?.slice(1).map(Number);
  const a = parsear(instalada);
  const b = parsear(disponible);
  if (!a || !b) return null;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return b[i] > a[i];
  return false;
}

export function resumenAviso(resultados) {
  return createHash('sha256').update(JSON.stringify(resultados)).digest('hex');
}

async function comando(binario, args, cwd = raiz) {
  try {
    const r = await ejecutar(binario, args, { cwd, timeout: 90_000, maxBuffer: 4 * 1024 * 1024 });
    return { codigo: 0, salida: r.stdout };
  } catch (e) {
    return { codigo: typeof e.code === 'number' ? e.code : -1, salida: e.stdout || '', error: e.code || 'falló' };
  }
}

async function npmOutdated(fuente, args, cwd) {
  const r = await comando(npm, ['outdated', '--json', ...args], cwd);
  const paquetes = interpretarNpm(r.codigo, r.salida || (r.codigo === 0 ? '{}' : ''));
  return { fuente, estado: paquetes.length ? 'actualizaciones' : 'al día',
    detalle: paquetes.map(p => `${p.nombre}: ${p.instalada} → ${p.disponible}`).sort() };
}

async function texto(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'cau-actualizaciones' }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function version(fuente, binario, args, paquete) {
  const local = await comando(binario, args);
  if (local.codigo !== 0) throw new Error('versión instalada no disponible');
  const instalada = local.salida.trim().replace(/^opencode\s+/, '').replace(/^v/, '');
  const datos = JSON.parse(await texto(`https://registry.npmjs.org/${encodeURIComponent(paquete)}/latest`));
  const disponible = datos.version;
  if (typeof disponible !== 'string') throw new Error('versión publicada no disponible');
  const nueva = compararVersiones(instalada, disponible);
  return { fuente, estado: nueva === null ? 'sin comparación' : nueva ? 'actualizaciones' : 'al día',
    detalle: [`instalada: ${instalada}; publicada: ${disponible}`] };
}

async function modernWeb() {
  const local = await readFile(join(homedir(), '.agents/skills/modern-web-guidance/SKILL.md'));
  const remota = await texto('https://raw.githubusercontent.com/GoogleChrome/modern-web-guidance/main/skills/modern-web-guidance/SKILL.md');
  const iguales = local.equals(Buffer.from(remota));
  return { fuente: 'Skill Modern Web Guidance', estado: iguales ? 'al día' : 'actualizaciones',
    detalle: ['Comparación de SKILL.md; no comprueba los demás archivos de la skill.'] };
}

async function skills() {
  const carpetas = [join(homedir(), '.agents/skills'), join(raiz, '.claude/skills')];
  const nombres = [];
  for (const carpeta of carpetas) {
    try {
      for (const item of await readdir(carpeta, { withFileTypes: true })) {
        if (!item.isDirectory() && !item.isSymbolicLink()) continue;
        try { await readFile(join(carpeta, item.name, 'SKILL.md')); nombres.push(`${carpeta === carpetas[0] ? 'global' : 'proyecto'}: ${item.name}`); } catch { /* No es una skill. */ }
      }
    } catch { nombres.push(`${carpeta}: no disponible`); }
  }
  return { fuente: 'Inventario de skills', estado: 'sin comparación',
    detalle: ['Sin origen verificable automático salvo Modern Web Guidance.', ...nombres.sort()] };
}

async function linux(fuente, binario, args, aclaracion) {
  const r = await comando(binario, args);
  if (r.codigo !== 0) throw new Error(`${fuente} no disponible o consulta fallida`);
  const lineas = r.salida.split('\n').map(x => x.trim()).filter(Boolean)
    .filter(x => fuente !== 'APT' || x.includes('/'));
  return { fuente, estado: lineas.length ? 'actualizaciones' : 'sin novedades',
    detalle: [aclaracion, ...lineas] };
}

async function revisar(fuente, fn) {
  try { return await fn(); } catch (e) {
    return { fuente, estado: 'error', detalle: [e instanceof Error ? e.message : 'consulta fallida'] };
  }
}

export async function principal() {
  const resultados = await Promise.all([
    revisar('npm proyecto', () => npmOutdated('npm proyecto', [], raiz)),
    revisar('npm cloudflare', () => npmOutdated('npm cloudflare', [], join(raiz, 'cloudflare'))),
    revisar('npm global', () => npmOutdated('npm global', ['--global'], raiz)),
    revisar('OpenCode CLI', () => version('OpenCode CLI', join(homedir(), '.opencode/bin/opencode'), ['--version'], '@opencode/cli')),
    revisar('CodeGraph', () => version('CodeGraph', join(homedir(), '.local/bin/codegraph'), ['--version'], '@colbymchenry/codegraph')),
    revisar('Skill Modern Web Guidance', modernWeb),
    revisar('Inventario de skills', skills),
    revisar('APT', () => linux('APT', '/usr/bin/apt', ['list', '--upgradable'], 'Lista local de APT; no se actualiza el índice.')),
    revisar('Flatpak', () => linux('Flatpak', '/usr/bin/flatpak', ['remote-ls', '--updates', '--columns=application,version'], 'Sólo remotos configurados.')),
  ]);
  await mkdir(estadoDir, { recursive: true });
  const reporte = join(estadoDir, 'informe.json');
  const anterior = await readFile(reporte, 'utf8').then(JSON.parse).catch(() => null);
  const firma = resumenAviso(resultados);
  const alertas = resultados.filter(r => r.estado === 'actualizaciones' || r.estado === 'error');
  let firmaNotificada = anterior?.firmaNotificada ?? null;
  if (alertas.length && firma !== firmaNotificada) {
    const aviso = await comando('/usr/bin/notify-send', ['Actualizaciones del entorno',
      `${alertas.length} fuentes con novedades o errores. Informe: ${reporte}`]);
    if (aviso.codigo === 0) firmaNotificada = firma;
    else console.error('No se pudo mostrar la notificación; el informe quedó guardado y se reintentará.');
  } else if (!alertas.length) {
    firmaNotificada = null;
  }
  const informe = { fecha: new Date().toISOString(), resultados, firma, firmaNotificada };
  const temporal = `${reporte}.${process.pid}.tmp`;
  await writeFile(temporal, JSON.stringify(informe, null, 2) + '\n', { mode: 0o600 });
  await rename(temporal, reporte);
  console.log(JSON.stringify({ informe: reporte, resultados }, null, 2));
  if (resultados.some(r => r.estado === 'error')) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  principal().catch(e => { console.error(`No se pudo generar el informe: ${e.message}`); process.exitCode = 2; });
}
