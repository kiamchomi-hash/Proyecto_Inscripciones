import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import {
  arrancarNext, esperarHttp, matarGrupo, nextEnEjecucion, NEXT, puertoLibre, stubSupabase,
} from './helpers/servidores.mjs';
import { sqlCatalogo } from './fixtures/catalogo-home.mjs';
import { CAMPOS, camposDe } from '../../components/formularios/casas.ts';
import { leerReferenciaVisual } from './helpers/bandas-webp.mjs';
import sharp from 'sharp';

// E2E real con Chromium (Playwright de la raíz) sobre los dos servidores en
// loopback: el build de Astro en `wrangler dev` y el Next del sitio en
// `next dev` con el stub de PostgREST. No hay pedidos a hosts externos: el
// script de Turnstile se intercepta y se responde con un doble local.
//
// Cubre lo que el HTML no puede probar: las fuentes realmente cargadas, las
// imágenes que el navegador dibuja (natural, proporción, alt) —en lugar de
// comparar `srcset`—, capturas escritorio/móvil comparadas con tolerancia y
// los tres estados del widget de Turnstile.
//
// Requisitos, con fallo explícito (nunca un pase silencioso):
// - build de Astro (`npm --prefix cloudflare run build`) → `dist/server/wrangler.json`
// - Next instalado en la raíz
// - Playwright y un Chromium descargado (`npx playwright install chromium`)
// - ningún `next dev` del sitio corriendo (pelearían por `.next`)
//
// El servidor de Astro se levanta con `wrangler dev` y no con el harness porque
// el navegador necesita un puerto real. El D1 se siembra en un directorio
// efímero de `.local/` con el mismo fixture de la paridad.

