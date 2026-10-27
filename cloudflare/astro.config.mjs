import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { pluginInventario } from './scripts/inventario-imagenes.mjs';
import { cabecerasAssets } from './src/entrega/cabeceras.ts';

// El paquete reutiliza módulos puros del sitio (plantilla del mail, mensajes,
// validadores) que importan con el alias `@/` de la raíz. El alias es de
// resolución de build, no un workspace npm: las dependencias siguen aisladas.
const raiz = fileURLToPath(new URL('..', import.meta.url));
const aqui = fileURLToPath(new URL('.', import.meta.url));

// Los assets ya versionados del sitio (35 MB) se sirven desde la carpeta real de
// la raíz en vez de copiarse a este paquete: una sola copia en Git, y `dist/`
// —ignorado— es el único lugar donde se duplican al compilar.
const publico = fileURLToPath(new URL('../public', import.meta.url));

// Cambios mínimos en componentes compartidos: en vez de bifurcarlos se resuelven
// las APIs de Next contra estos reemplazos. Orden importante: las entradas
// exactas van antes del alias general `@/`.
// Workers Assets sirve los archivos sin pasar por el Worker, así que las
// cabeceras globales de Next no llegarían a imágenes, fuentes ni iconos. El
// adaptador ya escribe `_headers` para el cache de `_astro`; acá se genera el
// archivo completo antes de que él lo revise, con la misma CSP/HSTS del
// middleware y la regla inmutable de assets.
const integracionCabecerasAssets = {
  name: 'cabeceras-assets',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await writeFile(new URL('_headers', dir), cabecerasAssets(), 'utf8');
    },
  },
};

const reemplazos = [
  { find: 'next/font/google', replacement: `${aqui}src/entrega/next-font.ts` },
  { find: /^@\/components\/turnstile-widget$/, replacement: `${aqui}src/entrega/TurnstileWidget.tsx` },
  { find: 'next/link', replacement: `${aqui}src/entrega/next-link.tsx` },
  { find: 'next/image', replacement: `${aqui}src/entrega/next-image.tsx` },
  { find: 'next/navigation', replacement: `${aqui}src/entrega/next-navigation.ts` },
  { find: 'next/dynamic', replacement: `${aqui}src/entrega/next-dynamic.tsx` },
  { find: '@next/third-parties/google', replacement: `${aqui}src/entrega/next-third-parties.ts` },
  { find: '@vercel/analytics', replacement: `${aqui}src/entrega/vercel-analytics.ts` },
  { find: '@', replacement: raiz },
];

export default defineConfig({
  output: 'server',
  publicDir: publico,
  adapter: cloudflare({ imageService: 'passthrough', remoteBindings: false }),
  integrations: [react(), integracionCabecerasAssets],
  session: false,
  devToolbar: { enabled: false },
  // Las fuentes pequeñas deben salir como assets del mismo origen: la CSP no
  // autoriza data: en font-src y no se debilita para aceptar el inline de Vite.
  vite: {
    envDir: false,
    build: { assetsInlineLimit: 0 },
    // Los componentes compartidos preguntan por `process.env.NEXT_PUBLIC_GA_ID`.
    // En el navegador `process` no existe y la expresión rompía el clic antes de
    // llegar a la telemetría propia. Se resuelve a `undefined` en el build: sin
    // configuración explícita no hay Google ni error de referencia.
    define: { 'process.env.NEXT_PUBLIC_GA_ID': 'undefined' },
    resolve: { alias: reemplazos },
    plugins: [pluginInventario(`${publico}/imagenes`)],
  },
});
