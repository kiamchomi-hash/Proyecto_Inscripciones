#!/usr/bin/env node
// Consola SQL contra Supabase con el rol acotado `cau_editor`.
//
//   npm run db "select nombre, nivel from carreras where activa order by orden limit 5"
//   npm run db -- --archivo sql/2026-08-28_algo.sql
//
// Existe para no seguir copiando cada UPDATE al SQL Editor del dashboard. No
// usa PostgREST ni la anon key: se conecta al Postgres con la credencial de
// `cau_editor` (sql/2026-08-28_rol_editor_contenido.sql), que
// sólo alcanza las tablas de contenido. Contra `consultas`, `solicitudes_clase`
// o `profesores` la respuesta es "permission denied", no un borrado.
//
// La cadena de conexión va en EDITOR_DATABASE_URL, en .env.local.

import { existsSync, readFileSync } from 'node:fs';
import pg from 'pg';

const cadena = process.env.EDITOR_DATABASE_URL;

if (!cadena) {
  console.error('Falta EDITOR_DATABASE_URL en .env.local.');
  console.error('Forma: postgresql://cau_editor:<clave>@db.<ref>.supabase.co:5432/postgres');
  process.exit(2);
}

// ── Argumentos ──
const args = process.argv.slice(2);

let archivo = null;
let sinRed = false;
const sueltos = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--sin-red') sinRed = true;
  else if (a.startsWith('--archivo=')) archivo = a.slice('--archivo='.length);
  else if (a === '--archivo') archivo = args[++i];
  else sueltos.push(a);
}

const sql = archivo ? readFileSync(archivo, 'utf8') : sueltos.join(' ').trim();

if (!sql) {
  console.error('Falta la consulta. Ej: npm run db "select count(*) from carreras"');
  process.exit(2);
}

// ── La red de seguridad ──
// El accidente que importa no es escribir en la tabla equivocada —para eso
// están los permisos del rol— sino escribir en la tabla correcta sin acotar la
// fila. Un UPDATE sin WHERE toca las 115 carreras y no hay undo.
const sinFiltro = /\b(update|delete)\b(?![\s\S]*\bwhere\b)/i.test(
  sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''),
);

if (sinFiltro && !sinRed) {
  console.error('Frenado: hay un UPDATE o DELETE sin WHERE, que toca la tabla entera.');
  console.error('Si es a propósito, repetirlo con --sin-red.');
  process.exit(2);
}

// ── Conexión ──
// Va al host directo (5432), que Supabase publica sólo por IPv6. Si la máquina
// no tiene IPv6, la alternativa es el pooler en 6543 con el usuario
// `cau_editor.<ref>`: modo transacción, sin prepared statements con nombre
// (que `pg` no usa salvo que se le pidan).
//
// El certificado lo firma la PKI propia de Supabase (`Supabase Root 2021 CA`),
// que Node no trae en su almacén: sin el CA al lado, verificar la cadena falla
// con SELF_SIGNED_CERT_IN_CHAIN. Por eso se pincha el root, que se baja del
// dashboard (Connect > SSL certificate). Sin verificar, la contraseña de
// escritura viaja cifrada pero contra cualquiera que se ponga en el medio.
const CA = new URL('supabase-ca.crt', import.meta.url);
const ca = existsSync(CA) ? readFileSync(CA, 'utf8') : null;

async function conectar() {
  const cliente = new pg.Client({
    connectionString: cadena,
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
  });
  if (!ca) {
    console.error('Aviso: TLS sin verificar. Falta herramientas/supabase-ca.crt');
    console.error('(dashboard > Connect > SSL certificate).');
  }
  await cliente.connect();
  return cliente;
}

let cliente;
try {
  cliente = await conectar();
} catch (error) {
  console.error(`No se pudo conectar: ${error.message}`);
  console.error('Revisar EDITOR_DATABASE_URL. Si el error es de red, puede ser que');
  console.error('esta máquina no tenga IPv6: ahí va el pooler (6543, cau_editor.<ref>).');
  process.exit(1);
}

try {
  const resultado = await cliente.query(sql);
  for (const r of Array.isArray(resultado) ? resultado : [resultado]) {
    if (r.rows?.length) console.table(r.rows);
    else console.log(`${r.command ?? 'OK'}: ${r.rowCount ?? 0} fila(s)`);
  }
} catch (error) {
  // "permission denied for table X" acá no es un bug: es el rol funcionando.
  console.error(`Error: ${error.message}`);
  if (/permission denied/i.test(error.message)) {
    console.error('Esa tabla está fuera del alcance de cau_editor. Va por el SQL Editor.');
  }
  process.exitCode = 1;
} finally {
  await cliente.end();
}
