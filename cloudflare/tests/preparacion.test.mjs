import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { validarPreparacion, validarRecursosPendientes, validarBindingFuturo } from '../scripts/preparar-staging.mjs';
import barrera, { buscarStaging } from '../staging/worker.ts';
import { ipPublica, validarUrlImagen, comprobarImagen } from '../scripts/verificar-imagenes-externas.mjs';
import { CSP } from '../src/entrega/cabeceras.ts';
import { aislarRed } from '../scripts/verificar-datos.mjs';
import { comandoLocal, verificarArchivosLocales } from '../scripts/local.mjs';
import { createTestHarness } from 'wrangler';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configuracion = () => JSON.parse(readFileSync(new URL('../staging/preparacion.wrangler.json',import.meta.url)));

test('preparación valida contra schema instalado de Wrangler sin recursos ni valores secretos', () => {
  assert.equal(validarPreparacion(configuracion()).valida,true);
  const r=JSON.parse(readFileSync(new URL('../staging/recursos-pendientes.json',import.meta.url)));
  assert.equal(validarRecursosPendientes(r),true);
  assert.throws(()=>validarRecursosPendientes({...r,DB:{...r.DB,id:'fixture'}}));
});

test('las URLs externas conservadas tienen sólo sus orígenes de imagen en CSP',()=>{
  const directivas=new Map(CSP.split('; ').map(d=>[d.split(' ')[0],d]));
  assert.ok(directivas.get('img-src').includes('https://images.unsplash.com'));
  assert.ok(directivas.get('img-src').includes('https://i.ytimg.com'));
  assert.ok(!directivas.get('connect-src').includes('unsplash'));
  assert.ok(!directivas.get('script-src').includes('unsplash'));
  assert.ok(!directivas.get('img-src').includes('*'));
});

test('barrera real en workerd: todas las rutas siguen privadas y no hay egress',async()=>{
  const red=aislarRed();let server;
  try{
    // Excepción exclusivamente del harness local: omitir el build que deniega
    // publicar, no invocar CLI deploy/dry-run ni reutilizar bindings del sitio.
    const c=configuracion();delete c.build;delete c.$schema;
    c.main=resolve('staging/worker.ts');
    server=createTestHarness({workers:[{config:c}]});await server.listen();
    for(const ruta of ['/','/robots.txt','/sitemap.xml','/icon.png','/api/formularios']){
      const r=await server.fetch(ruta,{redirect:'manual'});
      assert.equal(r.status,503);assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');assert.equal(r.headers.get('cache-control'),'no-store');
    }
    assert.equal(red.bloqueados.length,0);
  }finally{try{await server?.close();}finally{red.restaurar();}}
});

test('preparación rechaza producción, recursos autoprovisionables, previews y cron', () => {
  for(const cambiar of [c=>{c.account_id='fixture';},c=>{c.vars.APP_STAGE='production';},
    c=>{c.d1_databases=[{binding:'DB'}];},c=>{c.queues={producers:[{binding:'EFECTOS',queue:'fixture'}]};},
    c=>{c.assets={directory:'../dist/client'};},c=>{c.triggers.crons=['* * * * *'];},
    c=>{c.workers_dev=true;},c=>{c.vars.STAGING_ACCESS='header';},c=>{c.vars.SMTP2GO_API_KEY='fixture';}]) {
    const c=configuracion();cambiar(c);assert.throws(()=>validarPreparacion(c));
  }
});

test('barrera niega HTML, assets, APIs, headers JWT falsificados y entorno incorrecto sin invocar red',async()=>{
  const buscar=globalThis.fetch;let llamadas=0;globalThis.fetch=()=>{llamadas++;throw Error('No debe salir');};
  try{
    for(const ruta of ['/','/sitemap.xml','/robots.txt','/imagenes/og/default.jpg','/api/formularios']){
      const r=await barrera.fetch(new Request('https://staging.example.invalid'+ruta,{headers:{'Cf-Access-Jwt-Assertion':'falso'}}),{APP_STAGE:'staging'});
      assert.equal(r.status,503);assert.equal(await r.text(),'');
      assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow');assert.equal(r.headers.get('Cache-Control'),'no-store');
    }
    assert.equal((await barrera.fetch(new Request('https://example.invalid/'),{APP_STAGE:'production',OUTBOUND_MODE:'enabled'})).status,503);
    await assert.rejects(buscarStaging('https://example.invalid/'));
    await assert.rejects(barrera.scheduled());await assert.rejects(barrera.queue());assert.equal(llamadas,0);
  }finally{globalThis.fetch=buscar;}
});

