import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { jsPDF } from 'jspdf';

const root = process.cwd();
const out = path.join(root, 'entregables', 'folletos');
fs.mkdirSync(out, { recursive: true });

const dataUri = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
const foto = dataUri(path.join(root, 'public/imagenes/Modales/Contador Público/xxl_cropped_dca3a0e5c32edb183e84fb58a4fd5b8b.jpg'), 'image/jpeg');
const cau = dataUri(path.join(root, 'public/imagenes/imagenes_cau/logo_cau.png'), 'image/png');
const siglo = dataUri(path.join(root, 'public/imagenes/imagenes_cau/siglo21-marca.svg'), 'image/svg+xml');

const base = (width, height, inner) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="azul" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#003f63"/><stop offset="1" stop-color="#007e86"/></linearGradient>
    <linearGradient id="coral" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#d35d44"/><stop offset="1" stop-color="#e38a5e"/></linearGradient>
    <clipPath id="foto-vertical"><rect x="1150" y="230" width="790" height="1320" rx="18"/></clipPath>
    <clipPath id="foto-horizontal"><rect x="1900" y="0" width="1130" height="2160"/></clipPath>
  </defs>${inner}</svg>`;

const common = (dark = false) => dark
  ? `<image href="${siglo}" x="0" y="0" width="510" height="185" preserveAspectRatio="xMinYMid meet"/>`
  : `<image href="${cau}" x="0" y="0" width="150" height="150" preserveAspectRatio="xMidYMid meet"/>
     <text x="190" y="58" fill="#003f63" font-family="Arial, sans-serif" font-size="27" font-weight="700" letter-spacing="3">CAU VILLA LUGANO</text>
     <text x="190" y="102" fill="#55726f" font-family="Arial, sans-serif" font-size="25">Acompañamiento para estudiar</text>`;

const portraitFront = base(2160, 3030, `
  <rect width="2160" height="3030" fill="#f5f1e9"/>
  <rect width="2160" height="255" fill="#003f63"/>
  ${common(true)}
  <text x="145" y="480" fill="#006b80" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="5">NÚMEROS QUE CUENTAN</text>
  <text x="145" y="630" fill="#172d32" font-family="Arial, sans-serif" font-size="88" font-weight="700">Contador</text>
  <text x="145" y="735" fill="#172d32" font-family="Arial, sans-serif" font-size="88" font-weight="700">Público</text>
  <text x="145" y="860" fill="#4e6768" font-family="Arial, sans-serif" font-size="37">Convertí información en decisiones</text>
  <path d="M145 960 C390 870 540 1020 730 905 S1010 730 1110 820" fill="none" stroke="url(#coral)" stroke-width="14"/>
  <circle cx="1110" cy="820" r="18" fill="#d35d44"/>
  <rect x="1150" y="230" width="790" height="1320" rx="18" fill="#dce8e1"/>
  <g clip-path="url(#foto-vertical)"><image href="${foto}" x="1030" y="230" width="1020" height="1320" preserveAspectRatio="xMidYMid slice"/></g>
  <rect x="145" y="1120" width="870" height="270" fill="#e4eee9"/>
  <text x="195" y="1205" fill="#006b80" font-family="Arial, sans-serif" font-size="29" font-weight="700" letter-spacing="3">DATOS CLAVE</text>
  <text x="195" y="1295" fill="#172d32" font-family="Arial, sans-serif" font-size="43" font-weight="700">4 años</text>
  <text x="530" y="1295" fill="#172d32" font-family="Arial, sans-serif" font-size="43" font-weight="700">A distancia</text>
  <text x="195" y="1350" fill="#55726f" font-family="Arial, sans-serif" font-size="28">Duración de la carrera</text>
  <text x="530" y="1350" fill="#55726f" font-family="Arial, sans-serif" font-size="28">Modalidad disponible en el CAU</text>
  <rect x="145" y="1730" width="1795" height="545" rx="18" fill="url(#azul)"/>
  <text x="205" y="1850" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="4">TU PRÓXIMO PASO</text>
  <text x="205" y="1980" fill="#ffffff" font-family="Arial, sans-serif" font-size="56" font-weight="700">Te orientamos para empezar</text>
  <text x="205" y="2080" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="35">Consultá por inscripción, cursada y acompañamiento.</text>
  <text x="205" y="2220" fill="#ffffff" font-family="Arial, sans-serif" font-size="49" font-weight="700">WhatsApp 11 3297-3801</text>
  <text x="145" y="2860" fill="#006b80" font-family="Arial, sans-serif" font-size="30" font-weight="700">Guaminí 4876 · Villa Lugano · CABA</text>
  <text x="145" y="2915" fill="#55726f" font-family="Arial, sans-serif" font-size="29">siglo21sur.com</text>
