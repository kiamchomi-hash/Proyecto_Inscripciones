import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

async function sourceFiles(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(relative));
    else if (/\.(ts|tsx|mjs)$/.test(entry.name)) files.push(relative);
  }
  return files;
}

test('los formularios públicos no escriben directo en Supabase', async () => {
  const files = await sourceFiles('components');
  const publicWrites = [];
  for (const file of files) {
    if (file.includes(`${path.sep}admin${path.sep}`)) continue;
    const source = await readFile(path.join(root, file), 'utf8');
    if (/\.from\(['"](?:consultas|faq_preguntas|solicitudes_clase)['"]\)\.insert/.test(source)) {
      publicWrites.push(file);
    }
  }
  assert.deepEqual(publicWrites, []);
});

test('el módulo de alumnos no sigue expuesto por rutas, scripts o navegación', async () => {
  const checked = [
    'app/admin/page.tsx',
    'components/admin/sidebar.tsx',
    'proxy.ts',
    'package.json',
  ];
  for (const file of checked) {
    const source = await readFile(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /admin\/alumnos|sync-alumnos|alumnos_cau/);
  }
});

test('las APIs administrativas exigen rol admin en el proxy', async () => {
  const source = await readFile(path.join(root, 'proxy.ts'), 'utf8');
  assert.match(source, /pathname\.startsWith\('\/api\/admin'\)/);
  assert.match(source, /profile\.rol !== 'admin'/);
  assert.match(source, /profile\.estado !== 'aprobado'/);
});

test('el JSON-LD escapa el contenido que viene de la base', async () => {
  const { jsonLdScript } = await import('../lib/json-ld.ts');

  // El titulo de una FAQ nace en el formulario publico: si se publica con un
  // cierre de script adentro, JSON.stringify a secas lo deja pasar tal cual y
  // corta el <script> del schema antes de tiempo.
  const veneno = { name: `</script><script>alert(1)</script>` };
  const salida = jsonLdScript(veneno);

  assert.doesNotMatch(salida, /<\/?script/i);
  assert.deepEqual(JSON.parse(salida), veneno);
});

test('ningún bloque de datos estructurados se serializa sin escapar', async () => {
  const files = (await sourceFiles('app')).concat(await sourceFiles('components'));
  const crudos = [];
  for (const file of files) {
    const source = await readFile(path.join(root, file), 'utf8');
    if (!source.includes('ld+json')) continue;
    if (/__html: JSON.stringify/.test(source)) crudos.push(file);
  }
  assert.deepEqual(crudos, []);
});
