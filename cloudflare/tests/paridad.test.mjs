import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';
import {
  arrancarNext, esperarHttp, nextEnEjecucion, NEXT, puertoLibre, stubSupabase,
} from './helpers/servidores.mjs';
import {
  canonical, decodificar, diferencias, enlacesDe, idioma, jsonLd, metas, textoPrincipal, titulo,
} from './helpers/html.mjs';
import { RUTAS_REFERENCIA } from './helpers/referencias-rutas.mjs';

// Paridad de la home: el HTML del build Astro (workerd local) contra el del
// Next vigente (dev en loopback). La red externa no se usa: el Next apunta a un
// stub local que responde como PostgREST y el Astro lee de D1 con el mismo
// fixture. Nada sale de 127.0.0.1.
//
// Requiere un build previo (`npm run build`): la prueba de runtime ya tiene la
// misma dependencia. No corre en paralelo con un `next dev` del sitio porque
// Next toma un lock en `.next/lock`; en ese caso falla con un mensaje explícito
// en vez de saltearse.

const CONFIG = './dist/server/wrangler.json';

const METAS_COMPARADAS = [
  'description', 'author', 'creator',
  'og:type', 'og:locale', 'og:url', 'og:site_name', 'og:title', 'og:description',
  'og:image', 'og:image:width', 'og:image:height', 'og:image:alt',
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
  'google-site-verification',
];

test('la home de Astro y la de Next coinciden en encabezado, texto y enlaces', async t => {
  assert.ok(existsSync(CONFIG),
    'Falta el build de Astro: correr `npm --prefix cloudflare run build` antes de test:paridad.');
  assert.ok(existsSync(NEXT),
    'Falta Next en la raíz: la paridad necesita el sitio vigente instalado.');
  assert.ok(!nextEnEjecucion(),
    `Hay un \`next dev\` del sitio corriendo (PID ${nextEnEjecucion()}). Cerrarlo antes de test:paridad:`
    + ' dos procesos no pueden compartir el directorio .next.');

  const supabase = await stubSupabase();
  const puerto = await puertoLibre();
  const next = arrancarNext({ puerto, supabase });

  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(async () => {
    next.detener();
    await astro.close();
    await supabase.cerrar();
  });

  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB } = await worker.getEnv();
  await insertarCatalogo(DB);

  let respuestaNext;
  try {
    respuestaNext = await esperarHttp(`http://127.0.0.1:${puerto}/`, 240_000);
  } catch (error) {
    throw new Error(`${error.message}\n--- next dev ---\n${next.registro().slice(-4000)}`);
  }
  const respuestaAstro = await astro.fetch('/');
  assert.equal(respuestaNext.status, 200);
  assert.equal(respuestaAstro.status, 200);

  const htmlNext = await respuestaNext.text();
  const htmlAstro = await respuestaAstro.text();

  assert.equal(idioma(htmlAstro), idioma(htmlNext), 'lang');
  assert.equal(titulo(htmlAstro), titulo(htmlNext), 'title');
  assert.equal(canonical(htmlAstro), canonical(htmlNext), 'canonical');

  const metasAstro = metas(htmlAstro);
  const metasNext = metas(htmlNext);
  for (const clave of METAS_COMPARADAS) {
    assert.equal(metasAstro[clave], metasNext[clave], `meta ${clave}`);
  }

  const ldAstro = jsonLd(htmlAstro);
  const ldNext = jsonLd(htmlNext);
  assert.equal(ldAstro.length, ldNext.length, 'cantidad de bloques JSON-LD');
  for (let i = 0; i < ldAstro.length; i++) {
    assert.deepEqual(JSON.parse(ldAstro[i]), JSON.parse(ldNext[i]), `JSON-LD ${i}`);
    assert.equal(ldAstro[i], ldNext[i], `JSON-LD ${i} escapado igual`);
  }

  const textoAstro = textoPrincipal(htmlAstro);
  const textoNext = textoPrincipal(htmlNext);
  assert.deepEqual(diferencias(textoAstro, textoNext), [], 'texto principal');
  assert.equal(textoAstro, textoNext);

  // Guarda contra un falso positivo: dos páginas vacías también serían iguales.
  assert.ok(textoAstro.length > 1200, `el texto principal quedó demasiado corto (${textoAstro.length})`);
  for (const esperado of ['Inscripciones 2027', 'Licenciatura', 'Administración', 'Contador Público',
    'FORMULARIO DE CONTACTO', 'FORMULARIO DE PREINSCRIPCIÓN', 'Estudiantes este año']) {
    assert.ok(textoAstro.includes(esperado), `falta «${esperado}» en el texto de la home`);
  }
  // Las filas que la home no publica tampoco pueden aparecer por otro camino.
  for (const excluido of ['Oratoria', 'Gestión Educativa']) {
    assert.ok(!textoAstro.includes(excluido), `«${excluido}» no debería estar en la home`);
  }
  assert.ok(enlacesDe(htmlAstro, { apertura: /<main\b/, cierre: '</main>' }).length > 8,
    'la home debe traer los enlaces del catálogo y el pie');
  // SSR + hidratación: el contenido ya viaja en el HTML y las islas quedan
  // marcadas para que React tome el control en el navegador.
  assert.match(htmlAstro, /<astro-island\b[^>]*client="load"/);
  assert.match(htmlAstro, /<astro-island\b[^>]*component-export="default"/);
  assert.match(htmlAstro, /component-url="\/_astro\//);
  assert.doesNotMatch(htmlAstro, /turnstile-site-key/, 'sin variable de runtime no hay site key en el HTML');

  for (const [nombre, region] of [
    ['main', { apertura: /<main\b/, cierre: '</main>' }],
    ['navbar', { apertura: /<nav\b[^>]*class="main-navbar"/, cierre: '</nav>' }],
    ['footer', { apertura: /<footer\b/, cierre: '</footer>' }],
  ]) {
    assert.deepEqual(
      enlacesDe(htmlAstro, region).sort(),
      enlacesDe(htmlNext, region).sort(),
      `enlaces de ${nombre}`,
    );
  }

  // El stub recibió exactamente la lectura del catálogo de la home: si Next
  // consultara otra tabla, el pedido quedaría 404 y el texto no coincidiría.
  assert.ok(supabase.pedidos.length >= 1, 'el stub debe haber recibido la consulta del catálogo');
  assert.ok(supabase.pedidos.every(pedido => pedido.includes('/rest/v1/carreras')),
    `consulta inesperada: ${supabase.pedidos.join(', ')}`);

  // Mismo código para una ruta inexistente. El cuerpo del 404 no se compara:
  // esta rebanada no migra esa página (ver LEER.md).
  const noExisteAstro = await astro.fetch('/no-existe');
  const noExisteNext = await fetch(`http://127.0.0.1:${puerto}/no-existe`);
  assert.equal(noExisteAstro.status, 404);
  assert.equal(noExisteNext.status, 404);
});

