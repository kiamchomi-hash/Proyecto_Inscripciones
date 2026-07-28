-- Repone la seccion de novedades con 10 guias del CAU.
--
-- Contexto: 2026-07-27_despublicar_novedades_relleno.sql dejo la seccion vacia
-- porque las 58 filas anteriores inventaban hechos del CAU que no ocurrieron
-- ("cierre administrativo por fiestas", "nuevo laboratorio inaugurado") y no
-- juntaban trafico. Estas 10 no son noticias: son guias sobre cosas que si son
-- verificables, y cada dato sale de una fuente concreta.
--
-- De donde sale cada dato:
--   - Inicio del 2do semestre 2026 (ED-EDH) y requisitos del legajo:
--     fuentes_siglo21.md, verificado el 23/07/2026 contra 21.edu.ar,
--     lanube.21.edu.ar y contenidos.21.edu.ar/microsites/reglamento.
--   - Cantidad de carreras por nivel: consulta a la tabla `carreras` del
--     27/07/2026 (36 Grado + 7 Grado CCC, 25 Pregrado, 17 Teclab, 11 Identidad
--     Argentina). Coinciden con lo que hoy lista el catalogo.
--   - Domicilio y WhatsApp: lib/sede.ts y components/navbar.tsx.
--
-- Lo que quedo deliberadamente afuera:
--   - Precios. Los importes de mensaje_terapia_ocupacional.md los aporto el
--     usuario, no salen de una pagina publica de la universidad y cambian por
--     cuatrimestre. Una pagina indexada con un arancel viejo es peor que no
--     tenerla: las consultas de plata van a WhatsApp.
--   - Imagenes. imagen_url queda NULL y las tarjetas caen en el placeholder
--     que ya existe (news-placeholder). Cargar fotos genericas de banco no
--     aporta nada; si mas adelante hay fotos reales de la sede, se actualiza.
--
-- Da 2 paginas: 1 fijada + 3 en la pagina 1, 6 en la pagina 2.
-- El total lo calcula app/novedades/[page]/page.tsx como
-- 1 + ceil((no_fijadas - 3) / 6) = 1 + ceil((9 - 3) / 6) = 2.
--
-- OJO con `fecha`: es la clave de orden (order by fecha desc) ademas de la
-- fecha que se muestra. Van escalonadas del 09/07 al 27/07 para que el orden
-- sea estable; si dos filas comparten fecha, el orden entre ellas queda
-- indefinido y una novedad puede aparecer en las dos paginas o en ninguna.
-- Si preferis que todas figuren publicadas hoy, cambia las fechas pero dejalas
-- distintas entre si.
--
-- Correr en el SQL Editor del dashboard de Supabase. El editor muestra solo el
-- resultado del ultimo statement, asi que la verificacion va despues del commit.
-- Si antes de insertar queres ver como esta la tabla, corre esto solo:
--   select count(*) filter (where publicada) as publicadas,
--          count(*)                          as filas_totales
--   from public.novedades;
--   -- Esperado despues de la poda: publicadas = 0, filas_totales = 58

begin;

insert into public.novedades
  (titulo, extracto, contenido, fecha, tag, imagen_url, href, slug, pinned, publicada)
values

