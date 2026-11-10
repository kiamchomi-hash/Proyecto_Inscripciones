// Regenera `tests/fixtures/paridad/home.json` con lo que devuelve el build local.
//
//   node scripts/actualizar-referencia-home.mjs
//
// Se usa cuando la home cambia a propósito. El generador que produjo las
// referencias era la app de Next, que ya no está en el repo: hoy la única
// fuente es el Worker, así que la referencia pasa a ser una foto del estado
// acordado y hay que revisar la diferencia antes de sustituirla.
//
// Es el gemelo de `actualizar-referencia-ruta.mjs`, que hace lo mismo para una
// ruta de `rutas.json`.
import { readFile, writeFile } from 'node:fs/promises';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from '../tests/fixtures/catalogo-home.mjs';
import { canonical, enlacesDe, idioma, jsonLd, metas, textoPrincipal, titulo } from '../tests/helpers/html.mjs';

// Las mismas metas que compara `tests/referencia-home.test.mjs`. Las que no
// estén en la lista no se tocan: la referencia conserva lo que registró Next.
const META = ['description', 'author', 'creator', 'og:type', 'og:locale', 'og:url', 'og:site_name',
  'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt',
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'google-site-verification'];

const archivo = new URL('../tests/fixtures/paridad/home.json', import.meta.url);
const referencia = JSON.parse(await readFile(archivo, 'utf8'));

const astro = createTestHarness({ workers: [{ configPath: './dist/server/wrangler.json' }] });
await astro.listen();
try {
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);
  const respuesta = await astro.fetch('/');
  if (respuesta.status !== 200) throw new Error(`La home respondió ${respuesta.status}`);
  const html = await respuesta.text();
  const actuales = metas(html);
  for (const clave of META) {
    if (actuales[clave] !== undefined) referencia.metas[clave] = actuales[clave];
  }
  referencia.idioma = idioma(html);
  referencia.titulo = titulo(html);
  referencia.canonical = canonical(html);
  referencia.jsonLd = jsonLd(html);
  referencia.texto = textoPrincipal(html);
  referencia.enlaces = enlacesDe(html, { apertura: /<main\b/, cierre: '</main>' }).sort();
  referencia.navegacion = enlacesDe(html, { apertura: /<nav\b[^>]*class="main-navbar"/, cierre: '</nav>' }).sort();
  referencia.pie = enlacesDe(html, { apertura: /<footer\b/, cierre: '</footer>' }).sort();
} finally {
  await astro.close();
}

await writeFile(archivo, `${JSON.stringify(referencia, null, 2)}\n`);
console.log('Actualizada la referencia de la home');