`);

const portraitBack = base(2160, 3030, `
  <rect width="2160" height="3030" fill="#f5f1e9"/>
  <rect x="0" y="0" width="2160" height="310" fill="#e4eee9"/>
  ${common(false)}
  <text x="145" y="540" fill="#006b80" font-family="Arial, sans-serif" font-size="33" font-weight="700" letter-spacing="4">UNA FORMACIÓN APLICADA</text>
  <text x="145" y="690" fill="#172d32" font-family="Arial, sans-serif" font-size="72" font-weight="700">Entendé cómo</text>
  <text x="145" y="775" fill="#172d32" font-family="Arial, sans-serif" font-size="72" font-weight="700">se mueve una organización</text>
  <path d="M145 900 H2015" stroke="#b2cec6" stroke-width="3"/>
  <text x="145" y="1040" fill="#003f63" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="3">DURANTE LA CARRERA</text>
  <text x="145" y="1160" fill="#172d32" font-family="Arial, sans-serif" font-size="42" font-weight="700">01  Práctica profesional</text>
  <text x="270" y="1220" fill="#55726f" font-family="Arial, sans-serif" font-size="31">Resolución de casos y experiencias desde el inicio.</text>
  <text x="145" y="1370" fill="#172d32" font-family="Arial, sans-serif" font-size="42" font-weight="700">02  Tecnología aplicada</text>
  <text x="270" y="1430" fill="#55726f" font-family="Arial, sans-serif" font-size="31">Herramientas para analizar información y decidir.</text>
  <text x="145" y="1580" fill="#172d32" font-family="Arial, sans-serif" font-size="42" font-weight="700">03  Compromiso social</text>
  <text x="270" y="1640" fill="#55726f" font-family="Arial, sans-serif" font-size="31">Una mirada ética sobre el impacto profesional.</text>
  <rect x="145" y="1840" width="860" height="740" fill="#003f63"/>
  <text x="205" y="1970" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">CAMPOS DE ACCIÓN</text>
  <text x="205" y="2135" fill="#ffffff" font-family="Arial, sans-serif" font-size="43" font-weight="700">Contabilidad</text>
  <text x="205" y="2225" fill="#ffffff" font-family="Arial, sans-serif" font-size="43" font-weight="700">Impuestos</text>
  <text x="205" y="2315" fill="#ffffff" font-family="Arial, sans-serif" font-size="43" font-weight="700">Auditoría</text>
  <text x="205" y="2405" fill="#ffffff" font-family="Arial, sans-serif" font-size="43" font-weight="700">Finanzas</text>
  <text x="1130" y="1970" fill="#006b80" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">PERFIL PROFESIONAL</text>
  <text x="1130" y="2110" fill="#172d32" font-family="Arial, sans-serif" font-size="39">Analítico · responsable · estratégico</text>
  <text x="1130" y="2225" fill="#55726f" font-family="Arial, sans-serif" font-size="32">Podés desarrollarte en empresas,</text>
  <text x="1130" y="2280" fill="#55726f" font-family="Arial, sans-serif" font-size="32">estudios, organizaciones y proyectos propios.</text>
  <path d="M1130 2440 L1240 2380 L1370 2415 L1510 2260 L1680 2320 L1870 2140" fill="none" stroke="url(#coral)" stroke-width="12"/>
  <text x="145" y="2915" fill="#006b80" font-family="Arial, sans-serif" font-size="30" font-weight="700">CAU Villa Lugano · WhatsApp 11 3297-3801</text>
