# Fixture determinista de staging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement the plan task-by-task.

**Goal:** Desacoplar las pruebas de staging del snapshot local ignorado para que el check del publicador pase desde un árbol aislado.

**Architecture:** Crear un helper de pruebas que construya un snapshot público mínimo y válido, con sus metadatos requeridos, sin leer `.local`. Usarlo en las suites que hoy dependen de `ultimoSnapshot()` y conservar esa función sin cambios para herramientas operativas.

**Tech Stack:** Node.js, `node:test`, Wrangler, D1 local, Astro/Worker.

---

### Task 1: Localizar y caracterizar las dependencias del snapshot local

**Files:**
- Test: `cloudflare/tests/staging-protegido.test.mjs`
- Test: `cloudflare/tests/staging-correo.test.mjs`
- Test: `cloudflare/tests/staging-local.test.mjs`

**Steps:**
1. Ejecutar `rg -n "ultimoSnapshot|planImportacionRemota" cloudflare/tests` y enumerar cada prueba que lea el snapshot local.
2. Revisar qué rutas, conteos y filas hacen falta para cada suite afectada.
3. Confirmar que no se necesitan datos reales para cubrir esos comportamientos.

### Task 2: Agregar un fixture público mínimo reutilizable

**Files:**
- Create: `cloudflare/tests/helpers/snapshot-publico.mjs`
- Test: `cloudflare/tests/staging-protegido.test.mjs`
- Test: `cloudflare/tests/staging-correo.test.mjs`
- Test: `cloudflare/tests/staging-local.test.mjs`

**Steps:**
1. Escribir una prueba del helper que valide la forma del snapshot con `validarSnapshot`.
2. Ejecutar la prueba dirigida y confirmar que falla porque el helper todavía no existe.
3. Crear el helper con tablas públicas requeridas y filas mínimas válidas para las rutas de staging cubiertas.
4. Preparar los campos SEO/manifest que consumen esas pruebas sin copiar datos locales.
5. Ejecutar la prueba dirigida y confirmar que el snapshot sintético pasa sus validaciones.

### Task 3: Migrar las pruebas desde `.local`

**Files:**
- Modify: `cloudflare/tests/staging-protegido.test.mjs`
- Modify: `cloudflare/tests/staging-correo.test.mjs`
- Modify: `cloudflare/tests/staging-local.test.mjs`

**Steps:**
1. Reemplazar cada llamada de test a `ultimoSnapshot()` por el helper determinista, manteniendo su forma de retorno cuando simplifique los cambios.
2. Sustituir expectativas que dependan del volumen de producción por expectativas del fixture.
3. Ejecutar `node --test tests/staging-protegido.test.mjs tests/staging-correo.test.mjs tests/staging-local.test.mjs` desde `cloudflare/`.
4. Confirmar que las pruebas pasan sin `.local/datos-publicos`.

### Task 4: Verificar el check aislado y reanudar publicación

**Files:**
- Validate: `herramientas/deploy-check.mjs`
- Validate: `cloudflare/scripts/local.mjs`
- Validate: `.gitignore`

**Steps:**
1. Ejecutar el check integral de Cloudflare desde el flujo del publicador, que materializa sólo el árbol Git candidato.
2. Si falla, investigar el primer fallo reproducible; no copiar `.local` al snapshot ni omitir pruebas.
3. Confirmar `git diff --check` y revisar el diff/staging para excluir `.agents/skills/modern-web-guidance/SKILL.md`.
4. Si todos los controles pasan, reanudar el flujo guiado con el mensaje aprobado `feat: reforzar publicación y entrega del sitio`.
5. Confirmar que Actions y el verificador de producción terminan correctamente después del push.

**Restricción de ejecución:** No crear commits intermedios. Sólo el flujo guiado autorizado puede commitear y publicar tras pasar todos los controles.