// Las tres páginas de esta rebanada. Se comparan contra el Next vigente con el
// mismo fixture sembrado en D1 y en el stub de PostgREST; el texto de `<main>`
// tiene que ser idéntico, no «parecido».
const RUTAS_NUEVAS = [
  {
    ruta: '/teclab',
    textos: ['Tecnicaturas', 'Carreras cocreadas con', '¿Qué carrera elegir?',
      'Tecnicaturas activas', 'Consultar por'],
    excluidos: ['Diplomatura en Oratoria', 'Maestría en Gestión Educativa'],
  },
  {
    ruta: '/teclab/inscripcion',
    textos: ['Próximos pasos', 'Completar este formulario no realiza ningún pago'],
    // En Next esta página no renderiza el pie ni el navbar: `esRutaPreinscripcion`
    // los oculta en las páginas dedicadas de inscripción.
    sinPie: true,
    sinNavbar: true,
  },
  {
    ruta: '/contacto',
    textos: ['WhatsApp', 'Guaminí 4876', 'Formulario de contacto', 'Visitanos presencialmente'],
  },
  { ruta: '/sobre-nosotros', textos: ['Guaminí 4876', 'Formación universitaria'] },
  { ruta: '/calendario-academico', textos: ['Calendario Académico', '2026', 'Fechas de cursada'] },
  { ruta: '/imagenes', textos: ['imágenes'], sinPie: true },
  { ruta: '/test-vocacional', textos: ['Empezar el test', 'Sin registrarte'], sinPie: true, minimo: 150 },
  { ruta: '/teclab/test-vocacional', textos: ['Pregunta 1 de 7'], sinPie: true },
  { ruta: '/faq', textos: ['Pregunta sintética 2'], sinMain: true },
  { ruta: '/clases-apoyo', textos: ['Matemática', 'Computación', 'Arte'] },
  { ruta: '/clases-apoyo/matematica', textos: ['Matemática'], sinMain: true },
  { ruta: '/clases-apoyo/computacion', textos: ['Elegí el día'], sinMain: true },
  { ruta: '/clases-apoyo/arte', textos: ['Arte'], sinMain: true },
  { ruta: '/newsletter/baja', textos: ['El enlace no es válido'], sinPie: true, minimo: 50 },
  { ruta: '/newsletter/baja?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', textos: ['Anular suscripción'], sinPie: true, minimo: 50 },
  { ruta: '/newsletter/baja?listo=1', textos: ['Listo, no vas a recibir más novedades.'], sinPie: true, minimo: 50 },
  { ruta: '/newsletter/baja?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&id=otro', textos: ['El enlace no es válido'], sinPie: true, minimo: 50 },
  { ruta: '/carreras/licenciatura-en-administracion', textos: ['Administración'] },
  { ruta: '/carreras/contador-publico', textos: ['Contador'] },
  { ruta: '/carreras/tecnicatura-en-programacion', textos: ['Programación'] },
  { ruta: '/carreras/tecnicatura-en-desarrollo-de-software', textos: ['Desarrollo de Software'] },
  { ruta: '/carreras/diplomatura-en-oratoria', textos: ['Oratoria'] },
  { ruta: '/carreras/licenciatura-en-administracion/inscripcion', textos: ['Próximos pasos'], sinPie: true, sinNavbar: true },
  { ruta: '/carreras/tecnicatura-en-programacion/inscripcion', textos: ['Próximos pasos'], sinPie: true, sinNavbar: true },
  { ruta: '/novedades/1', textos: ['Destacado', 'Novedad destacada sintética'], minimo: 50 },
  { ruta: '/novedades/2', textos: ['Novedad sintética 6'], minimo: 50 },
  { ruta: '/novedades/3', textos: ['Novedad sintética 12'], minimo: 50 },
  ...[1, 14, 15, 16, 17].map(id => ({ ruta: `/novedades/articulo/novedad-sintetica-${id}`, textos: ['Volver a novedades', 'Compartir'], minimo: 50 })),
];

