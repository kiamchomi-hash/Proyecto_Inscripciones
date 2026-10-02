#!/usr/bin/env node
// Lee únicamente metadatos del esquema público mediante la CLI fijada en el lock.
import { spawnSync } from 'node:child_process';
import { renameSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const raiz = new URL('../', import.meta.url);
const destino = new URL('lib/database.types.ts', raiz);
let referencia;
try {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (url.protocol !== 'https:' || !/^[a-z]{20}\.supabase\.co$/.test(url.hostname)) throw new Error();
  referencia = url.hostname.split('.')[0];
} catch {
  console.error('Falta una NEXT_PUBLIC_SUPABASE_URL válida del proyecto remoto. No se modificaron los tipos.');
  process.exit(1);
}

const resultado = spawnSync(process.execPath, [
  fileURLToPath(new URL('node_modules/supabase/dist/supabase.js', raiz)),
  'gen', 'types', 'typescript', '--project-id', referencia, '--schema', 'public',
], { cwd: fileURLToPath(raiz), encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 });

if (resultado.error || resultado.status !== 0) {
  // La salida de la CLI puede contener detalles de autenticación: no se copia.
  console.error('No se pudieron generar los tipos remotos. Revisar el acceso de la CLI (supabase login) y la conexión. No se modificó el archivo.');
  process.exit(1);
}

const fuente = resultado.stdout;
const ast = ts.createSourceFile('database.types.ts', fuente, ts.ScriptTarget.Latest, true);
if (ast.parseDiagnostics.length || !fuente.includes('export type Database =') || !fuente.includes('      consultas: {') || !fuente.includes('      carreras: {')) {
  console.error('La CLI no devolvió el contrato esperado. Se conservó el archivo anterior.');
  process.exit(1);
}

const contenido = '// Generado desde el esquema público real. Regeneración: docs/tipos-supabase.md.\n' + fuente
  .replace('// Allows to automatically instantiate createClient with right options', '// Permite instanciar createClient con las opciones correctas')
  .replace('// instead of createClient<Database,', '// en lugar de createClient<Database,');
const temporal = new URL('lib/database.types.ts.tmp', raiz);
writeFileSync(temporal, contenido);
renameSync(temporal, destino);
console.log('Tipos remotos regenerados. Revisar el diff y ejecutar npm run check antes de confirmarlos.');