-- ── FIJADA ────────────────────────────────────────────────────────────────
(
  'El segundo semestre 2026 empieza el 3 de agosto',
  'La cursada a distancia arranca el lunes 3 de agosto y la apertura está sujeta a cupo. Te contamos qué tenés que tener listo para llegar a tiempo con la inscripción.',
  $html$
<p>El <strong>segundo semestre 2026</strong> de las carreras a distancia de la Universidad Siglo 21 comienza el <strong>lunes 3 de agosto de 2026</strong>. La apertura de cada comisión está sujeta a cupo, así que conviene no dejar la inscripción para la última semana.</p>

<h2>Qué tenés que tener listo</h2>
<p>La inscripción se completa con el legajo. Estos son los papeles que pide la universidad:</p>
<ul>
  <li>Solicitud de inscripción completa, fechada y con firma certificada.</li>
  <li>DNI vigente, frente y dorso.</li>
  <li>Analítico secundario legalizado, o título secundario legalizado.</li>
  <li>Dos fotos color de 3 × 3.</li>
  <li>Ficha médica oficial.</li>
</ul>
<p>A eso se suma el pago de la matrícula y los aranceles. Si alguno de esos trámites te puede demorar —la legalización del analítico es el clásico—, arrancalo ahora. Lo desarrollamos en <a href="/novedades/articulo/documentacion-legajo-inscripcion">la guía de documentación del legajo</a>.</p>

<h2>Si todavía no elegiste carrera</h2>
<p>En el <a href="/">catálogo del CAU</a> están las 96 carreras que se dictan hoy: licenciaturas, tecnicaturas de pregrado, las tecnicaturas de Teclab y las diplomaturas de Identidad Argentina. Cada ficha tiene el plan de estudios y la duración.</p>

<h2>Cómo seguimos</h2>
<p>Escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a> o dejanos tus datos en <a href="/contacto">el formulario de contacto</a> y te acompañamos con el trámite de punta a punta. También podés acercarte a la sede, en Guaminí 4876, Villa Lugano.</p>

<p><em>Fecha de inicio según el calendario académico oficial de Educación Distribuida, verificado el 23 de julio de 2026 en <a href="https://www.lanube.21.edu.ar/calendario-acad%C3%A9mico-distancia" target="_blank">lanube.21.edu.ar</a>.</em></p>
$html$,
  '2026-07-27', 'Institucional', NULL,
  '/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto',
  'segundo-semestre-2026-inicio-3-de-agosto', true, true
),

