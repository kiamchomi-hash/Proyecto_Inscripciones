# Pendientes

Reordenada el 30/10/2026 por prioridad, con el orden marcado por el usuario punto por punto sobre la lista del 16/10/2026. Criterio general: **lo de Teclab manda** —dentro de cada nivel va primero— y es lo único que llega a «alta» por defecto; Siglo 21 e Identidad bajan un escalón salvo que se indique lo contrario. Cada entrada conserva entre paréntesis su número en la lista anterior, para poder seguir refiriéndose a cada tarea como antes.

Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

## Altísima

1. **Borrar la clave `Onboarding` en el panel de Resend** (8.1). La hace el usuario; no tocar `topykly-dev`. El resto se retiró el 18/10/2026: sin uso en el código, ya no estaba en Vercel y se borró el secreto de Supabase.

2. **Cerrar el alta de las dos carreras del bloque 4 que ya son oficiales** (1.5 y 40, 30/10/2026). **Comercio Electrónico (e-commerce)** (id 248) y **Diseño de Producto Digital** (id 249) se cargaron el 30/10/2026 con [`sql/2026-10-30-altas-teclab-bloque4.sql`](sql/2026-10-30-altas-teclab-bloque4.sql): fila en D1, ficha oficial en `FICHAS` con su foto, tipo de Gestión y categoría de Tecnología. Falta **el precio** (Teclab todavía no lo pasó), la opción de HubSpot, el perfil del test vocacional de e-commerce y las resoluciones (Dictámenes 3390/26 y 3391/26). Las otras tres de la presentación —Gestión de IA y Transformación Digital, Diseño y Desarrollo de IA y Comunicación Digital— **no están publicadas por Teclab**: se cargan cuando abran, con el material de la presentación (`Descargas/Nuevas carreras Teclab Bloque 4 -.pptx`, 65 diapositivas). Absorbe «Empezar a revisar nuevas carreras de Teclab» (39).

## Alta

Las altas de Teclab van primero; después las demás.

