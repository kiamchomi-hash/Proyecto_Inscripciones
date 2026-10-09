# Pendientes

Actualizado el 09/10/2026: la lista se ordenó por tema, con Teclab primero según la prioridad vigente (web y formularios, diseño, folletos). Los números de los pedidos del 02/10/2026 se conservan para poder referirse a cada tarea; las tareas sin número llegaron después.

Lista de trabajo para una sola persona. No hace falta trasladarla a otra herramienta. Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

## Teclab (prioridad actual)

### Web y formularios

- [ ] **Mejorar la UX/UI de la preinscripción para que sea más rápida**, sin eliminar datos ni consentimientos necesarios. Hecho el 09/10/2026, sin publicar todavía: «Inscribite ya» del modal y del slide de precio lleva a la página dedicada (`/carreras/<slug>/inscripcion`, envío en un paso); los campos de nombre, apellido, mail, teléfono, código postal y localidad declaran `autocomplete`; en el celular «Inscribite ya» ocupa el ancho libre del pie del modal; «Ver precio» espera la verificación con una rueda dentro del botón en vez de mostrar un aviso rojo. Falta: publicar y confirmar en producción el envío automático cuando llega la verificación; llevar también al botón el error del servidor en «Ver precio», que hoy aparece debajo y corre el contenido; agrupar los 20 campos en bloques (Tus datos, Domicilio, Estudios, Contacto), con capturas para aprobar. [Trabajo anterior](odd/tasks/preinscripcion-enfocada.md).
- [ ] **38. Rediseñar la ficha de cada carrera de Teclab (`/carreras/<slug>`) con el sistema de `piezas_teclab` — parcialmente hecho (09/10/2026)** (paleta, Poppins, fotos y logo oficiales), sin cambiar la disposición ni los textos. Hecho: hero, bloques de datos en color, plan, formularios, navbar, pie, scroll y flecha de Teclab. Faltan mejoras que el usuario considera necesarias, aún sin definir. Ya están hechas y publicadas `/teclab`, `/teclab/inscripcion`, `/carreras/<slug>/inscripcion` e `/inscripcion/<codigo>` (commit `d73a904`); faltan las fichas. [Detalle](odd/tasks/rediseno-paginas-teclab.md).
- [ ] **Verificar si se está enviando el mail de Teclab con el acceso al portal del alumno**. Comprobar una solicitud de inscripción y confirmar la recepción del correo; no darlo por enviado sólo porque el formulario devuelve éxito.
- [ ] **Usar las páginas oficiales de las carreras de Teclab para copiar sus textos**. Referencia aportada: [Técnico Superior en Gestión Contable](https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-contable/).
- [ ] **Crear un test vocacional para Teclab**.
- [ ] **Empezar a revisar nuevas carreras de Teclab**.

### Folletos y redes

- [ ] **10. Crear folletos con CTA en el frente y lista de carreras en el dorso** para Teclab, Siglo 21, Identidad Argentina y clases de apoyo. Empezar por Teclab.
- [ ] **12. Crear folletos con estilo Siglo 21 y contenido y carreras de Teclab**.
- [ ] **Crear una cuenta de Instagram para Teclab Lugano**.

### Comercial

- [ ] **39. Corregir las respuestas de inicio e inscripción de cursos de Teclab que señala la auditoría institucional**. Problemas preexistentes confirmados el 07/10/2026 en `cuando-empieza-teclab-curso` e `inscripcion-abierta-teclab-curso`; verificar datos y vigencia antes de corregir. Prioridad comercial: evitar respuestas incorrectas al atender consultas de cursos.
- [ ] **Reunir en un archivo local todos los procesos de preinscripción de Teclab**. Documentar los pasos y requisitos; mantenerlo fuera del repositorio público si contiene información interna o comercial.

## Sitio y diseño

