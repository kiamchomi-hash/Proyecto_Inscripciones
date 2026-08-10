#!/usr/bin/env node
// Corre uno de los chequeos automaticos sin ventana ni preguntas, guarda el log
// y deja un aviso en el escritorio SOLO si encontro algo.
//
// La idea es que esto salga gratis: los tres chequeos son programas de Node que
// no llaman a ningun modelo. El agente de Claude Code entra despues, a mano y
// solo cuando hay algo que interpretar.
//
//   node herramientas/vigilancia.mjs deps        (npm audit)
//   node herramientas/vigilancia.mjs smoke       (produccion)
//   node herramientas/vigilancia.mjs contenido   (Supabase)

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { lookup } from 'node:dns/promises';
import path from 'node:path';
import os from 'node:os';

const RAIZ = path.resolve(import.meta.dirname, '..');
const LOGS = path.join(RAIZ, 'herramientas', 'vigilancia-logs');
const ESTADO = path.join(LOGS, 'estado.json');
const AVISO = path.join(resolverEscritorio(), 'REVISAR-SITIO.txt');

// El escritorio no se llama igual en todos lados: en Windows es Desktop y en un
// Linux en espanol, Escritorio. La ruta real la declara XDG en user-dirs.dirs;
// si no hay nada de eso, cae al home, que siempre existe. Un aviso que nadie ve
// es lo mismo que no avisar, asi que esto no puede quedar hardcodeado.
function resolverEscritorio() {
  const home = os.homedir();

  if (process.env.XDG_DESKTOP_DIR) return process.env.XDG_DESKTOP_DIR;

  const config = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  const userDirs = path.join(config, 'user-dirs.dirs');
  if (existsSync(userDirs)) {
    const linea = readFileSync(userDirs, 'utf8').match(/^\s*XDG_DESKTOP_DIR="(.+)"\s*$/m);
    if (linea) {
      const dir = linea[1].replace('$HOME', home);
      if (existsSync(dir)) return dir;
    }
  }

  for (const nombre of ['Desktop', 'Escritorio']) {
    const dir = path.join(home, nombre);
    if (existsSync(dir)) return dir;
  }

  return home;
}

const CHEQUEOS = {
  deps: {
    titulo: 'Dependencias (npm audit)',
    comando: 'npm audit --json',
    agente: 'auditor-dependencias',
    necesitaRed: true,
    interpretar: interpretarAudit,
  },
  smoke: {
    titulo: 'Produccion (smoke)',
    comando: 'npm run smoke',
    agente: 'verificador-produccion',
    necesitaRed: true,
  },
  contenido: {
    titulo: 'Contenido (Supabase)',
    comando: 'npm run auditar',
    agente: 'auditor-contenido',
    necesitaRed: true,
  },
  // Este deja informe siempre, avise o no: las sugerencias de SEO no son fallas
  // y no tienen que encender la alarma del escritorio todas las semanas. Solo
  // sale con codigo 1 ante algo que se rompio (una pagina que se cayo del
  // indice, una caida fuerte de trafico). El informe queda en
  // vigilancia-logs/seo-ultimo.md y lo lee el agente cuando se lo pide.
  seo: {
    titulo: 'SEO (Search Console)',
    comando: 'npm run seo',
    agente: 'estratega-seo',
    necesitaRed: true,
  },
};

const sello = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

