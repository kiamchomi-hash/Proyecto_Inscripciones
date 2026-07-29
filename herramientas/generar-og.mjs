// Genera las imagenes de las novedades a partir de las fotos de public/.
//
// Por cada articulo salen dos derivados de 1200x630:
//   public/imagenes/novedades/<slug>.jpg  -> foto limpia. Va en imagen_url: la usan
//                                            la tarjeta del listado y la cabecera del articulo.
//   public/imagenes/og/<slug>.jpg         -> la misma foto con el titulo compuesto encima.
//                                            La sirve generateMetadata como og:image.
//
// Son dos porque el titulo compuesto quedaria duplicado con el <h1> del articulo.
//
// Uso: node herramientas/generar-og.mjs [carpeta-de-salida-extra]

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const W = 1200, H = 630;
const VERDE = '#013729';
const ACENTO = '#00c7b1';
const DORADO = '#e69b05';
const FUENTE = 'Segoe UI, Arial, sans-serif';

const DIR_LIMPIA = 'public/imagenes/novedades';
const DIR_OG = 'public/imagenes/og';
const DIR_EXTRA = process.argv[2] || null; // copia para la vista previa

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

// Ancho aproximado de un texto en mayusculas con Segoe UI bold, para dimensionar el chip.
function anchoMayusculas(texto, size, ls) {
  return texto.length * size * 0.66 + Math.max(0, texto.length - 1) * ls;
}

function chipTag(tag) {
  const size = 20, ls = 2, padX = 20, alto = 44, baseY = 534;
  const t = tag.toUpperCase();
  const ancho = anchoMayusculas(t, size, ls) + padX * 2;
  const x = W - 76 - ancho;
  return `<rect x="${x}" y="${baseY - alto / 2}" width="${ancho}" height="${alto}" rx="${alto / 2}" fill="${DORADO}"/>
    <text x="${x + ancho / 2 - ls / 2}" y="${baseY + 7}" text-anchor="middle" font-family="${FUENTE}" font-size="${size}" font-weight="700" fill="#2a1a00" letter-spacing="${ls}">${esc(t)}</text>`;
}

function capa({ titulo, tag }) {
  const lineas = envolver(titulo, 22);
  const size = lineas.length >= 4 ? 46 : lineas.length === 3 ? 54 : 60;
  const alto = lineas.length * (size + 14);
  const y0 = (H - alto) / 2 + size;
  const tspans = lineas.map((l, i) => `<tspan x="76" y="${y0 + i * (size + 14)}">${esc(l)}</tspan>`).join('');
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${VERDE}" stop-opacity="0.98"/>
      <stop offset="52%" stop-color="${VERDE}" stop-opacity="0.90"/>
      <stop offset="100%" stop-color="${VERDE}" stop-opacity="0.10"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="76" y="92" font-family="${FUENTE}" font-size="27" font-weight="800" fill="#ffffff" letter-spacing="3.5">CAU VILLA LUGANO</text>
    <rect x="76" y="112" width="58" height="5" fill="${ACENTO}"/>
    <text font-family="${FUENTE}" font-size="${size}" font-weight="800" fill="#ffffff">${tspans}</text>
    <text x="76" y="${534 + 8}" font-family="${FUENTE}" font-size="25" font-weight="700" fill="#ffffff">siglo21sur.com</text>
    ${chipTag(tag)}
  </svg>`;
}

// --- Marca del convenio -----------------------------------------------------
// La Academia Identidad Argentina no es Siglo 21: son diplomaturas de convenio.
// Sus piezas no llevan el sello CAU, ni el verde institucional, ni el dominio
// escrito encima. Van con su propio lenguaje: fondo tinta, azul y amarillo, y el
// isotipo real (mismo path que components/index/ia-isotipo.tsx).
const IA_TINTA = '#101820';
const IA_AZUL = '#0090c1';
const IA_AMARILLO = '#f1cf1c';

const IA_ISOTIPO = `<g transform="translate(76,486) scale(0.0416)">
  <polygon fill="${IA_AZUL}" points="8.78,1501.47 8.78,0 356.27,0 356.27,1501.47"/>
  <path fill="${IA_AMARILLO}" d="M409.76 1501.47l261.12 -585.82 346.86 0.25 -251.91 585.57 -356.07 0zm669.23 -1501.46l343.19 0 671.38 1501.46 -364.64 0c-51.85,-125.8 -656.89,-1469.04 -649.92,-1501.46zm-334.61 1179.72l92.23 -263.83 772.18 0 94.37 263.83 -958.79 0z"/>
</g>`;

function capaIdentidadArgentina({ titulo, tag }) {
  const lineas = envolver(titulo, 22);
  const size = lineas.length >= 4 ? 46 : lineas.length === 3 ? 54 : 60;
  const alto = lineas.length * (size + 14);
  const y0 = (H - alto) / 2 + size - 10;
  const tspans = lineas.map((l, i) => `<tspan x="76" y="${y0 + i * (size + 14)}">${esc(l)}</tspan>`).join('');

  const sizeChip = 20, ls = 2, padX = 20, altoChip = 44, baseY = 534;
  const t = tag.toUpperCase();
  const anchoChip = anchoMayusculas(t, sizeChip, ls) + padX * 2;
  const xChip = W - 76 - anchoChip;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${IA_TINTA}" stop-opacity="0.98"/>
      <stop offset="52%" stop-color="${IA_TINTA}" stop-opacity="0.91"/>
      <stop offset="100%" stop-color="${IA_TINTA}" stop-opacity="0.12"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="76" y="92" font-family="${FUENTE}" font-size="27" font-weight="800" fill="#ffffff" letter-spacing="3.5">ACADEMIA IDENTIDAD ARGENTINA</text>
    <rect x="76" y="112" width="58" height="5" fill="${IA_AMARILLO}"/>
    <text font-family="${FUENTE}" font-size="${size}" font-weight="800" fill="#ffffff">${tspans}</text>
    ${IA_ISOTIPO}
    <rect x="${xChip}" y="${baseY - altoChip / 2}" width="${anchoChip}" height="${altoChip}" rx="${altoChip / 2}" fill="${IA_AMARILLO}"/>
    <text x="${xChip + anchoChip / 2 - ls / 2}" y="${baseY + 7}" text-anchor="middle" font-family="${FUENTE}" font-size="${sizeChip}" font-weight="700" fill="${IA_TINTA}" letter-spacing="${ls}">${esc(t)}</text>
  </svg>`;
}