- [ ] **1. Incorporar más imágenes de personas**.
- [ ] **2. Mejorar las páginas de clases y crear sus folletos e imágenes**.
- [ ] **5. Mostrar la fecha de inicio y el mensaje «Todavía estás a tiempo de inscribirte» en todas las carreras**, según la vigencia de cada inscripción.
- [ ] **6. Mejorar con IA las imágenes de algunos modales de carreras**.
- [ ] **7. Mejorar la página de materias en base a los folletos creados**.
- [ ] **8. Rediseñar Identidad Argentina: los modales y la página principal**. Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo.
- [ ] **9. Dar imágenes a todas las carreras**.
- [ ] **11. Crear un folleto de carreras relevantes**.
- [ ] **15. Permitir que una pregunta del buscador de carreras se responda combinando varias respuestas**, separadas por párrafos.
- [ ] **Medir en qué punto se abandona el test vocacional y mejorarlo**. Identificar los pasos con mayor abandono y usar la medición para orientar y comprobar las mejoras.
- [ ] **Pulir el FAQ de las carreras modificadas (Procurador, Gestión Contable y Seguros) y revisar textos previos de la cabecera**. Contrastar la introducción con los textos que tenían antes en `descripcion`, previos a los cambios del 05/10/2026 (respaldo en `notas-locales/seo-tres-fichas/estado-previo.json`).
- [ ] **Revisar el video institucional contra la oferta vigente antes de publicarlo** [Detalle](docs/pendientes-detalle.md#pendiente-16).

## Comercial y contenido

- [ ] **3. Mejorar el mensaje de aranceles**.
- [ ] **4. Extraer los precios 2027 de Universidad Siglo 21**.
- [ ] **14. Crear más mensajes de seguimiento que complementen al primero**. Siglo 21 cuenta con segundo seguimiento desde el 03/10/2026; Teclab ya tiene primero y segundo. El 07/10/2026 se incorporaron ambos a Academia Identidad Argentina y se regeneraron las dos páginas locales: 380/380 pruebas comerciales aprobadas. Sin publicación ni envío automático; la auditoría mantiene dos problemas previos de Teclab (ver 39). [Evidencia de Identidad](odd/tasks/seguimientos-identidad.md) y [Siglo 21](docs/historial-pendientes.md#mensajes-siglo21-2026-10-03).
- [ ] **17. Revisar si todavía tenemos acceso a todas las fuentes de las casas**.
- [ ] **18. Revisar las aperturas de las carreras — parcialmente hecho (07/10/2026)**. Verificados los ingresos nominales de marzo, mayo, agosto y octubre a distancia, sujetos a cupo ([fuente oficial](https://21.edu.ar/grado-y-pregrado)). La revisión trata de aperturas de cohortes, no de ingreso a mitad de bimestre. Según información del jefe, algunas carreras se postergan al año siguiente si no reúnen suficientes inscriptos; falta el listado o la circular de aperturas efectivas por carrera para confirmarlo. No se modificaron fechas ni respuestas del bot.
- [ ] **21. Usar el bot de HubSpot de Siglo 21 para extraer más respuestas y procesos administrativos**, por una vía distinta del buscador de carreras.
- [ ] **23. Tomar como referencia al CAU de Corrientes para las publicaciones de Instagram**, especialmente las de Estadística y Análisis Aplicado, que aparentemente tienen éxito.
- [ ] **Verificar si el aviso de Telegram puede mostrar si la persona marcó la suscripción al newsletter**. Revisar si ese dato ya llega al aviso y, si falta, evaluar incorporarlo distinguiendo suscripción aceptada de no aceptada.
- [ ] Verificar el volumen de consultas de WhatsApp tras el cambio de reparto registrado en agosto. *(De las [notas operativas](docs/notas-operativas.md); estado actual sin confirmar.)*

## Infraestructura y seguridad

- [ ] **Completar la recuperación de Supabase: Auth funcional, permisos/RLS, Vault y archivos de Storage**. Al 07/10/2026: respaldo diario cifrado activo en la PC de la sede y restauración real limitada aprobada en Docker aislado; no se verificó seguridad idéntica, porque el ensayo adaptó otorgantes de membresías y dueños de event triggers. Falta comparar con el inventario de origen, recuperar y probar los servicios indicados, guardar una copia cifrada fuera de esta PC y medir la recuperación completa. RPO objetivo de 24 h con interrupciones aceptadas durante días con la PC apagada; RTO objetivo de 4 h para recibir leads, aún no demostrado. [Procedimiento](docs/recuperacion-supabase.md).
- [ ] **Revisar las tareas abiertas en `odd/tasks/`**. Consultar sus avances y comprobaciones antes de darlas por terminadas. [Documentos de tareas](odd/tasks/).

Las siguientes vienen de las [notas operativas](docs/notas-operativas.md); su estado actual no está confirmado:

- [ ] Revisar los PAT de Supabase y retirar únicamente los que ya no se usen.
- [ ] Comprobar si siguen sin uso las credenciales de Resend de este proyecto antes de retirarlas; no tocar las de otros proyectos.
- [ ] Evaluar el endurecimiento menor de SPF de `~all` a `-all` sólo si sigue justificado (prioridad baja).

## Herramientas e inspiración

- [ ] **20. Terminar de revisar el UIverse local**.
- [ ] **26. Revisar los plugins de ChatGPT y Claude**.
- [ ] **28. Revisar distintas tipografías para agregar al UIverse local**.
- [ ] **29. Revisar claude.dev y sus consejos para usar mejor Claude**.
- [ ] **30. Crear una cuenta en Twitter para ver videos de Hipermotion y Remotion y traer inspiración**.

## En espera de información externa

Los pedidos ya redactados y el destino de cada dato están registrados en [las notas operativas](docs/notas-operativas.md). Confirmar que el pedido siga vigente antes de enviarlo.

- [ ] **Confirmar medios de pago del curso de IA de Teclab**. Imágenes publicadas el 30/09 con una ilustración aportada por el usuario. Arancel individual registrado con vigencia hasta el 30/09; no es un precio permanente. [Detalle](docs/pendientes-detalle.md#pendiente-08).
- [ ] **Confirmar becas, doble carrera y las dudas restantes de requisitos** [Detalle](docs/pendientes-detalle.md#pendiente-11).
- [ ] Revisar las decisiones pendientes sobre los módulos de Bienestar Integral y Mindfulness, si siguen dentro del alcance del convenio. *(De las notas operativas; estado sin confirmar.)*

## Documentación de apoyo

- [Rutinas de mantenimiento](docs/rutinas.md): contenido, bot, SEO, fuentes comerciales, leads y verificaciones de deploy. La revisión de indexación y rendimiento (antigua tarea 13) queda como seguimiento permanente, no como tarea cerrable.
- [Detalle de pendientes abiertos](docs/pendientes-detalle.md): mediciones, restricciones, fuentes y pasos originales.
- [Historial de pendientes cerrados](docs/historial-pendientes.md): tareas terminadas y registros anteriores, con su evidencia.
- [Notas y procedimientos operativos](docs/notas-operativas.md): webhook, secretos, correo, incidentes y límites conocidos.

Las notas históricas no reemplazan [los criterios vigentes](docs/criterios.md). Los planes de `docs/plans/` tampoco son el backlog.
