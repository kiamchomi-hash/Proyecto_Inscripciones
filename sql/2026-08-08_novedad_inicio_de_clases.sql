-- La novedad del inicio de clases pasa a ser perenne.
--
-- Estaba como `segundo-semestre-2026-inicio-3-de-agosto`: slug, titulo y cuerpo
-- clavados a una fecha que ya paso. Cada cambio de fecha obligaba a un slug
-- nuevo, y el viejo —que Google ya tenia indexado— quedaba devolviendo 404 o
-- redirigido, tirando a la basura la autoridad de la URL cada dos meses.
--
-- Ahora el slug es `inicio-de-clases` y no nombra ni la fecha ni el semestre:
-- el semestre ademas confundia, porque los leads llegan con la cursada
-- empezada y lo que preguntan es cuando arranca el proximo grupo, no en que
-- mitad del ano estamos.
--
-- La fecha vive en UN SOLO lugar del cuerpo, el <div class="art-cifra">, mas la
-- mencion del primer parrafo. Para actualizarla se cambian esos dos y listo:
-- ni el slug, ni el titulo, ni la imagen og (que lleva el titulo compuesto
-- encima) se tocan.
--
-- IMPORTANTE: correr esto DESPUES de que el deploy con el redirect 301 de
-- next.config.ts este en produccion. Al revez, la URL vieja devuelve 404 en la
-- ventana entre el UPDATE y el deploy.

begin;

update public.novedades set
  titulo   = 'Cuándo empiezan las clases en el CAU Villa Lugano',
  extracto = 'El próximo inicio de cursada es en octubre de 2026 y la inscripción ya está abierta. Qué papeles necesitás y qué conviene empezar primero para llegar a tiempo.',
  fecha    = '2026-08-08',
  slug     = 'inicio-de-clases',
  href     = '/novedades/articulo/inicio-de-clases',
  imagen_url = '/imagenes/novedades/inicio-de-clases.jpg',
  contenido = $html$
<p>Las carreras a distancia de la Universidad Siglo 21 tienen <strong>varias fechas de inicio a lo largo del año</strong>. El próximo arranque de cursada es en <strong>octubre de 2026</strong> y la inscripción ya está abierta: cada comisión abre por cupo, así que conviene no dejar el trámite para la última semana.</p>

<div class="art-cifra"><strong>Octubre de 2026</strong> <span>Próximo inicio de cursada</span></div>

<h2>Si el inicio te queda encima</h2>
<p>No hay que esperar al año que viene. Como hay varios arranques por año, si no llegás con los papeles a este te anotamos para el siguiente y vas adelantando el legajo mientras tanto. Escribinos contando en qué está tu trámite y te decimos cuál es el inicio más cercano al que llegás.</p>
<p>Las <a href="/novedades/articulo/identidad-argentina-diplomaturas">diplomaturas de Identidad Argentina</a> funcionan distinto: abren comisiones nuevas casi todos los meses y, si la comisión recién arrancó, todavía se puede entrar con la cursada empezada.</p>

<h2>Qué tenés que tener listo</h2>
<p>La inscripción se completa con el legajo. Estos son los papeles que pide la universidad:</p>
<ul class="art-check">
  <li>Solicitud de inscripción completa, fechada y con firma certificada.</li>
  <li>DNI vigente, frente y dorso.</li>
  <li>Analítico secundario legalizado, o título secundario legalizado.</li>
  <li>Dos fotos color de 3 × 3.</li>
  <li>Ficha médica oficial.</li>
</ul>

<div class="art-nota art-nota--aviso">
  <p><strong>Empezá por el analítico</strong> A eso se suma el pago de la matrícula y los aranceles. Si alguno de esos trámites te puede demorar —la legalización del analítico es el clásico—, arrancalo ahora.</p>
  <p>Lo desarrollamos en <a href="/novedades/articulo/documentacion-legajo-inscripcion">la guía de documentación del legajo</a>.</p>
</div>

<h2>Si todavía no elegiste carrera</h2>
<p>En el <a href="/">catálogo del CAU</a> están todas las carreras que se dictan hoy. Cada ficha tiene el plan de estudios y la duración.</p>
<div class="art-tabla">
<table>
  <thead><tr><th>Grupo</th><th class="art-valor">Duración</th></tr></thead>
  <tbody>
    <tr><td><a href="/novedades/articulo/carreras-de-grado-a-distancia">Licenciaturas de grado</a></td><td class="art-valor">4 a 5 años</td></tr>
    <tr><td><a href="/novedades/articulo/tecnicaturas-pregrado-dos-tres-anos">Tecnicaturas de pregrado</a></td><td class="art-valor">2 a 3 años</td></tr>
    <tr><td><a href="/novedades/articulo/teclab-tecnicaturas-online">Tecnicaturas de Teclab</a></td><td class="art-valor">2 años</td></tr>
    <tr><td><a href="/novedades/articulo/identidad-argentina-diplomaturas">Diplomaturas de Identidad Argentina</a></td><td class="art-valor">1 a 6 meses</td></tr>
  </tbody>
</table>
</div>

<h2>Cómo seguimos</h2>
<div class="art-cta">
  <p>Escribinos por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a> o dejanos tus datos en <a href="/contacto">el formulario de contacto</a> y te acompañamos con el trámite de punta a punta. También podés acercarte a la sede, en <strong>Guaminí 4876</strong>, Villa Lugano.</p>
</div>

<p class="art-fuente"><em>Las fechas de inicio siguen el calendario académico oficial de Educación Distribuida, publicado en <a href="https://www.lanube.21.edu.ar/calendario-acad%C3%A9mico-distancia" target="_blank">lanube.21.edu.ar</a>. El día exacto lo confirmamos en la sede antes de cerrar la inscripción.</em></p>
$html$
where id = 60;

-- Los dos articulos que enlazaban al slug viejo. El de la sede ademas decia
-- "inicio del semestre" en el texto del enlace, que es justo lo que se saco.
update public.novedades
set contenido = replace(
      contenido,
      '/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto',
      '/novedades/articulo/inicio-de-clases')
where contenido like '%segundo-semestre-2026-inicio-3-de-agosto%';

update public.novedades
set contenido = replace(contenido, '>inicio del semestre</a>', '>próximo inicio de clases</a>')
where id = 69;

commit;

-- Verificacion: 60 con el slug nuevo, y ninguna fila con el viejo.
select id, slug, titulo, fecha from public.novedades where id = 60;
select id, slug from public.novedades where contenido like '%segundo-semestre%';