`);

const landscapeFront = base(3030, 2160, `
  <rect width="3030" height="2160" fill="#f5f1e9"/>
  <rect width="1900" height="2160" fill="#f5f1e9"/>
  <rect x="1900" width="1130" height="2160" fill="#003f63"/>
  ${common(false)}
  <text x="130" y="470" fill="#006b80" font-family="Arial, sans-serif" font-size="33" font-weight="700" letter-spacing="5">NÚMEROS QUE CUENTAN</text>
  <text x="130" y="650" fill="#172d32" font-family="Arial, sans-serif" font-size="94" font-weight="700">Contador Público</text>
  <text x="130" y="780" fill="#4e6768" font-family="Arial, sans-serif" font-size="39">Una carrera para interpretar, ordenar y proyectar.</text>
  <path d="M130 970 C390 900 540 1040 760 940 S1130 820 1580 930" fill="none" stroke="url(#coral)" stroke-width="15"/>
  <path d="M130 1040 H1670" stroke="#b2cec6" stroke-width="3"/>
  <text x="130" y="1180" fill="#003f63" font-family="Arial, sans-serif" font-size="31" font-weight="700" letter-spacing="3">DATOS CLAVE</text>
  <text x="130" y="1310" fill="#172d32" font-family="Arial, sans-serif" font-size="53" font-weight="700">4 años</text>
  <text x="550" y="1310" fill="#172d32" font-family="Arial, sans-serif" font-size="53" font-weight="700">A distancia</text>
  <text x="130" y="1370" fill="#55726f" font-family="Arial, sans-serif" font-size="30">Duración</text>
  <text x="550" y="1370" fill="#55726f" font-family="Arial, sans-serif" font-size="30">Modalidad disponible en el CAU</text>
  <rect x="130" y="1580" width="1535" height="390" fill="url(#azul)"/>
  <text x="195" y="1700" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="29" font-weight="700" letter-spacing="3">EMPEZÁ CON ACOMPAÑAMIENTO</text>
  <text x="195" y="1815" fill="#ffffff" font-family="Arial, sans-serif" font-size="49" font-weight="700">WhatsApp 11 3297-3801</text>
  <text x="195" y="1880" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="30">siglo21sur.com · Guaminí 4876, Villa Lugano</text>
  <g clip-path="url(#foto-horizontal)"><image href="${foto}" x="1770" y="0" width="1390" height="2160" preserveAspectRatio="xMidYMid slice"/></g>
  <rect x="1900" y="0" width="1130" height="2160" fill="#003f63" opacity=".16"/>
  <text x="2010" y="380" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="4">FORMACIÓN PARA DECIDIR</text>
  <text x="2010" y="1790" fill="#ffffff" font-family="Arial, sans-serif" font-size="57" font-weight="700">Convertí datos</text>
  <text x="2010" y="1865" fill="#ffffff" font-family="Arial, sans-serif" font-size="57" font-weight="700">en decisiones</text>
