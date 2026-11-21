# Desindexar Marketing y Publicidad Digital de Siglo 21 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Excluir de los resultados de búsqueda la ficha de Siglo 21 “Tecnicatura en Marketing y Publicidad Digital” sin retirar su URL ni afectar la ficha de Teclab.

**Architecture:** Aplicar `noindex, follow` sólo a `/carreras/tecnicatura-en-marketing-y-publicidad-digital` y excluir esa URL del sitemap. Mantener el contenido, canonical, enlaces y WhatsApp de la página intactos.

**Tech Stack:** Astro, TypeScript, Worker Cloudflare, Node.js.

---

### Task 1: Aplicar noindex sólo a la ficha acordada

**Files:**
- Modify: `cloudflare/src/pages/carreras/[slug].astro`
- Verify: `cloudflare/src/layouts/Sitio.astro`

**Step 1: Confirmar el punto de emisión**

El layout ya admite `robots` y emite `<meta name="robots">` cuando recibe el prop.

**Step 2: Centralizar la ruta excluida**

Declarar la ruta no indexable en `cloudflare/src/entrega/noindex.ts`; usarla para emitir `noindex, follow` en la ficha y excluirla del sitemap. Las demás fichas no cambian.

**Step 3: Verificar**

Ejecutar `npm run build` desde `cloudflare/` y `npm run test:entrega`. Confirmar en el HTML que la ficha objetivo expone `noindex, follow`, dos fichas de control no tienen esa meta, y la URL excluida no aparece en el sitemap.

**Step 4: Revisar el alcance**

Confirmar que no cambian `robots.txt`, las canónicas, los enlaces ni el contenido de WhatsApp. Search Console actualizará el estado cuando vuelva a rastrear la URL.
