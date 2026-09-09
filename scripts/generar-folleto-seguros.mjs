import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { jsPDF } from 'jspdf';

const root = process.cwd();
const out = path.join(root, 'output', 'folleto-seguros');
fs.mkdirSync(out, { recursive: true });

const logo = (await sharp(path.join(root, 'public', 'imagenes', 'teclab', 'logo-teclab.webp')).png().toBuffer()).toString('base64');
const fotoPath = path.join(root, 'public', 'imagenes', 'teclab', 'carreras', 'seguros.webp');
const foto = (await sharp(fotoPath).resize(720, 650, { fit: 'cover', position: 'centre' }).png().toBuffer()).toString('base64');
const whatsappPath = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

// Folleto A5 vertical, una cara. El texto visible se limita a la propuesta,
// los datos confirmados de la carrera y el contacto institucional del CAU.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1540" height="2160" viewBox="0 0 1540 2160">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#071822"/><stop offset="1" stop-color="#170d2c"/>
    </linearGradient>
    <linearGradient id="violeta" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#b65cff"/><stop offset="1" stop-color="#8e2cf2"/>
    </linearGradient>
    <pattern id="puntos" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2.2" fill="#c98dff" opacity=".25"/>
    </pattern>
    <pattern id="reticula" width="82" height="82" patternUnits="userSpaceOnUse">
      <path d="M82 0H0V82" fill="none" stroke="#c9a6ff" stroke-width="1" opacity=".12"/>
    </pattern>
    <clipPath id="foto"><rect x="866" y="98" width="560" height="615" rx="34"/></clipPath>
  </defs>

  <rect width="1540" height="2160" fill="url(#fondo)"/>
  <rect width="1540" height="2160" fill="url(#reticula)"/>
  <rect x="0" y="0" width="690" height="860" fill="url(#puntos)"/>
  <circle cx="1146" cy="405" r="370" fill="#8e2cf2" opacity=".22"/>
  <path d="M1110 0H1540V455" fill="none" stroke="#c98dff" stroke-width="4" opacity=".65"/>
  <path d="M0 1514H430" stroke="#b65cff" stroke-width="12"/>

  <image href="data:image/png;base64,${logo}" x="111" y="76" width="300" height="100" preserveAspectRatio="xMinYMid meet"/>
  <text x="1429" y="137" text-anchor="end" fill="#e8d7ff" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3">CAU VILLA LUGANO</text>

  <text x="111" y="360" fill="#fffafc" font-family="Arial, sans-serif" font-size="126" font-weight="700" letter-spacing="-5">SEGUROS</text>
  <text x="111" y="434" fill="#d29eff" font-family="Arial, sans-serif" font-size="42" font-weight="700">NEGOCIOS, RIESGO</text>
  <text x="111" y="484" fill="#d29eff" font-family="Arial, sans-serif" font-size="42" font-weight="700">Y CLIENTES.</text>
  <text x="111" y="552" fill="#f0eaf7" font-family="Arial, sans-serif" font-size="36">Formateate para entender pólizas, riesgos</text>
  <text x="111" y="595" fill="#f0eaf7" font-family="Arial, sans-serif" font-size="36">y siniestros.</text>

  <image href="data:image/png;base64,${foto}" x="866" y="98" width="560" height="615" preserveAspectRatio="xMidYMid slice" clip-path="url(#foto)"/>
  <rect x="860" y="92" width="572" height="627" rx="39" fill="none" stroke="#8e2cf2" stroke-width="0"/>
  <rect x="880" y="585" width="462" height="112" rx="18" fill="#071822" opacity=".9"/>
  <text x="1111" y="630" text-anchor="middle" fill="#fffafc" font-family="Arial, sans-serif" font-size="32" font-weight="700">Formación para el sector</text>
  <text x="1111" y="670" text-anchor="middle" fill="#d29eff" font-family="Arial, sans-serif" font-size="32" font-weight="700">asegurador</text>

  <g transform="translate(111 770)">
    <rect width="1318" height="195" rx="28" fill="#24173d" stroke="#7540a5" stroke-width="3"/>
    <g transform="translate(48 42)">
      <circle cx="52" cy="52" r="48" fill="url(#violeta)"/>
      <path d="M52 18L80 30V50C80 70 67 85 52 92C37 85 24 70 24 50V30Z" fill="none" stroke="#fff" stroke-width="6"/>
      <path d="M40 53L49 62L66 43" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(0 13)">
      <text x="180" y="70" fill="#fffafc" font-family="Arial, sans-serif" font-size="43" font-weight="700">Estudiá online y recibite en 2 años.</text>
      <text x="180" y="128" fill="#d8c7e7" font-family="Arial, sans-serif" font-size="35">Título de Técnico Superior en Seguros</text>
    </g>
  </g>

  <text x="111" y="1090" fill="#d29eff" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">LO QUE VAS A PODER HACER</text>
  <g transform="translate(111 1140)">
    <rect width="407" height="258" rx="26" fill="#102530" stroke="#3c5360" stroke-width="2"/>
    <rect x="34" y="32" width="57" height="57" rx="15" fill="#8e2cf2"/>
    <text x="62" y="72" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="33" font-weight="700">01</text>
    <text x="34" y="137" fill="#fffafc" font-family="Arial, sans-serif" font-size="34" font-weight="700">ASESORIA</text>
    <text x="34" y="184" fill="#d8d0e2" font-family="Arial, sans-serif" font-size="30">Tipos de seguros</text>
    <text x="34" y="224" fill="#d8d0e2" font-family="Arial, sans-serif" font-size="30">y necesidades del cliente</text>
  </g>
  <g transform="translate(566 1140)">
    <rect width="407" height="258" rx="26" fill="#102530" stroke="#3c5360" stroke-width="2"/>
    <rect x="34" y="32" width="57" height="57" rx="15" fill="#8e2cf2"/>
    <text x="62" y="72" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="33" font-weight="700">02</text>
    <text x="34" y="137" fill="#fffafc" font-family="Arial, sans-serif" font-size="34" font-weight="700">COTIZACIONES</text>
    <text x="34" y="184" fill="#d8d0e2" font-family="Arial, sans-serif" font-size="30">Pólizas, documentación</text>
    <text x="34" y="224" fill="#d8d0e2" font-family="Arial, sans-serif" font-size="30">y propuestas</text>
  </g>
  <g transform="translate(1021 1140)">
    <rect width="408" height="258" rx="26" fill="#102530" stroke="#3c5360" stroke-width="2"/>
    <rect x="34" y="32" width="57" height="57" rx="15" fill="#8e2cf2"/>
    <text x="62" y="72" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="33" font-weight="700">03</text>
    <text x="34" y="137" fill="#fffafc" font-family="Arial, sans-serif" font-size="34" font-weight="700">SINIESTROS</text>
    <text x="34" y="184" fill="#d8d0e2" font-family="Arial, sans-serif" font-size="30">Denuncias, informes</text>
    <text x="34" y="224" fill="#d8d0e2" font-family="Arial, sans-serif" font-size="30">y trámites</text>
  </g>

  <g transform="translate(111 1498)">
    <rect width="1318" height="325" rx="30" fill="#f5f0f8"/>
    <text x="46" y="68" fill="#421768" font-family="Arial, sans-serif" font-size="31" font-weight="700" letter-spacing="2">TU PERFIL PROFESIONAL</text>
    <text x="46" y="130" fill="#1d1722" font-family="Arial, sans-serif" font-size="38" font-weight="700">Preparáte para trabajar en:</text>
    <text x="46" y="190" fill="#3b3043" font-family="Arial, sans-serif" font-size="36">productores asesores independientes, brokers,</text>
    <text x="46" y="237" fill="#3b3043" font-family="Arial, sans-serif" font-size="36">bancos y compañías de seguros.</text>
    <rect x="1010" y="84" width="250" height="176" rx="22" fill="#8e2cf2"/>
    <text x="1135" y="137" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="28" font-weight="700">CERTIFICADO</text>
    <text x="1135" y="183" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="35" font-weight="700">Auxiliar</text>
    <text x="1135" y="224" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="35" font-weight="700">de Seguros</text>
  </g>

  <rect x="0" y="1905" width="1540" height="255" fill="#8e2cf2"/>
  <svg x="1048" y="1952" width="52" height="52" viewBox="0 0 24 24" fill="#fff" aria-label="WhatsApp">
    <path d="${whatsappPath}"/>
  </svg>
  <g transform="translate(111 2082)" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round">
    <path d="M22 7C12 7 5 15 5 25C5 38 22 53 22 53S39 38 39 25C39 15 32 7 22 7Z"/>
    <circle cx="22" cy="25" r="5"/>
  </g>
  <text x="111" y="1976" fill="#fff" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">EMPEZÁ A ESTUDIAR</text>
  <text x="111" y="2040" fill="#fff" font-family="Arial, sans-serif" font-size="42" font-weight="700">Escribinos y te asesoramos.</text>
  <text x="1116" y="1980" fill="#fff" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="3">WHATSAPP</text>
  <text x="1116" y="2028" fill="#fff" font-family="Arial, sans-serif" font-size="42" font-weight="700">11 6652-2722</text>
  <text x="1116" y="2074" fill="#f0dfff" font-family="Arial, sans-serif" font-size="30" font-weight="700">siglo21sur.com</text>
  <text x="165" y="2118" fill="#f0dfff" font-family="Arial, sans-serif" font-size="30">Guaminí 4876 · Villa Lugano · CABA</text>
</svg>`;

const svgPath = path.join(out, 'folleto-seguros-master.svg');
const pngPath = path.join(out, 'folleto-seguros-a5-300dpi.png');
const previewPath = path.join(out, 'folleto-seguros-preview.webp');
const pdfPath = path.join(out, 'folleto-seguros-prueba-rgb.pdf');
fs.writeFileSync(svgPath, svg, 'utf8');
await sharp(Buffer.from(svg)).png().resize(1819, 2551).toFile(pngPath);
await sharp(pngPath).resize(455, 638).webp({ quality: 88 }).toFile(previewPath);
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [154, 216], compress: true });
pdf.addImage(fs.readFileSync(pngPath).toString('base64'), 'PNG', 0, 0, 154, 216, undefined, 'FAST');
pdf.save(pdfPath);
console.log(JSON.stringify({ svgPath, pngPath, previewPath, pdfPath }, null, 2));
