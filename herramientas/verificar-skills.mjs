#!/usr/bin/env node
// Revisa las skills del repo (.claude/skills) contra las reglas que evitan que se
// degraden solas: frontmatter completo, tamano manejable, sin rutas absolutas,
// referencias locales que existan y enlaces de .agents/skills que no queden rotos.
//
//   npm run skills
//
// Sale con codigo 1 si encontro un problema; los avisos no cambian el codigo.
// Solo mira lo versionado: las skills globales (~/.claude/skills, las que traen
// plugins o MCP) no viajan con el repo y no se revisan aca.

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ORIGEN = path.join(RAIZ, '.claude', 'skills');
const ENLACES = path.join(RAIZ, '.agents', 'skills');

// El articulo de Uber dice que el cuerpo se mantiene bajo 500 lineas: mas que
// eso se paga en cada invocacion y suele ser material que deberia ir a un anexo.
if (!existsSync(ORIGEN)) {
  console.error('No existe .claude/skills: revisar la ruta.');
  process.exit(2);
}

const LINEAS_AVISO = 500;
const LINEAS_ERROR = 600;

// Una descripcion demasiado corta no alcanza para que el agente decida cuando
// aplica la skill; demasiado larga es cuerpo disfrazado de descripcion.
const DESCRIPCION_MINIMA = 60;
const DESCRIPCION_MAXIMA = 1200;

const problemas = [];
const avisos = [];
const sinRecuperacion = [];

const problema = (grupo, detalle) => problemas.push({ grupo, detalle });
const aviso = (grupo, detalle) => avisos.push({ grupo, detalle });

const leer = (archivo) => readFileSync(archivo, 'utf8');

// ── Frontmatter ─────────────────────────────────────────────────────────────

// El frontmatter es el bloque entre las dos primeras lineas de "---". Se parsea
// a mano: no hace falta un YAML completo y asi la herramienta no suma deps.
function frontmatter(texto) {
  const lineas = texto.split(/\r?\n/);
  if (lineas[0]?.trim() !== '---') return null;
  const fin = lineas.findIndex((linea, i) => i > 0 && linea.trim() === '---');
  if (fin === -1) return null;

  const campos = {};
  let clave = null;
  for (const linea of lineas.slice(1, fin)) {
    const conValor = linea.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (conValor) {
      clave = conValor[1];
      campos[clave] = conValor[2].trim();
    } else if (clave && /^\s+\S/.test(linea)) {
      // Continuacion de un valor multilinea.
      campos[clave] = `${campos[clave]} ${linea.trim()}`.trim();
    }
  }
  return { campos, fin };
}

// Un valor YAML puede venir entre comillas o con el marcador de bloque (`|` o
// `>`), que no es parte del texto.
const sinComillas = (valor) => (valor ?? '')
  .replace(/^[|>][-+]?\s*/, '')
  .replace(/^["']|["']$/g, '')
  .trim();

// La carpeta y el `name` pueden diferir en guiones y guiones bajos: Codex y
// Claude nombran distinto el mismo archivo, y herramientas/sincronizar-skills.mjs
// convive con esa diferencia a proposito.
const normalizar = (valor) => valor.replace(/_/g, '-').toLowerCase();

// ── Referencias locales ─────────────────────────────────────────────────────

// Solo los enlaces relativos a archivos de la propia skill. Las URLs y las
// anclas no se pueden verificar; las rutas con "~" o absolutas se revisan aparte.
function referenciasLocales(texto) {
  const salida = new Set();
  for (const coincidencia of texto.matchAll(/\]\(([^)\s]+)\)/g)) {
    const destino = coincidencia[1].split('#')[0].split('?')[0];
    if (!destino) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(destino)) continue; // http:, mailto:, etc.
    if (destino.startsWith('/') || destino.startsWith('~')) continue;
    salida.add(destino);
  }
  return [...salida];
}

// ── Skills del repo ─────────────────────────────────────────────────────────

const carpetas = readdirSync(ORIGEN, { withFileTypes: true })
  .filter((entrada) => entrada.isDirectory())
  .map((entrada) => entrada.name)
  .sort();

if (carpetas.length === 0) {
  console.error('No se encontro ninguna skill en .claude/skills: revisar la ruta.');
  process.exit(2);
}

