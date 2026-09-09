#!/usr/bin/env node
// Contrasta esquema, grants y triggers reales sin escribir datos ni enviar avisos.
import pg from 'pg';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { BASE_PROD } from '../lib/vigilancia-esperado.ts';
import { CAMPOS } from '../components/formularios/casas.ts';

const base = (process.argv.find(a => a.startsWith('--base='))?.slice(7) ?? BASE_PROD).replace(/\/$/, '');
const resultados = [];
async function comprobar(nombre, fn) {
  try { const detalle = await fn(); resultados.push({ nombre, estado: 'ok', detalle }); console.log(`ok: ${nombre}`); }
  catch (e) { const estado = /permission denied|Falta |sin observaciones/i.test(e.message) ? 'no-verificado' : 'fallo'; resultados.push({ nombre, estado, detalle: e.message }); console.log(`${estado}: ${nombre}: ${e.message}`); }
}
await comprobar('panel privado sin sesión', async () => {
  const r = await fetch(base + '/admin', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  assert.ok([302, 303, 307, 308].includes(r.status));
  assert.equal(new URL(r.headers.get('location'), base).pathname, '/admin/login');
});
await comprobar('API administrativa sin sesión', async () => {
  const r = await fetch(base + '/api/admin/profesores', { signal: AbortSignal.timeout(15000) });
  assert.equal(r.status, 401);
});
let cliente;
await comprobar('conexión de auditoría a la base', async () => {
  assert.ok(process.env.EDITOR_DATABASE_URL, 'Falta EDITOR_DATABASE_URL');
  cliente = new pg.Client({ connectionString: process.env.EDITOR_DATABASE_URL,
    ssl: { ca: await readFile(new URL('supabase-ca.crt', import.meta.url), 'utf8'), rejectUnauthorized: true }, connectionTimeoutMillis: 15000, statement_timeout: 15000 });
  await cliente.connect();
  await cliente.query('BEGIN READ ONLY');
});
if (resultados.at(-1).estado === 'ok') {
  await comprobar('columnas reales de los formularios', async () => {
    const { rows } = await cliente.query("SELECT attname FROM pg_attribute WHERE attrelid = 'public.consultas'::regclass AND attnum > 0 AND NOT attisdropped");
    const columnas = new Set(rows.map(r => r.attname));
    // columnaDe es el mismo contrato que consume el endpoint.
    for (const campo of Object.values(CAMPOS)) assert.ok(columnas.has(campo.columna), `Falta columna ${campo.columna}`);
  });
  await comprobar('RLS y prohibición de escrituras públicas', async () => {
    for (const tabla of ['consultas', 'faq_preguntas', 'solicitudes_clase']) {
      const { rows: [r] } = await cliente.query("SELECT relrowsecurity AS rls, has_table_privilege('anon', oid, 'INSERT') AS anon_insert, has_table_privilege('authenticated', oid, 'INSERT') AS auth_insert FROM pg_class WHERE oid = $1::regclass", ['public.' + tabla]);
      assert.ok(r?.rls, `${tabla}: RLS apagado`); assert.equal(r.anon_insert, false, `${tabla}: anon escribe`); assert.equal(r.auth_insert, false, `${tabla}: authenticated escribe`);
    }
  });
  await comprobar('triggers existentes habilitados y sin duplicación', async () => {
    const { rows } = await cliente.query("SELECT t.tgname, t.tgenabled, c.relname AS tabla, p.proname AS funcion FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_proc p ON p.oid=t.tgfoid WHERE NOT t.tgisinternal AND p.proname IN ('notify_edge_function', 'notify_revalidar')");
    const esperados = { consultas: ['notify_edge_function'], solicitudes_clase: ['notify_edge_function'], faq_preguntas: ['notify_edge_function', 'notify_revalidar'], carreras: ['notify_revalidar'], novedades: ['notify_revalidar'], materias: ['notify_revalidar'] };
    for (const [tabla, funciones] of Object.entries(esperados)) for (const funcion of funciones) {
      const encontrados = rows.filter(r => r.tabla === tabla && r.funcion === funcion);
      assert.equal(encontrados.length, 1, `${tabla}: cantidad de ${funcion}`);
      assert.ok(['O', 'A'].includes(encontrados[0].tgenabled), `${tabla}: trigger deshabilitado`);
    }
    return { cantidad: rows.length };
  });
  // SAVEPOINT permite continuar aun cuando el rol acotado no puede leer pg_net.
  await cliente.query('SAVEPOINT avisos');
  await comprobar('respuestas recientes de integraciones (últimas 24 h)', async () => {
    const { rows } = await cliente.query("SELECT status_code, timed_out, count(*)::int AS cantidad FROM net._http_response WHERE created > now() - interval '24 hours' GROUP BY status_code, timed_out");
    if (!rows.length) throw new Error('sin observaciones recientes; no confirma entrega real');
    assert.ok(rows.every(r => r.status_code >= 200 && r.status_code < 300 && !r.timed_out), JSON.stringify(rows));
    return rows;
  });
  await cliente.query('ROLLBACK TO SAVEPOINT avisos');
}
if (cliente) { await cliente.query('ROLLBACK').catch(() => {}); await cliente.end(); }
await mkdir('.agents/reports', { recursive: true });
await writeFile('.agents/reports/integraciones.json', JSON.stringify({ fecha: new Date().toISOString(), base, resultados,
  limites: ['No crea usuarios ni envía formularios reales.', 'Los grants y triggers no certifican la entrega a Telegram.', 'Las sesiones de profesor y administrador requieren cuentas de prueba autorizadas.'] }, null, 2));
process.exitCode = resultados.some(r => r.estado === 'fallo') ? 1 : resultados.some(r => r.estado === 'no-verificado') ? 2 : 0;
