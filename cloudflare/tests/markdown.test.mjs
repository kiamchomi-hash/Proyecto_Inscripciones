import './helpers/alias.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestHarness } from 'wrangler';
import { existsSync } from 'node:fs';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';
import { htmlAMarkdown } from '../../lib/html-markdown.ts';
import { cabeceraLink, versionMarkdown } from '../src/entrega/cabeceras.ts';

// La versión markdown de las páginas: `/carreras/<slug>.md`,
// `/clases-apoyo/<slug>.md` y `/novedades/articulo/<slug>.md`.
//
// El gancho del alias va primero: los módulos que arman el markdown usan `@/`,
// que Node pelado no resuelve.

const { construirMarkdownCarrera } = await import('../src/entrega/markdown-carrera.ts');
const { construirMarkdownMateria } = await import('../src/entrega/markdown-materia.ts');
const { construirMarkdownArticulo } = await import('../src/entrega/markdown-articulo.ts');
const { construirMarkdownContacto } = await import('../src/entrega/markdown-contacto.ts');
const { construirMarkdownCalendario } = await import('../src/entrega/markdown-calendario.ts');
const { construirMarkdownCatalogo } = await import('../src/entrega/markdown-catalogos.ts');
const { construirMarkdownInicio } = await import('../src/entrega/markdown-inicio.ts');
const { construirMarkdownNovedades } = await import('../src/entrega/markdown-novedades.ts');

const CONFIG = './dist/server/wrangler.json';

// ── El conversor de HTML ────────────────────────────────────────────────────

