# Plan de Migración — CAU Villa Lugano

## Estado de cada tecnología

### Fase 1 — Base COMPLETADA
npm + package.json — Hecho
Git — Ya existía
Tailwind CSS (local) — Hecho (v4 + @tailwindcss/postcss)

### Fase 2 — Lenguaje COMPLETADA
TypeScript — Hecho
Node.js + Express — Hecho (server legacy en src/server.ts, reemplazado por Next.js)
Axios — Hecho
Zod — Hecho (schemas en src/schemas.ts)
Pico.css — Excluido por decisión

### Fase 3 — Framework EN PROGRESO
React + Next.js — App Router funcionando
Navbar componente — Hecho (components/navbar.tsx)
Novedades (10 HTML → 1 ruta dinámica) — Hecho (app/novedades/[page])
FAQ + Supabase — Hecho (app/faq + components/faq-page.tsx)
Clases de Apoyo + Supabase — Hecho (app/clases-apoyo + components/clases-apoyo/)
Contacto — Placeholder "en construcción"
Sobre Nosotros — Placeholder "en construcción"
index.html (catálogo carreras) — Pendiente, la más compleja
Zustand — Pendiente

### Fase 4 — UI (pendiente)
daisyUI — Pendiente, plugin Tailwind
shadcn/ui — Pendiente, componentes copy-paste

### Fase 5 — Backend PARCIAL
MongoDB — Descartado en favor de PostgreSQL
PostgreSQL (Supabase) — Funcionando (faq_preguntas, materias, solicitudes_clase)

### Fase 6 — Extras (pendiente)
Stagehand — Pendiente, testing automatizado
Tauri — Pendiente, app de escritorio

## Archivos HTML originales en migracion_pendiente/
index.html — catálogo de carreras, buscador fuzzy, calculadora, OCR, drag-and-drop
404.html — página de error personalizada
datos_carreras.json — datos de 60+ carreras (se moverán a Supabase)
novedades_data.json — datos de novedades (se moverán a Supabase)
server.ts, schemas.ts, tsconfig.server.json — server Express legacy

## Archivos HTML ya eliminados (migrados)
contactos.html, sobre-nosotros.html, faq.html, clases-apoyo.html
novedades.html, novedades2.html … novedades10.html

---

## Tecnologías aplicadas por página

### 1. index.html → app/page.tsx — PLACEHOLDER

Archivos: app/page.tsx (placeholder)
HTML original: migracion_pendiente/index.html

Tailwind CSS                       ✅  Clases básicas en el placeholder
TypeScript                         ✅  Archivo .tsx
Axios                              ❌  No se usa — el original hacía fetch a datos_carreras.json
Zod                                ❌  No se usa — el original validaba con schemas.ts via Express
React + Next.js                    ⚠️  Componente existe pero es solo texto placeholder, sin lógica migrada
Zustand                            ❌  No se usa
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa
Supabase (PostgreSQL)              ❌  No conectado — datos_carreras.json sin migrar a BD
next/image                         ❌  No se usa
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

Pendiente migrar: búsqueda fuzzy (Levenshtein), calculadora de aranceles, drag-and-drop de archivos, formulario de inscripción, localStorage, 60+ carreras a Supabase.

### 2. faq.html → app/faq/page.tsx — MIGRADO

Archivos: app/faq/page.tsx, components/faq-page.tsx, app/faq/faq.css

Tailwind CSS                       ✅  Utilities en todo el componente + faq.css para animaciones
TypeScript                         ✅  Interfaces tipadas (FaqItem, props)

Zod                                ❌  No se usa — sin validación de schemas, Supabase maneja tipos
React + Next.js                    ✅  Server component (page.tsx) + client component (faq-page.tsx), App Router
Zustand                            ❌  No se usa — estado local con useState
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa
Supabase (PostgreSQL)              ✅  Tabla faq_preguntas — SELECT server-side, INSERT client-side
next/image                         ❌  No se usa — imagen del CAU con <img> nativo
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica (futuro: admin de preguntas)

### 3. clases-apoyo.html → app/clases-apoyo/page.tsx — MIGRADO

Archivos: app/clases-apoyo/page.tsx, components/clases-apoyo/clases-apoyo-page.tsx, app/clases-apoyo/clases-apoyo.css

Tailwind CSS                       ✅  Utilities en todo el componente + clases-apoyo.css para grid/animaciones
TypeScript                         ✅  Interfaces tipadas (CalendarWeek, MateriaDB, DayInfo, ScheduleMode)
Axios                              ❌  No se usa — usa supabase client directo
Zod                                ❌  No se usa — sin validación de schemas
React + Next.js                    ✅  Server component (page.tsx con buildCalendarWeeks) + client component, App Router
Zustand                            ❌  No se usa — estado local con useState (activeIdx, selectedDays, mode, etc.)
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa
Supabase (PostgreSQL)              ✅  Tabla materias (SELECT server-side), tabla solicitudes_clase (INSERT client-side con nombre, teléfono, días, horarios)
next/image                         ❌  No se usa — imágenes del carousel con <img> nativo
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica (futuro: app del profesor con calendario)

