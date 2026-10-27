#!/usr/bin/env node
// Consulta y escribe en la base de producción de Cloudflare (D1), con la misma
// red de seguridad que `herramientas/db.mjs`:
//
//   npm run db:d1 "select count(*) from carreras"
//   npm run db:d1 -- --escribir "update carreras set activa = 0 where id = 12"
//   npm run db:d1 -- --archivo ruta.sql --escribir
//
// Dos frenos, no uno: un UPDATE o DELETE sin WHERE se rechaza siempre (salvo
// `--sin-red`, igual que en el script de Supabase), y cualquier sentencia que no
// sea de lectura exige `--escribir` explícito. No hay transacciones visibles acá:
// D1 aplica cada `execute` como un lote.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const PROYECTO = path.resolve(new URL('..', import.meta.url).pathname);
const WRANGLER = path.join(PROYECTO, 'cloudflare', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const BASE = process.env.D1_PRODUCCION || 'cau-produccion';

const args = process.argv.slice(2);
let archivo = null;
let sinRed = false;
let escribir = false;
const sueltos = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--sin-red') sinRed = true;
  else if (a === '--escribir') escribir = true;
  else if (a.startsWith('--archivo=')) archivo = a.slice('--archivo='.length);
  else if (a === '--archivo') archivo = args[++i];
  else sueltos.push(a);
}

const sql = archivo ? readFileSync(archivo, 'utf8') : sueltos.join(' ').trim();

if (!sql) {
  console.error('Falta la consulta. Ej: npm run db:d1 "select count(*) from carreras"');
  process.exit(2);
}

const sinComentarios = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

// Un UPDATE o DELETE sin WHERE toca la tabla entera y no hay undo.
if (/\b(update|delete)\b(?![\s\S]*\bwhere\b)/i.test(sinComentarios) && !sinRed) {
  console.error('Frenado: hay un UPDATE o DELETE sin WHERE, que toca la tabla entera.');
  console.error('Si es a propósito, repetirlo con --sin-red.');
  process.exit(2);
}

// Lectura sin ceremonia; escritura, siempre declarada.
const soloLectura = /^\s*(?:select|pragma|explain|with)\b/i.test(sinComentarios)
  && !/\b(insert|update|delete|replace|create|drop|alter)\b/i.test(sinComentarios);
if (!soloLectura && !escribir) {
  console.error('Frenado: la sentencia escribe. Repetir con --escribir.');
  process.exit(2);
}

if (!existsSync(WRANGLER)) {
  console.error('No está Wrangler en cloudflare/node_modules. Correr npm --prefix cloudflare install.');
  process.exit(2);
}

try {
  const salida = execFileSync(
    'node',
    [WRANGLER, 'd1', 'execute', BASE, '--remote', '--json', '--yes',
      ...(archivo ? ['--file', path.resolve(archivo)] : ['--command', sql])],
    { cwd: path.join(PROYECTO, 'cloudflare'), encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const bloques = JSON.parse(salida);
  for (const bloque of bloques) {
    for (const fila of bloque.results ?? []) console.log(JSON.stringify(fila));
    if (bloque.meta) {
      console.error(JSON.stringify({ changes: bloque.meta.changes, rows_read: bloque.meta.rows_read, rows_written: bloque.meta.rows_written }));
    }
  }
} catch (error) {
  const detalle = error.stderr ? String(error.stderr).slice(0, 800) : String(error.message).slice(0, 400);
  console.error(detalle);
  process.exit(1);
}
