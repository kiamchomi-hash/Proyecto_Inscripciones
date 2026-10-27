// Genera la imagen para compartir (og:image) de cada carrera y curso de Teclab.
//
// Misma estetica que las portadas por familia de generar-og.mjs (tinta #071822,
// cian en Tecnologia y cursos, violeta en Gestion, logo co-branded), pero con la
// foto y el nombre de cada carrera: compartida por WhatsApp o redes, la tarjeta
// dice que carrera es y no solo la familia.
//
// Salida:
//   public/imagenes/og/teclab/<slug>.jpg   -> 1200x630, la sirve ogCarrera()
//   components/carreras/og-teclab.json     -> los slugs que tienen imagen propia.
//                                             Una carrera fuera de la lista sigue
//                                             con la portada de su familia.
//
// Uso: npm run og:teclab   (carga .env.local; lee la base con la anon key)
// Despues de dar de alta o renombrar una carrera de Teclab hay que volver a
// correrlo y commitear las imagenes y el json.

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { consultar } from './d1-consulta.mjs';
import { carreraFullName, carreraToSlug, esCarreraVisible } from '../components/index/types.ts';
import { esCursoTeclab, esTeclab, getFamiliaTeclab, getPortadaTeclab } from '../components/index/teclab.ts';


const W = 1200, H = 630;
const TINTA = '#071822';
const FUENTE = 'Segoe UI, Arial, sans-serif';
const DIR_OG = 'public/imagenes/og/teclab';
const MANIFIESTO = 'components/carreras/og-teclab.json';
// El violeta de Gestion es el de la marca; en la etiqueta de arriba, sobre la
// tinta, el puro se leia poco, asi que el texto va en uno mas claro y la barra
// en el de la marca.
const ACENTO = { tecnologia: '#2ee7d7', gestion: '#8e2cf2' };
const ACENTO_TEXTO = { tecnologia: '#2ee7d7', gestion: '#b47cff' };

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function envolver(texto, max) {
  const lineas = [];
  let actual = '';
  for (const p of texto.split(' ')) {
    if (actual && (actual + ' ' + p).length > max) { lineas.push(actual); actual = p; }
    else actual = actual ? actual + ' ' + p : p;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** "Tecnicatura Superior en" arriba, chico, y el nombre grande abajo. */
function partirNombre(carrera) {
  // El nombre en ingles entre parentesis ("(User Experience)") se saca, como
  // en la meta description: son dos renglones mas y el titulo ya lo cubre.
  const completo = carreraFullName(carrera).replace(/\s*\([^)]*\)/g, '');
  const prefijo = carrera.prefix?.trim() ?? '';
  if (prefijo && completo.toLowerCase().startsWith(prefijo.toLowerCase() + ' ')) {
    return { arriba: prefijo, nombre: completo.slice(prefijo.length + 1) };
  }
  return { arriba: '', nombre: completo };
}

function capa(carrera, acento, acentoTexto, etiqueta) {
  const { arriba, nombre } = partirNombre(carrera);
  // Hasta dos renglones a 62; si no entra, a 50 con renglones mas largos.
  let lineas = envolver(nombre, 20);
  let size = 62;
  if (lineas.length > 2) { lineas = envolver(nombre, 25); size = 50; }
  const paso = size + 12;
  // Prefijo, nombre y bajada se centran entre la etiqueta (y 120) y el logo
  // (y ~520), dejando aire arriba del logo.
  const altoBloque = (arriba ? 46 : 0) + lineas.length * paso + 44;
  const y0 = 135 + (360 - altoBloque) / 2;
  const yNombre = y0 + (arriba ? 46 : 0) + size;
  const tspans = lineas.map((l, i) => `<tspan x="76" y="${yNombre + i * paso}">${esc(l)}</tspan>`).join('');
  const bajada = ['100% online', carrera.duracion && carrera.duracion !== 'Consultar' ? carrera.duracion : null]
    .filter(Boolean).join(' · ');
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${TINTA}" stop-opacity="0.98"/>
      <stop offset="55%" stop-color="${TINTA}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${TINTA}" stop-opacity="0.1"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="76" y="92" font-family="${FUENTE}" font-size="25" font-weight="800" fill="${acentoTexto}" letter-spacing="3.5">TECLAB · ${esc(etiqueta.toUpperCase())}</text>
    <rect x="76" y="112" width="58" height="5" fill="${acento}"/>
    ${arriba ? `<text x="76" y="${y0 + 30}" font-family="${FUENTE}" font-size="30" font-weight="600" fill="rgba(255,255,255,0.8)">${esc(arriba)}</text>` : ''}
    <text font-family="${FUENTE}" font-size="${size}" font-weight="800" fill="#ffffff">${tspans}</text>
    <text x="76" y="${yNombre + (lineas.length - 1) * paso + 48}" font-family="${FUENTE}" font-size="26" font-weight="700" fill="rgba(255,255,255,0.88)">${esc(bajada)}</text>
  </svg>`;
}

// Lee de la base de producción en Cloudflare (D1): Supabase se dio de baja.
let data;
try {
  data = consultar(`SELECT nombre, prefix, nombre_corto, nivel, duracion, activa
    FROM carreras WHERE activa = 1`)
    .map(fila => ({ ...fila, activa: fila.activa === 1 }));
} catch (error) {
  console.error('No se pudo leer carreras:', String(error.message ?? error).slice(0, 200));
  process.exit(1);
}

const logo = await sharp('public/imagenes/teclab/logo-teclab-siglo21.webp').resize({ width: 300 }).toBuffer();
const altoLogo = (await sharp(logo).metadata()).height;
mkdirSync(DIR_OG, { recursive: true });

const slugs = [];
const sinFoto = [];
for (const carrera of data.filter(c => esCarreraVisible(c) && (esTeclab(c) || esCursoTeclab(c)))) {
  const slug = carreraToSlug(carrera);
  const portada = getPortadaTeclab(carrera);
  if (!portada) { sinFoto.push(slug); continue; }
  const familia = getFamiliaTeclab(carrera);
  const acento = ACENTO[familia] ?? ACENTO.tecnologia;
  const acentoTexto = ACENTO_TEXTO[familia] ?? ACENTO_TEXTO.tecnologia;
  const etiqueta = familia === 'gestion' ? 'Gestión' : familia === 'tecnologia' ? 'Tecnología' : 'Curso';

  const buf = await sharp(`public${portada}`)
    .resize(W, H, { fit: 'cover', position: 'attention', kernel: 'lanczos3' })
    .composite([
      { input: Buffer.from(capa(carrera, acento, acentoTexto, etiqueta)), top: 0, left: 0 },
      { input: logo, top: 560 - altoLogo, left: 76 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await sharp(buf).toFile(`${DIR_OG}/${slug}.jpg`);
  slugs.push(slug);
  console.log(`${slug} — ${Math.round(buf.length / 1024)} KB`);
}

slugs.sort();
writeFileSync(MANIFIESTO, JSON.stringify({ slugs }, null, 2) + '\n');
console.log(`\n${slugs.length} imagenes -> ${DIR_OG}/ y ${MANIFIESTO}`);
if (sinFoto.length) console.log(`Sin foto, siguen con la portada de su familia: ${sinFoto.join(', ')}`);
