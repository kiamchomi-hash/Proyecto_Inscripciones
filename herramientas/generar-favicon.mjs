/**
 * Genera el favicon del sitio desde el vector de la marca.
 *
 * La fuente es `public/imagenes/imagenes_cau/siglo21-marca.svg`, que trae el
 * logotipo completo "Universidad Siglo 21". De ahí se recorta el isologo — el
 * panel con el "21" —, que en el arte original es un cuadrado exacto de 268
 * unidades. Ese recorte es todo el favicon: sin margen, sin nada cortado.
 *
 * Los colores van invertidos respecto del logotipo (panel verde y "21" claro,
 * en vez de panel claro y "21" calado) porque así es el favicon que publica
 * 21.edu.ar. El de ellos es un JPEG de 48×48 recortado a mano; éste sale del
 * vector, así que las tres medidas del .ico quedan nítidas.
 *
 *   node herramientas/generar-favicon.mjs
 *
 * Escribe `public/favicon.ico` (16/32/48) y `public/icon.png` (48).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARCA = path.join(raiz, 'public/imagenes/imagenes_cau/siglo21-marca.svg');

// El isologo dentro del viewBox del logotipo completo.
const CAJA = { x: 831, y: 205, lado: 268 };

const VERDE = '#096757'; // panel
const CLARO = '#ffffff'; // el "21"
const FILO = '#00a88c';  // la franja de la derecha

const MEDIDAS = [16, 32, 48];

/** Arma el SVG del favicon reusando los paths del logotipo. */
function armarSvg() {
  const texto = readFileSync(MARCA, 'utf8');
  const paths = [...texto.matchAll(/<path\s+d="([^"]+)"/g)].map((m) => m[1]);
  if (paths.length !== 4) {
    throw new Error(`siglo21-marca.svg cambió: se esperaban 4 paths y hay ${paths.length}`);
  }
  // 0 el "2" (va como máscara en el original), 1 la tipografía, 2 el panel con
  // el "1" calado, 3 la franja de la derecha.
  const [dos, , panel, filo] = paths;
  const { x, y, lado } = CAJA;

  // La máscara deja pasar lo que NO es panel ni franja, y suma el "2": eso es
  // exactamente el negativo del isologo, o sea el "21" claro sobre el verde.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${lado} ${lado}">
  <rect x="${x}" y="${y}" width="${lado}" height="${lado}" fill="${VERDE}"/>
  <mask id="negativo">
    <rect x="${x}" y="${y}" width="${lado}" height="${lado}" fill="#fff"/>
    <path d="${panel}" fill="#000"/>
    <path d="${filo}" fill="#000"/>
    <path d="${dos}" fill="#fff"/>
  </mask>
  <rect x="${x}" y="${y}" width="${lado}" height="${lado}" fill="${CLARO}" mask="url(#negativo)"/>
  <path d="${filo}" fill="${FILO}"/>
</svg>`;
}

/** Empaqueta varios PNG cuadrados en un .ico. */
function empaquetarIco(pngs) {
  const cabecera = Buffer.alloc(6 + 16 * pngs.length);
  cabecera.writeUInt16LE(0, 0);
  cabecera.writeUInt16LE(1, 2); // tipo icono
  cabecera.writeUInt16LE(pngs.length, 4);

  let offset = cabecera.length;
  pngs.forEach(({ medida, buffer }, i) => {
    const p = 6 + i * 16;
    cabecera.writeUInt8(medida === 256 ? 0 : medida, p);
    cabecera.writeUInt8(medida === 256 ? 0 : medida, p + 1);
    cabecera.writeUInt8(0, p + 2); // paleta
    cabecera.writeUInt8(0, p + 3); // reservado
    cabecera.writeUInt16LE(1, p + 4); // planos
    cabecera.writeUInt16LE(32, p + 6); // bits por pixel
    cabecera.writeUInt32LE(buffer.length, p + 8);
    cabecera.writeUInt32LE(offset, p + 12);
    offset += buffer.length;
  });

  return Buffer.concat([cabecera, ...pngs.map((p) => p.buffer)]);
}

const svg = armarSvg();

// `density` alto para que el rasterizado parta de un bitmap grande y baje con
// buen filtro: a 16px cada pixel cuenta.
const pngs = [];
for (const medida of MEDIDAS) {
  const buffer = await sharp(Buffer.from(svg), { density: 1200 })
    .resize({ width: medida, height: medida })
    .png()
    .toBuffer();
  pngs.push({ medida, buffer });
}

writeFileSync(path.join(raiz, 'public/favicon.ico'), empaquetarIco(pngs));
writeFileSync(path.join(raiz, 'public/icon.png'), pngs.at(-1).buffer);

console.log(`favicon.ico  ${MEDIDAS.join('/')}`);
console.log(`icon.png     ${MEDIDAS.at(-1)}×${MEDIDAS.at(-1)}`);
