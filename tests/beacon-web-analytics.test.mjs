import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const layout = readFileSync(fileURLToPath(new URL('../cloudflare/src/layouts/Sitio.astro', import.meta.url)), 'utf8');
const cabeceras = readFileSync(fileURLToPath(new URL('../cloudflare/src/entrega/cabeceras.ts', import.meta.url)), 'utf8');

// El beacon de Cloudflare Web Analytics manda los datos a `/cdn-cgi/rum` del
// propio dominio. Sin `send.to` postea a
// `https://cloudflareinsights.com/cdn-cgi/rum`, que responde 404 y sin
// cabeceras CORS: cada visitante veía un error de CORS en la consola y
// Lighthouse lo contaba como fallo de buenas prácticas (el 11/11/2026 la
// página daba 96 en buenas prácticas).
test('el beacon de Web Analytics postea al mismo origen', () => {
  assert.match(layout, /send:\s*\{\s*to:\s*'\/cdn-cgi\/rum'\s*\}/);
});

// Sin este origen en la CSP el navegador bloquea el script del beacon y el
// sitio queda sin medición de visitas.
test('la CSP deja pasar el script del beacon', () => {
  assert.match(cabeceras, /script-src[^"]*https:\/\/static\.cloudflareinsights\.com/);
});
