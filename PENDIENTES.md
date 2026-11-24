# Pendientes

Reordenada el 30/10/2026 por prioridad, con el orden marcado por el usuario punto por punto sobre la lista del 16/10/2026. Criterio general: **lo de Teclab manda** —dentro de cada nivel va primero— y es lo único que llega a «alta» por defecto; Siglo 21 e Identidad bajan un escalón salvo que se indique lo contrario. Cada entrada conserva entre paréntesis su número en la lista anterior, para poder seguir refiriéndose a cada tarea como antes.

Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

## Cola de trabajo

La prioridad de esta lista ordena el backlog; la cola ordena qué se propone hacer ahora. Se avanza de a un pendiente: si el usuario dice que no por ahora, no se marca como resuelto ni se cambia su prioridad; se lo baja al final de la cola activa y se propone el siguiente. Si no hay una cola activa explícita, se arma siguiendo el orden de prioridad de esta lista. Al retomar una tarea aplazada, vuelve a su lugar según la prioridad original.

**Aplazados en la cola actual (20/11/2026):**

- Dar imágenes a todas las carreras de Teclab (pendiente 5): bajado al final de la cola.
- Crear folletos de Teclab con CTA al frente y lista de carreras al dorso (pendiente 8): bajado al final de la cola.
- Crear un folleto de carreras relevantes de Teclab (pendiente 9): bajado al final de la cola.
- Cargar Diseño y Desarrollo de IA y Comunicación Digital (pendiente 1): **Diseño y Desarrollo de IA cargado el 20/11/2026** (id 251, con el alta de Administración de Negocios Digitales Financieros, id 252) tras confirmarlo el asesor; sigue pendiente Comunicación Digital, esperar a que Teclab la publique. Quedan sin precio y sin resolución las dos del 20/11.
- Completar la FAQ de las carreras de Teclab (pendiente 3): al final de la cola; requiere trabajar bien las keywords y se espera a contar con un modelo de confianza para redactarlas.

**Reservados para Claude Code (20/11/2026, revisado el 22/11/2026):** los pendientes 5, 8, 9 y 14 se dejan para cuando el usuario tenga Claude; no se abordan desde OpenCode. Siguen en su nivel de prioridad original.

## Alta

Las altas de Teclab van primero; después las demás.

4. **Mejorar los modales de Teclab** (22/11/2026): prioridad alta, pidieron atenderlos antes que el resto. Tienen errores que todavía no se enumeraron; primero relevarlos en escritorio y celular en las páginas donde aparecen y anotarlos acá antes de tocar nada.

4b. **Modificar el frontend de los `/slugs` de carreras de Teclab** (22/11/2026): sobre todo el **plan de estudio** y el **test vocacional** en las fichas de cada carrera. Relevar primero en escritorio y celular antes de tocar nada.

5. **Dar imágenes a todas las carreras de Teclab** (46a). [Detalle del pedido original](docs/pendientes-detalle.md).

8. **Crear folletos con CTA al frente y lista de carreras al dorso, empezando por Teclab** (41a).

9. **Crear un folleto de carreras relevantes de Teclab** (52a).

10. **Migrar las carreras de Teclab a un dominio propio** (20/11/2026): el plan está en [`docs/plans/2026-11-20-migracion-teclab-dominio-propio.md`](docs/plans/2026-11-20-migracion-teclab-dominio-propio.md). Se hace de a una carrera por deploy, con 301 desde `siglo21sur.com`, canónicas y sitemap por host, sin tocar Siglo 21 ni las páginas `/teclab`, `/teclab/inscripcion` y `/teclab/test-vocacional`. El plan asume `teclab-lugano.com`: hay que confirmar el nombre antes de empezar. La Tarea 5 (compra del dominio, zona en Cloudflare, token y Turnstile) requiere autorización explícita y pasos del usuario.

14. **Rediseñar Identidad Argentina: los modales y la página principal** (53). Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo.

## Media

- **Ampliar la sección de Excel en las clases de apoyo de Computación** (19/11/2026): sumar funciones lógicas (`Y`, `O`, `SI`, `SI` con `Y` y con `O`) y búsquedas (`BUSCARV`, `INDICE`, `COINCIDIR` e `INDICE` con `COINCIDIR`). Falta retomar el diseño y decidirlo antes de implementar; la vista previa temporal se canceló.

- **Continuar la revisión estética del sitio** (19/11/2026): revisar la portada, la página de cada carrera y los modales de Teclab en escritorio y celular.

- **Modificar la parte del modal del precio** (22/11/2026): pendiente de relevamiento; todavía no se enumeró qué cambiar.

20. **Enfocar las clases de apoyo de computación en secundario y adultos mayores**, no en universitarios (1): es el público más fuerte y las clases facturan.

