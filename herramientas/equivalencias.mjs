import http from 'node:http';
import { exec } from 'node:child_process';

const ORIGEN = 'https://tusestudiosprevios.21.edu.ar/v1';
const PUERTO = 4173;

const HTML = String.raw`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Consulta local de equivalencias</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#edf8f5;background:#071512;color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 10% 0%,#123b31 0,transparent 38%),#071512}main{width:min(1180px,100% - 32px);margin:auto;padding:42px 0 60px}.top{display:flex;justify-content:space-between;gap:24px;align-items:end;padding-bottom:24px;border-bottom:1px solid #24564b}.eyebrow{display:block;color:#00c7b1;font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.top h1{font-size:clamp(30px,5vw,58px);line-height:.95;letter-spacing:-.065em;text-transform:uppercase;margin:10px 0 12px}.top p{color:#9dbbb3;line-height:1.5;margin:0;max-width:640px}.local{color:#00c7b1;font-size:12px;font-weight:800;white-space:nowrap}.controls{display:grid;grid-template-columns:1fr 1.2fr;gap:1px;background:#24564b;margin-top:32px}.control{background:#0d2925;padding:24px;min-height:320px}.control-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.control h2{font-size:14px;margin:0;text-transform:uppercase;letter-spacing:.06em}.number{color:#00c7b1;font-size:11px;font-weight:900}.search{display:grid;grid-template-columns:1fr auto;gap:8px}input{width:100%;min-height:42px;border:1px solid #326d60;border-radius:6px;background:#09201d;color:#fff;padding:10px 12px;font:inherit;outline:none}input:focus{border-color:#00c7b1;box-shadow:0 0 0 3px #00c7b122}button{border:0;border-radius:6px;background:linear-gradient(135deg,#005587,#058c70);color:white;padding:0 16px;font-weight:800;cursor:pointer}button:hover{filter:brightness(1.15)}button:disabled{opacity:.5;cursor:wait}.options{display:grid;gap:7px;margin-top:14px;max-height:420px;overflow:auto}.option{display:grid;gap:3px;text-align:left;width:100%;padding:11px 12px;border:1px solid #24564b;background:#09201d}.option:hover,.option.selected{border-color:#00c7b1;background:#00c7b119}.option strong{font-size:13px;line-height:1.35}.option small{font-size:11px;color:#7fa69c}.disabled{opacity:.45}.results{margin-top:42px}.results-head{display:flex;justify-content:space-between;align-items:end;gap:20px;border-bottom:2px solid #00c7b1;padding-bottom:14px}.results h2{font-size:clamp(25px,4vw,42px);letter-spacing:-.055em;text-transform:uppercase;margin:7px 0}.source{color:#9dbbb3;font-size:13px}.count{text-align:right;color:#00c7b1;font-size:34px;font-weight:850;letter-spacing:-.06em}.count small{display:block;color:#9dbbb3;font-size:11px;letter-spacing:0}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:#24564b}.result{background:#0d2925;padding:20px;min-height:170px}.result:hover{background:#123a32}.result-top{display:flex;justify-content:space-between;color:#7fa69c;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.score{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#00c7b1;color:#013729;font-size:16px}.result h3{font-size:18px;line-height:1.2;margin:18px 0 8px}.result p{color:#b1cbc4;font-size:12px;line-height:1.45;margin:0}.result em{display:block;color:#71968c;font-size:10px;font-style:normal;margin-top:18px}.message{margin-top:20px;padding:12px 14px;border-left:3px solid #e7a52a;background:#e7a52a19;color:#f4d38d;font-size:13px}.note{color:#71968c;font-size:11px;line-height:1.5;margin-top:24px}.empty{color:#71968c;font-size:13px}@media(max-width:720px){main{width:min(100% - 20px,600px);padding-top:25px}.top{display:block}.local{display:inline-block;margin-top:16px}.controls,.grid{grid-template-columns:1fr}.control{min-height:0}.results-head{align-items:start}.count{font-size:25px}}
</style></head>
<body><main>
<header class="top"><div><span class="eyebrow">Consulta local · no se publica</span><h1>Equivalencias</h1><p>Elegí una institución y un plan de origen. Se muestran sólo los destinos que no figuran como presenciales.</p></div><span class="local">localhost:${PUERTO}</span></header>
<section class="controls"><div class="control"><div class="control-head"><h2>Institución de origen</h2><span class="number">01</span></div><div class="search"><input id="institutionSearch" value="TECLAB" placeholder="Buscar institución"><button id="institutionButton">Buscar</button></div><div id="institutions" class="options"><p class="empty">Cargando…</p></div></div><div id="planControl" class="control disabled"><div class="control-head"><h2>Carrera o plan de origen</h2><span class="number">02</span></div><input id="planSearch" disabled placeholder="Primero elegí una institución"><div id="plans" class="options"><p class="empty">Seleccioná una institución.</p></div></div></section>
<div id="message" hidden class="message"></div><section id="results" class="results" hidden><div class="results-head"><div><span class="eyebrow">Resultado · sólo a distancia</span><h2>Destinos informados</h2><p id="source" class="source"></p></div><div id="count" class="count"></div></div><div id="resultGrid" class="grid"></div></section><p class="note">La consulta es orientativa. El reconocimiento definitivo depende de la documentación y de la evaluación de Universidad Siglo 21.</p>
</main><script>
const $=id=>document.getElementById(id);let institutionId='',planId='',plans=[];
const showMessage=text=>{$('message').textContent=text;$('message').hidden=!text};
async function api(path,params){const query=new URLSearchParams(params);const response=await fetch('/api/'+path+'?'+query);const data=await response.json();if(!response.ok)throw Error(data.error||'No se pudo consultar el servicio');return data}
function button(item,selected,click){const el=document.createElement('button');el.className='option'+(selected?' selected':'');el.innerHTML='<strong>'+item.name+'</strong><small>'+(item.short_name||'Ver detalle')+'</small>';el.onclick=click;return el}
function loadInstitutions(){const box=$('institutions');box.innerHTML='<p class="empty">Cargando…</p>';api('instituciones',{busqueda:'TECLAB'}).then(data=>{const items=data.items||[];box.innerHTML='';items.forEach(item=>box.append(button(item,item.id===institutionId,()=>chooseInstitution(item))));if(!items.length){box.innerHTML='<p class="empty">No encontramos instituciones.</p>';return}chooseInstitution(items[0])}).catch(error=>showMessage(error.message))}
async function searchInstitutions(){showMessage('');$('institutionButton').disabled=true;try{const data=await api('instituciones',{busqueda:$('institutionSearch').value});const box=$('institutions');box.innerHTML='';(data.items||[]).forEach(item=>box.append(button(item,false,()=>chooseInstitution(item))));if(!box.children.length)box.innerHTML='<p class="empty">No encontramos instituciones.</p>'}catch(error){showMessage(error.message)}finally{$('institutionButton').disabled=false}}
async function chooseInstitution(item){institutionId=item.id;planId='';$('planControl').classList.remove('disabled');$('planSearch').disabled=false;$('planSearch').placeholder='Buscar carrera o plan';$('plans').innerHTML='<p class="empty">Cargando planes…</p>';$('results').hidden=true;showMessage('');try{const data=await api('planes',{institucionId:institutionId});plans=data.items||[];renderPlans()}catch(error){showMessage(error.message)}}
function renderPlans(){const term=$('planSearch').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const box=$('plans');box.innerHTML='';plans.filter(item=>item.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term)).forEach(item=>box.append(button(item,item.id===planId,()=>choosePlan(item))));if(!box.children.length)box.innerHTML='<p class="empty">No encontramos ese plan.</p>'}
async function choosePlan(item){planId=item.id;$('plans').querySelectorAll('.option').forEach(el=>el.classList.remove('selected'));$('results').hidden=true;showMessage('Consultando destinos…');try{const data=await api('compatibilidades',{institucionId,planId});renderResults(data)}catch(error){showMessage(error.message)}}
function splitName(name){const parts=name.split(' - ');return {career:parts.shift()||name,detail:parts.join(' · ')}}
function renderResults(data){showMessage('');const items=(data.compatibilities||[]).filter(item=>!item.targetSyllabusName.toLocaleUpperCase('es-AR').includes('PRESENCIAL'));$('source').textContent=data.name;$('count').innerHTML=items.length+'<small>destinos a distancia</small>';$('resultGrid').innerHTML='';items.forEach(item=>{const name=splitName(item.targetSyllabusName);const article=document.createElement('article');article.className='result';article.innerHTML='<div class="result-top"><span>Carrera de destino</span><span class="score">'+item.compatibility+'</span></div><h3>'+name.career+'</h3><p>'+name.detail+'</p><em>Índice de compatibilidad del simulador</em>';$('resultGrid').append(article)});if(!items.length)$('resultGrid').innerHTML='<p class="empty">No se encontraron destinos a distancia para este plan.</p>';$('results').hidden=false}
$('institutionButton').onclick=searchInstitutions;$('institutionSearch').onkeydown=e=>{if(e.key==='Enter')searchInstitutions()};$('planSearch').oninput=renderPlans;loadInstitutions();
</script></body></html>`;

