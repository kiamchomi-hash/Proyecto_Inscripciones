import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { jsPDF } from 'jspdf';

const root = process.cwd();
const out = path.join(root, 'entregables', 'folletos');
fs.mkdirSync(out, { recursive: true });
const data = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
const logo = data(path.join(root, 'public/imagenes/imagenes_cau/siglo21-marca.svg'), 'image/svg+xml');
const cau = data(path.join(root, 'public/imagenes/imagenes_cau/logo_cau.png'), 'image/png');
const portrait = data(path.join(root, 'public/imagenes/Modales/Abogacía/mujer_abogada.png'), 'image/png');

// Tríptico A4 horizontal con sangrado: 3030 × 2160 unidades, 10 por mm.
// El exterior se entrega en orden de imposición: dorso, solapa, portada.
const base = (content) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="3030" height="2160" viewBox="0 0 3030 2160">
  <defs>
    <linearGradient id="verde" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#013729"/><stop offset="1" stop-color="#062b36"/></linearGradient>
    <linearGradient id="azul" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#005587"/><stop offset="1" stop-color="#00a99b"/></linearGradient>
    <radialGradient id="halo"><stop stop-color="#00c7b1" stop-opacity=".30"/><stop offset="1" stop-color="#00c7b1" stop-opacity="0"/></radialGradient>
    <pattern id="puntos" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#9cebe2" opacity=".22"/></pattern>
    <pattern id="malla" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M96 0H0V96" fill="none" stroke="#b8eee8" stroke-width="1" opacity=".10"/></pattern>
    <clipPath id="portada"><rect x="2020" y="0" width="1010" height="2160"/></clipPath>
  </defs>
  ${content}
</svg>`;

const exterior = base(`
  <rect width="3030" height="2160" fill="#f3f6f2"/>
  <rect x="0" y="0" width="1010" height="2160" fill="#e7efea"/>
  <rect x="1010" y="0" width="1010" height="2160" fill="url(#verde)"/>
  <rect x="2020" y="0" width="1010" height="2160" fill="url(#verde)"/>
  <rect x="1010" y="0" width="1010" height="2160" fill="url(#malla)"/>
  <rect x="2020" y="0" width="1010" height="900" fill="url(#puntos)"/>
  <ellipse cx="2525" cy="780" rx="540" ry="690" fill="url(#halo)"/>
  <path d="M1010 350H1400M2020 1830H2520M2740 0H3030V300" fill="none" stroke="#00c7b1" stroke-width="8" opacity=".8"/>

  <image href="${cau}" x="118" y="120" width="220" height="220" preserveAspectRatio="xMidYMid meet"/>
  <text x="420" y="170" fill="#005587" font-family="Arial, sans-serif" font-size="33" font-weight="700" letter-spacing="4">CAU VILLA LUGANO</text>
  <text x="420" y="225" fill="#52716e" font-family="Arial, sans-serif" font-size="31">Acompañamiento para estudiar</text>
  <path d="M118 465H850" stroke="#00a99b" stroke-width="8"/>
  <text x="118" y="610" fill="#013729" font-family="Arial, sans-serif" font-size="44" font-weight="700" letter-spacing="3">EN TU FUTURO PROFESIONAL</text>
  <text x="118" y="735" fill="#102426" font-family="Arial, sans-serif" font-size="66" font-weight="700">El derecho necesita</text>
  <text x="118" y="820" fill="#102426" font-family="Arial, sans-serif" font-size="66" font-weight="700">personas que sepan</text>
  <text x="118" y="905" fill="#005587" font-family="Arial, sans-serif" font-size="66" font-weight="700">intervenir</text>
  <text x="118" y="1030" fill="#425557" font-family="Arial, sans-serif" font-size="35">Formate para analizar, argumentar</text>
  <text x="118" y="1080" fill="#425557" font-family="Arial, sans-serif" font-size="35">y construir soluciones</text>
  <path d="M118 1240H850" stroke="#b7d9d0" stroke-width="3"/>
  <text x="118" y="1335" fill="#005587" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="3">ESTUDIÁ ABOGACÍA</text>
  <text x="118" y="1400" fill="#102426" font-family="Arial, sans-serif" font-size="36">Título de Abogado</text>
  <text x="118" y="1460" fill="#425557" font-family="Arial, sans-serif" font-size="33">4 años · Modalidad a distancia</text>
  <text x="118" y="1970" fill="#005587" font-family="Arial, sans-serif" font-size="30" font-weight="700">siglo21sur.com</text>

  <text x="1100" y="290" fill="#8be8dd" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="4">PARA SABER MÁS</text>
  <text x="1100" y="420" fill="#ffffff" font-family="Arial, sans-serif" font-size="62" font-weight="700">Hablemos de tu</text>
  <text x="1100" y="500" fill="#ffffff" font-family="Arial, sans-serif" font-size="62" font-weight="700">próximo paso</text>
  <text x="1100" y="630" fill="#d4f0ec" font-family="Arial, sans-serif" font-size="35">Te orientamos sobre la carrera,</text>
  <text x="1100" y="680" fill="#d4f0ec" font-family="Arial, sans-serif" font-size="35">la inscripción y la cursada</text>
  <rect x="1100" y="840" width="760" height="190" rx="24" fill="#0a4a45" stroke="#2bbfb0" stroke-width="3"/>
  <text x="1150" y="915" fill="#8be8dd" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3">WHATSAPP</text>
  <text x="1150" y="980" fill="#ffffff" font-family="Arial, sans-serif" font-size="44" font-weight="700">11 3297-3801</text>
  <path d="M1100 1220H1860" stroke="#2bbfb0" stroke-width="3"/>
  <text x="1100" y="1330" fill="#8be8dd" font-family="Arial, sans-serif" font-size="29" font-weight="700" letter-spacing="3">ENCONTRANOS</text>
  <text x="1100" y="1400" fill="#ffffff" font-family="Arial, sans-serif" font-size="37">Guaminí 4876</text>
  <text x="1100" y="1455" fill="#d4f0ec" font-family="Arial, sans-serif" font-size="33">Villa Lugano · CABA</text>
  <image href="${logo}" x="1100" y="1740" width="430" height="160" preserveAspectRatio="xMinYMid meet"/>

  <g clip-path="url(#portada)">
    <image href="${portrait}" x="2000" y="380" width="1120" height="1780" preserveAspectRatio="xMidYMid meet"/>
  </g>
  <text x="2125" y="240" fill="#8be8dd" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="5">GRADO · DERECHO</text>
  <image href="${logo}" x="2125" y="1420" width="520" height="185" preserveAspectRatio="xMinYMid meet"/>
  <text x="2125" y="1760" fill="#ffffff" font-family="Arial, sans-serif" font-size="126" font-weight="700" letter-spacing="-5">ABOGACÍA</text>
  <text x="2125" y="1850" fill="#d4f0ec" font-family="Arial, sans-serif" font-size="39">Estudiá para defender</text>
  <text x="2125" y="1905" fill="#d4f0ec" font-family="Arial, sans-serif" font-size="39">lo que importa</text>
