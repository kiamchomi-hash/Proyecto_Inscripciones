#!/usr/bin/env node
// Consulta de sólo lectura contra la base de producción de Cloudflare (D1).
//
//   node herramientas/d1-consulta.mjs "select id, nombre from carreras limit 3"
//
// No expone escrituras: cualquier sentencia que no sea de lectura se rechaza.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const PROYECTO = path.resolve(new URL('..', import.meta.url).pathname);
const WRANGLER = path.join(PROYECTO, 'cloudflare', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const BASE = process.env.D1_PRODUCCION || 'cau-produccion';

const SOLO_LECTURA = /^\s*(?:select|pragma|explain|with)\b/i;

/** Devuelve las filas. Rechaza cualquier sentencia que escriba. */
export function consultar(sql) {
  const limpio = String(sql).replace(/--[^\n]*/g, '').trim();
  if (!SOLO_LECTURA.test(limpio)) {
    throw new TypeError('Sólo lectura: esta herramienta no escribe en la base.');
  }
  const salida = execFileSync(
    'node',
    [WRANGLER, 'd1', 'execute', BASE, '--remote', '--json', '--yes', '--command', sql],
    { cwd: path.join(PROYECTO, 'cloudflare'), encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const bloques = JSON.parse(salida);
  return bloques.flatMap(bloque => bloque.results ?? []);
}

if (process.argv[1] && process.argv[1].endsWith('d1-consulta.mjs')) {
  const sql = process.argv.slice(2).join(' ').trim();
  if (!sql) {
    console.error('Falta la consulta. Ej: node herramientas/d1-consulta.mjs "select count(*) from carreras"');
    process.exit(2);
  }
  for (const fila of consultar(sql)) console.log(JSON.stringify(fila));
}
