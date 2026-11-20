# Plan de implementación: migración gradual de las carreras de Teclab a un dominio propio

> **Para el agente:** habilidad requerida para ejecutar: `executing-plans`, tarea por tarea.
> Este repo se trabaja directo sobre `main`, sin worktree ni PR (ver `AGENTS.md`).

**Objetivo:** mudar, de a una carrera por deploy, las fichas de Teclab de `www.siglo21sur.com/carreras/<slug>` a un dominio propio, conservando el posicionamiento con 301 y sin tocar las fichas de Siglo 21.

**Arquitectura:** un único módulo (`cloudflare/src/entrega/dominio.ts`) decide la URL base según el host y qué slugs ya se migraron. El Worker aplica los 301 de dominio **antes** de la caché de borde, porque `claveDeCache` sólo cachea `www.siglo21sur.com` y el middleware de Astro corre después de esa consulta: poner el redirect sólo en `middleware.ts` dejaría que una copia cacheada sirva la página vieja sin redirigir. El mismo módulo se usa en el middleware para que `npm run dev` se comporte igual. Canónicas, JSON-LD, sitemap, `llms.txt` y markdown dejan de llevar el dominio escrito a mano.

**Stack:** Astro + React sobre Cloudflare Workers, D1, Cache API, Turnstile, wrangler.

**Nombre asumido:** `teclab-lugano.com` (el que se puso de ejemplo). Si se compra otro, reemplazarlo en todo el plan antes de empezar.

**Fuera de alcance:** la landing `/teclab`, `/teclab/inscripcion` y `/teclab/test-vocacional` siguen en siglo21sur.com. Migrarlas es otra tanda. Las carreras de Siglo 21 y las diplomaturas de Identidad no se tocan.

---

### Tarea 0: decidir el lote inicial y la lista de slugs

**Archivos:** ninguno todavía.

**Paso 1:** sacar la lista de carreras de Teclab activas y visibles de la D1 de producción:

```bash
npm run db:d1 -- "SELECT nombre, nivel, activa FROM carreras WHERE lower(nivel) LIKE '%teclab%' ORDER BY nombre;"
```

Si el nivel no distingue la casa, usar el filtro que ya usa el sitio: `esTeclab()` / `esCursoTeclab()` de `components/index/teclab.ts`, aplicado al resultado de `carrerasPublicas(env.DB)`.

**Paso 2:** elegir **una** carrera de poco tráfico para el primer deploy. Anotar su slug exacto (el que produce `carreraToSlug`). Queda registrado en la tabla del final de este plan.

---

### Tarea 1: módulo único de dominio y redirects entre dominios

**Archivos:**
- Crear: `cloudflare/src/entrega/dominio.ts`
- Modificar: `cloudflare/src/entrega/redirects.ts`
- Probar: `cloudflare/tests/dominio-teclab.test.mjs`

**Paso 1: escribir las pruebas que fallan** (`cloudflare/tests/dominio-teclab.test.mjs`):

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_SIGLO21, BASE_TECLAB, canonicoPara, esDominioTeclab,
  redireccionPorDominio, slugMigrado,
} from '../src/entrega/dominio.ts';

test('la base canónica cambia según el host', () => {
  assert.equal(canonicoPara('www.siglo21sur.com'), BASE_SIGLO21);
  assert.equal(canonicoPara('www.teclab-lugano.com'), BASE_TECLAB);
  assert.equal(canonicoPara('TECLAB-LUGANO.COM'), BASE_TECLAB);
  assert.equal(canonicoPara('localhost:4321'), BASE_SIGLO21);
});

test('sólo se considera migrado el slug cargado en la lista', () => {
  assert.equal(slugMigrado('/carreras/curso-de-prueba'), 'curso-de-prueba');
  assert.equal(slugMigrado('/carreras/curso-de-prueba/'), 'curso-de-prueba');
  assert.equal(slugMigrado('/carreras/curso-de-prueba.md'), 'curso-de-prueba');
  assert.equal(slugMigrado('/carreras/carrera-no-migrada'), null);
  assert.equal(slugMigrado('/teclab'), null);
});