for (const carpeta of carpetas) {
  const grupo = carpeta;
  const directorio = path.join(ORIGEN, carpeta);
  const archivo = path.join(directorio, 'SKILL.md');

  if (!existsSync(archivo)) {
    problema(grupo, 'falta SKILL.md');
    continue;
  }

  const texto = leer(archivo);
  const lineas = texto.split(/\r?\n/).length;
  const datos = frontmatter(texto);

  if (!datos) {
    problema(grupo, 'SKILL.md no abre con frontmatter entre ---');
  } else {
    const nombre = sinComillas(datos.campos.name);
    const descripcion = sinComillas(datos.campos.description);

    if (!nombre) problema(grupo, 'falta `name` en el frontmatter');
    else if (normalizar(nombre) !== normalizar(carpeta)) {
      problema(grupo, `el \`name\` (${nombre}) no coincide con la carpeta (${carpeta})`);
    }

    if (!descripcion) problema(grupo, 'falta `description` en el frontmatter');
    else if (descripcion.length < DESCRIPCION_MINIMA) {
      problema(grupo, `descripcion demasiado corta (${descripcion.length} caracteres): el agente no puede decidir cuando usarla`);
    } else if (descripcion.length > DESCRIPCION_MAXIMA) {
      aviso(grupo, `descripcion de ${descripcion.length} caracteres: se paga en cada sesion, conviene bajarla`);
    }

    const cuerpo = texto.split(/\r?\n/).slice(datos.fin + 1).join('\n');
    if (!/^#{1,2}\s+\S/m.test(cuerpo)) aviso(grupo, 'el cuerpo no tiene titulos: cuesta leerlo y citarlo');

    // La tabla de fallas y su arreglo es lo que evita que el agente reintente a
    // ciegas cuando algo no cierra. Como casi ninguna la tiene, se cuenta al
    // final en una linea: repetirla por skill tapa los avisos que importan.
    if (!/^#{1,4}.*(error|falla|fallo|problema|recuperac|si algo no|troubleshoot)/im.test(cuerpo)) {
      sinRecuperacion.push(carpeta);
    }
  }

  if (lineas > LINEAS_ERROR) {
    problema(grupo, `SKILL.md de ${lineas} lineas (limite ${LINEAS_ERROR}): mover el detalle a un anexo`);
  } else if (lineas > LINEAS_AVISO) {
    aviso(grupo, `SKILL.md de ${lineas} lineas (recomendado bajo ${LINEAS_AVISO})`);
  }

  // Rutas absolutas: el repo es publico y se trabaja desde una sola maquina,
  // pero una ruta fija rompe la skill en cualquier otra. Las de ~ no cuentan.
  const absolutas = [...texto.matchAll(/(?:\/home\/|\/Users\/|\/root\/|[A-Za-z]:\\)[^\s)\]"']*/g)]
    .map((coincidencia) => coincidencia[0]);
  if (absolutas.length > 0) {
    problema(grupo, `ruta absoluta en SKILL.md: ${[...new Set(absolutas)].slice(0, 3).join(', ')}`);
  }

  // Las referencias a docs del repo son validas (cargar_carrera manda a
  // docs/alta-de-carrera.md). Una que se va del repo o que no existe es un
  // aviso: no rompe nada, pero manda al agente a leer un archivo fantasma.
  for (const referencia of referenciasLocales(texto)) {
    const destino = path.resolve(directorio, referencia);
    if (!destino.startsWith(RAIZ + path.sep)) {
      problema(grupo, `referencia fuera del repo: ${referencia}`);
      continue;
    }
    if (!existsSync(destino)) aviso(grupo, `referencia a un archivo que no existe: ${referencia}`);
  }
}

// ── Enlaces de .agents/skills ───────────────────────────────────────────────

// Los enlaces son lo que hace que Codex vea las mismas skills sin copiarlas.
// Un enlace roto no falla en ningun otro control: se detecta solo aca.
if (existsSync(ENLACES)) {
  for (const entrada of readdirSync(ENLACES, { withFileTypes: true })) {
    const ruta = path.join(ENLACES, entrada.name);
    if (!entrada.isSymbolicLink()) {
      problema(`.agents/${entrada.name}`, 'no es un enlace sino una copia: se va a desincronizar');
      continue;
    }
    if (!existsSync(ruta)) {
      problema(`.agents/${entrada.name}`, 'enlace roto');
      continue;
    }
    let real;
    try {
      real = realpathSync(ruta);
    } catch {
      problema(`.agents/${entrada.name}`, 'enlace roto');
      continue;
    }
    if (!real.startsWith(ORIGEN + path.sep)) {
      problema(`.agents/${entrada.name}`, `apunta fuera de .claude/skills (${path.relative(RAIZ, real)})`);
    } else if (!statSync(real).isDirectory() || !existsSync(path.join(real, 'SKILL.md'))) {
      problema(`.agents/${entrada.name}`, 'apunta a una carpeta sin SKILL.md');
    }
  }
} else {
  aviso('.agents/skills', 'no existe: Codex no ve ninguna skill del repo');
}

// ── Informe ─────────────────────────────────────────────────────────────────

const imprimir = (titulo, lista) => {
  if (lista.length === 0) return;
  console.log(`\n${titulo} (${lista.length})`);
  for (const { grupo, detalle } of lista) console.log(`  ${grupo}: ${detalle}`);
};

console.log(`Skills revisadas: ${carpetas.length} en .claude/skills`);
imprimir('Problemas', problemas);
imprimir('Avisos', avisos);

// Se informa como resumen: es la deuda mas grande y la mas barata de empezar.
if (sinRecuperacion.length > 0) {
  console.log(`\nSin seccion de errores: ${sinRecuperacion.length} de ${carpetas.length} skills (${sinRecuperacion.join(', ')})`);
}

if (problemas.length > 0) {
  console.log(`\n${problemas.length} problema(s).`);
  process.exit(1);
}

console.log(avisos.length > 0 ? '\nSin problemas; quedan avisos.' : '\nTodo en orden.');
process.exit(0);
