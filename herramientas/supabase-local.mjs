import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname, join, delimiter, basename } from 'node:path';
import { readFile, writeFile, mkdir, mkdtemp, copyFile, symlink, rm, realpath, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const exec = promisify(execFile);
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WORKDIR = join(ROOT, 'herramientas/supabase-local');
export const PROJECT = 'cau-guardrails-local';
const cli = join(ROOT, 'node_modules/supabase/dist/supabase.js');
const desktopDocker = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs/DockerDesktop/resources/bin/docker.exe');
const docker = process.platform === 'win32' && desktopDocker && existsSync(desktopDocker) ? desktopDocker : 'docker';
let verifiedDockerEndpoint;
export function containerEnvironment(source = process.env, endpoint = verifiedDockerEndpoint) {
  if (Object.entries(source).some(([key, value]) => /^DOCKER_/i.test(key) && value)) throw new Error('Un override Docker altera el destino: quitá las variables DOCKER_* antes de ejecutar estas pruebas.');
  const env = { ...source };
  for (const key of Object.keys(env)) if (/^DOCKER_/i.test(key)) delete env[key];
  if (endpoint) { assertLocalDockerEndpoint(endpoint); env.DOCKER_HOST = endpoint; }
  return env;
}
const runDocker = (args, options = {}) => exec(docker, args, { ...options, env: containerEnvironment(options.env ?? process.env) });

export function assertTemporaryCleanupPath(path, root = tmpdir()) {
  const target = resolve(path), parent = resolve(root);
  if (dirname(target) !== parent || !basename(target).startsWith('cau-guardrails-')) throw new Error('Limpieza rechazada: el destino no es el directorio temporal del harness.');
}

const runCli = (args, options = {}) => {
  const env = containerEnvironment(options.env ?? process.env);
  if (desktopDocker && existsSync(desktopDocker)) {
    const key = Object.keys(env).find(key => key.toLowerCase() === 'path') ?? 'PATH';
    env[key] = dirname(desktopDocker) + delimiter + (env[key] ?? '');
  }
  return exec(process.execPath, [cli, ...args], { ...options, env });
};

export function assertLocalStatus(status) {
  if (status.API_URL !== 'http://127.0.0.1:55421' || status.DB_URL !== 'postgresql://postgres:postgres@127.0.0.1:55422/postgres') throw new Error('Se requiere el Supabase aislado en los puertos 55421/55422; destino rechazado.');
  if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY) throw new Error('Faltan credenciales locales emitidas por la CLI.');
}

export function isolatedEnvironment(status, source = process.env) {
  const env = {};
  for (const [key, value] of Object.entries(source)) if (/^(path|systemroot|windir|temp|tmp|home|userprofile|appdata|localappdata)$/i.test(key)) env[key] = value;
  return { ...env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1', SUPABASE_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY, NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL: '1' };
}

export function assertLocalDockerEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || !/^(npipe:\/\/\/\/\.\/pipe\/|unix:\/\/\/)/.test(endpoint)) throw new Error('Docker debe usar un motor local, no un contexto remoto.');
}

async function assertProject() {
  containerEnvironment(process.env);
  const config = await readFile(join(WORKDIR, 'supabase/config.toml'), 'utf8');
  if (!/^project_id = "cau-guardrails-local"$/m.test(config) || !/port = 55421/.test(config) || !/port = 55422/.test(config)) throw new Error('Configuración del proyecto aislado alterada.');
  let stdout;
  try { ({stdout} = await runDocker(['context', 'inspect'], { windowsHide:true })); }
  catch { throw new Error('Docker no está disponible. Iniciá Docker Desktop (motor Linux/WSL 2) y ejecutá npm run db:local:iniciar.'); }
  const endpoint = JSON.parse(stdout)[0]?.Endpoints?.docker?.Host;
  assertLocalDockerEndpoint(endpoint);
  verifiedDockerEndpoint = endpoint;
  try { await runDocker(['info', '--format', '{{.ServerVersion}}'], { timeout: 15000, windowsHide: true }); }
  catch { throw new Error('Docker no está disponible. Iniciá Docker Desktop (motor Linux/WSL 2) y ejecutá npm run db:local:iniciar.'); }
}