`);

const interior = base(`
  <rect width="3030" height="2160" fill="#f3f6f2"/>
  <rect x="0" y="0" width="1010" height="2160" fill="#ffffff"/>
  <rect x="1010" y="0" width="1010" height="2160" fill="#e5f0eb"/>
  <rect x="2020" y="0" width="1010" height="2160" fill="#ffffff"/>
  <rect x="1010" y="0" width="1010" height="2160" fill="url(#malla)" opacity=".75"/>
  <path d="M0 310H650M1010 310H1660M2020 310H2670" stroke="#005587" stroke-width="8"/>
  <text x="118" y="210" fill="#005587" font-family="Arial, sans-serif" font-size="33" font-weight="700" letter-spacing="4">UNA FORMACIÓN CON PROPÓSITO</text>
  <text x="118" y="470" fill="#102426" font-family="Arial, sans-serif" font-size="57" font-weight="700">Aprendé a leer</text>
  <text x="118" y="545" fill="#102426" font-family="Arial, sans-serif" font-size="57" font-weight="700">los conflictos</text>
  <text x="118" y="710" fill="#425557" font-family="Arial, sans-serif" font-size="35">La carrera combina saber jurídico,</text>
  <text x="118" y="760" fill="#425557" font-family="Arial, sans-serif" font-size="35">práctica y compromiso social</text>
  <path d="M118 930H890" stroke="#a8c8c1" stroke-width="3"/>
  <text x="118" y="1040" fill="#005587" font-family="Arial, sans-serif" font-size="31" font-weight="700" letter-spacing="3">DESDE EL INICIO</text>
  <text x="118" y="1130" fill="#102426" font-family="Arial, sans-serif" font-size="41" font-weight="700">Casos concretos</text>
  <text x="118" y="1190" fill="#425557" font-family="Arial, sans-serif" font-size="33">Práctica jurídica en instituciones</text>
  <text x="118" y="1240" fill="#425557" font-family="Arial, sans-serif" font-size="33">y práctica solidaria</text>
  <text x="118" y="1375" fill="#102426" font-family="Arial, sans-serif" font-size="41" font-weight="700">Mirada humana</text>
  <text x="118" y="1435" fill="#425557" font-family="Arial, sans-serif" font-size="33">Justicia, ética y derechos humanos</text>
  <text x="118" y="1970" fill="#005587" font-family="Arial, sans-serif" font-size="30" font-weight="700">01 / 03</text>

  <text x="1128" y="210" fill="#005587" font-family="Arial, sans-serif" font-size="33" font-weight="700" letter-spacing="4">LO QUE VAS A DESARROLLAR</text>
  <text x="1128" y="480" fill="#102426" font-family="Arial, sans-serif" font-size="57" font-weight="700">Herramientas para</text>
  <text x="1128" y="555" fill="#102426" font-family="Arial, sans-serif" font-size="57" font-weight="700">intervenir mejor</text>
  <g transform="translate(1128 760)">
    <circle cx="30" cy="30" r="30" fill="#005587"/><path d="M13 31L25 43L48 17" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="88" y="42" fill="#102426" font-family="Arial, sans-serif" font-size="38" font-weight="700">Litigio y mediación</text>
    <text x="88" y="91" fill="#425557" font-family="Arial, sans-serif" font-size="32">Argumentación y acuerdos</text>
  </g>
  <g transform="translate(1128 1030)">
    <circle cx="30" cy="30" r="30" fill="#005587"/><path d="M13 31L25 43L48 17" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="88" y="42" fill="#102426" font-family="Arial, sans-serif" font-size="38" font-weight="700">Tecnología jurídica</text>
    <text x="88" y="91" fill="#425557" font-family="Arial, sans-serif" font-size="32">Análisis y gestión digital</text>
  </g>
  <g transform="translate(1128 1300)">
    <circle cx="30" cy="30" r="30" fill="#005587"/><path d="M13 31L25 43L48 17" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="88" y="42" fill="#102426" font-family="Arial, sans-serif" font-size="38" font-weight="700">Perspectiva global</text>
    <text x="88" y="91" fill="#425557" font-family="Arial, sans-serif" font-size="32">Derecho y mirada interdisciplinaria</text>
  </g>
  <text x="1128" y="1970" fill="#005587" font-family="Arial, sans-serif" font-size="30" font-weight="700">02 / 03</text>

  <text x="2138" y="210" fill="#005587" font-family="Arial, sans-serif" font-size="33" font-weight="700" letter-spacing="4">TU PERFIL PROFESIONAL</text>
  <text x="2138" y="470" fill="#102426" font-family="Arial, sans-serif" font-size="57" font-weight="700">Una carrera para</text>
  <text x="2138" y="545" fill="#102426" font-family="Arial, sans-serif" font-size="57" font-weight="700">abrir caminos</text>
  <text x="2138" y="710" fill="#425557" font-family="Arial, sans-serif" font-size="35">Podés desempeñarte en forma</text>
  <text x="2138" y="760" fill="#425557" font-family="Arial, sans-serif" font-size="35">independiente o integrar equipos</text>
  <text x="2138" y="810" fill="#425557" font-family="Arial, sans-serif" font-size="35">en organizaciones y organismos</text>
  <path d="M2138 940H2910" stroke="#a8c8c1" stroke-width="3"/>
  <text x="2138" y="1050" fill="#005587" font-family="Arial, sans-serif" font-size="31" font-weight="700" letter-spacing="3">ÁMBITOS DE ACCIÓN</text>
  <text x="2138" y="1150" fill="#102426" font-family="Arial, sans-serif" font-size="39">Consultoría jurídica</text>
  <text x="2138" y="1220" fill="#102426" font-family="Arial, sans-serif" font-size="39">Patrocinio y representación</text>
  <text x="2138" y="1290" fill="#102426" font-family="Arial, sans-serif" font-size="39">Asesoría en organizaciones</text>
  <text x="2138" y="1360" fill="#102426" font-family="Arial, sans-serif" font-size="39">Carrera judicial</text>
  <rect x="2138" y="1570" width="770" height="230" rx="25" fill="#005587"/>
  <text x="2190" y="1650" fill="#d7f7f2" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">EMPEZÁ POR UNA CHARLA</text>
  <text x="2190" y="1725" fill="#ffffff" font-family="Arial, sans-serif" font-size="42" font-weight="700">11 3297-3801</text>
  <text x="2138" y="1970" fill="#005587" font-family="Arial, sans-serif" font-size="30" font-weight="700">03 / 03</text>
