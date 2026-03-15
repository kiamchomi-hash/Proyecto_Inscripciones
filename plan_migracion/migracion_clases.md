# Migración — clases-apoyo.html → app/clases-apoyo/page.tsx

Estado: MIGRADO

---

## Pendientes menores

- Configurar pg_cron para limpieza automática de clases pasadas
- Investigar doble renderizado al pulsar

---

## Sugerencias de mejora (futuro)

### Notificaciones al profesor
- Supabase Edge Functions — Trigger en solicitudes_clase que dispara notificación
- WhatsApp Business API (Twilio/360dialog) o Telegram Bot o Email vía Resend/SendGrid

### Flujo de confirmación
- Estados en solicitudes_clase: pendiente → confirmada → rechazada
- Profesor cambia estado desde Tauri, alumno consulta con código de seguimiento

### Disponibilidad en tiempo real
- Profesor marca horarios ocupados desde Tauri
- Alumno ve pills deshabilitadas para horarios no disponibles

### Google Calendar API
- Sincronizar clases confirmadas con Google Calendar del profesor

### Historial del alumno
- localStorage con solicitudes previas y estado
