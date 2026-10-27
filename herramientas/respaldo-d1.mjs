#!/usr/bin/env node
// Respaldo completo de la base de producción (D1) a un archivo privado.
//
//   npm run db:respaldo
//
// Descarga esquema y datos con `wrangler d1 export --remote` y verifica que el
// archivo tenga filas. Se guarda en cloudflare/.local/respaldos, que está fuera
// de git: el respaldo incluye las tablas privadas.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const PROYECTO = path.resolve(new URL('..', import.meta.url).pathname);
const CF = path.join(PROYECTO, 'cloudflare');
const WRANGLER = path.join(CF, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const BASE = process.env.D1_PRODUCCION || 'cau-produccion';
const DIR = path.join(CF, '.local', 'respaldos');

mkdirSync(DIR, { recursive: true, mode: 0o700 });
const sello = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const destino = path.join(DIR, `d1-${sello}.sql`);

execFileSync('node', [WRANGLER, 'd1', 'export', BASE, '--remote', '--output', destino],
  { cwd: CF, stdio: ['ignore', 'pipe', 'inherit'] });

const bytes = statSync(destino).size;
const filas = (readFileSync(destino, 'utf8').match(/INSERT INTO/g) ?? []).length;
if (bytes < 1024 || filas === 0) {
  console.error(`Respaldo sospechoso: ${bytes} bytes, ${filas} INSERT. Revisar antes de confiar en él.`);
  process.exit(1);
}
console.log(JSON.stringify({ archivo: path.relative(PROYECTO, destino), bytes, filas }));
