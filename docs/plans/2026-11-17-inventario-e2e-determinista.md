# Inventario E2E determinista Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hacer reproducible la captura E2E de `/imagenes` sin cambiar el inventario de producción.

**Architecture:** El plugin de inventario conservará el escaneo real como valor por defecto y aceptará una lista fija sólo cuando el runner de `check` construya el sitio para pruebas. La lista usará rutas de imágenes existentes y versionadas. La prueba visual se actualizará contra ese inventario estable.

**Tech Stack:** Node.js, Astro/Vite, pruebas Node, Playwright, fixtures visuales WebP.

---

### Task 1: Inyectar inventario fijo sólo en builds de `check`

**Files:**
- Modify: `cloudflare/scripts/inventario-imagenes.mjs`
- Modify: `cloudflare/astro.config.mjs`
- Modify: `cloudflare/scripts/local.mjs`
- Create: `cloudflare/tests/fixtures/inventario-imagenes-e2e.json`
- Create: `cloudflare/tests/inventario-imagenes.test.mjs`
- Modify: `cloudflare/tests/seguridad.test.mjs`

**Steps:**
1. Escribir pruebas de que el plugin conserva el escaneo completo por defecto, limita el modo E2E a las rutas declaradas y falla si una ruta fija no existe.
2. Ejecutar la suite nueva y confirmar que falla antes de implementar.
3. Agregar un paso `build-e2e` posterior a `paridad` y previo a `e2e`; sólo ese paso de `npm run check` recibe la bandera interna. El build normal y los contratos del inventario completo no reciben la bandera.
4. Hacer que Astro cargue el fixture fijo sólo con esa bandera y que el plugin resuelva cada ruta contra los archivos existentes.
5. Ejecutar las pruebas del plugin y de aislamiento del runner; confirmar que pasan.

### Task 2: Actualizar y validar la referencia visual

**Files:**
- Modify: `cloudflare/tests/fixtures/visuales-corregidas/imagenes-movil.json`
- Modify: `cloudflare/tests/fixtures/visuales-corregidas/imagenes-escritorio.json`
- Replace the corresponding band images under `cloudflare/tests/fixtures/visuales-corregidas/`

**Steps:**
1. Construir con `npm run check` hasta generar `dist/` con el inventario fijo.
2. Capturar `/imagenes` en escritorio y móvil y convertir las capturas al formato de bandas WebP ya usado por las referencias.
3. Ejecutar `node --test tests/e2e.test.mjs`; confirmar que la comparación de `/imagenes` y los recorridos E2E pasan.
4. Ejecutar `npm run check` completo en `cloudflare/` y `git diff --check`.
5. Dejar todos los cambios sin commit ni push, según la instrucción vigente.