const PAQUETE = fileURLToPath(new URL('../', import.meta.url));
const CONFIG = 'dist/server/wrangler.json';
const WRANGLER = join(PAQUETE, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const LOCAL = join(PAQUETE, '.local');
const CAPTURAS = join(LOCAL, 'capturas');
const REFERENCIAS = join(PAQUETE, 'tests', 'fixtures', 'visuales-next');

/** Tolerancia de la comparación visual: píxeles y distancia media por canal. */
const TOLERANCIA_PIXELES = 2; // % de píxeles con algún canal a más de 32
const TOLERANCIA_MEDIA = 2;   // diferencia media (0–255) sumando los canales

/** CSS viewport + DPR 1 en los dos perfiles: las capturas se comparan 1:1. */
const PERFILES = [
  { id: 'escritorio', viewport: { width: 1440, height: 900 } },
  { id: 'movil', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
];

const URL_WIDGET = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const DOBLE_TURNSTILE = `
  (() => {
    window.__turnstile = { render: [], remove: [] };
    window.turnstile = {
      render(contenedor, opciones) {
        window.__turnstile.render.push({ size: opciones.size, sitekey: opciones.sitekey });
        const iframe = document.createElement('iframe');
        iframe.setAttribute('title', 'Turnstile simulado');
        iframe.addEventListener('load', () => {
          setTimeout(() => opciones.callback('token-e2e'), 0);
        });
        contenedor.appendChild(iframe);
        iframe.src = 'about:blank';
        return 'widget-' + window.__turnstile.render.length;
      },
      remove(id) { window.__turnstile.remove.push(id); },
    };
  })();
`;

function entornoHijo(extra = {}) {
  const env = {};
  for (const clave of ['PATH', 'HOME', 'LANG', 'TZ', 'XDG_CACHE_HOME', 'XDG_CONFIG_HOME', 'TMPDIR', 'SYSTEMROOT']) {
    if (process.env[clave] !== undefined) env[clave] = process.env[clave];
  }
  return {
    ...env,
    CI: '1',
    ASTRO_TELEMETRY_DISABLED: '1',
    WRANGLER_SEND_METRICS: 'false',
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false',
    CLOUDFLARE_INCLUDE_PROCESS_ENV: 'false',
    ...extra,
  };
}

function wrangler(args) {
  const resultado = spawnSync(process.execPath, [WRANGLER, ...args], {
    cwd: PAQUETE, env: entornoHijo(), encoding: 'utf8',
  });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) {
    throw new Error(`wrangler ${args.slice(0, 2).join(' ')} falló (${resultado.status}):\n${resultado.stdout}\n${resultado.stderr}`);
  }
  return resultado;
}

/** Crea un D1 efímero con el esquema aplicado y el catálogo sintético. */
function prepararBase(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(LOCAL, { recursive: true });
  wrangler(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', dir, '--config', 'wrangler.json']);
  const sql = join(LOCAL, 'e2e-catalogo.sql');
  writeFileSync(sql, sqlCatalogo());
  wrangler(['d1', 'execute', 'DB', '--local', '--persist-to', dir, '--config', 'wrangler.json', '--file', sql]);
}

function arrancarAstro({ puerto, persist, vars = {} }) {
  const args = [
    'dev', '--config', CONFIG, '--persist-to', persist,
    '--ip', '127.0.0.1', '--port', String(puerto),
    // Tres servidores arrancan casi a la vez y el inspector tiene 9229 fijo:
    // sin esto uno de ellos muere con «Address already in use».
    // 0 deja que el sistema elija uno libre; nadie se conecta al inspector.
    '--inspector-port', '0',
    '--show-interactive-dev-session=false', '--log-level', 'warn',
  ];
  for (const [clave, valor] of Object.entries(vars)) args.push('--var', `${clave}:${valor}`);
  const hijo = spawn(process.execPath, [WRANGLER, ...args], {
    cwd: PAQUETE, detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: entornoHijo(),
  });
  let registro = '';
  hijo.stdout.on('data', dato => { registro += dato; });
  hijo.stderr.on('data', dato => { registro += dato; });
  return { registro: () => registro, detener: () => matarGrupo(hijo) };
}

/** Varios puertos libres a la vez: pedirlos en serie puede devolver el mismo. */
async function puertosLibres(cantidad) {
  const puertos = new Set();
  while (puertos.size < cantidad) puertos.add(await puertoLibre());
  return [...puertos];
}

/**
 * Playwright es dependencia de la raíz: se importa después de apuntar
 * `PLAYWRIGHT_BROWSERS_PATH` a la caché real, porque el runner de las pruebas
 * aísla `HOME`. Si falta cualquiera de las dos piezas, se falla con la
 * instrucción concreta en vez de saltear la prueba.
 */
async function importarPlaywright() {
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
    const candidatos = [
      join(os.userInfo().homedir, '.cache', 'ms-playwright'),
      process.env.HOME ? join(process.env.HOME, '.cache', 'ms-playwright') : null,
    ].filter(Boolean);
    const encontrado = candidatos.find(ruta => existsSync(ruta));
    assert.ok(encontrado,
      'No se encontró la caché de navegadores de Playwright. Instalarla con `npx playwright install chromium`.');
    process.env.PLAYWRIGHT_BROWSERS_PATH = encontrado;
  }
  let playwright;
  try {
    playwright = await import('playwright');
  } catch (error) {
    assert.fail(`Falta Playwright en la raíz (npm install). Detalle: ${error.message}`);
  }
  const ejecutable = playwright.chromium.executablePath();
  assert.ok(ejecutable && existsSync(ejecutable),
    `Playwright no tiene el Chromium de su versión (${ejecutable}).`
    + ' Instalarlo con `npx playwright install chromium`.');
  return playwright;
}

/** Baja hasta el fondo y vuelve arriba: dispara las imágenes lazy y los efectos. */
async function recorrer(pagina) {
  await pagina.evaluate(async () => {
    await new Promise(resolver => {
      let y = 0;
      const paso = 600;
      const temporizador = setInterval(() => {
        window.scrollTo(0, y);
        y += paso;
        if (y >= document.body.scrollHeight) {
          clearInterval(temporizador);
          resolver();
        }
      }, 40);
    });
  });
  await pagina.waitForTimeout(400);
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForTimeout(200);
}

async function abrirPagina(navegador, base, opciones = {}) {
  const contexto = await navegador.newContext({
    viewport: opciones.viewport ?? { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'es-AR',
    hasTouch: opciones.hasTouch ?? false,
    isMobile: opciones.isMobile ?? false,
  });
  const pagina = await contexto.newPage();
  const externos = [];
  // Al cerrar un contexto puede quedar una imagen en vuelo: Playwright rechaza
  // el callback con "Request context disposed". Ese error es del cierre, no del
  // producto, así que se ignora sólo en ese caso; un fallo real sigue fallando.
  const enCierre = error =>
    /Request context disposed|context or browser has been closed|Target closed/i
      .test(String(error?.message ?? error));
  // Ningún pedido sale de loopback. Los pedidos a
  // Cloudflare de Turnstile se resuelven en la prueba que los necesita.
  await contexto.route(url => !['127.0.0.1', 'localhost'].includes(url.hostname), async ruta => {
    try {
      externos.push(ruta.request().url());
      await ruta.abort();
    } catch (error) {
      if (!enCierre(error)) throw error;
    }
  });
  // Workers Assets canoniza algunos nombres (p.ej. coma → %2C) con Location
  // https aunque wrangler dev sirva HTTP. Sólo ese salto local de imágenes se
  // transporta por HTTP; no se permite seguir redirects a ningún otro host.
  await contexto.route(url => url.hostname === '127.0.0.1'
    && url.port === new URL(base).port && url.pathname.startsWith('/imagenes/'), async ruta => {
    try {
      if (ruta.request().resourceType() !== 'image') return ruta.continue();
      const local = new URL(ruta.request().url()); local.protocol = 'http:';
      const rutaFetch = async destino => ruta.fetch({url:destino.href, maxRedirects:0});
      // El servidor local puede cerrar una conexión bajo la carga de /imagenes:
      // se reintenta el mismo GET local (nunca un host externo) y, si persiste, falla.
      const pedirLocal = async destino => {
        let ultimo;
        for (let intento = 0; intento < 3; intento += 1) {
          try {
            return await rutaFetch(destino);
          } catch (error) {
            if (!/ECONNRESET|ECONNREFUSED|socket hang up/i.test(String(error?.message ?? error))) throw error;
            ultimo = error;
            await new Promise(resolver => setTimeout(resolver, 100 * (intento + 1)));
          }
        }
        throw ultimo;
      };
      let respuesta = await pedirLocal(local);
      if ([301, 302, 307, 308].includes(respuesta.status())) {
        const destino = new URL(respuesta.headers().location, local);
        assert.equal(destino.hostname, local.hostname);
        assert.equal(destino.port, local.port);
        assert.ok(destino.pathname.startsWith('/imagenes/'));
        destino.protocol = 'http:';
        respuesta = await pedirLocal(destino);
      }
      assert.equal(respuesta.status(), 200, `asset canónico local ${local.pathname}`);
      await ruta.fulfill({response:respuesta});
    } catch (error) {
      if (!enCierre(error)) throw error;
    }
  });
  const respuestasMalas = [];
  pagina.on('requestfailed', pedido => {
    if (pedido.resourceType() === 'image') respuestasMalas.push(`${pedido.failure()?.errorText} ${pedido.url()}`);
  });
  pagina.on('response', respuesta => {
    if (respuesta.request().resourceType() === 'image' && respuesta.status() >= 400) {
      respuestasMalas.push(`${respuesta.status()} ${respuesta.url()}`);
    }
  });
  await pagina.goto(`${base}${opciones.ruta ?? '/'}`, { waitUntil: 'load', timeout: 120_000 });
  // El indicador de desarrollo de Next no forma parte del sitio.
  await pagina.addStyleTag({ content: 'nextjs-portal, [data-nextjs-dev-tools-button]{display:none!important}' });
  await pagina.evaluate(() => document.fonts.ready.then(() => true));
  await pagina.waitForFunction(() => [...document.querySelectorAll('astro-island')]
    .every(isla => !isla.hasAttribute('ssr')));
  if (opciones.ruta !== '/imagenes') {
    await recorrer(pagina);
    // Las fichas cargan el formulario diferido con IntersectionObserver. En la
    // primera visita de Next el módulo se compila y puede llegar después del
    // scroll: sin esta espera la captura mide la página sin los dos formularios
    // (3442 px en vez de 4472) y falla por «distinta medida».
    if (await esperarFormularioDiferido(pagina)) await recorrer(pagina);
  }
  return { contexto, pagina, externos, respuestasMalas };
}

/** Espera a que el hueco del formulario diferido se reemplace por los formularios. */
async function esperarFormularioDiferido(pagina) {
  const hayHueco = await pagina.evaluate(() => Boolean(document.querySelector('.deferred-enrollment-placeholder')));
  if (!hayHueco) return false;
  await pagina.waitForFunction(() => !document.querySelector('.deferred-enrollment-placeholder'),
    null, { timeout: 30_000 });
  return true;
}

async function capturarDocumento(navegador, pagina, ruta) {
  if (ruta !== '/imagenes') return pagina.screenshot({ fullPage: true, animations: 'disabled', timeout: 120_000 });
  // Las 293 imágenes originales exceden la caché de decodificación de Chromium:
  // cargar todas juntas deja huecos por presión de memoria. Capturamos bandas
  // después de decodificar sólo las visibles y las unimos sin escalar/recortar.
  // Sticky pasa a relative sólo durante la captura, para no repetirlo por banda.
  await pagina.addStyleTag({content: 'html{scroll-behavior:auto!important}.main-navbar,.bib__controles{position:relative!important;top:auto!important;transform:none!important}'});
  await pagina.evaluate(() => window.scrollTo({top:0, behavior:'instant'}));
  await pagina.evaluate(() => {
    // La hoja fija el marco con `aspect-ratio`: su alto ya es definitivo sin
    // cargar la imagen. Se congela acá y no después de bajar las 293 a la vez,
    // que era justo la presión de memoria que dejaba huecos de decodificación.
    for (const marco of document.querySelectorAll('.bib__marco')) {
      marco.style.height = `${marco.getBoundingClientRect().height}px`;
      marco.style.aspectRatio = 'auto';
    }
    for (const i of document.images) i.dataset.fuenteCaptura = i.getAttribute('src');
  });
  const ancho = pagina.viewportSize().width;
  const alto = await pagina.evaluate(() => document.documentElement.scrollHeight);
  const paso = pagina.viewportSize().height;
  const bandas = [];
  for (let y = 0; y < alto; y += paso) {
    await pagina.evaluate(y => window.scrollTo({top:y, behavior:'instant'}), y);
    const fallidas = await pagina.evaluate(async () => {
      const enBanda = i => {
        const r = i.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight;
      };
      const visibles = [...document.images].filter(enBanda);
      const errores = [];
      // Lotes chicos: doce originales de 1672 px decodificados en paralelo
      // agotan la caché de Chromium y `decode()` falla aunque el archivo sirva;
      // de a uno, las 293 imágenes no entran en el presupuesto del test.
      for (let n = 0; n < visibles.length; n += 4) {
        await Promise.all(visibles.slice(n, n + 4).map(async i => {
          try {
            const cargada = i.getAttribute('src') === i.dataset.fuenteCaptura
              && i.complete && i.naturalWidth > 0;
            if (!cargada) {
              await new Promise((resolver, rechazar) => {
                i.onload = resolver;
                i.onerror = () => rechazar(new Error('Falló la carga de la miniatura'));
                i.loading = 'eager';
                i.src = i.dataset.fuenteCaptura;
              });
            }
            await i.decode();
          } catch (error) {
            errores.push({src:i.getAttribute('src'), completa:i.complete, natural:i.naturalWidth,
              error:error.message, original:i.dataset.fuenteCaptura, pagina:location.href});
          }
        }));
      }
      // Recién después de decodificar la banda se liberan las que quedaron
      // fuera, y sólo si terminaron de cargar (nunca se corta una descarga).
      for (const i of document.images) {
        if (!enBanda(i) && i.complete && i.getAttribute('src')) i.removeAttribute('src');
      }
      return errores;
    });
    assert.deepEqual(fallidas, [], `imágenes sin decodificar en la banda ${y}`);
    await pagina.evaluate(() => new Promise(resolver => requestAnimationFrame(() => requestAnimationFrame(resolver))));
    const desplazamiento = await pagina.evaluate(() => scrollY);
    const png = await pagina.screenshot({ animations:'disabled' });
    bandas.push({y:desplazamiento, png:png.toString('base64')});
  }
  const lienzo = await navegador.newPage();
  try {
    const png = await lienzo.evaluate(async ({ancho, alto, bandas}) => {
      const canvas = document.createElement('canvas');
      canvas.width = ancho; canvas.height = alto;
      const ctx = canvas.getContext('2d');
      let cubierto = 0;
      for (const banda of bandas) {
        if (banda.y > cubierto) throw new Error(`Hueco entre bandas: ${cubierto} → ${banda.y}`);
        const img = new Image(); img.src = `data:image/png;base64,${banda.png}`;
        await img.decode(); ctx.drawImage(img, 0, banda.y);
        cubierto = Math.max(cubierto, banda.y + img.height);
      }
      if (cubierto < alto) throw new Error(`Captura incompleta: ${cubierto} de ${alto}`);
      return canvas.toDataURL('image/png').split(',')[1];
    }, {ancho, alto, bandas});
    return Buffer.from(png, 'base64');
  } finally { await lienzo.close(); }
}

/** Compara dos PNG con un canvas del propio Chromium: sin dependencias extra. */
async function compararCapturas(navegador, bufferA, bufferB, margenAlto = 0) {
  const pagina = await navegador.newPage();
  try {
    return await pagina.evaluate(async ({ a, b, margenAlto }) => {
      const cargar = fuente => new Promise((resolver, rechazar) => {
        const imagen = new Image();
        imagen.onload = () => resolver(imagen);
        imagen.onerror = () => rechazar(new Error('PNG ilegible'));
        imagen.src = `data:image/png;base64,${fuente}`;
      });
      const [imagenA, imagenB] = await Promise.all([cargar(a), cargar(b)]);
      const diferenciaAlto = Math.abs(imagenA.height - imagenB.height);
      if (imagenA.width !== imagenB.width || diferenciaAlto > margenAlto) {
        return {
          mismos: false,
          anchoA: imagenA.width, altoA: imagenA.height,
          anchoB: imagenB.width, altoB: imagenB.height,
        };
      }
      // Sólo /sobre-nosotros permite 1 px de redondeo por imágenes originales
      // frente a next/image. Sin escalar ni recortar: se agrega la fila faltante
      // transparente. Como ese redondeo puede aparecer a mitad de página (y
      // desplazar el resto 1 px), en esa ruta se compara cada píxel contra sus
      // vecinos verticales inmediatos: la diferencia de alto sigue acotada a 1
      // y cualquier corrimiento de 2 px o de contenido sigue fallando.
      const width = imagenA.width;
      const height = Math.max(imagenA.height, imagenB.height);
      const lienzo = document.createElement('canvas');
      lienzo.width = width;
      lienzo.height = height;
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imagenA, 0, 0);
      const datosA = ctx.getImageData(0, 0, width, height).data;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(imagenB, 0, 0);
      const datosB = ctx.getImageData(0, 0, width, height).data;
      const tolerarVertical = margenAlto > 0 && diferenciaAlto <= margenAlto;
      let distintos = 0;
      let suma = 0;
      if (!tolerarVertical) {
        for (let i = 0; i < datosA.length; i += 4) {
          const d = Math.max(
            Math.abs(datosA[i] - datosB[i]),
            Math.abs(datosA[i + 1] - datosB[i + 1]),
            Math.abs(datosA[i + 2] - datosB[i + 2]),
            Math.abs(datosA[i + 3] - datosB[i + 3]),
          );
          if (d > 32) distintos++;
          suma += d;
        }
      } else {
        const diferencia = (i, j) => Math.max(
          Math.abs(datosA[i] - datosB[j]),
          Math.abs(datosA[i + 1] - datosB[j + 1]),
          Math.abs(datosA[i + 2] - datosB[j + 2]),
          Math.abs(datosA[i + 3] - datosB[j + 3]),
        );
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const i = (y * width + x) * 4;
            let d = diferencia(i, i);
            if (d > 32) {
              for (const dy of [-1, 1]) {
                const vecino = (y + dy) * width + x;
                if (y + dy < 0 || y + dy >= height) continue;
                const j = vecino * 4;
                const dv = diferencia(i, j);
                if (dv < d) d = dv;
              }
            }
            if (d > 32) distintos++;
            suma += d;
          }
        }
      }
      const pixeles = datosA.length / 4;
      return {
        mismos: true, ancho: width, alto: height, diferenciaAlto,
        porcentaje: (distintos / pixeles) * 100, media: suma / pixeles,
      };
    }, { a: bufferA.toString('base64'), b: bufferB.toString('base64'), margenAlto });
  } finally {
    await pagina.close();
  }
}

