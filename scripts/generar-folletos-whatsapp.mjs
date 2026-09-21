import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

// Variantes verticales para compartir por WhatsApp. La lista es el foco de la
// pieza: se elimina el rótulo editorial "Oferta académica" y se reserva más
// superficie y cuerpo tipográfico para las carreras.
const W = 1240;
const H = 1550;
const M = 64;
const FUENTE = 'Segoe UI, Arial, sans-serif';
const salida = 'public/folletos';

const esc = (texto) => texto
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

function texto(x, y, contenido, size, fill = '#fff', weight = 500, extra = '') {
  return `<text x="${x}" y="${y}" font-family="${FUENTE}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${esc(contenido)}</text>`;
}

function lista(items, x, y, ancho, size, leading = 31) {
  const partes = [];
  let cursor = y;
  for (const item of items) {
    // Los nombres largos ocupan dos líneas sin invadir la columna vecina.
    const palabras = item.split(' ');
    const lineas = [];
    let actual = '';
    for (const palabra of palabras) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (prueba.length > (ancho < 350 ? 27 : 31) && actual) {
        lineas.push(actual);
        actual = palabra;
      } else actual = prueba;
    }
    if (actual) lineas.push(actual);
    partes.push(texto(x, cursor, `– ${lineas[0]}`, size, '#e9f2f1', 500));
    for (let i = 1; i < lineas.length; i += 1) {
      cursor += leading;
      partes.push(texto(x + 20, cursor, lineas[i], size, '#e9f2f1', 500));
    }
    cursor += leading + (lineas.length > 1 ? 3 : 0);
  }
  return { svg: partes.join(''), bottom: cursor };
}

function fondo(color, accent, alto = H, conTrama = false) {
  return `<defs>
    <radialGradient id="brillo" cx="88%" cy="8%" r="72%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".26"/>
      <stop offset="42%" stop-color="${accent}" stop-opacity=".08"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="brillo2" cx="8%" cy="92%" r="56%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".13"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="velo" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${color}" stop-opacity=".98"/>
      <stop offset="55%" stop-color="${color}" stop-opacity=".91"/>
      <stop offset="100%" stop-color="${color}" stop-opacity=".18"/>
    </linearGradient>
    <pattern id="trama" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="${accent}" stroke-opacity=".09"/>
    </pattern>
    <filter id="desenfoque" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="72"/>
    </filter>
  </defs>
  <rect width="${W}" height="${alto}" fill="${color}"/>
  <rect width="${W}" height="${alto}" fill="url(#brillo)"/>
  <rect width="${W}" height="${alto}" fill="url(#brillo2)"/>
  <rect width="${W}" height="${alto}" fill="url(#velo)" opacity=".3"/>
  <ellipse cx="${W * 0.92}" cy="${alto * 0.10}" rx="${W * 0.34}" ry="${alto * 0.22}" fill="${accent}" opacity=".16" filter="url(#desenfoque)"/>
  <ellipse cx="${W * 0.06}" cy="${alto * 0.78}" rx="${W * 0.28}" ry="${alto * 0.20}" fill="${accent}" opacity=".10" filter="url(#desenfoque)"/>
  <ellipse cx="${W * 0.56}" cy="${alto * 0.48}" rx="${W * 0.18}" ry="${alto * 0.42}" fill="#ffffff" opacity=".025" filter="url(#desenfoque)"/>
  <!-- La fotografía acompaña el encabezado; la lista necesita un campo liso
       para que ningún detalle de la imagen compita con los nombres. -->
  ${conTrama ? `<rect width="${W}" height="${alto}" fill="url(#trama)"/>` : ''}`;
}

function pieCompact(accent, alto = H) {
  const y = alto - 88;
  return `${texto(M, y, 'INSCRIPCIONES ABIERTAS', 27, '#fff', 800)}
    ${texto(M, y + 36, 'Asesoramiento personalizado y 100% online', 18, '#cfe0df', 500)}
    ${texto(W - M, 1441, 'WhatsApp 11 6652–2722', 19, '#dce9e8', 500, 'text-anchor="end"')}
    ${texto(W - M, y + 39, 'www.siglo21sur.com', 21, accent, 800, 'text-anchor="end"')}`;
}

