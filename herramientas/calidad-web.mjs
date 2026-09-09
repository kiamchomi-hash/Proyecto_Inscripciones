#!/usr/bin/env node
// Auditoría repetible del navegador. No envía formularios ni eventos a producción.
import { chromium, firefox, webkit } from 'playwright';
import axe from 'axe-core';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BASE_PROD, RUTAS } from '../lib/vigilancia-esperado.ts';
import { NUMERO_CAU } from '../lib/whatsapp.ts';

const args = process.argv.slice(2);
const opcion = (n, d) => args.find(a => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
const base = opcion('base', BASE_PROD).replace(/\/$/, '');
const esLocal = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname);
const motor = opcion('navegador', 'chromium');
assert.ok(['chromium', 'firefox', 'webkit'].includes(motor), 'Navegador desconocido');
const rutas = opcion('rutas', RUTAS.filter(r => !/\.(xml|txt)$/.test(r)).join(',')).split(',');
if (!args.some(a => a.startsWith('--rutas='))) {
  const r = await fetch(base + '/sitemap.xml', { signal: AbortSignal.timeout(30000) });
  assert.ok(r.ok, 'No se pudo descubrir las páginas dinámicas');
  const xml = await r.text();
  const publicadas = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
  for (const prefijo of ['/carreras/', '/clases-apoyo/', '/novedades/articulo/']) {
    const ruta = publicadas.find(r => r.startsWith(prefijo));
    assert.ok(ruta, `Falta una página de muestra de ${prefijo}`);
    rutas.push(ruta);
  }
}
const anchos = opcion('anchos', '360,390,768,1440').split(',').map(Number);
assert.ok(anchos.every(n => Number.isInteger(n) && n >= 320), 'Anchos inválidos');
const registrar = args.includes('--registrar-visual');
const visual = registrar || args.includes('--visual');
const simular = args.includes('--simular-formularios');
assert.ok(!simular || esLocal, 'La simulación de formularios sólo se permite en localhost');
const salida = path.resolve('output/playwright/calidad', new Date().toISOString().replace(/[:.]/g, '-'));
const bases = path.resolve('herramientas/visuales', `${process.platform}-${motor}`);
await mkdir(salida, { recursive: true });
const resultados = [];
const informe = { fecha: new Date().toISOString(), base, motor, anchos, salida, resultados,
  limites: ['Axe no certifica conformidad WCAG.', 'Captcha e iframes externos requieren revisión humana.',
    'Los recorridos no verifican entrega real a WhatsApp ni Telegram.', 'Métricas de laboratorio sin emulación de red móvil.'] };
