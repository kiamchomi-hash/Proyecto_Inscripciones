#!/usr/bin/env node
// Respalda en Google Drive lo que NO viaja por git: el conocimiento comercial
// (precios, fuentes, corpus del bot, planes), las notas locales, el codigo de
// las apps de HubSpot, la biblioteca de UIverse y el material de contenidos.
//
//   npm run respaldo:nube                       # todo
//   npm run respaldo:nube -- --solo=conocimiento
//   npm run respaldo:nube -- --solo=contenidos
//   npm run respaldo:nube -- --listar           # que piezas entran, sin subir
//
// Cada area se empaqueta en .tar.zst y se sube como pocos archivos grandes.
// Subir miles de archivos sueltos hace que Google Drive limite las llamadas y
// todo tarde horas; con archivos de hasta 2 GiB la subida es estable.
//
// Requiere rclone con un remoto `gdrive` autorizado (ver docs/herramientas.md).
// Los builds (target/), las dependencias (node_modules/) y los perfiles de
// navegador logueados quedan afuera: se regeneran o son credenciales de sesion.

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASA = os.homedir();
const REMOTO = process.env.CAU_RESPALDO_REMOTO || 'gdrive:CAU-Backup';
const TRABAJO = path.join(os.tmpdir(), 'respaldo-nube');
const LIMITE_TAR = 2 * 1024 ** 3;

const args = process.argv.slice(2);
const solo = (args.find((a) => a.startsWith('--solo=')) ?? '').slice('--solo='.length) || 'todo';
const listar = args.includes('--listar') || args.includes('--ensayo');
const ayuda = args.includes('--ayuda') || args.includes('-h');

// Lo que nunca se sube: builds, dependencias, perfiles de navegador y temporales.
const EXCLUSIONES = ['node_modules', 'target', 'temp', 'perfil-*'];

const CONOCIMIENTO = [
  { nombre: 'ventas', origen: path.join(RAIZ, 'ventas') },
  { nombre: 'carreras', origen: path.join(RAIZ, 'carreras') },
  { nombre: 'base', origen: path.join(RAIZ, 'conocimiento') },
  { nombre: 'notas-locales', origen: path.join(RAIZ, 'notas-locales') },
  { nombre: 'herramientas-ventas', origen: path.join(RAIZ, 'herramientas', 'ventas') },
  { nombre: 'app-carga-leads', origen: path.join(RAIZ, 'carga-leads-app') },
  { nombre: 'app-revision-pagos', origen: path.join(CASA, 'Escritorio', 'rust', 'revision-pagos') },
  { nombre: 'uiverse', origen: path.join(CASA, 'Documentos', 'uiverse') },
];

const LANZADORES = [
  'Carga de leads.desktop',
  'revision-pagos.desktop',
  'HubSpot - Leads.desktop',
  'UIverse local.desktop',
];

const SQLITE = path.join(CASA, '.local', 'share', 'revisionpagos', 'revision-pagos.sqlite3');
const ODS = path.join(CASA, 'Escritorio', 'Base de datos Alumnos .ods');
const SKILLS = path.join(CASA, '.claude', 'skills');
const AGENTES = path.join(CASA, '.config', 'opencode', 'agents');

function mostrarAyuda() {
  console.log(`
  Respaldo del conocimiento local en Google Drive.

    npm run respaldo:nube                       todo
    npm run respaldo:nube -- --solo=conocimiento
    npm run respaldo:nube -- --solo=contenidos
    npm run respaldo:nube -- --listar           que piezas entran, sin subir

  El remoto por defecto es gdrive:CAU-Backup. Se puede cambiar con
  CAU_RESPALDO_REMOTO=otro:ruta npm run respaldo:nube
`);
}

function correr(programa, argumentos, opciones = {}) {
  const resultado = spawnSync(programa, argumentos, {
    stdio: opciones.capturar ? 'pipe' : 'inherit',
    encoding: 'utf8',
    timeout: opciones.timeout,
  });
  if (resultado.error) throw resultado.error;
  return resultado;
}

function rclone(argumentos) {
  return correr('rclone', argumentos);
}

