import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// El HTML público se cachea en el borde desde el Worker de producción. Estas
// comprobaciones miran el código y no el comportamiento: el entry de producción
// no se puede importar desde node (arrastra el build de Astro), y sin un guardia
// alguien puede borrar la Cache API en un refactor y volver a 0,45 s de TTFB sin
// que ninguna prueba se entere. Lo que se verifica acá es que las tres piezas
// sigan en su lugar: la cabecera que anuncia la frescura, la clave que excluye
// lo privado y el guardado real en la caché.

const worker = readFileSync(new URL('../produccion/worker.ts', import.meta.url), 'utf8');
const cabeceras = readFileSync(new URL('../src/entrega/cabeceras.ts', import.meta.url), 'utf8');

test('el HTML público anuncia su TTL de borde y respeta el del navegador', () => {
  assert.match(worker, /'Cloudflare-CDN-Cache-Control'/);
  assert.match(worker, /max-age=\$\{EDGE_SEGUNDOS\}/);
  assert.match(worker, /stale-while-revalidate=\$\{EDGE_SWR_SEGUNDOS\}/);
  assert.match(worker, /'Cache-Control', 'public, max-age=0, must-revalidate'/);
});

test('la clave de caché es sólo GET del dominio canónico y nunca rutas privadas', () => {
  assert.match(worker, /request\.method !== 'GET'\) return null/);
  assert.match(worker, /url\.hostname !== CANONICO\) return null/);
  assert.match(worker, /HTML_PUBLICO\.test\(url\.pathname\)\) return null/);
  assert.match(worker, /api/);
});

test('la copia se guarda en la caché del borde y se devuelve con frescura propia', () => {
  assert.match(worker, /caches\?\.default/);
  assert.match(worker, /cacheDeBorde!\.match\(clave\)/);
  assert.match(worker, /ctx\.waitUntil\(cacheDeBorde!\.put\(clave, paraCache\)\)/);
  // Un 404 no se guarda: sólo 200 con HTML.
  assert.match(worker, /respuesta\.status === 200/);
});

test('las imágenes y las fuentes salen con TTL propio desde _headers', () => {
  assert.match(cabeceras, /\/imagenes\/\*/);
  assert.match(cabeceras, /\/fuentes\/\*/);
  assert.match(cabeceras, /max-age=86400, stale-while-revalidate=604800/);
});
