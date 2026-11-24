# Campañas de Instagram para inscripciones Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Medir con un código cada publicación promocionada desde Instagram, registrando el clic en D1 y mostrándolo en `npm run leads`, sin pixel ni Business Manager.

**Architecture:** Un archivo de configuración declara los códigos y sus destinos permitidos (`/teclab`, un `/carreras/<slug>` o el WhatsApp de la sede). Una ruta `/ir/<codigo>` valida el código, suma el clic a una tabla nueva de D1 y redirige al destino. Un formateador puro arma la sección nueva del informe de leads. La medición no toca `consultas`, precios ni formularios.

**Tech Stack:** Astro 7 endpoints en Cloudflare Workers, D1 con migraciones SQL, Node `node:test`, `wrangler d1 execute --local` para reparar la base local, `npm run leads`.

---

### Task 1: Códigos y destinos permitidos

**Files:**
- Create: `lib/campanas.ts`
- Test: `tests/campanas.test.mjs`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMPANAS, campanaValida, destinoCampana, textoCampana,
} from '../lib/campanas.ts';

test('sólo los códigos declarados son válidos', () => {
  assert.equal(campanaValida('IG-01'), true);
  assert.equal(campanaValida('ig-01'), true);      // se normaliza a mayúsculas
  assert.equal(campanaValida('IG-99'), false);
  assert.equal(campanaValida('javascript:alert(1)'), false);
  assert.equal(campanaValida(''), false);
});

test('los destinos son del sitio o el WhatsApp de la sede, nunca una URL libre', () => {
  assert.equal(destinoCampana('IG-01'), '/teclab');
  assert.match(destinoCampana('IG-02'), /^\/carreras\/[a-z0-9-]+$/);
  assert.match(destinoCampana('IG-03'), /^https:\/\/wa\.me\/5491132973801\?text=/);
  assert.ok(Object.values(CAMPANAS).every(c => !String(c.destino).includes('javascript:')));
});

test('el texto del WhatsApp lleva el código como rótulo, no como propaganda', () => {
  assert.match(textoCampana('IG-03'), /IG-03/);
  assert.match(textoCampana('IG-03'), /Instagram/);
});
```

Ajustar los códigos del fixture a los que se declaren en el paso 3.

**Step 2: Run test to verify it fails**

Run: `node --test tests/campanas.test.mjs`
Expected: `Cannot find module ../lib/campanas.ts`.

**Step 3: Write minimal implementation**

```ts
// lib/campanas.ts
import { numeroWhatsAppDe } from './whatsapp.ts';

/**
 * Códigos de las publicaciones promocionadas desde Instagram. Una sola
 * publicación activa por vez; el código es un rótulo interno de seguimiento,
 * nunca texto publicitario. El destino se declara acá: el visitante no puede
 * poner una URL propia en `/ir/<codigo>`.
 */
export const CAMPANAS = {
  'IG-01': { destino: '/teclab', mensaje: null },
  'IG-02': { destino: '/carreras/tecnicatura-superior-en-programacion', mensaje: null },
  'IG-03': {
    destino: 'whatsapp',
    mensaje: 'Hola, vengo de Instagram [IG-03]',
  },
} as const;

