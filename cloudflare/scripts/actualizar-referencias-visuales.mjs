// Regenera las referencias visuales corregidas desde las capturas de una
// corrida del e2e.
//
//   node scripts/actualizar-referencias-visuales.mjs <carpeta-capturas-home> <carpeta-capturas-paginas>
//
// Se usa cuando una página cambia a propósito: la referencia es una foto del
// estado acordado y hay que revisar la diferencia antes de sustituirla. Las
// referencias históricas de Next (`tests/fixtures/visuales-next/`) no se tocan:
// quedan como registro de la paridad de aquella época.
//
// Necesita el build hecho y las capturas de la última corrida del e2e, que
// quedan en `cloudflare/.local/capturas/`.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codificarBandas } from '../tests/helpers/bandas-webp.mjs';

const PAQUETE = fileURLToPath(new URL('..', import.meta.url));
const DESTINO = join(PAQUETE, 'tests', 'fixtures', 'visuales-corregidas');

const [carpetaHome, carpetaPaginas] = process.argv.slice(2);
if (!carpetaHome || !carpetaPaginas) {
  throw new Error('Uso: node scripts/actualizar-referencias-visuales.mjs <home> <paginas>');
}
if (!existsSync(carpetaHome) || !existsSync(carpetaPaginas)) {
  throw new Error('Las carpetas de capturas no están: corré el e2e primero.');
}

await mkdir(DESTINO, { recursive: true });

const nombres = [
  ...readdirSync(carpetaHome).filter(n => n.endsWith('-astro.png')).map(n => n.replace(/-astro\.png$/, '')),
  ...readdirSync(carpetaPaginas).filter(n => n.endsWith('-astro.png')).map(n => n.replace(/-astro\.png$/, '')),
].sort();

let bytes = 0;
for (const nombre of nombres) {
  const origen = join(nombre.startsWith('home-') ? carpetaHome : carpetaPaginas, `${nombre}-astro.png`);
  if (!existsSync(origen)) { console.error(`Falta la captura ${origen}`); continue; }
  const { ancho, alto, bandas } = await codificarBandas(await readFile(origen));
  const lista = [];
  for (const banda of bandas) {
    const archivo = `${nombre}-${banda.y}.webp`;
    await writeFile(join(DESTINO, archivo), banda.imagen);
    lista.push({ archivo, y: banda.y, alto: banda.alto });
    bytes += banda.imagen.length;
  }
  await writeFile(join(DESTINO, `${nombre}.json`), `${JSON.stringify({ ancho, alto, bandas: lista }, null, 2)}\n`);
  console.log(`✓ ${nombre} — ${ancho}x${alto}`);
}
console.log(`\n${nombres.length} referencias · ${(bytes / 1024 / 1024).toFixed(1)} MiB de bandas`);
