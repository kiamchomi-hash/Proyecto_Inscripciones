import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// WebP limita ancho y alto a 16383 píxeles. Se conserva RGBA sin pérdida;
// cada banda declara su posición para reconstruir sin huecos ni solapamientos.
export async function codificarBandas(png, altoMaximo = 12000) {
  if (!Number.isSafeInteger(altoMaximo) || altoMaximo < 1 || altoMaximo > 16383) {
    throw new RangeError('Alto máximo de banda inválido');
  }
  const { width, height } = await sharp(png, { limitInputPixels: false }).metadata();
  if (!width || !height || width > 16383) throw new Error('Dimensiones incompatibles con WebP');
  const bandas = [];
  for (let y = 0; y < height; y += altoMaximo) {
    const alto = Math.min(altoMaximo, height - y);
    const imagen = await sharp(png, { limitInputPixels: false })
      .extract({ left: 0, top: y, width, height: alto })
      .webp({ lossless: true, effort: 4 }).toBuffer();
    // Algunos codificadores descartan RGB de píxeles totalmente transparentes
    // incluso en modo lossless. Nunca aceptar una referencia con bytes distintos.
    const original = await sharp(png, { limitInputPixels: false })
      .extract({ left: 0, top: y, width, height: alto }).ensureAlpha().raw().toBuffer();
    const reconstruida = await sharp(imagen).ensureAlpha().raw().toBuffer();
    if (!original.equals(reconstruida)) throw new Error(`WebP alteró píxeles en la banda ${y}`);
    bandas.push({ y, alto, imagen });
  }
  return { ancho: width, alto: height, bandas };
}

export async function validarBandas({ ancho, alto, bandas }) {
  if (!Number.isSafeInteger(ancho) || ancho < 1 || !Number.isSafeInteger(alto) || alto < 1 || !bandas.length) {
    throw new Error('Manifiesto de bandas inválido');
  }
  let siguiente = 0;
  for (const banda of bandas) {
    if (banda.y !== siguiente || !Number.isSafeInteger(banda.alto) || banda.alto < 1) {
      throw new Error('Bandas con huecos o solapamientos');
    }
    const metadata = await sharp(banda.imagen, { limitInputPixels: false }).metadata();
    if (metadata.format !== 'webp' || metadata.width !== ancho || metadata.height !== banda.alto) {
      throw new Error('Las dimensiones de la banda no coinciden con el manifiesto');
    }
    siguiente += banda.alto;
  }
  if (siguiente !== alto) throw new Error('Las bandas no cubren la imagen completa');
}

/** Reconstruye el PNG para la comparación existente de Chromium. */
export async function leerReferenciaVisual(directorio, nombre) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(nombre)) throw new Error('Nombre de referencia inválido');
  const manifiesto = JSON.parse(await readFile(join(directorio, `${nombre}.json`), 'utf8'));
  if (!Array.isArray(manifiesto.bandas)) throw new Error('Manifiesto de bandas inválido');
  const bandas = await Promise.all(manifiesto.bandas.map(async banda => {
    if (typeof banda.archivo !== 'string' || !/^[a-z0-9][a-z0-9-]*\.webp$/.test(banda.archivo)) {
      throw new Error('Nombre de banda inválido');
    }
    return { ...banda, imagen: await readFile(join(directorio, banda.archivo)) };
  }));
  await validarBandas({ ...manifiesto, bandas });
  const crudo = Buffer.concat(await Promise.all(bandas.map(banda =>
    sharp(banda.imagen, { limitInputPixels: false }).ensureAlpha().raw().toBuffer())));
  return sharp(crudo, { raw: { width: manifiesto.ancho, height: manifiesto.alto, channels: 4 }, limitInputPixels: false })
    .png().toBuffer();
}
