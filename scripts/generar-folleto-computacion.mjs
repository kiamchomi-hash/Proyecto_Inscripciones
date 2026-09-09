import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { jsPDF } from 'jspdf';

const root = process.cwd();
const out = path.join(root, 'output', 'folleto-computacion');
fs.mkdirSync(out, { recursive: true });

const logo = fs.readFileSync(path.join(root, 'public', 'imagenes', 'imagenes_cau', 'siglo21-marca.svg')).toString('base64');
const sedePath = path.join(root, 'public', 'imagenes', 'imagenes_cau', 'Foto-entrada.webp');
const sede = (await sharp(sedePath).resize(1250, 620, { fit: 'cover', position: 'centre' }).png().toBuffer()).toString('base64');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1540" height="2160" viewBox="0 0 1540 2160">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#013729"/><stop offset="1" stop-color="#071d1b"/></linearGradient>
    <linearGradient id="aqua" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#00ffe1"/><stop offset="1" stop-color="#00c7b1"/></linearGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#00c7b1" opacity=".23"/></pattern>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#7ae6d9" stroke-width="1" opacity=".12"/></pattern>
    <clipPath id="photo"><rect x="111" y="1507" width="1318" height="450" rx="28"/></clipPath>
  </defs>
  <rect width="1540" height="2160" fill="url(#bg)"/>
  <rect x="0" y="0" width="1540" height="2160" fill="url(#grid)"/>
  <rect x="0" y="0" width="650" height="920" fill="url(#dots)"/>
  <path d="M1100 0H1540V650" fill="none" stroke="#00c7b1" stroke-width="3" opacity=".42"/>
  <path d="M0 1390H360" stroke="#00ffe1" stroke-width="10"/>

  <image href="data:image/svg+xml;base64,${logo}" x="111" y="92" width="315" height="90" preserveAspectRatio="xMinYMid meet"/>
  <text x="1429" y="136" text-anchor="end" fill="#9eece2" font-family="Arial, sans-serif" font-size="27" font-weight="700" letter-spacing="3">CAU VILLA LUGANO</text>

  <text x="111" y="410" fill="#00ffe1" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="5">CLASES DE APOYO</text>
  <text x="111" y="640" fill="#f7f5ed" font-family="Arial, sans-serif" font-size="150" font-weight="700" letter-spacing="-5">COMPUTACIÓN</text>
  <text x="111" y="785" fill="#00ffe1" font-family="Arial, sans-serif" font-size="104" font-weight="700" letter-spacing="-3">PARA TODOS.</text>
  <text x="111" y="875" fill="#f7f5ed" font-family="Arial, sans-serif" font-size="40" font-weight="700">Clases individuales y presenciales.</text>
  <text x="111" y="930" fill="#a7bcb8" font-family="Arial, sans-serif" font-size="34">Aprendé lo que necesitás, a tu ritmo y con acompañamiento.</text>

  <g transform="translate(1060 280)" fill="none" stroke="#00c7b1" stroke-width="10" opacity=".9">
    <rect x="0" y="0" width="330" height="220" rx="18" fill="#102f2b"/>
    <path d="M35 55h75M35 95h155M35 135h110" stroke="#00ffe1" stroke-width="12" stroke-linecap="round"/>
    <path d="M-35 270h400l-38 34H3z" fill="#00c7b1" stroke="none"/>
  </g>

  <g transform="translate(111 1030)">
    <rect width="1318" height="405" rx="28" fill="#102f2b" stroke="#2a655c" stroke-width="3"/>
    <rect x="36" y="36" width="84" height="84" rx="18" fill="url(#aqua)"/>
    <path d="M57 59h42v29H57zM70 98h16M64 108h28" fill="none" stroke="#013729" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="155" y="88" fill="#f7f5ed" font-family="Arial, sans-serif" font-size="45" font-weight="700">¿Qué necesitás resolver?</text>
    <text x="155" y="145" fill="#a7bcb8" font-family="Arial, sans-serif" font-size="31">Elegimos juntos el tema y practicamos con casos reales.</text>
    <line x1="36" y1="190" x2="1282" y2="190" stroke="#2a655c" stroke-width="2"/>
    <text x="48" y="244" fill="#00ffe1" font-family="Arial, sans-serif" font-size="27" font-weight="700" letter-spacing="1">OFIMÁTICA</text>
    <text x="48" y="290" fill="#f7f5ed" font-family="Arial, sans-serif" font-size="27">Word, Excel y PowerPoint</text>
    <text x="48" y="338" fill="#a7bcb8" font-family="Arial, sans-serif" font-size="24">Documentos, planillas y presentaciones</text>
    <text x="500" y="244" fill="#00ffe1" font-family="Arial, sans-serif" font-size="27" font-weight="700" letter-spacing="1">HERRAMIENTAS</text>
    <text x="500" y="290" fill="#f7f5ed" font-family="Arial, sans-serif" font-size="27">Internet y sistemas operativos</text>
    <text x="500" y="338" fill="#a7bcb8" font-family="Arial, sans-serif" font-size="24">Archivos, correo y seguridad básica</text>
    <text x="982" y="244" fill="#00ffe1" font-family="Arial, sans-serif" font-size="27" font-weight="700" letter-spacing="1">ESTUDIO</text>
    <text x="982" y="290" fill="#f7f5ed" font-family="Arial, sans-serif" font-size="27">Campus y trabajos prácticos</text>
    <text x="982" y="338" fill="#a7bcb8" font-family="Arial, sans-serif" font-size="24">Subir archivos y rendir en línea</text>
  </g>

  <image href="data:image/png;base64,${sede}" x="111" y="1507" width="1318" height="450" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/>
  <rect x="111" y="1507" width="1318" height="450" rx="28" fill="#013729" opacity=".2"/>
  <rect x="111" y="1880" width="1318" height="77" fill="#013729" opacity=".86"/>
  <text x="150" y="1931" fill="#f7f5ed" font-family="Arial, sans-serif" font-size="29" font-weight="700">Guaminí 4876 · Villa Lugano · lunes a viernes</text>

  <text x="111" y="2055" fill="#00ffe1" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="3">RESERVÁ TU TURNO</text>
  <text x="1429" y="2070" text-anchor="end" fill="#f7f5ed" font-family="Arial, sans-serif" font-size="55" font-weight="700">11 6652-2722</text>
  <text x="111" y="2122" fill="#9eece2" font-family="Arial, sans-serif" font-size="34" font-weight="700">siglo21sur.com</text>
</svg>`;

const svgPath = path.join(out, 'folleto-computacion-master.svg');
const pngPath = path.join(out, 'folleto-computacion-a5-300dpi.png');
const previewPath = path.join(out, 'folleto-computacion-preview.webp');
const pdfPath = path.join(out, 'folleto-computacion-prueba-rgb.pdf');
fs.writeFileSync(svgPath, svg);
const image = sharp(Buffer.from(svg));
await image.png().resize(1819, 2551).toFile(pngPath);
await sharp(pngPath).resize(455, 638).webp({ quality: 86 }).toFile(previewPath);
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [154, 216], compress: true });
pdf.addImage(fs.readFileSync(pngPath).toString('base64'), 'PNG', 0, 0, 154, 216, undefined, 'FAST');
pdf.save(pdfPath);
console.log(JSON.stringify({ svgPath, pngPath, previewPath, pdfPath }, null, 2));
