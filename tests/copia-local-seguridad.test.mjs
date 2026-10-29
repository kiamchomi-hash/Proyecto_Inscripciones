import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('la copia falla antes de sobrescribir el destino o iniciar servidores', () => {
  const temporal = mkdtempSync(join(tmpdir(), 'cau-copia-seguridad-'));
  try {
    const destino = join(temporal, 'copia');
    mkdirSync(destino);
    const testigo = join(destino, 'existente.txt');
    writeFileSync(testigo, 'no borrar');
    const resultado = spawnSync(process.execPath, ['herramientas/copia-local.mjs', `--salida=${destino}`], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 10000,
    });
    assert.notEqual(resultado.status, 0);
    assert.match(resultado.stderr, /no sobrescribe el destino existente/i);
    assert.equal(readFileSync(testigo, 'utf8'), 'no borrar');
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
});
