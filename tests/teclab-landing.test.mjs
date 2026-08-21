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
  assert.match(page, /<EnrollmentForm carreras=\{carreras\} origen="teclab"/);
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
