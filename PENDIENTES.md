# Pendientes

Lista de trabajo para una sola persona. No hace falta trasladarla a otra herramienta. Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

Reordenada el 16/10/2026 por prioridad, juntando esta lista, las tareas abiertas de [`odd/tasks/`](odd/tasks/) y el [detalle de pendientes](docs/pendientes-detalle.md). El orden es: primero lo que ya está hecho y falta publicar o marcar; después lo que hace perder leads o muestra un dato equivocado; después Teclab (prioridad vigente), Siglo 21 y el resto. Los números de los pedidos del 02/10/2026 se conservan para poder referirse a cada tarea.

## 1. Seguimiento de lo publicado

- [ ] **23/10/2026: primera revisión del embudo del test vocacional** (general y Teclab). Publicado el 16/10/2026 (`e239bc9`). Si hay pocos intentos, ampliar la observación antes de sacar conclusiones; después, mejorar los pasos con mayor caída. [Cómo leerlo](docs/medicion-test-vocacional.md).

## 2. Comprobaciones que quedan de tareas ya hechas

Completado el 16/10/2026: límite de correos de «Ver precio», con concurrencia real verificada en dos sesiones y limpieza de la reserva ficticia confirmada. [Evidencia](docs/limite-mails-precio.md#pruebas).

- [ ] **Mirar un aviso real de Teclab en Telegram**: que traiga el enlace de inscripción y la marca de «vio el precio». `notificar` está desplegada desde el 09/10/2026; sólo falta verlo con un lead real. [Enlace](odd/tasks/autoinscripcion-teclab.md), [marca](odd/tasks/priorizar-leads-que-vieron-precio.md).

## 3. Urgente: leads y precios

- [ ] **Mostrar el precio dentro de los pasos del formulario de preinscripción** (para más adelante). Hoy «Quiero inscribirme» (modales, ficha y mail) lleva directo al formulario sin pasar por el precio. La idea es que uno de los pasos del formulario muestre el precio de la carrera elegida, como los pasos que ya tiene Teclab. En los modales están bien los dos botones, «Ver precio» y WhatsApp; eso no se toca (aclarado el 16/10/2026).
- [ ] **Revisar el flujo de inscripción** de punta a punta, en las tres casas.
- [ ] **Reducir el formulario de preinscripción de Siglo 21**. Hoy pide 21 campos copiados de la ficha del portal (`components/formularios/casas.ts`). El usuario define cuáles quedan (16/10/2026); la propuesta es el mínimo de contacto: nombre, apellido, DNI, email, teléfono y localidad. Antes de tocarlo, leer `docs/formularios-por-casa.md`.

## 4. Teclab

### Web y formularios

- [ ] **Revisar con el usuario la newsletter**: qué se guarda, el consentimiento y la casilla marcada por defecto (`ver-precio-teclab` T10). Después, definir cada cuántos días sale y cómo es la baja (`mail-precio-teclab` T5).
- [ ] **Robot de autoinscripción**: modo de prueba sin tocar el portal, prueba real autorizada con cuenta nueva y aviso por Telegram si falla (`autoinscripcion-teclab` T4, T4c, T5 y T10). [Detalle](odd/tasks/autoinscripcion-teclab.md).
- [ ] **Completar `.env.example`** con las variables de mail (`mail-precio-teclab` T3).

### Carreras

- [ ] **Recorrer el [checklist de alta de carrera](docs/alta-de-carrera.md) con las cinco carreras nuevas** (Gestión de Alimentos, Gestión de Proyectos Mineros, Gestión de Energías Renovables, Gestión Ambiental e Higiene y Seguridad en el Trabajo). Publicadas el 09/10/2026 como «Próximamente» con plan, título y preguntas frecuentes; faltan, entre otros, el precio, la fecha de inicio, el lead a HubSpot y los folletos. [Detalle](odd/tasks/teclab-carreras-proximamente.md).
- [ ] **Empezar a revisar nuevas carreras de Teclab**.

### Folletos y piezas

- [ ] **10. Crear folletos con CTA en el frente y lista de carreras en el dorso**. Empezar por Teclab; después Siglo 21, Identidad Argentina y clases de apoyo.
- [ ] **12. Crear folletos con estilo Siglo 21 y contenido y carreras de Teclab**.
- [ ] **Fichas de carreras de Teclab**: las 20 restantes en versión Siglo, la plantilla `piezas_teclab` y las 21 en versión Teclab. Las fotos de cada carrera las aporta el usuario. [Detalle](odd/tasks/fichas-carreras-teclab.md).

### Comercial

- [ ] **Reunir en un archivo local todos los procesos de preinscripción de Teclab**, con pasos y requisitos. Fuera del repositorio público si tiene información interna.

## 5. Siglo 21

- [ ] **Autoinscripción de Siglo 21: postergada el 16/10/2026**. Hoy el formulario sólo registra la solicitud y la atención sigue a mano. Antes de retomarla, definir si se hace con un robot en el portal de Siglo 21 (como en Teclab) o con un enlace personalizado.
- [ ] **Publicar las cinco altas de carreras de la home** (`altas-cinco-carreras-home-siglo21` T2): payloads preparados; falta la transacción remota, comprobar las cinco páginas y las capturas.
- [ ] **Pulir el FAQ de Procurador, Gestión Contable y Seguros y revisar los textos de la cabecera** (`seo-tres-fichas` T5 y T6). Contrastar la introducción con la `descripcion` previa al 05/10/2026 (respaldo en `notas-locales/seo-tres-fichas/estado-previo.json`).
- [ ] **3. Mejorar el mensaje de aranceles**.
- [ ] **18. Revisar las aperturas de las carreras**, parcialmente hecho el 07/10/2026. Verificados los ingresos nominales de marzo, mayo, agosto y octubre a distancia, sujetos a cupo ([fuente oficial](https://21.edu.ar/grado-y-pregrado)). Falta el listado o la circular de aperturas efectivas por carrera, porque algunas se postergan al año siguiente si no reúnen inscriptos.
- [ ] **21. Usar el bot de HubSpot de Siglo 21 para extraer más respuestas y procesos administrativos**, por una vía distinta del buscador de carreras.

## 6. Sitio y diseño

- [ ] **Aclarar que la cursada es online en casi todos los lugares del sitio** (fichas, modales, formularios, home).
- [ ] **5. Mostrar la fecha de inicio y el mensaje «Todavía estás a tiempo de inscribirte» en todas las carreras**, según la vigencia de cada inscripción.
- [ ] **Corregir las páginas de Computación**.
- [ ] **15. Permitir que una pregunta del buscador de carreras se responda combinando varias respuestas**, separadas por párrafos.
- [ ] **9. Dar imágenes a todas las carreras**.
- [ ] **1. Incorporar más imágenes de personas**.
- [ ] **6. Mejorar con IA las imágenes de algunos modales de carreras**.
- [ ] **2. Mejorar las páginas de clases y crear sus folletos e imágenes**.
- [ ] **7. Mejorar la página de materias en base a los folletos creados**.
- [ ] **11. Crear un folleto de carreras relevantes**.
- [ ] **8. Rediseñar Identidad Argentina: los modales y la página principal**. Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo.
- [ ] **Revisar el video institucional contra la oferta vigente antes de publicarlo**. [Detalle](docs/pendientes-detalle.md#pendiente-16).
- [ ] **La hoja de estilos viaja tres veces en el HTML de la home** y la documentación de Next promete dos (medido el 28/08/2026 con Next 16.3.0). [Detalle](docs/pendientes-detalle.md#pendiente-02).

## 7. Bot, leads y comercial

- [ ] **Sumar al corpus del bot las dudas de los leads**. Toda pregunta que llegue por leads y no esté respondida pasa a `ventas/corpus/`.
- [ ] **14. Crear más mensajes de seguimiento que complementen al primero**. Siglo 21 tiene segundo seguimiento desde el 03/10/2026; Teclab, primero y segundo; Identidad, ambos desde el 07/10/2026 (380/380 pruebas comerciales). Falta verificar la suite y regenerar los HTML de Identidad (`seguimientos-identidad` T2). Sin publicación ni envío automático. [Identidad](odd/tasks/seguimientos-identidad.md), [Siglo 21](docs/historial-pendientes.md#mensajes-siglo21-2026-10-03).
- [ ] **Verificar si el aviso de Telegram puede mostrar si la persona marcó la suscripción al newsletter**, distinguiendo aceptada de no aceptada.
- [ ] **Automatizar HubSpot**.
- [ ] **17. Revisar si todavía tenemos acceso a todas las fuentes de las casas**.
- [ ] **23. Tomar como referencia al CAU de Corrientes para las publicaciones de Instagram**, sobre todo las de Estadística y Análisis Aplicado.
- [ ] Verificar el volumen de consultas de WhatsApp tras el cambio de reparto de agosto. *(De las [notas operativas](docs/notas-operativas.md); estado sin confirmar.)*

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

## Documentación de apoyo

- [Rutinas de mantenimiento](docs/rutinas.md): contenido, bot, SEO, fuentes comerciales, leads y verificaciones de deploy. La revisión de indexación y rendimiento (antigua tarea 13) es seguimiento permanente, no tarea cerrable.
- [Detalle de pendientes abiertos](docs/pendientes-detalle.md): mediciones, restricciones, fuentes y pasos originales.
- [Historial de pendientes cerrados](docs/historial-pendientes.md): tareas terminadas y registros anteriores, con su evidencia.- [Notas y procedimientos operativos](docs/notas-operativas.md): webhook, secretos, correo, incidentes y límites conocidos.

Las notas históricas no reemplazan [los criterios vigentes](docs/criterios.md). Los planes de `docs/plans/` tampoco son el backlog.
