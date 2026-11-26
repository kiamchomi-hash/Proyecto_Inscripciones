#!/usr/bin/env node
// Publica el Worker de la Academia Identidad Argentina en topykly.com.
//
//   npm run publicar:identidad               # plan, no toca nada
//   npm run publicar:identidad:ensayo        # build + deploy --dry-run
//   npm run publicar:identidad:produccion    # build + deploy + smoke
//
// Es un segundo Worker del mismo paquete y la misma base D1: comparte fichas y
// formularios, pero no declara crons ni consume la cola (el consumidor sigue
// siendo el Worker del CAU). Los assets del build son los mismos.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entornoWrangler, tokenDelEntorno } from './publicar.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const repo = fileURLToPath(new URL('../..', import.meta.url));
const CONFIG = join(raiz, 'produccion', 'wrangler-identidad.json');
const NOMBRE = 'cau-identidad-20261126';
const DOMINIOS = ['topykly.com', 'www.topykly.com'];
const BASE = 'https://topykly.com';

export function leerConfigIdentidad(ruta = CONFIG) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

const dominiosDe = config => (config.routes ?? [])
  .filter(ruta => ruta.custom_domain === true)
  .map(ruta => ruta.pattern)
  .sort();

/** Invariantes del segundo Worker: si se desvían, no se publica. */
export function revisarIdentidad(config, { compilado = false } = {}) {
  const problemas = [];
  const sip = (condicion, mensaje) => { if (!condicion) problemas.push(mensaje); };

  sip(config.name === NOMBRE, `name tiene que ser ${NOMBRE} (hoy: ${config.name ?? 'falta'})`);
  const entrada = config.main ? join(raiz, 'produccion', config.main) : null;
  sip(Boolean(entrada && existsSync(entrada)), `main no existe: ${config.main ?? 'falta'}`);

  const assets = config.assets?.directory ? join(raiz, 'produccion', config.assets.directory) : null;
  if (compilado) sip(Boolean(assets && existsSync(join(assets, '_headers'))), `assets sin build: ${config.assets?.directory ?? 'falta'}`);
  sip(config.assets?.binding === 'ASSETS' && config.assets?.run_worker_first === true,
    'assets tiene que declarar ASSETS y run_worker_first');

  const base = (config.d1_databases ?? [])[0];
  sip(base?.database_name === 'cau-produccion' && base?.database_id === '4a1cc90c-8c55-493f-9753-d40ac5cbc3cb',
    'el binding DB tiene que apuntar a cau-produccion');

  const dominios = dominiosDe(config);
  sip(dominios.length === DOMINIOS.length && dominios.every((d, i) => d === [...DOMINIOS].sort()[i]),
    `las rutas tienen que ser ${DOMINIOS.join(' y ')} (hoy: ${dominios.join(', ') || 'ninguna'})`);

  const vars = config.vars ?? {};
  sip(vars.APP_STAGE === 'produccion' && vars.DB_STAGE === 'produccion', 'APP_STAGE y DB_STAGE tienen que ser produccion');
  sip(vars.APP_SITIO === 'identidad', 'APP_SITIO tiene que ser identidad');
  sip(/topykly\.com/.test(vars.TURNSTILE_EXPECTED_HOSTNAME ?? ''), 'falta topykly en TURNSTILE_EXPECTED_HOSTNAME');
  sip(Boolean(vars.PUBLIC_TURNSTILE_SITE_KEY), 'falta la site key pública de Turnstile');

  const productor = (config.queues?.producers ?? []).find(p => p.binding === 'EFECTOS');
  sip(productor?.queue === 'cau-efectos', 'falta el productor EFECTOS de cau-efectos');
  sip((config.queues?.consumers ?? []).length === 0,
    'el Worker de Identidad no puede consumir la cola: el consumidor es el del CAU');
  sip((config.triggers?.crons ?? []).length === 0,
    'el Worker de Identidad no declara crons: los programados corren en el CAU');

  const filtradas = Object.keys(vars).filter(k => /SECRET|TOKEN|KEY_PRIV|PASSWORD|CLAVE/i.test(k) && !/SITE_KEY/.test(k));
  sip(filtradas.length === 0, `vars no puede llevar secretos: ${filtradas.join(', ')}`);

  return { problemas, config };
}

function correr(paso, comando, argumentos, opciones = {}) {
  const resultado = spawnSync(comando, argumentos, { cwd: raiz, stdio: 'inherit', ...opciones });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) throw new Error(`${paso} terminó con código ${resultado.status}`);
}

function credencial() {
  const delEntorno = tokenDelEntorno();
  if (delEntorno) return delEntorno;
  const base = process.env.XDG_CONFIG_HOME || join(process.env.HOME ?? '', '.config');
  const oauth = join(base, '.wrangler', 'config', 'default.toml');
  return existsSync(oauth) ? { origen: 'sesión de wrangler (OAuth de este equipo)', token: null } : null;
}

