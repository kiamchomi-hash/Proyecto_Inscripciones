#!/usr/bin/env node
// Mueve entre maquinas lo que NO viaja por git: credenciales, la memoria de
// Claude Code y las preferencias. El codigo lo trae `git clone`; esto es el
// resto, que esta gitignoreado a proposito porque son secretos o son notas
// personales.
//
//   node herramientas/entorno.mjs exportar
//   node herramientas/entorno.mjs importar --desde=~/entorno-cau.tar.gz
//
// El paquete sale del repo (al home), nunca adentro: lleva la service account
// de Search Console y las claves de Supabase.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const RAIZ = path.resolve(import.meta.dirname, '..');
const STAGING = path.join(os.homedir(), 'entorno-cau');
const PAQUETE = path.join(os.homedir(), 'entorno-cau.tar.gz');

// Claude Code guarda lo del proyecto en ~/.claude/projects/<ruta con todo lo
// que no sea alfanumerico pasado a guion>. O sea que el nombre cambia con la
// ruta: la carpeta de Windows no le sirve a Linux. Recalcularlo de este lado es
// lo unico que hace que la memoria sobreviva a la mudanza.
function carpetaDeMemoria(raiz = RAIZ) {
  const slug = raiz.replace(/[^a-zA-Z0-9]/g, '-');
  return path.join(os.homedir(), '.claude', 'projects', slug, 'memory');
}

// Copia a mano en vez de fs.cpSync: en Node 24 sobre Windows, cpSync recursivo
// sobre un directorio cuya ruta tiene un caracter no ASCII revienta el proceso
// entero (0xC0000409, sin excepcion que se pueda atrapar). La ruta de este
// proyecto tiene un acento, asi que caia siempre. Doce lineas propias salen mas
// baratas que depender de que se arregle.
function copiar(origen, destino) {
  if (statSync(origen).isDirectory()) {
    mkdirSync(destino, { recursive: true });
    for (const hijo of readdirSync(origen)) {
      copiar(path.join(origen, hijo), path.join(destino, hijo));
    }
    return;
  }
  mkdirSync(path.dirname(destino), { recursive: true });
  copyFileSync(origen, destino);
}

const PIEZAS = [
  {
    nombre: '.env.local',
    detalle: 'URL y anon key de Supabase, id de Analytics',
    ruta: () => path.join(RAIZ, '.env.local'),
    dentro: 'env.local',
  },
  {
    nombre: 'memoria de Claude Code',
    detalle: 'lo que aprendio del proyecto en las sesiones anteriores',
    ruta: () => carpetaDeMemoria(),
    dentro: 'memory',
  },
  {
    nombre: 'credencial de Search Console',
    detalle: 'la service account que usa el MCP gsc',
    ruta: () => path.join(os.homedir(), '.gsc', 'service_account.json'),
    dentro: 'gsc/service_account.json',
  },
  {
    nombre: 'carpeta .agents',
    detalle: 'preferencias, reportes y scripts de release',
    ruta: () => path.join(RAIZ, '.agents'),
    dentro: 'agents',
  },
  {
    nombre: 'ajustes globales de Claude Code',
    detalle: 'modelo, canal de updates, modo de la terminal',
    ruta: () => path.join(os.homedir(), '.claude', 'settings.json'),
    dentro: 'claude-settings.json',
  },
  {
    nombre: 'notas locales',
    detalle: 'investigaciones propias que no van al repo publico',
    ruta: () => path.join(RAIZ, 'notas-locales'),
    dentro: 'notas-locales',
  },
];

