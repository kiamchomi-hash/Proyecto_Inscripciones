#!/usr/bin/env node
// Respaldo completo de la base de producción (D1) a un archivo privado.
//
//   npm run db:respaldo
//
// Descarga esquema y datos con `wrangler d1 export --remote` y verifica que el
// archivo tenga filas. Se guarda en cloudflare/.local/respaldos, que está fuera
// de git: el respaldo incluye las tablas privadas.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const PROYECTO = path.resolve(new URL('..', import.meta.url).pathname);
const CF = path.join(PROYECTO, 'cloudflare');
const WRANGLER = path.join(CF, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const BASE = process.env.D1_PRODUCCION || 'cau-produccion';
const DIR = path.join(CF, '.local', 'respaldos');
// Con el timer diario son 30 corridas; a ~600 KB cada una, ~18 MB en disco.
const DIAS_DE_HISTORIA = 30;

mkdirSync(DIR, { recursive: true, mode: 0o700 });
const sello = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const destino = path.join(DIR, `d1-${sello}.sql`);

execFileSync(process.execPath, [WRANGLER, 'd1', 'export', BASE, '--remote', '--output', destino],
  { cwd: CF, stdio: ['ignore', 'pipe', 'inherit'] });

const bytes = statSync(destino).size;
const filas = (readFileSync(destino, 'utf8').match(/INSERT INTO/g) ?? []).length;
if (bytes < 1024 || filas === 0) {
  console.error(`Respaldo sospechoso: ${bytes} bytes, ${filas} INSERT. Revisar antes de confiar en él.`);
  process.exit(1);
}
console.log(JSON.stringify({ archivo: path.relative(PROYECTO, destino), bytes, filas }));

// Poda: sólo los d1-*.sql de este directorio, y nunca el que se acaba de escribir.
// Sin esto el timer diario llenaría el disco en silencio.
const limite = Date.now() - DIAS_DE_HISTORIA * 24 * 60 * 60 * 1000;
const borrados = readdirSync(DIR)
  .filter((nombre) => /^d1-\d{8}T\d{6}Z\.sql$/.test(nombre))
  .filter((nombre) => {
    const completo = path.join(DIR, nombre);
    return completo !== destino && statSync(completo).mtimeMs < limite;
  });
for (const nombre of borrados) unlinkSync(path.join(DIR, nombre));
if (borrados.length > 0) console.error(`Respaldos borrados por antigüedad (${DIAS_DE_HISTORIA} días): ${borrados.length}`);
