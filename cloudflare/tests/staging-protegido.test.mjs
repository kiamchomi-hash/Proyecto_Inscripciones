import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createTestHarness } from 'wrangler';
import { ultimoSnapshot } from '../scripts/datos-publicos.mjs';
import { importarPublico, verificarPublico } from '../scripts/importar-datos.mjs';
import { validarDestinoRemoto, planImportacionRemota, validarPublicacionStaging } from '../scripts/staging-remoto.mjs';
import { aislarRed } from '../scripts/verificar-datos.mjs';
import { registrarAlias } from './helpers/alias.mjs';

// `staging/acceso.ts` arrastra el transporte real, que importa módulos del sitio
// con el alias `@/`. El alias tiene que existir antes de resolver el módulo.
registrarAlias();
const { crearStagingProtegido } = await import('../staging/acceso.ts');

const destino = { autorizado:'staging-publico-protegido', nombre:'cau-staging-prueba',
  id:'11111111-1111-4111-8111-111111111111',cuenta:'a'.repeat(32) };
const observado = {nombre:destino.nombre,id:destino.id,cuenta:destino.cuenta,creadoParaStaging:true};
const configuracion = () => ({name:destino.nombre,main:'../../staging/publicar-worker.ts',account_id:destino.cuenta,
  compatibility_date:'2026-10-25',compatibility_flags:['nodejs_compat'],workers_dev:true,preview_urls:false,
  triggers:{crons:[]},observability:{enabled:false},upload_source_maps:false,
  vars:{APP_STAGE:'staging',DB_STAGE:'staging',DB_NAME:destino.nombre,STAGING_ACCESS:'basic-sha256',OUTBOUND_MODE:'disabled'},
  assets:{directory:'../../dist/client',binding:'ASSETS',run_worker_first:true},
  d1_databases:[{binding:'DB',database_name:destino.nombre,database_id:destino.id,remote:true}]});

test('sin secreto/configuración staging efectiva no invoca renderizador; jobs rechazan',async()=>{
  let llamadas=0;const entry=crearStagingProtegido(async()=>{llamadas++;throw Error('No invocar');});
  const env={...configuracion().vars,DB:{},STAGING_AUTH_SHA256:'a'.repeat(64)};
  for(const cambio of [{STAGING_AUTH_SHA256:undefined},{STAGING_AUTH_SHA256:'falso'},{APP_STAGE:'production'},{OUTBOUND_MODE:'enabled'},{EFECTOS:{}}]) {
    const r=await entry.fetch(new Request('https://ensayo.invalid/icon.png'),{...env,...cambio},{});
    assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');
  }
  assert.equal(llamadas,0);await assert.rejects(entry.queue());await assert.rejects(entry.scheduled());
});

test('el entry remoto bloquea fetch operativo antes de red incluso detrás de auth válida',async()=>{
  const red=aislarRed();let s;
  const authorization='Basic '+Buffer.from('staging:'+randomBytes(32).toString('base64url')).toString('base64');
  const config=configuracion();delete config.account_id;delete config.assets;
  config.main=resolve('tests/fixtures/worker-staging-egress.ts');config.d1_databases[0].remote=false;
  config.vars.STAGING_AUTH_SHA256=createHash('sha256').update(authorization).digest('hex');config.dev={ip:'127.0.0.1',port:0};
  try{s=createTestHarness({workers:[{config}]});await s.listen();
    assert.equal((await s.fetch('/')).status,401);
    const r=await s.fetch('/',{headers:{Authorization:authorization}});assert.equal(r.status,503);
    assert.match(await r.text(),/deshabilitada/);assert.equal(red.bloqueados.length,0,'rechazado antes del transporte externo');
  }finally{try{await s?.close();}finally{red.restaurar();}}
});

test('publicación staging requiere identidad observada, autorización y configuración cerrada',()=>{
  assert.equal(validarPublicacionStaging(configuracion(),destino,observado),true);
  for (const cambio of [{autorizado:undefined},{nombre:'cau-staging-production'},{id:'00000000-0000-0000-0000-000000000001'},{cuenta:'b'.repeat(32)}]) {
    assert.throws(()=>validarDestinoRemoto({...destino,...cambio},observado));
  }
  assert.throws(()=>validarDestinoRemoto(destino,{...observado,creadoParaStaging:false}));
  for(const cambiar of [c=>{c.routes=['siglo21sur.com/*'];},c=>{c.queues={};},c=>{c.triggers.crons=['* * * * *'];},
    c=>{c.assets.run_worker_first=false;},c=>{c.preview_urls=true;},c=>{c.vars.APP_STAGE='production';},
    c=>{c.vars.TELEGRAM_BOT_TOKEN='no';},c=>{c.d1_databases[0].database_id=undefined;}]) {
    const c=configuracion();cambiar(c);assert.throws(()=>validarPublicacionStaging(c,destino,observado));
  }
});