test('e2e de navegador: fuentes, imágenes, capturas y Turnstile', { timeout: 2_400_000 }, async t => {
  assert.ok(existsSync(join(PAQUETE, CONFIG)),
    'Falta el build de Astro: correr `npm --prefix cloudflare run build` antes de test:e2e.');
  assert.ok(existsSync(NEXT),
    'Falta Next en la raíz: el e2e necesita el sitio vigente instalado.');
  assert.ok(existsSync(WRANGLER), 'Falta Wrangler en cloudflare/node_modules: correr `npm --prefix cloudflare ci`.');
  assert.ok(!nextEnEjecucion(),
    `Hay un \`next dev\` del sitio corriendo (PID ${nextEnEjecucion()}). Cerrarlo antes de test:e2e.`);

  const { chromium } = await importarPlaywright();

  const supabase = await stubSupabase();
  const dirs = {
    sinClave: join(LOCAL, 'e2e-d1-sin-clave'),
    conClave: join(LOCAL, 'e2e-d1-con-clave'),
    demo: join(LOCAL, 'e2e-d1-demo'),
  };
  for (const dir of Object.values(dirs)) prepararBase(dir);

  const [puertoNext, puertoSin, puertoCon, puertoDemo] = await puertosLibres(4);
  const next = arrancarNext({ puerto: puertoNext, supabase });
  const sin = arrancarAstro({ puerto: puertoSin, persist: dirs.sinClave });
  const con = arrancarAstro({
    puerto: puertoCon, persist: dirs.conClave,
    vars: { PUBLIC_TURNSTILE_SITE_KEY: 'clave-e2e' },
  });
  const demo = arrancarAstro({
    puerto: puertoDemo, persist: dirs.demo,
    vars: { FORMULARIOS_DEMO: '1' },
  });
  const servidores = { next, sin, con, demo };

  const navegador = await chromium.launch();
  t.after(async () => {
    await navegador.close().catch(() => {});
    for (const servidor of Object.values(servidores)) servidor.detener();
    await supabase.cerrar();
  });

  const bases = {
    next: `http://127.0.0.1:${puertoNext}`,
    sin: `http://127.0.0.1:${puertoSin}`,
    con: `http://127.0.0.1:${puertoCon}`,
    demo: `http://127.0.0.1:${puertoDemo}`,
  };
  for (const [nombre, base] of Object.entries(bases)) {
    try {
      const respuesta = await esperarHttp(`${base}/`, 240_000);
      assert.equal(respuesta.status, 200, `${nombre} respondió ${respuesta.status}`);
    } catch (error) {
      throw new Error(`${nombre} no arrancó: ${error.message}\n--- registro ---\n${
        servidores[nombre].registro().slice(-4000)}`);
    }
  }

  await t.test('el comparador rechaza una alteración y respeta el margen vertical', async () => {
    const imagen = (alto, color) => sharp({ create: { width: 100, height: alto, channels: 4, background: color } }).png().toBuffer();
    const original = await imagen(100, '#000000');
    const alterada = await imagen(100, '#ffffff');
    const distinto = await compararCapturas(navegador, original, alterada);
    assert.ok(distinto.porcentaje > TOLERANCIA_PIXELES);
    assert.ok(distinto.media > TOLERANCIA_MEDIA);
    const unPixel = await imagen(101, '#000000');
    assert.equal((await compararCapturas(navegador, original, unPixel)).mismos, false);
    assert.equal((await compararCapturas(navegador, original, unPixel, 1)).mismos, true);
    assert.equal((await compararCapturas(navegador, original, await imagen(102, '#000000'), 1)).mismos, false);
  });

  await t.test('las fuentes son las de Next, cargadas y sin fallback del sistema', async () => {
    const metricas = {};
    const declaradas = {};
    for (const [nombre, base] of [['next', bases.next], ['astro', bases.sin]]) {
      const { contexto, pagina, externos } = await abrirPagina(navegador, base);
      const datos = await pagina.evaluate(async () => {
        const medir = async (familia, peso) => {
          // La muestra fuerza la carga del peso; recién después se mide.
          await document.fonts.load(`${peso} 24px ${familia}`);
          await document.fonts.ready;
          const muestra = document.createElement('span');
          muestra.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font-family:'${familia}',monospace;font-weight:${peso};font-size:24px`;
          muestra.textContent = 'Inscripciones 2027 áéíóúñ';
          document.body.appendChild(muestra);
          const ancho = muestra.getBoundingClientRect().width;
          muestra.remove();
          return ancho;
        };
        const familias = [...document.fonts]
          .map(cara => ({
            familia: cara.family.replace(/["']/g, ''),
            peso: cara.weight,
            estado: cara.status,
          }))
          .filter(cara => ['Inter', 'Unbounded'].includes(cara.familia));
        return {
          inter400: await medir('Inter', 400),
          inter700: await medir('Inter', 700),
          unbounded600: await medir('Unbounded', 600),
          unbounded900: await medir('Unbounded', 900),
          interCargada: document.fonts.check('400 24px Inter'),
          interNegritaCargada: document.fonts.check('700 24px Inter'),
          unboundedCargada: document.fonts.check('600 24px Unbounded'),
          cuerpo: getComputedStyle(document.body).fontFamily,
          familias,
          recursos: performance.getEntriesByType('resource')
            .map(entrada => entrada.name)
            .filter(nombre => /\.woff2?($|\?)/.test(nombre)),
        };
      });
      for (const clave of ['interCargada', 'interNegritaCargada', 'unboundedCargada']) {
        assert.equal(datos[clave], true, `${nombre}: la fuente no está cargada (${clave})`);
      }
      assert.match(datos.cuerpo, /Inter/, `${nombre}: el cuerpo no usa Inter`);
      assert.ok(datos.recursos.length >= 2, `${nombre}: no se descargó ningún .woff2`);
      // Ni Next ni Astro piden nada externo: la analítica es local.
      assert.deepEqual(externos, [],
        `${nombre}: pedidos externos inesperados`);
      metricas[nombre] = datos;
      // Next declara una cara por subconjunto y peso; se comparan las
      // combinaciones familia/peso, no la cantidad de archivos.
      declaradas[nombre] = [...new Set(datos.familias
        .map(cara => `${cara.familia}:${cara.peso}`))].sort();
      await contexto.close();
    }

    // Mismas familias y pesos declarados que el sitio: si falta uno, el
    // navegador lo sintetiza o cae al fallback.
    assert.deepEqual(declaradas.astro, declaradas.next,
      `las caras declaradas difieren: Astro ${declaradas.astro.join(', ')} vs Next ${declaradas.next.join(', ')}`);
    assert.ok(declaradas.next.includes('Inter:100 900'), 'Next declara Inter variable');
    for (const peso of ['400', '600', '700', '800', '900']) {
      assert.ok(declaradas.astro.includes(`Unbounded:${peso}`), `falta Unbounded ${peso}`);
    }

    for (const clave of ['inter400', 'inter700', 'unbounded600', 'unbounded900']) {
      const a = metricas.next[clave];
      const b = metricas.astro[clave];
      assert.ok(a > 100 && b > 100, `${clave}: muestra vacía`);
      const diferencia = Math.abs(a - b) / a;
      assert.ok(diferencia < 0.005,
        `${clave}: la métrica difiere ${(diferencia * 100).toFixed(2)}% entre Next (${a}) y Astro (${b}): no es la misma fuente`);
    }
    t.diagnostic(`fuentes: ${metricas.astro.familias.length} caras declaradas iguales en las dos puntas`);
  });

  await t.test('las imágenes se verifican por render, no por srcset', async () => {
    const medir = pagina => pagina.evaluate(() => [...document.querySelectorAll('img')].map(imagen => {
      const caja = imagen.getBoundingClientRect();
      return {
        alt: imagen.getAttribute('alt'),
        natural: [imagen.naturalWidth, imagen.naturalHeight],
        caja: [Math.round(caja.width), Math.round(caja.height)],
        completa: imagen.complete,
        visible: caja.width > 0 && caja.height > 0,
      };
    }));

    const nextPagina = await abrirPagina(navegador, bases.next, { viewport: PERFILES[0].viewport });
    const astroPagina = await abrirPagina(navegador, bases.sin, { viewport: PERFILES[0].viewport });
    const a = await medir(nextPagina.pagina);
    const b = await medir(astroPagina.pagina);

    for (const [nombre, lista, abierta] of [
      ['Next', a, nextPagina], ['Astro', b, astroPagina],
    ]) {
      assert.deepEqual(abierta.respuestasMalas, [], `${nombre}: imágenes con respuesta de error`);
      const visibles = lista.filter(imagen => imagen.visible);
      assert.ok(visibles.length >= 3,
        `${nombre}: se esperaban al menos 3 imágenes visibles, hay ${visibles.length}`);
      for (const imagen of visibles) {
        assert.equal(imagen.completa, true, `${nombre}: imagen sin terminar (${imagen.alt})`);
        assert.ok(imagen.natural[0] > 0 && imagen.natural[1] > 0,
          `${nombre}: imagen que no cargó (${imagen.alt})`);
        assert.notEqual(imagen.alt, null, `${nombre}: imagen sin atributo alt`);
        const proporcionNatural = imagen.natural[0] / imagen.natural[1];
        const proporcionCaja = imagen.caja[0] / imagen.caja[1];
        assert.ok(Math.abs(proporcionNatural - proporcionCaja) / proporcionNatural < 0.05,
          `${nombre}: proporción deformada en «${imagen.alt}» (natural ${proporcionNatural.toFixed(3)}, caja ${proporcionCaja.toFixed(3)})`);
      }
    }

    assert.equal(a.length, b.length, 'distinta cantidad de <img> en la home');
    for (let i = 0; i < a.length; i++) {
      assert.equal(a[i].alt, b[i].alt, `img ${i}: distinto alt`);
      if (!a[i].visible) continue;
      assert.deepEqual(a[i].caja, b[i].caja, `img ${i} (${a[i].alt}): la caja renderizada difiere`);
      const proporcionA = a[i].natural[0] / a[i].natural[1];
      const proporcionB = b[i].natural[0] / b[i].natural[1];
      assert.ok(Math.abs(proporcionA - proporcionB) < 0.01,
        `img ${i} (${a[i].alt}): distinta proporción entre las dos puntas`);
    }
    t.diagnostic(`imágenes: ${a.filter(imagen => imagen.visible).length} visibles verificadas por render`);
    await nextPagina.contexto.close();
    await astroPagina.contexto.close();
  });

  await t.test('capturas de escritorio y móvil, comparadas con tolerancia', async () => {
    mkdirSync(CAPTURAS, { recursive: true });
    const sello = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const salida = join(CAPTURAS, sello);
    mkdirSync(salida, { recursive: true });
    const resultados = [];

    for (const perfil of PERFILES) {
      const capturas = {};
      for (const [nombre, base] of [['next', bases.next], ['astro', bases.sin]]) {
        const { contexto, pagina } = await abrirPagina(navegador, base, perfil);
        const archivo = join(salida, `home-${perfil.id}-${nombre}.png`);
        capturas[nombre] = await pagina.screenshot({ fullPage: true, animations: 'disabled' });
        writeFileSync(archivo, capturas[nombre]);
        await contexto.close();
      }
      const comparacion = await compararCapturas(navegador, capturas.next, capturas.astro);
      const referencia = await leerReferenciaVisual(REFERENCIAS, `home-${perfil.id}`);
      const estable = await compararCapturas(navegador, referencia, capturas.astro);
      assert.equal(estable.mismos, true, `home ${perfil.id}: referencia de distinta medida`);
      assert.ok(estable.porcentaje <= TOLERANCIA_PIXELES && estable.media <= TOLERANCIA_MEDIA,
        `home ${perfil.id}: no coincide con la referencia visual`);
      assert.equal(comparacion.mismos, true,
        `${perfil.id}: las capturas tienen distinta medida (${comparacion.anchoA}x${comparacion.altoA} vs ${comparacion.anchoB}x${comparacion.altoB})`);
      assert.ok(comparacion.alto > 1500,
        `${perfil.id}: la captura quedó demasiado baja (${comparacion.alto}px); ¿la home está vacía?`);
      resultados.push({ perfil: perfil.id, ...comparacion });
      t.diagnostic(`${perfil.id}: ${comparacion.porcentaje.toFixed(3)}% de píxeles distintos, media ${comparacion.media.toFixed(3)}`);
    }

    for (const resultado of resultados) {
      assert.ok(resultado.porcentaje <= TOLERANCIA_PIXELES,
        `${resultado.perfil}: ${resultado.porcentaje.toFixed(2)}% de píxeles distintos supera la tolerancia (${TOLERANCIA_PIXELES}%). Capturas en ${salida}`);
      assert.ok(resultado.media <= TOLERANCIA_MEDIA,
        `${resultado.perfil}: diferencia media ${resultado.media.toFixed(2)} supera la tolerancia (${TOLERANCIA_MEDIA}). Capturas en ${salida}`);
    }
    t.diagnostic(`capturas: ${salida}`);
  });

  await t.test('navegación básica: enlace de salto y salida de la home', async () => {
    for (const [nombre, base] of [['next', bases.next], ['astro', bases.sin]]) {
      const { contexto, pagina } = await abrirPagina(navegador, base, { viewport: PERFILES[0].viewport });
      // El enlace de salto está oculto hasta recibir foco: se prueba con el
      // teclado, que es como se usa.
      const salto = pagina.locator('a[href="#main-content"]').first();
      assert.ok((await salto.boundingBox()).width <= 1, `${nombre}: el enlace de salto debería estar oculto sin foco`);
      await pagina.keyboard.press('Tab');
      assert.equal(await pagina.evaluate(() => document.activeElement?.getAttribute('href')), '#main-content',
        `${nombre}: el primer tab no llega al enlace de salto`);
      assert.ok((await salto.boundingBox()).width > 40, `${nombre}: el enlace de salto no se hace visible al enfocarse`);
      await pagina.keyboard.press('Enter');
      assert.equal(await pagina.evaluate(() => location.hash), '#main-content',
        `${nombre}: el enlace de salto no cambia el hash`);

      const documentos = [];
      pagina.on('response', respuesta => {
        if (respuesta.request().resourceType() === 'document') {
          documentos.push({ ruta: new URL(respuesta.url()).pathname, estado: respuesta.status() });
        }
      });
      await pagina.locator('footer a[href="/contacto"]').first().click();
      await pagina.waitForURL(url => url.pathname === '/contacto', { timeout: 60_000 });
      assert.equal(new URL(pagina.url()).pathname, '/contacto', `${nombre}: no navegó a /contacto`);
      // Next navega en cliente y Astro hace un pedido completo: en las dos la
      // página de contacto existe desde esta rebanada, así que ninguna queda
      // en 404.
      try {
        await pagina.waitForFunction(() => /Contacto/.test(document.title), null, { timeout: 60_000 });
      } catch {
        assert.fail(`${nombre} no renderizó Contacto (título: «${await pagina.title()}», url: ${pagina.url()})`);
      }
      if (nombre === 'astro') {
        const respuesta = documentos.find(documento => documento.ruta === '/contacto');
        assert.ok(respuesta, 'Astro debe pedir /contacto como documento');
        assert.equal(respuesta.estado, 200, 'Astro ya migró /contacto: la navegación no puede dar 404');
      }
      await contexto.close();
    }
  });

  await t.test('analítica local: monta el medidor, registra un CTA y no pide hosts externos', async () => {
    const { contexto, pagina } = await abrirPagina(navegador, bases.sin, {
      ruta: '/teclab', viewport: PERFILES[0].viewport,
    });
    const externos = [];
    pagina.on('request', pedido => {
      const url = new URL(pedido.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externos.push(pedido.url());
    });

    // El registrador es local: no hay proveedor externo. Se espera a que el
    // medidor montado en el layout tome el clic del CTA.
    await pagina.waitForTimeout(1_500);
    const enlace = pagina.locator('a[href="#preinscripcion"]').first();
    for (let intento = 0; intento < 5; intento += 1) {
      await enlace.click();
      try {
        await pagina.waitForFunction(
          () => Array.isArray(window.__cauAnalitica)
            && window.__cauAnalitica.some(evento => evento.evento === 'cta-inscripcion'),
          null, { timeout: 4_000 },
        );
        break;
      } catch {
        await pagina.waitForTimeout(1_000);
      }
    }
    const eventos = await pagina.evaluate(() => window.__cauAnalitica ?? []);
    assert.ok(eventos.some(evento => evento.evento === 'cta-inscripcion'),
      'el CTA no llegó al registrador local');
    for (const evento of eventos) {
      for (const clave of ['email', 'mail', 'telefono', 'dni', 'nombre', 'contacto']) {
        assert.equal(clave in evento.datos, false, `${evento.evento}: ${clave}`);
      }
    }
    assert.deepEqual(externos, [], 'la analítica no puede pedir hosts externos');
    await contexto.close();
  });

  await t.test('capturas de Teclab y contacto, comparadas con la misma tolerancia', { timeout: 1_800_000 }, async () => {
    mkdirSync(CAPTURAS, { recursive: true });
    const sello = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const salida = join(CAPTURAS, `${sello}-paginas`);
    mkdirSync(salida, { recursive: true });
    const resultados = [];

    for (const ruta of ['/teclab', '/teclab/inscripcion', '/contacto', '/sobre-nosotros',
      '/calendario-academico', '/imagenes', '/test-vocacional', '/teclab/test-vocacional',
      '/faq', '/clases-apoyo', '/clases-apoyo/matematica', '/clases-apoyo/computacion', '/clases-apoyo/arte',
      '/newsletter/baja', '/newsletter/baja?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '/newsletter/baja?listo=1',
      '/carreras/licenciatura-en-administracion', '/carreras/tecnicatura-en-programacion',
      '/carreras/diplomatura-en-oratoria', '/carreras/licenciatura-en-administracion/inscripcion',
      '/carreras/tecnicatura-en-programacion/inscripcion', '/novedades/1', '/novedades/2',
      '/novedades/articulo/novedad-sintetica-1']) {
      const nombreRuta = ruta.slice(1).replaceAll('/', '-').replaceAll('?', '-').replaceAll('=', '-');
      for (const perfil of PERFILES) {
        const capturas = {};
        const cajas = {};
        for (const [nombre, base] of [['next', bases.next], ['astro', bases.sin]]) {
          const { contexto, pagina, respuestasMalas } = await abrirPagina(navegador, base, { ...perfil, ruta });
          cajas[nombre] = await pagina.locator('main section, main article, main figure, main img, footer').evaluateAll(elementos =>
            elementos.map(e => ({clase: e.className, y: e.getBoundingClientRect().y, alto: e.getBoundingClientRect().height})));
          const archivo = join(salida, `${nombreRuta}-${perfil.id}-${nombre}.png`);
          try { capturas[nombre] = await capturarDocumento(navegador, pagina, ruta); }
          catch (error) { throw new Error(`${nombre} ${ruta} ${perfil.id}: ${error.message}\n${JSON.stringify(respuestasMalas)}`); }
          writeFileSync(archivo, capturas[nombre]);
          await contexto.close();
        }
        const comparacion = await compararCapturas(navegador, capturas.next, capturas.astro,
          ruta === '/sobre-nosotros' ? 1 : 0);
        const referencia = await leerReferenciaVisual(REFERENCIAS, `${nombreRuta}-${perfil.id}`);
        const estable = await compararCapturas(navegador, referencia, capturas.astro,
          ruta === '/sobre-nosotros' ? 1 : 0);
        assert.equal(estable.mismos, true, `${ruta} ${perfil.id}: referencia de distinta medida`);
        assert.ok(estable.porcentaje <= TOLERANCIA_PIXELES && estable.media <= TOLERANCIA_MEDIA,
          `${ruta} ${perfil.id}: no coincide con la referencia visual (${estable.porcentaje.toFixed(2)}%, media ${estable.media.toFixed(2)})`);
        if (!comparacion.mismos) t.diagnostic(JSON.stringify({ruta, perfil: perfil.id, cajas}));
        assert.equal(comparacion.mismos, true,
          `${ruta} ${perfil.id}: las capturas tienen distinta medida `
          + `(${comparacion.anchoA}x${comparacion.altoA} vs ${comparacion.anchoB}x${comparacion.altoB})`);
        assert.ok(comparacion.alto > 800,
          `${ruta} ${perfil.id}: la captura quedó demasiado baja (${comparacion.alto}px); ¿la página está vacía?`);
        resultados.push({ ruta, perfil: perfil.id, ...comparacion });
        t.diagnostic(`${ruta} ${perfil.id}: ${comparacion.porcentaje.toFixed(3)}% de píxeles distintos, `
          + `media ${comparacion.media.toFixed(3)}, delta alto ${comparacion.diferenciaAlto}px`);
      }
    }

    for (const resultado of resultados) {
      assert.ok(resultado.porcentaje <= TOLERANCIA_PIXELES,
        `${resultado.ruta} ${resultado.perfil}: ${resultado.porcentaje.toFixed(2)}% de píxeles distintos `
        + `supera la tolerancia (${TOLERANCIA_PIXELES}%). Capturas en ${salida}`);
      assert.ok(resultado.media <= TOLERANCIA_MEDIA,
        `${resultado.ruta} ${resultado.perfil}: diferencia media ${resultado.media.toFixed(2)} `
        + `supera la tolerancia (${TOLERANCIA_MEDIA}). Capturas en ${salida}`);
    }
    t.diagnostic(`capturas: ${salida}`);
  });

  await t.test('novedades: listado → artículo → volver → paginación y copiar enlace, XSS sin ejecución', async () => {
    for (const base of [bases.next,bases.sin]) {
      const {contexto,pagina} = await abrirPagina(navegador,base,{ruta:'/novedades/1'});
      await contexto.grantPermissions(['clipboard-read','clipboard-write']);
      await pagina.locator('main a[href="/novedades/articulo/novedad-sintetica-1"]').click();
      await pagina.waitForURL('**/novedades/articulo/novedad-sintetica-1');
      await pagina.getByRole('heading',{level:1,name:'Novedad destacada sintética'}).waitFor();
      await pagina.getByRole('button',{name:/Copiar enlace/}).click();
      assert.equal(await pagina.evaluate(()=>navigator.clipboard.readText()),'https://www.siglo21sur.com/novedades/articulo/novedad-sintetica-1');
      await pagina.getByRole('link',{name:'Volver a novedades'}).click();
      await pagina.waitForURL('**/novedades/1');
      await pagina.locator('main a[href="/novedades/2"]').first().click();
      await pagina.waitForURL('**/novedades/2');
      assert.equal(await pagina.locator('main .news-card').count(),6);
      await pagina.locator('main a[href="/novedades/3"]').first().click();
      await pagina.waitForURL('**/novedades/3');
      assert.equal(await pagina.locator('main .news-card').count(),5);
      await pagina.goto(`${base}/novedades/articulo/novedad-sintetica-16`);
      assert.equal(await pagina.locator('meta[property="og:title"]').getAttribute('content'),
        'Prueba </script><script>NO_EJECUTAR</script>');
      assert.equal(await pagina.locator('.art iframe, .art script, .art [onerror], .art [onclick]').count(),0);
      assert.equal(await pagina.evaluate(()=>globalThis.XSS_NOVEDAD),undefined);
      await contexto.close();
    }
  });

  await t.test('tests vocacionales: responder, volver, resultados y reinicio reales en ambas plataformas', async () => {
    for (const ruta of ['/test-vocacional', '/teclab/test-vocacional']) {
      const resultados = {};
      for (const [nombre, base] of [['next', bases.next], ['astro', bases.sin]]) {
        const { contexto, pagina } = await abrirPagina(navegador, base, { ruta });
        if (ruta === '/test-vocacional') {
          await pagina.getByRole('button', { name: 'Empezar el test' }).click();
          assert.equal(await pagina.locator('.vocacional-continue').isDisabled(), true);
          await pagina.locator('.vocacional-option').first().click();
          await pagina.locator('.vocacional-continue').click();
          await pagina.locator('.vocacional-back').click();
          assert.equal(await pagina.locator('.vocacional-option').first().getAttribute('aria-pressed'), 'true');
          await pagina.locator('.vocacional-continue').click();
          for (let i = 0; i < 20 && await pagina.locator('.vocacional-option').count(); i++) {
            await pagina.locator('.vocacional-option').first().click();
            if (await pagina.locator('.vocacional-result').count()) break;
            await pagina.locator('.vocacional-continue').click();
          }
          await pagina.locator('.vocacional-result').waitFor();
          assert.ok(await pagina.locator('.vocacional-career').count() > 0, `${nombre}: resultados vacíos`);
          resultados[nombre] = await pagina.locator('.vocacional-result').innerText();
          await pagina.getByRole('button', { name: 'Hacerlo de nuevo' }).click();
          await pagina.getByRole('button', { name: 'Empezar el test' }).waitFor();
        } else {
          assert.equal(await pagina.locator('.tvt-volver').isDisabled(), true);
          await pagina.locator('.tvt-opcion').first().click();
          await pagina.locator('.tvt-volver').click();
          assert.match(await pagina.locator('.tvt-progreso-fila').innerText(), /Pregunta 1 de 7/);
          for (let i = 0; i < 7; i++) await pagina.locator('.tvt-opcion').first().click();
          await pagina.locator('.tvt-resultado').waitFor();
          assert.ok(await pagina.locator('.tvt-carrera').count() > 0, `${nombre}: resultados vacíos`);
          resultados[nombre] = await pagina.locator('.tvt-resultado').innerText();
          assert.ok(await pagina.locator('.tvt-acciones a[href^="/carreras/"]').count() > 0);
          await pagina.getByRole('button', { name: 'Hacer el test de nuevo' }).click();
          assert.match(await pagina.locator('.tvt-progreso-fila').innerText(), /Pregunta 1 de 7/);
        }
        await contexto.close();
      }
      assert.equal(resultados.astro, resultados.next, `${ruta}: resultados tras las mismas respuestas`);
    }
  });

  await t.test('biblioteca y sobre nosotros hidratan búsqueda, portapapeles y carrusel', async () => {
    for (const base of [bases.next, bases.sin]) {
      const biblioteca = await abrirPagina(navegador, base, { ruta: '/imagenes' });
      await biblioteca.contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
      await biblioteca.pagina.getByRole('searchbox', { name: 'Buscar imágenes' }).fill('logo-teclab.webp');
      assert.equal(await biblioteca.pagina.locator('.bib__tarjeta').count(), 1);
      const tarjeta = biblioteca.pagina.locator('.bib__tarjeta');
      const ruta = (await tarjeta.getAttribute('title')).replace('Copiar ', '');
      await tarjeta.click();
      assert.equal(await biblioteca.pagina.evaluate(() => navigator.clipboard.readText()), ruta);
      await biblioteca.pagina.getByRole('searchbox').fill('sin-coincidencias-fixture');
      await biblioteca.pagina.locator('.bib__vacio').waitFor();
      await biblioteca.contexto.close();

      const sobre = await abrirPagina(navegador, base, { ruta: '/sobre-nosotros' });
      const folleto = sobre.pagina.locator('.vi-folleto').first();
      const inicial = await folleto.getAttribute('href');
      await sobre.pagina.getByRole('button', { name: 'Folleto siguiente' }).click();
      assert.notEqual(await folleto.getAttribute('href'), inicial);
      await sobre.pagina.getByRole('button', { name: 'Folleto anterior' }).click();
      assert.equal(await folleto.getAttribute('href'), inicial);
      // No reproducimos contenido externo: se verifica sólo el montaje del iframe.
      await sobre.pagina.getByRole('button', { name: 'Reproducir el video de Universidad Siglo 21' }).click();
      assert.match(await sobre.pagina.locator('iframe[title="Video: Universidad Siglo 21"]').getAttribute('src'),
        /^https:\/\/www.youtube-nocookie.com\/embed\//);
      await sobre.contexto.close();
    }
  });

  await t.test('FAQ: búsqueda, acordeón, pregunta pública/privada, consentimiento y fallo sin éxito ficticio', async () => {
    const cerrada = await abrirPagina(navegador, bases.sin, { ruta: '/faq' });
    await cerrada.pagina.getByLabel('Buscar una pregunta').fill('sin-coincidencias-fixture');
    await cerrada.pagina.getByText('No se encontraron resultados.', { exact: false }).waitFor();
    await cerrada.pagina.getByLabel('Buscar una pregunta').fill('');
    const acordeon = cerrada.pagina.locator('.faq-btn').first();
    const estadoInicial = await acordeon.getAttribute('aria-expanded');
    await acordeon.click();
    await cerrada.pagina.waitForFunction(estado => document.querySelector('.faq-btn')?.getAttribute('aria-expanded') !== estado, estadoInicial);
    await cerrada.pagina.getByRole('button', { name: 'Hacer una pregunta', exact: true }).filter({ visible: true }).click();
    await cerrada.pagina.locator('#ask-title').fill('Pregunta sintética sin captcha');
    await cerrada.pagina.getByRole('button', { name: /Publicar en la página/ }).click();
    assert.equal(await cerrada.pagina.getByRole('button', { name: 'Publicar pregunta', exact: true }).isDisabled(), true);
    await cerrada.contexto.close();

    for (const modo of ['publica', 'privada']) {
      const { contexto, pagina } = await abrirPagina(navegador, bases.demo, { ruta: '/faq' });
      const sobres = [];
      pagina.on('request', p => { if (new URL(p.url()).pathname === '/api/formularios') sobres.push(p.postDataJSON()); });
      await pagina.getByRole('button', { name: 'Hacer una pregunta', exact: true }).filter({ visible: true }).click();
      await pagina.locator('#ask-title').fill('Consulta sintética del navegador');
      await pagina.getByRole('button', { name: modo === 'publica' ? /Publicar en la página/ : /Respuesta personal/ }).click();
      await pagina.locator(modo === 'publica' ? '#ask-contact-pub' : '#ask-wa').fill('ana@example.invalid');
      await pagina.locator(modo === 'publica' ? '#ask-newsletter-pub' : '#ask-newsletter-priv').uncheck();
      const boton = pagina.getByRole('button', { name: modo === 'publica' ? 'Publicar pregunta' : 'Enviar consulta', exact: true });
      if (modo === 'privada') await contexto.route('**/api/formularios', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"fallo sintético"}' }));
      const respuesta = pagina.waitForResponse(r => new URL(r.url()).pathname === '/api/formularios');
      await boton.click();
      assert.equal((await respuesta).status(), modo === 'publica' ? 201 : 500);
      if (modo === 'publica') await pagina.getByText('¡Consulta recibida!', { exact: true }).waitFor();
      else assert.equal(await pagina.getByText('¡Consulta recibida!', { exact: true }).isVisible(), false);
      assert.equal(sobres.length, 1);
      assert.equal(sobres[0].kind, 'faq');
      assert.equal(sobres[0].payload.modo, modo);
      assert.equal(sobres[0].payload.newsletter, false);
      await contexto.close();
    }
  });

  await t.test('clases: calendario, horarios, teléfono, continuidad, demo y error; construcción sin reserva', async () => {
    for (const [slug, exito] of [['matematica', true], ['computacion', false]]) {
      const { contexto, pagina } = await abrirPagina(navegador, bases.demo, { ruta: `/clases-apoyo/${slug}` });
      if (slug === 'computacion') {
        assert.equal(await pagina.evaluate(async () => {
          await Promise.all(['400', '700'].map(peso => document.fonts.load(`${peso} 24px Silkscreen`)));
          return document.fonts.check('400 24px Silkscreen') && document.fonts.check('700 24px Silkscreen');
        }), true,
          'Silkscreen debe cargar realmente, no caer a monospace por la CSP');
      }
      const sobres = [];
      pagina.on('request', p => { if (new URL(p.url()).pathname === '/api/formularios') sobres.push(p.postDataJSON()); });
      await pagina.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
      const dia = pagina.locator('button.ca-day:not([disabled])').first();
      await dia.click();
      assert.equal(await dia.getAttribute('aria-pressed'), 'true');
      assert.equal(await pagina.getByRole('button', { name: 'Solicitar clase', exact: true }).isDisabled(), true);
      await pagina.getByRole('button', { name: slug === 'matematica' ? '14:00–15:00' : '8:00–9:00', exact: true }).click();
      await pagina.getByRole('button', { name: 'Solicitar clase', exact: true }).click();
      await pagina.getByRole('button', { name: 'Confirmar solicitud', exact: true }).click();
      await pagina.getByText('Ingresá tu teléfono para continuar.', { exact: true }).waitFor();
      await pagina.getByPlaceholder('Teléfono', { exact: true }).fill('1111111111');
      if (slug === 'matematica') await pagina.getByRole('button', { name: /Reservar todas las semanas/ }).click();
      if (!exito) await contexto.route('**/api/formularios', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
      const respuesta = pagina.waitForResponse(r => new URL(r.url()).pathname === '/api/formularios');
      await pagina.getByRole('button', { name: 'Confirmar solicitud', exact: true }).click();
      assert.equal((await respuesta).status(), exito ? 201 : 500);
      if (exito) {
        await pagina.getByText('Solicitud realizada con éxito', { exact: true }).waitFor();
        await pagina.getByRole('button', { name: 'Nueva solicitud', exact: true }).click();
        assert.equal(await pagina.locator('button.ca-day[aria-pressed="true"]').count(), 0);
      } else {
        await pagina.getByText('Error al enviar. Intente más tarde.', { exact: true }).waitFor();
        assert.equal(await pagina.getByText('Solicitud realizada con éxito', { exact: true }).count(), 0);
      }
      assert.equal(sobres.length, 1);
      assert.equal(sobres[0].kind, 'clase');
      assert.equal(sobres[0].payload.rows[0].bloqueo_semanal, slug === 'matematica');
      await contexto.close();
    }
    const { contexto, pagina } = await abrirPagina(navegador, bases.sin, { ruta: '/clases-apoyo/arte' });
    assert.equal(await pagina.locator('button.ca-day').count(), 0);
    assert.equal(await pagina.locator('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
    await contexto.close();
  });

  await t.test('baja: GET no opera; botón POST redirige después de D1 y permite repetición', async () => {
    const { contexto, pagina } = await abrirPagina(navegador, bases.sin, { ruta: '/newsletter/baja?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
    assert.equal(await pagina.locator('form').getAttribute('method'), 'post');
    const post = pagina.waitForResponse(r => new URL(r.url()).pathname === '/api/newsletter/baja');
    await pagina.getByRole('button', { name: 'Anular suscripción', exact: true }).click();
    assert.equal((await post).status(), 303);
    await pagina.waitForURL('**/newsletter/baja?listo=1');
    await pagina.getByRole('heading', { name: 'Listo, no vas a recibir más novedades.' }).waitFor();
    await pagina.goto(`${bases.sin}/newsletter/baja?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`);
    await pagina.getByRole('button', { name: 'Anular suscripción', exact: true }).click();
    await pagina.waitForURL('**/newsletter/baja?listo=1');
    await contexto.close();
  });

  await t.test('ficha → inscripción: selección, campos de casa, consentimiento y un solo envío demo', async () => {
    for (const [slug, casa, dedicada, idCarrera] of [
      ['licenciatura-en-administracion', 'siglo21', false, 11],
      ['tecnicatura-en-programacion', 'teclab', false, 19],
      ['diplomatura-en-oratoria', 'identidad', false, 16],
      ['licenciatura-en-administracion', 'siglo21', true, 11],
      ['tecnicatura-en-programacion', 'teclab', true, 19],
    ]) {
      const { pagina, contexto } = await abrirPagina(navegador, bases.demo, {ruta:`/carreras/${slug}${dedicada ? '/inscripcion' : ''}`});
      if (!dedicada) {
        // La ficha vigente baja a su formulario diferido, no a la página dedicada.
        await pagina.locator('a[href="#preinscripcion"]').first().click();
        await pagina.locator('#preinscripcion-dni').waitFor();
      }
      await pagina.waitForFunction(() => [...document.querySelectorAll('astro-island')].every(i => !i.hasAttribute('ssr')));
      const campos = camposDe(casa, 'preinscripcion');
      for (const ajeno of ['nivelEstudios', 'tipoDocumento']) {
        assert.equal(await pagina.locator(`#preinscripcion-${ajeno}`).count(), campos.includes(ajeno) ? 1 : 0);
      }
      for (const id of campos) {
        const definicion = CAMPOS[id];
        const campo = pagina.locator(`#preinscripcion-${id}`);
        if (definicion.tipo === 'checkbox') continue;
        if (definicion.tipo === 'fecha') {
          await campo.click();
          const anio = pagina.locator('#preinscripcion-fechaNacimiento-anio');
          await anio.fill('1990'); await anio.press('Enter');
          await pagina.getByRole('dialog').getByRole('button', {name:'1', exact:true}).click();
          continue;
        }
        const dato = definicion.opciones?.[0] ?? (id === 'dni' ? '12345678'
          : id === 'email' ? 'ana@example.invalid' : id === 'telefono' ? '1111111111'
          : definicion.numerico ? '1234' : 'Dato sintético');
        await campo.fill(definicion.etiquetasOpciones?.[dato] ?? dato);
        if (definicion.tipo === 'select') await campo.press('Enter');
      }
      await pagina.locator('#preinscripcion-newsletter').uncheck();
      const pedido = pagina.waitForRequest(r => r.url().endsWith('/api/formularios') && r.method() === 'POST');
      const respuesta = pagina.waitForResponse(r => r.url().endsWith('/api/formularios'));
      await pagina.locator('#preinscripcion button[type="submit"]').click();
      const payload = (await pedido).postDataJSON();
      assert.equal((await respuesta).status(), 201);
      // La autoinscripción de Teclab se dio de baja el 27/10/2026: la página
      // dedicada y la ficha mandan el mismo `kind` que el resto.
      assert.equal(payload.kind, 'consulta');
      assert.equal(payload.payload.carreraId, idCarrera);
      assert.equal(payload.payload.newsletter, false);
      assert.equal(payload.token, 'demo');
      await pagina.waitForFunction(() => document.body.textContent.includes('Preinscripción enviada'));
      await contexto.close();
    }
  });

  await t.test('/contacto: fallo cerrado sin site key, validación y envío de demo con doble', async () => {
    // Sin site key ni demo el formulario no puede enviar: el botón queda
    // deshabilitado aunque los datos sean válidos y no sale ningún POST.
    const cerrado = await abrirPagina(navegador, bases.sin, { ruta: '/contacto' });
    const pedidosCerrado = [];
    cerrado.pagina.on('request', pedido => {
      if (pedido.url().includes('/api/formularios')) pedidosCerrado.push(pedido.method());
    });
    assert.equal(await cerrado.pagina.locator('meta[name="turnstile-site-key"]').count(), 0);
    assert.equal((await cerrado.pagina.content()).includes('Verificación de seguridad'), false);
    await cerrado.pagina.fill('input[autocomplete="given-name"]', 'Ana');
    await cerrado.pagina.fill('#contacto-email', 'ana@example.invalid');
    assert.equal(await cerrado.pagina.locator('button[type="submit"]').isDisabled(), true,
      'sin token de captcha el envío tiene que quedar bloqueado');
    await cerrado.pagina.waitForTimeout(200);
    assert.deepEqual(pedidosCerrado, [], 'sin captcha no puede salir ningún POST');
    await cerrado.contexto.close();

    // Con site key el HTML ya trae el marcador y reserva el hueco, igual que la
    // home. El script de Cloudflare está abortado: no hay token ni envío.
    const html = await (await fetch(`${bases.con}/contacto`)).text();
    assert.match(html, /Verificación de seguridad/);
    assert.match(html, /min-h-\[71px\]/);

    // Demo: el widget entrega `demo` sin tocar Cloudflare.
    const demo = await abrirPagina(navegador, bases.demo, { ruta: '/contacto' });
    assert.equal(await demo.pagina.locator('meta[name="formularios-demo"]').count(), 1);
    assert.equal(demo.externos.some(url => url.includes('challenges.cloudflare.com')), false,
      'en demo no se pide el script de Cloudflare');
    // Validación del cliente: un mail mal formado se avisa y bloquea el botón.
    await demo.pagina.fill('#contacto-email', 'no-es-un-mail');
    await demo.pagina.waitForFunction(
      () => document.body.textContent.includes('El formato del email no es válido.'),
      null, { timeout: 10_000 },
    );
    assert.equal(await demo.pagina.locator('button[type="submit"]').isDisabled(), true);

    // Camino feliz: un solo POST al endpoint del paquete y el cartel de éxito.
    const envios = [];
    demo.pagina.on('response', respuesta => {
      if (respuesta.url().includes('/api/formularios')) envios.push(respuesta.status());
    });
    await demo.pagina.fill('#contacto-email', 'ana@example.invalid');
    await demo.pagina.fill('input[autocomplete="given-name"]', 'Ana');
    await demo.pagina.waitForFunction(
      () => !document.querySelector('button[type="submit"]').disabled,
      null, { timeout: 10_000 },
    );
    await demo.pagina.locator('button[type="submit"]').click();
    await demo.pagina.waitForFunction(
      () => document.body.textContent.includes('Consulta enviada'),
      null, { timeout: 15_000 },
    );
    assert.deepEqual(envios, [201], 'el envío de demo debe contestar 201 una sola vez');
    // El único pedido externo es el mapa embebido de la sede, que la prueba
    // aborta igual que en las dos puntas: no se resuelve ningún host externo.
    assert.deepEqual(
      demo.externos.filter(url => !url.startsWith('https://www.google.com/maps')),
      [],
      'el envío no puede generar pedidos externos',
    );
    await demo.contexto.close();

    // Error del servidor: se muestra el aviso y el captcha se descarta, así el
    // botón no queda habilitado con un token que ya se usó.
    const fallo = await abrirPagina(navegador, bases.demo, { ruta: '/contacto' });
    await fallo.contexto.route('**/api/formularios', ruta => ruta.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'No se pudo guardar la solicitud' }),
    }));
    await fallo.pagina.fill('#contacto-email', 'ana@example.invalid');
    await fallo.pagina.fill('input[autocomplete="given-name"]', 'Ana');
    await fallo.pagina.waitForFunction(
      () => !document.querySelector('button[type="submit"]').disabled,
      null, { timeout: 10_000 },
    );
    await fallo.pagina.locator('button[type="submit"]').click();
    await fallo.pagina.waitForFunction(
      () => document.body.textContent.includes('Hubo un error al enviar'),
      null, { timeout: 15_000 },
    );
    await fallo.contexto.close();

    // Ensayo de staging: con el meta que sólo inyecta su wrapper, el motivo
    // funcional del rechazo se muestra visible y accesible (role=alert). Sin el
    // meta —el sitio vigente— el mismo rechazo sigue con el texto genérico.
    const selloAviso = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const dirAviso = join(CAPTURAS, `${selloAviso}-aviso`);
    mkdirSync(dirAviso, { recursive: true });
    for (const conDetalle of [true, false]) {
      const ensayo = await abrirPagina(navegador, bases.demo, { ruta: '/contacto' });
      if (conDetalle) {
        await ensayo.pagina.evaluate(() => {
          const meta = document.createElement('meta');
          meta.name = 'formularios-detalle';
          meta.content = 'ensayo';
          document.head.appendChild(meta);
        });
      }
      await ensayo.contexto.route('**/api/formularios', ruta => ruta.fulfill({
        status: 400, contentType: 'application/json',
        body: JSON.stringify({ error: 'campo-fuera-de-ensayo', campo: 'newsletter' }),
      }));
      await ensayo.pagina.fill('#contacto-email', 'ana@example.invalid');
      let cuerpoEnviado = null;
      ensayo.pagina.on('request', pedido => {
        if (pedido.url().includes('/api/formularios')) cuerpoEnviado = pedido.postDataJSON?.() ?? null;
      });
      await ensayo.pagina.waitForFunction(
        () => !document.querySelector('button[type="submit"]').disabled, null, { timeout: 10_000 },
      );
      await ensayo.pagina.locator('button[type="submit"]').click();
      await ensayo.pagina.waitForFunction(
        () => document.querySelector('[role="alert"]') !== null, null, { timeout: 15_000 },
      );
      // El cuerpo real del componente es el del contrato del ensayo: ni campos
      // de más ni de menos, y los nulos van explícitos.
      assert.equal(cuerpoEnviado?.kind, 'consulta');
      assert.equal(typeof cuerpoEnviado?.token, 'string');
      assert.deepEqual(Object.keys(cuerpoEnviado?.payload ?? {}).sort(), [
        'apellido', 'carrera', 'casa', 'email', 'equivalencias', 'localidad',
        'modalidad', 'newsletter', 'nombre', 'telefono', 'tipo', 'tipoFormulario',
      ]);
      assert.equal(cuerpoEnviado.payload.tipoFormulario, 'contacto');
      assert.equal(cuerpoEnviado.payload.casa, null);
      assert.equal(cuerpoEnviado.payload.equivalencias, false);
      assert.equal(typeof cuerpoEnviado.payload.newsletter, 'boolean');
      const aviso = ensayo.pagina.locator('[role="alert"]');
      assert.equal(await aviso.isVisible(), true, 'el motivo tiene que quedar visible');
      const texto = (await aviso.textContent()) ?? '';
      if (conDetalle) {
        assert.match(texto, /Destildá «Quiero recibir novedades por mail»/);
        assert.ok(!texto.includes('Hubo un error al enviar'), 'no se oculta el motivo');
        await aviso.scrollIntoViewIfNeeded();
        await ensayo.pagina.screenshot({ path: join(dirAviso, 'contacto-aviso-escritorio.png') });
      } else {
        assert.match(texto, /Hubo un error al enviar/);
      }
      await ensayo.contexto.close();
    }

    // La misma captura en móvil: el aviso queda visible sin cambiar el layout.
    const movil = await abrirPagina(navegador, bases.demo, {
      ruta: '/contacto', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    });
    await movil.pagina.evaluate(() => {
      const meta = document.createElement('meta');
      meta.name = 'formularios-detalle';
      meta.content = 'ensayo';
      document.head.appendChild(meta);
    });
    await movil.contexto.route('**/api/formularios', ruta => ruta.fulfill({
      status: 400, contentType: 'application/json',
      body: JSON.stringify({ error: 'campo-fuera-de-ensayo', campo: 'newsletter' }),
    }));
    await movil.pagina.fill('#contacto-email', 'ana@example.invalid');
    await movil.pagina.waitForFunction(
      () => !document.querySelector('button[type="submit"]').disabled, null, { timeout: 10_000 },
    );
    await movil.pagina.locator('button[type="submit"]').click();
    await movil.pagina.waitForFunction(
      () => document.querySelector('[role="alert"]') !== null, null, { timeout: 15_000 },
    );
    const avisoMovil = movil.pagina.locator('[role="alert"]');
    assert.equal(await avisoMovil.isVisible(), true, 'el motivo también se ve en móvil');
    await avisoMovil.scrollIntoViewIfNeeded();
    await movil.pagina.screenshot({ path: join(dirAviso, 'contacto-aviso-movil.png') });
    await movil.contexto.close();
  });

  await t.test('Turnstile: sin site key falla cerrado', async () => {
    const { contexto, pagina, externos } = await abrirPagina(navegador, bases.sin);
    assert.equal(await pagina.locator('meta[name="turnstile-site-key"]').count(), 0);
    assert.equal((await pagina.content()).includes('Verificación de seguridad'), false);
    await pagina.locator('button[type="submit"]').first().click();
    await pagina.waitForFunction(
      () => document.body.textContent.includes('Falta tildar la verificación de seguridad.'), null, { timeout: 10_000 },
    );
    assert.equal(externos.some(url => url.includes('challenges.cloudflare.com')), false,
      'sin site key no debe pedirse el script de Cloudflare');
    await contexto.close();
  });

  await t.test('Turnstile: con site key reserva el hueco, monta, entrega token y pasa a compacto', async () => {
    const contexto = await navegador.newContext({
      viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'es-AR',
    });
    const pagina = await contexto.newPage();
    const externos = [];
    // Primero la guarda general (se evalúa después) y al final la ruta del
    // widget, que es la que tiene que ganar.
    await contexto.route(url => !['127.0.0.1', 'localhost'].includes(url.hostname), ruta => {
      externos.push(ruta.request().url());
      ruta.abort();
    });
    let entregaScript;
    const scriptPedido = new Promise(resolver => { entregaScript = resolver; });
    await contexto.route(URL_WIDGET, ruta => { entregaScript(ruta); });

    await pagina.goto(`${bases.con}/`, { waitUntil: 'load' });
    // El HTML ya trae marcador y hueco: no depende de que hidrate.
    const html = await (await fetch(`${bases.con}/`)).text();
    assert.match(html, /Verificación de seguridad/, 'el HTML del servidor debe traer el marcador');
    assert.match(html, /min-h-\[71px\]/, 'el HTML del servidor debe reservar 71 px');
    assert.equal(await pagina.evaluate(() => document.body.textContent.includes('Verificación de seguridad')), true);

    const rutaScript = await scriptPedido;
    await rutaScript.fulfill({ status: 200, contentType: 'application/javascript', body: DOBLE_TURNSTILE });
    await pagina.waitForFunction(() => window.__turnstile?.render.length === 1, null, { timeout: 30_000 });
    const primera = await pagina.evaluate(() => window.__turnstile.render[0]);
    assert.equal(primera.sitekey, 'clave-e2e');
    assert.equal(primera.size, 'flexible');

    // El marcador se retira recién cuando el iframe terminó de cargar.
    await pagina.waitForFunction(
      () => !document.body.textContent.includes('Verificación de seguridad'), null, { timeout: 15_000 },
    );
    assert.ok(await pagina.evaluate(() => {
      const iframe = document.querySelector('iframe');
      return iframe && iframe.getBoundingClientRect().height > 0;
    }), 'el iframe del widget debe quedar visible');

    // El token llegó al formulario: no aparece el aviso de captcha sin tildar.
    await pagina.locator('button[type="submit"]').first().click();
    await pagina.waitForTimeout(300);
    assert.equal((await pagina.content()).includes('Falta tildar la verificación de seguridad.'), false,
      'el token del widget no llegó al formulario');

    // Cruzar el umbral vuelve a dibujar en compacto y descarta el token anterior.
    await pagina.setViewportSize({ width: 320, height: 700 });
    await pagina.waitForFunction(() => window.__turnstile.render.length === 2, null, { timeout: 15_000 });
    const segunda = await pagina.evaluate(() => window.__turnstile.render[1]);
    assert.equal(segunda.size, 'compact');
    assert.deepEqual(await pagina.evaluate(() => window.__turnstile.remove), ['widget-1']);
    await pagina.waitForFunction(() => {
      const iframe = document.querySelector('iframe');
      return iframe && getComputedStyle(iframe.parentElement.parentElement).minHeight === '140px';
    });
    assert.equal(await pagina.evaluate(() => {
      const iframe = document.querySelector('iframe');
      return getComputedStyle(iframe.parentElement.parentElement).minHeight;
    }), '140px');

    await pagina.setViewportSize({ width: 1200, height: 900 });
    await pagina.waitForFunction(() => window.__turnstile.render.length === 3, null, { timeout: 15_000 });
    assert.equal(await pagina.evaluate(() => window.__turnstile.render[2].size), 'flexible');
    assert.deepEqual(await pagina.evaluate(() => window.__turnstile.remove), ['widget-1', 'widget-2']);
    assert.deepEqual(externos, [], 'el widget no debe generar pedidos externos');

    await contexto.close();
  });

  await t.test('Turnstile: el modo demo entrega el token sin tocar Cloudflare', async () => {
    const { contexto, pagina, externos } = await abrirPagina(navegador, bases.demo);
    assert.equal(await pagina.locator('meta[name="formularios-demo"]').count(), 1,
      'el servidor local con FORMULARIOS_DEMO=1 debe emitir el meta');
    assert.equal(await pagina.locator('meta[name="turnstile-site-key"]').count(), 0);
    assert.equal((await pagina.content()).includes('Verificación de seguridad'), false,
      'en demo no se pinta marcador');
    assert.equal(externos.some(url => url.includes('challenges.cloudflare.com')), false,
      'en demo no se pide el script de Cloudflare');
    await pagina.locator('button[type="submit"]').first().click();
    await pagina.waitForTimeout(300);
    assert.equal((await pagina.content()).includes('Falta tildar la verificación de seguridad.'), false,
      'en demo el token tiene que llegar al formulario');
    await contexto.close();
  });
});