-- ── PAGINA 1 ──────────────────────────────────────────────────────────────
(
  'Qué papeles pide el legajo de inscripción',
  'Solicitud firmada, DNI, analítico legalizado, dos fotos 3×3 y ficha médica. Qué es cada cosa, dónde se consigue y cuál conviene empezar primero.',
  $html$
<p>Para quedar inscripto en una carrera de la Universidad Siglo 21 hay que presentar el legajo completo. Son cinco documentos y ninguno se resuelve el mismo día, así que vale la pena saber de antemano qué pide cada uno.</p>

<h2>Los cinco documentos obligatorios</h2>
<ol>
  <li><strong>Solicitud de inscripción.</strong> Completa, fechada y con firma certificada. La certificación de firma se hace ante escribano, banco o autoridad competente.</li>
  <li><strong>DNI vigente.</strong> Copia del frente y del dorso. Si está vencido o en trámite, resolvelo antes.</li>
  <li><strong>Analítico secundario legalizado</strong> o <strong>título secundario legalizado</strong>. Es el que más demora: lo emite la escuela y después hay que legalizarlo. Empezalo primero.</li>
  <li><strong>Dos fotos color 3 × 3.</strong></li>
  <li><strong>Ficha médica oficial.</strong> En el formulario que provee la universidad.</li>
</ol>

<h2>Además del legajo</h2>
<p>La inscripción se completa con el pago de la matrícula y los aranceles, y el inicio de la cursada incluye <a href="/novedades/articulo/ivu-universitario-21-inicio-cursada">Introducción a la Vida Universitaria y las materias de Universitario 21</a>.</p>

<h2>Si te falta algo</h2>
<p>No frenes el resto del trámite por un papel. Escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a> contando en qué estás y vemos cómo ordenarlo, sobre todo si el analítico viene demorado y la <a href="/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto">fecha de inicio</a> está cerca.</p>

<p><em>Requisitos verificados el 23 de julio de 2026 en el <a href="https://contenidos.21.edu.ar/microsites/reglamento/index.php?put=2-2-documentacion-obligatoria-y-complementaria" target="_blank">reglamento oficial</a> y en la <a href="https://www.lanube.21.edu.ar/documentacion" target="_blank">guía de documentación</a> de la universidad. Pueden actualizarse: confirmalos antes de presentar.</em></p>
$html$,
  '2026-07-25', 'Académico', NULL,
  '/novedades/articulo/documentacion-legajo-inscripcion',
  'documentacion-legajo-inscripcion', false, true
),
(
  'Qué es el CAU Villa Lugano y cómo funciona',
  'Un Centro de Aprendizaje Universitario es la sede física de una universidad a distancia. Qué se resuelve presencialmente y qué desde casa.',
  $html$
<p>El CAU Villa Lugano es un <strong>Centro de Aprendizaje Universitario</strong> de la Universidad Siglo 21. Dicho simple: la carrera se cursa a distancia, pero hay una sede física en el barrio donde resolver lo que por pantalla no sale.</p>

<h2>Qué se hace en la sede</h2>
<ul>
  <li>La inscripción y la entrega del legajo, con alguien que revisa los papeles antes de que los presentes.</li>
  <li>Consultas administrativas: aranceles, planes de pago, trámites.</li>
  <li><a href="/clases-apoyo">Clases de apoyo</a> por materia, con profesores del centro.</li>
  <li>Orientación para elegir carrera si estás indeciso.</li>
</ul>

<h2>Qué hacés desde tu casa</h2>
<p>El cursado, el material de estudio y la mayor parte de la evaluación son a distancia, con los tiempos del calendario académico de la universidad. Por eso el modelo funciona bien para quien trabaja o tiene chicos: no hay que estar en un aula a horario fijo.</p>

<h2>La oferta</h2>
<p>Hoy el catálogo tiene <strong>96 carreras</strong> repartidas en cinco grupos: <a href="/novedades/articulo/carreras-de-grado-a-distancia">licenciaturas de grado</a>, <a href="/novedades/articulo/tecnicaturas-pregrado-dos-tres-anos">tecnicaturas de pregrado</a>, <a href="/novedades/articulo/teclab-tecnicaturas-online">tecnicaturas de Teclab</a> y <a href="/novedades/articulo/identidad-argentina-diplomaturas">diplomaturas de Identidad Argentina</a>. Podés verlas todas en <a href="/">el catálogo</a>.</p>

<p>Estamos en Guaminí 4876, Villa Lugano, CABA. Los detalles para llegar están en <a href="/novedades/articulo/donde-queda-el-cau-villa-lugano">esta guía</a>, y si tenés una duda puntual mirá las <a href="/faq">preguntas frecuentes</a> o escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a>.</p>
$html$,
  '2026-07-23', 'Institucional', NULL,
  '/novedades/articulo/que-es-el-cau-villa-lugano',
  'que-es-el-cau-villa-lugano', false, true
),
(
  'Clases de apoyo: cómo reservar un turno',
  'El CAU da clases de apoyo por materia con profesores del centro. Cómo ver los horarios disponibles y pedir tu turno desde el sitio.',
  $html$
<p>Cursar a distancia no significa cursar solo. El CAU Villa Lugano organiza <strong>clases de apoyo por materia</strong> con profesores del centro, pensadas para las materias que suelen trabar: las de primer año, las que tienen mucho cálculo y las que se rinden por segunda vez.</p>

<h2>Cómo pedir un turno</h2>
<ol>
  <li>Entrá a <a href="/clases-apoyo">la sección de clases de apoyo</a>.</li>
  <li>Buscá tu materia. Vas a ver los horarios cargados para los próximos días.</li>
  <li>Elegí el turno que te sirva y completá el formulario con tu nombre, tu contacto y la materia.</li>
  <li>El profesor a cargo se comunica con vos para confirmar.</li>
</ol>

<h2>Antes de reservar</h2>
<p>Llegá con algo concreto: el práctico que no te sale, el tema del parcial, la consigna que no entendés. Una clase de apoyo rinde mucho más cuando hay una pregunta puntual arriba de la mesa que cuando se arranca de cero.</p>

<h2>Si tu materia no aparece</h2>
<p>La grilla muestra solo los turnos cargados para los próximos días, así que cambia seguido. Si no ves tu materia, escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a> y averiguamos si hay profesor disponible.</p>
$html$,
  '2026-07-21', 'Académico', NULL,
  '/novedades/articulo/clases-de-apoyo-como-reservar-turno',
  'clases-de-apoyo-como-reservar-turno', false, true
),

