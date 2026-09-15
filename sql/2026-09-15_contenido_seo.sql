-- Refuerza tres racimos de consultas genéricas medidos en Search Console.
-- Se corre con `npm run db -- --archivo sql/2026-09-15_contenido_seo.sql`.

update novedades
set contenido = replace(
  replace(
    contenido,
    '<tr><td>Procurador</td>',
    '<tr><td><a href="/carreras/procurador">Procurador</a></td>'
  ),
  '/carreras/tecnicatura-superior-en-customer-experience',
  '/carreras/tecnicatura-superior-en-experiencia-del-cliente'
), updated_at = now()
where slug in (
  'tecnicaturas-pregrado-dos-tres-anos',
  'que-hace-un-administrador-cloud'
);

insert into novedades (
  titulo, contenido, imagen_url, pinned, publicada, extracto, fecha, tag,
  href, slug, created_at, updated_at
)
select
  'Qué es compliance y qué se estudia',
  $html$
<p>Una <strong>formación en compliance</strong> prepara para reconocer riesgos legales, éticos y reputacionales, y convertir las normas de una organización en controles que se puedan aplicar y revisar.</p>

<h2>Qué se estudia en compliance</h2>
<p>El recorrido empieza por el marco normativo y la ética empresarial. Después avanza sobre las herramientas que sostienen un programa de cumplimiento:</p>
<ul class="art-rubros">
  <li><strong>Evaluación de riesgos</strong> Corrupción, conflictos de intereses, fraude y riesgos de terceros.</li>
  <li><strong>Políticas y controles</strong> Códigos de conducta, procedimientos internos y medidas disciplinarias.</li>
  <li><strong>Canales de denuncia</strong> Recepción de reportes y protección de quien informa un incumplimiento.</li>
  <li><strong>Seguimiento</strong> Monitoreo, reportes a la dirección y mejora continua.</li>
</ul>

<h2>Prevención de lavado y nuevas tecnologías</h2>
<p>La formación también introduce los sistemas de prevención de lavado de activos y financiamiento del terrorismo, la normativa de la UIF y las recomendaciones del GAFI. El tramo final trabaja casos prácticos, criterios ESG y herramientas RegTech aplicadas al cumplimiento.</p>

<dl class="art-ficha">
  <dt>Duración</dt><dd>4 meses</dd>
  <dt>Modalidad</dt><dd>100% online, con encuentros en vivo</dd>
  <dt>Programa</dt><dd>4 módulos</dd>
  <dt>Certificación</dt><dd>Nacional e internacional</dd>
</dl>

<div class="art-cta">
  <p>Consultá el programa completo de la <a href="/carreras/diplomatura-en-compliance">Diplomatura en Compliance</a> y dejanos tus datos para recibir información sobre la próxima cursada.</p>
</div>
  $html$,
  '/imagenes/novedades/que-es-compliance.jpg',
  false,
  true,
  'Qué abarca una formación en compliance: riesgos, programas de cumplimiento, canales de denuncia, prevención de lavado y RegTech.',
  '2026-09-15T03:00:00.000Z',
  'Formación',
  '/novedades/articulo/que-es-compliance',
  'que-es-compliance',
  now(),
  now()
where not exists (
  select 1 from novedades where slug = 'que-es-compliance'
);
