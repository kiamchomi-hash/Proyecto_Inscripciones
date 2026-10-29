import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tomarBloqueo } from './helpers/bloqueo.mjs';

test('el bloqueo impide dos ejecuciones de navegador y se libera al terminar', t => {
  const carpeta = mkdtempSync(join(tmpdir(), 'cau-bloqueo-'));
  t.after(() => rmSync(carpeta, { recursive: true, force: true }));
  const ruta = join(carpeta, 'e2e-en-curso');

  const liberar = tomarBloqueo(ruta);
  assert.equal(readFileSync(ruta, 'utf8'), String(process.pid));
  assert.throws(() => tomarBloqueo(ruta), /Otra ejecución/);
  liberar();
  assert.equal(existsSync(ruta), false);

  writeFileSync(ruta, '999999999');
  const otra = tomarBloqueo(ruta);
  assert.equal(readFileSync(ruta, 'utf8'), String(process.pid));
  otra();
});