test('plan público remoto parametrizado se ensaya en D1 efímero sin relajar importador local', async()=>{
  const {snapshot}=ultimoSnapshot();
  const plan=planImportacionRemota(snapshot,destino,observado);
  assert.equal(plan.consultas.length,112);
  const s=createTestHarness({workers:[{config:{name:destino.nombre,main:resolve('tests/fixtures/worker-d1.mjs'),
    compatibility_date:'2026-10-25',dev:{ip:'127.0.0.1',port:0},d1_databases:[{binding:'DB',database_name:destino.nombre,
      database_id:destino.id,migrations_dir:resolve('migrations'),remote:false}]}}]});
  try{await s.listen();await s.getWorker().applyD1Migrations('DB');const {DB}=await s.getWorker().getEnv();
    for(const q of plan.consultas) await DB.prepare(q.sql).bind(...q.params).run();
    const v=await verificarPublico(DB,snapshot);assert.deepEqual(v.tablas,plan.tablas);assert.equal(Object.keys(v.privadas).length,12);
  } finally {await s.close();}
});

test('entry publicable workerd: auth antes de assets/APIs, métodos, robots, egress y SEO',async()=>{
  const red=aislarRed();let s;
  const authorization='Basic '+Buffer.from('staging:'+randomBytes(32).toString('base64url')).toString('base64');
  const config=configuracion();delete config.account_id;
  config.main=resolve('staging/publicar-worker.ts');config.assets.directory=resolve('dist/client');
  config.d1_databases[0].remote=false;config.d1_databases[0].migrations_dir=resolve('migrations');
  config.vars.STAGING_AUTH_SHA256=createHash('sha256').update(authorization).digest('hex');
  config.dev={ip:'127.0.0.1',port:0};
  try {
    s=createTestHarness({workers:[{config}]});await s.listen();await s.getWorker().applyD1Migrations('DB');
    const {DB}=await s.getWorker().getEnv();const {snapshot}=ultimoSnapshot();
    await importarPublico(DB,snapshot,{escribir:true,destino:{etapa:'staging',remoto:false,nombre:destino.nombre}});
    const antes=await verificarPublico(DB,snapshot);
    // URL absoluta para no convertir //api en un host antes de llegar al Worker.
    const request=(ruta,init={})=>s.fetch('https://ensayo.invalid'+ruta,{redirect:'manual',...init});
    const headers={Authorization:authorization};
    const comprobar=r=>{assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');assert.equal(r.headers.get('set-cookie'),null);};
    for(const ruta of ['/','/icon.png','/robots.txt','/sitemap.xml','/api/estado','/api/formularios','/%61pi/formularios','/api%2fformularios','/inexistente']) {
      for(const h of [{},{Authorization:'Basic ZmFsc286ZmFsc28='},{'Cf-Access-Jwt-Assertion':'falso',Cookie:'auth=si'}]) {
        const r=await request(ruta,{headers:h});assert.equal(r.status,401,ruta);assert.equal(await r.text(),'');comprobar(r);
      }
    }
    for(const ruta of ['/','/carreras/licenciatura-en-administracion','/novedades/1']) {
      const r=await request(ruta,{headers});assert.equal(r.status,200,ruta);comprobar(r);
      const html=await r.text();assert.match(html,/https:\/\/www\.siglo21sur\.com/);
      assert.match(html,/<meta name="robots" content="noindex, nofollow"/);
    }
    const icon=await request('/icon.png',{headers});assert.equal(icon.status,200);assert.match(icon.headers.get('content-type'),/image\/png/);comprobar(icon);
    for(const ruta of ['/api/formularios','/%61pi/formularios','/api%2fformularios','/API/formularios','/api/newsletter','/api/vigilancia']) {
      for(const method of ['GET','POST','OPTIONS']) {const r=await request(ruta,{headers,method});assert.equal(r.status,503);comprobar(r);assert.match(await r.text(),/deshabilitada/);}
    }
    for(const ruta of ['/api%252fformularios','//api/formularios','/api%5cformularios','/%ZZ']) assert.equal((await request(ruta,{headers})).status,400,ruta);
    const robots=await request('/robots.txt',{headers});assert.equal(await robots.text(),'User-agent: *\nDisallow: /\n');comprobar(robots);
    assert.equal((await request('/sitemap.xml',{headers})).status,404);
    const redirect=await request('/contactos',{headers});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'/contacto');comprobar(redirect);
    const head=await request('/icon.png',{headers,method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');comprobar(head);
    const error=await request('/inexistente',{headers});assert.equal(error.status,404);comprobar(error);
    assert.equal(red.bloqueados.length,0,'sin intentos externos al renderizar');
    assert.deepEqual(await verificarPublico(DB,snapshot),antes,'sin escrituras de APIs bloqueadas');
  } finally {try{await s?.close();}finally{red.restaurar();}}
});