function columnaAreas(grupos, x, y, size, leading) {
  let cursor = y;
  let svg = '';
  for (const grupo of grupos) {
    svg += texto(x, cursor, grupo.titulo.toUpperCase(), 14, '#00c7b1', 800, 'letter-spacing="1.5"');
    const bloque = lista(grupo.items, x, cursor + 25, 350, size, leading);
    svg += bloque.svg;
    cursor = bloque.bottom + 12;
  }
  return { svg, bottom: cursor };
}

function tarjeta(x, y, ancho, alto, borde = '#ffffff') {
  return `<rect x="${x}" y="${y}" width="${ancho}" height="${alto}" rx="24" fill="#001b1b" fill-opacity=".28" stroke="${borde}" stroke-opacity=".24" stroke-width="2"/><rect x="${x + 24}" y="${y + 18}" width="${Math.min(156, ancho - 48)}" height="5" rx="2.5" fill="${borde}" fill-opacity=".78"/>`;
}

function horizonte(accent) {
  return `<ellipse cx="1010" cy="-300" rx="700" ry="350" fill="none" stroke="${accent}" stroke-opacity=".22" stroke-width="7" filter="url(#desenfoque)"/><ellipse cx="1010" cy="-300" rx="700" ry="350" fill="none" stroke="${accent}" stroke-opacity=".32" stroke-width="3"/><circle cx="1160" cy="42" r="10" fill="${accent}" fill-opacity=".7" filter="url(#desenfoque)"/><circle cx="1160" cy="42" r="4" fill="${accent}" fill-opacity=".9"/>`;
}

// Pie compacto para el formato final: queda anclado al borde inferior del
// lienzo, independientemente de la altura elegida para la pieza.
function pie(accent) {
  const y = H - 88;
  return `${texto(M, y, 'INSCRIPCIONES ABIERTAS', 27, '#fff', 800)}
    ${texto(M, y + 36, 'Asesoramiento personalizado y 100% online', 18, '#cfe0df', 500)}
    ${texto(W - M, y, 'WhatsApp 11 6652-2722', 19, '#dce9e8', 500, 'text-anchor="end"')}
    ${texto(W - M, y + 39, 'www.siglo21sur.com', 21, accent, 800, 'text-anchor="end"')}`;
}

