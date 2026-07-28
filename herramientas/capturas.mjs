#!/usr/bin/env node
// Capturas desktop + mobile del sitio, para revisar visualmente un cambio.
// Reemplaza los scripts sueltos de Playwright y el Chrome headless a mano.
//
//   npm run capturas                                  # prod, rutas por defecto
//   npm run capturas -- --base=http://localhost:3000
//   npm run capturas -- --rutas=/,/faq,/carreras/licenciatura-en-administracion
//   npm run capturas -- --solo=mobile --viewport
//
// Sale a screenshots/<AAAAMMDD-HHMM>/<ruta>-<perfil>.png
//
// Por que Playwright y no "chrome --headless --window-size": esa forma NO da un
// viewport CSS del ancho pedido (con 390 la pagina se maqueta a ~504 y la imagen
// recorta), asi que inventa recortes que en un telefono real no existen.
// newContext({ ...devices['iPhone 13'] }) si fija el viewport y el DPR.
//
// Ojo con lo que depende de timing (restauracion de scroll, carga de imagenes):
// eso hay que mirarlo contra prod, en dev da falso verde.

import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const valor = (nombre, porDefecto) => {
  const a = args.find(x => x.startsWith(`--${nombre}=`));
  return a ? a.slice(nombre.length + 3) : porDefecto;
};

const BASE = valor('base', 'https://www.siglo21sur.com').replace(/\/$/, '');
const SOLO = valor('solo', 'ambos'); // desktop | mobile | ambos
const COMPLETA = !args.includes('--viewport');

const RUTAS_POR_DEFECTO = ['/', '/clases-apoyo', '/faq', '/contacto', '/sobre-nosotros', '/novedades/1'];

// Git Bash reescribe los argumentos que arrancan con "/" a rutas de Windows:
// --rutas=/faq llega como "C:/Program Files/Git/faq". Aceptamos las rutas sin
// barra inicial (--rutas=faq,contacto, la forma segura en cualquier shell) y
// desarmamos el mangle si igual aparece. Desde PowerShell no pasa.
function normalizar(r) {
  const limpia = r.trim().replace(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/]/i, '');
  return limpia.startsWith('/') ? limpia : `/${limpia}`;
}

const pedidas = valor('rutas', '').split(',').map(r => r.trim()).filter(Boolean);
const rutas = pedidas.length > 0 ? pedidas.map(normalizar) : RUTAS_POR_DEFECTO;

const PERFILES = [
  { id: 'desktop', opciones: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { id: 'mobile', opciones: { ...devices['iPhone 13'] } },
].filter(p => SOLO === 'ambos' || SOLO === p.id);

if (PERFILES.length === 0) {
  console.error(`--solo=${SOLO} no es valido. Usar desktop, mobile o ambos.`);
  process.exit(2);
}

const ahora = new Date();
const sello = [
  ahora.getFullYear(),
  String(ahora.getMonth() + 1).padStart(2, '0'),
  String(ahora.getDate()).padStart(2, '0'),
  '-',
  String(ahora.getHours()).padStart(2, '0'),
  String(ahora.getMinutes()).padStart(2, '0'),
].join('');

const salida = path.join(process.cwd(), 'screenshots', sello);
await mkdir(salida, { recursive: true });

const nombreDeRuta = r => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '-'));

// Baja hasta el fondo para disparar las imagenes lazy y despues vuelve arriba,
// si no la captura completa sale con huecos donde todavia no cargo nada.
async function recorrer(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let y = 0;
      const paso = 600;
      const timer = setInterval(() => {
        window.scrollTo(0, y);
        y += paso;
        if (y >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 60);
    });
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

console.log(`\nBase: ${BASE}`);
console.log(`Perfiles: ${PERFILES.map(p => p.id).join(', ')} — ${COMPLETA ? 'pagina completa' : 'solo el viewport'}`);
console.log(`Salida: ${salida}\n`);

const browser = await chromium.launch();
let fallos = 0;

for (const perfil of PERFILES) {
  const context = await browser.newContext({
    ...perfil.opciones,
    // Sin esto, prefers-reduced-motion queda en no-preference y las animaciones
    // de entrada pueden agarrar la captura a mitad de camino.
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  for (const ruta of rutas) {
    const url = BASE + ruta;
    const archivo = path.join(salida, `${nombreDeRuta(ruta)}-${perfil.id}.png`);
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      // networkidle nunca llega en las paginas con formulario: el widget de
      // Turnstile deja trafico abierto contra challenges.cloudflare.com. Se
      // intenta un rato corto y se sigue igual.
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      if (COMPLETA) await recorrer(page);
      await page.screenshot({ path: archivo, fullPage: COMPLETA });
      console.log(`  ok     ${perfil.id.padEnd(7)} ${ruta}`);
    } catch (e) {
      fallos++;
      console.log(`  FALLA  ${perfil.id.padEnd(7)} ${ruta} — ${e.message.split('\n')[0]}`);
      // Un goto fallido deja la pestaña en chrome-error:// y arrastra a la
      // siguiente ruta con un error que no es suyo.
      await page.goto('about:blank').catch(() => {});
    }
  }

  await context.close();
}

await browser.close();

console.log(`\n${rutas.length * PERFILES.length - fallos} captura(s) en ${salida}`);
process.exit(fallos > 0 ? 1 : 0);
