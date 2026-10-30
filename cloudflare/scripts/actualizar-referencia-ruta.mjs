// Regenera una sola entrada de `tests/fixtures/paridad/rutas.json` con lo que
// devuelve el build local. Se usa cuando la página cambia a propósito; el resto
// de las entradas no se toca.
//
//   node scripts/actualizar-referencia-ruta.mjs /calendario-academico
import { readFile, writeFile } from 'node:fs/promises';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from '../tests/fixtures/catalogo-home.mjs';
import { proyectarPagina, RUTAS_REFERENCIA } from '../tests/helpers/referencias-rutas.mjs';

const ruta = process.argv[2];
const especificacion = RUTAS_REFERENCIA.find(r => r.ruta === ruta);
if (!especificacion) throw new Error(`La ruta ${ruta} no está en RUTAS_REFERENCIA.`);

const archivo = new URL('../tests/fixtures/paridad/rutas.json', import.meta.url);
const referencias = JSON.parse(await readFile(archivo, 'utf8'));

const astro = createTestHarness({ workers: [{ configPath: './dist/server/wrangler.json' }] });
await astro.listen();
try {
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);
  const respuesta = await astro.fetch(especificacion.ruta);
  if (respuesta.status !== 200) throw new Error(`La ruta respondió ${respuesta.status}`);
  referencias[especificacion.ruta] = proyectarPagina(await respuesta.text(), especificacion);
} finally {
  await astro.close();
}

await writeFile(archivo, `${JSON.stringify(referencias, null, 2)}\n`);
console.log(`Actualizada la referencia de ${ruta}`);
