#!/usr/bin/env node
// Publica el Worker de producción del sitio.
//
//   npm run publicar               # sin banderas: imprime el plan y no toca nada
//   npm run publicar:ensayo        # compila y arma el paquete con --dry-run
//   npm run publicar:produccion    # compila, publica y verifica con el smoke
//
// Por qué existe: hasta el 27/10/2026 el deploy se hizo a mano con un wrangler
// suelto y una configuración que vivía fuera del repo. El resultado fue el peor
// de los dos mundos: el sitio publicado no se podía reproducir desde el
// repositorio, y nada avisaba si la configuración del Worker se desviaba del
// código. Acá la configuración es `produccion/wrangler.json`, versionada, y el
// publicador la valida antes de mirar la red.
//
// Lo que este script NO hace: no aplica migraciones (eso es `wrangler d1
// migrations apply --remote`, con su propia decisión), no toca secretos (viven
// en Cloudflare y se administran aparte: un `deploy` no los pisa) y no revierte
// solo. Si el smoke falla después de publicar, el sitio ya está cambiado: la
// vuelta atrás es un deploy de la versión anterior, decidido por una persona.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const repo = fileURLToPath(new URL('../..', import.meta.url));
const CONFIG = join(raiz, 'produccion', 'wrangler.json');
const NOMBRE = 'cau-produccion-20261026';
const BASE = 'https://www.siglo21sur.com';
const DOMINIOS = ['www.siglo21sur.com', 'siglo21sur.com'];
const ID_LOCAL = '00000000-0000-0000-0000-000000000001';

export const CONFIG_PRODUCCION = CONFIG;

export function leerConfig(ruta = CONFIG) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

const dominiosDe = config => (config.routes ?? [])
  .filter(ruta => ruta.custom_domain === true)
  .map(ruta => ruta.pattern)
  .sort();

/**
 * Compara la configuración con lo que el Worker espera para poder funcionar.
 * No sale a la red: son invariantes que se pueden romper con un dedazo en el
 * JSON, y justamente por eso tienen que fallar antes de publicar.
 */
export function revisar(config, { compilado = false } = {}) {
  const problemas = [];
  const sip = (condicion, mensaje) => { if (!condicion) problemas.push(mensaje); };

  sip(config.name === NOMBRE, `name tiene que ser ${NOMBRE} (hoy: ${config.name ?? 'falta'})`);

  const entrada = config.main ? join(raiz, 'produccion', config.main) : null;
  sip(Boolean(entrada && existsSync(entrada)), `main no existe: ${config.main ?? 'falta'}`);

  const assets = config.assets?.directory ? join(raiz, 'produccion', config.assets.directory) : null;
  // El build de Astro en modo servidor no deja `index.html`: la marca de que
  // pasó por este paquete es el `_headers` que escribe la integración.
  if (compilado) sip(Boolean(assets && existsSync(join(assets, '_headers'))), `assets sin build: ${config.assets?.directory ?? 'falta'}`);
  sip(config.assets?.binding === 'ASSETS' && config.assets?.run_worker_first === true, 'assets tiene que declarar ASSETS y run_worker_first');

  const base = (config.d1_databases ?? [])[0];
  sip(Boolean(base), 'falta el binding DB');
  sip(base?.database_name === 'cau-produccion', `la base del binding DB tiene que ser cau-produccion (hoy: ${base?.database_name ?? 'falta'})`);
  sip(Boolean(base?.database_id) && base.database_id !== ID_LOCAL, 'el binding DB apunta a la base local');

  const dominios = dominiosDe(config);
  sip(dominios.length === DOMINIOS.length && dominios.every((d, i) => d === [...DOMINIOS].sort()[i]),
    `las rutas tienen que ser ${DOMINIOS.join(' y ')} (hoy: ${dominios.join(', ') || 'ninguna'})`);

  const colas = config.queues ?? {};
  sip((colas.producers ?? []).some(p => p.queue === 'cau-efectos' && p.binding === 'EFECTOS'), 'falta el productor EFECTOS de cau-efectos');
  sip((colas.consumers ?? []).some(c => c.queue === 'cau-efectos' && c.dead_letter_queue === 'cau-efectos-dlq'), 'falta el consumidor de cau-efectos con su DLQ');

  sip((config.triggers?.crons ?? []).length > 0, 'el Worker no declara programados');
  sip(config.observability?.enabled === true, 'observability está apagada');

  const vars = config.vars ?? {};
  sip(vars.APP_STAGE === 'produccion' && vars.DB_STAGE === 'produccion', 'APP_STAGE y DB_STAGE tienen que ser produccion');
  sip(Boolean(vars.TURNSTILE_EXPECTED_HOSTNAME), 'falta TURNSTILE_EXPECTED_HOSTNAME');
  sip(Boolean(vars.PUBLIC_TURNSTILE_SITE_KEY), 'falta la site key pública de Turnstile');

  const filtradas = Object.keys(vars).filter(k => /SECRET|TOKEN|KEY_PRIV|PASSWORD|CLAVE/i.test(k) && !/SITE_KEY/.test(k));
  sip(filtradas.length === 0, `vars no puede llevar secretos: ${filtradas.join(', ')}`);

  return { problemas, config };
}

