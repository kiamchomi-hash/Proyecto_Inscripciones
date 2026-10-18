# Pendientes

Lista de trabajo para una sola persona. No hace falta trasladarla a otra herramienta. Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

Reordenada el 16/10/2026 por prioridad, juntando esta lista, las tareas abiertas de [`odd/tasks/`](odd/tasks/) y el [detalle de pendientes](docs/pendientes-detalle.md). El orden es: primero lo que ya está hecho y falta publicar o marcar; después lo que hace perder leads o muestra un dato equivocado; después el resto; Teclab ya no tiene prioridad especial (16/10/2026). Los números de los pedidos del 02/10/2026 se conservan para poder referirse a cada tarea.

## 2. Comprobaciones que quedan de tareas ya hechas

Completado el 16/10/2026: límite de correos de «Ver precio», con concurrencia real verificada en dos sesiones y limpieza de la reserva ficticia confirmada. [Evidencia](docs/limite-mails-precio.md#pruebas).

Completado el 16/10/2026: aviso de Teclab probado en producción con datos ficticios; el usuario confirmó en Telegram el enlace de inscripción y la marca de «vio el precio». [Evidencia](docs/historial-pendientes.md#aviso-teclab-telegram-2026-10-16).

## 3. Urgente: leads y precios

Completado el 17/10/2026: imagen de calendario de pagos de Siglo 21, en siete vistas. [Evidencia](docs/historial-pendientes.md#siglo-21--calendario-de-pagos-17102026).


## 5. Siglo 21

Descartado por el usuario el 17/10/2026: **18. Revisar las aperturas de las carreras de 2026**. Ya se está inscribiendo para 2027; la revisión pendiente de 2026 dejó de ser relevante. No implica que las aperturas de 2027 estén verificadas.

## 6. Sitio y diseño

Cerrado el 17/10/2026: la tercera copia de la hoja de estilos en la home no cuesta en el cable; no se parchea Next. [Evidencia](docs/historial-pendientes.md#css-de-la-home--tercera-copia-cerrada-17102026).

Completado el 17/10/2026: flecha hacia abajo en lugar de la barra de scroll en los modales (`d1c7d28`, `components/index/flechas-de-scroll`).

Completado el 17/10/2026: estética de las fichas de Siglo 21 con su sistema visual (`818443e`, publicado). [Evidencia](docs/historial-pendientes.md#sitio--estética-de-las-fichas-de-siglo-21-17102026).

Completado el 18/10/2026: precio dentro del formulario de preinscripción, en Siglo 21 y Teclab, y aclaración de que completarlo no cobra nada (`36d5823`, `2b9fd55`). [Evidencia](docs/historial-pendientes.md#formularios--precio-en-la-preinscripción-18102026).

## 7. Bot, leads y comercial

Completado el 17/10/2026: **14. Mensajes de seguimiento**. Teclab tiene nueve, que rotan en un desplegable del buscador. [Evidencia](docs/historial-pendientes.md#bot--mensajes-de-seguimiento-17102026).

- [ ] **15. Combinar varias respuestas del buscador, separadas por párrafos — parcialmente hecho** (17/10/2026). Implementado localmente y habilitado para Siglo 21, con prueba focal aprobada; versión publicada sin verificar. Se retoma sólo cuando el usuario traiga una pregunta compleja de un lead que lo requiera: comprobar el caso real y ajustar si hace falta, sin extenderlo anticipadamente a otras casas. No es una tarea de ejecución inmediata.

- [ ] **Sumar al corpus del bot las dudas de los leads**. Toda pregunta que llegue por leads y no esté respondida pasa a `ventas/corpus/`.
- [ ] **Automatizar HubSpot**.
Completado el 17/10/2026: **17. Acceso a las fuentes de las casas**. Las tres de precios se actualizaron solas ese día; queda sin confirmar el ingreso con usuario a La Nube 21. [Evidencia](docs/historial-pendientes.md#fuentes-de-las-casas--acceso-revisado-17102026).
Completado el 17/10/2026: **23. Referencia del CAU Corrientes para Instagram**, relevada con capturas en la nota local `notas-locales/referencia-cau-corrientes-instagram/`. [Evidencia](docs/historial-pendientes.md#instagram--referencia-del-cau-corrientes-17102026).
Completado el 17/10/2026: volumen de WhatsApp tras el reparto de agosto, estable desde el arreglo. [Evidencia](docs/historial-pendientes.md#whatsapp--volumen-tras-el-reparto-17102026).

Descartado por el usuario el 17/10/2026: mostrar en el aviso de Telegram si la persona marcó el newsletter. No hace falta ese dato.

## 8. Infraestructura y seguridad

- [ ] **Completar la recuperación de Supabase: Auth funcional, permisos/RLS, Vault y archivos de Storage**. Al 07/10/2026: respaldo diario cifrado activo en la PC de la sede y restauración real limitada aprobada en Docker aislado, sin seguridad idéntica verificada. Falta comparar con el inventario de origen, recuperar y probar esos servicios, guardar una copia cifrada fuera de esta PC y medir la recuperación completa. RPO objetivo 24 h; RTO objetivo 4 h para recibir leads, aún no demostrado. [Procedimiento](docs/recuperacion-supabase.md).
- [ ] **Aplicar las actualizaciones de dependencias** con los overrides mínimos y verificar auditoría, check y build. [Detalle](odd/tasks/auditoria-dependencias.md).
- [ ] **Tipar el contrato de consultas y el detalle de carreras** (A3): filas `TablesInsert` con contratos negativos, y adaptador con validación en runtime para el detalle. [Consultas](odd/tasks/a3-contrato-consultas.md), [detalle](odd/tasks/a3-detalle-carreras.md).
- [ ] **Superficie segura de revisión para el código comercial ignorado** (`descuentos-siglo21-2027` T5), sin exponerlo al repositorio público.
- [ ] Revisar los PAT de Supabase y retirar sólo los que ya no se usen. *(Notas operativas.)*
- [ ] Comprobar si siguen sin uso las credenciales de Resend de este proyecto antes de retirarlas; no tocar las de otros proyectos. *(Notas operativas.)*
- [ ] Evaluar pasar el SPF de `~all` a `-all` sólo si sigue justificado (prioridad baja). *(Notas operativas.)*
- [ ] **Factibilidad de Cloudflare** (prioridad baja): el deploy a workers.dev está frenado a propósito porque OpenNext mete todo `.env.local` en el bundle; requiere un entorno de build sólo con `NEXT_PUBLIC_*`. Falta el informe final. [Detalle](odd/tasks/factibilidad-cloudflare.md).

## 9. Herramientas e inspiración

- [ ] **Crear una herramienta de procesos del CAU**, distinta del buscador de carreras, para consultar los trámites y procesos de la sede.
- [ ] **20. Terminar de revisar el UIverse local**.
- [ ] **Usar la página de los alumnos para sacar elementos estéticos para el UIverse local**.
- [ ] **28. Revisar distintas tipografías para agregar al UIverse local**.
- [ ] **26. Revisar los plugins de ChatGPT y Claude**.
- [ ] **30. Crear una cuenta en Twitter para ver videos de Hipermotion y Remotion y traer inspiración**.

## 10. En espera de información externa

Los pedidos ya redactados y el destino de cada dato están en [las notas operativas](docs/notas-operativas.md) y en `herramientas/pedidos-a-enviar.md`. Confirmar que el pedido siga vigente antes de enviarlo.

- [ ] **Confirmar medios de pago del curso de IA de Teclab**. Arancel individual registrado con vigencia hasta el 30/09; no es un precio permanente. [Detalle](docs/pendientes-detalle.md#pendiente-08).
- [ ] **Confirmar becas, doble carrera y las dudas restantes de requisitos**, que hoy el bot responde con «lo confirmo y te aviso». [Detalle](docs/pendientes-detalle.md#pendiente-11).
- [ ] Revisar las decisiones pendientes sobre los módulos de Bienestar Integral y Mindfulness, si siguen dentro del alcance del convenio. *(Notas operativas; estado sin confirmar.)*

## Al fondo de la cola

Postergado por el usuario el 16/10/2026; se retoma después de los pendientes anteriores.

- [ ] **23/10/2026: primera revisión del embudo del test vocacional** (general y Teclab). Publicado el 16/10/2026 (`e239bc9`). Si hay pocos intentos, ampliar la observación antes de sacar conclusiones; después, mejorar los pasos con mayor caída. [Cómo leerlo](docs/medicion-test-vocacional.md).

- [ ] **Revisar el flujo de inscripción** de punta a punta, en las tres casas.

- [ ] **Reducir el formulario de preinscripción de Siglo 21**. Hoy pide 21 campos copiados de la ficha del portal (`components/formularios/casas.ts`). El usuario define cuáles quedan (16/10/2026); la propuesta es el mínimo de contacto: nombre, apellido, DNI, email, teléfono y localidad. Antes de tocarlo, leer `docs/formularios-por-casa.md`.

- [ ] **Robot de autoinscripción de Teclab: cierres que dependen del usuario** (bajado al fondo el 16/10/2026). El robot ya carga en producción (99000006 y 99000007). Falta: primer login de una cuenta nueva por `/payments/select` (99000003 a 99000005), pedir a Teclab la baja de las cargas 99000001 a 99000007, relevar el aviso que confirma «Enviar link de pago» con una carga autorizada y revisar el primer aviso real en `net._http_response` (`autoinscripcion-teclab` T4, T4c, T5 y T10). [Detalle](odd/tasks/autoinscripcion-teclab.md).

- [ ] **Recorrer el [checklist de alta de carrera](docs/alta-de-carrera.md) con las cinco carreras nuevas** (Gestión de Alimentos, Gestión de Proyectos Mineros, Gestión de Energías Renovables, Gestión Ambiental e Higiene y Seguridad en el Trabajo). Publicadas el 09/10/2026 como «Próximamente» con plan, título y preguntas frecuentes; faltan, entre otros, el precio, la fecha de inicio, el lead a HubSpot y los folletos. Bajado al fondo el 16/10/2026: las carreras todavía no están validadas. [Detalle](odd/tasks/teclab-carreras-proximamente.md).

- [ ] **Empezar a revisar nuevas carreras de Teclab**.

- [ ] **Bloque 4 de carreras nuevas de Teclab**: cuando llegue su capacitación de admisión, darlas de alta como los bloques 2 y 3 (16/10/2026). [Detalle](odd/tasks/teclab-bloques-2-y-3.md).

- [ ] **10. Crear folletos con CTA en el frente y lista de carreras en el dorso**. Empezar por Teclab; después Siglo 21, Identidad Argentina y clases de apoyo.

- [ ] **12. Crear folletos con estilo Siglo 21 y contenido y carreras de Teclab**.

- [ ] **Fichas de carreras de Teclab**: las 20 restantes en versión Siglo, la plantilla `piezas_teclab` y las 21 en versión Teclab. Las fotos de cada carrera las aporta el usuario. [Detalle](odd/tasks/fichas-carreras-teclab.md).

- [ ] **Autoinscripción de Siglo 21: postergada el 16/10/2026**; bajada al fondo el 17/10/2026. Hoy el formulario sólo registra la solicitud y la atención sigue a mano. Antes de retomarla, definir si se hace con un robot en el portal de Siglo 21 (como en Teclab) o con un enlace personalizado.

- [ ] **Imagen de la financiación de Teclab para mandar a los leads**, agregado el 17/10/2026; bajado al fondo por el usuario el 17/10/2026.

- [ ] **21. Usar el bot de HubSpot de Siglo 21 para extraer más respuestas y procesos administrativos**, por una vía distinta del buscador de carreras. Bajado al fondo por el usuario el 17/10/2026: se consultará y completará a medida que surjan casos en el día a día, no como un relevamiento general anticipado.

- [ ] **Aclarar que la cursada es online en casi todos los lugares del sitio** (fichas, modales, formularios, home). Bajado al fondo por el usuario el 17/10/2026.

- [ ] **9. Dar imágenes a todas las carreras**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Imagen OG propia por carrera**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas. Hoy las fichas comparten la genérica de su categoría: por ejemplo, [Tecnicatura Superior en Seguros](https://www.siglo21sur.com/carreras/tecnicatura-superior-en-seguros) usa `/imagenes/og/default-teclab-gestion.jpg` (verificado el 17/10/2026).

- [ ] **1. Incorporar más imágenes de personas**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **6. Mejorar con IA las imágenes de algunos modales de carreras**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **2. Mejorar las páginas de clases y crear sus folletos e imágenes**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **7. Mejorar la página de materias en base a los folletos creados**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **11. Crear un folleto de carreras relevantes**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **8. Rediseñar Identidad Argentina: los modales y la página principal**. Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Revisar el video institucional contra la oferta vigente antes de publicarlo**. [Detalle](docs/pendientes-detalle.md#pendiente-16). Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Línea del tiempo de Siglo 21 para explicar semestres y cuatrimestres** (pieza para leads), agregado el 17/10/2026. **Fija al fondo de la cola**: no se mueve nunca, y lo que se baje al fondo queda arriba de las fijas. Contenido: semestres de enero a junio y de julio a diciembre, cada uno con un cuatrimestre de cursada adentro, de dos bimestres; la matrícula se paga una vez por cuatrimestre. El primer borrador (paso 3, en `contenidos/siglo21/en-curso/2026-10-17-linea-semestres/`) no se entendía: hay que repensar cómo mostrarlo, no retocar ese.

- [ ] **Pasar la carga diaria de precios a la nube**, agregado el 17/10/2026, para no depender de que la PC esté prendida. **Fija al fondo de la cola**: no se mueve nunca, y lo que se baje al fondo queda arriba de las fijas. Hoy corre en la PC con dos timers de systemd (Teclab e Identidad a las 9, Siglo 21 a las 10, reintento a las 14; ver [herramientas](docs/herramientas.md#actualización-diaria-desde-linux)). Antes de elegir dónde, resolver lo que hoy la ata a la máquina: la sesión SharePoint guardada para la planilla de CASA, que Cloudflare bloquea al portal de Teclab desde GitHub (por eso el robot de Teclab usa el runner `pc-sede`) y que la base comercial (`ventas/`, `carreras/`) no está en el repo.

## Documentación de apoyo

- [Rutinas de mantenimiento](docs/rutinas.md): contenido, bot, SEO, fuentes comerciales, leads y verificaciones de deploy. La revisión de indexación y rendimiento (antigua tarea 13) es seguimiento permanente, no tarea cerrable.
- [Detalle de pendientes abiertos](docs/pendientes-detalle.md): mediciones, restricciones, fuentes y pasos originales.
- [Historial de pendientes cerrados](docs/historial-pendientes.md): tareas terminadas y registros anteriores, con su evidencia.- [Notas y procedimientos operativos](docs/notas-operativas.md): webhook, secretos, correo, incidentes y límites conocidos.

Las notas históricas no reemplazan [los criterios vigentes](docs/criterios.md). Los planes de `docs/plans/` tampoco son el backlog.