// La foto limpia lleva un velo muy suave: unifica el set y despega el texto blanco
// de las tarjetas del listado, que se dibujan encima.
const VELO_LIMPIA = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${VERDE}" stop-opacity="0.06"/>
    <stop offset="100%" stop-color="${VERDE}" stop-opacity="0.30"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#s)"/>
</svg>`;

const ARTICULOS = [
  { id: 60, slug: 'segundo-semestre-2026-inicio-3-de-agosto', tag: 'Institucional',
    titulo: 'El segundo semestre 2026 empieza el 3 de agosto',
    foto: 'public/imagenes/Modales/Tecnicatura en Marketing y Publicidad Digital/Foto hero Tecnicatura en Marketing.webp' },
  { id: 61, slug: 'documentacion-legajo-inscripcion', tag: 'Académico',
    titulo: 'Qué papeles pide el legajo de inscripción',
    foto: 'public/imagenes/Modales/Escribanía/Hero-escribania.jpg' },
  { id: 62, slug: 'que-es-el-cau-villa-lugano', tag: 'Institucional',
    titulo: 'Qué es el CAU Villa Lugano y cómo funciona',
    foto: 'public/imagenes/imagenes_cau/edificio_siglo21_campus2.webp' },
  { id: 63, slug: 'clases-de-apoyo-como-reservar-turno', tag: 'Académico',
    titulo: 'Clases de apoyo: cómo reservar un turno',
    foto: 'public/imagenes/Modales/Licenciatura en Educación y Nuevas Tecnologías/Foto-hero-educacion-y-nuevas-tecnologias.webp' },
  { id: 64, slug: 'carreras-de-grado-a-distancia', tag: 'Académico',
    titulo: 'Las 43 licenciaturas que podés cursar a distancia',
    foto: 'public/imagenes/imagenes_cau/edificio_siglo21_campus.jpg' },
  { id: 65, slug: 'tecnicaturas-pregrado-dos-tres-anos', tag: 'Académico',
    titulo: 'Tecnicaturas: un título universitario en 2 o 3 años',
    foto: 'public/imagenes/Modales/Tecnicatura en Gestión Contable e impositiva/Foto-hero-gestion-contable-e-impositiva.webp' },
  { id: 66, slug: 'teclab-tecnicaturas-online', tag: 'Académico',
    titulo: 'Teclab: 17 tecnicaturas de dos años en tecnología y gestión',
    foto: 'public/imagenes/teclab/carreras/programacion.webp' },
  // Convenio, no Siglo 21: va con la marca de la Academia. La foto es generica a
  // proposito, sin cartel ni logo de la universidad.
  { id: 67, slug: 'identidad-argentina-diplomaturas', tag: 'Institucional', marca: 'ia',
    titulo: 'Identidad Argentina: 11 diplomaturas cortas',
    foto: 'public/imagenes/Modales/Licenciatura en Relaciones Públicas e Institucionales/Foto-hero-relaciones-publicas-e-institucionales.webp' },
  { id: 68, slug: 'ivu-universitario-21-inicio-cursada', tag: 'Académico',
    titulo: 'Antes de la primera materia: IVU y Universitario 21',
    foto: 'public/imagenes/imagenes_cau/Siglo21IMG_2555.jpg' },
  // La entrada real del local mide 475x598: es la unica foto correcta para este tema,
  // pero estirarla a 1200x630 la deja blanda. Se genera tambien la variante con el
  // campus para poder comparar antes de decidir.
  { id: 69, slug: 'donde-queda-el-cau-villa-lugano', tag: 'Institucional',
    titulo: 'Dónde queda el CAU Villa Lugano y cómo llegar',
    foto: 'public/imagenes/imagenes_cau/entrada_estetica.png' },
  { id: 69, slug: 'donde-queda-el-cau-villa-lugano-ALT', tag: 'Institucional', alterna: true,
    titulo: 'Dónde queda el CAU Villa Lugano y cómo llegar',
    foto: 'public/imagenes/imagenes_cau/Edificio_siglo21_campus3.jpg' },
];

for (const d of [DIR_LIMPIA, DIR_OG, DIR_EXTRA].filter(Boolean)) mkdirSync(d, { recursive: true });

// Imagen por defecto del sitio: la toma el layout, asi la home y las fichas de
// carrera dejan de compartirse sin miniatura. No lleva chip de tag ni titulo de
// articulo porque tiene que servir para cualquier pagina.
{
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${VERDE}" stop-opacity="0.98"/>
      <stop offset="52%" stop-color="${VERDE}" stop-opacity="0.90"/>
      <stop offset="100%" stop-color="${VERDE}" stop-opacity="0.10"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="76" y="92" font-family="${FUENTE}" font-size="27" font-weight="800" fill="#ffffff" letter-spacing="3.5">CAU VILLA LUGANO</text>
    <rect x="76" y="112" width="58" height="5" fill="${ACENTO}"/>
    <text font-family="${FUENTE}" font-size="60" font-weight="800" fill="#ffffff">
      <tspan x="76" y="290">Universidad Siglo 21</tspan>
      <tspan x="76" y="364">a distancia, en Lugano</tspan>
    </text>
    <text x="76" y="426" font-family="${FUENTE}" font-size="27" font-weight="600" fill="rgba(255,255,255,0.80)">Licenciaturas, tecnicaturas y diplomaturas</text>
    <text x="76" y="${534 + 8}" font-family="${FUENTE}" font-size="25" font-weight="700" fill="#ffffff">siglo21sur.com</text>
  </svg>`;

  const buf = await sharp('public/imagenes/imagenes_cau/edificio_siglo21_campus2.webp')
    .resize(W, H, { fit: 'cover', position: 'attention', kernel: 'lanczos3' })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  await sharp(buf).toFile(`${DIR_OG}/default.jpg`);
  if (DIR_EXTRA) await sharp(buf).toFile(`${DIR_EXTRA}/final-og-default.jpg`);
  console.log(`default (sitio) — og ${Math.round(buf.length / 1024)} KB`);
}

