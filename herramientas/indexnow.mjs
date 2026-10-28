#!/usr/bin/env node
// Avisa a IndexNow (Bing y los demás buscadores del protocolo) todas las URLs
// del sitemap de producción, de una vez.
//
//   npm run indexnow              # manda el sitemap entero
//   npm run indexnow -- --probar  # sólo lista lo que mandaría
//
// El aviso de todos los días no pasa por acá: `/api/revalidar` del Worker ya no
// manda IndexNow (no hay ISR ni caché que invalidar), así que hoy se avisa a
// mano. Esto es para la primera carga, para después de un
// deploy que toca muchas páginas a la vez (títulos, plantilla de la ficha) o
// para cuando IndexNow estuvo caído.
//
// Sale con código 1 si IndexNow no aceptó el pedido.

import { avisarIndexNow, INDEXNOW_HOST, INDEXNOW_KEY } from '../lib/indexnow.ts';

const BASE = `https://${INDEXNOW_HOST}`;
// Tope del protocolo por pedido.
const MAXIMO = 10000;
const probar = process.argv.includes('--probar');

const clave = await fetch(`${BASE}/${INDEXNOW_KEY}.txt`);
const textoClave = clave.ok ? (await clave.text()).trim() : '';
if (textoClave !== INDEXNOW_KEY) {
  console.error(`La clave no está publicada en ${BASE}/${INDEXNOW_KEY}.txt (HTTP ${clave.status}). Deployar antes de avisar.`);
  process.exit(1);
}

const sitemap = await fetch(`${BASE}/sitemap.xml`);
if (!sitemap.ok) {
  console.error(`No se pudo leer el sitemap (HTTP ${sitemap.status}).`);
  process.exit(1);
}
const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, url]) => url.trim())
  .filter((url) => url.startsWith(`${BASE}/`) || url === BASE);

if (urls.length === 0 || urls.length > MAXIMO) {
  console.error(`El sitemap trae ${urls.length} URLs: fuera de lo esperado, no se manda nada.`);
  process.exit(1);
}

if (probar) {
  for (const url of urls) console.log(url);
  console.log(`\n${urls.length} URLs. Sin --probar se mandan a IndexNow.`);
  process.exit(0);
}

const estado = await avisarIndexNow(urls);
if (estado === 200 || estado === 202) {
  console.log(`IndexNow tomó ${urls.length} URLs (HTTP ${estado}).`);
} else {
  console.error(`IndexNow no tomó el pedido (${estado === null ? 'sin respuesta' : `HTTP ${estado}`}).`);
  process.exit(1);
}
