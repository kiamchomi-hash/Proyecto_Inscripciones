# Diseño: recordatorio recurrente de planes de Teclab

## Objetivo

Enviar por Telegram un aviso para revisar los planes oficiales de estudio de
Teclab en cada ciclo de revisión:

- 1 de marzo, 17:00, hora de Buenos Aires.
- 1 de agosto, 17:00, hora de Buenos Aires.
- 15 de diciembre, 17:00, hora de Buenos Aires.

La rutina queda documentada en `docs/rutinas.md`, no en `PENDIENTES.md`.

## Diseño aprobado

Agregar una tarea específica al Worker de producción y sus Cron Triggers,
reutilizando el envío de Telegram ya configurado. Las ejecuciones corresponden
a las 20:00 UTC, que son las 17:00 de Buenos Aires. El aviso recuerda comparar
los planes de las carreras activas de Teclab con fuentes oficiales; no realiza
la auditoría ni modifica D1.

Los recordatorios semanales existentes se conservan sin cambios. No se requiere
leer ni escribir D1 para enviar este mensaje.

## Verificación y operación

- Probar la nueva tarea con transporte de Telegram simulado.
- Comprobar las expresiones cron y su despacho antes de publicar.
- Publicar el Worker con la nueva programación y verificar que el deploy se
  haya completado.
- No enviar un mensaje de prueba al chat real.

## Aprobación

Diseño aprobado por el usuario el 20/11/2026. Horarios: 17:00 de Buenos Aires.