function exportar() {
  rmSync(STAGING, { recursive: true, force: true });
  mkdirSync(STAGING, { recursive: true });

  let copiadas = 0;
  for (const pieza of PIEZAS) {
    const origen = pieza.ruta();
    if (!existsSync(origen)) {
      console.log(`  -  ${pieza.nombre}: no esta en esta maquina, se saltea`);
      continue;
    }
    const destino = path.join(STAGING, pieza.dentro);
    copiar(origen, destino);
    console.log(`  OK ${pieza.nombre} (${pieza.detalle})`);
    copiadas++;
  }

  if (!copiadas) {
    console.log('\n  No habia nada para exportar.');
    return 1;
  }

  console.log('');
  const tar = spawnSync('tar', ['-czf', PAQUETE, '-C', os.homedir(), 'entorno-cau'], {
    stdio: 'inherit',
  });

  if (tar.status === 0) {
    rmSync(STAGING, { recursive: true, force: true });
    console.log(`  Paquete listo: ${PAQUETE}`);
  } else {
    // tar viene con Windows 10 y con cualquier Linux, pero si falta no hay
    // drama: la carpeta ya esta armada y se copia igual.
    console.log(`  No se pudo comprimir. La carpeta quedo en: ${STAGING}`);
  }

  console.log('');
  console.log('  Pasalo a la otra maquina (USB, scp, lo que sea) y ahi:');
  console.log('    node herramientas/entorno.mjs importar --desde=<ruta del paquete>');
  console.log('');
  console.log('  OJO: adentro van credenciales. No subirlo a ningun lado.');
  return 0;
}

function importar(desde, forzar) {
  if (!desde) {
    console.error('  Falta --desde=<ruta al .tar.gz o a la carpeta entorno-cau>');
    return 1;
  }

  let origenBase = path.resolve(desde.replace(/^~(?=$|[/\\])/, os.homedir()));
  if (!existsSync(origenBase)) {
    console.error(`  No existe: ${origenBase}`);
    return 1;
  }

  if (statSync(origenBase).isFile()) {
    const temporal = path.join(os.tmpdir(), `entorno-cau-${Date.now()}`);
    mkdirSync(temporal, { recursive: true });
    const tar = spawnSync('tar', ['-xzf', origenBase, '-C', temporal], { stdio: 'inherit' });
    if (tar.status !== 0) {
      console.error('  No se pudo descomprimir el paquete.');
      return 1;
    }
    origenBase = path.join(temporal, 'entorno-cau');
  }

  let instaladas = 0;
  let salteadas = 0;
  for (const pieza of PIEZAS) {
    const origen = path.join(origenBase, pieza.dentro);
    if (!existsSync(origen)) continue;

    const destino = pieza.ruta();
    if (existsSync(destino) && !forzar) {
      console.log(`  -  ${pieza.nombre}: ya existe aca, no se pisa (--forzar para reemplazar)`);
      salteadas++;
      continue;
    }
    if (existsSync(destino)) rmSync(destino, { recursive: true, force: true });
    copiar(origen, destino);
    console.log(`  OK ${pieza.nombre} -> ${destino}`);
    instaladas++;
  }

  console.log('');
  console.log(`  Instaladas ${instaladas}, salteadas ${salteadas}.`);
  console.log('');
  console.log('  Falta lo que no se puede empaquetar, que es todo login:');
  console.log('    git clone https://github.com/kiamchomi-hash/conocimiento-hermes.git herramientas/conocimiento-hermes');
  console.log('    npx vercel login');
  console.log('    npx supabase login');
  console.log('    gh auth login');
  console.log('');
  // En una sola linea a proposito: la continuacion con "\" no existe en cmd ni
  // en PowerShell, y este texto se lee tanto en Windows como en Linux.
  const credencial = path.join(os.homedir(), '.gsc', 'service_account.json');
  console.log('  Y el MCP de Search Console (necesita uv instalado):');
  console.log(
    `    claude mcp add gsc --scope user --env GSC_CREDENTIALS_PATH=${credencial} --env GSC_SKIP_OAUTH=true -- uvx mcp-search-console`,
  );
  return 0;
}

const [accion, ...resto] = process.argv.slice(2);
const forzar = resto.includes('--forzar');
const desde = resto.find((a) => a.startsWith('--desde='))?.slice('--desde='.length);

console.log('');
if (accion === 'exportar') {
  process.exit(exportar());
} else if (accion === 'importar') {
  process.exit(importar(desde, forzar));
} else {
  console.log('  Uso:');
  console.log('    node herramientas/entorno.mjs exportar');
  console.log('    node herramientas/entorno.mjs importar --desde=~/entorno-cau.tar.gz [--forzar]');
  console.log('');
  console.log(`  Memoria de Claude en esta maquina: ${carpetaDeMemoria()}`);
  process.exit(1);
}
