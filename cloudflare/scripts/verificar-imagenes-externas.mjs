// Sólo las diez referencias del lote público, sin credenciales, cookies,
// sustituciones ni copias de imágenes. DNS IPv4 validado y fijado por request.
import assert from 'node:assert/strict';
import { Resolver } from 'node:dns/promises';
import { request } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { ultimoSnapshot, huella, RAIZ, BASE } from './datos-publicos.mjs';

const LIMITE = 10 * 1024 * 1024;
const bloqueadas = new BlockList();
for(const [ip,bits] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],
  ['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],
  ['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]])bloqueadas.addSubnet(ip,bits,'ipv4');
export const ipPublica = ip => isIP(ip)===4 && !bloqueadas.check(ip,'ipv4');
export function validarUrlImagen(valor) {
  const u = new URL(valor);
  assert.equal(u.protocol,'https:');assert.ok(!u.username && !u.password && !u.port && !u.hash);
  assert.ok(['images.unsplash.com','i.ytimg.com'].includes(u.hostname));
  if(u.hostname==='images.unsplash.com') {
    assert.match(u.pathname,/^\/photo-[0-9]+-[a-f0-9]+$/);
    for(const k of u.searchParams.keys())assert.ok(['w','q'].includes(k));
  }else{assert.match(u.pathname,/^\/vi\/[a-zA-Z0-9_-]{11}\/maxresdefault\.jpg$/);assert.equal(u.search,'');}
  return u;
}
async function resolver(host) {
  const dns = new Resolver({timeout:3000,tries:1});
  try{return await dns.resolve4(host);}finally{dns.cancel();}
}
async function pedir(url, ip) {
  return new Promise((resolve,reject)=>{
    const req = request(url,{
      method:'GET',family:4,autoSelectFamily:false,
      lookup:(_host,opts,cb)=>opts.all ? cb(null,[{address:ip,family:4}]) : cb(null,ip,4),
      headers:{Accept:'image/jpeg,image/png,image/webp,image/avif,image/gif','User-Agent':'CAU-public-media-check/1'},
    },r=>{
      const trozos=[];let bytes=0;
      if(Number(r.headers['content-length'])>LIMITE){req.destroy(Object.assign(new Error(),{code:'limite-bytes'}));return;}
      r.on('data',trozo=>{bytes+=trozo.length;if(bytes>LIMITE)req.destroy(Object.assign(new Error(),{code:'limite-bytes'}));else trozos.push(trozo);});
      r.on('error',reject);
      r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,bytes:Buffer.concat(trozos)}));
    });
    const timer=setTimeout(()=>req.destroy(Object.assign(new Error(),{code:'timeout'})),20000);
    req.on('close',()=>clearTimeout(timer));req.on('error',reject);req.end();
  });
}
export async function comprobarImagen(valor, puertos={}) {
  const resultado={url:valor,correcta:false,saltos:[]};
  try {
    const original=validarUrlImagen(valor);let u=original,r;
    for(let intento=0;intento<4;intento++) {
      const ips=await (puertos.resolver??resolver)(u.hostname);
      if(!ips.length || !ips.every(ipPublica))return {...resultado,error:'ip-no-publica'};
      r=await (puertos.pedir??pedir)(u,ips[0]);
      if(![301,302,303,307,308].includes(r.status))break;
      const siguiente=validarUrlImagen(new URL(r.headers.location,u).href);
      assert.equal(siguiente.origin,original.origin);assert.equal(siguiente.pathname,original.pathname);
      resultado.saltos.push({status:r.status,desde:u.href,hasta:siguiente.href});u=siguiente;
    }
    resultado.urlFinal=u.href;resultado.status=r.status;
    resultado.contentType=r.headers['content-type']??null;resultado.bytes=r.bytes.length;
    resultado.sha256=createHash('sha256').update(r.bytes).digest('hex');
    if(!/^image\/(?:jpeg|png|webp|avif|gif)(?:;|$)/i.test(resultado.contentType??''))return {...resultado,error:'tipo-no-raster'};
    // metadata() sola no acredita decodificación: raw() procesa todos los píxeles.
    const decodificada=await sharp(r.bytes,{limitInputPixels:40_000_000}).raw().toBuffer({resolveWithObject:true});
    resultado.width=decodificada.info.width;resultado.height=decodificada.info.height;
    resultado.decodifica=true;resultado.correcta=r.status===200 && resultado.width>0 && resultado.height>0;
    if(!resultado.correcta)resultado.error=`http-${r.status}`;
    return resultado;
  }catch(e){return {...resultado,error:e.code??(e.name==='AssertionError'?'destino-no-autorizado':'imagen-o-red-no-verificada')};}
}
function cobertura(url, lote) {
  const tablas=[];
  for(const [tabla,filas] of Object.entries(lote.snapshot.tablas)) {
    const cantidad=filas.filter(f=>JSON.stringify(f).replaceAll('&amp;','&').includes(url)).length;
    if(cantidad)tablas.push({tabla,filas:cantidad});
  }
  const paginas=lote.seo.paginas.filter(p=>(p.imagenes??[]).some(src=>{
    try{const u=new URL(src,BASE);return (u.pathname==='/_next/image'?u.searchParams.get('url'):u.href)===url;}catch{return false;}
  })).map(p=>new URL(p.url).pathname);
  return {tablas,paginas};
}
export async function verificarPendientes() {
  const lote=ultimoSnapshot();assert.equal(huella(lote.seo),lote.manifest.seoSha256);
  const urls=[...new Set(lote.seo.media.filter(m=>m.estado==='origen-no-autorizado').map(m=>m.referencia))];
  assert.equal(urls.length,10);urls.forEach(validarUrlImagen);
  assert.equal(urls.filter(u=>new URL(u).hostname==='images.unsplash.com').length,8);
  const inicio=new Date().toISOString(),imagenes=[];
  for(const url of urls)imagenes.push({...await comprobarImagen(url),referencias:cobertura(url,lote)});
  let dir=RAIZ;
  for(const parte of ['.local','preparacion-staging']) {
    dir=resolve(dir,parte);if(existsSync(dir))assert.ok(lstatSync(dir).isDirectory()&&!lstatSync(dir).isSymbolicLink());
    else mkdirSync(dir,{mode:0o700});
  }
  const nombre=`imagenes-${new Date().toISOString().replaceAll(':','-')}.json`;
  writeFileSync(resolve(dir,nombre),JSON.stringify({inicio,fin:new Date().toISOString(),snapshotSha256:lote.manifest.snapshotSha256,
    metodo:'GET sin auth, DNS IPv4 fijado, HTTPS verificado, raster decodificado sin conservar bytes',imagenes}),{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({informe:`.local/preparacion-staging/${nombre}`,correctas:imagenes.filter(i=>i.correcta).length,
    fallas:imagenes.filter(i=>!i.correcta).map(i=>({url:i.url,status:i.status,error:i.error})),porHost:Object.fromEntries(['images.unsplash.com','i.ytimg.com'].map(h=>[h,imagenes.filter(i=>new URL(i.url).hostname===h).length]))}));
  return imagenes.every(i=>i.correcta);
}
if(process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url){
  try{assert.equal(process.argv.length,2,'Sin URLs o flags arbitrarios');if(!await verificarPendientes())process.exitCode=1;}
  catch(e){console.error(`Verificación de media no completada (${e.code??e.name})`);process.exitCode=1;}
}
