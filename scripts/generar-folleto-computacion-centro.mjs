import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ancho = 1540;
const alto = 2160;
const salida = 'output/folleto-computacion-centro-educativo.png';
const logoOriginal = sharp('public/imagenes/imagenes_cau/logo_cau.png').ensureAlpha();
const { data: logoPixels, info: logoInfo } = await logoOriginal.raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < logoPixels.length; i += logoInfo.channels) {
  const rojo = logoPixels[i];
  const verde = logoPixels[i + 1];
  const azul = logoPixels[i + 2];
  if (rojo > 220 && verde > 220 && azul > 220) {
    logoPixels[i + 3] = 0;
  } else if (logoPixels[i + 3] > 0) {
    logoPixels[i] = 255;
    logoPixels[i + 1] = 255;
    logoPixels[i + 2] = 255;
  }
}
const logoBlanco = await sharp(logoPixels, {
  raw: { width: logoInfo.width, height: logoInfo.height, channels: logoInfo.channels },
}).png().toBuffer();
const logoCentro = logoBlanco.toString('base64');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#101b36"/>
      <stop offset="1" stop-color="#182d4e"/>
    </linearGradient>
    <linearGradient id="pantalla" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8ef0df"/>
      <stop offset="1" stop-color="#43c5d8"/>
    </linearGradient>
    <pattern id="trama" width="58" height="58" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
      <path d="M0 0V58M29 0V58" stroke="#d8fff5" stroke-opacity=".07" stroke-width="2"/>
    </pattern>
    <filter id="sombra" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#061022" flood-opacity=".42"/>
    </filter>
  </defs>

  <rect width="1540" height="2160" fill="url(#fondo)"/>
  <rect width="1540" height="2160" fill="url(#trama)"/>

  <path d="M1540 0H1155L1540 385Z" fill="#0d5d56"/>
  <image href="data:image/png;base64,${logoCentro}" x="112" y="118" width="280" height="280" preserveAspectRatio="xMidYMid meet"/>

  <text x="440" y="250" fill="#ffffff" font-family="Arial, sans-serif" font-size="98" font-weight="800" letter-spacing="-3">CLASES DE</text>
  <text x="436" y="365" fill="#f7c948" font-family="Arial, sans-serif" font-size="112" font-weight="800" letter-spacing="-4">COMPUTACIÓN</text>
  <text x="442" y="438" fill="#d8fff5" font-family="Arial, sans-serif" font-size="33" font-weight="400">Aprendé paso a paso, con acompañamiento</text>

  <g transform="translate(112 660)" filter="url(#sombra)">
    <rect x="0" y="0" width="1316" height="630" rx="34" fill="#0d1830" stroke="#70e1d4" stroke-opacity=".34" stroke-width="3"/>
    <rect x="88" y="78" width="930" height="414" rx="22" fill="url(#pantalla)"/>
    <rect x="88" y="78" width="930" height="414" rx="22" fill="#0d1830" opacity=".13"/>
    <path d="M128 445L345 270L515 374L698 196L985 445Z" fill="#ffffff" opacity=".38"/>
    <rect x="164" y="134" width="260" height="26" rx="13" fill="#ffffff" opacity=".72"/>
    <rect x="164" y="184" width="420" height="18" rx="9" fill="#ffffff" opacity=".48"/>
    <rect x="164" y="222" width="330" height="18" rx="9" fill="#ffffff" opacity=".48"/>
    <circle cx="892" cy="172" r="37" fill="#f7c948"/>
    <path d="M452 532H866L956 588H362Z" fill="#d8fff5"/>
    <path d="M362 588H956L1058 606Q1076 612 1056 624H260Q240 612 258 606Z" fill="#70e1d4"/>
    <path d="M1080 262l80 180-50-36-31 62z" fill="#f7c948" stroke="#101b36" stroke-width="12" stroke-linejoin="round"/>
    <circle cx="1194" cy="500" r="45" fill="#f7c948"/>
    <path d="M1178 500h32M1194 484v32" stroke="#101b36" stroke-width="8" stroke-linecap="round"/>
  </g>

  <g transform="translate(112 1510)">
    <text x="0" y="0" fill="#ffffff" font-family="Arial, sans-serif" font-size="33" font-weight="700">Vas a aprender a:</text>
    <g transform="translate(0 42)">
      <circle cx="18" cy="18" r="18" fill="#f7c948"/>
      <path d="M9 18l7 7 13-16" fill="none" stroke="#101b36" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="56" y="29" fill="#d8fff5" font-family="Arial, sans-serif" font-size="34">Usar la computadora con confianza</text>
    </g>
    <g transform="translate(0 108)">
      <circle cx="18" cy="18" r="18" fill="#f7c948"/>
      <path d="M9 18l7 7 13-16" fill="none" stroke="#101b36" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="56" y="29" fill="#d8fff5" font-family="Arial, sans-serif" font-size="34">Navegar por internet y usar el correo</text>
    </g>
    <g transform="translate(0 174)">
      <circle cx="18" cy="18" r="18" fill="#f7c948"/>
      <path d="M9 18l7 7 13-16" fill="none" stroke="#101b36" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="56" y="29" fill="#d8fff5" font-family="Arial, sans-serif" font-size="34">Crear y guardar tus propios documentos</text>
    </g>
  </g>

  <rect x="112" y="1888" width="1316" height="1" fill="#d8fff5" opacity=".35"/>
  <g transform="translate(112 1952)">
    <text x="0" y="0" fill="#ffffff" font-family="Arial, sans-serif" font-size="45" font-weight="800">Empezá hoy</text>
    <text x="0" y="60" fill="#d8fff5" font-family="Arial, sans-serif" font-size="30">Consultá en nuestro centro educativo</text>
    <rect x="1008" y="-30" width="308" height="100" rx="50" fill="#f7c948"/>
    <text x="1162" y="32" text-anchor="middle" fill="#101b36" font-family="Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="1">INFORMACIÓN</text>
  </g>
</svg>`;

await mkdir('output', { recursive: true });
await writeFile('output/folleto-computacion-centro-educativo.svg', svg, 'utf8');
await sharp(Buffer.from(svg))
  .resize(1819, 2551, { fit: 'fill' })
  .flatten({ background: '#101b36' })
  .withMetadata({ density: 300 })
  .png({ compressionLevel: 9 })
  .toFile(salida);
console.log(salida);
