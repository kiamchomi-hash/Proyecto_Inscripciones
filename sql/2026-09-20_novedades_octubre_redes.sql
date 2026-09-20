-- Publica dos notas verificadas: apertura de octubre de Siglo 21 y perfil
-- profesional de Redes Informáticas de Teclab.
-- Se ejecuta con: npm run db -- --archivo sql/2026-09-20_novedades_octubre_redes.sql

insert into novedades (
  titulo, contenido, imagen_url, pinned, publicada, extracto, fecha, tag,
  href, slug, created_at, updated_at
)
select
  'Inscripciones para empezar en octubre',
  $html$
<p>Octubre es una de las aperturas previstas por Universidad Siglo 21 para sus carreras a distancia. Si querés empezar este año, todavía podés consultar la oferta disponible y elegir la modalidad que mejor se adapte a tu rutina.</p>

<h2>Dos formas de estudiar a distancia</h2>
<p>En <strong>Educación Distribuida</strong> cursás online y participás de encuentros presenciales en el Centro de Apoyo Universitario. En <strong>Educación Distribuida Home</strong> estudiás online desde donde estés y asistís al CAU para rendir las evaluaciones presenciales.</p>

<h2>Qué necesitás para comenzar</h2>
<p>Para ingresar a una carrera de grado o pregrado necesitás haber terminado el secundario. El equipo del CAU Villa Lugano te ayuda a revisar la carrera, la modalidad y la documentación de inscripción.</p>

<div class="art-aviso">
  <strong>La apertura está sujeta a cupo.</strong> La disponibilidad puede cambiar según la carrera y la modalidad elegida.
</div>

<div class="art-cta">
  <p><a href="/#carreras">Explorá las carreras disponibles</a> o <a href="/contacto">consultanos en el CAU Villa Lugano</a> para conocer las opciones con ingreso en octubre.</p>
</div>
  $html$,
  '/imagenes/novedades/inscripciones-octubre-carreras-distancia.jpg',
  false,
  true,
  'Conocé las modalidades a distancia y cómo consultar las carreras disponibles para comenzar en octubre.',
  '2026-09-20T15:00:00.000Z',
  'Institucional',
  '/novedades/articulo/inscripciones-octubre-carreras-distancia',
  'inscripciones-octubre-carreras-distancia',
  now(),
  now()
where not exists (
  select 1 from novedades where slug = 'inscripciones-octubre-carreras-distancia'
);

insert into novedades (
  titulo, contenido, imagen_url, pinned, publicada, extracto, fecha, tag,
  href, slug, created_at, updated_at
)
select
  'Qué hace un técnico en Redes Informáticas',
  $html$
<p>Cada videollamada, sistema interno o servicio en la nube depende de una infraestructura que tiene que mantenerse conectada, estable y segura. El técnico en Redes Informáticas trabaja sobre esa base: configura equipos, administra conexiones y ayuda a resolver incidentes.</p>

<h2>Qué tareas puede realizar</h2>
<ul class="art-rubros">
  <li><strong>Configurar redes</strong> Routers, switches, WiFi, VPN y direccionamiento IP.</li>
  <li><strong>Administrar infraestructura</strong> Servidores, servicios de red y recursos en la nube.</li>
  <li><strong>Detectar fallas</strong> Revisar conexiones, configuraciones y rendimiento para recuperar un servicio.</li>
  <li><strong>Proteger accesos</strong> Aplicar controles y medidas básicas de seguridad de red.</li>
</ul>

<h2>Dónde puede trabajar</h2>
<p>El perfil se necesita en empresas de tecnología, proveedores de Internet, telecomunicaciones, bancos, industrias, organismos públicos y equipos internos de sistemas. También puede desarrollarse en soporte IT, infraestructura, administración de servidores y servicios cloud.</p>

<h2>Qué se estudia en Teclab</h2>
<p>La Tecnicatura Superior en Redes Informáticas dura dos años y se cursa 100% online. El plan integra networking, servidores, cloud, automatización, seguridad y prácticas profesionales.</p>

<div class="art-cta">
  <p>Conocé la <a href="/carreras/tecnicatura-superior-en-redes-informaticas">Tecnicatura Superior en Redes Informáticas</a> y consultanos para recibir información sobre la inscripción.</p>
</div>
  $html$,
  '/imagenes/novedades/que-hace-tecnico-redes-informaticas.jpg',
  false,
  true,
  'Tareas, conocimientos y espacios de trabajo de un técnico en Redes Informáticas, una carrera online de dos años.',
  '2026-09-20T14:00:00.000Z',
  'Teclab',
  '/novedades/articulo/que-hace-tecnico-redes-informaticas',
  'que-hace-tecnico-redes-informaticas',
  now(),
  now()
where not exists (
  select 1 from novedades where slug = 'que-hace-tecnico-redes-informaticas'
);