function coincide(patron, nombre) {
  const escapado = patron.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escapado}$`).test(nombre);
}

function excluido(relativa) {
  return relativa.split(path.sep).some((parte) => EXCLUSIONES.some((p) => coincide(p, parte)));
}

function pesoDe(dir) {
  let total = 0;
  const pendientes = [dir];
  while (pendientes.length > 0) {
    const actual = pendientes.pop();
    for (const entrada of readdirSync(actual, { withFileTypes: true })) {
      const ruta = path.join(actual, entrada.name);
      if (excluido(path.relative(dir, ruta))) continue;
      if (entrada.isDirectory()) pendientes.push(ruta);
      else if (entrada.isFile()) total += statSync(ruta).size;
    }
  }
  return total;
}

function comprobarEntorno() {
  try {
    if (correr('rclone', ['version'], { capturar: true, timeout: 15000 }).status !== 0) throw new Error('sin rclone');
  } catch {
    console.error('  Falta rclone. Instalarlo con: sudo apt install rclone');
    return false;
  }
  return true;
}

function banderasDe() {
  return [
    '--transfers=1',
    '--checkers=4',
    '--drive-chunk-size=16M',
    '--contimeout=15s',
    '--timeout=120s',
    '--retries=10',
    '--low-level-retries=20',
    '--drive-pacer-min-sleep=2s',
    '--stats=30s',
    '--stats-one-line',
    '--stats-log-level=NOTICE',
  ];
}

function tamanoRemoto(destino) {
  const consulta = correr('rclone', ['lsjson', '--stat', destino], { capturar: true, timeout: 60000 });
  if (consulta.status !== 0) return -1;
  try {
    return JSON.parse(consulta.stdout).Size;
  } catch {
    return -1;
  }
}

function crearTar(archivo, base, nombres) {
  mkdirSync(path.dirname(archivo), { recursive: true });
  rmSync(archivo, { force: true });
  const temporal = `${archivo}.tar`;
  const excluir = EXCLUSIONES.flatMap((patron) => ['--exclude', patron]);
  const empaquetado = correr('tar', ['-C', base, '-cf', temporal, ...excluir, ...nombres]);
  if (empaquetado.status !== 0) {
    throw new Error(`tar fallo para ${archivo}`);
  }
  const comprimido = correr('zstd', ['-1', '-T0', '-q', '--rm', temporal, '-o', archivo]);
  if (comprimido.status !== 0) {
    throw new Error(`zstd fallo para ${archivo}`);
  }
}

function prepararDatos() {
  const dir = path.join(TRABAJO, 'datos');
  mkdirSync(dir, { recursive: true });

  if (existsSync(SQLITE)) {
    const copia = path.join(dir, 'revision-pagos.sqlite3');
    const respaldo = (() => {
      try {
        return correr('sqlite3', [SQLITE, `.backup '${copia}'`], { capturar: true });
      } catch {
        return { status: 1 };
      }
    })();
    if (respaldo.status !== 0) copyFileSync(SQLITE, copia);
  }
  if (existsSync(ODS)) copyFileSync(ODS, path.join(dir, path.basename(ODS)));

  const escritorio = path.join(dir, 'escritorio');
  mkdirSync(escritorio, { recursive: true });
  for (const nombre of LANZADORES) {
    const origen = path.join(CASA, 'Escritorio', nombre);
    if (existsSync(origen)) copyFileSync(origen, path.join(escritorio, nombre));
  }
  return dir;
}

function planificarArbol(raiz) {
  const piezas = [];
  const recorrer = (dir) => {
    const entradas = readdirSync(dir, { withFileTypes: true });
    const peso = pesoDe(dir);
    if (peso <= LIMITE_TAR) {
      piezas.push({ tipo: 'dir', dir, peso });
      return;
    }
    const subdirs = entradas.filter((e) => e.isDirectory() && !EXCLUSIONES.some((p) => coincide(p, e.name)));
    const archivos = entradas.filter((e) => e.isFile());
    if (subdirs.length === 0) {
      piezas.push({ tipo: 'dir', dir, peso });
      return;
    }
    if (archivos.length > 0) {
      const pesoArchivos = archivos.reduce((suma, e) => suma + statSync(path.join(dir, e.name)).size, 0);
      piezas.push({ tipo: 'archivos', dir, nombres: archivos.map((e) => e.name), peso: pesoArchivos });
    }
    for (const subdir of subdirs) recorrer(path.join(dir, subdir.name));
  };
  recorrer(raiz);
  return piezas;
}

function subirTar(archivo, destino) {
  const bytes = statSync(archivo).size;
  if (tamanoRemoto(destino) === bytes) {
    console.log(`    ${(bytes / 1024 ** 2).toFixed(1)} MiB, ya estaba en Drive, se saltea`);
    rmSync(archivo, { force: true });
    return true;
  }
  console.log(`    ${(bytes / 1024 ** 2).toFixed(1)} MiB -> ${destino}`);
  const subida = rclone(['copyto', archivo, destino, ...banderasDe()]);
  rmSync(archivo, { force: true });
  return subida.status === 0;
}

function respaldarConocimiento() {
  console.log('\n  Conocimiento y apps');
  let fallaron = 0;
  const tars = path.join(TRABAJO, 'tars');

  for (const pieza of CONOCIMIENTO) {
    if (!existsSync(pieza.origen)) {
      console.log(`    ${pieza.nombre}: no esta en esta maquina, se saltea`);
      continue;
    }
    console.log(`\n  ${pieza.nombre}`);
    console.log(`    ${pieza.origen}`);
    const archivo = path.join(tars, `${pieza.nombre}.tar.zst`);
    if (listar) {
      console.log(`    ${(pesoDe(pieza.origen) / 1024 ** 2).toFixed(1)} MiB -> ${REMOTO}/conocimiento/${pieza.nombre}.tar.zst`);
      continue;
    }
    try {
      crearTar(archivo, path.dirname(pieza.origen), [path.basename(pieza.origen)]);
      if (!subirTar(archivo, `${REMOTO}/conocimiento/${pieza.nombre}.tar.zst`)) fallaron++;
    } catch (error) {
      console.error(`    ${error.message}`);
      fallaron++;
    }
  }

  // Datos de las apps y lanzadores, en un solo paquete.
  if (existsSync(SQLITE) || existsSync(ODS)) {
    console.log('\n  datos de las apps');
    const dir = listar ? null : prepararDatos();
    if (listar) {
      console.log(`    -> ${REMOTO}/apps/datos.tar.zst`);
    } else {
      const archivo = path.join(tars, 'datos.tar.zst');
      try {
        crearTar(archivo, TRABAJO, ['datos']);
        if (!subirTar(archivo, `${REMOTO}/apps/datos.tar.zst`)) fallaron++;
      } catch (error) {
        console.error(`    ${error.message}`);
        fallaron++;
      }
    }
  }

  // Skills y agentes: se restauran en el home.
  const entorno = [SKILLS, AGENTES].filter((ruta) => existsSync(ruta));
  if (entorno.length > 0) {
    console.log('\n  entorno de los agentes');
    if (listar) {
      console.log(`    -> ${REMOTO}/conocimiento/entorno.tar.zst`);
    } else {
      const archivo = path.join(tars, 'entorno.tar.zst');
      try {
        crearTar(archivo, CASA, entorno.map((ruta) => path.relative(CASA, ruta)));
        if (!subirTar(archivo, `${REMOTO}/conocimiento/entorno.tar.zst`)) fallaron++;
      } catch (error) {
        console.error(`    ${error.message}`);
        fallaron++;
      }
    }
  }

  return fallaron;
}

function respaldarContenidos() {
  console.log('\n  Contenidos');
  const raiz = path.join(RAIZ, 'contenidos');
  if (!existsSync(raiz)) {
    console.log('    no esta en esta maquina, se saltea');
    return 0;
  }
  const piezas = planificarArbol(raiz);
  let fallaron = 0;
  for (const pieza of piezas) {
    const relativa = path.relative(raiz, pieza.dir);
    const destino = pieza.tipo === 'archivos'
      ? `${REMOTO}/contenidos/${relativa ? `${relativa}/` : ''}_sueltos.tar.zst`
      : `${REMOTO}/contenidos/${relativa}.tar.zst`;
    const etiqueta = relativa || '.';
    console.log(`\n  ${etiqueta} (${(pieza.peso / 1024 ** 2).toFixed(1)} MiB)`);
    if (listar) {
      console.log(`    -> ${destino}`);
      continue;
    }
    const archivo = path.join(TRABAJO, 'tars', `contenidos-${etiqueta.replace(/[^a-zA-Z0-9]+/g, '-')}.tar.zst`);
    try {
      if (pieza.tipo === 'archivos') {
        crearTar(archivo, pieza.dir, pieza.nombres);
      } else {
        crearTar(archivo, path.dirname(pieza.dir), [path.basename(pieza.dir)]);
      }
      if (!subirTar(archivo, destino)) fallaron++;
    } catch (error) {
      console.error(`    ${error.message}`);
      fallaron++;
    }
  }
  return fallaron;
}

function main() {
  if (ayuda) {
    mostrarAyuda();
    return 0;
  }
  if (!['todo', 'conocimiento', 'contenidos'].includes(solo)) {
    console.error(`  --solo=${solo} no existe. Usar conocimiento o contenidos.`);
    return 1;
  }
  if (!comprobarEntorno()) return 1;

  console.log(`\n  Respaldo a ${REMOTO}${listar ? ' (solo lista, no sube)' : ''}`);
  let fallaron = 0;
  if (solo === 'todo' || solo === 'conocimiento') fallaron += respaldarConocimiento();
  if (solo === 'todo' || solo === 'contenidos') fallaron += respaldarContenidos();

  if (fallaron > 0) {
    console.error(`\n  Termino con ${fallaron} pieza(s) con error.`);
    return 1;
  }
  console.log('\n  Respaldo completo.');
  return 0;
}

process.exitCode = main();
