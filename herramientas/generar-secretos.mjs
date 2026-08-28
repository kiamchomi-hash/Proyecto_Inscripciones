// Genera los valores nuevos para rotar los secretos de webhook y deja el SQL
// de la Fase 2 listo para pegar en el SQL Editor.
//
// Los valores NO se escriben en ningun archivo del repo, que es publico: van al
// terminal, para copiarlos a Vercel y a Edge Functions -> Secrets, y el SQL con
// los valores ya reemplazados va al portapapeles.
//
//   node herramientas/generar-secretos.mjs                  # los dos
//   node herramientas/generar-secretos.mjs --solo=webhook   # uno solo
//   node herramientas/generar-secretos.mjs --sin-portapapeles
//
// El procedimiento completo, y sobre todo el ORDEN en que hay que aplicar cada
// uno, esta en sql/2026-08-28_rotar_secretos.sql. Leerlo antes: rotar en el
// orden equivocado deja avisos de formulario cayendose en silencio.

import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// Mismo largo y mismo alfabeto que los que estan en produccion, para no
// sorprender a nada que los valide por formato.
const SECRETOS = {
  revalidate: { nombre: 'REVALIDATE_SECRET', largo: 32, marcador: '<NUEVO_REVALIDATE_SECRET>' },
  webhook:    { nombre: 'WEBHOOK_SECRET',    largo: 64, marcador: '<NUEVO_WEBHOOK_SECRET>' },
};

// base64url sobre bytes crudos: 4 caracteres por cada 3 bytes, sin relleno.
function generar(largo) {
  const bytes = Math.ceil((largo * 3) / 4);
  return randomBytes(bytes).toString('base64url').slice(0, largo);
}

function alPortapapeles(texto) {
  const intentos = process.platform === 'win32'
    ? [['powershell', ['-NoProfile', '-Command', '$input | Set-Clipboard']]]
    : [['xclip', ['-selection', 'clipboard']], ['wl-copy', []]];

  for (const [cmd, args] of intentos) {
    const r = spawnSync(cmd, args, { input: texto, encoding: 'utf8' });
    if (!r.error && r.status === 0) return cmd;
  }
  return null;
}

const args = process.argv.slice(2);
const solo = args.find((a) => a.startsWith('--solo='))?.split('=')[1];
const sinPortapapeles = args.includes('--sin-portapapeles');

const claves = solo ? [solo] : Object.keys(SECRETOS);
const desconocida = claves.find((c) => !SECRETOS[c]);
if (desconocida) {
  console.error(`--solo= no reconoce "${desconocida}". Opciones: ${Object.keys(SECRETOS).join(', ')}`);
  process.exit(1);
}

let sql = readFileSync(join(RAIZ, 'sql', '2026-08-28_rotar_secretos.sql'), 'utf8');

console.log('');
console.log('Valores nuevos. Copiar cada uno a su dashboard ANTES de correr el SQL:');
console.log('');

for (const clave of claves) {
  const { nombre, largo, marcador } = SECRETOS[clave];
  const valor = generar(largo);
  sql = sql.replaceAll(marcador, valor);

  const destino = clave === 'revalidate'
    ? 'Vercel -> Settings -> Environment Variables (y despues REDEPLOY)'
    : 'npx supabase secrets set, o Dashboard -> Edge Functions -> Secrets';

  console.log(`  ${nombre}  (${largo} caracteres)`);
  console.log(`  ${valor}`);
  console.log(`  va a: ${destino}`);
  console.log('');
}

if (claves.length < Object.keys(SECRETOS).length) {
  console.log('Ojo: el SQL conserva el marcador del secreto que no se genero.');
  console.log('');
}

if (sinPortapapeles) {
  console.log('--- SQL de la Fase 2, con los valores ya puestos ---');
  console.log(sql);
} else {
  const via = alPortapapeles(sql);
  if (via) {
    console.log(`SQL de la Fase 2 en el portapapeles (via ${via}), listo para el SQL Editor.`);
  } else {
    console.log('No se pudo escribir el portapapeles. Volver a correr con --sin-portapapeles.');
    process.exit(1);
  }
}

console.log('');
console.log('El orden de aplicacion esta en sql/2026-08-28_rotar_secretos.sql.');
console.log('Rotar en el orden equivocado deja avisos de formulario cayendose en silencio.');