test('las páginas migradas coinciden con Next en encabezado, texto y enlaces', async t => {
  assert.deepEqual(
    RUTAS_REFERENCIA.map(({ ruta, sinMain = false, sinNavbar = false, sinPie = false }) => ({ ruta, sinMain, sinNavbar, sinPie })),
    RUTAS_NUEVAS.map(({ ruta, sinMain = false, sinNavbar = false, sinPie = false }) => ({ ruta, sinMain, sinNavbar, sinPie })),
    'las referencias deben cubrir las mismas rutas y regiones que la paridad viva',
  );
  assert.ok(existsSync(CONFIG),
    'Falta el build de Astro: correr `npm --prefix cloudflare run build` antes de test:paridad.');
  assert.ok(existsSync(NEXT),
    'Falta Next en la raíz: la paridad necesita el sitio vigente instalado.');
  assert.ok(!nextEnEjecucion(),
    `Hay un \`next dev\` del sitio corriendo (PID ${nextEnEjecucion()}). Cerrarlo antes de test:paridad.`);

  const supabase = await stubSupabase();
  const puerto = await puertoLibre();
  const next = arrancarNext({ puerto, supabase });

  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(async () => {
    next.detener();
    await astro.close();
    await supabase.cerrar();
  });

  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);

  try {
    await esperarHttp(`http://127.0.0.1:${puerto}/`, 240_000);
  } catch (error) {
    throw new Error(`${error.message}\n--- next dev ---\n${next.registro().slice(-4000)}`);
  }

  for (const { ruta, textos, excluidos = [], sinPie = false, sinNavbar = false, minimo = 250, sinMain = false } of RUTAS_NUEVAS) {
    const respuestaNext = await fetch(`http://127.0.0.1:${puerto}${ruta}`);
    const respuestaAstro = await astro.fetch(ruta);
    assert.equal(respuestaNext.status, 200, `${ruta} en Next`);
    assert.equal(respuestaAstro.status, 200, `${ruta} en Astro, que no puede quedar en 404`);

    const htmlNext = await respuestaNext.text();
    const htmlAstro = await respuestaAstro.text();

    assert.equal(idioma(htmlAstro), idioma(htmlNext), `${ruta}: lang`);
    assert.equal(titulo(htmlAstro), titulo(htmlNext), `${ruta}: title`);
    assert.equal(canonical(htmlAstro), canonical(htmlNext), `${ruta}: canonical`);

    const metasAstro = metas(htmlAstro);
    const metasNext = metas(htmlNext);
    for (const clave of METAS_COMPARADAS) {
      if (metasAstro[clave] !== metasNext[clave]) {
        const inicio = htmlAstro.indexOf(`property="${clave}"`);
        t.diagnostic(`${ruta} ${clave}: ${htmlAstro.slice(Math.max(0,inicio-6),inicio+240)}`);
      }
      assert.equal(metasAstro[clave], metasNext[clave], `${ruta}: meta ${clave}`);
    }
    assert.equal(metasAstro.keywords, metasNext.keywords, `${ruta}: keywords`);
    assert.equal(metasAstro.robots, metasNext.robots, `${ruta}: robots de página`);
    // El mapa plano sólo retiene la última imagen: verificar también la lista
    // completa y ordenada (OG compuesta primero, foto limpia después).
    const imagenesOg = html => [...html.matchAll(/<meta\b[^>]*property="og:image"[^>]*>/g)]
      .map(([tag]) => decodificar(/content="([^"]*)"/.exec(tag)[1]));
    assert.deepEqual(imagenesOg(htmlAstro), imagenesOg(htmlNext), `${ruta}: todas las imágenes OG`);

    const ldAstro = jsonLd(htmlAstro);
    const ldNext = jsonLd(htmlNext);
    assert.equal(ldAstro.length, ldNext.length, `${ruta}: cantidad de bloques JSON-LD`);
    for (let i = 0; i < ldAstro.length; i++) {
      assert.deepEqual(JSON.parse(ldAstro[i]), JSON.parse(ldNext[i]), `${ruta}: JSON-LD ${i}`);
      assert.equal(ldAstro[i], ldNext[i], `${ruta}: JSON-LD ${i} escapado igual`);
    }

    const textoAstro = sinMain ? textoMateria(htmlAstro) : textoPrincipal(htmlAstro);
    const textoNext = sinMain ? textoMateria(htmlNext) : textoPrincipal(htmlNext);
    assert.deepEqual(diferencias(textoAstro, textoNext), [], `${ruta}: texto principal`);
    assert.equal(textoAstro, textoNext, `${ruta}: texto principal`);
    // Guarda contra un falso positivo: dos páginas vacías también serían iguales.
    assert.ok(textoAstro.length > minimo, `${ruta}: el texto de <main> quedó demasiado corto (${textoAstro.length})`);
    for (const esperado of textos) {
      assert.ok(textoAstro.includes(esperado), `${ruta}: falta «${esperado}» en el texto`);
    }
    for (const excluido of excluidos) {
      assert.ok(!textoAstro.includes(excluido), `${ruta}: «${excluido}» no debería publicarse`);
    }

    const regiones = [
      ... (sinMain ? [] : [['main', { apertura: /<main\b/, cierre: '</main>' }]]),
      ...(sinNavbar ? [] : [['navbar', { apertura: /<nav\b[^>]*class="main-navbar"/, cierre: '</nav>' }]]),
      ...(sinPie ? [] : [['footer', { apertura: /<footer\b/, cierre: '</footer>' }]]),
    ];
    if (sinMain) assert.deepEqual(enlaces(regionMateria(htmlAstro)), enlaces(regionMateria(htmlNext)), `${ruta}: enlaces de materia`);
    for (const [nombre, region] of regiones) {
      assert.deepEqual(
        enlacesDe(htmlAstro, region).sort(),
        enlacesDe(htmlNext, region).sort(),
        `${ruta}: enlaces de ${nombre}`,
      );
    }

    // SSR + hidratación: el contenido viaja en el HTML y la isla queda marcada.
    assert.match(htmlAstro, /<astro-island\b[^>]*client="load"/, `${ruta}: isla`);
    assert.doesNotMatch(htmlAstro, /turnstile-site-key/, `${ruta}: sin site key no hay meta de Turnstile`);
  }

  for (const ruta of ['/novedades/0','/novedades/01','/novedades/1abc','/novedades/-1','/novedades/4',
    '/novedades/articulo/novedad-sintetica-13','/novedades/articulo/inexistente','/novedades/articulo/NOVEDAD-SINTETICA-1']) {
    assert.equal((await astro.fetch(ruta)).status,404,ruta);
    assert.equal((await fetch(`http://127.0.0.1:${puerto}${ruta}`)).status,404,`Next ${ruta}`);
  }
  for (const [slug,destino] of [['segundo-semestre-2026-inicio-3-de-agosto','/novedades/articulo/inicio-de-clases'],['teclab-tecnicaturas-online','/teclab']]) {
    const ruta = `/novedades/articulo/${slug}?origen=local`;
    for (const respuesta of [await astro.fetch(ruta,{redirect:'manual'}),await fetch(`http://127.0.0.1:${puerto}${ruta}`,{redirect:'manual'})]) {
      assert.equal(respuesta.status,301);
      assert.equal(new URL(respuesta.headers.get('location'),'http://local').pathname,destino);
      assert.equal(new URL(respuesta.headers.get('location'),'http://local').search,'?origen=local');
    }
  }
  const xss = await astro.fetch('/novedades/articulo/novedad-sintetica-16');
  assert.equal(xss.headers.get('cache-control'),'no-store');
  // Artículo público: Next no le pone X-Robots-Tag; el saneado es lo que
  // impide que el contenido inyectado se ejecute.
  assert.equal(xss.headers.get('x-robots-tag'), null);
  const seguro = await xss.text();
  const cuerpo = seguro.slice(seguro.indexOf('<div class="art"'),seguro.indexOf('<!--',seguro.indexOf('<div class="art"')) > 0 ? seguro.indexOf('<!--',seguro.indexOf('<div class="art"')) : seguro.indexOf('</main>'));
  assert.doesNotMatch(cuerpo, /<script|<iframe|<svg[^>]*onload|onerror|onclick|javascript:|data:image/i);
  assert.doesNotMatch(seguro,/XSS_NOVEDAD|BORRADOR_NO_PUBLICO/);

  // El detalle de carreras también es una ruta de esta rebanada: la sirve el
  // paquete, no Next (que lee Supabase), así que se comprueba su código y su
  // forma acá y el contrato completo en `carreras-detalle.test.mjs`.
  const detalle = await astro.fetch('/api/carreras-detalle');
  assert.equal(detalle.status, 200);
  const mapa = await detalle.json();
  assert.ok(mapa['11'] && mapa['12'], 'el detalle debe traer las carreras visibles del fixture');
  assert.equal(mapa['17'], undefined, 'el posgrado no se publica');
  assert.equal(mapa['18'], undefined, 'una carrera inactiva no se publica');
  assert.deepEqual(Object.keys(mapa['11']).sort(), ['descripcion', 'enfoque', 'plan_estudios',
    'seccion_duracion', 'seccion_modalidad', 'slides']);
  assert.equal((await astro.fetch('/api/carreras-detalle', { method: 'POST' })).status, 405);

  // Diferidas explícitas: no se confunden con páginas migradas ni se anuncia
  // éxito de una baja sin backend HTTP. Nunca se manda ese POST al Next real.
  for (const ruta of ['/carreras/fixture', '/clases-apoyo/oculta', '/clases-apoyo/inexistente']) {
    assert.equal((await astro.fetch(ruta)).status, 404, `${ruta}: todavía diferida`);
    if (ruta.startsWith('/clases-apoyo/')) {
      assert.equal((await fetch(`http://127.0.0.1:${puerto}${ruta}`)).status, 404, `${ruta}: mismo 404 en Next`);
    }
  }
  assert.equal((await astro.fetch('/api/newsletter/baja', {method:'POST', body:'id=fixture'})).status, 400);

  for (const [ruta, estado, destino] of [
    ['/carreras/LICENCIATURA_EN_ADMINISTRACION', 308, '/carreras/licenciatura-en-administracion'],
    ['/carreras/LICENCIATURA_EN_ADMINISTRACION/inscripcion', 308, '/carreras/licenciatura-en-administracion/inscripcion'],
    ['/carreras/maestria-en-gestion-educativa', 404],
    ['/carreras/licenciatura-en-agroinformatica', 301, '/'],
    ['/carreras/diplomatura-en-inteligencia-artificial', 302, '/'],
    ['/carreras/tecnicatura-superior-en-customer-experience', 301, '/carreras/tecnicatura-superior-en-experiencia-del-cliente'],
    ['/carreras/tecnicatura-superior-en-energias-renovables', 301, '/'],
    ['/carreras/tecnicatura-superior-en-gestion-de-energias-renovables', 301, '/'],
    ['/carreras/diplomatura-en-oratoria/inscripcion', 404],
    ['/carreras/tecnicatura-en-desarrollo-de-software/inscripcion', 404],
  ]) {
    for (const respuesta of [await astro.fetch(ruta, {redirect:'manual'}),
      await fetch(`http://127.0.0.1:${puerto}${ruta}`, {redirect:'manual'})]) {
      assert.equal(respuesta.status, estado, ruta);
      if (destino) assert.equal(new URL(respuesta.headers.get('location'), 'http://local').pathname, destino);
    }
  }

  // El stub recibió sólo lecturas de `carreras`: las tres páginas y el detalle
  // salen de D1, nunca de Supabase.
  assert.ok(supabase.pedidos.length >= 1, 'el stub debe haber recibido la consulta de Next');
  assert.ok(supabase.pedidos.every(pedido => /^(GET|HEAD) \/rest\/v1\/(carreras|materias|faq_preguntas|consultas|precios_privados|novedades)\?/.test(pedido)),
    `consulta inesperada: ${supabase.pedidos.join(', ')}`);
});

