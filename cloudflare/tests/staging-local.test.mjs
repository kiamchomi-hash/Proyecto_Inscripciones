import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createTestHarness } from 'wrangler';
import { resolverDb } from '../src/datos/binding.ts';
import { crearEnsayoStaging } from '../staging/worker.ts';
import { importarPublico, verificarPublico } from '../scripts/importar-datos.mjs';
import { ultimoSnapshot } from '../scripts/datos-publicos.mjs';
import { aislarRed } from '../scripts/verificar-datos.mjs';

test('wiring D1 separado exige etapa, etiqueta y nombre exclusivo; producción sólo con nombre exacto', () => {
  const DB = {};
  const entorno = { DB, APP_STAGE: 'staging', DB_STAGE: 'staging', DB_NAME: 'cau-staging-ensayo' };
  assert.equal(resolverDb(entorno), DB);
  assert.equal(resolverDb({ DB, APP_STAGE: 'local', EFECTOS: {} }), DB);
  for (const cambio of [{APP_STAGE:'production'}, {APP_STAGE:undefined}, {DB_STAGE:undefined},
    {DB_STAGE:'local'}, {DB_NAME:undefined}, {DB_NAME:'cau-d1-local'}, {DB_NAME:'cau-staging-production'},
    {DB_NAME:'otra-staging'}, {DB_NAME:'cau-staging-local'}, {DB:undefined}, {EFECTOS:{}}]) {
    assert.equal(resolverDb({...entorno,...cambio}), null, JSON.stringify(cambio));
  }
  assert.equal(resolverDb({ ...entorno, APP_STAGE:'local', EFECTOS:{} }), null);
  assert.equal(resolverDb({DB,APP_STAGE:'local'}), null);

  // Producción: etiqueta y nombre exactos, sin patrones ni alias.
  const produccion = { DB, APP_STAGE: 'produccion', DB_STAGE: 'produccion', DB_NAME: 'cau-produccion' };
  assert.equal(resolverDb(produccion), DB);
  for (const cambio of [{APP_STAGE:'staging'}, {APP_STAGE:'production'}, {APP_STAGE:undefined},
    {DB_STAGE:'staging'}, {DB_STAGE:undefined}, {DB_NAME:undefined}, {DB_NAME:'cau-produccion-2'},
    {DB_NAME:'cau-staging-ensayo'}, {DB_NAME:'cau-d1-local'}, {DB:undefined}]) {
    assert.equal(resolverDb({...produccion,...cambio}), null, JSON.stringify(cambio));
  }
  // Un binding productivo no puede pasar por staging ni al revés.
  assert.equal(resolverDb({...entorno, DB_NAME:'cau-produccion'}), null);
});

test('dry-run valida sin consultar DB; sin permiso o con remoto/producción no hay escrituras', async () => {
  const snapshot = {version:1,tablas:{carreras:[],materias:[],novedades:[],faq_preguntas:[]}};
  let llamadas = 0;
  const db = new Proxy({}, {get(){llamadas++;throw Error('No debe tocar DB');}});
  const destino = { etapa:'staging', remoto:false, nombre:'cau-staging-ensayo' };
  assert.equal((await importarPublico(db,snapshot,{dryRun:true,destino})).dryRun,true);
  for (const opciones of [undefined, {}, {escribir:false,destino}, {escribir:true},
    {dryRun:true,escribir:true,destino}, {escribir:true,destino:{...destino,remoto:true}},
    {dryRun:true,destino:{...destino,remoto:true}}, {escribir:true,destino:{...destino,etapa:'production'}},
    {escribir:true,destino:{...destino,nombre:'cau-staging-production'}}]) {
    await assert.rejects(importarPublico(db,snapshot,opciones));
  }
  assert.equal(llamadas,0);
});

