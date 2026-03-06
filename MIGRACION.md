# Plan de Migración — CAU Villa Lugano

## Estado de cada tecnología

### Fase 1 — Base COMPLETADA
npm + package.json — Hecho
Git — Ya existía
Tailwind CSS (local) — Hecho (v4 + @tailwindcss/postcss)

### Fase 2 — Lenguaje COMPLETADA
TypeScript — Hecho
Node.js + Express — Hecho (server legacy en src/server.ts)
Axios — Hecho
Zod — Hecho (schemas en src/schemas.ts)
Pico.css — Excluido por decisión

### Fase 3 — Framework EN PROGRESO
React + Next.js — Parcial, estructura base lista
Navbar componente — Hecho (components/navbar.tsx)
Novedades (10 HTML → 1 ruta dinámica) — Hecho (app/novedades/[page])
FAQ — Hecho (app/faq + components/faq-page.tsx)
Contacto — Hecho (placeholder "en construcción")
Sobre Nosotros — Hecho (placeholder "en construcción")
index.html (catálogo carreras) — Pendiente, la más compleja
clases-apoyo.html — Pendiente
Zustand — Pendiente, requiere React completo

### Fase 4 — UI (pendiente)
daisyUI — Pendiente, plugin Tailwind, reemplazar clases custom
shadcn/ui — Pendiente, componentes copy-paste (forms, cards, botones)

### Fase 5 — Backend (pendiente)
MongoDB — Pendiente, mover JSONs a BD
PostgreSQL — Alternativa relacional a MongoDB

### Fase 6 — Extras (pendiente)
Stagehand — Pendiente, testing automatizado
Tauri — Pendiente, app de escritorio

## Archivos HTML restantes (sin migrar a Next.js)
index.html — catálogo de carreras, buscador fuzzy, calculadora, OCR, drag-and-drop
clases-apoyo.html — panel institucional con sidebar, carrusel, calendario

## Archivos HTML ya eliminados
contactos.html, sobre-nosotros.html, faq.html
novedades.html, novedades2.html … novedades10.html
