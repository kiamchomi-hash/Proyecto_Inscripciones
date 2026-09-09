/**
 * Arma en el Escritorio una copia de doble clic del sitio, con un menú lateral
 * para saltar entre versiones sin perder la página en la que estás.
 *
 * Son tres bloques:
 *   main          lo que está publicado
 *   ramas/<rama>  una carpeta por cada rama de GitHub que no sea main,
 *                 con su propio submenú; se descubren solas desde origin
 *   experimental  el banco de pruebas, que vive sólo en local
 *
 * Por qué un snapshot renderizado y no `next export`: el proyecto tiene rutas
 * `/api/*` y `proxy.ts`, que `output: 'export'` no admite. Y por qué el menú va
 * inyectado en cada página en vez de un marco que las envuelva: la CSP declara
 * `frame-ancestors 'none'`, así que el sitio no entra en un iframe.
 *
 * Lo que se pierde al abrir desde `file://`: el navegador bloquea `fetch` por
 * origen `null`, así que las fichas de carrera quedan sin el texto largo (lo
 * trae `/api/carreras-detalle`) y los formularios no envían. Como además se
 * quitan los scripts, la página es un snapshot: se ve igual pero no reacciona.
 * La maquetación y las tipografías quedan intactas porque el CSS ya viaja
 * inline en el HTML (`experimental.inlineCss`).
 *
 * Uso:
 *   node herramientas/copia-local.mjs
 *   node herramientas/copia-local.mjs --rutas=/,/teclab --salida=D:/copia
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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

const PUERTO = 3900;

const args = process.argv.slice(2);
const flag = (n, def) => {
  const a = args.find(x => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : def;
};

let rutas = flag('rutas', '').trim()
  ? flag('rutas', '').split(',').map(r => (r.startsWith('/') ? r : `/${r}`))
  : RUTAS;
const salida = path.resolve(flag('salida', path.join(os.homedir(), 'Desktop', 'CAU-copia')));

const sh = (cmd, cmdArgs, opts = {}) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'pipe', shell: true, ...opts });
    let out = '';
    p.stdout?.on('data', d => { out += d; });
    p.stderr?.on('data', d => { out += d; });
    p.on('close', c => (c === 0 ? res(out) : rej(new Error(`${cmd} salió ${c}\n${out.slice(-1500)}`))));
  });

// En Windows `child.kill()` sobre un spawn con `shell: true` mata el cmd.exe
// y deja `next start` huerfano ocupando el puerto: el build siguiente le pisa
// el .next por debajo y todas las versiones terminan capturadas del primer
// servidor. Hay que matar por puerto y esperar a que quede libre de verdad.
async function liberarPuerto(puerto) {
  if (process.platform === 'win32') {
    const out = await sh('netstat', ['-ano']).catch(() => '');
    const pids = out.split('\n')
      .filter(l => l.includes(':' + puerto) && l.includes('LISTENING'))
      .map(l => l.trim().split(/\s+/).pop())
      .filter(p => /^[0-9]+$/.test(p));
    for (const pid of new Set(pids)) {
      await sh('taskkill', ['/PID', pid, '/T', '/F']).catch(() => {});
    }
  } else {
    await sh('bash', ['-c', 'lsof -ti:' + puerto + ' | xargs -r kill -9']).catch(() => {});
  }
  for (let i = 0; i < 40; i++) {
    try { await fetch('http://localhost:' + puerto + '/'); } catch { return; }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('El puerto ' + puerto + ' sigue ocupado despues de 20s');
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
    if (/^(app\/layout\.tsx|app\/globals\.css|components\/(navbar|footer)\.tsx)$/.test(limpio)) paginas.add('*');
    if (limpio.startsWith('components/index/') || limpio === 'app/index.css') paginas.add('/');
    if (limpio.startsWith('components/carreras/') || limpio.startsWith('app/carreras/')) paginas.add('/carreras/[slug]');
    if (limpio === 'components/faq-page.tsx') paginas.add('/faq');
    if (limpio.startsWith('components/clases-apoyo/')) paginas.add('/clases-apoyo');

    const app = limpio.match(/^app\/(?!api\/)(.+?)\/(?:page\.tsx|[^/]+\.css)$/);
    if (app && !limpio.startsWith('app/carreras/')) {
      const segmentos = app[1].split('/').filter(s => !/^\(.+\)$/.test(s));
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
    nombre: 'Producción', detalle: 'lo que está publicado',
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
  await pagina.goto(base + ruta, { waitUntil: 'load', timeout: 60000 });
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
  const urls = [...new Set([
    ...[...html.matchAll(/(?:src|href)="(\/_next\/image\?[^"]+|\/_next\/static\/media\/[^"]+|\/imagenes\/[^"]+)"/g)].map(m => m[1]),
    ...[...html.matchAll(/url\((\/_next\/static\/media\/[^)"']+|\/imagenes\/[^)"']+)\)/g)].map(m => m[1]),
  ])];
  for (const url of urls) {
    const limpia = url.replace(/&amp;/g, '&');
    const claveAsset = `${version.id}\0${limpia}`;
    if (!assets.has(claveAsset)) {
      const ext = (limpia.match(/\.(webp|png|jpe?g|svg|avif|woff2?|ico)/i) || [, 'webp'])[1];
      const nombre = `a${assets.size.toString().padStart(3, '0')}.${ext}`;
      try {
        const r = await pagina.request.get(base + limpia);
        if (r.ok()) { fs.writeFileSync(path.join(salida, '_assets', nombre), await r.body()); assets.set(claveAsset, nombre); }
        else assets.set(claveAsset, null);
      } catch { assets.set(claveAsset, null); }
    }
    const local = assets.get(claveAsset);
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
const versiones = await descubrirVersiones(sucio, ramaOriginal);
if (!flag('rutas', '').trim()) {
  const adicionales = versiones.flatMap(v => v.rutasCambio ?? [])
    .filter(r => r !== '*')
    .map(r => r === '/carreras/[slug]' ? '/carreras/licenciatura-en-administracion' : r);
  rutas = [...new Set([...rutas, ...adicionales])];
}

fs.rmSync(salida, { recursive: true, force: true });
fs.mkdirSync(path.join(salida, '_assets'), { recursive: true });

const assets = new Map();
const navegador = await chromium.launch();

console.log(`\nCopia local → ${salida}`);
console.log(`${rutas.length} páginas × ${versiones.length} versiones: ${versiones.map(v => v.nombre).join(', ')}\n`);
if (sucio) console.log('Los cambios pendientes se agregan como Trabajo actual; las ramas se compilan aisladas.\n');

try {
  for (const version of versiones) {
    fs.mkdirSync(path.join(salida, version.dir), { recursive: true });
    console.log(`── ${version.nombre}  (${version.rama})`);

    // Cada ref commiteada se compila en un worktree temporal. Así Producción,
    // las ramas y Experimental pueden convivir aunque la carpeta principal tenga
    // trabajo sin guardar. Trabajo actual, en cambio, usa esta carpeta tal cual.
    let carpetaBuild = process.cwd();
    let worktree = null;
    let worktreeRaiz = null;
    if (!version.actual) {
      worktreeRaiz = fs.mkdtempSync(path.join(os.tmpdir(), 'cau-copia-'));
      worktree = path.join(worktreeRaiz, 'repo');
      await sh('git', ['worktree', 'add', '--detach', worktree, version.ref]);
      const modulos = path.join(worktree, 'node_modules');
      fs.symlinkSync(path.join(process.cwd(), 'node_modules'), modulos, process.platform === 'win32' ? 'junction' : 'dir');
      for (const archivoEntorno of ['.env.local', '.env']) {
        const origenEntorno = path.join(process.cwd(), archivoEntorno);
        if (fs.existsSync(origenEntorno)) fs.copyFileSync(origenEntorno, path.join(worktree, archivoEntorno));
      }
      carpetaBuild = worktree;
    }

    try {
      await liberarPuerto(PUERTO);

      process.stdout.write('   compilando… ');
      await sh('npx', ['next', 'build', ...(version.actual ? [] : ['--webpack'])], { cwd: carpetaBuild });
      console.log('ok');

      spawn('npx', ['next', 'start', '-p', String(PUERTO)], { cwd: carpetaBuild, shell: true, stdio: 'ignore' });
      const base = `http://localhost:${PUERTO}`;
      let vivo = false;
      for (let i = 0; i < 60; i++) {
        try { await fetch(base + '/'); vivo = true; break; } catch { await new Promise(r => setTimeout(r, 1000)); }
      }
      if (!vivo) throw new Error('El servidor no levanto en el puerto ' + PUERTO);

      const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
      const pagina = await ctx.newPage();
      for (const ruta of rutas) {
        try {
          await capturar(pagina, ruta, base, version, versiones, assets);
          console.log(`   ok     ${ruta}`);
        } catch (e) {
          console.log(`   FALLO  ${ruta} — ${e.message.split('\n')[0]}`);
        }
      }
      await ctx.close();
      await liberarPuerto(PUERTO);
    } finally {
      await liberarPuerto(PUERTO).catch(() => {});
      if (worktree) {
        // Quitar primero el enlace: en Windows, borrar el worktree con la
        // junction adentro puede seguirla y vaciar el node_modules original.
        const enlaceModulos = path.join(worktree, 'node_modules');
        if (fs.existsSync(enlaceModulos)) fs.unlinkSync(enlaceModulos);
        await sh('git', ['worktree', 'remove', '--force', worktree]).catch(() => {});
      }
      if (worktreeRaiz) fs.rmdirSync(worktreeRaiz, { maxRetries: 3, retryDelay: 200 });
    }
  }
} finally {
  await navegador.close();
  await liberarPuerto(PUERTO).catch(() => {});
}

const entrada = `${versiones[0].dir}/index.html`;
fs.writeFileSync(path.join(salida, 'ABRIR.html'),
  `<!doctype html><meta charset="utf-8"><title>Copia local del CAU</title>
<meta http-equiv="refresh" content="0; url=${entrada}">
<p style="font-family:system-ui;padding:2rem">Abriendo la copia local…
<a href="${entrada}">entrar</a></p>`, 'utf8');

console.log(`\n${assets.size} archivos en _assets/`);
console.log(`Listo. Doble clic en ${path.join(salida, 'ABRIR.html')}\n`);