function json(response, status = 200) {
  return { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(response) };
}

async function consultar(ruta, params) {
  const url = new URL(`${ORIGEN}${ruta}`);
  for (const [clave, valor] of Object.entries(params)) url.searchParams.set(clave, valor);
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`El servicio respondió ${response.status}.`);
  return response.json();
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PUERTO}`);
  try {
    if (url.pathname === '/') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(HTML);
      return;
    }
    let data;
    if (url.pathname === '/api/instituciones') data = await consultar('/institution', { pattern: url.searchParams.get('busqueda') ?? '' });
    else if (url.pathname === '/api/planes') data = await consultar(`/institution/${url.searchParams.get('institucionId')}/syllabus`, { pattern: '' });
    else if (url.pathname === '/api/compatibilidades') data = await consultar(`/institution/${url.searchParams.get('institucionId')}/syllabus/${url.searchParams.get('planId')}`, { compatibilityCheck: 'true' });
    else { response.writeHead(404); response.end('No encontrado'); return; }
    const result = json(data); response.writeHead(result.status, result.headers); response.end(result.body);
  } catch (error) {
    const result = json({ error: error instanceof Error ? error.message : 'No se pudo consultar.' }, 502);
    response.writeHead(result.status, result.headers); response.end(result.body);
  }
});

server.listen(PUERTO, '127.0.0.1', () => {
  const url = `http://localhost:${PUERTO}`;
  console.log(`Consulta local de equivalencias: ${url}`);
  const comando = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(comando, () => undefined);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