function git(...args) {
  const r = spawnSync('git', ['--no-pager', ...args], { cwd: repo, encoding: 'utf8' });
  return (r.stdout ?? '').trim();
}

function correr(paso, comando, argumentos, opciones = {}) {
  const resultado = spawnSync(comando, argumentos, { cwd: raiz, stdio: 'inherit', ...opciones });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) {
    const error = new Error(`${paso} terminó con código ${resultado.status}`);
    error.paso = paso;
    throw error;
  }
}

function credenciales(env = process.env) {
  const token = tokenDelEntorno(env);
  if (token) return token;
  // wrangler guarda el OAuth en `~/.wrangler/config/default.toml` en las
  // versiones viejas y en `$XDG_CONFIG_HOME/.wrangler/config/default.toml`
  // (`~/.config/.wrangler/...` por defecto) en las nuevas. Mirar sólo la
  // primera hacía que, con sesión iniciada, el publicador dijera que no había
  // credencial.
  const base = env.XDG_CONFIG_HOME || join(env.HOME ?? '', '.config');
  const oauth = [
    join(env.HOME ?? '', '.wrangler', 'config', 'default.toml'),
    join(base, '.wrangler', 'config', 'default.toml'),
  ];
  if (oauth.some(ruta => existsSync(ruta))) return { origen: 'sesión de wrangler (OAuth de este equipo)', token: null };
  return null;
}

const ENV_LOCAL = join(repo, '.env.local');

/** El token sale del entorno o de `.env.local`. Nunca se imprime su valor. */
export function tokenDelEntorno(env = process.env, archivo = ENV_LOCAL) {
  if (env.CLOUDFLARE_API_TOKEN) return { origen: 'CLOUDFLARE_API_TOKEN del entorno', token: env.CLOUDFLARE_API_TOKEN };
  if (!existsSync(archivo)) return null;
  const linea = readFileSync(archivo, 'utf8').split(/\r?\n/)
    .find(fila => /^\s*(?:export\s+)?CLOUDFLARE_API_TOKEN\s*=/.test(fila));
  if (!linea) return null;
  const valor = linea.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  return valor ? { origen: 'CLOUDFLARE_API_TOKEN de .env.local', token: valor } : null;
}

/**
 * Entorno del hijo que publica: sólo lo que wrangler necesita. En `.env.local`
 * viven también la base, SMTP2GO y credenciales de ventas; nada de eso tiene por
 * qué entrar al proceso que habla con Cloudflare.
 */
export function entornoWrangler(credencial, env = process.env) {
  const salida = {};
  for (const clave of ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TZ', 'CI', 'NO_COLOR']) {
    if (env[clave] !== undefined) salida[clave] = env[clave];
  }
  if (credencial?.token) salida.CLOUDFLARE_API_TOKEN = credencial.token;
  return salida;
}

function plan(config, compilado) {
  const { problemas } = revisar(config, { compilado });
  const commit = git('rev-parse', '--short', 'HEAD') || 'sin commit';
  const sucios = git('status', '--porcelain', 'produccion', 'src', 'migrations').split('\n').filter(Boolean);

  console.log(`Worker      ${config.name}  (commit ${commit})`);
  console.log(`Dominios    ${dominiosDe(config).join(', ')}`);
  console.log(`Base        ${config.d1_databases[0].database_name} (${config.d1_databases[0].database_id})`);
  console.log(`Colas       ${config.queues.producers.map(p => p.queue).join(', ')} + DLQ ${config.queues.consumers[0].dead_letter_queue}`);
  console.log(`Programados ${config.triggers.crons.length}: ${config.triggers.crons.join(' | ')}`);
  console.log(`Assets      ${config.assets.directory} (run_worker_first)`);
  console.log(`Secretos    seis, administrados en Cloudflare: un deploy no los toca`);
  if (sucios.length) {
    console.log(`Sin commitear en el Worker: ${sucios.length} archivo(s)`);
    for (const linea of sucios) console.log(`  ${linea}`);
  }
  if (problemas.length) {
    console.log('\nLa configuración no pasa la revisión:');
    for (const problema of problemas) console.log(`  FALLA  ${problema}`);
    return false;
  }
  console.log('\nRevisión de la configuración: sin problemas.');
  return true;
}