-- ── PAGINA 2 ──────────────────────────────────────────────────────────────
(
  'Las 43 licenciaturas que podés cursar a distancia',
  'Abogacía, Contador Público, Informática, Nutrición, Terapia Ocupacional y 38 más. Cómo se agrupan las carreras de grado y qué son las CCC.',
  $html$
<p>Las carreras de grado son el bloque más grande del catálogo del CAU: <strong>36 licenciaturas</strong> de cursado completo más <strong>7 ciclos de complementación curricular</strong>. Todas a distancia, con la sede de Villa Lugano como punto de apoyo.</p>

<h2>Por área</h2>
<ul>
  <li><strong>Derecho y seguridad:</strong> Abogacía (5 años), Escribanía, Criminología y Seguridad.</li>
  <li><strong>Tecnología:</strong> Informática (5 años), Ciencias de Datos, Inteligencia Artificial y Robótica, Seguridad Informática, Bioinformática, Agroinformática, Diseño y Animación Digital.</li>
  <li><strong>Negocios:</strong> Contador Público (4 años y medio), Administración, Finanzas, Comercialización, Comercio Internacional, Negocios Digitales, Logística Global, Gestión de Recursos Humanos, Actuario.</li>
  <li><strong>Salud:</strong> Nutrición, Terapia Ocupacional y Desarrollo Humano.</li>
  <li><strong>Comunicación:</strong> Periodismo, Publicidad, Relaciones Públicas e Institucionales.</li>
  <li><strong>Ambiente y agro:</strong> Gestión Ambiental, Administración Agraria, Higiene, Seguridad y Medio ambiente del Trabajo.</li>
  <li><strong>Gobierno y sociedad:</strong> Ciencia Política y Gobierno, Administración Pública, Relaciones Internacionales, Sociología.</li>
  <li><strong>Educación:</strong> Educación y Nuevas Tecnologías, Matemática.</li>
  <li><strong>Turismo y deporte:</strong> Gestión Turística, Administración Hotelera, Gestión Deportiva.</li>
</ul>
<p>La mayoría dura <strong>4 años</strong>; Informática y Abogacía, 5; Contador Público, 4 y medio.</p>

<h2>Qué son las carreras (CCC)</h2>
<p>Los <strong>ciclos de complementación curricular</strong> son para quien ya tiene un título previo de nivel superior y quiere completar la licenciatura. Se cursan en 1 año y medio o 2 años en lugar de empezar de cero. Hay siete: Psicopedagogía, Educación, Emprendimiento, Gerontología, Administración de Servicios de Salud, Desarrollo de Negocios Inmobiliarios y el Profesorado Universitario para Nivel Secundario y Superior.</p>
<p>Si ya tenés un terciario o una tecnicatura, fijate primero en este grupo: te puede ahorrar dos años.</p>

<h2>Cómo elegir</h2>
<p>En <a href="/">el catálogo</a> podés filtrar por área y por duración, y cada ficha abre el plan de estudios completo. Si dudás entre dos, escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a>: la diferencia suele estar en la salida laboral, no en el contenido.</p>
$html$,
  '2026-07-19', 'Académico', NULL,
  '/novedades/articulo/carreras-de-grado-a-distancia',
  'carreras-de-grado-a-distancia', false, true
),
(
  'Tecnicaturas: un título universitario en 2 o 3 años',
  '25 tecnicaturas de pregrado, de Marketing Digital a Investigación de la escena del crimen. Duran entre 2 y 3 años y muchas siguen después en una licenciatura.',
  $html$
<p>Si cuatro años te parecen muchos, las <strong>tecnicaturas de pregrado</strong> son el camino corto: <strong>25 carreras</strong> que duran entre <strong>2 y 3 años</strong> y dan un título universitario propio.</p>

<h2>Algunas de las que más se consultan</h2>
<ul>
  <li><strong>Marketing y Publicidad Digital</strong> (2 años)</li>
  <li><strong>Diseño y Desarrollo de Videojuegos</strong> (2 años y medio)</li>
  <li><strong>Redes Informáticas y Telecomunicaciones</strong> (2 años y medio)</li>
  <li><strong>Investigación de la escena del crimen</strong> (2 años y medio)</li>
  <li><strong>Gestión Administrativa de Servicios de Salud</strong> (2 años)</li>
  <li><strong>Higiene y Seguridad Laboral</strong> (2 años y medio)</li>
  <li><strong>Martillero, Corredor Público y Corredor Inmobiliario</strong> (3 años)</li>
  <li><strong>Procurador</strong> (3 años)</li>
  <li><strong>Estadística Aplicada y Análisis Avanzado</strong> (2 años)</li>
  <li><strong>Gestión Contable e impositiva</strong> (2 años y medio)</li>
</ul>
<p>El resto cubre recursos humanos, turismo, moda, eventos, políticas públicas, agroecología, hidrocarburos y trabajo comunitario. La lista completa está en <a href="/">el catálogo</a>, filtrando por Tecnicaturas.</p>

<h2>La ventaja menos obvia</h2>
<p>Una tecnicatura no es un callejón sin salida. Con el título de pregrado en la mano podés seguir después en un <a href="/novedades/articulo/carreras-de-grado-a-distancia">ciclo de complementación curricular</a> y completar la licenciatura en dos años más. Muchos estudiantes hacen exactamente eso: primero el título que les permite trabajar, después el grado.</p>

<p>Para saber qué tecnicatura conecta con qué licenciatura, escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a> o pasá por <a href="/contacto">el formulario</a>.</p>
$html$,
  '2026-07-17', 'Académico', NULL,
  '/novedades/articulo/tecnicaturas-pregrado-dos-tres-anos',
  'tecnicaturas-pregrado-dos-tres-anos', false, true
),
(
  'Teclab: 17 tecnicaturas de dos años en tecnología y gestión',
  'Programación, Data Science, Cloud, Marketing Digital, Seguros. Las tecnicaturas del Instituto Técnico Superior Teclab, todas de 2 años.',
  $html$
<p>Además de la oferta de la universidad, desde el CAU podés inscribirte en las tecnicaturas del <strong>Instituto Técnico Superior Teclab</strong>. Son <strong>17 carreras</strong>, todas de <strong>2 años</strong>, divididas en dos familias.</p>

<h2>Teclab Tecnología (6 carreras)</h2>
<ul>
  <li>Tecnicatura Superior en Programación</li>
  <li>Tecnicatura Superior en Data Science</li>
  <li>Tecnicatura Superior en Cloud Administration</li>
  <li>Tecnicatura Superior en Seguridad Informática</li>
  <li>Tecnicatura Superior en Redes Informáticas</li>
  <li>Tecnicatura Superior en Quality Assurance</li>
</ul>

<h2>Teclab Gestión (11 carreras)</h2>
<ul>
  <li>Tecnicatura Superior en Marketing Digital</li>
  <li>Tecnicatura Superior en Inbound Marketing</li>
  <li>Tecnicatura Superior en Customer Experience</li>
  <li>Tecnicatura Superior en Venta Directa</li>
  <li>Tecnicatura Superior en Gestión Contable</li>
  <li>Tecnicatura Superior en Seguros</li>
  <li>Tecnicatura Superior en Relaciones Laborales</li>
  <li>Tecnicatura Superior en Gestión Hotelera</li>
  <li>Tecnicatura Superior en Planificación y Organización de Eventos</li>
  <li>Tecnicatura Superior en Gestión Agraria</li>
  <li>Tecnicatura Superior en Periodismo y Nuevas Tecnologías</li>
</ul>

<h2>Para quién es</h2>
<p>El perfil de Teclab es técnico y corto: dos años, contenido aplicado y carreras armadas junto con empresas del rubro. Si buscás entrar rápido al mercado en un puesto técnico —desarrollo, datos, infraestructura, marketing— es el camino más directo del catálogo.</p>

<p>Abrí cualquier ficha de Teclab en <a href="/">el catálogo</a> para ver el plan de estudios completo. La inscripción y las consultas se hacen desde el CAU, por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a> o por <a href="/contacto">el formulario de contacto</a>.</p>
$html$,
  '2026-07-15', 'Académico', NULL,
  '/novedades/articulo/teclab-tecnicaturas-online',
  'teclab-tecnicaturas-online', false, true
),
(
  'Identidad Argentina: 11 diplomaturas cortas',
  'De 1 a 6 meses, para sumar una herramienta concreta sin comprometer años: Inteligencia Artificial, RRHH, Compliance, Oratoria y más.',
  $html$
<p>Por el convenio con <strong>Identidad Argentina</strong>, desde el CAU también se dictan <strong>11 formaciones cortas</strong> que duran entre <strong>1 y 6 meses</strong>. Son otra cosa que una carrera: sirven para sumar una herramienta concreta sin comprometer dos o cuatro años.</p>

<h2>Las diplomaturas</h2>
<ul>
  <li><strong>Inteligencia Artificial</strong> (2 meses y medio)</li>
  <li><strong>Integral en RRHH</strong> (5 meses)</li>
  <li><strong>Compliance</strong> (4 meses)</li>
  <li><strong>Fraude Financiero y Digital</strong> (4 meses)</li>
  <li><strong>Marketing para Emprendedores y Dueños de Negocios</strong> (4 meses)</li>
  <li><strong>Gestión de Equipos de Alto Desempeño</strong> (4 meses)</li>
  <li><strong>Management Hotelero</strong> (3 meses)</li>
  <li><strong>Oratoria</strong> (2 meses)</li>
  <li><strong>Bienestar Integral: Herramientas para Transformar-te</strong> (6 meses)</li>
</ul>

<h2>Los cursos</h2>
<ul>
  <li><strong>Constitución de Sociedades S.A, S.A.S, S.R.L</strong> (1 mes)</li>
  <li><strong>Mindfulness y Técnicas de Gestión del Estrés</strong> (2 meses)</li>
</ul>

<h2>Para quién tiene sentido</h2>
<p>Para tres situaciones: sumar una competencia puntual que te piden en el trabajo, probar un área antes de meterte en una carrera larga, o formarte en algo que no necesita cuatro años —Oratoria y Constitución de Sociedades son buenos ejemplos.</p>

<p>Los detalles de cada programa están en <a href="/">el catálogo</a>, en la categoría Identidad Argentina. Para fechas de inicio y aranceles, escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a>.</p>
$html$,
  '2026-07-13', 'Institucional', NULL,
  '/novedades/articulo/identidad-argentina-diplomaturas',
  'identidad-argentina-diplomaturas', false, true
),
(
  'Antes de la primera materia: IVU y Universitario 21',
  'La cursada no arranca directo con las materias de la carrera. Qué son Introducción a la Vida Universitaria y las materias de Universitario 21.',
  $html$
<p>Una duda que aparece seguido apenas se completa la inscripción: <em>ya me anoté, ¿cuándo empiezo con las materias de mi carrera?</em> No es lo primero. El ingreso a la Universidad Siglo 21 incluye dos instancias previas.</p>

<h2>Introducción a la Vida Universitaria</h2>
<p>Es la instancia de arranque que hace todo ingresante. Sirve para conocer cómo funciona el modelo a distancia —plataforma, calendario, formas de evaluación— antes de que empiece a correr el reloj de las materias.</p>

<h2>Universitario 21</h2>
<p>Es un conjunto de materias comunes que se cursan al inicio, más allá de la carrera que hayas elegido. Trabajan las competencias transversales sobre las que después se apoya el resto del plan.</p>

<h2>Por qué conviene saberlo antes</h2>
<p>Porque cambia cómo planificás el primer tramo. Si arrancás contando con que la primera semana ya vas a estar con las materias de tu carrera, el ingreso te descoloca. Sabiéndolo de entrada, lo usás para lo que es: agarrarle la mano a la modalidad con algo de margen.</p>

<p>El detalle formal de las condiciones de ingreso está en el <a href="https://contenidos.21.edu.ar/microsites/reglamento/index.php?put=2-1-carreras-de-pregrado-y-grado" target="_blank">reglamento oficial de carreras de pregrado y grado</a>. Si querés que te lo expliquemos aplicado a tu caso, escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a> o pasá por la sede.</p>

<p><em>Verificado el 23 de julio de 2026 contra el reglamento publicado por la universidad.</em></p>
$html$,
  '2026-07-11', 'Académico', NULL,
  '/novedades/articulo/ivu-universitario-21-inicio-cursada',
  'ivu-universitario-21-inicio-cursada', false, true
),
(
  'Dónde queda el CAU Villa Lugano y cómo llegar',
  'Guaminí 4876, Villa Lugano, CABA. Cómo ubicarnos en el mapa y los canales para escribirnos antes de venir.',
  $html$
<p>El CAU Villa Lugano funciona en <strong>Guaminí 4876</strong>, Villa Lugano, Ciudad Autónoma de Buenos Aires (C1439).</p>

<h2>Cómo llegar</h2>
<p>La sede está en pleno Villa Lugano, sobre Guaminí. El mapa con la ubicación exacta y el botón de <em>Cómo llegar</em> están en <a href="/contacto">la página de contacto</a> y en <a href="/sobre-nosotros">Sobre nosotros</a>. Si venís desde otra comuna, conviene abrirlo desde el celular y que la app te arme el recorrido: la traza de colectivos de la zona cambia bastante según de dónde salgas.</p>

<h2>Escribinos antes de venir</h2>
<p>La mayoría de los trámites se resuelven sin moverte de tu casa, y para los que sí necesitan presencia conviene avisar antes así te atendemos con el tiempo que hace falta:</p>
<ul>
  <li><strong>WhatsApp:</strong> <a href="https://wa.me/5491166522722" target="_blank">escribinos por acá</a>.</li>
  <li><strong>Formulario:</strong> <a href="/contacto">dejanos tus datos</a> y te contactamos.</li>
  <li><strong>Dudas frecuentes:</strong> mirá primero <a href="/faq">las preguntas frecuentes</a>, capaz ya está respondida.</li>
</ul>

<h2>Si venís a inscribirte</h2>
<p>Traé el <a href="/novedades/articulo/documentacion-legajo-inscripcion">legajo lo más completo que puedas</a>. Aunque te falte algún papel, con el resto ya podemos avanzar y dejarte el trámite encaminado antes del <a href="/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto">inicio del semestre</a>.</p>
$html$,
  '2026-07-09', 'Institucional', NULL,
  '/novedades/articulo/donde-queda-el-cau-villa-lugano',
  'donde-queda-el-cau-villa-lugano', false, true
);