test('baja compilada: GET/HEAD no escriben, POST confirma D1, inválidos y fallos sin fuga', async t => {
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB } = await worker.getEnv();
  const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  await DB.prepare('INSERT INTO suscripciones_newsletter(id,email) VALUES (?,?)').bind(id, 'baja@example.invalid').run();
  assert.equal((await astro.fetch(`/newsletter/baja?id=${id}`)).status, 200);
  assert.equal((await astro.fetch('/newsletter/baja?listo=1')).status, 200);
  for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
    const r = await astro.fetch(`/api/newsletter/baja?id=${id}`, { method });
    assert.equal(r.status, 405);
    assert.equal(r.headers.get('allow'), 'POST');
  }
  assert.equal(await DB.prepare('SELECT activo FROM suscripciones_newsletter').first('activo'), 1);
  const invalido = await astro.fetch('/api/newsletter/baja?id=no-valido', { method: 'POST' });
  assert.equal(invalido.status, 400);
  const r = await astro.fetch(`/api/newsletter/baja?id=${id}`, { method: 'POST', body: 'List-Unsubscribe=One-Click' });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(await DB.prepare('SELECT activo FROM suscripciones_newsletter').first('activo'), 0);
  await DB.prepare('DROP TABLE suscripciones_newsletter').run();
  const fallo = await astro.fetch(`/api/newsletter/baja?id=${id}`, { method: 'POST' });
  assert.equal(fallo.status, 500);
  assert.equal(fallo.headers.get('location'), null);
  assert.deepEqual(await fallo.json(), { error: 'No se pudo procesar la baja' });
});

