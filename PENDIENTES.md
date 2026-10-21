# Pendientes

Lista de trabajo para una sola persona. No hace falta trasladarla a otra herramienta. Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

Reordenada el 16/10/2026 por prioridad, juntando esta lista, las tareas abiertas de [`odd/tasks/`](odd/tasks/) y el [detalle de pendientes](docs/pendientes-detalle.md). El orden es: primero lo que ya está hecho y falta publicar o marcar; después lo que hace perder leads o muestra un dato equivocado; después el resto; Teclab ya no tiene prioridad especial (16/10/2026). Los números de los pedidos del 02/10/2026 se conservan para poder referirse a cada tarea.

## 2. Comprobaciones que quedan de tareas ya hechas

Completado el 16/10/2026: límite de correos de «Ver precio», con concurrencia real verificada en dos sesiones y limpieza de la reserva ficticia confirmada. [Evidencia](docs/limite-mails-precio.md#pruebas).

Completado el 16/10/2026: aviso de Teclab probado en producción con datos ficticios; el usuario confirmó en Telegram el enlace de inscripción y la marca de «vio el precio». [Evidencia](docs/historial-pendientes.md#aviso-teclab-telegram-2026-10-16).

## 3. Urgente: leads y precios

Completado el 17/10/2026: imagen de calendario de pagos de Siglo 21, en siete vistas. [Evidencia](docs/historial-pendientes.md#siglo-21--calendario-de-pagos-17102026).


## 5. Siglo 21

- [ ] **Revisar parciales en carreras cuatrimestrales y bimestrales** (20/10/2026):
  - **Carreras cuatrimestrales** (Abogacía, Contador, Licenciatura en Informática): regla de un parcial por cuatrimestre.
  - **Carreras bimestrales**: regla de un parcial por bimestre.
  - Contrastar contra el corpus y respuestas (`ventas/corpus/siglo21.json`), que hoy describen dos parciales por materia.

Descartado por el usuario el 17/10/2026: **18. Revisar las aperturas de las carreras de 2026**. Ya se está inscribiendo para 2027; la revisión pendiente de 2026 dejó de ser relevante. No implica que las aperturas de 2027 estén verificadas.

## 6. Sitio y diseño

Cerrado el 17/10/2026: la tercera copia de la hoja de estilos en la home no cuesta en el cable; no se parchea Next. [Evidencia](docs/historial-pendientes.md#css-de-la-home--tercera-copia-cerrada-17102026).

Completado el 17/10/2026: flecha hacia abajo en lugar de la barra de scroll en los modales (`d1c7d28`, `components/index/flechas-de-scroll`).

Completado el 17/10/2026: estética de las fichas de Siglo 21 con su sistema visual (`818443e`, publicado). [Evidencia](docs/historial-pendientes.md#sitio--estética-de-las-fichas-de-siglo-21-17102026).

Completado el 18/10/2026: la cursada online, a la vista en fichas, home, modales y formulario. [Evidencia](docs/historial-pendientes.md#sitio--cursada-online-a-la-vista-18102026).

## 7. Bot, leads y comercial

Completado el 17/10/2026: **14. Mensajes de seguimiento**. Teclab tiene nueve, que rotan en un desplegable del buscador. [Evidencia](docs/historial-pendientes.md#bot--mensajes-de-seguimiento-17102026).

- [ ] **15. Combinar varias respuestas del buscador, separadas por párrafos — parcialmente hecho** (17/10/2026). Implementado localmente y habilitado para Siglo 21, con prueba focal aprobada; versión publicada sin verificar. Se retoma sólo cuando el usuario traiga una pregunta compleja de un lead que lo requiera: comprobar el caso real y ajustar si hace falta, sin extenderlo anticipadamente a otras casas. No es una tarea de ejecución inmediata.

- [ ] **Sumar al corpus del bot las dudas de los leads**. Toda pregunta que llegue por leads y no esté respondida pasa a `ventas/corpus/`.
- [ ] **Ampliar la app de HubSpot** (18/10/2026): cambiar el motivo de calificación (el usuario detallará la regla), mostrar un check junto al enlace de WhatsApp cuando el mensaje se haya enviado y automatizar seguimientos y actividades futuras. Pendiente de definición; no ejecutar todavía. [Detalle](odd/tasks/hubspot-negocios.md#pendientes-indicados-por-el-usuario).
- [ ] **HubSpot leads — mejoras de panel y operaciones** (20/10/2026):
  - **Agregar check de WhatsApp**: casilla manual para marcar envío donde falte (ej. en Activity).
  - **Permitir editar el texto del textarea**: retirar el `readonly` de `.activity-texto` para poder editar el mensaje/criterio antes de enviarlo.
  - **Abrir las mesas al hacer clic en el día**: al hacer clic en la fecha/día, desplegar o abrir las mesas asociadas.
  - **Completar los procesos CAU**: incorporar y completar los procesos y trámites administrativos de la sede en la herramienta. [Detalle](odd/tasks/hubspot-negocios.md).
Completado el 20/10/2026: **imagen de la financiación de Teclab** para WhatsApp, en versión clara y oscura, con los datos del simulador (`contenidos/teclab/aprobados/generales/whatsapp/2026-10-20-financiacion-teclab/`). Si el simulador cambia, se rehace.
Descartado el 20/10/2026: cierres del robot de Teclab con las cuentas de prueba 99000001 a 99000007 (no se incluyen) y medios de pago del curso de IA de Teclab (para siempre).
Completado el 20/10/2026: **formulario de Teclab**. El código postal deja de bloquear la preinscripción, como en el portal (`CASAS.teclab.opcionales`); el resto de los campos sí los exige.
Completado el 17/10/2026: **17. Acceso a las fuentes de las casas**. Las tres de precios se actualizaron solas ese día; queda sin confirmar el ingreso con usuario a La Nube 21. [Evidencia](docs/historial-pendientes.md#fuentes-de-las-casas--acceso-revisado-17102026).
Completado el 17/10/2026: **23. Referencia del CAU Corrientes para Instagram**, relevada con capturas en la nota local `notas-locales/referencia-cau-corrientes-instagram/`. [Evidencia](docs/historial-pendientes.md#instagram--referencia-del-cau-corrientes-17102026).
Completado el 17/10/2026: volumen de WhatsApp tras el reparto de agosto, estable desde el arreglo. [Evidencia](docs/historial-pendientes.md#whatsapp--volumen-tras-el-reparto-17102026).

Descartado por el usuario el 17/10/2026: mostrar en el aviso de Telegram si la persona marcó el newsletter. No hace falta ese dato.

## 8. Infraestructura y seguridad

Completado el 18/10/2026: **tipar el contrato de consultas y el detalle de carreras** (A3; `bc593a0`, `ad52917`), con check y build completos. [Evidencia](docs/historial-pendientes.md#tipos--contrato-de-consultas-y-detalle-de-carreras-18102026).
Descartado por el usuario el 16/10/2026: **superficie segura de revisión para el código comercial ignorado** (`descuentos-siglo21-2027` T5). La revisión nativa está apagada a nivel global, así que no hace falta. [Detalle](odd/tasks/descuentos-siglo21-2027.md).
Completado el 18/10/2026: PAT de Supabase revisados; queda sólo el del CLI de Linux y se borró el de Windows. [Detalle](docs/notas-operativas.md).
- [ ] **Correr `sql/2026-10-21_endurecer_storage_y_policies.sql` en el SQL Editor** (21/10/2026). Cierra el único hallazgo accionable de los Advisors: cualquier cuenta con mail confirmado podía subir y borrar las imágenes del bucket `novedades`, porque las dos policies de storage sólo miraban `bucket_id`. Incluye las policies de precios, el EXECUTE de las funciones de trigger y tres policies de INSERT muertas. `cau_editor` no alcanza `storage` ni `auth`, así que va por el dashboard. [Bitácora](docs/seguridad.md#21102026-dependencias-node-y-una-pasada-por-la-base).
- [ ] **Revisar en Auth → Attack Protection** la protección de contraseñas filtradas, el vencimiento de OTP y el MFA (21/10/2026). No se pueden leer desde SQL ni con la anon key; quedaron fuera de la revisión del 21/10.
- [ ] **Borrar la clave `Onboarding` en el panel de Resend** (la hace el usuario; no tocar `topykly-dev`). El resto se retiró el 18/10/2026: sin uso en el código, ya no estaba en Vercel y se borró el secreto de Supabase. *(Notas operativas.)*
Descartado por el usuario el 18/10/2026: pasar el SPF de `~all` a `-all`. Con DMARC en `reject` no suma y agrega un riesgo silencioso. [Criterio](docs/criterios.md#el-spf-se-queda-en-all).
Cerrado el 18/10/2026: **factibilidad de Cloudflare**. Es viable, pero no se migra por ahora: ahorra poco y arriesga seguridad y medición. [Criterio](docs/criterios.md#no-se-migra-de-vercel-a-cloudflare-workers-por-ahora).

## 9. Herramientas e inspiración

- [ ] **Crear una herramienta de procesos del CAU y completar los procesos CAU** (20/10/2026), distinta del buscador de carreras, para consultar los trámites y procesos de la sede.
- [ ] **20. Terminar de revisar el UIverse local**.
- [ ] **Usar la página de los alumnos para sacar elementos estéticos para el UIverse local**.
- [ ] **28. Revisar distintas tipografías para agregar al UIverse local**.
- [ ] **26. Revisar los plugins de ChatGPT y Claude**.
- [ ] **30. Crear una cuenta en Twitter para ver videos de Hipermotion y Remotion y traer inspiración**.

## 10. En espera de información externa

Los pedidos ya redactados y el destino de cada dato están en [las notas operativas](docs/notas-operativas.md) y en `herramientas/pedidos-a-enviar.md`. Confirmar que el pedido siga vigente antes de enviarlo.

- [ ] **Confirmar becas, doble carrera y las dudas restantes de requisitos**, que hoy el bot responde con «lo confirmo y te aviso». [Detalle](docs/pendientes-detalle.md#pendiente-11).
- [ ] Revisar las decisiones pendientes sobre los módulos de Bienestar Integral y Mindfulness, si siguen dentro del alcance del convenio. *(Notas operativas; estado sin confirmar.)*
- [ ] **Cerrar las 5 alertas altas de `braces`** (GHSA-vfj7-8cjw-p6xm), en espera de un arreglo publicado. Sólo entra en desarrollo, por `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` 3.3.1 → `micromatch`; no llega al sitio. Sharp, source-map-js y el watcher ya se actualizaron (`96e2e78`). Al 18/10/2026 ni Next 16.4.2 ni el canary 16.5 cambiaron `fast-glob`, y el alias a tinyglobby rompe el plugin. Revisar cuando salga una versión nueva de Next. [Detalle](odd/tasks/auditoria-dependencias.md).

## Al fondo de la cola

Postergado por el usuario el 16/10/2026; se retoma después de los pendientes anteriores.

- [ ] **06/11/2026: segunda revisión del embudo del test vocacional** (general y Teclab). Primera lectura el 20/10/2026 (16 al 20/10): el general tuvo 14 visitantes, 6 iniciaron, 4 completaron; la caída está en las preguntas 1 a 3 y después nadie abandona. El de Teclab no tuvo ninguna visita. Muestra demasiado chica para tocar pasos; si sigue en cero, revisar cómo se llega al de Teclab. [Cómo leerlo](docs/medicion-test-vocacional.md).

- [ ] **Mostrar el precio dentro de los pasos del formulario de preinscripción — parcialmente hecho** (18/10/2026). Hecho y publicado en Siglo 21 y Teclab, con la aclaración de que completarlo no cobra nada (`36d5823`, `2b9fd55`; [detalle](docs/historial-pendientes.md#formularios--precio-en-la-preinscripción-18102026)). Falta Identidad Argentina, que todavía no publica precio en el sitio.

- [ ] **Revisar el flujo de inscripción** de punta a punta, en las tres casas.

- [ ] **Reducir el formulario de preinscripción de Siglo 21**. Hoy pide 21 campos copiados de la ficha del portal (`components/formularios/casas.ts`). El usuario define cuáles quedan (16/10/2026); la propuesta es el mínimo de contacto: nombre, apellido, DNI, email, teléfono y localidad. Antes de tocarlo, leer `docs/formularios-por-casa.md`.

- [ ] **Relevar la financiación de Siglo 21 con una preinscripción propia** (19/10/2026). La web de Siglo 21 no publica cuotas, tarjetas ni medios de pago, así que no se puede repetir lo de Teclab (extraer las tarjetas de la página). El usuario hace una preinscripción con su mail y llega hasta la pantalla de pago; Claude la lee sin cargar datos y saca tarjetas, cuotas, bancos y medios de pago para armar el mensaje de financiación a los leads. Antes, avisar o marcar como prueba el lead que se genera en HubSpot. Lo que se vea vale para esa carrera y ese momento; las promos bancarias cambian seguido.

- [ ] **Recorrer el [checklist de alta de carrera](docs/alta-de-carrera.md) con las cinco carreras nuevas** (Gestión de Alimentos, Gestión de Proyectos Mineros, Gestión de Energías Renovables, Gestión Ambiental e Higiene y Seguridad en el Trabajo). Publicadas el 09/10/2026 como «Próximamente» con plan, título y preguntas frecuentes; faltan, entre otros, el precio, la fecha de inicio, el lead a HubSpot y los folletos. Bajado al fondo el 16/10/2026: las carreras todavía no están validadas. [Detalle](odd/tasks/teclab-carreras-proximamente.md).

- [ ] **Empezar a revisar nuevas carreras de Teclab**.

- [ ] **Bloque 4 de carreras nuevas de Teclab**: cuando llegue su capacitación de admisión, darlas de alta como los bloques 2 y 3 (16/10/2026). [Detalle](odd/tasks/teclab-bloques-2-y-3.md).

- [ ] **10. Crear folletos con CTA en el frente y lista de carreras en el dorso**. Empezar por Teclab; después Siglo 21, Identidad Argentina y clases de apoyo.

- [ ] **12. Crear folletos con estilo Siglo 21 y contenido y carreras de Teclab**.

- [ ] **Fichas de carreras de Teclab**: las 20 restantes en versión Siglo, la plantilla `piezas_teclab` y las 21 en versión Teclab. Las fotos de cada carrera las aporta el usuario. [Detalle](odd/tasks/fichas-carreras-teclab.md).

- [ ] **Autoinscripción de Siglo 21: postergada el 16/10/2026**; bajada al fondo el 17/10/2026. Hoy el formulario sólo registra la solicitud y la atención sigue a mano. Antes de retomarla, definir si se hace con un robot en el portal de Siglo 21 (como en Teclab) o con un enlace personalizado.

- [ ] **21. Usar el bot de HubSpot de Siglo 21 para extraer más respuestas y procesos administrativos**, por una vía distinta del buscador de carreras. Bajado al fondo por el usuario el 17/10/2026: se consultará y completará a medida que surjan casos en el día a día, no como un relevamiento general anticipado.

- [ ] **9. Dar imágenes a todas las carreras**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Imagen OG propia por carrera — parcialmente hecho** (18/10/2026). Hecho en Teclab: las 31 carreras y cursos tienen la suya, con su foto y su nombre (`npm run og:teclab`). Faltan Siglo 21 e Identidad Argentina, que siguen con la genérica de su categoría (por ejemplo, Administración usa `/imagenes/og/default.jpg`).

- [ ] **1. Incorporar más imágenes de personas**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **6. Mejorar con IA las imágenes de algunos modales de carreras**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **2. Mejorar las páginas de clases y crear sus folletos e imágenes**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **7. Mejorar la página de materias en base a los folletos creados**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **11. Crear un folleto de carreras relevantes**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **8. Rediseñar Identidad Argentina: los modales y la página principal**. Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Revisar el video institucional contra la oferta vigente antes de publicarlo**. [Detalle](docs/pendientes-detalle.md#pendiente-16). Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Automatizar HubSpot**. Pendientes propios separados: pasar a Seguimientos al marcar WhatsApp enviado, mejorar pestañas y agregar contadores rojos de envíos/seguimientos pendientes (19/10/2026). Bajado al fondo por el usuario el 18/10/2026. [Detalle](odd/tasks/hubspot-negocios.md).

- [ ] **Completar la recuperación de Supabase: Auth funcional, permisos/RLS, Vault y archivos de Storage**. Al 07/10/2026: respaldo diario cifrado activo en la PC de la sede y restauración real limitada aprobada en Docker aislado, sin seguridad idéntica verificada. Falta comparar con el inventario de origen, recuperar y probar esos servicios, guardar una copia cifrada fuera de esta PC y medir la recuperación completa. RPO objetivo 24 h; RTO objetivo 4 h para recibir leads, aún no demostrado. [Procedimiento](docs/recuperacion-supabase.md). En curso con otra IA; bajado al fondo por el usuario el 18/10/2026.

- [ ] **Línea del tiempo de Siglo 21 para explicar semestres y cuatrimestres** (pieza para leads), agregado el 17/10/2026. **Fija al fondo de la cola**: no se mueve nunca, y lo que se baje al fondo queda arriba de las fijas. Contenido: semestres de enero a junio y de julio a diciembre, cada uno con un cuatrimestre de cursada adentro, de dos bimestres; la matrícula se paga una vez por cuatrimestre. El primer borrador (paso 3, en `contenidos/siglo21/en-curso/2026-10-17-linea-semestres/`) no se entendía: hay que repensar cómo mostrarlo, no retocar ese.

- [ ] **Pasar la carga diaria de precios a la nube**, agregado el 17/10/2026, para no depender de que la PC esté prendida. **Fija al fondo de la cola**: no se mueve nunca, y lo que se baje al fondo queda arriba de las fijas. Hoy corre en la PC con dos timers de systemd (Teclab e Identidad a las 9, Siglo 21 a las 10, reintento a las 14; ver [herramientas](docs/herramientas.md#actualización-diaria-desde-linux)). Antes de elegir dónde, resolver lo que hoy la ata a la máquina: la sesión SharePoint guardada para la planilla de CASA, que Cloudflare bloquea al portal de Teclab desde GitHub (por eso el robot de Teclab usa el runner `pc-sede`) y que la base comercial (`ventas/`, `carreras/`) no está en el repo.

## Documentación de apoyo

- [Rutinas de mantenimiento](docs/rutinas.md): contenido, bot, SEO, fuentes comerciales, leads y verificaciones de deploy. La revisión de indexación y rendimiento (antigua tarea 13) es seguimiento permanente, no tarea cerrable.
- [Detalle de pendientes abiertos](docs/pendientes-detalle.md): mediciones, restricciones, fuentes y pasos originales.
- [Historial de pendientes cerrados](docs/historial-pendientes.md): tareas terminadas y registros anteriores, con su evidencia.- [Notas y procedimientos operativos](docs/notas-operativas.md): webhook, secretos, correo, incidentes y límites conocidos.

Las notas históricas no reemplazan [los criterios vigentes](docs/criterios.md). Los planes de `docs/plans/` tampoco son el backlog.
