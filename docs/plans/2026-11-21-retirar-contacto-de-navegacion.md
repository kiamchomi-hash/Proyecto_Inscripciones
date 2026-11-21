# Retirar Contacto de la navegación Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Quitar el enlace a `/contacto` del navbar y del footer sin retirar ni desindexar la página.

**Architecture:** Editar las listas de enlaces declaradas en los componentes compartidos. La página, sus metadatos, sus rutas del sitemap y su contenido quedan intactos.

**Tech Stack:** TypeScript, React, Astro/Cloudflare Worker.

---

### Task 1: Retirar enlaces de navegación

**Files:**
- Modify: `components/navbar.tsx` — quitar la entrada `/contacto` de `NAV_LINKS`.
- Modify: `components/footer.tsx` — quitar la entrada `/contacto` de `ENLACES`.

**Step 1: Aplicar el cambio mínimo**

Eliminar sólo esas dos entradas; no modificar el resto de enlaces ni la página de contacto.

**Step 2: Verificar**

Ejecutar `npm run check` desde la raíz y `npm run build` desde `cloudflare/`. Comprobar en local que los menús ya no enlazan a contacto y que `/contacto` responde correctamente.