test('publicación se deniega localmente y binding futuro exige identidad separada y autorización',()=>{
  const r=spawnSync(process.execPath,['staging/denegar-publicacion.mjs'],{encoding:'utf8'});
  assert.equal(r.status,2);
  const b={binding:'DB',database_id:'11111111-1111-4111-8111-111111111111',database_name:'fixture-staging',remote:true};
  assert.throws(()=>validarBindingFuturo(b,{}));
  assert.throws(()=>validarBindingFuturo(b,{autorizado:true,idEsperado:b.database_id,nombreEsperado:b.database_name,idsProduccion:[b.database_id]}));
  assert.equal(validarBindingFuturo(b,{autorizado:true,idEsperado:b.database_id,nombreEsperado:b.database_name,idsProduccion:[]}),true);
});

test('la config local sigue intacta y staging no reutiliza sus recursos ni ofrece publicación',()=>{
  const local=JSON.parse(readFileSync(new URL('../wrangler.json',import.meta.url)));
  assert.equal(local.name,'cau-cloudflare-local');assert.equal(local.vars.APP_STAGE,'local');
  assert.equal(local.d1_databases.length,1);assert.equal(local.d1_databases[0].database_id,'00000000-0000-0000-0000-000000000001');
  assert.equal(local.d1_databases[0].remote,false);assert.ok(local.d1_databases[0].database_name);
  assert.ok(local.queues.producers.some(p=>p.binding==='EFECTOS'));
  const staging=JSON.stringify(configuracion());
  const ajenos=[local.name,local.d1_databases[0].database_id,local.d1_databases[0].database_name,
    ...local.queues.producers.map(p=>p.queue),
    ...(local.queues.consumers??[]).flatMap(c=>[c.queue,c.dead_letter_queue].filter(Boolean))];
  for(const ajeno of ajenos)assert.ok(!staging.includes(ajeno),`staging reutiliza ${ajeno}`);
  assert.ok(!staging.includes('siglo21sur.com'),'sin dominio productivo en la config de staging');
  for(const nombre of ['deploy','publish','upload','secret','login'])assert.throws(()=>comandoLocal(nombre));
  const paquete=JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));
  assert.equal(Object.keys(paquete.scripts).some(s=>/deploy|publish|upload|secret/i.test(s)),false);
  assert.doesNotThrow(()=>verificarArchivosLocales(fileURLToPath(new URL('../',import.meta.url))));
});

test('imágenes: sólo HTTPS de los dos hosts esperados e IP pública, sin SSRF',()=>{
  for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','192.168.1.1','100.64.0.1','0.0.0.0','::1','::ffff:127.0.0.1'])assert.equal(ipPublica(ip),false);
  assert.equal(ipPublica('1.1.1.1'),true);
  for(const url of ['http://images.unsplash.com/photo-1-a','https://user:pass@images.unsplash.com/photo-1-a','https://images.unsplash.com.evil.invalid/photo-1-a','https://i.ytimg.com:444/vi/abcdefghijk/maxresdefault.jpg'])assert.throws(()=>validarUrlImagen(url));
});

test('imagen: se decodifica de verdad, distingue 404 y no sigue redirect a otro origen',async()=>{
  const {default:sharp}=await import('sharp');
  const bytes=await sharp({create:{width:2,height:3,channels:3,background:'#ffffff'}}).png().toBuffer();
  const url='https://images.unsplash.com/photo-1-a';
  const valido=await comprobarImagen(url,{resolver:async()=>['1.1.1.1'],pedir:async()=>({status:200,headers:{'content-type':'image/png'},bytes})});
  assert.equal(valido.correcta,true);assert.equal(valido.width,2);assert.equal(valido.height,3);
  const caida=await comprobarImagen(url,{resolver:async()=>['1.1.1.1'],pedir:async()=>({status:404,headers:{'content-type':'image/png'},bytes})});
  assert.equal(caida.correcta,false);
  let llamadas=0;const desvio=await comprobarImagen(url,{resolver:async()=>['1.1.1.1'],pedir:async()=>{llamadas++;return{status:302,headers:{location:'https://127.0.0.1/privado'},bytes:Buffer.alloc(0)};}});
  assert.equal(desvio.correcta,false);assert.equal(llamadas,1);
  const privada=await comprobarImagen(url,{resolver:async()=>['10.0.0.1'],pedir:async()=>{throw Error('No debe consultar IP privada');}});
  assert.equal(privada.error,'ip-no-publica');
  const html=await comprobarImagen(url,{resolver:async()=>['1.1.1.1'],pedir:async()=>({status:200,headers:{'content-type':'text/html'},bytes:Buffer.from('<html/>')})});
  assert.equal(html.correcta,false);
});
