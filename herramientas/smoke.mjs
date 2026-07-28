#!/usr/bin/env node
// Chequeo de produccion post-deploy: que el sitio publicado responda lo que
// tiene que responder. Reemplaza la tanda de curl a mano.
//
//   npm run smoke                          # contra www.siglo21sur.com
//   npm run smoke -- --base=http://localhost:3000
//   npm run smoke -- --rapido              # saltea el barrido del sitimap
//
// Que verifica:
//   1. Rutas fijas devuelven 200.
//   2. Las cabeceras de seguridad de next.config.ts estan puestas.
//   3. /admin y /api llevan X-Robots-Tag noindex.
//   4. Los redirects declarados siguen vivos (solo contra el dominio propio).
//   5. Todas las URLs del sitemap responden 200.
//   6. Peso real comprimido del HTML de la home, medido contra el server: Vercel
//      comprime al vuelo, asi que gzipear el HTML local da otro numero.
//
// Sale con codigo 1 si algo fallo.

import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

const args = process.argv.slice(2);
const baseArg = args.find(a => a.startsWith('--base='));
const BASE = (baseArg ? baseArg.slice('--base='.length) : 'https://www.siglo21sur.com').replace(/\/$/, '');
const RAPIDO = args.includes('--rapido');
const CONCURRENCIA = 8;

const esProd = BASE === 'https://www.siglo21sur.com';
const fallos = [];
const notas = [];

function fallo(que, detalle) {
  fallos.push(`${que} — ${detalle}`);
  console.log(`  FALLA  ${que} — ${detalle}`);
}
function ok(que, detalle = '') {
  console.log(`  ok     ${que}${detalle ? ` — ${detalle}` : ''}`);
}

