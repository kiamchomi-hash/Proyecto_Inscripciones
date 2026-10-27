// Validación local pura: nunca llama a Wrangler, lee dotenv o completa IDs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const Ajv = require('ajv'); // Ya instalado en las dependencias; sin descargar.
const referencia = JSON.parse(readFileSync(new URL('../staging/preparacion.wrangler.json',import.meta.url)));
const schema = JSON.parse(readFileSync(new URL('../node_modules/wrangler/config-schema.json',import.meta.url)));
// El schema de Wrangler incluye anotaciones de editor (allowTrailingCommas,
// markdownDescription). No son reglas JSON Schema; no invalidan su validación.
const validarSchema = new Ajv({allErrors:true,logger:false,strict:false}).compile({...schema,$ref:'#/definitions/RawConfig'});
const PERMITIDAS = ['$schema','name','main','compatibility_date','compatibility_flags','workers_dev','preview_urls',
  'send_metrics','upload_source_maps','observability','vars','triggers','build','dev'];

export function validarPreparacion(c) {
  assert.ok(validarSchema(c),'Configuración inválida según schema Wrangler instalado');
  assert.deepEqual(Object.keys(c).sort(),[...PERMITIDAS].sort(),'Sin bindings/IDs/autoaprovisionamiento ni rutas');
  assert.equal(c.name,'cau-staging-preparacion');assert.equal(c.main,'worker.ts');
  assert.equal(c.workers_dev,false);assert.equal(c.preview_urls,false);
  assert.equal(c.send_metrics,false);assert.equal(c.upload_source_maps,false);
  assert.deepEqual(c.observability,{enabled:false});
  assert.deepEqual(c.vars,{APP_STAGE:'staging',STAGING_ACCESS:'deny-all',OUTBOUND_MODE:'disabled'});
  assert.deepEqual(c.triggers,{crons:[]});
  assert.deepEqual(c.build,{command:'node denegar-publicacion.mjs',cwd:'.'});
  assert.deepEqual(c.dev,{ip:'127.0.0.1',port:0});
  assert.equal(c.compatibility_date,'2026-10-24');assert.deepEqual(c.compatibility_flags,['nodejs_compat']);
  return {valida:true,schema:'wrangler/config-schema.json',recursosRemotos:0,acceso:'deny-all',egress:'disabled'};
}

export function validarRecursosPendientes(r) {
  assert.deepEqual(r,{
    version:1,estado:'preparacion-no-activada',entorno:'staging',
    DB:{tipo:'D1',id:null,nombre:null,compartirConProduccion:false},
    EFECTOS:{tipo:'Queues',nombre:null,dlq:null,activar:false},cron:{activar:false},
    egress:{modo:'disabled',destinosAutorizados:[]},acceso:{modo:'deny-all',verificador:null},
    R2:{requeridoPorContenidoRelevado:false},
  });
  return true;
}

/** Preflight PURO para una autorización futura, no genera ni aplica configs.
 * La identidad debe confirmarse contra los recursos del entorno independiente;
 * no se acepta una base de producción ni se deduce su identidad de un nombre.
 */
export function validarBindingFuturo(b, permiso) {
  assert.equal(permiso.autorizado,true,'Falta autorización explícita futura');
  assert.equal(b.binding,'DB');assert.equal(b.remote,true,'Binding remoto debe ser explícito');
  assert.match(b.database_id,/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
  assert.notEqual(b.database_id,'00000000-0000-0000-0000-000000000001','No usar el ID del fixture local');
  assert.equal(b.database_id,permiso.idEsperado);assert.equal(b.database_name,permiso.nombreEsperado);
  assert.ok(Array.isArray(permiso.idsProduccion));assert.ok(!permiso.idsProduccion.includes(b.database_id));
  assert.match(b.database_name,/staging/);return true;
}

if(process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url){
  assert.equal(process.argv.length,2,'Sin flags ni recursos arbitrarios');
  const pendientes=JSON.parse(readFileSync(new URL('../staging/recursos-pendientes.json',import.meta.url)));
  validarRecursosPendientes(pendientes);
  console.log(JSON.stringify(validarPreparacion(referencia)));
}
