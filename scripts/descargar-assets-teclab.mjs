// Baja los assets oficiales de teclab.edu.ar y los deja optimizados en
// public/imagenes/teclab/. Se corre a mano (`node scripts/descargar-assets-teclab.mjs`)
// cuando Teclab renueva las fotos de sus paginas de carrera.
//
// Cada foto sale de la pagina oficial de esa carrera: son las mismas que Teclab
// usa de portada, asi el modal del sitio y teclab.edu.ar muestran lo mismo.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.join(process.cwd(), 'public', 'imagenes', 'teclab');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// clave = nombre del archivo local, valor = ruta en el WordPress de Teclab
const CARRERAS = {
  // La ficha de Programacion trae una portada chica (600 px); esta nota de
  // Teclab sobre programadores es la misma estetica y rinde mejor en el hero.
  'programacion': '2023/11/Nota-programadores-Teclab-.png',
  'data-science': '2026/03/header-h.png',
  'quality-assurance': '2026/04/image-gen2.png',
  'cloud-administration': '2026/03/header-h-1.png',
  'seguridad-informatica': '2026/04/man-1.png',
  'redes-informaticas': '2026/04/header-h-10.png',
  'marketing-digital': '2026/03/header-h-7.png',
  'inbound-marketing': '2026/03/header-h-6.png',
  'customer-experience': '2026/03/header-h-2.png',
  // Venta Directa todavia no tiene ficha propia: va una foto general de alumnos
  'venta-directa': '2025/11/Candela-Teclab_11zon-scaled-1.webp',
  'gestion-contable': '2026/03/header-h-4.png',
  'seguros': '2026/04/woman-3.png',
  'gestion-agraria': '2026/03/header-h-3.png',
  'relaciones-laborales': '2026/04/header-h-11.png',
  'gestion-hotelera': '2026/03/header-h-5.png',
  'eventos': '2026/03/header-h-9.png',
  'periodismo': '2026/04/image-gen-1.png',
};

// Logos blancos de las empresas que cocrearon cada carrera, tal como los publica
// Teclab en la ficha de la carrera.
const LOGOS = {
  'avenga': '2024/10/logo-avenga.png',
  'aws': '2026/03/logos-blanco-aws-1.png',
  'microsoft': '2026/03/logos-blanco-microsoft.png',
  'google': '2026/03/logos-blanco-google.png',
  'hubspot': '2026/03/logos-blanco-hubspot.png',
  'zendesk': '2026/03/logos-blanco-zendesk.png',
};

const MARCA = {
  'logo-teclab': '2023/10/teclab_logo_blanco_296.png',
  'logo-teclab-siglo21': '2024/10/teclab-siglo.png',
};

async function bajar(rel) {
  const res = await fetch(`https://teclab.edu.ar/wp-content/uploads/${rel}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${rel}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(path.join(RAIZ, 'carreras'), { recursive: true });
  await mkdir(path.join(RAIZ, 'partners'), { recursive: true });

  for (const [nombre, rel] of Object.entries(CARRERAS)) {
    const info = await sharp(await bajar(rel))
      .resize({ width: 1200, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72 })
      .toFile(path.join(RAIZ, 'carreras', `${nombre}.webp`));
    console.log(`carreras/${nombre}.webp  ${Math.round(info.size / 1024)} KB  ${info.width}x${info.height}`);
  }

  for (const [grupo, mapa] of [['partners', LOGOS], ['', MARCA]]) {
    for (const [nombre, rel] of Object.entries(mapa)) {
      const info = await sharp(await bajar(rel))
        .resize({ width: 420, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 88, alphaQuality: 100 })
        .toFile(path.join(RAIZ, grupo, `${nombre}.webp`));
      console.log(`${grupo ? grupo + '/' : ''}${nombre}.webp  ${Math.round(info.size / 1024)} KB  ${info.width}x${info.height}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
