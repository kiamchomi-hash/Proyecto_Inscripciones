-- AmplÃ­a dos piezas editoriales para consultas genÃ©ricas detectadas en Search Console.
-- Se corre manualmente con `npm run db -- --archivo sql/2026-09-15_crecimiento_editorial.sql`.

UPDATE public.novedades
SET titulo = 'QuÃ© hace un administrador cloud y quÃ© se estudia',
    contenido = $cloud$
<p>Un <strong>administrador cloud</strong> diseÃ±a, configura y mantiene servicios de tecnologÃ­a que funcionan en la nube. Su trabajo combina infraestructura, redes, bases de datos, seguridad y monitoreo para que las aplicaciones y la informaciÃ³n de una organizaciÃ³n estÃ©n disponibles y puedan crecer.</p>

<h2>QuÃ© hace un administrador cloud</h2>
<p>En el dÃ­a a dÃ­a puede preparar recursos en AWS, Microsoft Azure o Google Cloud, administrar servidores y almacenamiento, revisar el rendimiento de los servicios, resolver incidentes y controlar el uso de la infraestructura. TambiÃ©n participa en la implementaciÃ³n de polÃ­ticas de seguridad, copias de respaldo y medidas para optimizar costos.</p>

<h2>QuÃ© se estudia en Cloud Administration</h2>
<p>La carrera integra <strong>cloud computing, administraciÃ³n de sistemas e infraestructura IT</strong>. El recorrido incluye fundamentos de redes, arquitectura de soluciones, bases de datos, diseÃ±o de sistemas de informaciÃ³n, gestiÃ³n operativa en la nube, resoluciÃ³n de problemas y prÃ¡cticas profesionalizantes.</p>
<p>La propuesta de Teclab fue creada en alianza con AWS Academy y prepara para trabajar con entornos multicloud. La cursada tambiÃ©n permite familiarizarse con herramientas para monitorear sistemas, administrar servicios y construir arquitecturas escalables.</p>

<h2>Salida laboral</h2>
<p>Con esta formaciÃ³n podÃ©s orientar tu perfil a puestos como <strong>administrador cloud, analista de infraestructura IT, especialista en automatizaciÃ³n de servidores o soporte de operaciones</strong>. Es una base para seguir creciendo hacia Ã¡reas de DevOps, seguridad cloud y arquitectura de soluciones.</p>

<div class="art-ficha"><dl>
  <dt>DuraciÃ³n</dt><dd>2 aÃ±os</dd>
  <dt>Modalidad</dt><dd>100% online</dd>
  <dt>TÃ­tulo</dt><dd>TÃ©cnico Superior en AdministraciÃ³n de Servicios en la Nube</dd>
  <dt>Certificado intermedio</dt><dd>Asistente en AdministraciÃ³n de Servicios en la Nube</dd>
</dl></div>

<div class="art-cta"><p>ConocÃ© el <a href="/carreras/tecnicatura-superior-en-cloud-administration">plan de estudios de Cloud Administration</a> y consultÃ¡ cÃ³mo inscribirte en el CAU Villa Lugano.</p></div>
    $cloud$,
    extracto = 'QuÃ© hace un administrador cloud, quÃ© se estudia en Cloud Administration y cuÃ¡les son sus principales salidas laborales.',
    updated_at = now()
WHERE slug = 'que-hace-un-administrador-cloud';

INSERT INTO public.novedades (
  titulo, contenido, imagen_url, pinned, publicada, extracto, fecha, tag,
  href, slug, created_at, updated_at
)
SELECT
  'QuÃ© hace un procurador y dÃ³nde puede trabajar',
  $procurador$
<p>Un <strong>procurador</strong> se ocupa de la representaciÃ³n procesal y de las gestiones que permiten que un expediente avance. Trabaja en contacto con abogados, clientes, juzgados y organismos pÃºblicos, con especial atenciÃ³n a la documentaciÃ³n y los plazos.</p>

<h2>CuÃ¡les son las tareas de un procurador</h2>
<p>Entre sus tareas estÃ¡n presentar escritos y documentaciÃ³n, recibir notificaciones, controlar plazos procesales y hacer el seguimiento de expedientes. TambiÃ©n puede realizar trÃ¡mites judiciales y administrativos, organizar la informaciÃ³n de una causa y colaborar con un equipo jurÃ­dico.</p>

<h2>QuÃ© se estudia en la carrera de Procurador</h2>
<p>La formaciÃ³n combina las bases del derecho con el funcionamiento prÃ¡ctico de los procesos judiciales. El plan incluye Derecho Constitucional, Derecho Privado, Derecho Penal, Derecho Procesal, Derecho Administrativo, Derecho Tributario, Sociedades, MediaciÃ³n y Ã‰tica Profesional.</p>
<p>La carrera de Procurador de Universidad Siglo 21 dura <strong>3 aÃ±os</strong> y se puede estudiar a distancia. La modalidad incluye acompaÃ±amiento acadÃ©mico y distintas opciones de cursado segÃºn la sede y el recorrido elegido.</p>

<h2>DÃ³nde puede trabajar un procurador</h2>
<p>Puede desempeÃ±arse en estudios jurÃ­dicos, departamentos legales de empresas, juzgados, tribunales y organismos pÃºblicos. TambiÃ©n puede trabajar en la gestiÃ³n independiente de trÃ¡mites y diligencias, dentro del alcance de su formaciÃ³n y de la normativa vigente.</p>

<h2>Diferencia entre procurador y abogado</h2>
<p>El abogado asesora, interpreta las normas y define la estrategia de defensa. El procurador se concentra en la representaciÃ³n procesal, la presentaciÃ³n de escritos, las notificaciones y el seguimiento de los trÃ¡mites. Son funciones distintas y complementarias dentro de un proceso judicial.</p>

<div class="art-ficha"><dl>
  <dt>DuraciÃ³n</dt><dd>3 aÃ±os</dd>
  <dt>Modalidad</dt><dd>A distancia</dd>
  <dt>TÃ­tulo</dt><dd>Procurador/a</dd>
  <dt>Ãrea</dt><dd>Derecho y procesos judiciales</dd>
</dl></div>

<div class="art-cta"><p>ConocÃ© la <a href="/carreras/procurador">carrera de Procurador</a>, revisÃ¡ el plan de estudios y consultÃ¡ cÃ³mo inscribirte.</p></div>
    $procurador$,
  '/imagenes/novedades/que-hace-un-procurador.jpg', false, true,
  'QuÃ© hace un procurador, quÃ© se estudia, cuÃ¡l es la diferencia con AbogacÃ­a y dÃ³nde puede trabajar.',
  '2026-09-15T03:00:00.000Z', 'AcadÃ©mico',
  '/novedades/articulo/que-hace-un-procurador', 'que-hace-un-procurador', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.novedades WHERE slug = 'que-hace-un-procurador');
