# Desindexar tres carreras de Siglo 21 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Excluir de los resultados y del sitemap tres fichas de Siglo 21 que se solapan con carreras de Teclab, sin retirar sus páginas.

**Architecture:** Ampliar la lista central existente en `cloudflare/src/entrega/noindex.ts`. La ruta dinámica de carreras ya convierte esa lista en meta robots `noindex, follow`, y el generador del sitemap ya omite esas mismas rutas; no duplicar reglas en los consumidores. Extender la prueba de entrega para verificar la respuesta SSR y el sitemap.

**Tech Stack:** Astro, TypeScript, Cloudflare Worker, Node.js.

---

### Task 1: Ampliar la lista de fichas no indexables

**Files:**
- Modify: `cloudflare/src/entrega/noindex.ts`

**Step 1: Agregar las tres rutas acordadas**

Agregar a `CARRERAS_NO_INDEXADAS`, sin modificar la ruta existente:

```ts
'/carreras/tecnicatura-en-relaciones-laborales',
'/carreras/tecnicatura-en-gestion-contable-e-impositiva',
'/carreras/tecnicatura-en-redes-informaticas-y-telecomunicaciones',
```

**Step 2: Revisar los slugs contra el catálogo**

Comprobar que los nombres y slugs salen de `carreraToSlug` para las tres carreras de Siglo 21; no cambiar las páginas de Teclab.

### Task 2: Verificar respuesta y sitemap

**Files:**
- Modify: `cloudflare/tests/entrega.test.mjs`

**Step 1: Agregar filas de prueba de las tres fichas**

En el escenario de entrega, insertar las carreras necesarias en D1 y solicitar cada ficha. Afirmar HTTP 200 y `meta name="robots"` con contenido `noindex, follow`.

**Step 2: Comprobar las exclusiones del sitemap**

Solicitar `/sitemap.xml` en el mismo escenario y afirmar que ninguna de las tres URL aparece.

**Step 3: Confirmar que fichas de control no cambian**

Conservar las aserciones existentes para una ficha Teclab y una ficha Siglo 21 que no estén en la lista; deben continuar sin la meta `noindex`.

**Step 4: Ejecutar la prueba de entrega**

Run: `npm --prefix cloudflare run test:entrega`

Expected: todas las pruebas de entrega pasan, incluida la SSR de las fichas y la exclusión del sitemap.

**Step 5: Ejecutar build**

Run: `npm --prefix cloudflare run build`

Expected: build del Worker finaliza correctamente.

### Task 3: Revisar y publicar

**Files:**
- Commit sólo: `cloudflare/src/entrega/noindex.ts`
- Commit sólo: `cloudflare/tests/entrega.test.mjs`

**Step 1: Revisar el diff**

Confirmar que sólo se agregaron las tres rutas y las pruebas correspondientes, sin cambios en `PENDIENTES.md` ni otros archivos.

**Step 2: Revisar secretos y whitespace**

Run: `npm run secretos`

Run: `git diff --check`

Expected: revisión de secretos aprobada y sin errores de whitespace.

**Step 3: Ejecutar `npm run check` de la raíz**

Expected: lint, typecheck y pruebas pasan. Si aparece un fallo ambiental, documentar el error exacto y no atribuirlo a este cambio sin evidencia.

**Step 4: Commit y push**

Crear un commit convencional con sólo los dos archivos declarados y pushear `main`, que activa las verificaciones y publicación de Cloudflare.

**Step 5: Verificar producción**

Después de que el workflow de GitHub Actions publique correctamente, confirmar que las tres rutas responden 200 con `noindex, follow`, ya no aparecen en el sitemap, y correr `npm run smoke -- --rapido`.
