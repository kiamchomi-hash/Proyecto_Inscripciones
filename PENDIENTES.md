# Pendientes

Reordenada el 30/10/2026 por prioridad, con el orden marcado por el usuario punto por punto sobre la lista del 16/10/2026. Criterio general: **lo de Teclab manda** —dentro de cada nivel va primero— y es lo único que llega a «alta» por defecto; Siglo 21 e Identidad bajan un escalón salvo que se indique lo contrario. Cada entrada conserva entre paréntesis su número en la lista anterior, para poder seguir refiriéndose a cada tarea como antes.

Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

## Cola de trabajo

La prioridad de esta lista ordena el backlog; la cola ordena qué se propone hacer ahora. Se avanza de a un pendiente: si el usuario dice que no por ahora, no se marca como resuelto ni se cambia su prioridad; se lo baja al final de la cola activa y se propone el siguiente. Si no hay una cola activa explícita, se arma siguiendo el orden de prioridad de esta lista. Al retomar una tarea aplazada, vuelve a su lugar según la prioridad original.

**Aplazados en la cola actual (06/11/2026):**

- Completar el checklist de alta de las tres carreras activas de Teclab (pendiente 4): hoy no.
- Revisar la indexación de Desarrollo de Videojuegos (pendiente 2): hoy no; volver a consultar en unos días.
- Dar imágenes a todas las carreras de Teclab (pendiente 5): bajado al final de la cola.
- Crear folletos de Teclab con CTA al frente y lista de carreras al dorso (pendiente 8): bajado al final de la cola.
- Crear un folleto de carreras relevantes de Teclab (pendiente 9): bajado al final de la cola.

## Altísima

1. **Cargar las otras tres carreras del bloque 4 cuando Teclab las publique** (1.5 y 40): Gestión de IA y Transformación Digital, Diseño y Desarrollo de IA y Comunicación Digital. Al 31/10/2026 no estaban publicadas; usar el material de la presentación (`Descargas/Nuevas carreras Teclab Bloque 4 -.pptx`, 65 diapositivas). Absorbe «Empezar a revisar nuevas carreras de Teclab» (39).

## Alta

Las altas de Teclab van primero; después las demás.

- **Verificar los planes de estudio de todas las carreras** (09/11/2026): comparar materia por materia y cuatrimestre por cuatrimestre los planes publicados en el sitio con las fuentes oficiales de cada institución, registrar diferencias y corregirlas con autorización para escribir en D1. El plan de Matemática de Siglo 21 motivó esta revisión.

