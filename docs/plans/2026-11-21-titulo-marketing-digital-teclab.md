# Título SEO de Marketing Digital de Teclab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Alinear el título SEO de la ficha de Marketing Digital de Teclab con su nombre oficial completo.

**Architecture:** Cambiar únicamente el `title` de la entrada de Marketing Digital en `ESPECIFICOS` dentro de `cloudflare/src/entrega/carrera-seo.ts`. Agregar una fila sintética a la prueba integrada del Worker para solicitar la ficha y comprobar el `<title>` SSR. No tocar la descripción ni la ficha de Cloud Administration.

**Tech Stack:** Astro, TypeScript, Cloudflare Worker, Node.js.

---

### Task 1: Cambiar el título y cubrirlo con una prueba SSR

**Files:**
- Modify: `cloudflare/src/entrega/carrera-seo.ts`
- Modify: `cloudflare/tests/entrega.test.mjs`

**Step 1: Insertar una carrera Teclab sintética en la prueba integrada**

En `sitemap, robots y cabeceras reales en el build compilado`, insertar una fila local de D1:

```sql
INSERT INTO carreras
  (id, nombre, nivel, modalidad, orden, prefix, nombre_corto, duracion, titulo)
VALUES
  (34, 'Marketing Digital', 'Teclab - Gestión', '100% online', 34,
   'Tecnicatura Superior en', 'Marketing Digital', '2 años',
   'Técnico Superior en Marketing Digital')
```

Solicitar `/carreras/tecnicatura-superior-en-marketing-digital` y afirmar que responde 200 y que su `<title>` es `Tecnicatura Superior en Marketing Digital | Teclab`.

**Step 2: Ejecutar la prueba antes del cambio**

Run: `npm --prefix cloudflare run test:entrega`

Expected: la nueva aserción falla porque la página todavía entrega `Tecnicatura en Marketing Digital | Teclab Online`.

**Step 3: Actualizar sólo el override de título**

En la entrada `Tecnicatura Superior en Marketing Digital` de `ESPECIFICOS`, cambiar únicamente `title` a:

```ts
title: 'Tecnicatura Superior en Marketing Digital | Teclab',
```

No modificar su descripción ni los overrides de otras carreras.

**Step 4: Ejecutar build y prueba de entrega**

Run: `npm --prefix cloudflare run build`

Run: `npm --prefix cloudflare run test:entrega`

Expected: ambos comandos finalizan correctamente y la aserción SSR confirma el título acordado.

### Task 2: Revisar y publicar

**Files:**
- Commit sólo: `cloudflare/src/entrega/carrera-seo.ts`
- Commit sólo: `cloudflare/tests/entrega.test.mjs`

**Step 1: Ejecutar controles generales y revisión de secretos**

Run: `npm run check`

Run: `npm run secretos`

Expected: controles generales pasan y la revisión de secretos queda aprobada.

**Step 2: Revisar el diff**

Confirmar que el único cambio de producción es el título de Marketing Digital; no hay cambios en Cloud Administration, descripciones ni `PENDIENTES.md`.

**Step 3: Commit y push**

Crear un commit convencional incluyendo sólo los dos archivos declarados y pushear `main`.

**Step 4: Verificar producción**

Después de que el workflow publique, comprobar HTTP 200 y el nuevo `<title>` de Marketing Digital; confirmar que el título de Cloud Administration permanece igual. La mejora de posiciones se medirá en Search Console tras el rastreo de Google; el cambio no garantiza un aumento.