test('fichas compiladas: sin datos privados públicos, no-store y la ruta del enlace ya no existe', async t => {
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB } = await worker.getEnv();
  await insertarCatalogo(DB);
  for (const ruta of ['/carreras/tecnicatura-en-programacion', '/carreras/tecnicatura-en-programacion/inscripcion']) {
    const r = await astro.fetch(ruta);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    const html = await r.text();
    assert.doesNotMatch(html, /ana\.sintetica@example\.invalid|Dato sintético|1111111111/);
    assert.doesNotMatch(html, /123\.456|Precio sintético/);
  }
  // La autoinscripción se dio de baja el 27/10/2026: no queda página de enlace.
  assert.equal((await astro.fetch('/inscripcion/EnlaceSinteticoLocal1234567890ABCD')).status, 404);
  // Igual que en Next: sin datos de contacto no se escribe, y sin captcha no hay servicio.
  const antes = await DB.prepare('SELECT count(*) AS n FROM consultas').first('n');
  const contacto = { casa: 'teclab', tipoFormulario: 'contacto', email: 'lead@example.invalid', telefono: '1111111111' };
  for (const token of [null, 'invalido']) {
    const r = await astro.fetch('/api/formularios', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kind:'consulta', token, payload:contacto})});
    assert.equal(r.status, token ? 503 : 400, 'sin secreto/configuración no se registra la consulta');
  }
  assert.equal(await DB.prepare('SELECT count(*) AS n FROM consultas').first('n'), antes);
  await DB.prepare('UPDATE carreras SET descripcion=?1 WHERE id=11').bind('Texto </script><script>globalThis.noEjecutar=1</script>').run();
  const escapado = await (await astro.fetch('/carreras/licenciatura-en-administracion')).text();
  assert.ok(jsonLd(escapado).some(s => s.includes('\\u003c/script')));
  assert.doesNotMatch(escapado, /<script>globalThis\.noEjecutar/);
  for (const familia of ['silkscreen','dm-sans']) {
    const aviso = await astro.fetch(`/licencias/${familia}.txt`);
    assert.equal(aviso.status, 200);
    assert.match(await aviso.text(), /SIL OPEN FONT LICENSE Version 1\.1/);
  }
});

