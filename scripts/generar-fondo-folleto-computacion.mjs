import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const out = path.join(root, 'output', 'folleto-computacion');
fs.mkdirSync(out, { recursive: true });

// Etapa 1: sólo el campo de fondo. La malla y el halo toman cualidades de
// referencias propias del UIverse local, pero se redibujan para este A5 y para
// una salida estática de impresión.
const defs = `
  <defs>
    <filter id="blur-xl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="88"/></filter>
    <filter id="blur-md" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="38"/></filter>
    <filter id="grain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.028"/></feComponentTransfer>
    </filter>
  </defs>`;

function svgFor(variant) {
  const scenes = {
    masas: `
      <rect width="1540" height="2160" fill="#071d1d"/>
      <!-- Grandes masas de color, con bordes suaves y pocas capas. No hay
           degradados ni líneas: el ritmo lo dan las siluetas. -->
      <path d="M-240 0H1040C920 240 850 490 930 730C1030 1030 870 1190 560 1210C270 1230 20 1100-240 930Z" fill="#0b4d45"/>
      <path d="M-180 0H700C590 250 560 520 690 700C790 840 710 1010 470 1050C220 1090 0 930-180 760Z" fill="#12675b" opacity=".62" filter="url(#blur-md)"/>
      <path d="M780 520C1050 380 1390 460 1660 680V1500C1430 1370 1190 1320 1030 1430C850 1550 650 1440 680 1210C710 930 690 680 780 520Z" fill="#053a36"/>
      <path d="M720 1480C980 1270 1330 1370 1660 1610V2240H360C430 1950 560 1690 720 1480Z" fill="#0a5c51" opacity=".66"/>
      <path d="M1180 -180C1400 40 1490 260 1450 520C1420 710 1300 820 1150 740C1000 660 1040 420 1080 230C1110 70 1120 -60 1180 -180Z" fill="#00b9a6" opacity=".2" filter="url(#blur-md)"/>`,
    pliegues: `
      <rect width="1540" height="2160" fill="#061c1c"/>
      <rect x="-500" y="-220" width="1850" height="2350" rx="850" fill="#0b4b43" filter="url(#blur-xl)" transform="rotate(-17 420 900)"/>
      <ellipse cx="1450" cy="500" rx="520" ry="930" fill="#00c7b1" opacity=".2" filter="url(#blur-xl)"/>
      <path d="M1420 -120C1040 240 1190 560 1490 750C1720 895 1660 1260 1330 1490" fill="none" stroke="#38dfca" stroke-width="170" opacity=".16" filter="url(#blur-md)"/>
      <path d="M1550 20C1290 300 1320 600 1530 760" fill="none" stroke="#8cf1e4" stroke-width="20" opacity=".16" filter="url(#blur-md)"/>
      <ellipse cx="210" cy="1940" rx="560" ry="390" fill="#013729" opacity=".72" filter="url(#blur-xl)"/>`,
    halo: `
      <rect width="1540" height="2160" fill="#061b1b"/>
      <ellipse cx="190" cy="260" rx="920" ry="660" fill="#00c7b1" opacity=".23" filter="url(#blur-xl)"/>
      <ellipse cx="330" cy="70" rx="560" ry="400" fill="#8cf1e4" opacity=".13" filter="url(#blur-md)"/>
      <ellipse cx="1400" cy="1380" rx="470" ry="760" fill="#075b50" opacity=".48" filter="url(#blur-xl)"/>
      <path d="M-120 700C330 470 720 560 900 890C1070 1200 1340 1250 1660 1020" fill="none" stroke="#0b5b51" stroke-width="260" opacity=".42" filter="url(#blur-xl)"/>
      <rect width="1540" height="2160" fill="#00c7b1" opacity=".018" filter="url(#grain)"/>`,
    acuatico: `
      <rect width="1540" height="2160" fill="#041819"/>
      <ellipse cx="780" cy="380" rx="880" ry="510" fill="#0a5d55" opacity=".42" filter="url(#blur-xl)"/>
      <ellipse cx="620" cy="460" rx="480" ry="270" fill="#35d9c4" opacity=".16" filter="url(#blur-md)"/>
      <ellipse cx="1020" cy="1510" rx="760" ry="700" fill="#013729" opacity=".9" filter="url(#blur-xl)"/>
      <path d="M-160 1660C330 1360 600 1540 880 1760C1120 1945 1320 1930 1690 1660" fill="none" stroke="#08776a" stroke-width="300" opacity=".2" filter="url(#blur-xl)"/>
      <rect width="1540" height="2160" fill="#00c7b1" opacity=".022" filter="url(#grain)"/>`
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1540" height="2160" viewBox="0 0 1540 2160">
  ${defs}
  ${scenes[variant]}
</svg>`;
}

for (const variant of ['masas', 'pliegues', 'halo', 'acuatico']) {
  const svg = svgFor(variant);
  const masterPath = path.join(out, `fondo-${variant}-computacion-master.svg`);
  const pngPath = path.join(out, `fondo-${variant}-computacion-a5-300dpi.png`);
  const previewPath = path.join(out, `fondo-${variant}-computacion-preview.webp`);
  fs.writeFileSync(masterPath, svg, 'utf8');
  await sharp(Buffer.from(svg)).png().resize(1819, 2551).toFile(pngPath);
  await sharp(pngPath).resize(455, 638).webp({ quality: 88 }).toFile(previewPath);
}

console.log('Fondos generados: pliegues, halo y acuático');
