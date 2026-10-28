// Una sola vez, desde capturas sintéticas producidas por el E2E de Next.
// No pisa archivos existentes ni descarga imágenes de producción.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { codificarBandas } from './bandas-webp.mjs';

const [destino, ...origenes] = process.argv.slice(2);
if (!destino || origenes.length !== 2) throw new Error('Uso: node tests/helpers/generar-referencias-visuales.mjs <destino-nuevo> <home> <paginas>');
const archivos = [];
for (const origen of origenes) {
  for (const archivo of (await readdir(origen)).filter(nombre => nombre.endsWith('-next.png')).sort()) {
    archivos.push(join(origen, archivo));
  }
}
if (archivos.length !== 50) throw new Error(`Se esperaban 50 capturas Next, hay ${archivos.length}.`);
const nombres = archivos.map(archivo => basename(archivo).replace(/-next\.png$/, ''));
if (new Set(nombres).size !== nombres.length) throw new Error('Hay nombres de capturas duplicados.');
await mkdir(destino); // falla si existe; jamás sobreescribe la referencia
for (const [indice, archivo] of archivos.entries()) {
  const nombre = nombres[indice];
  const { ancho, alto, bandas } = await codificarBandas(await readFile(archivo));
  const lista = [];
  for (const banda of bandas) {
    const salida = `${nombre}-${banda.y}.webp`;
    await writeFile(join(destino, salida), banda.imagen, { flag: 'wx' });
    lista.push({ archivo: salida, y: banda.y, alto: banda.alto });
  }
  await writeFile(join(destino, `${nombre}.json`), `${JSON.stringify({ ancho, alto, bandas: lista }, null, 2)}\n`, { flag: 'wx' });
}
console.log(`${archivos.length} referencias visuales verificadas en ${destino}`);
