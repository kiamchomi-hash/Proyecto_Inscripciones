# Migración — clases-apoyo.html → app/clases-apoyo/page.tsx

Estado: MIGRADO

Archivos: app/clases-apoyo/page.tsx, components/clases-apoyo/clases-apoyo-page.tsx, app/clases-apoyo/clases-apoyo.css

---

## Tecnologías por fase

### Fase 1 — Base
Tailwind CSS                       ✅  Utilities en todo el componente + clases-apoyo.css para grid/animaciones

### Fase 2 — Lenguaje
TypeScript                         ✅  Interfaces tipadas (CalendarWeek, MateriaDB, DayInfo, ScheduleMode)
Axios                              ❌  No se usa — usa supabase client directo
Zod                                ❌  No se usa — sin validación de schemas

### Fase 3 — Framework
React + Next.js                    ✅  Server component (page.tsx con buildCalendarWeeks) + client component, App Router
Zustand                            ❌  No se usa — estado local con useState

### Fase 4 — UI
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa

### Fase 5 — Backend
Supabase (PostgreSQL)              ✅  Tablas materias (SELECT server-side) y solicitudes_clase (INSERT client-side con nombre, teléfono, días, horarios)

### Fase 6 — Extras
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica (futuro: app del profesor con calendario)

---

## Auditoría general

Estructura HTML → JSX              ✅  Sidebar, carousel, calendario, schedule panel, construction banner
Estilos → Tailwind                 ✅  Tailwind utilities + clases-apoyo.css para grid/animaciones
JavaScript → React state           ✅  useState para materia activa, días seleccionados, horarios, modo (picking/choose-mode/per-day/done), formulario nombre+teléfono
Datos → Supabase                   ✅  Tabla materias (fetch server-side con modo_manana, en_construccion, etc.), tabla solicitudes_clase (insert client-side)
Interactividad                     ✅  Tabs mobile, sidebar desktop, calendario seleccionable multi-día, pills de horarios, multi-mode (mismo horario / distintos por día con carousel), formulario con validación de teléfono argentino, auto-scroll en mobile
Responsive                        ✅  Mobile tabs (flex reparto), contenido stacked, scroll de página nativo, auto-scroll al footer
Accesibilidad                      ⚠️  Faltan aria-label en botones del carousel de días (flechas), aria-selected en tabs/sidebar
SEO                                ✅  Metadata con title y description
Rendimiento                        ⚠️  Imágenes del carousel usan <img> en vez de next/image
Fidelidad visual                   ✅  Mejorada respecto al HTML original
Archivo data.ts legacy             ⚠️  components/clases-apoyo/data.ts ya no se usa — se puede eliminar
pg_cron limpieza                   ⚠️  Limpieza automática de clases pasadas pendiente (puede requerir plan Pro)

---

## Sugerencias de mejora

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
- Proteger el formulario de solicitudes contra spam/bots

### Historial del alumno
- Guardar cookie o localStorage con solicitudes previas
- Mostrar: "Ya solicitaste una clase el 12 de marzo — estado: confirmada"

### Otros
- Agregar aria-label en botones del carousel de días y aria-selected en tabs/sidebar
- Reemplazar <img> por next/image en el carousel
- Eliminar components/clases-apoyo/data.ts (ya no se importa)
- Configurar pg_cron para limpieza automática de clases pasadas