3. **Revisar si Google indexó Desarrollo de Videojuegos** (6.1) — Teclab y Siglo 21: consultar en Search Console las fichas publicadas —[Teclab](https://www.siglo21sur.com/carreras/tecnicatura-superior-en-desarrollo-de-videojuegos) y [Siglo 21](https://www.siglo21sur.com/carreras/siglo-21-video-juegos)—. Revisado el 29/10/2026: las dos siguen **desconocidas para Google, sin rastreo**, y las dos responden 200, están en `sitemap.xml` y enlazadas desde `/` y `/teclab`. La última lectura del sitemap por Google fue el 28/10 a las 19:20, anterior a la publicación, así que todavía no las vio; no hay nada roto. Falta pedir la indexación a mano en Search Console (API no lo permite) y volver a mirar en unos días.

4. **Completar las preguntas frecuentes de Gestión Ambiental (246) y Desarrollo de Videojuegos (247)** (6.5, 30/10/2026): las dos tienen **2 preguntas frecuentes** donde el resto de las carreras de Teclab tiene entre 3 y 6, así que la ficha cierra más corta. El resto de las fichas quedó al día contra el sitio oficial. [Enlaces consultados](referencias/2026-10-30-fichas-oficiales-teclab.md).

5. **Confirmar con Teclab el reparto de resoluciones de Programación y Gestión Contable** (7.1, 28/10/2026): el sitio publica Resolución 2127/22 + Dictamen 2662/22 para Programación y 2357/22 + 2657/22 para Gestión Contable, pero el Boletín Oficial de CABA (Res. 2357/MEDGC/22, 16/05/2022) aprueba el plan de la Tecnicatura Superior en Programación en virtud del Dictamen 2.657/22. Los números ya están en el corpus (`carreras/teclab/resoluciones-teclab.json`, marcador `{resoluciones}`); falta que Secretaría Académica confirme cuál corresponde antes de citarlos para un trámite. **Verificado el 30/10/2026 en las dos fichas oficiales:** siguen publicando lo mismo, así que el desacuerdo con el Boletín sigue abierto del lado de Teclab.

6. **Recorrer el [checklist de alta de carrera](docs/alta-de-carrera.md) con las cinco carreras nuevas** (38, 20/10/2026): Gestión de Alimentos, Gestión de Proyectos Mineros, Gestión de Energías Renovables, Gestión Ambiental e Higiene y Seguridad en el Trabajo. Publicadas el 09/10/2026 como «Próximamente» con plan, título y preguntas frecuentes; faltan, entre otros, el precio, la fecha de inicio, el lead a HubSpot y los folletos. [Detalle](odd/tasks/teclab-carreras-proximamente.md).

7. **Dar imágenes a todas las carreras de Teclab** (46a). [Detalle del pedido original](docs/pendientes-detalle.md).

8. **Imagen OG propia por carrera: mejorar las de Teclab** (47a, 18/10/2026). Las 31 carreras y cursos ya tienen la suya, con su foto y su nombre (`npm run og:teclab`); falta mejorarlas.

9. **Revisar el flujo de inscripción de Teclab** de punta a punta (35a).

10. **Crear folletos con CTA al frente y lista de carreras al dorso, empezando por Teclab** (41a).

11. **Crear un folleto de carreras relevantes de Teclab** (52a).

12. **Comparar las fichas de Teclab contra `teclab.edu.ar` y `siglo21online.com.ar/teclab` para mejorar el frontend** (nueva, 30/10/2026). Son dos referencias distintas y se miran las dos: `https://teclab.edu.ar/carrera/<slug>/` es la fuente del contenido (datos, plan, título, salidas, modalidad) y `https://siglo21online.com.ar/teclab` —sitio de GRUPO BTC, no oficial— es el modelo de ficha terminada: cómo arma la página de cada carrera y cómo presenta la marca de Teclab. Donde las dos se contradigan, manda la oficial, y no se copia texto de ninguna. No se sigue el rediseño oficial de punta a punta: lo revisado el 30/10 quedó en el [historial](docs/historial-pendientes.md#teclab--repaso-de-las-fichas-oficiales-30102026).

13. **06/11/2026: segunda revisión del embudo del test vocacional** (33, general y Teclab). Primera lectura el 20/10/2026 (16 al 20/10): el general tuvo 14 visitantes, 6 iniciaron, 4 completaron; la caída está en las preguntas 1 a 3 y después nadie abandona. El de Teclab no tuvo ninguna visita. Muestra demasiado chica para tocar pasos; si sigue en cero, revisar cómo se llega al de Teclab. [Cómo leerlo](docs/medicion-test-vocacional.md).

14. **Mirar las fichas de `siglo21online.com.ar` para sumar ideas a las páginas de carreras** (6.3, 28/10/2026): es el sitio de GRUPO BTC S.A. (Av. Córdoba 1551, CABA), no el oficial de la universidad, y resuelve la ficha de otra manera. Ejemplo anotado: [Licenciatura en Finanzas](https://siglo21online.com.ar/licenciatura-en-finanzas-detalle/). Lo que se vio ahí y vale evaluar: datos duros arriba y en una línea (duración, modalidad, título, validez con número de resolución), «¿Qué vas a lograr?» con cuatro resultados en tarjetas, comparación explícita de las dos modalidades de cursada (Educación Distribuida y Home) con encuentros y aperturas, plan de estudios plegado por año y cuatrimestre, y un bloque de «más posibilidades» con doble titulación, título intermedio y ámbitos profesionales. El formulario de WhatsApp ya llega con la carrera elegida. Revisar el resto de sus fichas antes de copiar cualquier cosa y decidir qué entra a `cloudflare/` sin inventar condiciones de cursada.

15. **Rediseñar Identidad Argentina: los modales y la página principal** (53). Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo.

16. **Pasar la carga diaria de precios a la nube** (57, 17/10/2026), si es posible: para no depender de que la PC esté prendida. Hoy corre con dos timers de systemd (Teclab e Identidad a las 9, Siglo 21 a las 10, reintento a las 14; ver [herramientas](docs/herramientas.md#actualización-diaria-desde-linux)). Antes de elegir dónde, resolver lo que hoy la ata a la máquina: la sesión SharePoint guardada para la planilla de CASA, que Cloudflare bloquea al portal de Teclab desde GitHub (por eso el robot de Teclab usa el runner `pc-sede`) y que la base comercial (`ventas/`, `carreras/`) no está en el repo.

17. **Agregar Geist y Geist Serif a las tipografías del UIverse local** (nueva, 30/10/2026).

## Media-alta

18. **Estudiar la venta exitosa de seguros** (19, 28/10/2026): ver cómo se vende un seguro —recorrido del asesor, objeciones, cierre y seguimiento— y qué se puede traer al trato con los leads del CAU.

19. **Revisar si Bienestar Integral y Mindfulness siguen dentro del alcance del convenio** (31). Lo que se cobre por ahí entra como comisión de Identidad.

20. **Reducir el formulario de preinscripción de Siglo 21** (36). Hoy pide 21 campos copiados de la ficha del portal (`components/formularios/casas.ts`). El usuario define cuáles quedan; la propuesta es el mínimo de contacto: nombre, apellido, DNI, email, teléfono y localidad. Antes de tocarlo, leer `docs/formularios-por-casa.md`.

## Media

21. **Revisar la presentación RSP + exámenes libres de Teclab** (15b, 28/10/2026): `Descargas/PRESENTACION RSP + EXAMENES LIBRES TECLAB - 2026 (1).pptx`. Es la presentación más reciente que queda en el disco; las tres de «Capacitación de admisión» de los bloques 1 a 3 se usaron el 16/10 y ya no están.

22. **Enfocar las clases de apoyo de computación en secundario y adultos mayores**, no en universitarios (1): es el público más fuerte y las clases facturan.

23. **Dar de alta las clases de apoyo de secundario**, con contenido genérico enfocado a Villa Lugano (nueva, 30/10/2026; surge del punto 3).

24. **Cambiar el botón «Ver horarios» de clases de apoyo** (13, 29/10/2026): es el pie de cada tarjeta de la landing, `components/clases-apoyo/clases-apoyo-landing.tsx` (`.ca-materia-accion`, hoy una superficie grafito sólida con texto blanco y flecha). Falta que el usuario diga qué quiere. El historial de lo que ya se cambió en ese botón y en las tarjetas está en [`odd/tasks/clases-apoyo-tarjetas.md`](odd/tasks/clases-apoyo-tarjetas.md).

25. **Confirmar becas, doble carrera y las dudas restantes de requisitos** (30), que hoy el bot responde con «lo confirmo y te aviso». [Detalle](docs/pendientes-detalle.md#pendiente-11).

26. **Sumar al corpus del bot las dudas de los leads** (18). Pendiente **permanente y a pedido**: cada duda que traiga un lead y no esté respondida pasa a `ventas/corpus/`. Siempre van a aparecer dudas nuevas.

27. **Revisar el flujo de inscripción de Siglo 21** de punta a punta (35b).

28. **Relevar la financiación de Siglo 21 con una preinscripción propia** (37, 19/10/2026). La web de Siglo 21 no publica cuotas, tarjetas ni medios de pago. El usuario hace una preinscripción con su mail y llega hasta la pantalla de pago; se lee sin cargar datos y se sacan tarjetas, cuotas, bancos y medios para armar el mensaje de financiación a los leads. Antes, avisar o marcar como prueba el lead que se genera en HubSpot. Lo que se vea vale para esa carrera y ese momento; las promos bancarias cambian seguido.

29. **Imagen OG propia por carrera en Siglo 21 e Identidad Argentina** (47b, 18/10/2026): hoy siguen con la genérica de su categoría (por ejemplo, Administración usa `/imagenes/og/default.jpg`).

30. **Incorporar más imágenes de personas** (48).

31. **Mejorar con IA las imágenes de algunos modales de carreras** (49).

32. **Mejorar las páginas de clases, con sus folletos e imágenes** (50). Es material del centro educativo; la versión de WhatsApp de los folletos sigue vigente.

33. **Revisar el video institucional contra la oferta vigente antes de publicarlo** (54). [Detalle](docs/pendientes-detalle.md#pendiente-16).

34. **Automatizar HubSpot** (55): pasar a Seguimientos al marcar WhatsApp enviado, mejorar pestañas y agregar contadores rojos de envíos y seguimientos pendientes (19/10/2026). [Detalle](odd/tasks/hubspot-negocios.md).

35. **Línea del tiempo de Siglo 21 para explicar semestres y cuatrimestres** (56, pieza para leads). **Dejó de estar fija al fondo el 30/10/2026.** Contenido: semestres de enero a junio y de julio a diciembre, cada uno con un cuatrimestre de cursada adentro, de dos bimestres; la matrícula se paga una vez por cuatrimestre. El primer borrador (paso 3, en `contenidos/siglo21/en-curso/2026-10-17-linea-semestres/`) no se entendía: hay que repensar cómo mostrarlo, no retocar ese.

## Media-baja

36. **Fichas de carreras de Teclab** (42 y 43 unificadas, 30/10/2026): en 1080×1080, dos versiones por carrera —una con el sistema de `piezas_siglo21` en colores de Teclab y otra con el sistema de `piezas_teclab`—. Faltan las 20 restantes en versión Siglo, la plantilla `piezas_teclab` y las 21 en versión Teclab. Las fotos de cada carrera las aporta el usuario. [Detalle](odd/tasks/fichas-carreras-teclab.md).

37. **Crear una herramienta de procesos del CAU y completar los procesos CAU** (24, 20/10/2026), distinta del buscador de carreras, para consultar los trámites y procesos de la sede.

38. **Entrar al portal de los alumnos y sacar elementos estéticos para el UIverse local** (26).

39. **Mejorar la página de materias en base a los folletos creados** (51).

40. **Revisar el flujo de inscripción de Identidad Argentina** de punta a punta (35c).

## Baja

41. **Limpiar la estética «vibecodeada» del sitio** (6, 30/10/2026): hay muchas cosas que se ven claramente hechas por IA. Arreglo inmediato cuando se retome: bordes a la izquierda de las tarjetas, glassmorfismo y frases orientativas dentro de la propia página.

42. **Usar mejor los negocios para la automatización de negocios** (4, 02/10/2026). [Vista de contactos en HubSpot](https://app.hubspot.com/contacts/44080364/objects/0-3/views/recently_assigned/list).

43. **Cargar las fechas del calendario académico 2027 cuando la universidad las publique** (9, 30/10/2026) y a las dos semanas mirar el reparto de `calendario_salidas` por destino. La página ya está publicada y rehecha como ciclo 2027; hoy `lanube.21.edu.ar` sigue mostrando el 2026.

44. **15. Combinar varias respuestas del buscador, separadas por párrafos — parcialmente hecho** (16, 17/10/2026). Implementado localmente y habilitado para Siglo 21, con prueba focal aprobada; versión publicada sin verificar. Se retoma sólo cuando el usuario traiga una pregunta compleja de un lead que lo requiera: comprobar el caso real y ajustar si hace falta, sin extenderlo anticipadamente a otras casas.

45. **Confirmar el ingreso con usuario a La Nube 21** (17). Dato aportado el 30/10/2026: con la cuenta de la asesora principal se puede ingresar a la Nube de un alumno usando el portal administrativo. [Revisión de acceso](docs/historial-pendientes.md#fuentes-de-las-casas--acceso-revisado-17102026).

46. **Ampliar la app de HubSpot** (20, 18/10/2026): cambiar el motivo de calificación (el usuario detallará la regla), mostrar un check junto al enlace de WhatsApp cuando el mensaje se haya enviado y automatizar seguimientos y actividades futuras. Pendiente de definición. [Detalle](odd/tasks/hubspot-negocios.md#pendientes-indicados-por-el-usuario).

47. **HubSpot leads — mejoras de panel y operaciones** (21, 20/10/2026):
    - **Agregar check de WhatsApp**: casilla manual para marcar envío donde falte (ej. en Activity).
    - **Permitir editar el texto del textarea**: retirar el `readonly` de `.activity-texto` para poder editar el mensaje/criterio antes de enviarlo.
    - **Abrir las mesas al hacer clic en el día**: al hacer clic en la fecha/día, desplegar o abrir las mesas asociadas.
    - **Completar los procesos CAU**: incorporar y completar los procesos y trámites administrativos de la sede en la herramienta. [Detalle](odd/tasks/hubspot-negocios.md).

48. **Usar el bot de HubSpot de Siglo 21 para extraer más respuestas y procesos administrativos** (45), por una vía distinta del buscador de carreras: se consulta y completa a medida que surjan casos en el día a día, no como relevamiento general anticipado.

49. **Dar imágenes a todas las carreras de Siglo 21** (46b).

## Ratos muertos

50. **Revisar distintas tipografías para agregar al UIverse local** (27). Es la primera de estas: faltan tipografías.

51. **Terminar de revisar el UIverse local** (25).

52. **Crear una cuenta en Twitter para ver videos de Hipermotion y Remotion y traer inspiración** (29).

53. **Folletos con CTA y lista de carreras para Siglo 21** (41b) — **casi descartada**: nos piden usar sólo el contenido oficial, salvo la versión de WhatsApp.

## Descartadas

Se dejan anotadas para que no vuelvan a aparecer como pendientes.

- **Revisar los plugins de ChatGPT y Claude** (28): el usuario ya trabaja full OpenCode y Hermes.
- **Mostrar el precio dentro del formulario de preinscripción** (34): no se van a poner precios en el formulario. Siglo 21 y Teclab quedan como están.
- **Autoinscripción de Siglo 21** (44): sólo agrega fricción; la atención la maneja el usuario.
- **Folleto de carreras relevantes para Siglo 21 e Identidad** (52b): sólo Teclab.
- **Dar imágenes a las carreras de Identidad Argentina** (46c).

## Cerradas el 30/10/2026

- **Flechas raras en los modales de carreras** (2): solucionado; ya no aparecen la flecha de abajo ni el reemplazo de las flechas de bimestre y año en desktop.
- **«Otras carreras» en clases de apoyo** (3): solucionado. La carga del apoyo de secundario es la tarea 23.
- **Cuotas y cargos de los otros medios de pago de Teclab** (7): confirmado que MercadoPago, PagoFácil y Rapipago son 1 pago, sin cuotas.
- **Logos de `/teclab`** (12b): corregidos.

## Documentación de apoyo

- **Pedidos a la universidad y a Teclab**: los ya redactados y el destino de cada dato están en [las notas operativas](docs/notas-operativas.md) y en `herramientas/pedidos-a-enviar.md`. Confirmar que el pedido siga vigente antes de enviarlo.

- [Rutinas de mantenimiento](docs/rutinas.md): contenido, bot, SEO, fuentes comerciales, leads y verificaciones de deploy. La revisión de indexación y rendimiento (antigua tarea 13) es seguimiento permanente, no tarea cerrable.
- [Detalle de pendientes abiertos](docs/pendientes-detalle.md): mediciones, restricciones, fuentes y pasos originales.
- [Historial de pendientes cerrados](docs/historial-pendientes.md): tareas terminadas y registros anteriores, con su evidencia.
- [Notas y procedimientos operativos](docs/notas-operativas.md): webhook, secretos, correo, incidentes y límites conocidos.

Las notas históricas no reemplazan [los criterios vigentes](docs/criterios.md).