2. **Revisar si Google indexó Desarrollo de Videojuegos** (6.1) — Consultar en Search Console las fichas de [Teclab](https://www.siglo21sur.com/carreras/tecnicatura-superior-en-desarrollo-de-videojuegos) y [Siglo 21](https://www.siglo21sur.com/carreras/siglo-21-video-juegos). El 05/11/2026 ambas seguían sin indexar y sin rastreo informado; los estados de detección oscilaron entre «descubierta» y «URL desconocida». Se solicitó manualmente la indexación de las dos y Google confirmó que las agregó a la cola de rastreo prioritaria. **Volver a consultar en unos días**: la solicitud no garantiza la indexación.

4. **Revisar el [checklist de alta de carrera](docs/alta-de-carrera.md) cuando Teclab habilite las pendientes** (38, 20/10/2026). El usuario confirmó el 05/11 que Gestión de Alimentos y Gestión de Energías Renovables todavía no están habilitadas: hacer su alta cuando Teclab las abra, no antes. Revisión parcial del 05/11: Proyectos Mineros, Higiene y Seguridad y Gestión Ambiental están activas, con ficha y página de inscripción (200), perfil en el test de Teclab, imagen OG y precio en D1 vigente hasta el 05/11. La carga a HubSpot se hace a mano; esas tres no están en el mapeo automático, cuyo emisor está desactivado. Falta contrastar los demás puntos aplicables del checklist, incluidos folletos, fechas e indexación. [Detalle histórico](odd/tasks/teclab-carreras-proximamente.md).

5. **Dar imágenes a todas las carreras de Teclab** (46a). [Detalle del pedido original](docs/pendientes-detalle.md).

8. **Crear folletos con CTA al frente y lista de carreras al dorso, empezando por Teclab** (41a).

9. **Crear un folleto de carreras relevantes de Teclab** (52a).

10. **Comparar las fichas de Teclab contra `teclab.edu.ar` y `siglo21online.com.ar/teclab` para mejorar el frontend** (nueva, 30/10/2026). Son dos referencias distintas y se miran las dos: `https://teclab.edu.ar/carrera/<slug>/` es la fuente del contenido (datos, plan, título, salidas, modalidad) y `https://siglo21online.com.ar/teclab` —sitio de GRUPO BTC, no oficial— es el modelo de ficha terminada: cómo arma la página de cada carrera y cómo presenta la marca de Teclab. Donde las dos se contradigan, manda la oficial, y no se copia texto de ninguna. No se sigue el rediseño oficial de punta a punta: lo revisado el 30/10 quedó en el [historial](docs/historial-pendientes.md#teclab--repaso-de-las-fichas-oficiales-30102026). **Aplicado el 31/10/2026**: el botón «Descargar plan de estudios» y el bloque de resoluciones al pie (ver cerradas del 31/10). Lo que queda de este repaso es el plan de estudios plegado por año y la FAQ de 6 a 9 preguntas, que es el pendiente 3.

11. **Revisar el embudo del test vocacional** (33, general y Teclab). **Medición repuesta el 06/11/2026**: desde el corte a Cloudflare el recorrido no se guardaba en ningún lado —la analítica del navegador es local y Vercel ya no existe—, así que la segunda lectura no se podía hacer. Ahora los pasos iniciado, pregunta, completado y salida se cuentan en D1 (`vocacional_embudo`, migración `0014`) y `npm run leads` los muestra por test y por pregunta. Falta que se acumulen intentos: la próxima lectura útil es a partir del 20/11/2026. Primera lectura (16 al 20/10, antes del corte): el general tuvo 14 visitantes, 6 iniciaron, 4 completaron y la caída estaba en las preguntas 1 a 3; el de Teclab no tuvo ninguna visita. La migración `0014` ya está aplicada en producción; falta publicar el código que manda los pasos. [Cómo leerlo](docs/medicion-test-vocacional.md).

12. **Mirar las fichas de `siglo21online.com.ar` para sumar ideas a las páginas de carreras** (6.3, 28/10/2026): es el sitio de GRUPO BTC S.A. (Av. Córdoba 1551, CABA), no el oficial de la universidad, y resuelve la ficha de otra manera. Ejemplo anotado: [Licenciatura en Finanzas](https://siglo21online.com.ar/licenciatura-en-finanzas-detalle/). Lo que se vio ahí y vale evaluar: datos duros arriba y en una línea (duración, modalidad, título, validez con número de resolución), «¿Qué vas a lograr?» con cuatro resultados en tarjetas, comparación explícita de las dos modalidades de cursada (Educación Distribuida y Home) con encuentros y aperturas, plan de estudios plegado por año y cuatrimestre, y un bloque de «más posibilidades» con doble titulación, título intermedio y ámbitos profesionales. El formulario de WhatsApp ya llega con la carrera elegida. Revisar el resto de sus fichas antes de copiar cualquier cosa y decidir qué entra a `cloudflare/` sin inventar condiciones de cursada.

13. **Rediseñar Identidad Argentina: los modales y la página principal** (53). Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo.

14. **Pasar la carga diaria de precios a la nube** (57, 17/10/2026), si es posible: para no depender de que la PC esté prendida. Hoy corre con dos timers de systemd (Teclab e Identidad a las 9, Siglo 21 a las 10, reintento a las 14; ver [herramientas](docs/herramientas.md#actualización-diaria-desde-linux)). Antes de elegir dónde, resolver lo que hoy la ata a la máquina: la sesión SharePoint guardada para la planilla de CASA, que Cloudflare bloquea al portal de Teclab desde GitHub (por eso el robot de Teclab usa el runner `pc-sede`) y que la base comercial (`ventas/`, `carreras/`) no está en el repo.

## Media-alta

16. **Estudiar la venta exitosa de seguros** (19, 28/10/2026): ver cómo se vende un seguro —recorrido del asesor, objeciones, cierre y seguimiento— y qué se puede traer al trato con los leads del CAU.

17. **Revisar si Bienestar Integral y Mindfulness siguen dentro del alcance del convenio** (31). Lo que se cobre por ahí entra como comisión de Identidad.

18. **Reducir el formulario de preinscripción de Siglo 21** (36). Hoy pide 21 campos copiados de la ficha del portal (`components/formularios/casas.ts`). El usuario define cuáles quedan; la propuesta es el mínimo de contacto: nombre, apellido, DNI, email, teléfono y localidad. Antes de tocarlo, leer `docs/formularios-por-casa.md`.

## Media

20. **Enfocar las clases de apoyo de computación en secundario y adultos mayores**, no en universitarios (1): es el público más fuerte y las clases facturan.

23. **Confirmar becas, doble carrera y las dudas restantes de requisitos** (30), que hoy el bot responde con «lo confirmo y te aviso». [Detalle](docs/pendientes-detalle.md#pendiente-11).

24. **Sumar al corpus del bot las dudas de los leads** (18). Pendiente **permanente y a pedido**: cada duda que traiga un lead y no esté respondida pasa a `ventas/corpus/`. Siempre van a aparecer dudas nuevas.

25. **Revisar el flujo de inscripción de Siglo 21** de punta a punta (35b).

26. **Relevar la financiación de Siglo 21 con una preinscripción propia** (37, 19/10/2026). La web de Siglo 21 no publica cuotas, tarjetas ni medios de pago. El usuario hace una preinscripción con su mail y llega hasta la pantalla de pago; se lee sin cargar datos y se sacan tarjetas, cuotas, bancos y medios para armar el mensaje de financiación a los leads. Antes, avisar o marcar como prueba el lead que se genera en HubSpot. Lo que se vea vale para esa carrera y ese momento; las promos bancarias cambian seguido.

27. **Imagen OG propia por carrera en Siglo 21 e Identidad Argentina** (47b, 18/10/2026): hoy siguen con la genérica de su categoría (por ejemplo, Administración usa `/imagenes/og/default.jpg`).

28. **Incorporar más imágenes de personas** (48).

29. **Mejorar con IA las imágenes de algunos modales de carreras** (49).

30. **Mejorar las páginas de clases, con sus folletos e imágenes** (50). Es material del centro educativo; la versión de WhatsApp de los folletos sigue vigente.

31. **Revisar el video institucional contra la oferta vigente antes de publicarlo** (54). [Detalle](docs/pendientes-detalle.md#pendiente-16).

32. **Automatizar HubSpot** (55): pasar a Seguimientos al marcar WhatsApp enviado, mejorar pestañas y agregar contadores rojos de envíos y seguimientos pendientes (19/10/2026). [Detalle](odd/tasks/hubspot-negocios.md).

33. **Línea del tiempo de Siglo 21 para explicar semestres y cuatrimestres** (56, pieza para leads). **Dejó de estar fija al fondo el 30/10/2026.** Contenido: semestres de enero a junio y de julio a diciembre, cada uno con un cuatrimestre de cursada adentro, de dos bimestres; la matrícula se paga una vez por cuatrimestre. El primer borrador (paso 3, en `contenidos/siglo21/en-curso/2026-10-17-linea-semestres/`) no se entendía: hay que repensar cómo mostrarlo, no retocar ese.

## Media-baja

34. **Fichas de carreras de Teclab** (42 y 43 unificadas, 30/10/2026): en 1080×1080, dos versiones por carrera —una con el sistema de `piezas_siglo21` en colores de Teclab y otra con el sistema de `piezas_teclab`—. Faltan las 20 restantes en versión Siglo, la plantilla `piezas_teclab` y las 21 en versión Teclab. Las fotos de cada carrera las aporta el usuario. [Detalle](odd/tasks/fichas-carreras-teclab.md).

35. **Crear una herramienta de procesos del CAU y completar los procesos CAU** (24, 20/10/2026), distinta del buscador de carreras, para consultar los trámites y procesos de la sede.

36. **Entrar al portal de los alumnos y sumar referencias al UIverse local**, incluido usar el SVG de Portal Electrónico (26).

37. **Mejorar la página de materias en base a los folletos creados** (51).

38. **Revisar el flujo de inscripción de Identidad Argentina** de punta a punta (35c).

## Baja

39. **Limpiar la estética «vibecodeada» del sitio** (6, 30/10/2026): hay muchas cosas que se ven claramente hechas por IA. Arreglo inmediato cuando se retome: bordes a la izquierda de las tarjetas, glassmorfismo y frases orientativas dentro de la propia página.

40. **Usar mejor los negocios para la automatización de negocios** (4, 02/10/2026). [Vista de contactos en HubSpot](https://app.hubspot.com/contacts/44080364/objects/0-3/views/recently_assigned/list).

41. **Cargar las fechas del calendario académico 2027 cuando la universidad las publique** (9, 30/10/2026) y a las dos semanas mirar el reparto de `calendario_salidas` por destino. La página ya está publicada y rehecha como ciclo 2027; hoy `lanube.21.edu.ar` sigue mostrando el 2026.

42. **15. Combinar varias respuestas del buscador, separadas por párrafos — parcialmente hecho** (16, 17/10/2026). Implementado localmente y habilitado para Siglo 21, con prueba focal aprobada; versión publicada sin verificar. Se retoma sólo cuando el usuario traiga una pregunta compleja de un lead que lo requiera: comprobar el caso real y ajustar si hace falta, sin extenderlo anticipadamente a otras casas.

43. **Confirmar el ingreso con usuario a La Nube 21** (17). Dato aportado el 30/10/2026: con la cuenta de la asesora principal se puede ingresar a la Nube de un alumno usando el portal administrativo. [Revisión de acceso](docs/historial-pendientes.md#fuentes-de-las-casas--acceso-revisado-17102026).

44. **Ampliar la app de HubSpot** (20, 18/10/2026): cambiar el motivo de calificación (el usuario detallará la regla), mostrar un check junto al enlace de WhatsApp cuando el mensaje se haya enviado y automatizar seguimientos y actividades futuras. Pendiente de definición. [Detalle](odd/tasks/hubspot-negocios.md#pendientes-indicados-por-el-usuario).

45. **HubSpot leads — mejoras de panel y operaciones** (21, 20/10/2026):
    - **Agregar check de WhatsApp**: casilla manual para marcar envío donde falte (ej. en Activity).
    - **Permitir editar el texto del textarea**: retirar el `readonly` de `.activity-texto` para poder editar el mensaje/criterio antes de enviarlo.
    - **Abrir las mesas al hacer clic en el día**: al hacer clic en la fecha/día, desplegar o abrir las mesas asociadas.
    - **Completar los procesos CAU**: incorporar y completar los procesos y trámites administrativos de la sede en la herramienta. [Detalle](odd/tasks/hubspot-negocios.md).

46. **Usar el bot de HubSpot de Siglo 21 para extraer más respuestas y procesos administrativos** (45), por una vía distinta del buscador de carreras: se consulta y completa a medida que surjan casos en el día a día, no como relevamiento general anticipado.

47. **Dar imágenes a todas las carreras de Siglo 21** (46b).

## Ratos muertos

48. **Revisar distintas tipografías para agregar al UIverse local** (27). Es la primera de estas: faltan tipografías.

49. **Terminar de revisar el UIverse local** (25).

50. **Crear una cuenta en Twitter para ver videos de Hipermotion y Remotion y traer inspiración** (29).

51. **Folletos con CTA y lista de carreras para Siglo 21** (41b) — **casi descartada**: nos piden usar sólo el contenido oficial, salvo la versión de WhatsApp.

## Descartadas

Se dejan anotadas para que no vuelvan a aparecer como pendientes.

- **Revisar los plugins de ChatGPT y Claude** (28): el usuario ya trabaja full OpenCode y Hermes.
- **Mostrar el precio dentro del formulario de preinscripción** (34): no se van a poner precios en el formulario. Siglo 21 y Teclab quedan como están.
- **Autoinscripción de Siglo 21** (44): sólo agrega fricción; la atención la maneja el usuario.
- **Folleto de carreras relevantes para Siglo 21 e Identidad** (52b): sólo Teclab.
- **Dar imágenes a las carreras de Identidad Argentina** (46c).

## Cerradas el 06/11/2026

- **Cambiar el botón «Ver horarios» de clases de apoyo** (era la 22): la píldora crema con la flecha en un círculo del color de cada tarjeta ya está publicada con el commit `ad58484`. Verificado el 06/11/2026 en producción: `/_astro/clases-apoyo.gPgviDJL.css` sirve `#fef8f4` y `--ca-card-acento`, y ya no tiene la barra grafito. [Historial](odd/tasks/clases-apoyo-tarjetas.md).

## Cerradas el 05/11/2026

- **Dar de alta las clases de apoyo de secundario** (era la 21): cerrada por decisión del usuario el 05/11/2026. La fila `secundario` de la tabla `materias` en D1 de producción queda como está —`en_construccion = 1`, sin descripción ni fotos—, así que la tarjeta sigue mostrándose como «Próximamente». No hay cambio de código ni de datos.

- **Revisar la inscripción automatizada de Teclab** (era la 7): el usuario confirmó que ya no la usa; la preinscripción llega por Telegram. Pendiente descartado por dejar de aplicar.

- **Mejorar las imágenes OG de Teclab** (era la 6): diseño aprobado con Poppins, título centrado, foto oscurecida para mejorar la lectura y píldoras al pie. Se regeneraron las 24 carreras activas y se actualizó el generador; pruebas y build aprobados. Commit `14dff42` subido; publicación en curso al momento de registrarlo.

- **Cerrar el alta de Comercio Electrónico y Diseño de Producto Digital** (parte de la 1): cargadas el 30/10/2026 en D1 con [`sql/2026-10-30-altas-teclab-bloque4.sql`](sql/2026-10-30-altas-teclab-bloque4.sql), con ficha, foto y plan; el 31/10 se completaron el test vocacional, las resoluciones y la oferta del bot. El 05/11 se verificó que ambas tienen precio en `carreras/teclab/carreras-externas.json` y aparecen en el desplegable de carrera del formulario de [HubSpot](https://vinculacion.teclab.edu.ar/expo-bs-as-esposito). El listado visible de la landing sigue desactualizado; no se envió el formulario.
- **Completar las preguntas frecuentes de Gestión Ambiental y Desarrollo de Videojuegos** (era la 3): se agregaron cuatro preguntas a cada ficha en D1, con autorización, conservando las dos anteriores. Verificado en la base y en ambas páginas publicadas: seis por carrera. [Fuentes](referencias/2026-11-05-faq-ambiental-videojuegos.md).
- **Revisar la presentación RSP + exámenes libres de Teclab** (era la 19): revisadas las 34 diapositivas y sus imágenes; el contenido y las referencias por diapositiva quedaron en `ventas/procesos-teclab.html`, buscador local autocontenido. La presentación lo identifica como piloto inicial 2027 y deja puntos por definir; su vigencia queda en [seguimiento de Teclab](docs/rutinas.md#teclab).

## Cerradas el 04/11/2026

- **Agregar Geist y Geist Serif al UIverse local** (era la 15): ambas muestras ya estaban en la categoría Tipografías. El 04/11 se comprobó que la biblioteca lee las dos y que sus fuentes externas responden correctamente.

## Cerradas el 02/11/2026

- **La carga diaria de precios de Siglo 21 fallaba por un 401 de wrangler, sin reintento.** Las dos corridas del 02/11 (10:00 y 14:00) cortaron en la primera consulta a D1 con `Authentication error [code: 10000]` y la base quedó con los precios del 01/11, que vencían esa misma noche. La causa está en la sesión de wrangler, no en el publicador: cuando renueva el token OAuth, la primera llamada puede volver 401 y la siguiente, con el mismo token guardado, responde 200 —15 casos entre el 27/10 y el 02/11, todos precedidos por `grant_type=refresh_token`—. Arreglado con `herramientas/d1-wrangler.mjs`, una única puerta a `wrangler d1 execute` que reintenta sólo ese fallo y los 5xx y cortes de red (esperas de 5 s a 4 min), usada por el publicador de precios y por `npm run db:d1`, y que además informa la causa real: el aviso del journal quedaba cortado en `Command failed: … --command SEL` por el recorte a 220 caracteres. Republicados los 67 precios de Siglo 21 el 02/11 a las 14:57 con lectura de vuelta verificada. `tests/d1-wrangler.test.mjs` cubre qué se reintenta y qué no.

## Cerradas el 31/10/2026

- **Reparto de resoluciones de Programación y Gestión Contable** (era la 4): el usuario definió el 31/10/2026 que **manda lo que publica Teclab** —Resolución 2127/22 + Dictamen 2662/22 para Programación y 2357/22 + 2657/22 para Gestión Contable—, aunque el Boletín Oficial de CABA apruebe el plan de Programación con el Dictamen 2.657/22. No se espera más confirmación de Secretaría Académica: los números se citan como los publica el instituto y quedaron versionados en `components/index/resoluciones-teclab.ts` (copia de `carreras/teclab/resoluciones-teclab.json`, que no está en el repo). `tests/resoluciones-teclab.test.mjs` compara las dos cuando el JSON está en el disco, así que al regrabarlo el sitio no queda atrás.
- **Descarga del plan de estudios en las fichas de Teclab**: botón «Descargar plan de estudios» al lado del título del plan. **Baja el programa oficial de Teclab** —24 PDFs en `public/planes/teclab/`, 16 MB, copiados de `carreras/teclab/pdfs/`, los mismos que el bot adjunta por WhatsApp— cuando existe; en las anunciadas que Teclab todavía no publicó, arma uno con el plan de la página (`lib/plan-pdf.ts`, el mismo que usa el modal de Siglo 21). La lista está en `components/index/planes-teclab.ts` y `tests/planes-teclab.test.mjs` cuida que no sobre ni falte ningún archivo. Probado el 31/10/2026: el enlace sirve `application/pdf` de 807 KB con `diseno-de-producto-digital.pdf`, y una anunciada sigue mostrando el botón que lo arma en el navegador.
- **Borrar la clave `Onboarding` en el panel de Resend** (era la 1): la borró el usuario el 31/10/2026 y `api-keys` quedó sin claves. No hacía falta nada más en el código: `RESEND_API_KEY` no existe en el repo ni en el Worker, y los otros restos (la variable de Vercel y el secreto de Supabase) se habían retirado el 18/10/2026.

## Cerradas el 30/10/2026

- **Flechas raras en los modales de carreras** (2): solucionado; ya no aparecen la flecha de abajo ni el reemplazo de las flechas de bimestre y año en desktop.
- **«Otras carreras» en clases de apoyo** (3): solucionado. La carga del apoyo de secundario pasó a la lista activa y se cerró sin alta el 05/11/2026.
- **Cuotas y cargos de los otros medios de pago de Teclab** (7): confirmado que MercadoPago, PagoFácil y Rapipago son 1 pago, sin cuotas.
- **Logos de `/teclab`** (12b): corregidos.

## Documentación de apoyo

- **Pedidos a la universidad y a Teclab**: los ya redactados y el destino de cada dato están en [las notas operativas](docs/notas-operativas.md) y en `herramientas/pedidos-a-enviar.md`. Confirmar que el pedido siga vigente antes de enviarlo.

- [Rutinas de mantenimiento](docs/rutinas.md): contenido, bot, SEO, fuentes comerciales, leads y verificaciones de deploy. La revisión de indexación y rendimiento (antigua tarea 13) es seguimiento permanente, no tarea cerrable.
- [Detalle de pendientes abiertos](docs/pendientes-detalle.md): mediciones, restricciones, fuentes y pasos originales.
- [Historial de pendientes cerrados](docs/historial-pendientes.md): tareas terminadas y registros anteriores, con su evidencia.
- [Notas y procedimientos operativos](docs/notas-operativas.md): webhook, secretos, correo, incidentes y límites conocidos.

Las notas históricas no reemplazan [los criterios vigentes](docs/criterios.md).