// Imagen por defecto de las fichas de Identidad Argentina. Con la del sitio, las 11
// diplomaturas de convenio se compartirian con el cartel de Siglo 21 encima.
{
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${IA_TINTA}" stop-opacity="0.98"/>
      <stop offset="52%" stop-color="${IA_TINTA}" stop-opacity="0.91"/>
      <stop offset="100%" stop-color="${IA_TINTA}" stop-opacity="0.12"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="76" y="92" font-family="${FUENTE}" font-size="27" font-weight="800" fill="#ffffff" letter-spacing="3.5">ACADEMIA IDENTIDAD ARGENTINA</text>
    <rect x="76" y="112" width="58" height="5" fill="${IA_AMARILLO}"/>
    <text font-family="${FUENTE}" font-size="60" font-weight="800" fill="#ffffff">
      <tspan x="76" y="282">Diplomaturas cortas,</tspan>
      <tspan x="76" y="356">100% online</tspan>
    </text>
    <text x="76" y="418" font-family="${FUENTE}" font-size="27" font-weight="600" fill="rgba(255,255,255,0.80)">De 1 a 6 meses, con certificación</text>
    ${IA_ISOTIPO}
  </svg>`;

  const buf = await sharp('public/imagenes/Modales/Licenciatura en Relaciones Públicas e Institucionales/Foto-hero-relaciones-publicas-e-institucionales.webp')
    .resize(W, H, { fit: 'cover', position: 'attention', kernel: 'lanczos3' })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  await sharp(buf).toFile(`${DIR_OG}/default-identidad-argentina.jpg`);
  if (DIR_EXTRA) await sharp(buf).toFile(`${DIR_EXTRA}/final-og-default-ia.jpg`);
  console.log(`default (Identidad Argentina) — og ${Math.round(buf.length / 1024)} KB`);
}

// Portadas de Teclab. Es el Instituto Tecnico Superior, otra marca: hasta ahora sus
// 17 tecnicaturas se compartian con la portada de Siglo 21. Van las dos esteticas
// del render, cian para Tecnologia y violeta para Gestion, sobre tinta #071822.
{
  const TECLAB_INK = '#071822';
  const FAMILIAS = [
    { id: 'tecnologia', etiqueta: 'Tecnología', acento: '#2ee7d7',
      linea1: 'Tecnicaturas en', linea2: 'tecnología',
      bajada: 'Programación, Data Science, Cloud, Redes',
      foto: 'public/imagenes/teclab/carreras/programacion.webp' },
    { id: 'gestion', etiqueta: 'Gestión', acento: '#8e2cf2',
      linea1: 'Tecnicaturas en', linea2: 'gestión y negocios',
      bajada: 'Marketing, Seguros, Hotelería, Eventos',
      // venta-directa recortaba a una escena a contraluz, casi negra.
      foto: 'public/imagenes/teclab/carreras/inbound-marketing.webp' },
  ];

  const logo = await sharp('public/imagenes/teclab/logo-teclab.webp')
    .resize({ width: 210 })
    .toBuffer();

  for (const f of FAMILIAS) {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${TECLAB_INK}" stop-opacity="0.98"/>
        <stop offset="52%" stop-color="${TECLAB_INK}" stop-opacity="0.91"/>
        <stop offset="100%" stop-color="${TECLAB_INK}" stop-opacity="0.12"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <text x="76" y="92" font-family="${FUENTE}" font-size="25" font-weight="800" fill="${f.acento}" letter-spacing="3.5">TECLAB · ${esc(f.etiqueta.toUpperCase())}</text>
      <rect x="76" y="112" width="58" height="5" fill="${f.acento}"/>
      <text font-family="${FUENTE}" font-size="60" font-weight="800" fill="#ffffff">
        <tspan x="76" y="286">${f.linea1}</tspan>
        <tspan x="76" y="360">${f.linea2}</tspan>
      </text>
      <text x="76" y="422" font-family="${FUENTE}" font-size="26" font-weight="600" fill="rgba(255,255,255,0.78)">${esc(f.bajada)}</text>
    </svg>`;

    const buf = await sharp(f.foto)
      .resize(W, H, { fit: 'cover', position: 'attention', kernel: 'lanczos3' })
      .composite([
        { input: Buffer.from(svg), top: 0, left: 0 },
        { input: logo, top: 494, left: 76 },
      ])
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    await sharp(buf).toFile(`${DIR_OG}/default-teclab-${f.id}.jpg`);
    if (DIR_EXTRA) await sharp(buf).toFile(`${DIR_EXTRA}/final-og-teclab-${f.id}.jpg`);
    console.log(`default (Teclab ${f.etiqueta}) — og ${Math.round(buf.length / 1024)} KB`);
  }
  console.log('');
}

