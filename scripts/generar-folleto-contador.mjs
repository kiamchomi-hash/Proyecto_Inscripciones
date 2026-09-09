import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { jsPDF } from 'jspdf';

const root = process.cwd();
const out = path.join(root, 'entregables', 'folletos');
fs.mkdirSync(out, { recursive: true });
const uri = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
const logo = uri(path.join(root, 'public/imagenes/imagenes_cau/siglo21-marca.svg'), 'image/svg+xml');
const cau = uri(path.join(root, 'public/imagenes/imagenes_cau/logo_cau.png'), 'image/png');
const foto = uri(path.join(root, 'public/imagenes/Modales/Contador Público/xxl_cropped_dca3a0e5c32edb183e84fb58a4fd5b8b.jpg'), 'image/jpeg');

// Tríptico A4 horizontal con sangrado: 3030 × 2160 unidades, 10 por mm.
// Dirección visual: papel claro, datos, líneas de tendencia y marcos; sin
// repetir la trama, el halo ni el fondo oscuro del folleto de Abogacía.
const svg = (inner) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="3030" height="2160" viewBox="0 0 3030 2160">
  <defs>
    <linearGradient id="azul" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#003f63"/><stop offset="1" stop-color="#007e86"/></linearGradient>
    <linearGradient id="coral" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#d35d44"/><stop offset="1" stop-color="#e38a5e"/></linearGradient>
    <pattern id="reglas" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M0 119H120M119 0V120" stroke="#075d70" stroke-width="1" opacity=".10"/></pattern>
    <clipPath id="foto"><rect x="2020" y="0" width="1010" height="2160"/></clipPath>
  </defs>
  ${inner}
</svg>`;

const exterior = svg(`
  <rect width="3030" height="2160" fill="#f5f1e9"/>
  <rect x="0" width="1010" height="2160" fill="#f5f1e9"/>
  <rect x="1010" width="1010" height="2160" fill="#e4eee9"/>
  <rect x="2020" width="1010" height="2160" fill="url(#azul)"/>
  <rect x="1010" width="1010" height="2160" fill="url(#reglas)"/>
  <path d="M0 315H780M1010 315H1790M2020 315H2830" stroke="#075d70" stroke-width="8"/>
  <path d="M80 1680C280 1510 470 1590 640 1390S830 1120 950 980" fill="none" stroke="url(#coral)" stroke-width="12"/>
  <path d="M2020 1850H2380M2740 0H3030V290" fill="none" stroke="#d9f3eb" stroke-width="8" opacity=".8"/>

  <image href="${cau}" x="100" y="110" width="220" height="220" preserveAspectRatio="xMidYMid meet"/>
  <text x="395" y="170" fill="#003f63" font-family="Arial, sans-serif" font-size="33" font-weight="700" letter-spacing="4">CAU VILLA LUGANO</text>
  <text x="395" y="225" fill="#55726f" font-family="Arial, sans-serif" font-size="31">Acompañamiento para estudiar</text>
  <text x="100" y="550" fill="#003f63" font-family="Arial, sans-serif" font-size="43" font-weight="700" letter-spacing="3">NÚMEROS QUE CUENTAN</text>
  <text x="100" y="690" fill="#172d32" font-family="Arial, sans-serif" font-size="70" font-weight="700">Convertí datos en</text>
  <text x="100" y="780" fill="#172d32" font-family="Arial, sans-serif" font-size="70" font-weight="700">decisiones</text>
  <text x="100" y="930" fill="#4e6768" font-family="Arial, sans-serif" font-size="36">Formación para entender organizaciones,</text>
  <text x="100" y="982" fill="#4e6768" font-family="Arial, sans-serif" font-size="36">finanzas e impuestos</text>
  <path d="M100 1120H890" stroke="#a9c8bf" stroke-width="3"/>
  <text x="100" y="1220" fill="#006b80" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="3">ESTUDIÁ CONTADOR PÚBLICO</text>
  <text x="100" y="1290" fill="#172d32" font-family="Arial, sans-serif" font-size="39">Título de Contador Público</text>
  <text x="100" y="1350" fill="#4e6768" font-family="Arial, sans-serif" font-size="34">4 años · Modalidad a distancia</text>
  <text x="100" y="1990" fill="#006b80" font-family="Arial, sans-serif" font-size="31" font-weight="700">siglo21sur.com</text>

  <text x="1100" y="245" fill="#006b80" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="4">PARA SABER MÁS</text>
  <text x="1100" y="405" fill="#172d32" font-family="Arial, sans-serif" font-size="61" font-weight="700">Tu próximo paso</text>
  <text x="1100" y="485" fill="#172d32" font-family="Arial, sans-serif" font-size="61" font-weight="700">también se calcula</text>
  <text x="1100" y="625" fill="#4e6768" font-family="Arial, sans-serif" font-size="35">Te orientamos sobre la carrera,</text>
  <text x="1100" y="675" fill="#4e6768" font-family="Arial, sans-serif" font-size="35">la inscripción y la cursada</text>
  <rect x="1100" y="840" width="760" height="195" fill="#ffffff" stroke="#006b80" stroke-width="4"/>
  <text x="1150" y="920" fill="#006b80" font-family="Arial, sans-serif" font-size="29" font-weight="700" letter-spacing="3">WHATSAPP</text>
  <text x="1150" y="985" fill="#172d32" font-family="Arial, sans-serif" font-size="45" font-weight="700">11 3297-3801</text>
  <path d="M1100 1225H1860" stroke="#89bdb3" stroke-width="3"/>
  <text x="1100" y="1330" fill="#006b80" font-family="Arial, sans-serif" font-size="29" font-weight="700" letter-spacing="3">ENCONTRANOS</text>
  <text x="1100" y="1400" fill="#172d32" font-family="Arial, sans-serif" font-size="38">Guaminí 4876</text>
  <text x="1100" y="1455" fill="#4e6768" font-family="Arial, sans-serif" font-size="34">Villa Lugano · CABA</text>
  <image href="${logo}" x="1100" y="1740" width="450" height="160" preserveAspectRatio="xMinYMid meet"/>

  <g clip-path="url(#foto)">
    <image href="${foto}" x="2020" y="0" width="1010" height="2160" preserveAspectRatio="xMidYMid slice"/>
    <rect x="2020" y="0" width="1010" height="2160" fill="#003f63" opacity=".14"/>
  </g>
  <rect x="2090" y="1160" width="820" height="640" fill="#003f63" opacity=".92"/>
  <text x="2160" y="1280" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="31" font-weight="700" letter-spacing="4">GRADO · ECONOMÍA</text>
  <image href="${logo}" x="2160" y="1340" width="450" height="160" preserveAspectRatio="xMinYMid meet"/>
  <text x="2160" y="1615" fill="#ffffff" font-family="Arial, sans-serif" font-size="88" font-weight="700" letter-spacing="-3">CONTADOR</text>
  <text x="2160" y="1710" fill="#ffffff" font-family="Arial, sans-serif" font-size="88" font-weight="700" letter-spacing="-3">PÚBLICO</text>
