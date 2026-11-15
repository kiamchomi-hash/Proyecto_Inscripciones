# Aviso de actualizaciones: plan de implementación

**Objetivo:** avisar de versiones nuevas sin instalar ni modificar dependencias.

**Diseño aprobado:** una revisión diaria por systemd de usuario escribe un
informe local y notifica cambios o fallos. Consulta npm de los dos paquetes y
globales, las fuentes identificadas de OpenCode, CodeGraph y Modern Web Guidance,
y los gestores Linux disponibles. Las skills sin origen verificable figuran
como no comprobadas; los fallos no se presentan como «al día».

**Tecnología:** Node.js, npm, systemd de usuario y `notify-send`.

1. Probar los parsers y el tratamiento de errores con datos simulados.
2. Implementar consultas de sólo lectura, informe persistente y notificación sin
   secretos ni instalación automática.
3. Probar el comando real, documentar alcance y limitaciones.
4. Instalar y verificar el timer de usuario; publicar sólo los archivos propios.
