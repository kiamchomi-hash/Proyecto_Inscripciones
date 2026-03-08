# Migración — 404.html → app/not-found.tsx

Estado: MIGRADO

Archivos: app/not-found.tsx
HTML original: migracion_pendiente/404.html

---

## Tecnologías por fase

### Fase 1 — Base
Tailwind CSS                       ✅  Utilities, clamp() para tipografía responsive

### Fase 2 — Lenguaje
TypeScript                         ✅  Archivo .tsx
Axios                              ✅  No requiere (página estática)
Zod                                ✅  No requiere (página estática)

### Fase 3 — Framework
React + Next.js                    ✅  Componente con next/link, App Router
Zustand                            ✅  No requiere (página estática)

### Fase 4 — UI
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa

### Fase 5 — Backend
Supabase (PostgreSQL)              ✅  No requiere (página estática)

### Fase 6 — Extras
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

---

## Auditoría general

Estructura HTML → JSX              ✅  Número 404 grande, título, descripción, botón "Volver al inicio"
Estilos → Tailwind                 ✅  Tailwind utilities, clamp() para tipografía responsive
JavaScript → React state           ✅  No requiere estado (página estática)
Datos                              ✅  No requiere datos
Interactividad                     ✅  Link a inicio con next/link
Responsive                        ✅  Tipografía con clamp(), sm: breakpoints
Accesibilidad                      ✅  aria-hidden en el 404 decorativo
SEO                                ⚠️  Falta meta robots noindex (el HTML original lo tenía)
Rendimiento                        ✅  Página estática, sin dependencias externas
Fidelidad visual                   ✅  Equivalente al original

---

## Sugerencias de mejora

- Agregar meta robots noindex, nofollow (el HTML original lo tenía)
- Página esencialmente completa, mejoras mínimas
