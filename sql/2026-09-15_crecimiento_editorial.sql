-- Amplía dos piezas editoriales para consultas genéricas detectadas en Search Console.
-- Se corre manualmente con `npm run db -- --archivo sql/2026-09-15_crecimiento_editorial.sql`.

UPDATE public.novedades
SET titulo = 'Qué hace un administrador cloud y qué se estudia',
    contenido = $cloud$
<p>Un <strong>administrador cloud</strong> diseña, configura y mantiene servicios de tecnología que funcionan en la nube. Su trabajo combina infraestructura, redes, bases de datos, seguridad y monitoreo para que las aplicaciones y la información de una organización estén disponibles y puedan crecer.</p>

<h2>Qué hace un administrador cloud</h2>
<p>En el día a día puede preparar recursos en AWS, Microsoft Azure o Google Cloud, administrar servidores y almacenamiento, revisar el rendimiento de los servicios, resolver incidentes y controlar el uso de la infraestructura. También participa en la implementación de políticas de seguridad, copias de respaldo y medidas para optimizar costos.</p>

<h2>Qué se estudia en Cloud Administration</h2>
<p>La carrera integra <strong>cloud computing, administración de sistemas e infraestructura IT</strong>. El recorrido incluye fundamentos de redes, arquitectura de soluciones, bases de datos, diseño de sistemas de información, gestión operativa en la nube, resolución de problemas y prácticas profesionalizantes.</p>
<p>La propuesta de Teclab fue creada en alianza con AWS Academy y prepara para trabajar con entornos multicloud. La cursada también permite familiarizarse con herramientas para monitorear sistemas, administrar servicios y construir arquitecturas escalables.</p>

<h2>Salida laboral</h2>
<p>Con esta formación podés orientar tu perfil a puestos como <strong>administrador cloud, analista de infraestructura IT, especialista en automatización de servidores o soporte de operaciones</strong>. Es una base para seguir creciendo hacia áreas de DevOps, seguridad cloud y arquitectura de soluciones.</p>

<div class="art-ficha"><dl>
  <dt>Duración</dt><dd>2 años</dd>
  <dt>Modalidad</dt><dd>100% online</dd>
  <dt>Título</dt><dd>Técnico Superior en Administración de Servicios en la Nube</dd>
  <dt>Certificado intermedio</dt><dd>Asistente en Administración de Servicios en la Nube</dd>
</dl></div>

<div class="art-cta"><p>Conocé el <a href="/carreras/tecnicatura-superior-en-cloud-administration">plan de estudios de Cloud Administration</a> y consultá cómo inscribirte en el CAU Villa Lugano.</p></div>
    $cloud$,
    extracto = 'Qué hace un administrador cloud, qué se estudia en Cloud Administration y cuáles son sus principales salidas laborales.',
    updated_at = now()
WHERE slug = 'que-hace-un-administrador-cloud';

INSERT INTO public.novedades (
  titulo, contenido, imagen_url, pinned, publicada, extracto, fecha, tag,
  href, slug, created_at, updated_at
)
SELECT
  'Qué hace un procurador y dónde puede trabajar',
  $procurador$
<p>Un <strong>procurador</strong> se ocupa de la representación procesal y de las gestiones que permiten que un expediente avance. Trabaja en contacto con abogados, clientes, juzgados y organismos públicos, con especial atención a la documentación y los plazos.</p>

<h2>Cuáles son las tareas de un procurador</h2>
<p>Entre sus tareas están presentar escritos y documentación, recibir notificaciones, controlar plazos procesales y hacer el seguimiento de expedientes. También puede realizar trámites judiciales y administrativos, organizar la información de una causa y colaborar con un equipo jurídico.</p>

<h2>Qué se estudia en la carrera de Procurador</h2>
<p>La formación combina las bases del derecho con el funcionamiento práctico de los procesos judiciales. El plan incluye Derecho Constitucional, Derecho Privado, Derecho Penal, Derecho Procesal, Derecho Administrativo, Derecho Tributario, Sociedades, Mediación y Ética Profesional.</p>
<p>La carrera de Procurador de Universidad Siglo 21 dura <strong>3 años</strong> y se puede estudiar a distancia. La modalidad incluye acompañamiento académico y distintas opciones de cursado según la sede y el recorrido elegido.</p>

<h2>Dónde puede trabajar un procurador</h2>
<p>Puede desempeñarse en estudios jurídicos, departamentos legales de empresas, juzgados, tribunales y organismos públicos. También puede trabajar en la gestión independiente de trámites y diligencias, dentro del alcance de su formación y de la normativa vigente.</p>

<h2>Diferencia entre procurador y abogado</h2>
<p>El abogado asesora, interpreta las normas y define la estrategia de defensa. El procurador se concentra en la representación procesal, la presentación de escritos, las notificaciones y el seguimiento de los trámites. Son funciones distintas y complementarias dentro de un proceso judicial.</p>

<div class="art-ficha"><dl>
  <dt>Duración</dt><dd>3 años</dd>
  <dt>Modalidad</dt><dd>A distancia</dd>
  <dt>Título</dt><dd>Procurador/a</dd>
  <dt>Área</dt><dd>Derecho y procesos judiciales</dd>
</dl></div>

<div class="art-cta"><p>Conocé la <a href="/carreras/procurador">carrera de Procurador</a>, revisá el plan de estudios y consultá cómo inscribirte.</p></div>
    $procurador$,
  '/imagenes/novedades/que-hace-un-procurador.jpg', false, true,
  'Qué hace un procurador, qué se estudia, cuál es la diferencia con Abogacía y dónde puede trabajar.',
  '2026-09-15T03:00:00.000Z', 'Académico',
  '/novedades/articulo/que-hace-un-procurador', 'que-hace-un-procurador', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.novedades WHERE slug = 'que-hace-un-procurador');
