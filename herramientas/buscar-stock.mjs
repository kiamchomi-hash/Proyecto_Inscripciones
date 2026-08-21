/**
 * Busca fotos en Unsplash y baja las mejores para usar en piezas del CAU.
 *
 * Por qué Playwright y no `curl`: la búsqueda de Unsplash se arma con
 * JavaScript, así que el HTML que devuelve el servidor no trae ninguna imagen.
 *
 * Elige por luminancia: las fotos que veníamos usando estaban tan oscuras que
 * había que subirles el brillo un 70%, y eso las deja lavadas. Acá se descarta
 * de entrada todo lo que quede fuera del rango utilizable.
 *
 * Uso:
 *   node herramientas/buscar-stock.mjs "occupational therapy" --salida=terapia --cantidad=4
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const consulta = args.find((a) => !a.startsWith('--'));
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=')[1] : d;
};

if (!consulta) {
  console.error('uso: node herramientas/buscar-stock.mjs "<búsqueda>" [--salida=nombre] [--cantidad=4]');
  process.exit(2);
}

const salida = opt('salida', 'stock');
const cantidad = Number(opt('cantidad', 4));
const destino = resolve(opt('destino', 'C:/Users/matia/AppData/Local/Temp/stock-cau'));

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 2200 } });

await pagina.goto(`https://unsplash.com/s/photos/${encodeURIComponent(consulta)}`, {
  waitUntil: 'load',
  timeout: 60000,
});
await pagina.waitForTimeout(6000);
// Un scroll para que entren las de más abajo, que suelen ser mejores que las
// primeras (las primeras están muy usadas).
await pagina.mouse.wheel(0, 4000);
await pagina.waitForTimeout(3000);

const urls = await pagina.evaluate(() =>
  // `srcset` además de `src`: Unsplash sirve las miniaturas por srcset y en
  // muchas tarjetas el `src` queda en un placeholder en blanco.
  Array.from(document.querySelectorAll('img'))
    .flatMap((i) => [i.src, ...(i.srcset || '').split(',').map((s) => s.trim().split(' ')[0])])
    .filter((s) => s && s.includes('images.unsplash.com/photo-'))
    // Sin los parámetros de recorte del listado: se piden en el ancho que se
    // necesita, no en el del thumbnail.
    .map((s) => s.split('?')[0])
);

await navegador.close();

const unicas = [...new Set(urls)].slice(0, cantidad * 3);
mkdirSync(destino, { recursive: true });

/** Luminancia media 0-255, para descartar las que van a quedar lavadas al subirles brillo. */
const luma = (buf) => {
  let s = 0;
  for (let i = 0; i < buf.length; i += 4) s += buf[i];
  return Math.round(s / (buf.length / 4));
};

const elegidas = [];
for (const url of unicas) {
  if (elegidas.length >= cantidad) break;
  const r = await fetch(`${url}?w=1600&q=85&fm=jpg`);
  if (!r.ok) continue;
  const bytes = Buffer.from(await r.arrayBuffer());
  const nombre = `${salida}-${elegidas.length + 1}.jpg`;
  writeFileSync(resolve(destino, nombre), bytes);
  elegidas.push({ nombre, url, kb: Math.round(bytes.length / 1024) });
  console.log(`  ${nombre}  ${Math.round(bytes.length / 1024)} KB  ${url.slice(-24)}`);
}

console.log(`\n${elegidas.length} en ${destino}`);