`);

const landscapeBack = base(3030, 2160, `
  <rect width="3030" height="2160" fill="#f5f1e9"/>
  <rect width="790" height="2160" fill="#e4eee9"/>
  ${common(false)}
  <text x="130" y="490" fill="#006b80" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">LA CARRERA</text>
  <text x="130" y="640" fill="#172d32" font-family="Arial, sans-serif" font-size="65" font-weight="700">Una mirada integral</text>
  <text x="130" y="720" fill="#172d32" font-family="Arial, sans-serif" font-size="65" font-weight="700">sobre la gestión</text>
  <path d="M130 1260 L230 1200 L350 1235 L490 1170 L635 1210 L730 1150" fill="none" stroke="url(#coral)" stroke-width="12"/>
  <text x="130" y="1040" fill="#55726f" font-family="Arial, sans-serif" font-size="32">Contabilidad, impuestos, auditoría,</text>
  <text x="130" y="1095" fill="#55726f" font-family="Arial, sans-serif" font-size="32">finanzas y control de gestión.</text>
  <rect x="960" y="260" width="890" height="1640" fill="#ffffff" stroke="#b2cec6" stroke-width="3"/>
  <text x="1060" y="480" fill="#006b80" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">LO QUE VAS A DESARROLLAR</text>
  <text x="1060" y="650" fill="#172d32" font-family="Arial, sans-serif" font-size="41" font-weight="700">Lectura de información</text>
  <text x="1060" y="715" fill="#55726f" font-family="Arial, sans-serif" font-size="30">Para comprender escenarios.</text>
  <text x="1060" y="880" fill="#172d32" font-family="Arial, sans-serif" font-size="41" font-weight="700">Análisis y estrategia</text>
  <text x="1060" y="945" fill="#55726f" font-family="Arial, sans-serif" font-size="30">Para tomar decisiones sólidas.</text>
  <text x="1060" y="1110" fill="#172d32" font-family="Arial, sans-serif" font-size="41" font-weight="700">Ética profesional</text>
  <text x="1060" y="1175" fill="#55726f" font-family="Arial, sans-serif" font-size="30">Para generar impacto responsable.</text>
  <path d="M1060 1360 H1750" stroke="#b2cec6" stroke-width="3"/>
  <text x="1060" y="1490" fill="#003f63" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">SALIDA PROFESIONAL</text>
  <text x="1060" y="1605" fill="#172d32" font-family="Arial, sans-serif" font-size="33">Empresas · estudios · sector público</text>
  <text x="1060" y="1665" fill="#172d32" font-family="Arial, sans-serif" font-size="33">Organizaciones · emprendimientos</text>
  <rect x="2070" y="260" width="760" height="1640" fill="url(#azul)"/>
  <image href="${siglo}" x="2140" y="390" width="580" height="210" preserveAspectRatio="xMinYMid meet"/>
  <text x="2140" y="850" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">HABLEMOS DE TU</text>
  <text x="2140" y="920" fill="#ffffff" font-family="Arial, sans-serif" font-size="52" font-weight="700">próximo paso</text>
  <text x="2140" y="1120" fill="#ffffff" font-family="Arial, sans-serif" font-size="43" font-weight="700">11 3297-3801</text>
  <text x="2140" y="1190" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="28">WhatsApp</text>
  <text x="2140" y="1500" fill="#ffffff" font-family="Arial, sans-serif" font-size="35" font-weight="700">CAU Villa Lugano</text>
  <text x="2140" y="1560" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="29">Guaminí 4876 · CABA</text>
  <text x="2140" y="1760" fill="#d9f3eb" font-family="Arial, sans-serif" font-size="29">siglo21sur.com</text>
`);

const pieces = [
  ['vertical-frente', portraitFront, 2160, 3030],
  ['vertical-dorso', portraitBack, 2160, 3030],
  ['horizontal-frente', landscapeFront, 3030, 2160],
  ['horizontal-dorso', landscapeBack, 3030, 2160],
];

for (const [name, content, width, height] of pieces) {
  const svgPath = path.join(out, `folleto-contador-a4-${name}.svg`);
  const pngPath = path.join(out, `folleto-contador-a4-${name}.png`);
  fs.writeFileSync(svgPath, content, 'utf8');
  await sharp(Buffer.from(content)).png().toFile(pngPath);
}

for (const orientation of ['vertical', 'horizontal']) {
  const landscape = orientation === 'horizontal';
  const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4', compress: true });
  for (const side of ['frente', 'dorso']) {
    if (side !== 'frente') pdf.addPage('a4', landscape ? 'landscape' : 'portrait');
    const file = path.join(out, `folleto-contador-a4-${orientation}-${side}.png`);
    pdf.addImage(fs.readFileSync(file).toString('base64'), 'PNG', 0, 0, landscape ? 297 : 210, landscape ? 210 : 297, undefined, 'FAST');
  }
  pdf.save(path.join(out, `folleto-contador-a4-${orientation}-2-caras-rgb.pdf`));
}

await sharp(path.join(out, 'folleto-contador-a4-vertical-frente.png')).resize(540, 758).jpeg({ quality: 88 }).toFile(path.join(out, 'folleto-contador-a4-vertical-prueba.jpg'));
await sharp(path.join(out, 'folleto-contador-a4-horizontal-frente.png')).resize(758, 540).jpeg({ quality: 88 }).toFile(path.join(out, 'folleto-contador-a4-horizontal-prueba.jpg'));

console.log('Generado folleto Contador A4: cuatro caras SVG/PNG, dos PDF RGB y dos previews JPG.');