test('ensayo inyectado falla cerrado ante config incompleta, POST, APIs, redirects y errores', async () => {
  const env = { DB:{}, APP_STAGE:'staging', DB_STAGE:'staging', DB_NAME:'cau-staging-ensayo',
    STAGING_ACCESS:'deny-all',OUTBOUND_MODE:'disabled' };
  let llamadas=0;
  const ensayo=crearEnsayoStaging(async()=>{llamadas++;return new Response('no debe verse');});
  for (const [ruta,init,cambio] of [['/',{}, {DB_NAME:undefined}],['/',{method:'POST'},{}],
    ['/api/formularios',{},{}],['/%61pi/formularios',{},{}],['/api%2fformularios',{},{}],
    ['//api/formularios',{},{}],['/API/formularios',{},{}],
    ['/',{}, {OUTBOUND_MODE:'enabled'}],['/',{}, {STAGING_ACCESS:'header'}]]) {
    assert.equal(await (await ensayo.fetch(new Request('https://ensayo.invalid'+ruta,init),{...env,...cambio})).text(),'');
  }
  assert.equal(llamadas,0);
  for (const renderizar of [async()=>Response.redirect('https://example.invalid/'),async()=>{throw Error('driver');}]) {
    const r=await crearEnsayoStaging(renderizar).fetch(new Request('https://ensayo.invalid/'),env);
    assert.equal(r.status,503);assert.equal(await r.text(),'');assert.equal(r.headers.get('location'),null);
  }
  await assert.rejects(ensayo.queue());await assert.rejects(ensayo.scheduled());
});

test('staging workerd renderiza snapshot público en D1 efímero propio, siempre 503/noindex/no-store', async () => {
  const red=aislarRed(); let server;
  try {
    await assert.rejects(fetch('https://egress-prohibido.invalid/'));red.bloqueados.length=0;
    const {snapshot}=ultimoSnapshot();
    const nombre=`cau-staging-ensayo-${randomUUID()}`;
    const config={name:nombre,main:resolve('tests/fixtures/worker-staging.ts'),
      compatibility_date:'2026-10-24',compatibility_flags:['nodejs_compat'],
      dev:{ip:'127.0.0.1',port:0},triggers:{crons:[]},
      vars:{APP_STAGE:'staging',DB_STAGE:'staging',DB_NAME:nombre,STAGING_ACCESS:'deny-all',OUTBOUND_MODE:'disabled'},
      d1_databases:[{binding:'DB',database_name:nombre,database_id:randomUUID(),migrations_dir:resolve('migrations'),remote:false}],
    };
    assert.ok(!config.queues && !config.assets && !config.services && !config.persist_to);
    server=createTestHarness({workers:[{config}]});
    const {url}=await server.listen();assert.equal(url.hostname,'127.0.0.1');
    const worker=server.getWorker();await worker.applyD1Migrations('DB');
    const {DB,EFECTOS}=await worker.getEnv();assert.equal(EFECTOS,undefined);
    await importarPublico(DB,snapshot,{escribir:true,destino:{etapa:'staging',remoto:false,nombre}});
    const antes=await verificarPublico(DB,snapshot);
    assert.deepEqual(Object.values(antes.tablas).map(t=>t.filas),[93,7,12,0]);
    for (const [ruta,patron] of [['/',/Licenciatura en Administración/],['/teclab',/Teclab/],
      ['/carreras/licenciatura-en-administracion',/Administración/],['/clases-apoyo',/apoyo/i],
      ['/novedades/1',/novedades/i],['/sonda-binding',/carreras=93/]]) {
      const r=await server.fetch(ruta,{redirect:'manual'});
      assert.equal(r.status,503,ruta);assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');
      assert.equal(r.headers.get('cache-control'),'no-store');
      assert.equal(r.headers.get('content-security-policy'),"default-src 'none'; frame-ancestors 'none'");
      assert.match(await r.text(),patron,ruta);
    }
    for(const ruta of ['/api/formularios','/sitemap.xml','/robots.txt','/icon.png']) {
      const r=await server.fetch(ruta,{redirect:'manual'});assert.equal(r.status,503);assert.equal(await r.text(),'');
    }
    assert.equal(red.bloqueados.length,0,'el renderizado no intenta egreso');
    assert.equal(await (await server.fetch('/sonda-egress')).text(),'');
    assert.deepEqual(red.bloqueados,['egress-prohibido.invalid'],'workerd también pasa por el bloqueo');
    assert.deepEqual(await verificarPublico(DB,snapshot),antes,'sin históricos ni efectos por renderizar');
    console.log(JSON.stringify({destino:nombre,efimero:true,tablas:[93,7,12,0],rutasRenderizadas:6,estado:503,cron:[],colas:false,egreso:'bloqueado'}));
  } finally { try { await server?.close(); } finally { red.restaurar(); } }
});
