# Diseño: auditoría periódica de planes de Siglo 21

## Objetivo

Crear una skill para revisar los planes de estudio publicados de Siglo 21 y
corregir en D1 sólo las diferencias confirmadas contra fuentes oficiales.
Agregar avisos por Telegram en las mismas fechas que el seguimiento de planes de
Teclab: 1 de marzo, 1 de agosto y 15 de diciembre, a las 17:00 de Buenos Aires.

## Alcance de la auditoría

- Incluir carreras activas de Grado, Grado (CCC) y Pregrado que tengan un slide
  `plan_estudios`.
- Comparar el slide publicado con la ficha oficial vigente de cada carrera y con
  el plan oficial descargable enlazado desde ella, cuando exista.
- La ficha oficial es fuente primaria. Si la ficha y su documento oficial
  vinculado discrepan, o no puede establecerse qué versión rige, registrar el
  caso como no resuelto y no escribir por inferencia.
- Actualizar únicamente el objeto `plan_estudios` dentro de `slides`; preservar
  portada, cierre y el resto de las columnas de la fila.
- Escribir SQL fechado y acotado por ID, nombre, estado activo y revisión
  observada; leer de vuelta las filas y guardar las fuentes y resultados en
  `referencias/`.

## Skill

La skill vivirá en
`.claude/skills/auditar-planes-siglo21/SKILL.md` y se expondrá mediante el
enlace selectivo en `.agents/skills/` y las allowlists existentes. Se activa al
revisar o actualizar planes de Siglo 21, sin ejecutar una auditoría masiva si
el usuario sólo consulta una materia o carrera concreta.

La invocación autoriza actualizar sólo los slides de los registros incluidos
cuando la diferencia esté confirmada. La skill no modifica `plan_estudios`,
otros metadatos, carreras inactivas ni instituciones distintas de Siglo 21.

## Notificaciones

Los Cron Triggers vigentes ya ejecutan el 1 de marzo, el 1 de agosto y el 15 de
diciembre a las 17:00 de Buenos Aires. Se conservan sus expresiones y se amplía
el despacho de esas ejecuciones para enviar, por separado, el aviso existente
de Teclab y un aviso nuevo de Siglo 21. Cada aviso tendrá su handler autenticado
por `CRON_SECRET` y usará la configuración de Telegram ya instalada. Los
avisos recuerdan la revisión; no la ejecutan ni consultan o escriben D1.

La rutina de Siglo 21 se documentará junto a la de Teclab en `docs/rutinas.md`.
Las pruebas usarán transportes simulados; no se enviará un mensaje de prueba al
chat real.

## Verificación y operación

- Probar texto, autenticación y envío simulado de la notificación nueva.
- Probar que cada una de las tres expresiones existentes despacha ambos avisos
  sin duplicar ejecuciones ni afectar los otros Cron Triggers.
- Verificar el SQL, las filas escritas y los slides resultantes; correr
  `npm run auditar`.
- Ejecutar las pruebas focales, `npm run check` de la raíz y los controles del
  paquete `cloudflare/` que correspondan a la lógica modificada.
- Publicar mediante el flujo existente y comprobar el workflow y la
  configuración de Cron Triggers después del despliegue. No mandar pruebas a
  Telegram real.

## Aprobación

Alcance y calendario aprobados por el usuario el 20/11/2026. La skill cubre
Grado, Grado (CCC) y Pregrado activos con planes en slides; los avisos son
independientes por institución y no disparan la auditoría.
