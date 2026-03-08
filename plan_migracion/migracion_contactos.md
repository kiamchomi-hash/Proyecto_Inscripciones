# Migración — contactos.html → app/contactos/page.tsx

Estado: PLACEHOLDER

Archivos: app/contactos/page.tsx (usa ConstructionPage genérico)
HTML original: Eliminado

---

## Tecnologías por fase

### Fase 1 — Base
Tailwind CSS                       ❌  Sin estilos propios (usa componente genérico)

### Fase 2 — Lenguaje
TypeScript                         ✅  Archivo .tsx
Axios                              ❌  No se usa
Zod                                ❌  No se usa

### Fase 3 — Framework
React + Next.js                    ⚠️  Componente existe pero es banner "en construcción"
Zustand                            ❌  No se usa

### Fase 4 — UI
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa

### Fase 5 — Backend
Supabase (PostgreSQL)              ❌  No conectado

### Fase 6 — Extras
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

---

## Auditoría general

Estructura HTML → JSX              ⚠️  Solo muestra banner "en construcción"
Estilos → Tailwind                 ❌  Sin estilos propios
JavaScript → React state           ❌  Sin lógica
Datos                              ❌  Sin datos (el HTML original tenía mapa, info de contacto, redes sociales)
Interactividad                     ❌  Sin formulario de contacto, sin mapa embebido
Responsive                        ❌  No aplica aún
Accesibilidad                      ❌  No aplica aún
SEO                                ✅  Metadata con title y description
Rendimiento                        ❌  No aplica aún
Fidelidad visual                   ❌  No aplica aún

---

## Sugerencias de mejora

- Migrar mapa embebido de Google Maps (iframe ya disponible en skill cau_brand)
- Migrar info de contacto: WhatsApp, Facebook, Instagram, dirección
- Considerar formulario de contacto con validación Zod y envío a Supabase
- Reutilizar componentes SocialLink y ZonaCard que ya existen en faq-page.tsx
