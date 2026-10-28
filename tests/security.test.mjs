import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
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

async function fileExists(relative) {
  try {
    await access(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
}

test('los formularios públicos no escriben directo en Supabase', async () => {
  const files = await sourceFiles('components');
  const publicWrites = [];
  for (const file of files) {
    const source = await readFile(path.join(root, file), 'utf8');
    if (/\.from\(['"](?:consultas|faq_preguntas|solicitudes_clase)['"]\)\.insert/.test(source)) {
      publicWrites.push(file);
    }
  }
  assert.deepEqual(publicWrites, []);
});

test('el módulo de alumnos no sigue expuesto por rutas, scripts o navegación', async () => {
  const checked = ['package.json'];
  for (const file of checked) {
    const source = await readFile(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /admin\/alumnos|sync-alumnos|alumnos_cau/);
  }
});

test('no quedan rutas ni helpers del panel de administración', async () => {
  assert.equal(await fileExists('app/admin'), false, 'app/admin debería haberse eliminado');
  assert.equal(await fileExists('app/api/admin'), false, 'app/api/admin debería haberse eliminado');
  assert.equal(await fileExists('proxy.ts'), false, 'proxy.ts debería haberse eliminado');
  assert.equal(await fileExists('lib/supabase-auth.ts'), false, 'lib/supabase-auth.ts debería haberse eliminado');
  assert.equal(await fileExists('lib/supabase-server.ts'), false, 'lib/supabase-server.ts debería haberse eliminado');
  assert.equal(await fileExists('lib/auth/exigir-admin.ts'), false, 'lib/auth/exigir-admin.ts debería haberse eliminado');

  const forbiddenImports = [
    '@/lib/supabase-auth',
    '@/lib/supabase-server',
    '@/lib/auth/exigir-admin',
  ];
  for (const directory of ['components', 'lib', 'cloudflare/src']) {
    const files = await sourceFiles(directory).catch(() => []);
    for (const file of files) {
      const source = await readFile(path.join(root, file), 'utf8');
      for (const imp of forbiddenImports) {
        assert.doesNotMatch(
          source,
          new RegExp(`from ['"]${imp.replace(/\//g, '\\/')}['"]`),
          `${file} importa ${imp}`,
        );
      }
    }
  }
});

test('el JSON-LD escapa el contenido que viene de la base', async () => {
  const { jsonLdScript } = await import('../lib/json-ld.ts');

  const veneno = { name: `</script><script>alert(1)</script>` };
  const salida = jsonLdScript(veneno);

  assert.doesNotMatch(salida, /<\/?script/i);
  assert.deepEqual(JSON.parse(salida), veneno);
});

test('ningún bloque de datos estructurados se serializa sin escapar', async () => {
  const files = (await sourceFiles('components')).concat(await sourceFiles('paginas'));
  const crudos = [];
  for (const file of files) {
    const source = await readFile(path.join(root, file), 'utf8');
    if (!source.includes('ld+json')) continue;
    if (/__html: JSON\.stringify/.test(source)) crudos.push(file);
  }
  assert.deepEqual(crudos, []);
});

test('el endpoint no escribe nombres de columna a mano', async () => {
  const source = await readFile(path.join(root, 'cloudflare/src/api/filas.ts'), 'utf8');
  const insert = source.slice(source.indexOf('function asignarCampo'), source.indexOf('/** La pregunta validada'));

  assert.doesNotMatch(
    insert,
    /\b(localidad_nacimiento|direccion|direccion_numero|nivel_estudios|colegio_localidad|medio_pago|tipo_documento|pais_residencia)\s*:/,
  );
  assert.match(insert, /columnaDe/);
});

test('la consulta guarda de que casa y de que formulario vino', async () => {
  const { filaConsulta } = await import('../cloudflare/src/api/filas.ts');
  const fila = filaConsulta({ casa: 'siglo21', tipoFormulario: 'contacto', email: 'prueba@example.com' });
  assert.equal(fila.casa, 'siglo21');
  assert.equal(fila.tipo_formulario, 'contacto');
});
