// Baja los assets oficiales de teclab.edu.ar y los deja optimizados en
// public/imagenes/teclab/. Se corre a mano (`node scripts/descargar-assets-teclab.mjs`)
// cuando Teclab renueva las fotos de sus paginas de carrera.
//
// Cada ficha oficial trae dos fotos de la misma produccion: la de portada
// (header-h) y la del pie (footer-N). Se guardan las dos, en su resolucion
// original y con poca compresion: son las que se ven grandes en el modal y a
// todo el ancho en el hero de la pagina de carrera.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.join(process.cwd(), 'public', 'imagenes', 'teclab');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// [foto de portada, foto de cierre] de cada ficha, en rutas del WordPress de Teclab.
// Programacion no tiene fotos propias en buena resolucion (las suyas son de
// 600 px), asi que usa fotos del blog del mismo instituto.
const CARRERAS = {
  'programacion': [
    '2026/07/typing-on-laptop-keyboard-with-illuminated-keys-2026-03-18-14-53-48-utc-scaled.jpg',
    '2026/07/young-adult-working-on-computer-with-headphones-in-2026-01-08-22-44-58-utc-1-scaled.jpg',
  ],
  'data-science': ['2026/03/header-h.png', '2026/03/footer.png'],
  'quality-assurance': ['2026/04/image-gen2.png', '2026/03/footer-10.png'],
  'cloud-administration': ['2026/03/header-h-1.png', '2026/03/footer.png'],
  'seguridad-informatica': ['2026/04/man-1.png', '2026/04/Person-in-Online-Meeting-2-scaled.png'],
  'redes-informaticas': ['2026/04/header-h-10.png', '2026/04/footer-10.png'],
  'marketing-digital': ['2026/03/header-h-7.png', '2026/03/footer-6.png'],
  'inbound-marketing': ['2026/03/header-h-6.png', '2026/03/footer-5.png'],
  'customer-experience': ['2026/03/header-h-2.png', '2026/03/footer-1.png'],
  'gestion-contable': ['2026/03/header-h-4.png', '2026/03/footer-3.png'],
  'seguros': ['2026/04/woman-3.png', '2026/04/Collaborative-Workspace-3.png'],
  'gestion-agraria': ['2026/03/header-h-3.png', '2026/03/footer-2.png'],
  'relaciones-laborales': ['2026/04/header-h-11.png', '2026/04/Sin-titulo-1.png'],
  'gestion-hotelera': ['2026/03/header-h-5.png', '2026/03/footer-4.png'],
  'eventos': ['2026/03/header-h-9.png', '2026/03/footer-8.png'],
  'periodismo': ['2026/04/image-gen-1.png', '2026/03/footer-7.png'],
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

async function guardarFoto(rel, destino, { ancho, calidad }) {
  const info = await sharp(await bajar(rel))
    .resize({ width: ancho, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: calidad })
    .toFile(destino);
  console.log(`${path.relative(RAIZ, destino).replace(/\\/g, '/')}  ${Math.round(info.size / 1024)} KB  ${info.width}x${info.height}`);
}

async function main() {
  await mkdir(path.join(RAIZ, 'carreras'), { recursive: true });
  await mkdir(path.join(RAIZ, 'partners'), { recursive: true });

  for (const [nombre, [portada, cierre]] of Object.entries(CARRERAS)) {
    // La portada se ve a todo el ancho en el hero de la pagina: va grande y con
    // poca compresion. La de cierre solo aparece dentro del modal.
    await guardarFoto(portada, path.join(RAIZ, 'carreras', `${nombre}.webp`), { ancho: 1600, calidad: 86 });
    await guardarFoto(cierre, path.join(RAIZ, 'carreras', `${nombre}-cierre.webp`), { ancho: 1100, calidad: 82 });
  }

  for (const [grupo, mapa] of [['partners', LOGOS], ['', MARCA]]) {
    for (const [nombre, rel] of Object.entries(mapa)) {
      const info = await sharp(await bajar(rel))
        .resize({ width: 420, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 92, alphaQuality: 100 })
        .toFile(path.join(RAIZ, grupo, `${nombre}.webp`));
      console.log(`${grupo ? grupo + '/' : ''}${nombre}.webp  ${Math.round(info.size / 1024)} KB  ${info.width}x${info.height}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
