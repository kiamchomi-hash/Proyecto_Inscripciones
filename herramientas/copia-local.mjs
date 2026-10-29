/**
 * Arma en el Escritorio una copia de doble clic del sitio, con un menú lateral
 * para saltar entre versiones sin perder la página en la que estás.
 *
 * Son tres bloques:
 *   main          último commit de origin/main (no necesariamente publicado)
 *   ramas/<rama>  una carpeta por cada rama de GitHub que no sea main,
 *                 con su propio submenú; se descubren solas desde origin
 *   experimental  el banco de pruebas, que vive sólo en local
 *
 * Se captura el Worker con D1 local y contenido público. El menú va
 * inyectado en cada página en vez de un marco que las envuelva: la CSP declara
 * `frame-ancestors 'none'`, así que el sitio no entra en un iframe.
 *
 * Lo que se pierde al abrir desde `file://`: el navegador bloquea `fetch` por
 * origen `null`, así que las fichas de carrera quedan sin el texto largo (lo
 * trae `/api/carreras-detalle`) y los formularios no envían. Como además se
 * quitan los scripts, la página es un snapshot: se ve igual pero no reacciona.
 * Los recursos locales necesarios se copian para poder abrir la captura offline.
 * No se garantiza que recursos externos estén disponibles sin conexión.
 *
 * Uso:
 *   node herramientas/copia-local.mjs
 *   node herramientas/copia-local.mjs --rutas=/,/teclab --salida=D:/copia
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { chromium } from 'playwright';

/** Las páginas que vale la pena comparar. Se puede cambiar con --rutas=. */
const RUTAS = [
  '/',
  '/teclab',
  '/sobre-nosotros',
  '/clases-apoyo',
  '/novedades/1',
  '/contacto',
  '/faq',
  '/calendario-academico',
];

const args = process.argv.slice(2);
const flag = (n, def) => {
  const a = args.find(x => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : def;
};

let rutas = flag('rutas', '').trim()
  ? flag('rutas', '').split(',').map(r => (r.startsWith('/') ? r : `/${r}`))
  : RUTAS;
const escritorio = fs.existsSync(path.join(os.homedir(), 'Escritorio')) ? 'Escritorio' : 'Desktop';
const destino = path.resolve(flag('salida', path.join(os.homedir(), escritorio, 'CAU-copia')));
let salida;

if (fs.existsSync(destino)) throw new Error('La copia local no sobrescribe el destino existente; elegí otra carpeta con --salida.');

const sh = (cmd, cmdArgs, opts = {}) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'pipe', ...opts });
    let out = '', error = '';
    p.stdout?.on('data', d => { out += d; });
    p.stderr?.on('data', d => { error += d; });
    p.on('error', rej);
    p.on('close', c => (c === 0 ? res(out) : rej(new Error(`${cmd} salió ${c}\n${error.slice(-1500)}\n${out.slice(-1500)}`))));
  });

async function puertoLibre() {
  const servidor = net.createServer();
  await new Promise((resolver, rechazar) => servidor.once('error', rechazar).listen(0, '127.0.0.1', resolver));
  const puerto = servidor.address().port;
  await new Promise((resolver, rechazar) => servidor.close(e => e ? rechazar(e) : resolver()));
  return puerto;
}