commit;

-- Verificacion. Las cuatro columnas tienen que dar exactamente esto:
--   publicadas = 10, fijadas = 1, slugs_distintos = 10, fechas_distintas = 10
-- Si fijadas != 1, la pagina 1 pierde la tarjeta grande.
-- Si fechas_distintas < 10, el orden entre las repetidas queda indefinido y
-- alguna novedad puede aparecer en las dos paginas o en ninguna.
select
  count(*)                       as publicadas,
  count(*) filter (where pinned) as fijadas,
  count(distinct slug)           as slugs_distintos,
  count(distinct fecha)          as fechas_distintas
from public.novedades
where publicada = true;

-- Para revertir:
--   delete from public.novedades
--   where slug in (
--     'segundo-semestre-2026-inicio-3-de-agosto',
--     'documentacion-legajo-inscripcion',
--     'que-es-el-cau-villa-lugano',
--     'clases-de-apoyo-como-reservar-turno',
--     'carreras-de-grado-a-distancia',
--     'tecnicaturas-pregrado-dos-tres-anos',
--     'teclab-tecnicaturas-online',
--     'identidad-argentina-diplomaturas',
--     'ivu-universitario-21-inicio-cursada',
--     'donde-queda-el-cau-villa-lugano'
--   );
--
-- Despues de correrlo:
--   1. Revalidar/redeploy para que el ISR (revalidate = 3600) tome las filas.
--   2. Confirmar que /novedades/1 y /novedades/2 muestren 4 y 6 tarjetas.
--   3. Pedir la indexacion de las 10 URLs nuevas en Search Console; ya salen
--      solas en app/sitemap.ts.
