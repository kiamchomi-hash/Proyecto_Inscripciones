import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const leer = archivo => readFile(path.join(root, archivo), 'utf8');

test('la landing Teclab tiene canonical, contenido indexable y oferta acotada', async () => {
  const page = await leer('app/teclab/page.tsx');

  assert.match(page, /canonical: URL/);
  assert.match(page, /'CollectionPage'/);
  assert.match(page, /Teclab - Tecnología/);
  assert.match(page, /Teclab - Gestión/);
  assert.match(page, /Teclab - Curso/);
  assert.match(page, /<CareersCatalog carreras=\{carreras\}/);
  assert.match(page, /Tecnicaturas Teclab Online \| Carreras de 2 años/);
  assert.doesNotMatch(page, /Villa Lugano|CABA/);
  // Los dos formularios de la landing van con la casa fija: toda su oferta es
  // de Teclab, asi que no hay nada que deducir de la carrera elegida.
  assert.match(page, /<FormularioLead carreras=\{carreras\} modo="contacto" casa="teclab" origen="teclab"/);
  assert.match(page, /<FormularioLead carreras=\{carreras\} modo="preinscripcion" casa="teclab" origen="teclab"/);
});

test('la home enlaza sus encabezados Teclab y el sitemap publica la landing', async () => {
  const [home, catalogo, sitemap] = await Promise.all([
    leer('app/page.tsx'),
    leer('components/index/careers-catalog.tsx'),
    leer('app/sitemap.ts'),
  ]);

  assert.match(home, /teclabLandingHref="\/teclab"/);
  assert.match(catalogo, /className="teclab-section-title-link"/);
  assert.match(sitemap, /url: `\$\{baseUrl\}\/teclab`/);
});

test('el catálogo restaura la ruta de origen al cerrar una ficha', async () => {
  const catalogo = await leer('components/index/careers-catalog.tsx');

  assert.match(catalogo, /document\.title = defaultTitle\.current/);
  assert.match(catalogo, /window\.history\.replaceState\(null, '', defaultPath\.current\)/);
  assert.doesNotMatch(catalogo, /window\.history\.replaceState\(null, '', '\/'\)/);
});

test('los cambios de carreras revalidan también la landing Teclab', async () => {
  const route = await leer('app/api/revalidar/route.ts');
  assert.match(route, /\['\/teclab', 'page'\]/);
});

test('el test sigue al catálogo y la articulación queda después de los formularios', async () => {
  const page = await leer('app/teclab/page.tsx');
  const catalogo = page.indexOf('<section id="oferta-teclab"');
  const contacto = page.indexOf('modo="contacto"');
  const preinscripcion = page.indexOf('modo="preinscripcion"');
  const testVocacional = page.indexOf('<section className="teclab-test"');
  const articulacion = page.indexOf('<section className="teclab-continuity"');

  assert.ok(contacto >= 0 && contacto < preinscripcion);
  assert.ok(catalogo >= 0 && catalogo < testVocacional);
  assert.ok(testVocacional < contacto);
  assert.ok(preinscripcion < articulacion);
});

test('el llamado al test usa lenguaje profesional y una separación breve del catálogo', async () => {
  const [page, css] = await Promise.all([leer('app/teclab/page.tsx'), leer('app/teclab/teclab.css')]);
  assert.match(page, /¿Qué carrera elegir\?/);
  assert.match(page, /Respondé siete preguntas y conocé las carreras más afines a tus intereses\./);
  assert.doesNotMatch(page, /de un toque|más van con vos/);
  const separacion = css.match(/\.teclab-page \[data-testid="careers-catalog"\] \{([^}]+)\}/)?.[1];
  assert.match(separacion, /padding-bottom: clamp\(1\.5rem, 3vw, 2\.5rem\)/);
});