async function generarTeclab() {
  const alto = 1010;
  const accent = '#72a0ff';
  const tecnologia = ['Cloud Administration', 'Data Science', 'Programación', 'Quality Assurance', 'Redes Informáticas', 'Seguridad Informática'];
  const gestion = ['Customer Experience', 'Gestión Agraria', 'Gestión Contable', 'Gestión Hotelera', 'Inbound Marketing', 'Marketing Digital', 'Periodismo y Nuevas Tecnologías', 'Planificación y Organización de Eventos', 'Relaciones Laborales', 'Seguros'];
  const izquierda = lista(tecnologia, M, 292, 500, 27, 45);
  const derecha = lista(gestion, 594, 292, 570, 27, 45);
  const svg = `<svg width="${W}" height="${alto}" xmlns="http://www.w3.org/2000/svg">
    ${fondo('#071822', accent, alto, false)}
    ${horizonte(accent)}
    ${tarjeta(40, 120, 540, 640, accent)}
    ${tarjeta(570, 120, 630, 640, accent)}
    ${tarjeta(40, 790, 1160, 100, accent)}
    ${texto(M, 190, 'Tecnología', 32, '#fff', 800)}
    ${texto(594, 190, 'Gestión y negocios', 32, '#fff', 800)}
    ${izquierda.svg}${derecha.svg}
    <line x1="${M}" y1="790" x2="${W - M}" y2="790" stroke="${accent}" stroke-opacity=".45"/>
    ${texto(M, 830, 'Curso de Inteligencia Artificial disponible', 21, '#eaf4f2', 700)}
    ${pieCompact(accent, alto)}
  </svg>`;
  const logo = await sharp('public/imagenes/teclab/logo-teclab-siglo21.webp').resize({ width: 286 }).toBuffer();
  const altoLogo = (await sharp(logo).metadata()).height;
  const base = await sharp(Buffer.from(`<svg width="${W}" height="${alto}" xmlns="http://www.w3.org/2000/svg">${fondo('#061525', accent, alto, false)}</svg>`))
    .composite([{ input: Buffer.from(svg) }, { input: logo, left: W - M - 286, top: 38 }])
    .jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const hd = await sharp(base).resize(W * 2, alto * 2, { kernel: sharp.kernel.lanczos3 }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  await sharp(hd).toFile(`${salida}/folleto-teclab.jpg`);
  await sharp(hd).resize(620, 505).webp({ quality: 82 }).toFile(`${salida}/folleto-teclab-preview.webp`);
  console.log(`Teclab generado (${altoLogo}px de logo)`);
}

async function generarSiglo21() {
  const accent = '#00c7b1';
  const grado = [
    ['Abogacía', 'Actuario', 'Administración', 'Administración Agraria', 'Administración Pública', 'Bioinformática', 'Ciencia Política y Gobierno', 'Ciencias de Datos', 'Comercialización', 'Comercio Internacional', 'Contador Público'],
    ['Criminología y Seguridad', 'Diseño y Animación Digital', 'Educación y Nuevas Tecnologías', 'Escribanía', 'Finanzas', 'Gestión Ambiental', 'Gestión de Recursos Humanos', 'Gestión Deportiva', 'Gestión Turística', 'Higiene, Seguridad y Medio Ambiente del Trabajo', 'Informática'],
    ['Inteligencia Artificial y Robótica', 'Logística Global', 'Matemática', 'Negocios Digitales', 'Periodismo', 'Publicidad', 'Relaciones Internacionales', 'Relaciones Públicas e Institucionales', 'Seguridad Informática', 'Terapia Ocupacional y Desarrollo Humano'],
  ];
  const titulo = [
    ['Administración de Servicios de Salud', 'Desarrollo de Negocios Inmobiliarios', 'Educación'],
    ['Emprendimiento', 'Gerontología'],
    ['Profesorado Universitario para Nivel Secundario y Superior', 'Psicopedagogía'],
  ];
  const tecnicaturas = [
    ['Administración y Gestión de Políticas Públicas', 'Administración y Gestión Tributaria', 'Dirección de Equipos de Venta', 'Dirección de Protocolo, Organización de Eventos y RRPP', 'Diseño y Animación Digital', 'Diseño y Desarrollo de Videojuegos', 'Estadística Aplicada y Análisis Avanzado'],
    ['Gestión Administrativa de Servicios de Salud', 'Gestión Contable e Impositiva', 'Gestión de Empresas Familiares', 'Gestión de Moda', 'Gestión del Clima Laboral de la Organización', 'Gestión y Auditorías Ambientales', 'Hidrocarburos y Geociencias', 'Higiene y Seguridad Laboral', 'Investigación de la Escena del Crimen'],
    ['Marketing y Publicidad Digital', 'Martillero, Corredor Público y Corredor Inmobiliario', 'Negocios Agroecológicos', 'Procurador', 'Promoción Comunitaria en Niñez y Adolescencia', 'Recursos Turísticos', 'Redes Informáticas y Telecomunicaciones', 'Relaciones Laborales'],
  ];
  const porArea = (items, definiciones) => {
    const usados = new Set();
    const grupos = definiciones.map(({ titulo: nombre, prueba }) => ({
      titulo: nombre,
      items: items.filter((item) => !usados.has(item) && prueba.test(item) && (usados.add(item), true)),
    })).filter((grupo) => grupo.items.length > 0);
    const restantes = items.filter((item) => !usados.has(item));
    if (restantes.length) grupos.push({ titulo: 'Otras áreas', items: restantes });
    return grupos;
  };
  const definiciones = [
    { titulo: 'Derecho', prueba: /abog|escrib|procur|crimin|escena del crimen|martill/i },
    { titulo: 'Ciencias polÃ­ticas', prueba: /polÃ­tica|pÃºblica|internacional/i },
    { titulo: 'Negocios', prueba: /administraciÃ³n|agraria|actuario|finanzas|contable|comercio|negocios|ventas|seguros|emprendimiento/i },
    { titulo: 'TecnologÃ­a', prueba: /informÃ¡tica|inteligencia artificial|robÃ³tica|datos|programaciÃ³n|redes|telecomunicaciones|quality|cloud/i },
    { titulo: 'ComunicaciÃ³n y diseÃ±o', prueba: /diseÃ±o|periodismo|publicidad|relaciones pÃºblicas|protocolo|eventos|marketing|moda|videojuegos/i },
    { titulo: 'EducaciÃ³n, salud y personas', prueba: /educaciÃ³n|psicopedagogÃ­a|profesorado|salud|terapia|niÃ±ez|adolescencia|recursos humanos|relaciones laborales|clima laboral/i },
    { titulo: 'Ambiente y turismo', prueba: /ambiental|hidrocarburos|geociencias|higiene|turÃ­st|hotelera|agroecolÃ³g/i },
  ];
  const definicionesClaras = [
    { titulo: 'Derecho', prueba: /abog|escrib|procur|crimin|escena del crimen|martill/i },
    { titulo: 'Ciencias pol\u00edticas', prueba: /polit|publica|internacional|gobierno/i },
    { titulo: 'Negocios', prueba: /administraci|agraria|actuario|finanz|contab|comerc|negocios|venta|seguros|emprendimiento|contad|empresas familiares/i },
    { titulo: 'Tecnolog\u00eda', prueba: /inform|inteligencia artificial|robot|datos|program|redes|telecom|quality|cloud|bioinform|^log|matem|^estad/i },
    { titulo: 'Comunicaci\u00f3n y dise\u00f1o', prueba: /dise|periodismo|publicidad|relaciones p.*blicas|protocolo|eventos|marketing|moda|videojuegos/i },
    { titulo: 'Educaci\u00f3n, salud y personas', prueba: /educaci|psicopedagog|profesorado|salud|terapia|ni.*ez|adolescencia|recursos humanos|relaciones laborales|clima laboral|geront/i },
    { titulo: 'Ambiente y turismo', prueba: /ambiental|hidrocarburos|geociencias|higiene|tur|hotelera|agroecol|deport/i },
  ];
  // Distribuye los bloques por altura, no por orden: así un área con muchos
  // nombres no empuja el título de la sección siguiente ni deja otra columna
  // vacía.
  const repartir = (grupos) => {
    const columnas = [[], [], []];
    const alturas = [0, 0, 0];
    for (const grupo of [...grupos].sort((a, b) => b.items.length - a.items.length)) {
      const columna = alturas.indexOf(Math.min(...alturas));
      columnas[columna].push(grupo);
      alturas[columna] += grupo.items.length;
    }
    return columnas;
  };
  const bloquesGrado = repartir(porArea(grado.flat(), definicionesClaras)).map((grupos, i) => columnaAreas(grupos, M + i * 385, 250, 17, 20));
  const bloquesTitulo = repartir(porArea(titulo.flat(), definicionesClaras)).map((grupos, i) => columnaAreas(grupos, M + i * 385, 785, 17, 21));
  const bloquesTecnicaturas = repartir(porArea(tecnicaturas.flat(), definicionesClaras)).map((grupos, i) => columnaAreas(grupos, M + i * 385, 990, 16, 20));
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${fondo('#003a31', accent)}
    ${horizonte(accent)}
    ${tarjeta(40, 140, 1160, 545, accent)}
    ${tarjeta(40, 700, 1160, 220, accent)}
    ${tarjeta(40, 935, 1160, 470, accent)}
    ${texto(M, 190, 'Carreras de grado', 30, '#fff', 800)}
    ${texto(M, 220, 'Licenciaturas y títulos profesionales · 4 a 5 años', 16, '#cfe0df', 500)}
    ${bloquesGrado.map((l) => l.svg).join('')}
    ${texto(M, 735, 'Licenciaturas para quienes ya tienen un título', 23, '#fff', 800)}
    ${bloquesTitulo.map((l) => l.svg).join('')}
    ${texto(M, 970, 'Tecnicaturas universitarias', 23, '#fff', 800)}
    ${bloquesTecnicaturas.map((l) => l.svg).join('')}
    ${pieCompact(accent)}
  </svg>`;
  const logo = await sharp('public/imagenes/imagenes_cau/siglo21-marca.svg')
    .resize({ width: 178 })
    .toBuffer();
  const base = await sharp(Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${fondo('#062a28', accent)}</svg>`))
    .composite([{ input: Buffer.from(svg) }, { input: logo, left: W - M - 178, top: 35 }])
    .jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const hd = await sharp(base).resize(W * 2, H * 2, { kernel: sharp.kernel.lanczos3 }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  await sharp(hd).toFile(`${salida}/folleto-siglo21.jpg`);
  await sharp(hd).resize(620, 775).webp({ quality: 82 }).toFile(`${salida}/folleto-siglo21-preview.webp`);
  console.log('Siglo 21 generado');
}

mkdirSync(salida, { recursive: true });
await generarTeclab();
await generarSiglo21();
