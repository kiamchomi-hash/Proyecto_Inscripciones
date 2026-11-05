// Genera las imágenes para compartir de las carreras activas de Teclab.
// Usa las fotos y datos de producción; las imágenes que no se regeneran se
// conservan en el manifiesto para no retirar recursos de carreras anteriores.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { consultar } from './d1-consulta.mjs';
import { carreraFullName, carreraToSlug, esCarreraVisible } from '../components/index/types.ts';
import { esCursoTeclab, esTeclab, getFamiliaTeclab, getPortadaTeclab } from '../components/index/teclab.ts';

const DIR = 'public/imagenes/og/teclab';
const MANIFIESTO = 'components/carreras/og-teclab.json';
const dataUrl = (ruta, tipo) => `data:${tipo};base64,${readFileSync(ruta).toString('base64')}`;
const fuente700 = dataUrl('public/fuentes/poppins-latin-700.woff2', 'font/woff2');
const fuente600 = dataUrl('public/fuentes/poppins-latin-600.woff2', 'font/woff2');
const logo = dataUrl('public/imagenes/teclab/logo-teclab-siglo21.webp', 'image/webp');
const escapar = valor => String(valor).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const carreras = consultar(`SELECT nombre, prefix, nombre_corto, nivel, duracion, activa
  FROM carreras WHERE activa = 1`).map(c => ({ ...c, activa: c.activa === 1 }))
  .filter(c => esCarreraVisible(c) && (esTeclab(c) || esCursoTeclab(c)));
const slugs = new Set(JSON.parse(readFileSync(MANIFIESTO, 'utf8')).slugs);
const sinFoto = [];
mkdirSync(DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const carrera of carreras) {
    const slug = carreraToSlug(carrera);
    const portada = getPortadaTeclab(carrera);
    if (!portada) { sinFoto.push(slug); continue; }
    const familia = getFamiliaTeclab(carrera);
    const etiqueta = familia === 'gestion' ? 'Gestión' : familia === 'tecnologia' ? 'Tecnología' : 'Curso';
    const color = familia === 'gestion' ? '#8e2cf2' : '#2ee7d7';
    const tinta = familia === 'gestion' ? '#fff' : '#071822';
    const completo = carreraFullName(carrera).replace(/\s*\([^)]*\)/g, '');
    const prefix = carrera.prefix?.trim() ?? '';
    const tienePrefijo = prefix && completo.toLowerCase().startsWith(`${prefix.toLowerCase()} `);
    const nombre = tienePrefijo ? completo.slice(prefix.length + 1) : completo;
    const fondo = await sharp(`public${portada}`).resize(1200, 630, { fit: 'cover', position: 'attention' }).webp().toBuffer();
    const imagen = `data:image/webp;base64,${fondo.toString('base64')}`;
    const duracion = carrera.duracion && carrera.duracion !== 'Consultar' ? `<span class="pill">${escapar(carrera.duracion)}</span>` : '';
    const html = `<style>
      @font-face{font-family:Poppins;src:url(${fuente700});font-weight:700}
      @font-face{font-family:Poppins;src:url(${fuente600});font-weight:600}
      *{box-sizing:border-box}body{margin:0}.card{width:1200px;height:630px;position:relative;overflow:hidden;
        background:linear-gradient(90deg,rgba(7,24,34,.96),rgba(7,24,34,.85) 55%,rgba(7,24,34,.22)),url(${imagen}) center/cover;
        color:#fff;font-family:Poppins,sans-serif}
      .legibilidad{position:absolute;left:0;right:0;top:80px;height:390px;background:linear-gradient(180deg,transparent,rgba(7,24,34,.78) 28%,rgba(7,24,34,.78) 72%,transparent)}
      .noise{position:absolute;inset:0;opacity:.11;mix-blend-mode:soft-light}
      .title{position:absolute;left:45px;right:45px;top:83px;height:350px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;text-align:center}
      .top{font-size:48px;font-weight:600;letter-spacing:-1px;color:#ecf1f2}.name{font-size:120px;font-weight:700;letter-spacing:-4px;line-height:1.05}
      .logo{position:absolute;width:300px;left:76px;bottom:54px}.pills{position:absolute;right:50px;bottom:56px;display:flex;gap:12px}
      .pill{background:#f0f0f6;color:#071822;border-radius:30px;padding:13px 23px;font-size:21px;font-weight:600}.tipo{background:${color};color:${tinta}}
      </style><div class="card"><div class="legibilidad"></div><svg class="noise" width="1200" height="630"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="1200" height="630" filter="url(#n)"/></svg>
      <div class="title">${tienePrefijo ? `<div class="top">${escapar(prefix)}</div>` : ''}<div class="name">${escapar(nombre)}</div></div>
      <img class="logo" src="${logo}"><div class="pills"><span class="pill">100% online</span>${duracion}<span class="pill tipo">${etiqueta}</span></div></div>`;
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    // Reducir de a poco hasta que el título entre en el área libre y no se
    // superponga con el pie; el navegador decide los cortes por palabras.
    await page.evaluate(() => {
      const nombre = document.querySelector('.name');
      const titulo = document.querySelector('.title');
      let size = 120;
      while (size > 42 && (nombre.scrollWidth > nombre.clientWidth || nombre.offsetHeight + (document.querySelector('.top')?.offsetHeight ?? 0) > titulo.clientHeight)) {
        size -= 2;
        nombre.style.fontSize = `${size}px`;
      }
    });
    const captura = await page.screenshot();
    await sharp(captura).jpeg({ quality: 82, mozjpeg: true }).toFile(`${DIR}/${slug}.jpg`);
    slugs.add(slug);
    console.log(slug);
  }
} finally {
  await browser.close();
}
writeFileSync(MANIFIESTO, `${JSON.stringify({ slugs: [...slugs].sort() }, null, 2)}\n`);
console.log(`${carreras.length - sinFoto.length} imágenes generadas. Sin foto: ${sinFoto.join(', ') || 'ninguna'}`);