/** El nombre de archivo de una ruta: `/` → index.html, `/a/b` → a-b.html */
const archivoDe = ruta => (ruta === '/' ? 'index' : ruta.replace(/^\/|\/$/g, '').replace(/\//g, '-')) + '.html';

/** `feature/tarjeta-sede-uiverse` → `feature-tarjeta-sede-uiverse` */
const slug = rama => rama.replace(/[^\w.-]+/g, '-');

/** Lo que se muestra en el menú: sin el prefijo de tipo, que no aporta. */
const nombreRama = rama => rama.replace(/^(feature|fix|chore|docs)\//, '');

// ── Qué versiones entran ────────────────────────────────────────────────────
const ETIQUETAS_PAGINA = new Map([
  ['/', 'Inicio'],
  ['/carreras/[slug]', 'Fichas de carreras'],
  ['/clases-apoyo', 'Clases de Apoyo'],
  ['/novedades', 'Novedades'],
  ['/sobre-nosotros', 'Sobre Nosotros'],
  ['/faq', 'FAQ'],
  ['/contacto', 'Contacto'],
  ['/calendario-academico', 'Calendario'],
  ['/imagenes', 'Imágenes'],
  ['/programas', 'Programas'],
  ['/laboratorio', 'Laboratorio'],
  ['*', 'Todo el sitio'],
]);

function paginasDeArchivos(archivos) {
  const paginas = new Set();
  for (const archivo of archivos) {
    const limpio = archivo.replaceAll('\\', '/');
    if (/^(app\/layout\.tsx|estilos\/globals\.css|components\/(navbar|footer)\.tsx)$/.test(limpio)) paginas.add('*');
    if (limpio.startsWith('components/index/') || limpio === 'estilos/index.css') paginas.add('/');
    if (limpio.startsWith('components/carreras/') || limpio.startsWith('app/carreras/') || limpio.startsWith('estilos/carreras/')) paginas.add('/carreras/[slug]');
    if (limpio === 'components/faq-page.tsx') paginas.add('/faq');
    if (limpio.startsWith('components/clases-apoyo/') || limpio.startsWith('estilos/clases-apoyo/')) paginas.add('/clases-apoyo');

    // El CSS y las páginas que comparten Next y el Worker viven en `estilos/` y
    // `paginas/`; su carpeta es la ruta del sitio, igual que en `app/`.
    const compartido = limpio.match(/^(?:app|estilos|paginas)\/(?!api\/)(.+?)\/(?:page|index)\.tsx$|^(?:estilos|paginas)\/(?!api\/)(.+?)\/[^/]+\.css$/);
    if (compartido && !limpio.startsWith('app/carreras/') && !limpio.startsWith('estilos/carreras/')) {
      const segmentos = (compartido[1] ?? compartido[2]).split('/').filter(s => !/^\(.+\)$/.test(s));
      paginas.add('/' + segmentos.join('/'));
    }
  }
  return [...paginas]
    .sort((a, b) => (ETIQUETAS_PAGINA.get(a) ?? a).localeCompare(ETIQUETAS_PAGINA.get(b) ?? b, 'es'));
}

async function paginasDeRama(rama) {
  const salidaDiff = await sh('git', ['diff', '--name-only', `origin/main...${rama}`]).catch(() => '');
  return paginasDeArchivos(salidaDiff.split('\n').map(a => a.trim()).filter(Boolean));
}

async function paginasDelTrabajoActual() {
  const salidaDiff = await sh('git', ['diff', '--name-only', 'origin/main']).catch(() => '');
  return paginasDeArchivos(salidaDiff.split('\n').map(a => a.trim()).filter(Boolean));
}

async function descubrirVersiones(sucio, ramaActual) {
  await sh('git', ['fetch', 'origin', '--prune']);
  const remotas = (await sh('git', ['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin']))
    .split('\n').map(r => r.trim()).filter(Boolean);
  const locales = (await sh('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads']))
    .split('\n').map(r => r.trim()).filter(Boolean);

  const versiones = [{
    grupo: 'main', id: 'main', rama: 'main', ref: 'origin/main', dir: 'main',
    nombre: 'main', detalle: 'último commit de origin/main',
  }];

  for (const refRemota of remotas.filter(r => r !== 'origin' && r !== 'origin/HEAD' && r !== 'origin/main')) {
    const rama = refRemota.replace(/^origin\//, '');
    const fecha = (await sh('git', ['log', '-1', '--format=%cd', '--date=short', refRemota])).trim();
    const rutasCambio = await paginasDeRama(refRemota);
    versiones.push({
      grupo: 'ramas', id: `rama:${rama}`, rama, ref: refRemota,
      dir: `ramas/${slug(rama)}`, nombre: nombreRama(rama), detalle: `último commit ${fecha}`,
      rutasCambio, paginas: rutasCambio.map(p => ETIQUETAS_PAGINA.get(p) ?? p),
    });
  }

  if (locales.includes('experimental')) {
    const rutasCambio = await paginasDeRama('experimental');
    versiones.push({
      grupo: 'experimental', id: 'experimental', rama: 'experimental', ref: 'experimental', dir: 'experimental',
      nombre: 'Experimental', detalle: 'posible rama, sólo local',
      rutasCambio, paginas: rutasCambio.map(p => ETIQUETAS_PAGINA.get(p) ?? p),
    });
  }
  if (sucio) {
    const rutasCambio = await paginasDelTrabajoActual();
    versiones.push({
      grupo: 'actual', id: 'actual', rama: ramaActual, dir: 'actual', actual: true,
      nombre: 'Trabajo actual', detalle: `cambios sin commitear en ${ramaActual}`,
      rutasCambio, paginas: rutasCambio.map(p => ETIQUETAS_PAGINA.get(p) ?? p),
    });
  }
  return versiones;
}

// ── El menú lateral, inyectado en cada página ───────────────────────────────
function menuLateral(actual, ruta, versiones) {
  const arriba = '../'.repeat(actual.dir.split('/').length);
  const archivo = archivoDe(ruta);
  const esActual = v => v.id === actual.id;

  const rutaCapturable = r => r === '/carreras/[slug]'
    ? '/carreras/licenciatura-en-administracion'
    : r === '*' ? '/' : r;
  const paginas = v => v.rutasCambio?.length ? `<div class="cau-sw-paginas"><span>Cambios en</span>${v.rutasCambio.map(r => `<a href="${arriba + v.dir + '/' + archivoDe(rutaCapturable(r))}">${ETIQUETAS_PAGINA.get(r) ?? r}</a>`).join('')}</div>` : '';
  const item = (v, hija) => `<div class="cau-sw-bloque${hija ? ' cau-sw-hija' : ''}"><a class="cau-sw-item${esActual(v) ? ' cau-sw-on' : ''}" href="${esActual(v) ? '#' : arriba + v.dir + '/' + archivo}"${esActual(v) ? ' aria-current="page"' : ''}>
      <span class="cau-sw-punto"></span>
      <span><strong>${v.nombre}</strong><em>${v.detalle}</em></span>
    </a>${paginas(v)}</div>`;

  const ramas = versiones.filter(v => v.grupo === 'ramas');
  const bloques = [
    versiones.filter(v => v.grupo === 'main').map(v => item(v, false)).join(''),
    ramas.length ? '<p class="cau-sw-grupo">Ramas</p>' + ramas.map(v => item(v, true)).join('') : '',
    versiones.filter(v => v.grupo === 'experimental').map(v => item(v, false)).join(''),
    versiones.filter(v => v.grupo === 'actual').map(v => '<p class="cau-sw-grupo">En esta carpeta</p>' + item(v, false)).join(''),
  ].filter(Boolean).join('');

  return `<div id="cau-switcher" data-abierto="1">
  <button id="cau-sw-tab" type="button" aria-label="Mostrar u ocultar el selector de versión">&#8646;</button>
  <div class="cau-sw-panel">
    <p class="cau-sw-titulo">Versión</p>
    ${bloques}
    <p class="cau-sw-pie">${ruta}</p>
    <p class="cau-sw-nota">Copia local: es una foto de la página. Los formularios no envían, las fichas de carrera van sin el texto largo y los filtros no responden.</p>
  </div>
</div>
<style>
#cau-switcher{position:fixed;top:0;left:0;z-index:2147483647;display:flex;align-items:flex-start;font-family:Inter,system-ui,sans-serif}
#cau-switcher .cau-sw-panel{width:15.5rem;max-height:100vh;overflow:auto;padding:1rem .9rem;background:#06131b;border-right:1px solid rgba(46,231,215,.35);box-shadow:0 0 40px rgba(0,0,0,.55)}
#cau-switcher[data-abierto="0"] .cau-sw-panel{display:none}
#cau-sw-tab{margin-top:.6rem;padding:.5rem .55rem;background:#00c7b1;color:#06131b;border:0;border-radius:0 .35rem .35rem 0;font-size:.9rem;font-weight:900;line-height:1;cursor:pointer}
.cau-sw-titulo{margin:0 0 .7rem;color:#7f9aa1;font-size:.6rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.cau-sw-grupo{margin:.9rem 0 .35rem;color:#7f9aa1;font-size:.58rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.cau-sw-item{display:flex;gap:.55rem;align-items:flex-start;margin-bottom:.3rem;padding:.5rem .6rem;border-radius:.35rem;color:#d2e4e7;text-decoration:none;line-height:1.3}
.cau-sw-item:hover{background:rgba(255,255,255,.06)}
.cau-sw-hija{margin-left:.7rem;border-left:1px solid rgba(255,255,255,.12)}
.cau-sw-on{background:rgba(0,199,177,.14)}
.cau-sw-punto{flex:0 0 auto;width:.5rem;height:.5rem;margin-top:.3rem;border:1.5px solid #4d6d75;border-radius:50%}
.cau-sw-on .cau-sw-punto{background:#00c7b1;border-color:#00c7b1}
.cau-sw-item strong{display:block;font-size:.8rem;font-weight:700;color:#fff}
.cau-sw-item em{display:block;font-size:.66rem;font-style:normal;color:#8ba4ab}
.cau-sw-paginas{display:flex;flex-wrap:wrap;gap:.25rem;margin:-.1rem .35rem .5rem 1.7rem}
.cau-sw-paginas span{flex-basis:100%;color:#6f878d;font-size:.58rem;text-transform:uppercase;letter-spacing:.08em}
.cau-sw-paginas a{padding:.16rem .32rem;border:1px solid rgba(0,199,177,.22);border-radius:.25rem;color:#b7d1cd;font-size:.59rem;text-decoration:none}
.cau-sw-paginas a:hover{border-color:#00c7b1;color:#fff}
.cau-sw-pie{margin:.9rem 0 0;padding-top:.7rem;border-top:1px solid rgba(255,255,255,.1);color:#00c7b1;font-family:ui-monospace,monospace;font-size:.7rem}
.cau-sw-nota{margin:.5rem 0 0;color:#6f878d;font-size:.62rem;line-height:1.45}
@media print{#cau-switcher{display:none}}
</style>
<script>
(function(){
  var s=document.getElementById('cau-switcher'), t=document.getElementById('cau-sw-tab');
  try{ if(localStorage.getItem('cau-sw')==='0') s.dataset.abierto='0'; }catch(e){}
  t.addEventListener('click',function(){
    s.dataset.abierto = s.dataset.abierto==='1' ? '0' : '1';
    try{ localStorage.setItem('cau-sw', s.dataset.abierto); }catch(e){}
  });
})();
</script>`;
}

// ── Captura ─────────────────────────────────────────────────────────────────
async function capturar(pagina, ruta, base, version, versiones, assets) {
  const respuesta = await pagina.goto(base + ruta, { waitUntil: 'load', timeout: 60000 });
  if (!respuesta?.ok()) throw new Error(`${ruta}: HTTP ${respuesta?.status() ?? 'sin respuesta'}`);
  // `networkidle` no llega nunca en las páginas con Turnstile, igual que en
  // capturas.mjs. Un recorrido hasta el pie despierta las imágenes diferidas.
  await pagina.waitForTimeout(1500);
  await pagina.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await pagina.waitForTimeout(900);
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForTimeout(400);

  const capturadas = Object.fromEntries(rutas.map(r => [r, archivoDe(r)]));

  let html = await pagina.evaluate(mapa => {
    document.querySelectorAll('script').forEach(s => s.remove());
    document.querySelectorAll('link[rel="preload"][as="script"], link[rel="modulepreload"]').forEach(l => l.remove());

    // Las rutas capturadas apuntan a su archivo local; las demás se neutralizan
    // para que no manden al vacío, pero el title dice cuál era.
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href)) continue;
      const limpio = href.split('?')[0].replace(/\/$/, '') || '/';
      if (mapa[limpio]) a.setAttribute('href', mapa[limpio]);
      else { a.setAttribute('href', '#'); a.title = 'No incluida en la copia local: ' + limpio; }
    }
    for (const f of document.querySelectorAll('form')) f.removeAttribute('action');
    return '<!doctype html>\n' + document.documentElement.outerHTML;
  }, capturadas);

  // Cada imagen o fuente se baja una sola vez a _assets/, compartida por todas
  // las versiones, y el HTML apunta ahí con una ruta relativa.
  const arriba = '../'.repeat(version.dir.split('/').length);
  async function guardarAsset(direccion, desde = base + '/') {
    const url = new URL(direccion.replace(/&amp;/g, '&'), desde);
    if (url.origin !== base || url.pathname === '/') return null;
    const clave = `${version.id}\0${url.href}`;
    if (assets.has(clave)) return assets.get(clave);
    const extension = path.extname(url.pathname).slice(0, 10).replace(/[^.a-z0-9]/gi, '') || '.bin';
    const nombre = `a${assets.size.toString().padStart(5, '0')}${extension}`;
    assets.set(clave, nombre);
    const r = await pagina.request.get(url.href);
    if (!r.ok()) throw new Error(`Recurso ${url.pathname}: HTTP ${r.status()}`);
    let datos = await r.body();
    if (/\.css$/i.test(url.pathname)) {
      let css = datos.toString('utf8');
      for (const m of [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]) {
        const referencia = m[1].trim();
        if (/^(?:data:|https?:|#|%23)/i.test(referencia)) continue;
        const local = await guardarAsset(referencia, url.href);
        if (local) css = css.replace(m[0], `url("${local}")`);
      }
      datos = Buffer.from(css);
    }
    fs.writeFileSync(path.join(salida, '_assets', nombre), datos);
    return nombre;
  }
  const urls = [...new Set([
    ...[...html.matchAll(/(?:src|href)="(\/(?:_astro|imagenes|derivados|fuentes|folletos)\/[^"#]+)"/g)].map(m => m[1]),
    ...[...html.matchAll(/url\(["']?(\/(?:_astro|imagenes|derivados|fuentes|folletos)\/[^)"']+)/g)].map(m => m[1]),
  ])];
  for (const url of urls) {
    const local = await guardarAsset(url);
    if (local) html = html.split(url).join(`${arriba}_assets/${local}`);
  }
  // El srcset queda con URLs sin reescribir: se saca para que mande el src.
  html = html.replace(/\ssrcset="[^"]*"/g, '');

  html = html.replace('</body>', menuLateral(version, ruta, versiones) + '</body>');
  fs.writeFileSync(path.join(salida, version.dir, archivoDe(ruta)), html, 'utf8');
}

// ── Programa ────────────────────────────────────────────────────────────────
const ramaOriginal = (await sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
const sucio = (await sh('git', ['status', '--porcelain', '--untracked-files=no'])).trim();
const descubiertas = await descubrirVersiones(sucio, ramaOriginal);
const versiones = [];
for (const version of descubiertas) {
  if (!version.actual) {
    try { await sh('git', ['cat-file', '-e', `${version.ref}:cloudflare/scripts/local.mjs`], { cwd: process.cwd() }); }
    catch { console.log(`Se omite ${version.rama}: no contiene el Worker.`); continue; }
  }
  versiones.push(version);
}
if (!versiones.length) throw new Error('No hay versiones compatibles con el Worker.');
if (!flag('rutas', '').trim()) {
  const adicionales = versiones.flatMap(v => v.rutasCambio ?? [])
    .filter(r => r !== '*')
    .map(r => r === '/carreras/[slug]' ? '/carreras/licenciatura-en-administracion' : r);
  rutas = [...new Set([...rutas, ...adicionales])];
}

// El directorio temporal pertenece a esta ejecución. Nunca se elimina ni
// reemplaza la copia anterior, y sólo se terminan procesos iniciados acá.
const raiz = process.cwd();
const temporalBase = path.join(os.homedir(), '.cache', 'cau-copia');
fs.mkdirSync(temporalBase, { recursive: true, mode: 0o700 });
const temporal = fs.mkdtempSync(path.join(temporalBase, 'ejecucion-'));
salida = path.join(temporal, 'salida');
fs.mkdirSync(path.join(salida, '_assets'), { recursive: true });
const sql = path.join(temporal, 'publico.sql');
try {
  const datos = await sh(process.execPath, ['--experimental-transform-types', path.join(raiz, 'cloudflare/scripts/copia-datos-publicos.mjs'), '--sql'], { cwd: raiz });
  fs.writeFileSync(sql, datos, { mode: 0o600 });
} catch (error) {
  fs.rmSync(temporal, { recursive: true, force: true });
  throw error;
}
const assets = new Map();
let navegador;
try { navegador = await chromium.launch(); }
catch (error) { fs.rmSync(temporal, { recursive: true, force: true }); throw error; }
const entorno = Object.fromEntries(['PATH', 'LANG', 'LC_ALL', 'TZ'].filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(entorno, { HOME: path.join(temporal, 'home'), CI: '1', ASTRO_TELEMETRY_DISABLED: '1', WRANGLER_SEND_METRICS: 'false', CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false', CLOUDFLARE_INCLUDE_PROCESS_ENV: 'false' });
fs.mkdirSync(entorno.HOME, { recursive: true });

try {
  for (const [indice, version] of versiones.entries()) {
    console.log(`── ${version.nombre} (${version.rama})`);
    fs.mkdirSync(path.join(salida, version.dir), { recursive: true });
    let carpetaBuild = raiz, worktree = null, hijo = null, contexto = null;
    try {
      if (!version.actual) {
        worktree = path.join(temporal, `repo-${indice}`);
        await sh('git', ['worktree', 'add', '--detach', worktree, version.ref], { cwd: raiz });
        carpetaBuild = worktree;
        for (const modulo of ['node_modules', 'cloudflare/node_modules']) {
          const enlace = path.join(worktree, modulo);
          if (!fs.existsSync(path.dirname(enlace))) throw new Error(`${version.rama}: no contiene el Worker de Cloudflare`);
          fs.symlinkSync(path.join(raiz, modulo), enlace, 'dir');
        }
      }
      const paquete = path.join(carpetaBuild, 'cloudflare');
      if (!fs.existsSync(path.join(paquete, 'scripts/local.mjs'))) throw new Error(`${version.rama}: versión incompatible con el Worker`);
      const persist = path.join(temporal, `d1-${indice}`);
      const wrangler = path.join(paquete, 'node_modules/wrangler/bin/wrangler.js');
      await sh(process.execPath, ['scripts/local.mjs', 'build'], { cwd: paquete, env: entorno });
      await sh(process.execPath, [wrangler, 'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', persist, '--config', 'wrangler.json'], { cwd: paquete, env: entorno });
      await sh(process.execPath, [wrangler, 'd1', 'execute', 'DB', '--local', '--persist-to', persist, '--config', 'wrangler.json', '--file', sql], { cwd: paquete, env: entorno });
      const puerto = await puertoLibre();
      const base = `http://127.0.0.1:${puerto}`;
      hijo = spawn(process.execPath, [wrangler, 'dev', '--config', 'dist/server/wrangler.json', '--persist-to', persist, '--ip', '127.0.0.1', '--port', String(puerto), '--inspector-port', '0', '--show-interactive-dev-session=false', '--log-level', 'warn'], { cwd: paquete, env: entorno, detached: true, stdio: 'ignore' });
      let listo = false;
      for (let i = 0; i < 90; i++) {
        if (hijo.exitCode !== null) throw new Error(`Worker terminó antes de iniciar (${hijo.exitCode})`);
        try { const r = await fetch(base + '/'); if (r.ok) { listo = true; break; } } catch { /* aún no arrancó */ }
        await new Promise(r => setTimeout(r, 1000));
      }
      if (!listo) throw new Error('El Worker local no inició');
      contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
      await contexto.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const pagina = await contexto.newPage();
      for (const ruta of rutas) {
        await capturar(pagina, ruta, base, version, versiones, assets);
        console.log(`   ok ${ruta}`);
      }
    } finally {
      await contexto?.close();
      if (hijo?.pid) { try { process.kill(-hijo.pid, 'SIGTERM'); } catch { /* ya terminó */ } }
      if (worktree) {
        for (const modulo of ['node_modules', 'cloudflare/node_modules']) {
          const enlace = path.join(worktree, modulo);
          if (fs.existsSync(enlace) && fs.lstatSync(enlace).isSymbolicLink()) fs.unlinkSync(enlace);
        }
        await sh('git', ['worktree', 'remove', '--force', worktree], { cwd: raiz });
      }
    }
  }
  const entrada = `${versiones[0].dir}/${archivoDe(rutas[0])}`;
  fs.writeFileSync(path.join(salida, 'ABRIR.html'), `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${entrada}"><a href="${entrada}">Abrir copia</a>`, 'utf8');
  fs.mkdirSync(destino); // Exclusivo: si apareció mientras trabajábamos, no se pisa.
  for (const nombre of fs.readdirSync(salida)) {
    fs.cpSync(path.join(salida, nombre), path.join(destino, nombre), { recursive: true, errorOnExist: true, force: false });
  }
  console.log(`Listo: ${path.join(destino, 'ABRIR.html')}`);
} finally {
  await navegador.close();
  fs.rmSync(temporal, { recursive: true, force: true });
}
