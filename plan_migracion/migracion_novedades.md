# Migración — novedades.html (x10) → app/novedades/[page]/page.tsx

Estado: PLACEHOLDER

Archivos: app/novedades/[page]/page.tsx (placeholder)
HTML original: Eliminados (eran 10 páginas estáticas: novedades.html … novedades10.html)

---

## Tecnologías por fase

### Fase 1 — Base
Tailwind CSS                       ⚠️  Solo clases básicas en el placeholder

### Fase 2 — Lenguaje
TypeScript                         ✅  Archivo .tsx
Axios                              ❌  No se usa — el original hacía fetch a novedades_data.json
Zod                                ❌  No se usa — el original validaba con NovedadesDataSchema

### Fase 3 — Framework
React + Next.js                    ⚠️  Ruta dinámica [page] existe pero muestra "Sección en desarrollo"
Zustand                            ❌  No se usa

### Fase 4 — UI
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa

### Fase 5 — Backend
Supabase (PostgreSQL)              ❌  No conectado — novedades_data.json sin migrar a BD

### Fase 6 — Extras
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

---

## Auditoría general

Estructura HTML → JSX              ⚠️  Ruta dinámica existe pero muestra solo "Sección en desarrollo"
Estilos → Tailwind                 ❌  Sin estilos migrados
JavaScript → React state           ❌  Sin lógica de paginación ni renderizado de noticias
Datos                              ❌  novedades_data.json sin migrar a Supabase (copia en migracion_pendiente/)
Interactividad                     ❌  Sin paginación, sin cards de noticias
Responsive                        ❌  No aplica aún
Accesibilidad                      ❌  No aplica aún
SEO                                ✅  Metadata con title y description
Rendimiento                        ❌  No aplica aún
Fidelidad visual                   ❌  No aplica aún

---

## Sugerencias de mejora

- Migrar novedades_data.json a tabla novedades en Supabase
- Implementar cards de noticias con imagen, título, fecha, resumen
- Paginación server-side con Supabase (range queries)
- Usar next/image para imágenes de noticias
- Futuro: gestionar novedades desde app Tauri (crear, editar, eliminar)
