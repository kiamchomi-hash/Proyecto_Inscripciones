-- Actualización puntual de novedades públicas; conservar slugs y fechas originales.
UPDATE novedades SET publicada = 0 WHERE id = 69 AND slug = 'donde-queda-el-cau-villa-lugano' AND publicada = 1;

UPDATE novedades SET
  titulo = 'Inscripciones 2027 en Universidad Siglo 21',
  extracto = 'La inscripción para estudiar en Universidad Siglo 21 en 2027 está abierta. Consultá las carreras y cómo inscribirte online.',
  contenido = '<p>La inscripción para estudiar en <strong>Universidad Siglo 21 en 2027</strong> está abierta. Podés consultar las carreras y realizar la inscripción online.</p>
<h2>Elegí tu carrera</h2>
<p>En el <a href="/">catálogo de carreras</a> podés consultar los planes de estudio y la duración de cada propuesta.</p>
<h2>Cómo inscribirte</h2>
<p>Escribinos por <a href="https://wa.me/5491166522722">WhatsApp</a> o completá el <a href="/contacto">formulario de contacto</a> para consultar los pasos de inscripción, la documentación y la fecha de inicio correspondiente.</p>'
WHERE id = 60 AND slug = 'inicio-de-clases' AND publicada = 1;

UPDATE novedades SET
  titulo = 'Cómo inscribirse online en Universidad Siglo 21',
  extracto = 'Consultá la oferta de carreras a distancia y los pasos para inscribirte online en 2027.',
  contenido = '<p>La inscripción para las carreras de <strong>Universidad Siglo 21 en 2027</strong> está abierta y podés realizarla online.</p>
<h2>Consultá las carreras</h2>
<p>Revisá la oferta, los planes y las duraciones en el <a href="/">catálogo de carreras</a>.</p>
<h2>Consultá cómo inscribirte</h2>
<p>Escribinos por <a href="https://wa.me/5491166522722">WhatsApp</a> o completá el <a href="/contacto">formulario de contacto</a> para conocer los pasos, la documentación y la fecha de inicio correspondiente.</p>'
WHERE id = 73 AND slug = 'inscripciones-octubre-carreras-distancia' AND publicada = 1;

UPDATE novedades SET
  titulo = 'Qué es un CAU y cómo te acompaña',
  extracto = 'Conocé cómo te acompañamos para elegir una carrera e inscribirte online en Universidad Siglo 21.',
  contenido = '<p>Un <strong>Centro de Aprendizaje Universitario</strong> acompaña a estudiantes de Universidad Siglo 21 con consultas sobre carreras, inscripción y trámites.</p>
<h2>Inscripción online</h2>
<p>Podés consultar la oferta e inscribirte online. Te ayudamos a revisar la carrera y la documentación necesaria.</p>
<h2>Conocé la oferta</h2>
<p>En el <a href="/">catálogo</a> podés consultar carreras de grado y pregrado. También podés conocer las <a href="/teclab">tecnicaturas de Teclab</a>.</p>
<p>Si tenés dudas, escribinos por <a href="https://wa.me/5491166522722">WhatsApp</a> o completá el <a href="/contacto">formulario de contacto</a>.</p>'
WHERE id = 62 AND slug = 'que-es-el-cau-villa-lugano' AND publicada = 1;

UPDATE novedades SET contenido = replace(contenido, 'en el CAU Villa Lugano', 'online') WHERE id = 70 AND slug = 'que-hace-un-administrador-cloud' AND publicada = 1;
UPDATE novedades SET contenido = replace(contenido, 'El CAU Villa Lugano organiza', 'El centro organiza') WHERE id = 63 AND slug = 'clases-de-apoyo-como-reservar-turno' AND publicada = 1;
UPDATE novedades SET contenido = replace(replace(contenido, 'Todas a distancia, con la sede de Villa Lugano como punto de apoyo.', 'Todas a distancia.'), 'Agroinformática, ', '') WHERE id = 64 AND slug = 'carreras-de-grado-a-distancia' AND publicada = 1;