`);

const interior = svg(`
  <rect width="3030" height="2160" fill="#f5f1e9"/>
  <rect x="0" width="1010" height="2160" fill="#ffffff"/>
  <rect x="1010" width="1010" height="2160" fill="#e4eee9"/>
  <rect x="2020" width="1010" height="2160" fill="#ffffff"/>
  <rect x="1010" width="1010" height="2160" fill="url(#reglas)"/>
  <path d="M0 315H760M1010 315H1770M2020 315H2780" stroke="#006b80" stroke-width="8"/>
  <text x="100" y="220" fill="#006b80" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="4">UNA FORMACIÓN APLICADA</text>
  <text x="100" y="470" fill="#172d32" font-family="Arial, sans-serif" font-size="58" font-weight="700">Del dato a la</text>
  <text x="100" y="545" fill="#172d32" font-family="Arial, sans-serif" font-size="58" font-weight="700">decisión</text>
  <text x="100" y="710" fill="#4e6768" font-family="Arial, sans-serif" font-size="35">Prácticas, casos y simulaciones</text>
  <text x="100" y="760" fill="#4e6768" font-family="Arial, sans-serif" font-size="35">conectan el estudio con el trabajo</text>
  <path d="M100 930H890" stroke="#b2cec6" stroke-width="3"/>
  <text x="100" y="1040" fill="#006b80" font-family="Arial, sans-serif" font-size="31" font-weight="700" letter-spacing="3">DESDE EL INICIO</text>
  <text x="100" y="1135" fill="#172d32" font-family="Arial, sans-serif" font-size="40" font-weight="700">Práctica profesional</text>
  <text x="100" y="1195" fill="#4e6768" font-family="Arial, sans-serif" font-size="33">Pasantías y resolución de casos</text>
  <text x="100" y="1370" fill="#172d32" font-family="Arial, sans-serif" font-size="40" font-weight="700">Compromiso social</text>
  <text x="100" y="1430" fill="#4e6768" font-family="Arial, sans-serif" font-size="33">Práctica solidaria y voluntariado</text>
  <text x="100" y="1980" fill="#006b80" font-family="Arial, sans-serif" font-size="30" font-weight="700">01 / 03</text>

  <text x="1120" y="220" fill="#006b80" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="4">CAMPOS DE ACCIÓN</text>
  <text x="1120" y="470" fill="#172d32" font-family="Arial, sans-serif" font-size="58" font-weight="700">Una mirada integral</text>
  <text x="1120" y="545" fill="#172d32" font-family="Arial, sans-serif" font-size="58" font-weight="700">sobre la gestión</text>
  <path d="M1120 760L1240 700L1380 735L1530 580L1690 620L1840 460" fill="none" stroke="#d35d44" stroke-width="12"/>
  <path d="M1120 805H1860M1120 650H1860M1120 495H1860" stroke="#6ba49d" stroke-width="2" opacity=".45"/>
  <text x="1120" y="980" fill="#172d32" font-family="Arial, sans-serif" font-size="37" font-weight="700">Contabilidad</text>
  <text x="1120" y="1040" fill="#172d32" font-family="Arial, sans-serif" font-size="37" font-weight="700">Impuestos</text>
  <text x="1120" y="1100" fill="#172d32" font-family="Arial, sans-serif" font-size="37" font-weight="700">Auditoría</text>
  <text x="1120" y="1160" fill="#172d32" font-family="Arial, sans-serif" font-size="37" font-weight="700">Finanzas</text>
  <text x="1120" y="1220" fill="#172d32" font-family="Arial, sans-serif" font-size="37" font-weight="700">Control de gestión</text>
  <text x="1120" y="1980" fill="#006b80" font-family="Arial, sans-serif" font-size="30" font-weight="700">02 / 03</text>

  <text x="2130" y="220" fill="#006b80" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="4">HERRAMIENTAS PARA CRECER</text>
  <text x="2130" y="470" fill="#172d32" font-family="Arial, sans-serif" font-size="58" font-weight="700">Tecnología y</text>
  <text x="2130" y="545" fill="#172d32" font-family="Arial, sans-serif" font-size="58" font-weight="700">pensamiento crítico</text>
  <text x="2130" y="710" fill="#4e6768" font-family="Arial, sans-serif" font-size="35">Hojas de cálculo avanzadas, sistemas</text>
  <text x="2130" y="760" fill="#4e6768" font-family="Arial, sans-serif" font-size="35">de información contable y análisis</text>
  <text x="2130" y="810" fill="#4e6768" font-family="Arial, sans-serif" font-size="35">para tomar mejores decisiones</text>
  <path d="M2130 940H2910" stroke="#b2cec6" stroke-width="3"/>
  <text x="2130" y="1050" fill="#006b80" font-family="Arial, sans-serif" font-size="31" font-weight="700" letter-spacing="3">TU PERFIL PROFESIONAL</text>
  <text x="2130" y="1150" fill="#172d32" font-family="Arial, sans-serif" font-size="37">Empresas y estudios</text>
  <text x="2130" y="1210" fill="#172d32" font-family="Arial, sans-serif" font-size="37">Organizaciones sociales</text>
  <text x="2130" y="1270" fill="#172d32" font-family="Arial, sans-serif" font-size="37">Sector público</text>
  <text x="2130" y="1330" fill="#172d32" font-family="Arial, sans-serif" font-size="37">Emprendimientos propios</text>
  <rect x="2130" y="1560" width="780" height="235" fill="url(#azul)"/>
  <text x="2180" y="1640" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="29" font-weight="700" letter-spacing="3">EMPEZÁ POR UNA CHARLA</text>
  <text x="2180" y="1720" fill="#ffffff" font-family="Arial, sans-serif" font-size="44" font-weight="700">11 3297-3801</text>
  <text x="2130" y="1980" fill="#006b80" font-family="Arial, sans-serif" font-size="30" font-weight="700">03 / 03</text>
