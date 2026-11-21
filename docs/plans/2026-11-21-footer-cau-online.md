# Footer CAU Online Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Actualizar la identidad textual y visual del bloque CAU del footer y mostrar 2027 en el copyright.

**Architecture:** Cambiar sólo el componente compartido `SiteFooter`. Reutilizar el logo combinado Siglo 21/Teclab disponible en `public/imagenes/teclab/logo-teclab-siglo21.webp`; conservar la rama de identidad de Teclab.

**Tech Stack:** React, TypeScript, Tailwind CSS, Cloudflare Workers/Astro.

---

### Task 1: Actualizar bloque de marca y copyright

**Files:**
- Modify: `components/footer.tsx`
- Reuse: `public/imagenes/teclab/logo-teclab-siglo21.webp`

**Step 1: Ajustar la marca CAU**

Mostrar el logo combinado y reemplazar el nombre y descripción del CAU por el copy exacto acordado. Mantener el teléfono, redes, navegación y lógica de dirección sin cambios.

**Step 2: Fijar el año**

Cambiar el año dinámico del copyright a 2027, manteniendo el nombre “Teclab” en esa variante.

**Step 3: Verificar**

Ejecutar `npm run lint` y `npm run typecheck`. Intentar `npm run build` desde `cloudflare/` y revisar escritorio y móvil; el entorno actual puede bloquearlo por Node 18, que no satisface el mínimo de Node 22.23.4 de Astro.
