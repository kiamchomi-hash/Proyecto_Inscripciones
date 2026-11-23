import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { pluginInventario } from './scripts/inventario-imagenes.mjs';
import { cabecerasAssets } from './src/entrega/cabeceras.ts';
import { generar as generarDerivadas } from '../herramientas/derivar-imagenes.mjs';

// El paquete reutiliza módulos puros del sitio (plantilla del mail, mensajes,
// validadores) que importan con el alias `@/` de la raíz. El alias es de
// resolución de build, no un workspace npm: las dependencias siguen aisladas.
const raiz = fileURLToPath(new URL('..', import.meta.url));
const aqui = fileURLToPath(new URL('.', import.meta.url));

// Los assets ya versionados del sitio (35 MB) se sirven desde la carpeta real de
// la raíz en vez de copiarse a este paquete: una sola copia en Git, y `dist/`
// —ignorado— es el único lugar donde se duplican al compilar.
const publico = fileURLToPath(new URL('../public', import.meta.url));
const rutasImagenesE2E = process.env.CAU_E2E_INVENTARIO === '1'
  ? JSON.parse(readFileSync(new URL('./tests/fixtures/inventario-imagenes-e2e.json', import.meta.url), 'utf8'))
  : undefined;

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

// Las fotos con derivados (`/derivados/*`) se generan antes de compilar y antes
// de levantar el servidor local: si faltan, el `srcset` apuntaría a archivos que
// no existen. Es idempotente: con el manifiesto al día no reescribe nada.
const integracionDerivadas = {
  name: 'derivadas-imagenes',
  hooks: {
    'astro:build:start': () => generarDerivadas(),
    'astro:server:start': () => generarDerivadas(),
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
  { find: /^@\/lib\/analytics-destino$/, replacement: `${aqui}src/entrega/analitica.ts` },
  { find: '@', replacement: raiz },
];

export default defineConfig({
  output: 'server',
  publicDir: publico,
  adapter: cloudflare({ imageService: 'passthrough', remoteBindings: false }),
  integrations: [react(), integracionCabecerasAssets, integracionDerivadas],
  session: false,
  devToolbar: { enabled: false },
  // CSP con hashes generados en el build: los scripts inline de Astro y de las
  // islas se autorizan por su hash, no con 'unsafe-inline'. La cabecera HTTP no
  // puede llevar esos hashes (se decide antes de renderizar), así que en las
  // páginas HTML rige este `<meta>` y la cabecera aporta frame-ancestors/XFO.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob: https://i.ytimg.com https://images.unsplash.com",
        "font-src 'self'",
        "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
        "frame-src https://challenges.cloudflare.com https://www.google.com https://www.youtube-nocookie.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ],
      scriptDirective: {
        resources: [
          "'self'",
          'https://challenges.cloudflare.com',
          'https://static.cloudflareinsights.com',
        ],
        // Astro no hashea los scripts `is:inline`; el de Sitio.astro (marca del
        // modal al volver de la home) se autoriza por este hash. Cambiar ese
        // script exige recalcularlo; el smoke de navegador lo detecta.
        hashes: ['sha256-DBHjmpHfs7IBQWm6uaIhjr5xOCXIW9Eno/AeJfzOOAo='],
      },
      styleDirective: {
        resources: [
          "'self'",
          // React pinta estilos por atributo; se permiten ahí, no en <style>.
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
    },
  },
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
    plugins: [pluginInventario(`${publico}/imagenes`, rutasImagenesE2E)],
  },
});