test('los assets versionados se sirven desde ../public sin copiarse al paquete', async t => {
  assert.ok(!existsSync(new URL('../public', import.meta.url)),
    'cloudflare/public no debe existir: los assets viven en la raíz.');
  assert.ok(existsSync(new URL('../../public/imagenes/og/default.jpg', import.meta.url)),
    'faltan los assets versionados de la raíz');

  const config = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(config, /publicDir:\s*publico/);
  assert.match(config, /new URL\('\.\.\/public', import\.meta\.url\)/);

  assert.ok(existsSync(new URL('../dist/client/favicon.ico', import.meta.url)));

  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();

  for (const [ruta, tipo] of [
    ['/favicon.ico', /^image\/(x-icon|vnd\.microsoft\.icon)$/],
    ['/icon.png', /^image\/png$/],
    ['/apple-touch-icon.png', /^image\/png$/],
    ['/imagenes/og/default.jpg', /^image\/jpeg$/],
    ['/imagenes/Modales/Licenciatura en Higiene, Seguridad y Medio ambiente del Trabajo/LIC. EN HIGIENE Y SEGURIDAD LANDING_HERO WEB.webp', /^image\/webp$/],
    ['/imagenes/teclab/logo-teclab.webp', /^image\/webp$/],
    ['/imagenes/imagenes_cau/siglo21-marca.svg', /^image\/svg\+xml$/],
    ['/fuentes/inter-latin.woff2', /^font\/woff2$/],
    ['/fuentes/unbounded-latin.woff2', /^font\/woff2$/],
  ]) {
    const respuesta = await astro.fetch(ruta);
    assert.equal(respuesta.status, 200, ruta);
    assert.match(respuesta.headers.get('content-type') ?? '', tipo, ruta);
  }
});