export async function localStatus() {
  await assertProject();
  let result;
  try { result = await runCli( ['status', '--workdir', WORKDIR, '--output', 'json'], { windowsHide: true, env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' } }); }
  catch { throw new Error('Supabase local no está iniciado. Ejecutá npm run db:local:iniciar y luego npm run test:integracion.'); }
  const status = JSON.parse(result.stdout);
  assertLocalStatus(status);
  const { stdout } = await runDocker( ['inspect', `supabase_db_${PROJECT}`], { windowsHide: true });
  const container = JSON.parse(stdout)[0];
  if (container?.Config?.Labels?.['com.supabase.cli.project'] !== PROJECT) throw new Error('El contenedor no pertenece al proyecto aislado esperado.');
  return status;
}

export async function fixtureDatabase(status) {
  assertLocalStatus(status);
  const client = new pg.Client({ connectionString: status.DB_URL, connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    const { rows } = await client.query("SELECT obj_description('public.guardrails_fixture'::regclass) AS marker");
    if (rows[0]?.marker !== PROJECT) throw new Error('La base no es el fixture aislado esperado.');
    const triggers = await client.query("SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace)");
    if (triggers.rowCount) throw new Error('Fixture con triggers ajenos: no se harán escrituras.');
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    const allowed = ['guardrails_fixture', 'materias', 'profesores', 'consultas', 'faq_preguntas', 'solicitudes_clase', 'form_rate_limits'];
    if (tables.rows.some(row => !allowed.includes(row.tablename))) throw new Error('La base contiene tablas ajenas al fixture; no se harán escrituras.');
    return client;
  } catch (error) { await client.end(); throw error; }
}

export async function applyPolicies(client) {
  for (const name of ['2026-07-20_seguridad_admin.sql', '2026-07-20_seguridad_formularios.sql', '2026-07-22_cerrar_lectura_publica.sql']) await client.query(await readFile(join(ROOT, 'sql', name), 'utf8'));
  await client.query("NOTIFY pgrst, 'reload schema'");
}

async function prepareDatabase(status) {
  const client = new pg.Client({ connectionString: status.DB_URL, connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    const lock = await client.query('SELECT pg_try_advisory_lock(554215542) AS acquired');
    if (!lock.rows[0].acquired) throw new Error('Otra prueba local está usando el fixture. Esperá a que termine.');
    const existing = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    if (existing.rowCount) {
      const verified = await fixtureDatabase(status);
      await verified.end();
    } else {
      await client.query(await readFile(join(WORKDIR, 'fixture.sql'), 'utf8'));
    }
    await applyPolicies(client);
  } finally { await client.end(); }
}

export async function startApp(status) {
  assertLocalStatus(status);
  const nonce = randomUUID();
  const dir = await mkdtemp(join(tmpdir(), 'cau-guardrails-'));
  for (const file of ['app/api/formularios/route.ts', 'lib/supabase-admin.ts', 'lib/turnstile.ts', 'components/formularios/casas.ts', 'tsconfig.json']) {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await copyFile(join(ROOT, file), join(dir, file));
  }
  await mkdir(join(dir, 'app/api/guardrails-health'), { recursive: true });
  await writeFile(join(dir, 'app/api/guardrails-health/route.ts'), `export function GET() { return Response.json({nonce: '${nonce}'}); }`);
  await writeFile(join(dir, 'package.json'), JSON.stringify({ private: true, dependencies: { next: '*', react: '*', 'react-dom': '*' } }));
  await writeFile(join(dir, 'app/layout.tsx'), 'export default function Layout({children}: {children: React.ReactNode}) { return <html><body>{children}</body></html>; }');
  await symlink(join(ROOT, 'node_modules'), join(dir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const child = spawn(process.execPath, [join(ROOT, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '55430'], { cwd: dir, env: isolatedEnvironment(status), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let exited = false;
  let output = '';
  child.on('exit', () => { exited = true; });
  child.on('error', () => { exited = true; });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output = (output + data).slice(-3000); });
  const stop = async () => {
    if (!exited) {
      if (process.platform === 'win32') await exec('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true }).catch(() => {});
      else child.kill('SIGTERM');
      for (let i = 0; !exited && i < 50; i++) await new Promise(r => setTimeout(r, 100));
    }
    if (exited) {
      assertTemporaryCleanupPath(await realpath(dir), await realpath(tmpdir()));
      // Retirar el enlace evita incluir dependencias ajenas en la limpieza recursiva.
      await unlink(join(dir, 'node_modules'));
      await rm(dir, { recursive: true, force: true });
    }
  };
  try {
    for (let i = 0; i < 120; i++) {
      if (exited) throw new Error('El servidor aislado terminó antes de estar listo.');
      try {
        const response = await fetch('http://127.0.0.1:55430/api/guardrails-health', { signal: AbortSignal.timeout(2000) });
        if (response.ok && (await response.json()).nonce === nonce) return { stop };
      } catch { /* El compilador puede tardar en el primer inicio. */ }
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('El servidor aislado no estuvo listo en 60 segundos.');
  } catch (error) {
    await stop();
    // No se incluyen logs que podrían contener claves locales.
    throw new Error(`${error.message} Revisá Next y el puerto 55430 (salida capturada: ${output.length} caracteres).`);
  }
}

async function main(action) {
  if (!['iniciar', 'detener', 'estado'].includes(action)) throw new Error('Uso: npm run db:local:iniciar | db:local:detener | db:local:estado');
  await assertProject();
  if (action === 'iniciar') {
    console.log('Primera ejecución: descarga imágenes y usa varios GB. Sólo proyecto local; no conecta producción.');
    await runCli( ['start', '--workdir', WORKDIR], { windowsHide: true, timeout: 600000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' } });
    const status = await localStatus();
    await prepareDatabase(status);
    console.log('Supabase aislado listo. Ejecutá npm run test:integracion.');
  } else if (action === 'detener') {
    await runCli( ['stop', '--project-id', PROJECT, '--workdir', WORKDIR], { windowsHide: true, timeout: 60000 });
    console.log('Proyecto local detenido; se conservan datos ficticios.');
  } else { await localStatus(); console.log('Supabase aislado disponible (sin mostrar credenciales).'); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 2; });