for (const a of ARTICULOS) {
  const base = () => sharp(a.foto).resize(W, H, { fit: 'cover', position: 'attention', kernel: 'lanczos3' });

  const limpia = await base()
    .composite([{ input: Buffer.from(VELO_LIMPIA), top: 0, left: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  const dibujar = a.marca === 'ia' ? capaIdentidadArgentina : capa;
  const og = await base()
    .composite([{ input: Buffer.from(dibujar(a)), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  // La alternativa de la #69 no se publica: es solo para comparar.
  if (!a.alterna) {
    await sharp(limpia).toFile(`${DIR_LIMPIA}/${a.slug}.jpg`);
    await sharp(og).toFile(`${DIR_OG}/${a.slug}.jpg`);
  }
  if (DIR_EXTRA) {
    await sharp(limpia).toFile(`${DIR_EXTRA}/final-limpia-${a.slug}.jpg`);
    await sharp(og).toFile(`${DIR_EXTRA}/final-og-${a.slug}.jpg`);
  }

  const kb = Math.round(og.length / 1024);
  console.log(`#${a.id} ${a.alterna ? '(alternativa) ' : ''}${a.slug} — og ${kb} KB`);
}

console.log(`\nLimpias -> ${DIR_LIMPIA}/`);
console.log(`og      -> ${DIR_OG}/`);
