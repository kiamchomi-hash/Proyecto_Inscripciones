import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// La CSP de las páginas no permite `<style>` ni `<script>` inline salvo por hash
// del build (cloudflare/astro.config.mjs). Un elemento creado en el navegador no
// tiene hash y queda bloqueado: el formulario de la ficha se quedó sin estilos así
// el 23/11/2026. Los estilos diferidos van como `<link rel="stylesheet">`.
function archivos(dir) {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : /\.(tsx?|astro)$/.test(n) ? [p] : [];
  });
}

test('ningún componente crea <style> o <script> inline en el navegador', () => {
  const malos = [...archivos('components'), ...archivos('lib'), ...archivos('cloudflare/src')]
    .filter(f => /createElement\(\s*['"`](style|script)['"`]\s*\)/.test(readFileSync(f, 'utf8'))
      && !/createElement\(\s*['"`]script['"`]\s*\)[\s\S]{0,200}\.src\s*=/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(malos, []);
});