test('una ficha migrada va del dominio viejo al nuevo con 301', () => {
  const r = redireccionPorDominio('www.siglo21sur.com', '/carreras/curso-de-prueba');
  assert.deepEqual(r, { destino: `${BASE_TECLAB}/carreras/curso-de-prueba`, estado: 301 });
});

test('el ápice del dominio nuevo va a www con 308', () => {
  const r = redireccionPorDominio('teclab-lugano.com', '/carreras/curso-de-prueba');
  assert.equal(r.estado, 308);
  assert.equal(r.destino, `${BASE_TECLAB}/carreras/curso-de-prueba`);
});

test('el dominio nuevo no sirve páginas ajenas, pero sí APIs y archivos propios', () => {
  assert.equal(redireccionPorDominio('www.teclab-lugano.com', '/contacto').destino, `${BASE_SIGLO21}/contacto`);
  assert.equal(redireccionPorDominio('www.teclab-lugano.com', '/api/formularios'), null);
  assert.equal(redireccionPorDominio('www.teclab-lugano.com', '/sitemap.xml'), null);
  assert.equal(redireccionPorDominio('www.teclab-lugano.com', '/carreras/curso-de-prueba'), null);
});
```

**Paso 2:** correr y confirmar que falla por módulo inexistente:

```bash
cd cloudflare && node --test tests/dominio-teclab.test.mjs
```

**Paso 3: implementar `cloudflare/src/entrega/dominio.ts` completo:**

```ts
// La base de cada dominio y el interruptor de migración viven acá. Ninguna
// otra parte del sitio debe escribir un dominio a mano.

import type { Redireccion } from './redirects.ts';

export const BASE_SIGLO21 = 'https://www.siglo21sur.com';
export const BASE_TECLAB = 'https://www.teclab-lugano.com';

const APEX_TECLAB = 'teclab-lugano.com';

/**
 * Slugs ya publicados en el dominio de Teclab. Se cargan de a uno por deploy:
 * mientras un slug no esté acá, su ficha sigue viviendo en Siglo 21.
 */
export const CARRERAS_MIGRADAS = new Set<string>([
  'curso-de-prueba',
]);

const sinPuerto = (host: string | undefined) =>
  (host ?? '').trim().toLowerCase().replace(/:\d+$/, '');

export function esDominioTeclab(host: string | undefined): boolean {
  const nombre = sinPuerto(host).replace(/^www\./, '');
  return nombre === APEX_TECLAB;
}

export function canonicoPara(host: string | undefined): string {
  return esDominioTeclab(host) ? BASE_TECLAB : BASE_SIGLO21;
}

const FICHA = /^\/carreras\/([^/]+?)(?:\.md)?\/?$/;

/** El slug de una ficha migrada, o null. También cubre su versión markdown. */
export function slugMigrado(ruta: string): string | null {
  const coincidencia = FICHA.exec(ruta);
  if (!coincidencia) return null;
  const slug = coincidencia[1].toLowerCase();
  return CARRERAS_MIGRADAS.has(slug) ? slug : null;
}

// Rutas que el dominio nuevo atiende por su cuenta, aunque no sean fichas.
// Los formularios no pueden redirigirse: un 308 conservaría el POST pero el
// Origin del nuevo dominio no coincide con el del viejo y Turnstile lo rechaza.
const RUTA_LOCAL = /^\/(?:api(?:\/|$)|sitemap\.xml$|llms\.txt$|robots\.txt$|imagenes(?:\/|$)|fuentes(?:\/|$)|planes(?:\/|$)|_astro(?:\/|$)|derivados(?:\/|$)|favicon|.*\.(?:webp|png|jpe?g|svg|gif|ico|woff2?|css|js|txt)$)/;

/**
 * Redirect de dominio. Se aplica en el Worker antes de la caché de borde y en
 * el middleware de Astro (para `npm run dev`). Devuelve null cuando la ruta
 * tiene que resolverse normalmente.
 */