`);

const names = {
  exteriorSvg: path.join(out, 'folleto-contador-triptico-exterior.svg'),
  interiorSvg: path.join(out, 'folleto-contador-triptico-interior.svg'),
  exteriorPng: path.join(out, 'folleto-contador-triptico-exterior.png'),
  interiorPng: path.join(out, 'folleto-contador-triptico-interior.png'),
  preview: path.join(out, 'folleto-contador-triptico-prueba.jpg'),
  pdf: path.join(out, 'folleto-contador-triptico-prueba-rgb.pdf'),
};
fs.writeFileSync(names.exteriorSvg, exterior, 'utf8');
fs.writeFileSync(names.interiorSvg, interior, 'utf8');
await sharp(Buffer.from(exterior)).png().resize(3030, 2160).toFile(names.exteriorPng);
await sharp(Buffer.from(interior)).png().resize(3030, 2160).toFile(names.interiorPng);
await sharp(Buffer.from(exterior)).png().resize(1010, 720).jpeg({ quality: 88 }).toFile(names.preview);
const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
pdf.addImage(fs.readFileSync(names.exteriorPng).toString('base64'), 'PNG', 0, 0, 297, 210, undefined, 'FAST');
pdf.addPage('a4', 'landscape');
pdf.addImage(fs.readFileSync(names.interiorPng).toString('base64'), 'PNG', 0, 0, 297, 210, undefined, 'FAST');
pdf.save(names.pdf);
console.log(JSON.stringify(names, null, 2));
