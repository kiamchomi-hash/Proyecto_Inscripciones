#!/usr/bin/env node
// Copia las skills de dominio del CAU a ~/.codex/skills, para que Codex tenga
// las mismas que Claude Code. Las de .claude/skills viajan por git; las de
// Codex viven fuera del repo, asi que hay que reponerlas despues de cada
// cambio y en cada maquina nueva.
//
//   node herramientas/sincronizar-skills.mjs [--listar]
//
// La carpeta destino se llama como el `name` del frontmatter, no como la
// carpeta de origen: Codex espera que coincidan.

import { readFileSync, readdirSync, mkdirSync, copyFileSync, rmSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Las de dominio nada mas. Las generales (next-best-practices, copywriting y
// companía) las trae Codex por su lado o no le hacen falta.
const SKILLS = [
  'bot_respuestas',
  'cargar_carrera',
  'cau_brand',
  'cau_design_patterns',
  'piezas-para-el-publico',
];

const RAIZ = path.resolve(import.meta.dirname, '..');
const ORIGEN = path.join(RAIZ, '.claude', 'skills');
const DESTINO = path.join(os.homedir(), '.codex', 'skills');
const SOLO_LISTAR = process.argv.includes('--listar');

// fs.cpSync recursivo revienta el proceso en Node 24 sobre Windows cuando la
// ruta tiene un caracter no ASCII, y la de este proyecto tiene un acento.
function copiar(origen, destino) {
  mkdirSync(destino, { recursive: true });
  for (const entrada of readdirSync(origen)) {
    const desde = path.join(origen, entrada);
    const hasta = path.join(destino, entrada);
    if (statSync(desde).isDirectory()) copiar(desde, hasta);
    else copyFileSync(desde, hasta);
  }
}

function nombreDeclarado(skill) {
  const archivo = path.join(ORIGEN, skill, 'SKILL.md');
  if (!existsSync(archivo)) return { error: 'no tiene SKILL.md' };
  const texto = readFileSync(archivo, 'utf8');
  if (!texto.startsWith('---')) return { error: 'no tiene frontmatter' };
  const frontmatter = texto.slice(3, texto.indexOf('\n---', 3));
  const nombre = frontmatter.match(/^name:\s*(.+)$/m)?.[1].trim();
  const descripcion = frontmatter.match(/^description:\s*(.+)$/m)?.[1].trim();
  if (!nombre) return { error: 'el frontmatter no declara name' };
  if (!descripcion) return { error: 'el frontmatter no declara description' };
  return { nombre };
}

if (!existsSync(DESTINO)) {
  console.error(`No existe ${DESTINO}. Instalar Codex antes de sincronizar.`);
  process.exit(2);
}

let fallas = 0;

for (const skill of SKILLS) {
  const { nombre, error } = nombreDeclarado(skill);
  if (error) {
    console.error(`  ✗ ${skill}: ${error}`);
    fallas++;
    continue;
  }
  if (SOLO_LISTAR) {
    console.log(`  ${skill} -> ${path.join(DESTINO, nombre)}`);
    continue;
  }
  rmSync(path.join(DESTINO, nombre), { recursive: true, force: true });
  copiar(path.join(ORIGEN, skill), path.join(DESTINO, nombre));
  console.log(`  ✓ ${skill} -> ${nombre}`);
}

if (fallas) {
  console.error(`\n${fallas} skill(s) sin sincronizar.`);
  process.exit(1);
}
if (!SOLO_LISTAR) console.log(`\n${SKILLS.length} skills en ${DESTINO}`);