export function redireccionPorDominio(
  host: string | undefined, ruta: string,
): Omit<Redireccion, 'origen'> | null {
  const nombre = sinPuerto(host);

  if (nombre === APEX_TECLAB) return { destino: `${BASE_TECLAB}${ruta}`, estado: 308 };

  const slug = slugMigrado(ruta);
  if (slug && (nombre === 'www.siglo21sur.com' || nombre === 'siglo21sur.com')) {
    return { destino: `${BASE_TECLAB}/carreras/${slug}`, estado: 301 };
  }

  if (esDominioTeclab(nombre) && !slug && !RUTA_LOCAL.test(ruta)) {
    return { destino: `${BASE_SIGLO21}${ruta}`, estado: 308 };
  }
  return null;
}
```

**Paso 4:** correr la prueba y que pase.

**Paso 5:** commitear:

```bash
git add cloudflare/src/entrega/dominio.ts cloudflare/tests/dominio-teclab.test.mjs
git commit -m "feat: módulo de dominio canónico y redirects de migración de Teclab"
```

No tocar `redirects.ts` en esta tarea: el módulo nuevo importa su tipo, y el cableado viene en la Tarea 2.

---

### Tarea 2: cablear los redirects antes de la caché de borde

**Archivos:**
- Modificar: `cloudflare/produccion/worker.ts:41-60`
- Modificar: `cloudflare/src/middleware.ts:10-27`
- Probar: `cloudflare/tests/entrega.test.mjs`, `cloudflare/tests/cache-produccion.test.mjs`

**Paso 1: prueba nueva en `cloudflare/tests/entrega.test.mjs`** (junto a las de `redireccionDeHost`):

```js
test('la ficha migrada redirige antes de consultar la caché', () => {
  const r = redireccionPorDominio('www.siglo21sur.com', '/carreras/curso-de-prueba');
  assert.equal(r.estado, 301);
  assert.equal(r.destino, 'https://www.teclab-lugano.com/carreras/curso-de-prueba');
});
```

**Paso 2:** verificar que falla: `cd cloudflare && node --test tests/entrega.test.mjs`.

**Paso 3: en `cloudflare/produccion/worker.ts`**, importar `redireccionPorDominio` y `ubicacionRedireccion`, e insertar **inmediatamente después de `const url = new URL(request.url);`** (línea 42), antes de `servirAssetR2` y antes de `claveDeCache`:

```ts
const porDominio = redireccionPorDominio(url.hostname, url.pathname);
if (porDominio) {
  return new Response(null, {
    status: porDominio.estado,
    headers: {
      Location: ubicacionRedireccion(porDominio, url.search),
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
```

El bloque existente de `RAIZ` (líneas 46-60) queda como respaldo para el apex viejo; no se rompe nada porque `redireccionPorDominio` ya devuelve null para `www.siglo21sur.com`.

**Paso 4: en `cloudflare/src/middleware.ts`**, importar lo mismo y agregar después de `const pedida = new URL(contexto.request.url);` y antes del `porHost` actual:

```ts
const porDominio = redireccionPorDominio(pedida.hostname, pedida.pathname);
if (porDominio) {
  return new Response(null, {
    status: porDominio.estado,
    headers: { Location: ubicacionRedireccion(porDominio, pedida.search) },
  });
}
```

**Paso 5:** correr `cd cloudflare && node --test tests/entrega.test.mjs tests/cache-produccion.test.mjs`.

**Paso 6:** commitear:

```bash
git add cloudflare/produccion/worker.ts cloudflare/src/middleware.ts cloudflare/tests/entrega.test.mjs
git commit -m "feat: redirigir fichas migradas de Teclab antes de la caché de borde"
```

---

### Tarea 3: canónicas y JSON-LD por host

**Archivos:**
- Modificar: `cloudflare/src/layouts/Sitio.astro:78,89,186`
- Modificar: `cloudflare/src/pages/carreras/[slug].astro:34`
- Modificar: `cloudflare/src/pages/carreras/[slug].md.ts:6,18`
- Modificar: `cloudflare/src/entrega/PaginaCarrera.tsx:25,41,59`
- Probar: `cloudflare/tests/paginas-carreras.test.mjs`, `cloudflare/tests/markdown.test.mjs`

**Paso 1:** agregar pruebas que pidan la canónica del host nuevo en la ficha migrada y la del viejo en una no migrada. Usar el patrón existente de `paginas-carreras.test.mjs`.

**Paso 2:** verificar que fallan.

**Paso 3: reemplazos exactos:**

1. `Sitio.astro`: importar `canonicoPara`; cambiar `const SITIO = 'https://www.siglo21sur.com';` por `const SITIO = canonicoPara(Astro.url.hostname);`. La línea del beacon queda así:
   ```ts
   const beaconAnalytics = /(^|\.)(?:siglo21sur|teclab-lugano)\.com$/.test(Astro.url.hostname) ? BEACON_TOKEN : null;
   ```
2. `carreras/[slug].astro`: importar `canonicoPara`; `const canonical = `https://www.siglo21sur.com${ruta}`;` → `const canonical = `${canonicoPara(Astro.url.hostname)}${ruta}`;`.
3. `carreras/[slug].md.ts`: sacar el import de `BASE` de `sitemap-xml` e importar `canonicoPara`; `const url = `${BASE}/carreras/${carreraToSlug(carrera)}`;` → `const url = `${canonicoPara(Astro.url.hostname)}/carreras/${carreraToSlug(carrera)}`;`.
4. `PaginaCarrera.tsx`: es componente React, no tiene `Astro.url`, así que hay que pasarle la base como prop. Agregar `base: string` a las props del componente y cambiar las tres URLs:
   ```tsx
   const url = `${base}/carreras/${carreraToSlug(carrera)}`;
   // breadcrumb
   { '@type': 'ListItem', position: 1, name: 'Inicio', item: base },
   ```
   y en `carreras/[slug].astro` pasar `<PaginaCarrera ... base={canonicoPara(Astro.url.hostname)} />`.

**Paso 4:** correr las pruebas del área y `npm run build` en `cloudflare/`.

**Paso 5:** commitear:

```bash
git add cloudflare/src/layouts/Sitio.astro cloudflare/src/pages/carreras/ cloudflare/src/entrega/PaginaCarrera.tsx cloudflare/tests/paginas-carreras.test.mjs cloudflare/tests/markdown.test.mjs
git commit -m "feat: canónicas y datos estructurados por dominio en las fichas"
```

---

### Tarea 4: sitemap y llms.txt por host

**Archivos:**
- Modificar: `cloudflare/src/entrega/sitemap-xml.ts:10`
- Modificar: `cloudflare/src/entrega/sitemap.ts:39-40,59-130`
- Modificar: `cloudflare/src/pages/sitemap.xml.ts`, `cloudflare/src/pages/robots.txt.ts`
- Modificar: `cloudflare/src/entrega/llms-txt.ts`, `cloudflare/src/pages/llms.txt.ts`, `cloudflare/src/pages/teclab.md.ts`
- Probar: `cloudflare/tests/markdown.test.mjs`, `cloudflare/tests/llms-txt.test.mjs`, `herramientas/seo-semanal.mjs` (lector, no test)

**Paso 1:** parametrizar la base. En `sitemap-xml.ts` mantener `BASE` como valor por defecto para no romper pruebas, pero hacer que `generarSitemap` reciba la base:

```ts
export function generarSitemap(entradas: EntradaSitemap[], base: string = BASE): string { ... }
```

**Paso 2:** en `sitemap.ts`, aceptar `{ base, soloMigradas }`:

```ts
export function construirSitemap(
  datos: DatosSitemap,
  opciones: { base?: string; soloMigradas?: boolean } = {},
): EntradaSitemap[] {
  const base = opciones.base ?? BASE;
  // en el mapa de carreras:
  //   url: `${base}/carreras/${carreraToSlug(carrera)}`
  //   images: urlImagen(imagen, base)
  // en las páginas fijas: `${base}/...`
  // si opciones.soloMigradas, devolver sólo las fichas cuyo slug esté en
  // CARRERAS_MIGRADAS, con sus imágenes; nada de home, clases de apoyo ni novedades.
}
```

El filtro de `soloMigradas` usa `slugMigrado(`/carreras/${slug}`) !== null` del módulo de dominio, para que haya una sola lista de carreras migradas.

**Paso 3:** `sitemap.xml.ts` pasa el host:

```ts
import { canonicoPara, esDominioTeclab } from '../entrega/dominio.ts';

export async function GET({ url }: { url: URL }) {
  const base = canonicoPara(url.hostname);
  const xml = generarSitemap(
    construirSitemap(await datosSitemap(env.DB), {
      base,
      soloMigradas: esDominioTeclab(url.hostname),
    }),
    base,
  );
  // ...headers iguales
}
```

**Paso 4:** `generarRobots()` (línea 46 de `sitemap-xml.ts`) también lleva `BASE` metido en el texto; darle un parámetro `base = BASE` y pasarlo desde `cloudflare/src/pages/robots.txt.ts` con `canonicoPara(url.hostname)`, para que el `Sitemap:` del `robots.txt` nuevo apunte a su propio sitemap.

**Paso 5:** repetir el criterio en `entrega/llms-txt.ts` (que importa `BASE` de `sitemap-xml.ts` en las líneas 17, 68, 313, 326, 335 y 346), `pages/llms.txt.ts` y `pages/teclab.md.ts`: la base sale de `canonicoPara(host)`; en el dominio nuevo, `llms.txt` sólo lista las fichas migradas. No se escribe texto nuevo: se reutilizan `descripcion`, `titulo`, `modalidad` y `duracion` de la base, como manda `docs/criterios.md`. `datos/llms-txt.ts` no se toca: sólo entrega datos, no URLs.

**Paso 6:** correr `cd cloudflare && node --test tests/llms-txt.test.mjs tests/markdown.test.mjs` y `npm run build`.

**Paso 7:** commitear:

```bash
git add cloudflare/src/entrega/sitemap-xml.ts cloudflare/src/entrega/sitemap.ts cloudflare/src/pages/sitemap.xml.ts cloudflare/src/pages/robots.txt.ts cloudflare/src/entrega/llms-txt.ts cloudflare/src/pages/llms.txt.ts cloudflare/src/pages/teclab.md.ts
git commit -m "feat: sitemap y llms.txt por dominio, con sólas las fichas migradas en Teclab"
```

---

### Tarea 5: alta del dominio en Cloudflare (paso manual del usuario)

**No la ejecuta el agente sin autorización explícita de destino y operación.** Requiere:

1. Comprar `teclab-lugano.com`.
2. Agregar la zona a la cuenta `e4854090127ccb31fb50321d83411613` y apuntar los nameservers a Cloudflare.
3. Dar al token de deploy `Zone:Read` sobre la zona nueva (hoy sólo la tiene sobre `siglo21sur.com`; sin esto el publicador falla).
4. En el widget de Turnstile, habilitar el nuevo hostname si el dashboard pide lista de dominios.
5. Dar de alta el sitio nuevo en Cloudflare Web Analytics y Search Console, y verificarlo.

**Archivos del repo que acompañan:**

- `cloudflare/produccion/wrangler.json`: agregar a `routes` (líneas 67-70):
  ```json
  { "pattern": "www.teclab-lugano.com", "custom_domain": true },
  { "pattern": "teclab-lugano.com", "custom_domain": true }
  ```
  y cambiar `TURNSTILE_EXPECTED_HOSTNAME` por la lista (el verificador ya acepta comas, ver `cloudflare/src/api/turnstile.ts:35`):
  ```json
  "TURNSTILE_EXPECTED_HOSTNAME": "www.siglo21sur.com,www.teclab-lugano.com"
  ```
- `cloudflare/scripts/publicar.mjs:33`: `const DOMINIOS = ['www.siglo21sur.com', 'siglo21sur.com', 'www.teclab-lugano.com', 'teclab-lugano.com'];`
- `cloudflare/tests/publicacion.test.mjs`: actualizar el fixture de rutas y dominios esperados.
- `lib/vigilancia-esperado.ts`: agregar `export const BASE_TECLAB = 'https://www.teclab-lugano.com';` y una `RUTAS_TECLAB` con `/sitemap.xml`, `/llms.txt` y **una** ficha migrada.
- `cloudflare/src/api/vigilancia.ts:27-28`: incluir los dos hosts nuevos en la lista vigilada.
- `docs/variables-de-entorno.md`: anotar el nuevo hostname de Turnstile.

**Verificación:**

```bash
cd cloudflare && node --test tests/publicacion.test.mjs tests/vigilancia.test.mjs
cd cloudflare && npm run publicar          # plan, no publica
cd cloudflare && npm run publicar:ensayo   # build + dry-run
```

**Commit:**

```bash
git add cloudflare/produccion/wrangler.json cloudflare/scripts/publicar.mjs cloudflare/tests/publicacion.test.mjs lib/vigilancia-esperado.ts cloudflare/src/api/vigilancia.ts docs/variables-de-entorno.md
git commit -m "feat: dominio de Teclab en la configuración de producción y la vigilancia"
```

---

### Tarea 6: migrar la primera carrera y verificar

**Archivos:**
- Modificar: `cloudflare/src/entrega/dominio.ts` (agregar el slug real a `CARRERAS_MIGRADAS`)
- Modificar: `cloudflare/tests/dominio-teclab.test.mjs` (cambiar `curso-de-prueba` por el slug real)

**Paso 1:** reemplazar el slug de prueba por el slug elegido en la Tarea 0.

**Paso 2:** correr `cd cloudflare && npm run check`. Acá sí va el control completo: el cambio toca datos, API y enrutado, y `docs/criterios.md` lo pide para ese tipo de cambio.

**Paso 3:** correr `npm run check` en la raíz.

**Paso 4:** commitear y pushear a `main` (la publicación la hace el workflow de GitHub):

```bash
git add cloudflare/src/entrega/dominio.ts cloudflare/tests/dominio-teclab.test.mjs
git commit -m "feat: migrar la primera carrera de Teclab al dominio propio"
git push origin main
```

**Paso 5:** verificación en producción, en este orden:

```bash
npm run smoke
npm run auditar
npm run seo -- --inspeccion=https://www.teclab-lugano.com/carreras/<slug>
```

**Paso 6:** comprobaciones manuales:

- `curl -sI https://www.siglo21sur.com/carreras/<slug>` → `301` y `Location: https://www.teclab-lugano.com/carreras/<slug>`.
- `curl -sI https://www.teclab-lugano.com/carreras/<slug>` → `200`, canónica y JSON-LD con el dominio nuevo.
- `curl -s https://www.teclab-lugano.com/sitemap.xml` → sólo esa ficha.
- Abrir el formulario de esa ficha en el dominio nuevo y mandar una consulta de prueba (Turnstile y correo).
- Search Console → inspección de URL: Google ve el 301 y la canónica nueva. Anotar la fecha; el posicionamiento se estabiliza en semanas.

**Paso 7:** si algo falla, quitar el slug de `CARRERAS_MIGRADAS`, commitear y pushear: la ficha vuelve a servirse en el dominio viejo sin tocar la base. Es el rollback de cada tanda.

---

### Tarea 7: repetir y cerrar

**Paso 1:** para cada carrera siguiente, repetir la Tarea 6. Una carrera por deploy. No poner varias en la misma lista hasta ver la primera estabilizada.

**Paso 2:** después de la última, actualizar `docs/criterios.md` con la decisión (dominio propio de Teclab, qué se migró y qué quedó), `PENDIENTES.md` y `referencias/2026-11-20-dominio-teclab.md` con los links usados (documentación de Cloudflare de custom domains, redirects y Turnstile), como manda `docs/criterios.md`.

**Paso 3:** correr `npm run calidad:web` y `npm run seo` una vez cerrada la migración.

---

## Registro de migraciones

| Carrera (slug) | Fecha de deploy | 301 verificado | Canónica en Search Console |
| --- | --- | --- | --- |
| *(la de la Tarea 0)* | | | |

## Riesgos conocidos

- **Caché de borde:** por eso el 301 va en el Worker antes de `claveDeCache`. Si se pone sólo en el middleware, una copia del dominio viejo puede seguir sirviendo la ficha hasta que caduque el TTL de 300 s.
- **Turnstile:** si el hostname nuevo no se habilita en el widget, los formularios de las fichas migradas fallan aunque el servidor acepte la lista.
- **Doble contenido:** mientras una carrera está en la lista, el dominio viejo debe devolver 301 y el nuevo 200 con su propia canónica. Si los dos devuelven 200, se parte el tráfico.
- **IndexNow:** `herramientas/indexnow.mjs` usa un solo `INDEXNOW_HOST`. Para avisar de las URLs nuevas hace falta la clave publicada en el dominio nuevo y una corrida aparte con ese host.
- **Analítica:** el `CF_RUM_SITE_TAG` actual mide el sitio viejo. Las visitas del dominio nuevo no aparecerán ahí hasta que se cree el sitio nuevo y se defina cómo se reporta (fuera de alcance de este plan; registrar en `PENDIENTES.md`).
