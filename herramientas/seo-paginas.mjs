#!/usr/bin/env node
// Valida el HTML servido de todas las URLs del sitemap, sin ejecutar analytics.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { BASE_PROD } from '../lib/vigilancia-esperado.ts';

const base = (process.argv.find(a => a.startsWith('--base='))?.slice(7) ?? BASE_PROD).replace(/\/$/, '');
const resultados = [];
const browser = await chromium.launch();
const page = await browser.newPage();
const pedir = async url => {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${new URL(url).pathname}`);
  return r;
};
try {
  const xml = await (await pedir(base + '/sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  if (!urls.length) throw new Error('Sitemap vacío');
  const titulos = new Map();
  for (const url of urls) {
    const ruta = new URL(url).pathname;
    try {
      const r = await pedir(base + ruta);
      const html = await r.text();
      const datos = await page.evaluate(html => {
        const d = new DOMParser().parseFromString(html, 'text/html');
        const meta = clave => d.querySelector(`meta[name="${clave}"], meta[property="${clave}"]`)?.getAttribute('content')?.trim();
        const esquemas = [...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(el => { const j = JSON.parse(el.textContent); return Array.isArray(j) ? j : j['@graph'] ?? [j]; });
        return { titulo: d.querySelector('title')?.textContent?.trim(), descripcion: meta('description'), canonical: d.querySelector('link[rel="canonical"]')?.getAttribute('href'), robots: meta('robots'), og: meta('og:image'), twitter: meta('twitter:image'), h1: d.querySelectorAll('h1').length, idioma: d.documentElement.lang, tipos: esquemas.map(e => e['@type']), esquemas: esquemas.length };
      }, html);
      const fallos = [];
      if (!datos.titulo) fallos.push('Falta title');
      if (!datos.descripcion) fallos.push('Falta description');
      if (datos.canonical !== url) fallos.push(`Canónica ${datos.canonical}, esperaba ${url}`);
      if (/noindex/i.test(`${datos.robots} ${r.headers.get('x-robots-tag')}`)) fallos.push('URL del sitemap con noindex');
      if (datos.h1 !== 1) fallos.push(`${datos.h1} encabezados h1`);
      if (!datos.idioma.startsWith('es')) fallos.push('Idioma ausente o incorrecto');
      if (!datos.og || !datos.twitter) fallos.push('Falta imagen social');
      if (!datos.esquemas) fallos.push('Falta JSON-LD');
      if (ruta.startsWith('/carreras/') && (!datos.tipos.includes('Course') || !datos.tipos.includes('BreadcrumbList'))) fallos.push('Falta Course o BreadcrumbList');
      if (titulos.has(datos.titulo)) fallos.push(`Título duplicado con ${titulos.get(datos.titulo)}`);
      titulos.set(datos.titulo, ruta);
      for (const imagen of new Set([datos.og, datos.twitter].filter(Boolean))) {
        const destino = new URL(imagen, url);
        if (destino.origin === new URL(BASE_PROD).origin) destino.host = new URL(base).host;
        if (destino.host === new URL(base).host) destino.protocol = new URL(base).protocol;
        const respuesta = await pedir(destino.href);
        if (!respuesta.headers.get('content-type')?.startsWith('image/')) fallos.push('La imagen social no devuelve una imagen');
        await respuesta.body.cancel();
      }
      resultados.push({ ruta, estado: fallos.length ? 'fallo' : 'ok', fallos });
      console.log(`${fallos.length ? 'FALLA' : 'ok'}: ${ruta}${fallos.length ? ': ' + fallos.join('; ') : ''}`);
    } catch (e) { resultados.push({ ruta, estado: 'fallo', fallos: [e.message] }); console.log(`FALLA: ${ruta}: ${e.message}`); }
  }
} catch (e) { resultados.push({ ruta: '/sitemap.xml', estado: 'fallo', fallos: [e.message] }); }
finally {
  await browser.close(); await mkdir('.agents/reports', { recursive: true });
  await writeFile('.agents/reports/seo-paginas.json', JSON.stringify({ fecha: new Date().toISOString(), base, resultados }, null, 2));
}
console.log(`${resultados.filter(r => r.estado === 'fallo').length} fallos en ${resultados.length} páginas.`);
process.exitCode = resultados.some(r => r.estado === 'fallo') ? 1 : 0;