`);

const exteriorPath = path.join(out, 'folleto-abogacia-triptico-exterior.svg');
const interiorPath = path.join(out, 'folleto-abogacia-triptico-interior.svg');
const exteriorPng = path.join(out, 'folleto-abogacia-triptico-exterior.png');
const interiorPng = path.join(out, 'folleto-abogacia-triptico-interior.png');
const preview = path.join(out, 'folleto-abogacia-triptico-prueba.jpg');
const pdfPath = path.join(out, 'folleto-abogacia-triptico-prueba-rgb.pdf');
fs.writeFileSync(exteriorPath, exterior, 'utf8');
fs.writeFileSync(interiorPath, interior, 'utf8');
await sharp(Buffer.from(exterior)).png().resize(3030, 2160).toFile(exteriorPng);
await sharp(Buffer.from(interior)).png().resize(3030, 2160).toFile(interiorPng);
await sharp(Buffer.from(exterior)).png().resize(1010, 720).jpeg({ quality: 88 }).toFile(preview);
const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
pdf.addImage(fs.readFileSync(exteriorPng).toString('base64'), 'PNG', 0, 0, 297, 210, undefined, 'FAST');
pdf.addPage('a4', 'landscape');
pdf.addImage(fs.readFileSync(interiorPng).toString('base64'), 'PNG', 0, 0, 297, 210, undefined, 'FAST');
pdf.save(pdfPath);
console.log(JSON.stringify({ exteriorPath, interiorPath, exteriorPng, interiorPng, preview, pdfPath }, null, 2));