async function comprobar(nombre, fn) {
  try { const detalle = await fn(); resultados.push({ nombre, estado: 'ok', detalle }); console.log(`ok: ${nombre}`); }
  catch (e) { resultados.push({ nombre, estado: 'fallo', detalle: e.message }); console.log(`FALLA: ${nombre}: ${e.message.slice(0, 240)}`); }
}
const browser = await ({ chromium, firefox, webkit }[motor]).launch();
informe.version = browser.version();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', serviceWorkers: 'block' });
// Interceptar antes de navegar: headless por sí solo no garantiza que no se mida.
await context.route('**/*', async route => {
  const req = route.request(), u = new URL(req.url());
  // WebKit también eleva localhost a HTTPS por esta directiva. La app local
  // sirve HTTP: se retira sólo ese upgrade en el documento de prueba, conservando
  // el resto de la CSP. Producción y smoke comprueban la cabecera original.
  if (esLocal && req.isNavigationRequest() && u.origin === new URL(base).origin) {
    try {
      const respuesta = await route.fetch();
      const headers = respuesta.headers();
      if (headers['content-security-policy']) headers['content-security-policy'] = headers['content-security-policy'].replace(/(?:^|;\s*)upgrade-insecure-requests(?=;|$)/g, '');
      return await route.fulfill({ response: respuesta, headers });
    } catch { return route.abort('failed').catch(() => {}); }
  }
  // Las claves reales de Turnstile rechazan localhost. No se simula su validación.
  if (esLocal && u.hostname === 'challenges.cloudflare.com') return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  if (u.pathname.startsWith('/_vercel/') || /google-analytics|googletagmanager|vercel-insights|vercel-scripts/.test(u.hostname) || u.pathname.startsWith('/api/track-')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method()) && u.origin === new URL(base).origin) return route.abort('blockedbyclient');
  return route.continue();
});
await context.addInitScript(() => {
  window.__calidad = { lcp: 0, cls: 0, tareasLargas: 0 };
  for (const [tipo, campo] of [['largest-contentful-paint', 'lcp'], ['layout-shift', 'cls'], ['longtask', 'tareasLargas']]) {
    if (!PerformanceObserver.supportedEntryTypes.includes(tipo)) continue;
    new PerformanceObserver(lista => { for (const e of lista.getEntries()) {
      if (campo === 'lcp') window.__calidad.lcp = e.startTime;
      else if (campo === 'cls' && !e.hadRecentInput) window.__calidad.cls += e.value;
      else if (campo === 'tareasLargas') window.__calidad.tareasLargas += e.duration;
    } }).observe({ type: tipo, buffered: true });
  }
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
let errores = [];
page.on('pageerror', e => errores.push(e.message));
page.on('requestfailed', r => {
  if (new URL(r.url()).host !== new URL(base).host) return;
  const motivo = r.failure()?.errorText ?? 'sin detalle';
  if (!/abort|cancel|NS_BINDING_ABORTED/i.test(motivo)) errores.push(`${r.resourceType()} ${new URL(r.url()).pathname}: ${motivo}`);
});
page.on('response', r => {
  if (new URL(r.url()).host === new URL(base).host && r.status() >= 400 && ['script', 'stylesheet', 'image'].includes(r.request().resourceType())) errores.push(`${r.status()} ${new URL(r.url()).pathname}`);
});
async function abrir(ruta) {
  errores = [];
  const r = await page.goto(base + ruta, { waitUntil: 'load', timeout: 60000 });
  assert.equal(r.status(), 200, `HTTP de ${ruta}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}
async function accesibilidad(nombre) {
  await comprobar(nombre, async () => {
    await page.evaluate(axe.source);
    const r = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
      return { violaciones: r.violations.map(v => ({ id: v.id, impacto: v.impact, ayuda: v.helpUrl, nodos: v.nodes.map(n => ({ selector: n.target, detalle: n.failureSummary })) })), incompletos: r.incomplete.map(v => ({ id: v.id, nodos: v.nodes.map(n => n.target) })) };
    });
    await writeFile(path.join(salida, nombre.replace(/[^a-z0-9]/gi, '_') + '.json'), JSON.stringify(r, null, 2));
    assert.equal(r.violaciones.length, 0, JSON.stringify(r.violaciones));
    return { revisionManual: r.incompletos.length };
  });
}
try {
  for (const ruta of rutas) {
    await comprobar(`carga ${ruta}`, () => abrir(ruta));
    if (resultados.at(-1).estado !== 'ok') continue;
    for (const width of anchos) {
      await page.setViewportSize({ width, height: 900 });
      // Esperar el final de las transiciones de tamaño: a mitad del resize un
      // ancho interpolado no representa el estado final del dispositivo.
      await page.waitForTimeout(2500);
      await comprobar(`desbordes ${ruta} ${width}`, async () => {
        await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1, null, { timeout: 5000 }).catch(() => {});
        const d = await page.evaluate(() => ({ ancho: innerWidth, documento: document.documentElement.scrollWidth,
          elementos: [...document.querySelectorAll('main *, header *, footer *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(e).position !== 'absolute'; }).slice(0, 8).map(e => e.tagName + '.' + e.className) }));
        assert.ok(d.documento <= d.ancho + 1, JSON.stringify(d));
      });
      if (width === anchos[0] || width === anchos.at(-1)) await accesibilidad(`accesibilidad ${ruta} ${width}`);
      if (visual) await comprobar(`visual ${ruta} ${width}`, async () => {
        const nombre = `${ruta.replace(/\W/g, '_') || 'home'}-${width}.png`;
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 900) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(800);
        const actual = await page.screenshot({ path: path.join(salida, nombre), animations: 'disabled', fullPage: true, timeout: 60000, mask: [page.locator('iframe'), page.locator('canvas'), page.locator('video')] });
        if (registrar) {
          await mkdir(bases, { recursive: true }); await writeFile(path.join(bases, nombre), actual);
          return 'Referencia registrada explícitamente; requiere revisión visual.';
        }
        let anterior;
        try { anterior = await readFile(path.join(bases, nombre)); } catch { throw new Error('Falta referencia visual revisada. Usar --registrar-visual y revisar las PNG antes de comparar.'); }
        const a = await sharp(actual).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const b = await sharp(anterior).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.equal(a.info.width, b.info.width, 'Cambió el ancho'); assert.equal(a.info.height, b.info.height, 'Cambió el alto');
        const diff = Buffer.alloc(a.data.length);
        const n = pixelmatch(a.data, b.data, diff, a.info.width, a.info.height, { threshold: 0.15 });
        await sharp(diff, { raw: a.info }).png().toFile(path.join(salida, `diferencia-${nombre}`));
        assert.ok(n / (a.info.width * a.info.height) < 0.005, `Cambió ${(100 * n / (a.info.width * a.info.height)).toFixed(2)}% de los píxeles`);
      });
    }
    await comprobar(`JavaScript ${ruta}`, () => assert.deepEqual(errores, []));
    await comprobar(`captura ${ruta}`, () => page.screenshot({ path: path.join(salida, `${ruta.replace(/\W/g, '_') || 'home'}.png`), fullPage: false }).then(() => undefined));
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await comprobar(`catálogo y modal ${width}`, async () => {
      await abrir('/');
      const buscar = page.getByRole('textbox', { name: 'Buscar carrera', exact: true });
      await buscar.fill('Abogacía');
      const enlace = page.getByRole('link', { name: 'Ver detalles de Abogacía', exact: true });
      await enlace.waitFor(); await enlace.click();
      const dialogo = page.getByRole('dialog'); await dialogo.waitFor();
      await page.keyboard.press('Tab');
      assert.ok(await dialogo.evaluate(e => e.contains(document.activeElement)), 'El foco quedó fuera del modal');
      await page.keyboard.press('Escape'); await dialogo.waitFor({ state: 'hidden' });
      assert.equal(new URL(page.url()).pathname, '/', 'No volvió a la ruta del catálogo');
    });
    await comprobar(`FAQ: teclado y retorno del foco ${width}`, async () => {
      await abrir('/faq');
      const boton = page.getByRole('button', { name: 'Hacer una pregunta', exact: true }).first();
      await boton.click(); const d = page.getByRole('dialog', { name: 'Hacé tu pregunta' }); await d.waitFor();
      await page.getByLabel('Título', { exact: false }).fill('Consulta de prueba local');
      for (let i = 0; i < 12; i++) { await page.keyboard.press('Shift+Tab'); assert.ok(await d.evaluate(e => e.contains(document.activeElement)), 'El foco escapó del diálogo'); }
      await accesibilidad(`accesibilidad diálogo FAQ ${width}`);
      await page.keyboard.press('Escape'); await d.waitFor({ state: 'hidden' });
      assert.ok(await boton.evaluate(e => e === document.activeElement), 'No devolvió el foco');
    });
    await comprobar(`contacto y WhatsApp ${width}`, async () => {
      await abrir('/contacto');
      for (const [campo, valor] of [['Nombre', 'Ana'], ['Apellido', 'Prueba'], ['Email', 'ana@example.test'], ['Teléfono', '1123456789'], ['Localidad', 'Lugano']]) {
        const input = page.getByLabel(campo, { exact: true }); await input.fill(valor); assert.equal(await input.inputValue(), valor);
      }
      assert.ok(await page.locator(`a[href*="wa.me/${NUMERO_CAU}"]`).count() > 0, 'Falta el enlace al CAU');
    });
  }
  if (simular) await comprobar('formulario: error, reintento y conversión sin escritura real', async () => {
    await context.addInitScript(() => {
      window.__eventosPrueba = [];
      window.va = (...args) => window.__eventosPrueba.push(args);
      window.turnstile = { render: (_el, opciones) => { setTimeout(() => opciones.callback('simulado-solo-local'), 20); return 'prueba'; }, remove() {} };
    });
    let intentos = 0;
    await page.route('**/api/formularios', r => {
      intentos++;
      return r.fulfill({ status: intentos === 1 ? 500 : 201, json: intentos === 1 ? { error: 'fallo simulado' } : { ok: true } });
    });
    await abrir('/contacto');
    await page.getByLabel('Email', { exact: true }).fill('prueba@example.test');
    const enviar = page.getByRole('button', { name: 'Enviar consulta', exact: true });
    await enviar.click();
    await page.getByText('Hubo un error al enviar.', { exact: false }).waitFor();
    assert.equal(await page.evaluate(() => window.__eventosPrueba.filter(e => e[0] === 'event' && e[1]?.name === 'consulta').length), 0, 'El error se midió como conversión');
    await enviar.click();
    await page.getByText('Consulta enviada', { exact: false }).waitFor();
    assert.equal(intentos, 2);
    assert.equal(await page.evaluate(() => window.__eventosPrueba.filter(e => e[0] === 'event' && e[1]?.name === 'consulta').length), 1, 'No se midió exactamente una conversión');
    await page.unroute('**/api/formularios');
  });
  if (motor === 'chromium') await comprobar('presupuestos de rendimiento (mediana de tres cargas)', async () => {
    const muestras = [];
    for (let i = 0; i < 3; i++) {
      await page.setViewportSize({ width: 390, height: 844 }); await abrir('/'); await page.waitForTimeout(2000);
      muestras.push(await page.evaluate(() => ({ ...window.__calidad, js: performance.getEntriesByType('resource').filter(e => /\.js(?:\?|$)/.test(e.name)).reduce((s, e) => s + e.encodedBodySize, 0) })));
    }
    informe.rendimiento = muestras;
    const mediana = k => muestras.map(m => m[k]).sort((a, b) => a - b)[1];
    assert.ok(mediana('lcp') > 0, 'No se pudo medir LCP');
    assert.ok(mediana('lcp') <= 4000, `LCP ${mediana('lcp')} ms > 4000`);
    assert.ok(mediana('cls') <= 0.1, `CLS ${mediana('cls')} > 0.1`);
    assert.ok(mediana('js') <= 1500000, `JavaScript ${mediana('js')} bytes > 1500000`);
    return muestras;
  });
} finally {
  await browser.close();
  await mkdir('.agents/reports', { recursive: true });
  const json = JSON.stringify(informe, null, 2);
  await writeFile(path.join(salida, 'informe.json'), json);
  await writeFile('.agents/reports/web-quality.json', json);
}
process.exitCode = resultados.some(r => r.estado !== 'ok') ? 1 : 0;