function main() {
  const argumentos = process.argv.slice(2);
  const publicar = argumentos.includes('--publicar');
  const ensayo = argumentos.includes('--ensayo');
  // El barrido de las 123 URLs del sitemap es una ráfaga desde una IP de
  // datacenter, y el borde de Cloudflare la rechaza con 403 (Browser Integrity
  // Check): no es que el sitio esté roto. En CI se corre la parte fija; el
  // barrido completo queda para `herramientas/vigilancia.mjs` y para la máquina.
  const smokeRapido = argumentos.includes('--smoke-rapido');
  if (publicar && ensayo) throw new Error('--publicar y --ensayo no van juntos.');
  const conocidos = argumentos.filter(a => !['--publicar', '--ensayo', '--smoke-rapido'].includes(a));
  if (conocidos.length) throw new Error(`Bandera desconocida: ${conocidos.join(' ')}`);

  const config = leerConfig();
  const compilado = existsSync(join(raiz, 'dist', 'client', '_headers'));
  const planOk = plan(config, compilado);

  if (!publicar && !ensayo) {
    console.log('\nPlan: (1) build del paquete, (2) wrangler deploy con produccion/wrangler.json, (3) smoke contra producción.');
    console.log('No se compiló ni se publicó nada. Para hacerlo: npm run publicar:produccion');
    process.exitCode = planOk ? 0 : 1;
    return;
  }
  if (!planOk) {
    console.log('\nNo se compila ni se publica: primero resolver la configuración.');
    process.exitCode = 1;
    return;
  }

  // El ensayo no toca la red ni publica: no necesita credencial. Publicar sí.
  const credencial = publicar ? credenciales() : null;
  if (publicar && !credencial) {
    throw new Error(
      'No hay credencial de Cloudflare. En orden de preferencia:\n'
      + '  1. CLOUDFLARE_API_TOKEN (token acotado: Workers Scripts:Edit, Workers Routes:Edit de la zona,\n'
      + '     Queues:Edit y D1:Edit sólo si vas a migrar) en el entorno o en `.env.local`, que no se versiona.\n'
      + '  2. Una sesión de `wrangler login` en esta máquina, que guarda el OAuth en texto plano.\n'
      + 'Este script no pide ni guarda la credencial.',
    );
  }
  if (credencial) console.log(`\nCredencial: ${credencial.origen}`);

  console.log('\n[1/3] Build del paquete');
  correr('build', process.execPath, ['scripts/local.mjs', 'build']);

  const revisado = revisar(leerConfig(), { compilado: true });
  if (revisado.problemas.length) {
    for (const problema of revisado.problemas) console.log(`  FALLA  ${problema}`);
    throw new Error('El build no dejó lo que la configuración espera.');
  }

  console.log(`\n[2/3] ${ensayo ? 'Ensayo del paquete (--dry-run, no publica)' : 'Publicación'}`);
  correr('wrangler', process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--config', 'produccion/wrangler.json', ...(ensayo ? ['--dry-run'] : [])],
    { env: entornoWrangler(credencial) });

  if (ensayo) {
    console.log('\nEnsayo terminado: no se publicó nada.');
    return;
  }

  console.log(`\n[3/3] Verificación contra ${BASE}${smokeRapido ? ' (rutas fijas)' : ''}`);
  try {
    correr('smoke', process.execPath, [join(repo, 'herramientas', 'smoke.mjs'), ...(smokeRapido ? ['--rapido'] : [])], { cwd: repo, env: entornoWrangler(null) });
  } catch {
    console.log('\nEl deploy quedó publicado y el smoke encontró fallas. No revierte solo:');
    console.log('la vuelta atrás es publicar la versión anterior desde el panel de Cloudflare o repetir este paso con el commit bueno.');
    process.exitCode = 1;
    return;
  }
  console.log('\nPublicado y verificado.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
