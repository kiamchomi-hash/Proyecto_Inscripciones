# Migración — faq.html → app/faq/page.tsx

Estado: MIGRADO

Archivos: app/faq/page.tsx, components/faq-page.tsx, app/faq/faq.css

---

## Tecnologías por fase

### Fase 1 — Base
Tailwind CSS                       ✅  Utilities en todo el componente + faq.css para animaciones

### Fase 2 — Lenguaje
TypeScript                         ✅  Interfaces tipadas (FaqItem, props)
Axios                              ❌  No se usa — usa supabase client directo
Zod                                ❌  No se usa — Supabase maneja tipos

### Fase 3 — Framework
React + Next.js                    ✅  Server component (page.tsx) + client component (faq-page.tsx), App Router
Zustand                            ❌  No se usa — estado local con useState

### Fase 4 — UI
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa

### Fase 5 — Backend
Supabase (PostgreSQL)              ✅  Tabla faq_preguntas — SELECT server-side, INSERT client-side

### Fase 6 — Extras
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica (futuro: admin de preguntas)

---

## Auditoría general

Estructura HTML → JSX              ✅  Acordeón con 5+ preguntas, búsqueda, formulario de nuevas preguntas
Estilos → Tailwind                 ✅  Tailwind utilities + faq.css para animaciones del acordeón
JavaScript → React state           ✅  useState/useRef/useCallback para acordeón, búsqueda fuzzy, envío de formulario
Datos → Supabase                   ✅  Tabla faq_preguntas, fetch server-side, insert client-side para nuevas preguntas
Interactividad                     ✅  Acordeón expandible, búsqueda fuzzy en tiempo real, formulario con validación
Responsive                        ✅  Grid responsive, mobile adaptado
Accesibilidad                      ⚠️  Faltan aria-expanded en botones del acordeón, role="region" en paneles
SEO                                ✅  Metadata con title y description
Rendimiento                        ⚠️  Imagen de entrada del CAU usa <img> en vez de next/image
Fidelidad visual                   ✅  Completo
CAPTCHA / Rate limit               ⚠️  Cloudflare Turnstile planificado pero no implementado

---

## Sugerencias de mejora

### Accesibilidad y rendimiento
- Agregar aria-expanded en botones del acordeón y role="region" en paneles
- Reemplazar <img> por next/image para la foto de entrada del CAU

### Protección
- Cloudflare Turnstile — Gratis, invisible, protege el formulario de preguntas contra bots

### Inteligencia
- Respuestas automáticas con IA — Antes de enviar una pregunta nueva, pasarla por API de Claude/OpenAI para sugerir FAQ existentes que ya la respondan. Reduce moderación manual
- Supabase pg_trgm + búsqueda full-text — Reemplazar búsqueda fuzzy Levenshtein en cliente por full-text nativa de PostgreSQL. Más rápida y precisa

### Moderación
- Notificación de nueva pregunta — Edge Function que avisa por WhatsApp/Telegram/email cuando alguien envía una pregunta
- Auto-moderación con IA — Filtrar preguntas ofensivas o spam antes de guardarlas con un prompt simple a Claude
- Futuro: gestionar preguntas desde app Tauri (aprobar, rechazar, reordenar)

### Contenido dinámico
- FAQ desde Supabase 100% — Mover las preguntas hardcodeadas en FAQ_ITEMS (faq-page.tsx) a Supabase. Editar todo desde dashboard sin tocar código
- Categorías/tags — Columna categoria en faq_preguntas (inscripción, pagos, ubicación, exámenes). Mostrar tabs o filtros por categoría

### UI
- Agregar footer — Componente footer compartido con info de contacto, enlaces y redes sociales

### Analytics
- Tracking de clics — Guardar en Supabase qué preguntas se abren más. Reordenar automáticamente por popularidad
