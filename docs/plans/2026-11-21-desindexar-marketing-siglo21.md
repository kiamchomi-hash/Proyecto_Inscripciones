# Desindexar Marketing y Publicidad Digital de Siglo 21 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Excluir de los resultados de búsqueda la ficha de Siglo 21 “Tecnicatura en Marketing y Publicidad Digital” sin retirar su URL ni afectar la ficha de Teclab.

**Architecture:** Pasar la directiva `noindex, follow` al layout compartido sólo cuando la ruta de la ficha coincida exactamente con `/carreras/tecnicatura-en-marketing-y-publicidad-digital`. Mantener el contenido, canonical, enlaces y WhatsApp de la página intactos.

**Tech Stack:** Astro, TypeScript, Worker Cloudflare, Node.js.

---

### Task 1: Aplicar noindex sólo a la ficha acordada

**Files:**
- Modify: `cloudflare/src/pages/carreras/[slug].astro`
- Verify: `cloudflare/src/layouts/Sitio.astro`

**Step 1: Confirmar el punto de emisión**

El layout ya admite `robots` y emite `<meta name="robots">` cuando recibe el prop.

**Step 2: Pasar la directiva por coincidencia exacta de ruta**

En la llamada a `<Sitio>` de la ruta dinámica, establecer `robots="noindex, follow"` sólo para `/carreras/tecnicatura-en-marketing-y-publicidad-digital`; para las demás fichas, dejar el prop sin definir.

**Step 3: Verificar**

Ejecutar `npm run build` desde `cloudflare/`. Inspeccionar el HTML servido de la ficha objetivo y confirmar `noindex, follow`; revisar una ficha de Teclab y otra de Siglo 21 para confirmar que conservan la directiva actual y siguen disponibles.

**Step 4: Revisar el alcance**

Confirmar que no cambian `robots.txt`, el sitemap, las canónicas, los enlaces ni el contenido de WhatsApp. Search Console actualizará el estado cuando vuelva a rastrear la URL.
