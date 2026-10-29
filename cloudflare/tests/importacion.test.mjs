import test from 'node:test';
import assert from 'node:assert/strict';
import { validarSnapshot, importarPublico as importarConGuardas, verificarPublico, resumenTablas } from '../scripts/importar-datos.mjs';
import { crearD1 } from './helpers/d1.mjs';
import { CONTRATO } from '../scripts/datos-publicos.mjs';
import { readFileSync } from 'node:fs';
import { lectorPublico, urlsSitemap } from '../scripts/exportar-datos.mjs';
import { extraerDatosPublicos } from '../scripts/copia-datos-publicos.mjs';
import { aislarRed, referenciasImagenes } from '../scripts/verificar-datos.mjs';
import { spawnSync } from 'node:child_process';

let red;
const importarPublico = (db, s) => importarConGuardas(db, s, {
  escribir: true, destino: { etapa: 'local', remoto: false, nombre: 'cau-d1-fixture' },
});
test.before(()=>{ red = aislarRed(); });
test.after(()=>{ red.restaurar(); });

const snapshot = () => ({ version: 1, tablas: { carreras: [], materias: [], novedades: [], faq_preguntas: [] } });
const carrera = (id = 1) => ({ ...Object.fromEntries(CONTRATO.carreras.columnas.map(c => [c,null])),
  id,nombre:'Carrera de prueba',nivel:'Pregrado',modalidad:'A distancia',
  activa:true,destacada:false,nueva:false,proximamente:false,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-02T00:00:00Z' });

test('snapshot público rechaza tablas privadas, columnas ajenas y versiones desconocidas', () => {
  for (const cambiar of [s => { s.tablas.consultas = []; }, s => { s.version = 2; },
    s => { s.tablas.carreras = [{ id: 1, email: 'no-exportar@example.invalid' }]; },
    s => { s.tablas.materias = [{ id: '../../otra-base' }]; }]) {
    const s = snapshot(); cambiar(s); assert.throws(() => validarSnapshot(s));
  }
});

test('D1 nuevo: importación vacía, repetición idéntica y tablas privadas vacías', async t => {
  const { db } = await crearD1(t);
  const s = snapshot();
  await importarPublico(db, s);
  await importarPublico(db, s);
  const r = await verificarPublico(db, s);
  assert.ok(Object.values(r.privadas).every(n => n === 0));
  assert.deepEqual(r.tablas, resumenTablas(s.tablas));
  assert.deepEqual(r.fk, []);
});

test('la exportación lee de D1 sólo las tablas públicas del contrato', async t => {
  const { db } = await crearD1(t);
  const s = snapshot(); s.tablas.carreras = [carrera(42)];
  await importarPublico(db, s);
  assert.deepEqual(await extraerDatosPublicos(db), s);
});

test('rechaza un destino con datos privados y no los altera', async t => {
  const { db } = await crearD1(t);
  await db.prepare("INSERT INTO form_rate_limits (key, request_count, window_started_at) VALUES ('fixture', 1, '2026-10-25T00:00:00.000Z')").run();
  await assert.rejects(importarPublico(db, snapshot()));
  assert.equal(await db.prepare('SELECT count(*) AS n FROM form_rate_limits').first('n'), 1);
});

test('IDs y campos públicos conservados, repetición idéntica y rechazo sin sobrescribir', async t => {
  const { db } = await crearD1(t);
  const s = snapshot(); s.tablas.carreras = [carrera(42)];
  await importarPublico(db,s); await verificarPublico(db,s);
  assert.equal((await importarPublico(db,s)).repeticion,true);
  const distinto = structuredClone(s); distinto.tablas.carreras[0].nombre = 'Otro';
  await assert.rejects(importarPublico(db,distinto));
  await verificarPublico(db,s);
});

test('FAQ pública no traslada contactos ni inventa filas históricas', async t => {
  const { db } = await crearD1(t); const s = snapshot();
  s.tablas.faq_preguntas = [{id:7,titulo:'Pregunta sintética',descripcion:null,respuesta:'Respuesta sintética',
    created_at:'2026-10-01T00:00:00.000Z',updated_at:'2026-10-02T00:00:00.000Z',estado:'aprobada',destacada:true,orden:1,modo:'publica'}];
  await importarPublico(db,s); await verificarPublico(db,s);
  assert.equal(await db.prepare('SELECT contacto FROM faq_preguntas WHERE id=7').first('contacto'),'');
  const privada = structuredClone(s); privada.tablas.faq_preguntas[0].modo = 'privada';
  assert.throws(()=>validarSnapshot(privada));
});

test('batch fallido no deja tablas públicas parcialmente importadas', async t => {
  const { db } = await crearD1(t); const s = snapshot();
  s.tablas.carreras = [carrera(42)];
  // Tipo válido para el snapshot pero NOT NULL del destino rechaza nombre.
  s.tablas.carreras.push({...carrera(43),nombre:null});
  await assert.rejects(importarPublico(db,s));
  assert.equal(await db.prepare('SELECT count(*) AS n FROM carreras').first('n'),0);
});

test('las excepciones SEO de Cloud Administration y Gestión Hotelera conservan su texto', () => {
  // Antes se comparaban contra el port de Next; ese sitio ya no existe, así que
  // se fijan los valores para que un cambio accidental siga fallando acá.
  const fuente = readFileSync(new URL('../src/entrega/carrera-seo.ts', import.meta.url), 'utf8');
  const esperados = [
    "Técnico Superior en Cloud Administration online | Teclab",
    "Tecnicatura Superior en Gestión Hotelera | Teclab · Siglo 21",
  ];
  for (const titulo of esperados) assert.ok(fuente.includes(`title: '${titulo}'`), titulo);
});

test('GET público no sigue redirects, no pasa claves al sitio y rechaza rutas/credenciales privadas', async () => {
  const llamadas = [];
  const leer = lectorPublico(async (u,opts)=>{ llamadas.push({url:u.href,...opts}); return new Response('',{status:302,headers:{location:'https://no-autorizado.invalid'}}); });
  await leer('https://www.siglo21sur.com/');
  assert.equal(llamadas[0].headers,undefined);
  assert.equal(llamadas[0].method,'GET');assert.equal(llamadas[0].redirect,'manual');
  await assert.rejects(leer('https://no-autorizado.invalid/'));
  await assert.rejects(leer('https://www.siglo21sur.com/api/newsletter'));
  assert.throws(()=>urlsSitemap('<url><loc>https://www.siglo21sur.com/inscripcion/codigo</loc></url>'));
  assert.deepEqual(referenciasImagenes(['/_next/image?url=%2Fimagenes%2Fa.webp&w=100&q=80']),
    referenciasImagenes(['/imagenes/a.webp?dpl=fixture']));
  await assert.rejects(fetch('https://example.invalid/'));
});

test('el importador no ofrece CLI ni acepta --remote o destinos arbitrarios', () => {
  const r = spawnSync(process.execPath,['--experimental-transform-types','scripts/importar-datos.mjs','--remote'],{encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stderr,/sin CLI arbitraria/);
});