async function smoke() {
  const casos = [
    ['/', 200],
    ['/carreras/diplomatura-en-compliance', 200],
    ['/carreras/diplomatura-en-oratoria', 301],
    ['/contacto', 301],
  ];
  for (const [ruta, estado] of casos) {
    const respuesta = await fetch(`${BASE}${ruta}`, { redirect: 'manual' });
    if (respuesta.status !== estado) {
      throw new Error(`${BASE}${ruta} respondió ${respuesta.status}, se esperaba ${estado}`);
    }
    if (ruta === '/') {
      const html = await respuesta.text();
      if (!html.includes('Academia Identidad Argentina')) {
        throw new Error('la home no muestra la Academia Identidad Argentina');
      }
      if (!html.includes(`<link rel="canonical" href="${BASE}/">`)) {
        throw new Error('la home no declara el canónico de topykly');
      }
      // El sitio de Identidad no usa el HTML versionado contra R2: si un CSS
      // sale con `/__assets/...`, el deploy quedó sin estilos.
      const hoja = /<link rel="stylesheet" href="([^"]+)"/.exec(html)?.[1];
      if (!hoja) throw new Error('la home no declara ninguna hoja de estilos');
      const css = await fetch(hoja.startsWith('http') ? hoja : `${BASE}${hoja}`, { redirect: 'manual' });
      if (css.status !== 200 || !(css.headers.get('content-type') ?? '').includes('text/css')) {
        throw new Error(`la hoja de estilos ${hoja} respondió ${css.status}`);
      }
    }
    if (ruta === '/contacto') {
      const destino = respuesta.headers.get('location') ?? '';
      if (!destino.startsWith('https://www.siglo21sur.com/contacto')) {
        throw new Error(`/contacto redirige a ${destino}`);
      }
    }
    if (ruta === '/carreras/diplomatura-en-oratoria') {
      const destino = respuesta.headers.get('location') ?? '';
      if (!destino.startsWith(`${BASE}/`)) {
        throw new Error(`la ficha retirada redirige a ${destino}`);
      }
    }
  }
  console.log(`Smoke de ${BASE}: home, ficha, ficha retirada y redirect al CAU.`);
}

async function main() {
  const argumentos = process.argv.slice(2);
  const publicar = argumentos.includes('--publicar');
  const ensayo = argumentos.includes('--ensayo');
  if (publicar && ensayo) throw new Error('--publicar y --ensayo no van juntos.');
  const conocidos = argumentos.filter(a => !['--publicar', '--ensayo'].includes(a));
  if (conocidos.length) throw new Error(`Bandera desconocida: ${conocidos.join(' ')}`);

  const config = leerConfigIdentidad();
  const compilado = existsSync(join(raiz, 'dist', 'client', '_headers'));
  const { problemas } = revisarIdentidad(config, { compilado });

  console.log(`Worker      ${config.name}`);
  console.log(`Dominios    ${dominiosDe(config).join(', ')}`);
  console.log(`Base        ${config.d1_databases[0].database_name} (${config.d1_databases[0].database_id})`);
  console.log(`Cola        ${config.queues.producers.map(p => p.queue).join(', ')} (sólo productor)`);
  console.log(`Crons       ninguno (siguen en el CAU)`);
  if (problemas.length) {
    console.log('\nLa configuración no pasa la revisión:');
    for (const problema of problemas) console.log(`  FALLA  ${problema}`);
  } else {
    console.log('\nRevisión de la configuración: sin problemas.');
  }

  if (!publicar && !ensayo) {
    console.log('\nPlan: (1) build, (2) wrangler deploy con produccion/wrangler-identidad.json, (3) smoke.');
    console.log('No se compiló ni se publicó nada. Para hacerlo: npm run publicar:identidad:produccion');
    process.exitCode = problemas.length ? 1 : 0;
    return;
  }
  if (problemas.length) {
    console.log('\nNo se compila ni se publica: primero resolver la configuración.');
    process.exitCode = 1;
    return;
  }

  const cred = publicar ? credencial() : null;
  if (publicar && !cred) {
    throw new Error('No hay credencial de Cloudflare: correr `npx wrangler login` o definir CLOUDFLARE_API_TOKEN.');
  }
  if (cred) console.log(`\nCredencial: ${cred.origen}`);

  console.log('\n[1/3] Build del paquete');
  correr('build', process.execPath, ['scripts/local.mjs', 'build']);

  const revisado = revisarIdentidad(leerConfigIdentidad(), { compilado: true });
  if (revisado.problemas.length) {
    for (const problema of revisado.problemas) console.log(`  FALLA  ${problema}`);
    throw new Error('El build no dejó lo que la configuración espera.');
  }

  const banderas = ensayo ? ['--dry-run'] : [];
  console.log(`\n[2/3] ${ensayo ? 'Ensayo' : 'Deploy'} del Worker de Identidad`);
  correr('wrangler', process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--config', 'produccion/wrangler-identidad.json', ...banderas],
    { env: entornoWrangler(cred) });

  if (ensayo) {
    console.log('\nEnsayo terminado: no se publicó nada.');
    return;
  }

  console.log('\n[3/3] Smoke contra topykly.com');
  await smoke();
  console.log('\nPublicado. Falta cargar el secreto TURNSTILE_SECRET_KEY si es la primera vez:');
  console.log('  npx wrangler secret put TURNSTILE_SECRET_KEY --config produccion/wrangler-identidad.json');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(error => {
    console.error(`No se pudo publicar: ${error.message}`);
    process.exitCode = 1;
  });
}