export type CodigoCampana = keyof typeof CAMPANAS;
const CODIGO = /^[A-Z0-9]{1,20}$/;
const RUTA = /^\/(?:teclab|carreras\/[a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function codigoCampana(valor: unknown): CodigoCampana | null {
  if (typeof valor !== 'string') return null;
  const normalizado = valor.trim().toUpperCase();
  return CODIGO.test(normalizado) && Object.hasOwn(CAMPANAS, normalizado)
    ? normalizado as CodigoCampana : null;
}

export function campanaValida(valor: unknown): boolean {
  return codigoCampana(valor) !== null;
}

export function destinoCampana(valor: string): string | null {
  const codigo = codigoCampana(valor);
  if (!codigo) return null;
  const { destino, mensaje } = CAMPANAS[codigo];
  if (destino === 'whatsapp') {
    return `https://wa.me/${numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(mensaje)}`;
  }
  return RUTA.test(destino) ? destino : null;
}

export function textoCampana(valor: string): string | null {
  const codigo = codigoCampana(valor);
  if (!codigo) return null;
  const { mensaje } = CAMPANAS[codigo];
  return mensaje ?? null;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/campanas.test.mjs`
Expected: 3 tests pass.

**Step 5: Commit**

```bash
git add lib/campanas.ts tests/campanas.test.mjs
git commit -m "feat(campanas): códigos y destinos permitidos de Instagram"
```

---

### Task 2: Migración D1 de clics

**Files:**
- Create: `cloudflare/migrations/0017_campanas_clics.sql`
- Test: `cloudflare/tests/campanas.test.mjs`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from './helpers/d1.mjs';

test('campanas_clics agrega por día, código, destino y dispositivo', async t => {
  const { db } = await crearD1(t);
  const sql = `INSERT INTO campanas_clics(fecha, codigo, destino, movil, veces)
    VALUES (?1, ?2, ?3, ?4, 1)
    ON CONFLICT (fecha, codigo, destino, movil) DO UPDATE SET veces = veces + 1`;
  await db.prepare(sql).bind('2026-11-23', 'IG-01', '/teclab', 0).run();
  await db.prepare(sql).bind('2026-11-23', 'IG-01', '/teclab', 0).run();
  assert.equal(await db.prepare('SELECT veces FROM campanas_clics').first('veces'), 2);
  await assert.rejects(db.prepare(sql).bind('2026-11-23', 'IG-01', 'https://mal.example', 0).run());
  await assert.rejects(db.prepare(sql).bind('2026-11-23', 'IG-01', '/teclab', 2).run());
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/campanas.test.mjs` desde `cloudflare/`.
Expected: `no such table: campanas_clics`.

**Step 3: Write minimal implementation**

```sql
-- Clics en las direcciones cortas de las campañas de Instagram. Agregado por
-- día, código, destino y dispositivo: ni mail, teléfono ni filas por visita.
CREATE TABLE campanas_clics (
  fecha TEXT NOT NULL CHECK (length(fecha) = 10 AND fecha IS date(fecha, '+0 days')),
  codigo TEXT NOT NULL CHECK (length(codigo) BETWEEN 1 AND 20 AND codigo = upper(codigo)),
  destino TEXT NOT NULL CHECK (length(destino) BETWEEN 1 AND 160),
  movil INTEGER NOT NULL CHECK (movil IN (0, 1)),
  veces INTEGER NOT NULL DEFAULT 0 CHECK (veces BETWEEN 0 AND 2147483647),
  PRIMARY KEY (fecha, codigo, destino, movil)
) STRICT;
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/campanas.test.mjs` desde `cloudflare/`.
Expected: 1 test pass.

**Step 5: Apply the migration to the local D1**

```bash
cd cloudflare
node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local
```

Expected: `0017_campanas_clics.sql` applied.

**Step 6: Commit**

```bash
git add cloudflare/migrations/0017_campanas_clics.sql cloudflare/tests/campanas.test.mjs
git commit -m "feat(db): tabla de clics de campañas de Instagram"
```

---

### Task 3: Registro con cupo por IP

**Files:**
- Modify: `cloudflare/src/datos/control.ts` (agregar después de `consumirCupoAlerta`)
- Create: `cloudflare/src/datos/registrar-campana.ts`
- Test: `cloudflare/tests/campanas.test.mjs`

**Step 1: Write the failing test**

```js
test('el registro agrega y respeta el cupo por IP', async t => {
  const { db } = await crearD1(t);
  const registrar = (await import('../src/datos/registrar-campana.ts')).registrarClicCampana;
  const ip = '198.51.100.77';
  assert.equal(await registrar(db, 'IG-01', '/teclab', ip, 0), true);
  assert.equal(await registrar(db, 'IG-01', '/teclab', ip, 0), true);
  assert.equal(await db.prepare('SELECT veces FROM campanas_clics').first('veces'), 2);
  assert.equal(await registrar(db, 'IG-99', '/teclab', ip, 0), false);
  assert.equal(await registrar(db, 'IG-01', 'https://mal.example', ip, 0), false);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/campanas.test.mjs` desde `cloudflare/`.
Expected: `Cannot find module ../src/datos/registrar-campana.ts`.

**Step 3: Write minimal implementation**

En `cloudflare/src/datos/control.ts`:

```ts
const CAMPANAS = /^[A-Z0-9]{1,20}$/;
export async function consumirCupoCampana(db: D1Database, codigo: string, ip: string) {
  if (!CAMPANAS.test(codigo) || typeof ip !== 'string') throw new TypeError('Campaña o IP inválida.');
  return comprobarCupo(db, await claveHash(`campana:${codigo}`, ip), 20, 600);
}
```

En `cloudflare/src/datos/registrar-campana.ts`:

```ts
import { campanaValida, destinoCampana } from '../../../lib/campanas.ts';
import { consumirCupoCampana } from './control.ts';
import { fechaClicksDesdeUTC } from './control.ts';
import { leerRelojBase } from './reloj.ts';

export const SQL_CLIC_CAMPANA = `
  INSERT INTO campanas_clics(fecha, codigo, destino, movil, veces) VALUES (?1, ?2, ?3, ?4, 1)
  ON CONFLICT (fecha, codigo, destino, movil) DO UPDATE SET veces = campanas_clics.veces + 1`;

/** Devuelve false si el código no existe o la IP agotó el cupo; nunca lanza. */
export async function registrarClicCampana(
  db: D1Database, codigo: string, ip: string, movil: number,
): Promise<boolean> {
  if (!campanaValida(codigo) || (movil !== 0 && movil !== 1)) return false;
  const destino = destinoCampana(codigo);
  if (!destino) return false;
  if (!await consumirCupoCampana(db, codigo, ip)) return false;
  const fecha = fechaClicksDesdeUTC(await leerRelojBase(db));
  await db.prepare(SQL_CLIC_CAMPANA).bind(fecha, codigo.toUpperCase(), destino, movil).run();
  return true;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/campanas.test.mjs` desde `cloudflare/`.
Expected: 2 tests pass.

**Step 5: Commit**

```bash
git add cloudflare/src/datos/control.ts cloudflare/src/datos/registrar-campana.ts cloudflare/tests/campanas.test.mjs
git commit -m "feat(campanas): registrar clics con cupo por IP"
```

---

### Task 4: Ruta `/ir/<codigo>`

**Files:**
- Create: `cloudflare/src/pages/ir/[codigo].ts`
- Modify: `cloudflare/src/entrega/cabeceras.ts:42-45`
- Test: `cloudflare/tests/campanas.test.mjs`

**Step 1: Write the failing test**

```js
test('la ruta noindex no entra en robots y noindex de cabeceras', async () => {
  const { robotsDeRuta } = await import('../src/entrega/cabeceras.ts');
  assert.equal(robotsDeRuta('/ir/IG-01', 302), 'noindex, follow');
  assert.equal(robotsDeRuta('/ir/IG-99', 404), 'noindex, follow');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/campanas.test.mjs` desde `cloudflare/`.
Expected: `assert.equal(actual: null, expected: 'noindex, follow')`.

**Step 3: Write minimal implementation**

En `cloudflare/src/entrega/cabeceras.ts`:

```ts
const IR = /^\/ir(?:\/|$)/;
// dentro de robotsDeRuta, antes del return final:
  if (IR.test(ruta)) return 'noindex, follow';
```

En `cloudflare/src/pages/ir/[codigo].ts`:

```ts
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { destinoCampana } from '../../../lib/campanas.ts';
import { ipConfiable } from '../../api/ip.ts';
import { registrarClicCampana } from '../../datos/registrar-campana.ts';

/** Dirección corta de una publicación promocionada: cuenta y redirige. */
export const GET: APIRoute = async (contexto) => {
  const codigo = contexto.params.codigo ?? '';
  const destino = destinoCampana(codigo);
  if (!destino) {
    return new Response(null, {
      status: 404,
      headers: { 'X-Robots-Tag': 'noindex, follow', 'Cache-Control': 'no-store' },
    });
  }
  const movil = contexto.request.headers.get('sec-ch-ua-mobile') === '?1' ? 1 : 0;
  try {
    await registrarClicCampana(env.DB, codigo, ipConfiable(contexto.request), movil);
  } catch {
    // La medición nunca rompe la campaña: si la base falla, se redirige igual.
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: destino,
      'X-Robots-Tag': 'noindex, follow',
      'Cache-Control': 'no-store',
    },
  });
};
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/campanas.test.mjs` desde `cloudflare/`.
Expected: 3 tests pass.

**Step 5: Verificación manual en preview**

```bash
cd cloudflare
npm run build
npm run preview   # en segundo plano, puerto 4329
curl -sI http://127.0.0.1:4329/ir/IG-01 | rg -i 'HTTP/|location|x-robots|cache-control'
curl -sI http://127.0.0.1:4329/ir/IG-99 | rg -i 'HTTP/|x-robots'
```

Expected: el primero devuelve 302 con `Location: /teclab`, `noindex, follow` y `no-store`; el segundo, 404 con `noindex, follow`.

**Step 6: Commit**

```bash
git add cloudflare/src/pages/ir/'[codigo].ts' cloudflare/src/entrega/cabeceras.ts cloudflare/tests/campanas.test.mjs
git commit -m "feat(campanas): ruta /ir/<codigo> que cuenta y redirige"
```

---

### Task 5: Sección en `npm run leads`

**Files:**
- Create: `lib/informes/campanas.ts`
- Create: `tests/informe-campanas.test.mjs`
- Modify: `herramientas/leads.mjs` (lectura y sección)

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { lineasCampanas } from '../lib/informes/campanas.ts';

test('el informe muestra clics por código y avisa si no hay datos', () => {
  assert.equal(lineasCampanas([]), '  Ningún clic de campaña en la ventana.');
  const texto = lineasCampanas([{ codigo: 'IG-01', destino: '/teclab', veces: 7 }]);
  assert.match(texto, /IG-01/);
  assert.match(texto, /7/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/informe-campanas.test.mjs`
Expected: `Cannot find module ../lib/informes/campanas.ts`.

**Step 3: Write minimal implementation**

```ts
// lib/informes/campanas.ts
export interface FilaCampana { codigo: string; destino: string; veces: number }

export function lineasCampanas(filas: FilaCampana[]): string {
  if (filas.length === 0) return '  Ningún clic de campaña en la ventana.';
  const lineas = filas.map(f =>
    `    ${f.codigo.padEnd(8)}${String(f.veces).padStart(6)}  ${f.destino}`);
  return [`    ${'código'.padEnd(8)}${'clics'.padStart(6)}  destino`, ...lineas].join('\n');
}
```

En `herramientas/leads.mjs`, junto a las otras lecturas:

```js
async function leerCampanas() {
  return consultar(`SELECT codigo, destino, sum(veces) AS veces
    FROM campanas_clics
    WHERE fecha BETWEEN '${DESDE}' AND '${HASTA}'
    GROUP BY codigo, destino ORDER BY codigo`);
}
```

Agregar `leerCampanas().catch(e => e)` al `Promise.all`, y una sección:

```js
titulo('Campañas de Instagram', 'D1, en vivo: una publicación por código');
if (campanas instanceof Error) noDisponible(campanas);
else console.log(lineasCampanas(campanas));
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/informe-campanas.test.mjs`
Expected: 1 test pass.

**Step 5: Verificación manual**

```bash
npm run leads -- --dias=7 | rg -A6 'Campañas de Instagram'
```

Expected: la sección aparece. Si la migración local no está aplicada, dice `no disponible` y el resto del informe sigue igual.

**Step 6: Commit**

```bash
git add lib/informes/campanas.ts tests/informe-campanas.test.mjs herramientas/leads.mjs
git commit -m "feat(leads): sección de clics de campañas de Instagram"
```

---

### Task 6: Documentación de operación

**Files:**
- Modify: `docs/herramientas.md`
- Modify: `docs/rutinas.md`
- Test: ninguno (documentación)

**Step 1: Agregar la rutina**

En `docs/rutinas.md`, bajo control de leads:

```md
- [ ] **Controlar campañas de Instagram.** Antes de activar una publicación, darle un código en `lib/campanas.ts` y apuntar el botón a `/ir/<codigo>`. Usar una sola publicación por ventana de 3 a 5 días. Leer `npm run leads` y decidir con clics y consultas, no con «me gusta». Pausar una antes de activar otra.
```

En `docs/herramientas.md`, ampliar la descripción de `npm run leads` con una línea:

```md
También muestra los clics de las campañas de Instagram por código (`campanas_clics`), una publicación por código.
```

**Step 2: Verificar**

```bash
rg -n 'Campañas de Instagram' docs/rutinas.md docs/herramientas.md
```

Expected: dos coincidencias.

**Step 3: Commit**

```bash
git add docs/rutinas.md docs/herramientas.md
git commit -m "docs: rutina de campañas de Instagram"
```

---

## Notas para quien ejecuta

- No se escribe texto publicitario: los códigos y el mensaje del WhatsApp son rótulos de seguimiento.
- La zona, la edad y los intereses los define el usuario en la app de Instagram; no se guardan en el repo.
- La migración `0017` se aplica a producción aparte, con autorización. Antes de eso, la ruta sigue redirigiendo y `npm run leads` marca la sección como no disponible.
- No tocar `consultas`, `precios_privados` ni los formularios: el test A/B de descuentos se retiró y no se va a reintroducir acá.