test('las fuentes de marca se sirven autoalojadas, sin pedir nada a Google', async t => {
  // Los dos archivos son los del subconjunto `latin` que descarga next/font en
  // el sitio vigente; la firma `wOF2` confirma que el binario no se corrompió.
  for (const archivo of ['inter-latin.woff2', 'unbounded-latin.woff2']) {
    const ruta = new URL(`../../public/fuentes/${archivo}`, import.meta.url);
    assert.ok(existsSync(ruta), `falta public/fuentes/${archivo}`);
    const bytes = readFileSync(ruta);
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'wOF2', archivo);
    assert.ok(bytes.length > 30_000, `${archivo} quedó truncado (${bytes.length} bytes)`);
  }
  for (const licencia of ['OFL-Inter.txt', 'OFL-Unbounded.txt']) {
    const texto = readFileSync(new URL(`../../public/fuentes/${licencia}`, import.meta.url), 'utf8');
    assert.match(texto, /SIL OPEN FONT LICENSE Version 1\.1/i, licencia);
  }

  const css = readFileSync(new URL('../../estilos/fuentes.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /fonts\.(googleapis|gstatic)\.com/, 'ningún origen externo de fuentes');
  // Las dos familias se llaman como en Next: el CSS compartido las pide por
  // nombre literal (`body { font-family: 'Inter' }`, navbar `'Unbounded'`).
  assert.match(css, /@font-face\s*{[^}]*font-family:\s*'Inter';[^}]*font-weight:\s*100 900/);
  assert.match(css, /@font-face\s*{[^}]*font-family:\s*'Inter';[^}]*font-display:\s*swap/);
  for (const peso of ['400', '600', '700', '800', '900']) {
    assert.match(css, new RegExp(`@font-face\\s*{[^}]*font-family:\\s*'Unbounded';[^}]*font-weight:\\s*${peso}`),
      `falta el peso ${peso} de Unbounded`);
  }
  assert.match(css, /--font-inter:\s*'Inter'/);
  assert.match(css, /--font-unbounded:\s*'Unbounded'/);
  // El subconjunto latin llega hasta U+00FF: acentos y ñ de la home incluidos.
  assert.match(css, /unicode-range:\s*U\+\?\?/);

  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);

  const home = await astro.fetch('/');
  const html = await home.text();
  assert.equal(home.status, 200);
  // Precarga de las dos familias, del mismo origen y con CORS de fuente.
  for (const familia of ['inter-latin', 'unbounded-latin']) {
    assert.match(html, new RegExp(
      `<link rel="preload" href="/fuentes/${familia}\\.woff2" as="font" type="font/woff2" crossorigin`,
    ), `falta la precarga de ${familia}`);
  }
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/, 'la home no debe pedir fuentes externas');
  // La hoja compilada usa las URLs locales, no las de next/font.
  const hojas = readdirSync(new URL('../dist/client/_astro/', import.meta.url))
    .filter(nombre => nombre.endsWith('.css'));
  const compilado = hojas.map(nombre => readFileSync(
    new URL(`../dist/client/_astro/${nombre}`, import.meta.url), 'utf8',
  )).join('\n');
  assert.match(compilado, /url\(\/fuentes\/inter-latin\.woff2\)/);
  assert.match(compilado, /url\(\/fuentes\/unbounded-latin\.woff2\)/);
  assert.doesNotMatch(compilado, /_next\/static\/media/);
});
import { normalizarTexto, enlaces } from './helpers/html.mjs';