const fechaLegible = () => new Date().toLocaleString('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

// npm audit sale con codigo 1 por cualquier vulnerabilidad, asi que el codigo
// solo no distingue "una moderada en una devDependency" de "un RCE en produccion".
// Leemos el JSON para que el aviso diga algo util.
function interpretarAudit(salida) {
  let datos;
  try {
    datos = JSON.parse(salida);
  } catch {
    return { estado: 'indeterminado', resumen: 'npm audit no devolvio JSON (registro sin conexion o error de red).' };
  }
  if (datos.error) {
    return { estado: 'indeterminado', resumen: `npm audit fallo: ${datos.error.summary ?? 'error desconocido'}` };
  }

  const vulnerabilidades = Object.entries(datos.vulnerabilities ?? {});
  if (!vulnerabilidades.length) {
    return { estado: 'ok', resumen: 'Sin vulnerabilidades.' };
  }

  const lineas = vulnerabilidades.map(([nombre, v]) => {
    const titulos = (v.via ?? [])
      .filter((x) => typeof x === 'object')
      .map((x) => x.title)
      .slice(0, 2);
    const detalle = titulos.length ? ` — ${titulos.join(' / ')}` : '';
    return `  - ${nombre} (${v.severity})${detalle}`;
  });

  return {
    estado: 'problema',
    resumen: `${vulnerabilidades.length} paquete(s) con vulnerabilidades:\n${lineas.join('\n')}`,
  };
}

async function hayInternet() {
  // Host neutral a proposito: si preguntamos por el dominio propio, una caida
  // del sitio se confunde con una caida de la conexion.
  try {
    await lookup('github.com');
    return true;
  } catch {
    return false;
  }
}

function leerEstado() {
  if (!existsSync(ESTADO)) return {};
  try {
    return JSON.parse(readFileSync(ESTADO, 'utf8'));
  } catch {
    return {};
  }
}

// El archivo del escritorio se reconstruye entero en cada corrida a partir del
// estado de los tres chequeos: asi desaparece solo cuando ya no queda ninguno
// fallando, sin que haya que acordarse de borrarlo.
function escribirAviso(estado) {
  const fallando = Object.entries(estado).filter(([, v]) => v.estado === 'problema');

  if (!fallando.length) {
    if (existsSync(AVISO)) rmSync(AVISO);
    return;
  }

  const bloques = fallando.map(([clave, v]) => [
    `## ${CHEQUEOS[clave]?.titulo ?? clave}`,
    `Detectado: ${v.fecha}`,
    '',
    v.resumen,
    '',
    `Log completo: ${v.log}`,
    `Para que lo revise Claude Code: abrir el proyecto y pedirle el agente "${CHEQUEOS[clave]?.agente ?? clave}".`,
  ].join('\n'));

  const texto = [
    'REVISAR EL SITIO',
    '='.repeat(60),
    '',
    'Los chequeos automaticos encontraron algo. Este archivo se borra solo',
    'cuando vuelven a dar limpio.',
    '',
    bloques.join('\n\n' + '-'.repeat(60) + '\n\n'),
    '',
  ].join('\n');

  writeFileSync(AVISO, texto, 'utf8');
}

async function main() {
  const clave = process.argv[2];
  const chequeo = CHEQUEOS[clave];

  if (!chequeo) {
    console.error(`Chequeo desconocido: ${clave ?? '(ninguno)'}`);
    console.error(`Opciones: ${Object.keys(CHEQUEOS).join(', ')}`);
    process.exit(2);
  }

  mkdirSync(LOGS, { recursive: true });
  const log = path.join(LOGS, `${sello()}-${clave}.log`);

  if (chequeo.necesitaRed && !(await hayInternet())) {
    // Sin conexion no se puede concluir nada. Salteamos en vez de avisar: si no,
    // cada vez que la maquina arranca fuera de linea aparece una alarma falsa.
    writeFileSync(log, `${fechaLegible()}\nSin conexion a internet. Chequeo salteado.\n`, 'utf8');
    console.log('Sin conexion. Salteado.');
    process.exit(0);
  }

  const resultado = spawnSync(chequeo.comando, {
    cwd: RAIZ,
    shell: true,
    encoding: 'utf8',
    windowsHide: true,
  });

  const salida = `${resultado.stdout ?? ''}${resultado.stderr ?? ''}`;
  const codigo = resultado.status ?? 1;

  let veredicto;
  if (chequeo.interpretar) {
    veredicto = chequeo.interpretar(resultado.stdout ?? '');
  } else if (codigo === 0) {
    veredicto = { estado: 'ok', resumen: 'Todo en orden.' };
  } else {
    const cola = salida.trim().split('\n').slice(-15).join('\n');
    veredicto = { estado: 'problema', resumen: cola || `Salio con codigo ${codigo}.` };
  }

  writeFileSync(log, [
    `${chequeo.titulo} — ${fechaLegible()}`,
    `Comando: ${chequeo.comando}`,
    `Codigo de salida: ${codigo}`,
    `Veredicto: ${veredicto.estado}`,
    '='.repeat(60),
    '',
    salida,
  ].join('\n'), 'utf8');

  const estado = leerEstado();
  estado[clave] = { estado: veredicto.estado, resumen: veredicto.resumen, fecha: fechaLegible(), log };
  writeFileSync(ESTADO, JSON.stringify(estado, null, 2), 'utf8');

  escribirAviso(estado);

  console.log(`${chequeo.titulo}: ${veredicto.estado}`);
  process.exit(veredicto.estado === 'problema' ? 1 : 0);
}

main();