Nota: components/clases-apoyo/data.ts es legacy y ya no se importa — se puede eliminar.

### 4. novedades.html (x10) → app/novedades/[page]/page.tsx — PLACEHOLDER

Archivos: app/novedades/[page]/page.tsx (placeholder)
HTML original: Eliminados (10 páginas estáticas)

Tailwind CSS                       ⚠️  Solo clases básicas en el placeholder
TypeScript                         ✅  Archivo .tsx
Axios                              ❌  No se usa — el original hacía fetch a novedades_data.json
Zod                                ❌  No se usa — el original validaba con NovedadesDataSchema
React + Next.js                    ⚠️  Ruta dinámica [page] existe pero muestra "Sección en desarrollo"
Zustand                            ❌  No se usa
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa
Supabase (PostgreSQL)              ❌  No conectado — novedades_data.json sin migrar a BD
next/image                         ❌  No se usa
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

Pendiente migrar: cards de noticias, paginación, novedades_data.json a Supabase.

### 5. contactos.html → app/contactos/page.tsx — PLACEHOLDER

Archivos: app/contactos/page.tsx (usa ConstructionPage genérico)
HTML original: Eliminado

Tailwind CSS                       ❌  Sin estilos propios (usa componente genérico)
TypeScript                         ✅  Archivo .tsx
Axios                              ❌  No se usa
Zod                                ❌  No se usa
React + Next.js                    ⚠️  Componente existe pero es banner "en construcción"
Zustand                            ❌  No se usa
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa
Supabase (PostgreSQL)              ❌  No conectado
next/image                         ❌  No se usa
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

Pendiente migrar: mapa embebido, info de contacto, redes sociales, formulario.

### 6. sobre-nosotros.html → app/sobre-nosotros/page.tsx — PLACEHOLDER

Archivos: app/sobre-nosotros/page.tsx (usa ConstructionPage genérico)
HTML original: Eliminado

Tailwind CSS                       ❌  Sin estilos propios (usa componente genérico)
TypeScript                         ✅  Archivo .tsx
Axios                              ❌  No se usa
Zod                                ❌  No se usa
React + Next.js                    ⚠️  Componente existe pero es banner "en construcción"
Zustand                            ❌  No se usa
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa
Supabase (PostgreSQL)              ❌  No conectado
next/image                         ❌  No se usa
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

Pendiente migrar: historia del CAU, equipo, misión/visión.

### 7. 404.html → app/not-found.tsx — MIGRADO

Archivos: app/not-found.tsx
HTML original: migracion_pendiente/404.html

Tailwind CSS                       ✅  Utilities, clamp() para tipografía responsive
TypeScript                         ✅  Archivo .tsx
Axios                              ✅  No requiere (página estática)
Zod                                ✅  No requiere (página estática)
React + Next.js                    ✅  Componente con next/link
Zustand                            ✅  No requiere (página estática)
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa
Supabase (PostgreSQL)              ✅  No requiere (página estática)
next/image                         ✅  No requiere (sin imágenes)
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

Nota: Falta meta robots noindex (el HTML original lo tenía).

---

## Sugerencias de mejora — Clases de Apoyo

### Notificaciones al profesor
- Supabase Edge Functions — Trigger en solicitudes_clase que dispara notificación al profesor
- WhatsApp Business API (Twilio/360dialog) — Notificación directa al WhatsApp del profesor con datos del alumno
- Telegram Bot — Alternativa gratuita si WhatsApp Business es caro
- Email vía Resend/SendGrid — Free tier generoso, más simple de implementar

### Flujo de confirmación
- Agregar estados a solicitudes_clase: pendiente → confirmada → rechazada
- El profesor cambia el estado desde Tauri
- El alumno puede consultar el estado con un código de seguimiento o recibe confirmación por WhatsApp automático

### Disponibilidad en tiempo real
- El profesor marca desde Tauri qué horarios ya están ocupados
- El alumno ve las pills ocupadas deshabilitadas/tachadas, evitando solicitudes que van a ser rechazadas

### Google Calendar API
- Sincronizar clases confirmadas con el Google Calendar del profesor
- El alumno recibe un invite automático con el link de ubicación

### Tauri — App del profesor
- Vista calendario semanal con solicitudes recibidas
- Aceptar/rechazar con un click
- Marcar horarios bloqueados (reuniones, feriados, etc.)
- Dashboard: materia con más demanda, horarios pico

### Cloudflare Turnstile
- Proteger el formulario de solicitudes contra spam/bots (igual que en FAQ)

### Historial del alumno
- Guardar cookie o localStorage con solicitudes previas
- Mostrar: "Ya solicitaste una clase el 12 de marzo — estado: confirmada"