// Pedido crudo: no descomprime, asi podemos contar los bytes que viajan de
// verdad y ver los redirects sin que fetch los siga solo.
function pedir(url, { metodo = 'GET', encoding = 'br, gzip' } = {}) {
  const u = new URL(url);
  const fn = u.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const req = fn(
      u,
      {
        method: metodo,
        headers: {
          'accept-encoding': encoding,
          'user-agent': 'smoke-siglo21sur/1.0',
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      res => {
        let bytes = 0;
        const trozos = [];
        res.on('data', d => {
          bytes += d.length;
          if (trozos.length < 4000) trozos.push(d);
        });
        res.on('end', () => resolve({
          status: res.statusCode,
          headers: res.headers,
          bytes,
          crudo: Buffer.concat(trozos),
        }));
      },
    );
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function enTandas(items, fn, limite = CONCURRENCIA) {
  const resultados = [];
  let i = 0;
  const obreros = Array.from({ length: Math.min(limite, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      resultados[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(obreros);
  return resultados;
}

// ── 1. Rutas fijas ──────────────────────────────────────────────────────────

console.log(`\nBase: ${BASE}\n`);
console.log('Rutas principales');

const RUTAS = ['/', '/clases-apoyo', '/contacto', '/faq', '/sobre-nosotros', '/novedades/1', '/robots.txt', '/sitemap.xml'];

for (const ruta of RUTAS) {
  try {
    const r = await pedir(BASE + ruta);
    if (r.status === 200) ok(ruta);
    else fallo(ruta, `HTTP ${r.status}`);
  } catch (e) {
    fallo(ruta, e.message);
  }
}

// ── 2. Cabeceras de seguridad ───────────────────────────────────────────────

console.log('\nCabeceras de seguridad (home)');

const home = await pedir(BASE + '/');
const ESPERADAS = {
  'content-security-policy': /frame-ancestors 'none'/,
  'x-content-type-options': /^nosniff$/,
  'referrer-policy': /strict-origin-when-cross-origin/,
  'permissions-policy': /camera=\(\)/,
};
for (const [cabecera, patron] of Object.entries(ESPERADAS)) {
  const valor = home.headers[cabecera];
  if (!valor) fallo(cabecera, 'ausente');
  else if (!patron.test(valor)) fallo(cabecera, `valor inesperado: ${String(valor).slice(0, 80)}`);
  else ok(cabecera);
}
// HSTS solo tiene sentido sobre https.
if (BASE.startsWith('https://')) {
  const hsts = home.headers['strict-transport-security'];
  if (hsts && /max-age=63072000/.test(hsts)) ok('strict-transport-security');
  else fallo('strict-transport-security', hsts ? `valor inesperado: ${hsts}` : 'ausente');
}

// ── 3. noindex en el panel y las APIs ───────────────────────────────────────

console.log('\nnoindex donde corresponde');
for (const [ruta, esperado] of [['/admin/login', /noindex/], ['/api/formularios', /noindex/]]) {
  try {
    const r = await pedir(BASE + ruta);
    const tag = r.headers['x-robots-tag'];
    if (tag && esperado.test(tag)) ok(`${ruta} → ${tag}`);
    else fallo(ruta, tag ? `X-Robots-Tag: ${tag}` : 'sin X-Robots-Tag — indexable');
  } catch (e) {
    fallo(ruta, e.message);
  }
}

// ── 4. Redirects declarados ─────────────────────────────────────────────────

if (esProd) {
  console.log('\nRedirects');
  const REDIRECTS = [
    ['https://siglo21sur.com/', 'https://www.siglo21sur.com/'],
    ['https://proyecto-inscripciones.vercel.app/', 'https://www.siglo21sur.com/'],
    [`${BASE}/contactos`, `${BASE}/contacto`],
    [`${BASE}/carreras`, `${BASE}/`],
    [`${BASE}/novedades`, `${BASE}/novedades/1`],
  ];
  for (const [desde, hasta] of REDIRECTS) {
    try {
      const r = await pedir(desde);
      const destino = r.headers.location
        ? new URL(r.headers.location, desde).href.replace(/\/$/, '')
        : null;
      const esperado = hasta.replace(/\/$/, '');
      if (r.status >= 300 && r.status < 400 && destino === esperado) ok(`${desde} → ${r.status} ${hasta}`);
      else fallo(desde, `HTTP ${r.status}${destino ? ` → ${destino}` : ''}, esperaba 3xx → ${hasta}`);
    } catch (e) {
      fallo(desde, e.message);
    }
  }
} else {
  notas.push('Redirects salteados: solo se prueban contra el dominio propio.');
}

// ── 5. Barrido del sitemap ──────────────────────────────────────────────────

if (!RAPIDO) {
  console.log('\nSitemap');
  const sm = await pedir(BASE + '/sitemap.xml', { encoding: 'identity' });
  const xml = sm.crudo.toString('utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());

  if (urls.length === 0) {
    fallo('/sitemap.xml', 'no devolvio ninguna <loc>');
  } else {
    console.log(`  ${urls.length} URLs, verificando...`);
    // Contra local, reapuntar las URLs de prod que genera el sitemap.
    const objetivos = esProd ? urls : urls.map(u => BASE + new URL(u).pathname);
    const rotas = [];
    await enTandas(objetivos, async u => {
      try {
        const r = await pedir(u);
        if (r.status !== 200) rotas.push(`${u} → HTTP ${r.status}`);
      } catch (e) {
        rotas.push(`${u} → ${e.message}`);
      }
    });
    if (rotas.length === 0) ok(`las ${urls.length} URLs del sitemap responden 200`);
    else for (const r of rotas) fallo('URL del sitemap', r);
  }
} else {
  notas.push('Sitemap salteado por --rapido.');
}

// ── 6. Peso real del HTML ───────────────────────────────────────────────────

console.log('\nPeso de la home');
const kb = n => `${(n / 1024).toFixed(1)} KB`;
const comprimido = await pedir(BASE + '/');
const plano = await pedir(BASE + '/', { encoding: 'identity' });
const cod = comprimido.headers['content-encoding'] || 'sin comprimir';
console.log(`  ${kb(comprimido.bytes)} en el cable (${cod}) — ${kb(plano.bytes)} sin comprimir`);
if (!comprimido.headers['content-encoding']) {
  fallo('compresion', 'el server devolvio la home sin comprimir');
}

// ── Informe ─────────────────────────────────────────────────────────────────

for (const n of notas) console.log(`\nNota: ${n}`);

if (fallos.length === 0) {
  console.log('\nTodo verde.');
  process.exit(0);
}
console.log(`\n${fallos.length} falla(s):`);
for (const f of fallos) console.log(`  - ${f}`);
process.exit(1);