// Sitemap y robots: no alcanza con que tengan las mismas URLs; el XML y el
// texto se comparan byte a byte contra el Next vigente con el mismo fixture.
test('sitemap.xml y robots.txt coinciden byte a byte con Next', async t => {
  assert.ok(existsSync(CONFIG),
    'Falta el build de Astro: correr `npm --prefix cloudflare run build` antes de test:paridad.');
  assert.ok(existsSync(NEXT), 'Falta Next en la raíz: la paridad necesita el sitio vigente instalado.');
  assert.ok(!nextEnEjecucion(),
    `Hay un \`next dev\` del sitio corriendo (PID ${nextEnEjecucion()}). Cerrarlo antes de test:paridad.`);

  const supabase = await stubSupabase();
  const puerto = await puertoLibre();
  const next = arrancarNext({ puerto, supabase });
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(async () => {
    next.detener();
    await astro.close();
    await supabase.cerrar();
  });

  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);
  try {
    await esperarHttp(`http://127.0.0.1:${puerto}/`, 240_000);
  } catch (error) {
    throw new Error(`${error.message}\n--- next dev ---\n${next.registro().slice(-4000)}`);
  }

  for (const ruta of ['/sitemap.xml', '/robots.txt']) {
    const respuestaNext = await fetch(`http://127.0.0.1:${puerto}${ruta}`);
    const respuestaAstro = await astro.fetch(ruta);
    assert.equal(respuestaNext.status, 200, `Next ${ruta}`);
    assert.equal(respuestaAstro.status, 200, `Astro ${ruta}`);
    assert.equal(respuestaAstro.headers.get('content-type'), respuestaNext.headers.get('content-type'), ruta);
    assert.equal(await respuestaAstro.text(), await respuestaNext.text(), `${ruta}: cuerpo byte a byte`);
  }
  // Un sitemap con noindex no sirve para lo que existe: no se copia la guarda
  // local de las páginas.
  assert.equal((await astro.fetch('/sitemap.xml')).headers.get('x-robots-tag'), null);
  assert.equal((await astro.fetch('/robots.txt')).headers.get('x-robots-tag'), null);
});
function regionMateria(html) {
  const inicio = html.search(/<(?:div class="ca-materia-pagina"|section class="faq-section)/);
  const fin = html.indexOf('<footer', inicio);
  assert.ok(inicio >= 0 && fin > inicio, 'falta el cuerpo de materia o su pie');
  return html.slice(inicio, fin);
}
const textoMateria = html => normalizarTexto(regionMateria(html));