test('el HTML de los artículos pasa a markdown', () => {
  const markdown = htmlAMarkdown(
    '<p>Un <strong>CAU</strong> acompaña a estudiantes.</p>'
    + '<h2>Inscripción online</h2>'
    + '<p>Podés <a href="/contacto">escribinos</a>.</p>'
    + '<ul><li>Primer punto</li><li>Segundo punto</li></ul>'
    + '<p>Último párrafo con <em>énfasis</em>.</p>',
  );
  assert.match(markdown, /Un \*\*CAU\*\* acompaña a estudiantes\./);
  assert.match(markdown, /## Inscripción online/);
  assert.match(markdown, /Podés \[escribinos\]\(\/contacto\)\./);
  assert.match(markdown, /- Primer punto\n- Segundo punto/);
  assert.match(markdown, /Último párrafo con \*énfasis\*\./);
  assert.doesNotMatch(markdown, /</);
});

test('el conversor borra el script con su contenido y deja las tablas', () => {
  const markdown = htmlAMarkdown(
    '<p>Antes</p><script>globalThis.malo = 1</script>'
    + '<table><tbody><tr><th>Tema</th><td>Dato</td></tr><tr><th>Otro</th><td>Valor</td></tr></tbody></table>'
    + '<p>Después</p>',
  );
  assert.doesNotMatch(markdown, /malo|script/);
  assert.match(markdown, /\| Tema \| Dato \|/);
  assert.match(markdown, /\| --- \| --- \|/);
  assert.match(markdown, /\| Otro \| Valor \|/);
});

test('las entidades y las imágenes se convierten', () => {
  const markdown = htmlAMarkdown('<p>Caf&eacute; &amp; m&aacute;s</p><img src="/imagenes/a.jpg" alt="Una foto">');
  assert.match(markdown, /Café & más/);
  assert.match(markdown, /!\[Una foto\]\(\/imagenes\/a\.jpg\)/);
});

// ── La ficha de carrera ─────────────────────────────────────────────────────

const CARRERA_SIGLO21 = {
  id: 1, nombre: 'Licenciatura en Administración', nivel: 'Grado', duracion: '4 años',
  titulo: 'Licenciatura en Administración', enfoque: 'Gestión y estrategia.',
  modalidad: 'A distancia', descripcion: 'Formación en gestión de organizaciones.',
  prefix: 'Licenciatura', nombre_corto: 'Administración', seccion_duracion: null,
  seccion_modalidad: null, plan_estudios: null, slides: [
    { type: 'portada', bullets: ['Gestionar personas', 'Analizar datos'] },
    {
      type: 'plan_estudios',
      paginas: [{
        izquierda: { año: 'Primer año', cuatrimestres: [
          { label: '1er cuatrimestre', materias: ['Administración I', 'Economía I'] },
          { label: '2do cuatrimestre', materias: ['Administración II'] },
        ] },
      }],
    },
    { type: 'faq', items: [{ pregunta: '¿Necesito título?', respuesta: 'No, alcanza con el secundario.' }] },
  ],
  orden: 1, activa: true, destacada: false, nueva: false, proximamente: false,
};

test('la ficha de carrera sale con los datos, el plan y las preguntas', () => {
  const markdown = construirMarkdownCarrera(CARRERA_SIGLO21, 'https://www.siglo21sur.com/carreras/licenciatura-en-administracion');
  assert.match(markdown, /^# Licenciatura en Administración\n/);
  assert.match(markdown, /> Formación en gestión de organizaciones\./);
  assert.match(markdown, /- \*\*Nivel:\*\* Grado/);
  assert.match(markdown, /- \*\*Duración:\*\* 4 años/);
  assert.match(markdown, /- \*\*Título:\*\* Licenciatura en Administración/);
  assert.match(markdown, /- \*\*Modalidad:\*\* A distancia/);
  assert.match(markdown, /- \*\*Institución:\*\* Universidad Siglo 21/);
  assert.match(markdown, /## Lo que vas a aprender\n\n- Gestionar personas\n- Analizar datos/);
  assert.match(markdown, /## Plan de estudios\n\n### Primer año\n\n\*\*1er cuatrimestre\*\*/);
  assert.match(markdown, /- Administración I/);
  assert.match(markdown, /## Preguntas frecuentes\n\n### ¿Necesito título\?/);
  assert.match(markdown, /- \*\*Consultar por WhatsApp:\*\* https:\/\/wa\.me\/5491132973801/);
  assert.match(markdown, /- \*\*Inscribirse:\*\* https:\/\/www\.siglo21sur\.com\/carreras\/licenciatura-en-administracion\/inscripcion/);
  // Ningún precio: se consulta, no se publica.
  assert.doesNotMatch(markdown, /\$\s?\d/);
  assert.doesNotMatch(markdown, /\d+\s?pesos/i);
});

test('una carrera de Teclab sale con sus competencias y su salida laboral', () => {
  const markdown = construirMarkdownCarrera({
    id: 2, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología',
    duracion: '2 años', titulo: 'Técnico Superior en Programación', enfoque: '',
    modalidad: '100% Online',
    descripcion: 'Estudiá programación a distancia. Empresas de desarrollo de software.',
    prefix: 'Tecnicatura Superior en', nombre_corto: 'Programación', seccion_duracion: null,
    seccion_modalidad: 'Desarrollar aplicaciones\n· bases de datos',
    plan_estudios: 'Primer Año | 1er cuatrimestre\n• Lógica\n• Algoritmos',
    slides: null, orden: 1, activa: true, destacada: false, nueva: false, proximamente: false,
  }, 'https://www.siglo21sur.com/carreras/tecnicatura-superior-en-programacion');
  assert.match(markdown, /- \*\*Institución:\*\* Teclab · Instituto Técnico Superior/);
  assert.match(markdown, /## Competencias\n\n- Desarrollar aplicaciones\n- bases de datos/);
  assert.match(markdown, /## Salida laboral\n\nEmpresas de desarrollo de software\./);
  assert.match(markdown, /### Primer Año\n\n\*\*1er cuatrimestre\*\*/);
});

test('una diplomatura de Identidad Argentina sale con su docente y sin la cola', () => {
  const markdown = construirMarkdownCarrera({
    id: 3, nombre: 'Diplomatura en Oratoria', nivel: 'Identidad Argentina', duracion: '2 meses',
    titulo: 'Certificación Nacional e Internacional', enfoque: 'Modalidad: 100% Online',
    modalidad: 'A distancia',
    descripcion: 'Mejorar la confianza. Docente: Lic. Marisol Poletti. Escuela de Liderazgo.',
    prefix: 'Diplomatura', nombre_corto: 'Oratoria', seccion_duracion: null,
    seccion_modalidad: 'Lic. Marisol Poletti\n· Belga en comunicación',
    plan_estudios: 'Módulo 1: Introducción\n• Qué es la oratoria',
    slides: null, orden: 1, activa: true, destacada: false, nueva: false, proximamente: false,
  }, 'https://www.siglo21sur.com/carreras/diplomatura-en-oratoria');
  assert.match(markdown, /- \*\*Institución:\*\* Academia Identidad Argentina/);
  assert.match(markdown, /- \*\*Escuela:\*\* Diplomatura/);
  assert.doesNotMatch(markdown, /Docente: Lic\. Marisol/);
  assert.match(markdown, /> Mejorar la confianza\./);
  assert.match(markdown, /## Tu docente\n\n\*\*Lic\. Marisol Poletti\*\*/);
});

// ── La clase de apoyo y el artículo ─────────────────────────────────────────

test('la clase de apoyo sale con su descripción y su texto largo', () => {
  const markdown = construirMarkdownMateria({
    slug: 'matematica', label: 'Matemática', nombre_profesor: 'Docente sintético',
    whatsapp: '1111111111', telefono_display: '11 1111-1111',
    descripcion: ['Clases <strong>presenciales</strong>, individuales o en grupo reducido.'],
    texto_seo: ['Se cubren los contenidos habituales de primaria y secundaria.'],
  }, 'https://www.siglo21sur.com/clases-apoyo/matematica');
  assert.match(markdown, /^# Clases particulares de Matemática en Villa Lugano\n/);
  assert.match(markdown, /> Clases \*\*presenciales\*\*, individuales o en grupo reducido\./);
  assert.doesNotMatch(markdown, /<strong>/);
  assert.match(markdown, /- \*\*Profesor:\*\* Docente sintético/);
  assert.match(markdown, /## Clases de apoyo\n\nSe cubren los contenidos habituales/);
  assert.match(markdown, /## Reservar un turno/);
});

test('el artículo sale con su extracto, su fecha y el cuerpo convertido', () => {
  const markdown = construirMarkdownArticulo({
    titulo: 'Qué es un CAU', slug: 'que-es-el-cau',
    extracto: 'Conocé cómo te acompañamos.', fecha: '2026-07-23', tag: 'Carreras',
    contenido: '<p>Un <strong>CAU</strong> acompaña.</p><h2>Inscripción</h2><p>Online.</p>',
  }, 'https://www.siglo21sur.com/novedades/articulo/que-es-el-cau');
  assert.match(markdown, /^# Qué es un CAU\n/);
  assert.match(markdown, /> Conocé cómo te acompañamos\./);
  assert.match(markdown, /- \*\*Fecha:\*\* 23 de julio de 2026/);
  assert.match(markdown, /- \*\*Sección:\*\* Carreras/);
  assert.match(markdown, /## Inscripción/);
  assert.doesNotMatch(markdown, /</);
});

// ── Las páginas fijas ───────────────────────────────────────────────────────

test('la página de contacto sale con los datos de la sede', () => {
  const markdown = construirMarkdownContacto('https://www.siglo21sur.com/contacto');
  assert.match(markdown, /^# Contacto\n/);
  assert.match(markdown, /- \*\*WhatsApp:\*\* 11 3297-3801 — https:\/\/wa\.me\/5491132973801/);
  assert.match(markdown, /- \*\*Teléfono:\*\* \+5491132973801/);
  assert.match(markdown, /- \*\*Correo:\*\* inscripciones@siglo21sur\.com/);
  assert.match(markdown, /- \*\*Horario de atención por WhatsApp:\*\* Lun a Vie, 8 a 20 hs/);
  assert.match(markdown, /- \*\*Dirección:\*\* Guaminí 4876, Villa Lugano, Ciudad Autónoma de Buenos Aires, C1439, AR/);
  assert.match(markdown, /- \*\*Mapa:\*\* https:\/\/maps\.app\.goo\.gl\/mXu8TUH6FCLQvuYYA/);
  assert.match(markdown, /- \*\*Página:\*\* https:\/\/www\.siglo21sur\.com\/contacto/);
});

test('el calendario sale con la estructura del ciclo y sus preguntas', () => {
  const markdown = construirMarkdownCalendario('https://www.siglo21sur.com/calendario-academico');
  assert.match(markdown, /^# Calendario académico\n/);
  assert.match(markdown, /- \*\*Aperturas de cursada:\*\* marzo, mayo, agosto, octubre\./);
  assert.match(markdown, /- \*\*Tramos por semestre:\*\* 2\./);
  assert.match(markdown, /\| 1 a 4 \| Primer parcial \|/);
  assert.match(markdown, /\| 9 \| Recuperatorio e integrador \|/);
  assert.match(markdown, /- \*\*MIA — Materias de Integración y Aplicación:\*\* semanas 4, 5, 7, 8\./);
  assert.match(markdown, /### ¿Cuándo empiezan las clases en 2027\?/);
});

test('una página de catálogo sale con su resumen y sus secciones', () => {
  const markdown = construirMarkdownCatalogo({
    titulo: 'Teclab',
    descripcion: 'Tecnicaturas y cursos Teclab 100% online.',
    url: 'https://www.siglo21sur.com/teclab',
    secciones: [
      { titulo: 'Tecnicaturas', items: [{ nombre: 'Programación', url: 'https://www.siglo21sur.com/carreras/x', nota: '2 años.' }] },
      { titulo: 'Vacía', items: [] },
    ],
  });
  assert.match(markdown, /^# Teclab\n/);
  assert.match(markdown, /> Tecnicaturas y cursos Teclab 100% online\./);
  assert.match(markdown, /## Tecnicaturas\n\n- \[Programación\]\(https:\/\/www\.siglo21sur\.com\/carreras\/x\): 2 años\./);
  // La sección sin elementos no sale.
  assert.doesNotMatch(markdown, /## Vacía/);
});

// ── La home y el listado de novedades ──────────────────────────────────────

test('la home sale con la oferta agrupada por área', () => {
  const carreras = [
    {
      nombre: 'Licenciatura en Administración', prefix: 'Licenciatura', nivel: 'Grado',
      descripcion: 'Formación en gestión de organizaciones.', duracion: '4 años',
      titulo: 'Licenciatura en Administración', modalidad: 'A distancia', proximamente: false,
    },
    {
      nombre: 'Diplomatura en Oratoria', prefix: null, nivel: 'Identidad Argentina',
      descripcion: 'Oratoria y expresión.', duracion: '8 meses',
      titulo: 'Diplomatura en Oratoria', modalidad: 'Presencial', proximamente: false,
    },
  ];
  const markdown = construirMarkdownInicio(carreras, 'https://www.siglo21sur.com');

  assert.match(markdown, /^# Universidad Siglo 21 online: carreras e inscripciones\n/);
  assert.match(markdown, /- \*\*Índice del sitio para agentes:\*\* https:\/\/www\.siglo21sur\.com\/llms\.txt/);
  assert.match(markdown, /### Licenciaturas\n\n- \[Licenciatura en Administración\]\(https:\/\/www\.siglo21sur\.com\/carreras\/licenciatura-en-administracion\)/);
  // Identidad Argentina no está en la home: su ficha sigue publicada, pero la
  // vidriera la oculta, igual que la página.
  assert.doesNotMatch(markdown, /Oratoria/);
  assert.match(markdown, /## Contacto\n\n- \*\*WhatsApp:\*\* 11 3297-3801/);
});

test('el listado de novedades sale con su paginación', () => {
  const markdown = construirMarkdownNovedades({
    currentPage: 2,
    totalPages: 3,
    pinned: null,
    items: [{ slug: 'una', titulo: 'Una novedad', extracto: 'Lo que pasó.', fecha: '2026-10-20' }],
  }, 'https://www.siglo21sur.com/novedades/2');

  assert.match(markdown, /^# Novedades\n/);
  assert.match(markdown, /- \*\*Paginación:\*\* página 2 de 3/);
  assert.match(markdown, /## Artículos\n\n- \[Una novedad\]\(https:\/\/www\.siglo21sur\.com\/novedades\/articulo\/una\): Lo que pasó\. \(20 de octubre de 2026\)/);
  assert.doesNotMatch(markdown, /## Destacada/);
  assert.match(markdown, /- \[Página anterior\]\(https:\/\/www\.siglo21sur\.com\/novedades\/1\): página 1 de 3\./);
  assert.match(markdown, /- \[Página siguiente\]\(https:\/\/www\.siglo21sur\.com\/novedades\/3\): página 3 de 3\./);
});

test('la primera página del listado trae la destacada y no ofrece anterior', () => {
  const markdown = construirMarkdownNovedades({
    currentPage: 1,
    totalPages: 2,
    pinned: { slug: 'fija', titulo: 'La destacada', extracto: 'Va arriba.', fecha: '2026-10-25' },
    items: [{ slug: 'otra', titulo: 'Otra', extracto: null, fecha: '2026-10-24' }],
  }, 'https://www.siglo21sur.com/novedades/1');

  assert.match(markdown, /## Destacada\n\n- \[La destacada\]/);
  assert.doesNotMatch(markdown, /Página anterior/);
  assert.match(markdown, /- \[Página siguiente\]/);
});

// ── La cabecera Link ────────────────────────────────────────────────────────

test('la cabecera Link declara el markdown de la página y el llms.txt', () => {
  assert.equal(versionMarkdown('/carreras/licenciatura-en-administracion'),
    '/carreras/licenciatura-en-administracion.md');
  assert.equal(versionMarkdown('/clases-apoyo/matematica'), '/clases-apoyo/matematica.md');
  assert.equal(versionMarkdown('/novedades/articulo/que-es-el-cau'), '/novedades/articulo/que-es-el-cau.md');
  assert.equal(versionMarkdown('/faq'), '/faq.md');
  assert.equal(versionMarkdown('/contacto'), '/contacto.md');
  assert.equal(versionMarkdown('/calendario-academico'), '/calendario-academico.md');
  assert.equal(versionMarkdown('/sobre-nosotros'), '/sobre-nosotros.md');
  assert.equal(versionMarkdown('/teclab'), '/teclab.md');
  assert.equal(versionMarkdown('/clases-apoyo'), '/clases-apoyo.md');
  assert.equal(versionMarkdown('/test-vocacional'), '/test-vocacional.md');
  assert.equal(versionMarkdown('/'), '/index.md');
  assert.equal(versionMarkdown('/novedades/1'), '/novedades/1.md');
  assert.equal(versionMarkdown('/novedades/12'), '/novedades/12.md');
  assert.equal(versionMarkdown('/carreras/licenciatura-en-administracion/inscripcion'), null);
  assert.equal(versionMarkdown('/carreras/abc.md'), null);

  assert.equal(cabeceraLink('/carreras/abc', 'text/html'),
    '</carreras/abc.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"');
  assert.equal(cabeceraLink('/faq', 'text/html'),
    '</faq.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"');
  assert.equal(cabeceraLink('/', 'text/html'),
    '</index.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"');
  assert.equal(cabeceraLink('/novedades/1', 'text/html'),
    '</novedades/1.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"');
  assert.equal(cabeceraLink('/sobre-nosotros', 'text/html'),
    '</sobre-nosotros.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"');
  assert.equal(cabeceraLink('/carreras/abc.md', 'text/markdown; charset=utf-8'),
    '</llms.txt>; rel="describedby"');
  assert.equal(cabeceraLink('/llms.txt', 'text/markdown; charset=utf-8'), null);
  assert.equal(cabeceraLink('/sitemap.xml', 'application/xml'), null);
});

// ── Integración ─────────────────────────────────────────────────────────────

test('las versiones markdown se sirven en el build compilado', async t => {
  assert.ok(existsSync(CONFIG), 'Falta el build de Astro: correr `npm --prefix cloudflare run build`.');
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);

  const ficha = await astro.fetch('/carreras/licenciatura-en-administracion.md');
  assert.equal(ficha.status, 200);
  assert.equal(ficha.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(ficha.headers.get('cache-control'), 'no-store');
  assert.equal(ficha.headers.get('link'), '</llms.txt>; rel="describedby"');
  const texto = await ficha.text();
  assert.match(texto, /^# Licenciatura en Administración\n/);
  assert.match(texto, /- \*\*Institución:\*\* Universidad Siglo 21/);
  assert.match(texto, /## Inscripción/);

  // La ficha con portada: la sección de lo que vas a aprender.
  const conPortada = await astro.fetch('/carreras/contador-publico.md');
  assert.equal(conPortada.status, 200);
  assert.match(await conPortada.text(), /## Lo que vas a aprender\n\n- Ficha sintética/);

  // La página se declara con su versión markdown.
  const pagina = await astro.fetch('/carreras/licenciatura-en-administracion');
  assert.equal(pagina.headers.get('link'),
    '</carreras/licenciatura-en-administracion.md>; rel="alternate"; type="text/markdown", '
    + '</llms.txt>; rel="describedby"');

  const clase = await astro.fetch('/clases-apoyo/matematica.md');
  assert.equal(clase.status, 200);
  assert.match(await clase.text(), /^# Clases particulares de Matemática en Villa Lugano/);

  const articulo = await astro.fetch('/novedades/articulo/novedad-sintetica-1.md');
  assert.equal(articulo.status, 200);
  assert.match(await articulo.text(), /^# Novedad destacada sintética/);

  // Lo que no existe, no existe.
  assert.equal((await astro.fetch('/carreras/no-existe.md')).status, 404);
  assert.equal((await astro.fetch('/clases-apoyo/no-existe.md')).status, 404);
  assert.equal((await astro.fetch('/novedades/articulo/no-existe.md')).status, 404);
  // El borrador tampoco.
  assert.equal((await astro.fetch('/novedades/articulo/novedad-sintetica-13.md')).status, 404);
});

test('las páginas fijas tienen su versión markdown', async t => {
  assert.ok(existsSync(CONFIG), 'Falta el build de Astro.');
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);

  // El FAQ: las respuestas del acordeón salen del mismo JSX que la página.
  const faq = await astro.fetch('/faq.md');
  assert.equal(faq.status, 200);
  assert.equal(faq.headers.get('content-type'), 'text/markdown; charset=utf-8');
  const textoFaq = await faq.text();
  assert.match(textoFaq, /^# Preguntas frecuentes\n/);
  assert.match(textoFaq, /### ¿Dónde queda el CAU Villa Lugano\?/);
  assert.match(textoFaq, /Guaminí 4876/);
  assert.doesNotMatch(textoFaq, /<[a-z]/i);
  // Las zonas son una lista, no un montón de párrafos sueltos, y el texto de
  // los enlaces de redes no va pegado al teléfono.
  assert.match(textoFaq, /- Villa Lugano\n- Mataderos\n- Liniers\n/);
  assert.match(textoFaq, /- \[WhatsApp 11 3297-3801\]\(https:\/\/wa\.me\/5491132973801\)/);
  assert.doesNotMatch(textoFaq, /WhatsApp11/);

  // El contacto: los datos de la sede.
  const contacto = await astro.fetch('/contacto.md');
  assert.equal(contacto.status, 200);
  const textoContacto = await contacto.text();
  assert.match(textoContacto, /- \*\*WhatsApp:\*\* 11 3297-3801/);
  assert.match(textoContacto, /- \*\*Correo:\*\* inscripciones@siglo21sur\.com/);
  assert.match(textoContacto, /- \*\*Dirección:\*\* Guaminí 4876/);

  // El calendario: la estructura del ciclo.
  const calendario = await astro.fetch('/calendario-academico.md');
  assert.equal(calendario.status, 200);
  assert.match(await calendario.text(), /- \*\*Aperturas de cursada:\*\* marzo, mayo, agosto, octubre\./);

  // Sobre nosotros: las tarjetas y las preguntas de la sede.
  const sobre = await astro.fetch('/sobre-nosotros.md');
  assert.equal(sobre.status, 200);
  assert.match(await sobre.text(), /- \*\*Formación universitaria:\*\*/);

  // Las páginas de catálogo: la misma oferta que la página y el llms.txt.
  const teclab = await astro.fetch('/teclab.md');
  assert.equal(teclab.status, 200);
  assert.match(await teclab.text(), /## Tecnicaturas y cursos de Teclab/);

  const clases = await astro.fetch('/clases-apoyo.md');
  assert.equal(clases.status, 200);
  assert.match(await clases.text(), /- \[Matemática\]\(https:\/\/www\.siglo21sur\.com\/clases-apoyo\/matematica\)/);

  const vocacional = await astro.fetch('/test-vocacional.md');
  assert.equal(vocacional.status, 200);
  assert.match(await vocacional.text(), /## Carreras de la oferta/);

  // La home: la oferta agrupada, sin Identidad Argentina, y los datos de la sede.
  const inicio = await astro.fetch('/index.md');
  assert.equal(inicio.status, 200);
  assert.equal(inicio.headers.get('content-type'), 'text/markdown; charset=utf-8');
  const textoInicio = await inicio.text();
  assert.match(textoInicio, /^# Universidad Siglo 21 online: carreras e inscripciones\n/);
  assert.match(textoInicio, /### Licenciaturas/);
  assert.match(textoInicio, /- \[Licenciatura en Administración\]/);
  assert.doesNotMatch(textoInicio, /Diplomatura en Oratoria/);

  // El listado de novedades: la destacada y los artículos de la página.
  const listado = await astro.fetch('/novedades/1.md');
  assert.equal(listado.status, 200);
  const textoListado = await listado.text();
  assert.match(textoListado, /## Destacada/);
  assert.match(textoListado, /\/novedades\/articulo\/novedad-sintetica-1/);
  assert.equal((await astro.fetch('/novedades/99.md')).status, 404);

  // Cada una se declara con su versión markdown.
  for (const [ruta, markdown] of [
    ['/', '/index.md'], ['/novedades/1', '/novedades/1.md'],
    ['/faq', '/faq.md'], ['/contacto', '/contacto.md'],
    ['/calendario-academico', '/calendario-academico.md'],
    ['/sobre-nosotros', '/sobre-nosotros.md'], ['/teclab', '/teclab.md'],
    ['/clases-apoyo', '/clases-apoyo.md'], ['/test-vocacional', '/test-vocacional.md'],
  ]) {
    const pagina = await astro.fetch(ruta);
    assert.equal(pagina.headers.get('link'),
      `<${markdown}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`, ruta);
  }
});