23. **Confirmar becas, doble carrera y las dudas restantes de requisitos** (30), que hoy el bot responde con «lo confirmo y te aviso». [Detalle](docs/pendientes-detalle.md#pendiente-11).

25. **Revisar el flujo de inscripción de Siglo 21** de punta a punta (35b).

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

- **Cargar las otras carreras del bloque 4 cuando Teclab las publique** (1.5 y 40; bajada de Altísima a Baja el 20/11/2026 y movida a la última posición de Baja el 20/11/2026): Diseño y Desarrollo de IA y Comunicación Digital. Al 31/10/2026 no estaban publicadas; usar el material de la presentación (`Descargas/Nuevas carreras Teclab Bloque 4 -.pptx`, 65 diapositivas). Gestión de IA y Transformación Digital se publicó el 16/11/2026 y cotizó el 18/11/2026. Absorbe «Empezar a revisar nuevas carreras de Teclab» (39). Sigue al final de la cola activa, a la espera de que Teclab las publique.

- **Completar la FAQ de las carreras de Teclab** (pendiente 3; movida al final de Baja el 20/11/2026): llevar las preguntas frecuentes de cada ficha de 3 o 5 a 6-9, con contenido de `teclab.edu.ar` reescrito con palabras propias. Relevadas las 25 fichas oficiales y anotado qué falta en cada una en [`referencias/2026-11-20-faq-teclab-revision.md`](referencias/2026-11-20-faq-teclab-revision.md): 22 carreras necesitan preguntas, 3 ya cumplen el piso, y QA, Gestión Hotelera, Inbound Marketing y Customer Experience tienen un techo de 5 en la fuente oficial. Quedan afuera becas, sueldos y campañas. **Aplazado a pedido del usuario**: depende de trabajar bien las keywords y prefiere esperar a un modelo de confianza para redactarlas. No se escribió nada en D1.

## Ratos muertos

49. **Terminar de revisar el UIverse local** (25).

50. **Crear una cuenta en Twitter para ver videos de Hipermotion y Remotion y traer inspiración** (29).

51. **Folletos con CTA y lista de carreras para Siglo 21** (41b) — **casi descartada**: nos piden usar sólo el contenido oficial, salvo la versión de WhatsApp.

## Descartadas

Se dejan anotadas para que no vuelvan a aparecer como pendientes.

- **Relevar la financiación de Siglo 21 con una preinscripción propia** (26, 37; descartada el 24/11/2026): de Siglo 21 se encarga otra persona, así que no se relevan cuotas, tarjetas ni medios de pago desde acá. La financiación se maneja por WhatsApp.

- **Pasar la carga diaria de precios a la nube** (57; descartada el 20/11/2026): el usuario ya no quiere tenerla online. La carga sigue en la PC con los timers de systemd actuales.

- **Estudiar la venta exitosa de seguros** (16, 19; descartada el 20/11/2026): el usuario dice que no es necesario.

- **Revisar si Bienestar Integral y Mindfulness siguen dentro del alcance del convenio** (17, 31; descartada el 20/11/2026): ya no le interesa al usuario.

- **Revisar los plugins de ChatGPT y Claude** (28): el usuario ya trabaja full OpenCode y Hermes.
- **Mostrar el precio dentro del formulario de preinscripción** (34): no se van a poner precios en el formulario. Siglo 21 y Teclab quedan como están.
- **Autoinscripción de Siglo 21** (44): sólo agrega fricción; la atención la maneja el usuario.
- **Folleto de carreras relevantes para Siglo 21 e Identidad** (52b): sólo Teclab.
- **Dar imágenes a las carreras de Identidad Argentina** (46c).

- **Mirar las fichas de `siglo21online.com.ar` para sumar ideas a las páginas de carreras** (6.3; descartada el 22/11/2026 a pedido del usuario): se retira sin incorporar ideas de ese sitio a las fichas. No confundir con la revisión de las fichas de Teclab contra `siglo21online.com.ar/teclab` (pendiente 11), cerrada el 21/11/2026 con el diferimiento del CSS del formulario.

## Cerradas el 06/11/2026

## Cerradas el 21/11/2026

- **Revisar distintas tipografías para agregar al UIverse local** (48, 27): cerrada con evidencia. Se agregaron seis familias a `biblioteca/mias/`: JetBrains Mono, IBM Plex Mono, Literata, Newsreader, Atkinson Hyperlegible y Lexend. Todas son SIL Open Font License 1.1, verificada una por una en el `OFL.txt` del repo oficial de Google Fonts; ninguna permite exigir pago. Syne se descartó a pedido del usuario. Lexend, la favorita, quedó marcada en `biblioteca/estado.json` y su espécimen muestra la escalera de pesos 300–700 en vez de un solo párrafo. Verificado con `leerMias()`, que indexa las seis, y en la galería local: 17 tipografías, con el botón de favorita de Lexend en `aria-pressed=true`.

- **Comparar las fichas de Teclab contra `teclab.edu.ar` y `siglo21online.com.ar/teclab` para mejorar el frontend** (11): cerrada con evidencia. Se aplicó el diferimiento del CSS del formulario en las fichas (`b097904` y `625ec44`). Verificado en producción: 6 hojas en el `<head>`, sin `formulario-lead.css`, `npm run smoke` todo verde y workflow `Verificaciones` exitoso.

## Cerradas el 20/11/2026

- **Reducir el formulario de preinscripción de Siglo 21** (18, 36): cerrada con evidencia. El commit `89d5bc0` bajó la preinscripción de 21 a 11 campos en `components/formularios/casas.ts`: quedan tipoDocumento, dni, apellido, nombre, email, fechaNacimiento, nacionalidad, sexo, estadoCivil, lugarNacimiento y telefono; se retiraron los del domicilio, país de residencia y localidad. El recorte efectivo conserva los datos que pide el portal en lugar del mínimo de contacto que se proponía. [Detalle](docs/historial-pendientes.md#preinscripción-de-siglo-21-y-descartes-20112026).

- **Revisar la indexación de Desarrollo de Videojuegos** (pendiente 2): cerrada con evidencia ya asentada el 15/11 en el [historial](docs/historial-pendientes.md#indexación--desarrollo-de-videojuegos-15112026) y reconfirmada el 20/11 con `npm run seo -- --inspeccion=` sobre las dos URLs vigentes: `/carreras/siglo-21-video-juegos` y `/carreras/tecnicatura-superior-en-desarrollo-de-videojuegos` dan `PASS` / «Enviada e indexada», `robots ALLOWED` y canónica de Google coincidente con cada URL (último rastreo 15/11 y 08/11 respectivamente). La URL antigua `/carreras/tecnicatura-en-videojuegos` sigue dando «Google no reconoce esta URL», pero es un 301 y no es la ficha vigente. La línea de aplazados estaba desactualizada; se retira de la cola. [Evidencia](referencias/2026-11-20-indexacion-videojuegos.md).

- **Actualizar el folleto de carreras de Teclab para que refleje la oferta vigente de 25 tecnicaturas** (revisión del checklist, 19/11): cerrada con evidencia. Se agregó Gestión de Inteligencia Artificial y Transformación Digital —que en D1 figura en `Teclab - Tecnología`— a la lista de WhatsApp. El nombre completo no cabe en una fila, así que se parte en dos y la pieza pasó de 1080×1350 a 1080×1427; el generador calcula el alto y el botón y el pie bajan con las filas. Verificado: 25 filas, sin desbordes ni solapes. La fuente, la verificación y la captura quedaron juntas en `contenidos/teclab/aprobados/generales/whatsapp/2026-09-25-lista-carreras-whatsapp/`. Se actualizó también el webp del sitio y la dimensión que espera el carrusel. [Evidencia](referencias/2026-11-19-checklist-teclab-tres-carreras.md).

- **Verificar los planes de estudio de todas las carreras** (09/11/2026): cerrada con evidencia. Se cotejaron las 25 tecnicaturas de Teclab contra `teclab.edu.ar` y las 69 carreras de Siglo 21 contra `21.edu.ar` ([evidencia](referencias/2026-11-20-planes-siglo21.md)). En Teclab se encontraron y publicaron cinco correcciones (`sql/2026-11-20-corregir-planes-teclab.sql`); en Siglo 21 no hubo cambios de materias. Las dos diferencias que aparecieron en un primer pasaje automático eran un error del extractor, descartado contra D1 antes de escribir. Queda fuera de alcance Identidad Argentina, cuyos planes se rehicieron el 09/11 desde los programas oficiales.
- **Revisar el embudo del test vocacional** (12): cerrada con la primera lectura útil, 14 días después de repuesta la medición. `npm run leads -- --dias=15` y una consulta directa a `vocacional_embudo` mostraron eventos del 06/11 al 20/11: 17 iniciados y 9 completados (52,9%) en el general, con la caída repartida entre las preguntas 1 a 10 en lugar del escalón en las primeras tres de la lectura anterior; en Teclab, 2 iniciados y 2 completados, muestra demasiado chica para concluir. La nota que decía que faltaba publicar el emisor quedó desactualizada: los datos prueban que está publicado y acumulando desde el 06/11. [Detalle](docs/historial-pendientes.md#embudo-del-test-vocacional-20112026).

## Cerradas el 19/11/2026

- **Completar la revisión del checklist de alta para Proyectos Mineros, Higiene y Seguridad y Gestión Ambiental**: cerrada con evidencia y límites de verificación asentados en el [historial](docs/historial-pendientes.md#checklist-de-alta-de-tres-carreras-de-teclab-19112026). Los seguimientos concretos quedaron separados.

- **Alinear los títulos de las tarjetas y las descripciones de título**: completado.

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
