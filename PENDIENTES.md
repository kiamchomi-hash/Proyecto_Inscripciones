# Pendientes

Actualizado el 02/10/2026: se agregaron las 31 tareas solicitadas por el usuario. Se conservan los pendientes anteriores; siguen abiertos hasta contar con evidencia de cierre.

Lista de trabajo para una sola persona. No hace falta trasladarla a otra herramienta. Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

## Revisión y trabajo propio

- [ ] **Crear una copia completa y ensayar recuperación de Supabase en un destino separado**. Dashboard verificado el 01/10: plan gratuito sin respaldos automáticos ni PITR. Ensayo PostgreSQL ficticio aprobado; falta acceso para respaldo completo, custodia cifrada y restore real con integridad/permisos y RPO/RTO acordados y medidos. [Procedimiento](docs/recuperacion-supabase.md).

- [ ] **Revisar el video institucional contra la oferta vigente antes de publicarlo** [Detalle](docs/pendientes-detalle.md#pendiente-16).

## En espera de información externa

Los pedidos ya redactados y el destino de cada dato están registrados en [las notas operativas](docs/notas-operativas.md). Confirmar que el pedido siga vigente antes de enviarlo.

- [ ] **Confirmar medios de pago del curso de IA de Teclab**. Imágenes publicadas el 30/09 con una ilustración aportada por el usuario. Arancel individual registrado con vigencia hasta el 30/09; no es un precio permanente. [Detalle](docs/pendientes-detalle.md#pendiente-08).
- [ ] **Confirmar becas, doble carrera y las dudas restantes de requisitos** [Detalle](docs/pendientes-detalle.md#pendiente-11).

## Pendientes que estaban dentro de las notas

Estas recomendaciones ya figuraban en el registro; se hacen visibles sin dar por confirmado su estado actual. [Contexto completo](docs/notas-operativas.md).

- [ ] Verificar el volumen de consultas de WhatsApp tras el cambio de reparto registrado en agosto.
- [ ] Revisar los PAT de Supabase y retirar únicamente los que ya no se usen.
- [ ] Comprobar si siguen sin uso las credenciales de Resend de este proyecto antes de retirarlas; no tocar las de otros proyectos.
- [ ] Revisar las decisiones pendientes sobre los módulos de Bienestar Integral y Mindfulness, si siguen dentro del alcance del convenio.
- [ ] Evaluar el endurecimiento menor de SPF de `~all` a `-all` sólo si sigue justificado (prioridad baja).

## Tareas agregadas el 02/10/2026

Se mantiene la numeración del pedido para poder referirse a cada tarea.

- [ ] **1. Incorporar más imágenes de personas**.
- [ ] **2. Mejorar las páginas de clases y crear sus folletos e imágenes**.
- [ ] **3. Mejorar el mensaje de aranceles**.
- [ ] **4. Extraer los precios 2027 de Universidad Siglo 21**.
- [ ] **5. Mostrar la fecha de inicio y el mensaje «Todavía estás a tiempo de inscribirte» en todas las carreras**, según la vigencia de cada inscripción.
- [ ] **6. Mejorar con IA las imágenes de algunos modales de carreras**.
- [ ] **7. Mejorar la página de materias en base a los folletos creados**.
- [ ] **8. Rediseñar Identidad Argentina: los modales y la página principal**. Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo.
- [ ] **9. Dar imágenes a todas las carreras**.
- [ ] **10. Crear folletos con CTA en el frente y lista de carreras en el dorso** para Teclab, Siglo 21, Identidad Argentina y clases de apoyo.
- [ ] **11. Crear un folleto de carreras relevantes**.
- [ ] **12. Crear folletos con estilo Siglo 21 y contenido y carreras de Teclab**.
- [ ] **14. Crear más mensajes de seguimiento que complementen al primero**. Segundo seguimiento de Siglo 21 implementado y verificado localmente el 03/10/2026, sin tocar las otras casas. El alcance global sigue abierto. [Evidencia](docs/historial-pendientes.md#mensajes-siglo21-2026-10-03).
- [ ] **15. Permitir que una pregunta del buscador de carreras se responda combinando varias respuestas**, separadas por párrafos.
- [ ] **17. Revisar si todavía tenemos acceso a todas las fuentes de las casas**.
- [ ] **18. Revisar las aperturas de las carreras**: algunas no arrancan a mediados de bimestre.
- [ ] **20. Terminar de revisar el UIverse local**.
- [ ] **21. Usar el bot de HubSpot de Siglo 21 para extraer más respuestas y procesos administrativos**, por una vía distinta del buscador de carreras.
- [ ] **23. Tomar como referencia al CAU de Corrientes para las publicaciones de Instagram**, especialmente las de Estadística y Análisis Aplicado, que aparentemente tienen éxito.
- [ ] **26. Revisar los plugins de ChatGPT y Claude**.
- [ ] **28. Revisar distintas tipografías para agregar al UIverse local**.
- [ ] **29. Revisar claude.dev y sus consejos para usar mejor Claude**.
- [ ] **30. Crear una cuenta en Twitter para ver videos de Hipermotion y Remotion y traer inspiración**.
- [ ] **38. Rediseñar la página de cada carrera de Teclab (`/carreras/<slug>`) con el sistema de `piezas_teclab`** (paleta, Poppins, fotos y logo oficiales), sin cambiar la disposición ni los textos. El 04/10/2026 se rediseñaron por error `/teclab` y las de inscripción (`/teclab/inscripcion`, `/carreras/<slug>/inscripcion`, `/inscripcion/<codigo>`), commit `d73a904`, ya publicado; las fichas de carrera siguen pendientes. [Detalle](odd/tasks/rediseno-paginas-teclab.md).

## Documentación de apoyo

- [Rutinas de mantenimiento](docs/rutinas.md): contenido, bot, SEO, fuentes comerciales, leads y verificaciones de deploy. La revisión de indexación y rendimiento (antigua tarea 13) queda como seguimiento permanente, no como tarea cerrable.
- [Detalle de pendientes abiertos](docs/pendientes-detalle.md): mediciones, restricciones, fuentes y pasos originales.
- [Historial de pendientes cerrados](docs/historial-pendientes.md): tareas terminadas y registros anteriores, con su evidencia.
- [Notas y procedimientos operativos](docs/notas-operativas.md): webhook, secretos, correo, incidentes y límites conocidos.

Las notas históricas no reemplazan [los criterios vigentes](docs/criterios.md). Los planes de `docs/plans/` tampoco son el backlog.
