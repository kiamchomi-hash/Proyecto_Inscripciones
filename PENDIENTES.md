# Pendientes

Marcar una tarea terminada sólo con evidencia y mover su detalle al historial; las revisiones repetibles van en rutinas.

Reordenada el 16/10/2026 por prioridad, juntando esta lista, las tareas abiertas de [`odd/tasks/`](odd/tasks/) y el [detalle de pendientes](docs/pendientes-detalle.md). El orden es: primero lo que ya está hecho y falta publicar o marcar; después lo que hace perder leads o muestra un dato equivocado; después el resto; Teclab ya no tiene prioridad especial (16/10/2026). Los números de los pedidos del 02/10/2026 se conservan para poder referirse a cada tarea  

1.Enfocar clases de apoyo computación en secundario y adultos mayores, no en universitarios, es el público objetivo más fuerte  
1.2 fichas grandes de modales generan esa flecha de abajo, es algo que hice hace poco, además en desktop remplazo las flechas de bimestre y año, no es algo que esperaba

1.3 mal otras carreras en clase de apoyo, habilitar apoyo secundario  
1.4 usar mejor los negocios para la automatización de negocios [https://app.hubspot.com/contacts/44080364/objects/0-3/views/recently_assigned/list](https://app.hubspot.com/contacts/44080364/objects/0-3/views/recently_assigned/list)

1.5 sumar carrera bloque 4

1.5 guardar en el md algo para el slop, (es un guardado de twitter)

## 3. Urgente: leads y precios

- [ ] **Investigar cuotas, intereses y cargos de otros medios de pago de Teclab** (23/10/2026): MercadoPago con dinero en cuenta, GoCuotas, WiBond, PagoFácil y Rapipago. El mismo total inicial no confirma las condiciones de financiación. **Parcial (30/10/2026):** el usuario confirmó que MercadoPago, PagoFácil y Rapipago son **1 pago**, sin cuotas, y ya está en el corpus y en «Formas de pago» del buscador. Falta GoCuotas y WiBond, y si ese 1 pago tiene el mismo total que el de tarjeta. [Detalle y límite de acceso](odd/tasks/teclab-extractor-dashboard.md#medios-de-pago-adicionales-condiciones-pendientes).

## 5. Siglo 21

- Las piezas gráficas de esta casa quedaron **secundarias el 30/10/2026**: sólo material oficial y, como excepción, lo que se manda por WhatsApp ([criterio](docs/criterios.md#las-piezas-gráficas-de-siglo-21-van-con-el-material-oficial)). Sus pendientes abiertos viven en las secciones 6 y 7.

## 6. Sitio y diseño

- [ ] **Revisar si Google indexó Desarrollo de Videojuegos** (Teclab y Siglo 21): consultar en Search Console las fichas publicadas —[Teclab](https://www.siglo21sur.com/carreras/tecnicatura-superior-en-desarrollo-de-videojuegos) y [Siglo 21](https://www.siglo21sur.com/carreras/siglo-21-video-juegos)—. Revisado el 29/10/2026: las dos siguen **desconocidas para Google, sin rastreo**, y las dos responden 200, están en `sitemap.xml` y enlazadas desde `/` y `/teclab`. La última lectura del sitemap por Google fue el 28/10 a las 19:20, anterior a la publicación, así que todavía no las vio; no hay nada roto. Falta pedir la indexación a mano en Search Console (API no lo permite) y volver a mirar en unos días.

- [ ] **Aprovechar la visibilidad del calendario académico para llevar a la oferta de carreras** (28/10/2026): `/calendario-academico` es la segunda página del sitio en clics de Google (54 clics y 2.883 impresiones en los 28 días al 29/10) y su única salida hacia la oferta era un botón en el hero. **Publicado el 30/10/2026** (`021708c`, workflow 41031187182) y **rehecho como página del ciclo 2027 el 30/10/2026**: el H1, el título, la descripción y todo el contenido son de 2027; las fechas concretas de 2026 se retiraron porque ese ciclo ya terminó. Como la universidad todavía no publicó el calendario 2027 (`lanube.21.edu.ar` sigue mostrando el 2026), la página explica la estructura que sí está en el reglamento —dos semestres, cuatro tramos de nueve semanas, ventanas de parciales, entregas de TP por tipología y materias cuatrimestrales de 18 semanas— y aclara que las fechas exactas se confirman con el calendario oficial. Las aperturas (marzo, mayo, agosto y octubre) salen de las fichas oficiales de cada carrera. Enlaces a la oferta: hero, FAQ de inicio de clases, FAQ de Teclab y cierre, al catálogo filtrado en Siglo 21 (`/?casa=siglo21#filtros-categoria`). `calendario-salida` se cuenta en `calendario_salidas` (D1, migración `0013`) y `npm run leads` lo muestra por destino. **Pendiente:** cargar las fechas cuando la universidad publique el calendario 2027, y a las dos semanas mirar el reparto por destino.

- [ ] **Mirar las fichas de `siglo21online.com.ar` para sumar ideas a las páginas de carreras** (28/10/2026): es el sitio de GRUPO BTC S.A. (Av. Córdoba 1551, CABA), no el oficial de la universidad, y resuelve la ficha de otra manera. Ejemplo anotado: [Licenciatura en Finanzas](https://siglo21online.com.ar/licenciatura-en-finanzas-detalle/). Lo que se vio ahí y vale evaluar: datos duros arriba y en una línea (duración, modalidad, título, validez con número de resolución), «¿Qué vas a lograr?» con cuatro resultados en tarjetas, comparación explícita de las dos modalidades de cursada (Educación Distribuida y Home) con encuentros y aperturas, plan de estudios plegado por año y cuatrimestre, y un bloque de «más posibilidades» con doble titulación, título intermedio y ámbitos profesionales. El formulario de WhatsApp ya llega con la carrera elegida. Revisar el resto de sus fichas antes de copiar cualquier cosa y decidir qué entra a `cloudflare/` sin inventar condiciones de cursada.

- [ ] **Dar a Teclab alcance en México y Chile por el SEO** (27/10/2026): Teclab se ofrece principalmente en México y Chile, no sólo en Argentina, y hoy el sitio no lo dice. Sumar esos países al contenido y a las páginas de Teclab (títulos, descripciones y texto visible) para que se lo encuentre buscando desde ahí. Sin inventar condiciones de cursada, precios ni modalidad que no estén confirmados: las condiciones por país las aporta el usuario.

- [ ] **Arreglar las páginas de carreras de Teclab y los logos de `/teclab`** (29/10/2026): **son dos referencias distintas y se revisan las dos**, no una sola fuente:
  1. **Sitio oficial de Teclab** — `https://teclab.edu.ar/carrera/<slug>/` para cada carrera (datos, plan, título, salidas, modalidad). Es la fuente del contenido.
  2. **`https://siglo21online.com.ar/teclab`** — es otro sitio, de GRUPO BTC S.A., no el oficial de la universidad. Es el modelo de ficha terminada: cómo arma la página de cada carrera y cómo presenta la marca de Teclab.

  Donde las dos se contradigan, manda la oficial. No se copia texto de ninguna de las dos: se compara.

  Dos frentes:
  - **Fichas de carreras:** **revisadas contra el sitio oficial el 30/10/2026** — resoluciones, validez del título, certificado intermedio y planes de estudio quedaron al día en las 22 carreras activas. Falta sólo lo que no es dato: **Gestión Ambiental (246) y Desarrollo de Videojuegos (247) tienen 2 preguntas frecuentes** donde el resto tiene entre 3 y 6, así que su ficha cierra más corta. [Enlaces consultados](referencias/2026-10-30-fichas-oficiales-teclab.md).
  - **Logos de `/teclab`:** corregir los que se ven mal; hoy salen de `cloudflare/src/entrega/PaginaTeclab.tsx` (`/imagenes/teclab/logo-teclab-siglo21.webp` y los de `partners/`: AWS Academy, Google, Microsoft, HubSpot, Zendesk y Avenga). Falta que el usuario diga cuáles y cómo se ven (tamaño, encuadre, calidad del archivo) antes de tocar los assets.

  Se apoya en la revisión de las fichas de `siglo21online.com.ar`.

- [ ] **Cambiar el botón «Ver horarios» de clases de apoyo** (29/10/2026): es el pie de cada tarjeta de la landing, `components/clases-apoyo/clases-apoyo-landing.tsx` (`.ca-materia-accion`, hoy una superficie grafito sólida con texto blanco y flecha). Sin detalle del cambio todavía: falta que el usuario diga qué quiere. El historial de lo que ya se cambió en ese botón y en las tarjetas está en [`odd/tasks/clases-apoyo-tarjetas.md`](odd/tasks/clases-apoyo-tarjetas.md).

## 7. Bot, leads y comercial

- [ ] **Confirmar con Teclab el reparto de resoluciones de Programación y Gestión Contable** (28/10/2026): el sitio publica Resolución 2127/22 + Dictamen 2662/22 para Programación y 2357/22 + 2657/22 para Gestión Contable, pero el Boletín Oficial de CABA (Res. 2357/MEDGC/22, 16/05/2022) aprueba el plan de la Tecnicatura Superior en Programación en virtud del Dictamen 2.657/22. Los números ya están en el corpus (`carreras/teclab/resoluciones-teclab.json`, marcador `{resoluciones}`); falta que Secretaría Académica confirme cuál corresponde antes de citarlos para un trámite. **Verificado el 30/10/2026 en las dos fichas oficiales:** siguen publicando 2127/22 + Dictamen 2662/22 para Programación y 2357/22 + 2657/22 para Gestión Contable, así que el sitio no cambió nada y el desacuerdo con el Boletín sigue abierto del lado de Teclab.

- [ ] **Revisar los dos PowerPoints nuevos de Teclab** (28/10/2026): uno de Gestión y el otro del último bloque de carreras.

- [ ] **15. Combinar varias respuestas del buscador, separadas por párrafos — parcialmente hecho** (17/10/2026). Implementado localmente y habilitado para Siglo 21, con prueba focal aprobada; versión publicada sin verificar. Se retoma sólo cuando el usuario traiga una pregunta compleja de un lead que lo requiera: comprobar el caso real y ajustar si hace falta, sin extenderlo anticipadamente a otras casas. No es una tarea de ejecución inmediata.

- [ ] **Confirmar el ingreso con usuario a La Nube 21**. El 17/10/2026 sólo se comprobó que la portada responde. [Revisión de acceso](docs/historial-pendientes.md#fuentes-de-las-casas--acceso-revisado-17102026).

- [ ] **Regenerar el plan de Teclab del bot con los PDF vigentes** (30/10/2026): `carreras/teclab/planes-teclab.json` se generó con los PDF de agosto y quedó viejo en dos carreras. **Seguridad Informática** lista 18 materias cuando el programa vigente tiene 16: el bot responde con «Inserción y Desarrollo Profesional» y «Learning Agility», que ya no están. **Redes Informáticas** dice «Práctica Profesional» dos veces en lugar de «Práctica Profesional I» y «II». Las otras 14 coinciden. Hay que correr `herramientas/ventas/extraer-planes-teclab.py` (necesita PyMuPDF, que no está instalado en esta máquina) y volver a aplicar el corpus.

- [ ] **Sumar al corpus del bot las dudas de los leads**. Toda pregunta que llegue por leads y no esté respondida pasa a `ventas/corpus/`.
- [ ] **Estudiar la venta exitosa de seguros** (28/10/2026): ver cómo se vende un seguro —recorrido del asesor, objeciones, cierre y seguimiento— y qué se puede traer al trato con los leads del CAU. Sin detalle todavía.
- [ ] **Ampliar la app de HubSpot** (18/10/2026): cambiar el motivo de calificación (el usuario detallará la regla), mostrar un check junto al enlace de WhatsApp cuando el mensaje se haya enviado y automatizar seguimientos y actividades futuras. Pendiente de definición; no ejecutar todavía. [Detalle](odd/tasks/hubspot-negocios.md#pendientes-indicados-por-el-usuario).
- [ ] **HubSpot leads — mejoras de panel y operaciones** (20/10/2026):
  - **Agregar check de WhatsApp**: casilla manual para marcar envío donde falte (ej. en Activity).
  - **Permitir editar el texto del textarea**: retirar el `readonly` de `.activity-texto` para poder editar el mensaje/criterio antes de enviarlo.
  - **Abrir las mesas al hacer clic en el día**: al hacer clic en la fecha/día, desplegar o abrir las mesas asociadas.
  - **Completar los procesos CAU**: incorporar y completar los procesos y trámites administrativos de la sede en la herramienta. [Detalle](odd/tasks/hubspot-negocios.md).

## 8. Infraestructura y seguridad

- [ ] **Renovar el token `CLOUDFLARE_API_TOKEN`** que usa el deploy por CI (creado el 27/10/2026 en *My Profile · API Tokens*, con `Workers Scripts:Edit`, `Queues:Edit`, `Workers Routes:Edit` y `Zone:Read` sobre `siglo21sur.com`). Si se le puso TTL de 90 días, vence a fines de enero de 2027 y el workflow falla con 401; renovarlo y volver a `gh secret set CLOUDFLARE_API_TOKEN`. Procedimiento en [`cloudflare/LEER.md`](cloudflare/LEER.md).
- [ ] **Borrar la clave `Onboarding` en el panel de Resend** (la hace el usuario; no tocar `topykly-dev`). El resto se retiró el 18/10/2026: sin uso en el código, ya no estaba en Vercel y se borró el secreto de Supabase. *(Notas operativas.)*

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

Postergado por el usuario el 16/10/2026; se retoma después de los pendientes anteriores. **Las piezas gráficas de Siglo 21 quedaron secundarias el 30/10/2026**: sólo material oficial, y lo que se manda por WhatsApp sigue su curso ([criterio](docs/criterios.md#las-piezas-gráficas-de-siglo-21-van-con-el-material-oficial)).

- [ ] **06/11/2026: segunda revisión del embudo del test vocacional** (general y Teclab). Primera lectura el 20/10/2026 (16 al 20/10): el general tuvo 14 visitantes, 6 iniciaron, 4 completaron; la caída está en las preguntas 1 a 3 y después nadie abandona. El de Teclab no tuvo ninguna visita. Muestra demasiado chica para tocar pasos; si sigue en cero, revisar cómo se llega al de Teclab. [Cómo leerlo](docs/medicion-test-vocacional.md).

- [ ] **Mostrar el precio dentro de los pasos del formulario de preinscripción — parcialmente hecho** (18/10/2026). Hecho y publicado en Siglo 21 y Teclab, con la aclaración de que completarlo no cobra nada (`36d5823`, `2b9fd55`; [detalle](docs/historial-pendientes.md#formularios--precio-en-la-preinscripción-18102026)). Falta Identidad Argentina, que todavía no publica precio en el sitio.

- [ ] **Revisar el flujo de inscripción** de punta a punta, en las tres casas.

- [ ] **Reducir el formulario de preinscripción de Siglo 21**. Hoy pide 21 campos copiados de la ficha del portal (`components/formularios/casas.ts`). El usuario define cuáles quedan (16/10/2026); la propuesta es el mínimo de contacto: nombre, apellido, DNI, email, teléfono y localidad. Antes de tocarlo, leer `docs/formularios-por-casa.md`.

- [ ] **Relevar la financiación de Siglo 21 con una preinscripción propia** (19/10/2026). La web de Siglo 21 no publica cuotas, tarjetas ni medios de pago, así que no se puede repetir lo de Teclab (extraer las tarjetas de la página). El usuario hace una preinscripción con su mail y llega hasta la pantalla de pago; Claude la lee sin cargar datos y saca tarjetas, cuotas, bancos y medios de pago para armar el mensaje de financiación a los leads. Antes, avisar o marcar como prueba el lead que se genera en HubSpot. Lo que se vea vale para esa carrera y ese momento; las promos bancarias cambian seguido.

- [ ] **Recorrer el [checklist de alta de carrera](docs/alta-de-carrera.md) con las cinco carreras nuevas** (Gestión de Alimentos, Gestión de Proyectos Mineros, Gestión de Energías Renovables, Gestión Ambiental e Higiene y Seguridad en el Trabajo). Publicadas el 09/10/2026 como «Próximamente» con plan, título y preguntas frecuentes; faltan, entre otros, el precio, la fecha de inicio, el lead a HubSpot y los folletos. Bajado al fondo el 16/10/2026: las carreras todavía no están validadas. [Detalle](odd/tasks/teclab-carreras-proximamente.md).

- [ ] **Empezar a revisar nuevas carreras de Teclab**.

- [ ] **Bloque 4 de carreras nuevas de Teclab**: cuando llegue su capacitación de admisión, darlas de alta como los bloques 2 y 3 (16/10/2026). [Detalle](odd/tasks/teclab-bloques-2-y-3.md).

- [ ] **10. Crear folletos con CTA en el frente y lista de carreras en el dorso** — *secundaria en Siglo 21 desde el 30/10/2026*. Empezar por Teclab; después Identidad Argentina y clases de apoyo.

- [ ] **12. Crear folletos con estilo Siglo 21 y contenido y carreras de Teclab** — *secundaria desde el 30/10/2026, salvo la versión de WhatsApp*.

- [ ] **Fichas de carreras de Teclab**: las 20 restantes en versión Siglo, la plantilla `piezas_teclab` y las 21 en versión Teclab. Las fotos de cada carrera las aporta el usuario. [Detalle](odd/tasks/fichas-carreras-teclab.md).

- [ ] **Autoinscripción de Siglo 21: postergada el 16/10/2026**; bajada al fondo el 17/10/2026. Hoy el formulario sólo registra la solicitud y la atención sigue a mano. Antes de retomarla, definir si se hace con un robot en el portal de Siglo 21 (como en Teclab) o con un enlace personalizado.

- [ ] **21. Usar el bot de HubSpot de Siglo 21 para extraer más respuestas y procesos administrativos**, por una vía distinta del buscador de carreras. Bajado al fondo por el usuario el 17/10/2026: se consultará y completará a medida que surjan casos en el día a día, no como un relevamiento general anticipado.

- [ ] **9. Dar imágenes a todas las carreras**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Imagen OG propia por carrera — parcialmente hecho** (18/10/2026). Hecho en Teclab: las 31 carreras y cursos tienen la suya, con su foto y su nombre (`npm run og:teclab`). Faltan Siglo 21 e Identidad Argentina, que siguen con la genérica de su categoría (por ejemplo, Administración usa `/imagenes/og/default.jpg`).

- [ ] **1. Incorporar más imágenes de personas**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **6. Mejorar con IA las imágenes de algunos modales de carreras**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **2. Mejorar las páginas de clases y crear sus folletos e imágenes** — *los folletos, secundarios desde el 30/10/2026, salvo la versión de WhatsApp*. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **7. Mejorar la página de materias en base a los folletos creados**. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **11. Crear un folleto de carreras relevantes** — *secundaria en Siglo 21 desde el 30/10/2026, salvo la versión de WhatsApp*. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **8. Rediseñar Identidad Argentina: los modales y la página principal**. Tener presente la decisión vigente de migrarla a otro sitio, sin crear `/identidad` en este repo. Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Revisar el video institucional contra la oferta vigente antes de publicarlo**. [Detalle](docs/pendientes-detalle.md#pendiente-16). Bajado al fondo por el usuario el 17/10/2026, antes de las tareas fijas.

- [ ] **Automatizar HubSpot**. Pendientes propios separados: pasar a Seguimientos al marcar WhatsApp enviado, mejorar pestañas y agregar contadores rojos de envíos/seguimientos pendientes (19/10/2026). Bajado al fondo por el usuario el 18/10/2026. [Detalle](odd/tasks/hubspot-negocios.md).

- [ ] **Línea del tiempo de Siglo 21 para explicar semestres y cuatrimestres** (pieza para leads), agregado el 17/10/2026. **Fija al fondo de la cola**: no se mueve nunca, y lo que se baje al fondo queda arriba de las fijas. Contenido: semestres de enero a junio y de julio a diciembre, cada uno con un cuatrimestre de cursada adentro, de dos bimestres; la matrícula se paga una vez por cuatrimestre. El primer borrador (paso 3, en `contenidos/siglo21/en-curso/2026-10-17-linea-semestres/`) no se entendía: hay que repensar cómo mostrarlo, no retocar ese.

- [ ] **Pasar la carga diaria de precios a la nube**, agregado el 17/10/2026, para no depender de que la PC esté prendida. **Fija al fondo de la cola**: no se mueve nunca, y lo que se baje al fondo queda arriba de las fijas. Hoy corre en la PC con dos timers de systemd (Teclab e Identidad a las 9, Siglo 21 a las 10, reintento a las 14; ver [herramientas](docs/herramientas.md#actualización-diaria-desde-linux)). Antes de elegir dónde, resolver lo que hoy la ata a la máquina: la sesión SharePoint guardada para la planilla de CASA, que Cloudflare bloquea al portal de Teclab desde GitHub (por eso el robot de Teclab usa el runner `pc-sede`) y que la base comercial (`ventas/`, `carreras/`) no está en el repo.

## Documentación de apoyo

- [Rutinas de mantenimiento](docs/rutinas.md): contenido, bot, SEO, fuentes comerciales, leads y verificaciones de deploy. La revisión de indexación y rendimiento (antigua tarea 13) es seguimiento permanente, no tarea cerrable.
- [Detalle de pendientes abiertos](docs/pendientes-detalle.md): mediciones, restricciones, fuentes y pasos originales.
- [Historial de pendientes cerrados](docs/historial-pendientes.md): tareas terminadas y registros anteriores, con su evidencia.
- [Notas y procedimientos operativos](docs/notas-operativas.md): webhook, secretos, correo, incidentes y límites conocidos.

Las notas históricas no reemplazan [los criterios vigentes](docs/criterios.md).
