// Informa qué rutas de `tests/fixtures/paridad/rutas.json` no coinciden con el
// build local, sin escribir nada. Sirve para ver si la diferencia es la esperada
// antes de actualizar una referencia.
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from '../tests/fixtures/catalogo-home.mjs';
import { proyectarPagina, RUTAS_REFERENCIA } from '../tests/helpers/referencias-rutas.mjs';

const referencias = JSON.parse(await readFile(new URL('../tests/fixtures/paridad/rutas.json', import.meta.url), 'utf8'));
const astro = createTestHarness({ workers: [{ configPath: './dist/server/wrangler.json' }] });
await astro.listen();
const diferencias = [];
try {
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);
  for (const especificacion of RUTAS_REFERENCIA) {
    const respuesta = await astro.fetch(especificacion.ruta);
    const actual = proyectarPagina(await respuesta.text(), especificacion);
    const campos = Object.keys(referencias[especificacion.ruta]);
    const distintos = campos.filter(campo => !isDeepStrictEqual(actual[campo], referencias[especificacion.ruta][campo]));
    if (distintos.length) diferencias.push(`${especificacion.ruta}: ${distintos.join(', ')}`);
  }
} finally {
  await astro.close();
}
console.log(diferencias.length ? diferencias.join('\n') : 'Todas las rutas coinciden.');
