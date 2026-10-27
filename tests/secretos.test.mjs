import test from 'node:test';
import assert from 'node:assert/strict';
import { esRutaPrivada } from '../herramientas/secretos.mjs';
test('rutas comerciales y credenciales se bloquean sin bloquear código público', () => {
  for (const p of ['carreras/precio.md', 'ventas/corpus.json', 'herramientas/ventas/rutas.mjs', 'notas-locales/a.md', '.env.local', 'folder/.env.production', 'credenciales.json', 'x-service_account.json', 'secrets/key.pem']) assert.equal(esRutaPrivada(p), true, p);
  for (const p of ['app/carreras/page.tsx', 'components/carreras/ficha.tsx', '.env.example', 'docs/variables-de-entorno.md']) assert.equal(esRutaPrivada(p), false, p);
});

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { revisarSecretos, verificarBinario } from '../herramientas/secretos.mjs';
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'secretos-fixture-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-b', 'main');
  git(cwd, 'config', 'user.name', 'Prueba');
  git(cwd, 'config', 'user.email', 'prueba@example.invalid');
  git(cwd, 'config', 'core.autocrlf', 'false');
  writeFileSync(join(cwd, 'publico.txt'), 'sin credenciales\n');
  git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: base');
  git(cwd, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  return cwd;
}
const tokenFalso = () => ['ghp', randomBytes(18).toString('hex')].join('_');
test('scanner real acepta selección inocua y no lee archivos ignorados', t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, '.gitignore'), '.env.local\n'); git(cwd, 'add', '.gitignore');
  writeFileSync(join(cwd, '.env.local'), `TOKEN=${tokenFalso()}\n`);
  assert.doesNotThrow(() => revisarSecretos({ cwd }));
});
test('scanner real inspecciona index y no la copia inocua del working tree; no revela valores', t => {
  const cwd = fixture(t);
  const secret = tokenFalso();
  writeFileSync(join(cwd, 'publico.txt'), `TOKEN=${secret}\n`); git(cwd, 'add', 'publico.txt');
  writeFileSync(join(cwd, 'publico.txt'), 'copia limpia\n');
  assert.throws(() => revisarSecretos({ cwd }), error => /github-pat/.test(error.message) && !error.message.includes(secret));
});
test('bloquea archivo privado forzado aunque gitignore lo excluya', t => {
  const cwd = fixture(t);
  mkdirSync(join(cwd, 'ventas')); writeFileSync(join(cwd, 'ventas', 'precio.md'), 'fixture privado sin datos reales');
  git(cwd, 'add', 'ventas/precio.md');
  assert.throws(() => revisarSecretos({ cwd }), /Archivos privados.*ventas/);
});
test('un secreto agregado y borrado en commits pendientes sigue bloqueando', t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'publico.txt'), `TOKEN=${tokenFalso()}\n`); git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: alta');
  writeFileSync(join(cwd, 'publico.txt'), 'limpio\n'); git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: baja');
  assert.throws(() => revisarSecretos({ cwd }), /github-pat/);
});
test('un privado borrado de HEAD pero presente en commits pendientes sigue bloqueando', t => {
  const cwd = fixture(t);
  mkdirSync(join(cwd, 'notas-locales')); writeFileSync(join(cwd, 'notas-locales', 'nota.md'), 'fixture');
  git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: alta');
  git(cwd, 'rm', 'notas-locales/nota.md'); git(cwd, 'commit', '-m', 'test: baja');
  assert.throws(() => revisarSecretos({ cwd }), /Archivos privados/);
});
test('referencia base inexistente falla cerrado sin tocar index', t => {
  const cwd = fixture(t);
  const before = git(cwd, 'write-tree');
  assert.throws(() => revisarSecretos({ cwd, base: '0'.repeat(40) }), /No se pudo leer/);
  assert.equal(git(cwd, 'write-tree'), before);
});


test('clave anon pública Supabase no bloquea, service_role y sesiones sí', t => {
  const cwd = fixture(t);
  const jwt = role => [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ iss: 'supabase', role, ref: 'fixture-publico', iat: 1700000000, exp: 2000000000 })).toString('base64url'), randomBytes(32).toString('base64url')].join('.');
  writeFileSync(join(cwd, 'publico.txt'), `anon=${jwt('anon')}\n`); git(cwd, 'add', '.');
  assert.doesNotThrow(() => revisarSecretos({ cwd }));
  for (const role of ['service_role', 'authenticated']) {
    writeFileSync(join(cwd, 'publico.txt'), `key=${jwt(role)}\n`); git(cwd, 'add', '.');
    assert.throws(() => revisarSecretos({ cwd }), /jwt/);
  }
});

test('scanner ausente falla cerrado con comando de recuperación', () => {
  assert.throws(() => verificarBinario(join(tmpdir(), 'scanner-inexistente-fixture')), /node herramientas\/secretos.mjs instalar/);
});
test('CI sin base revisa también los commits borrados de la historia', t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'publico.txt'), `TOKEN=${tokenFalso()}\n`); git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: alta');
  writeFileSync(join(cwd, 'publico.txt'), 'limpio\n'); git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: baja');
  assert.throws(() => revisarSecretos({ cwd, base: null }), /github-pat/);
});
test('comentario allow no oculta un secreto', t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'publico.txt'), `TOKEN=${tokenFalso()} # gitleaks:allow\n`); git(cwd, 'add', '.');
  assert.throws(() => revisarSecretos({ cwd }), /github-pat/);
});

test('configuración no seleccionada del working tree no puede ocultar secretos', t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, '.gitleaks.toml'), '[extend]\nuseDefault = true\n'); git(cwd, 'add', '.gitleaks.toml');
  const secret = tokenFalso();
  writeFileSync(join(cwd, 'publico.txt'), `TOKEN=${secret}\n`); git(cwd, 'add', 'publico.txt');
  writeFileSync(join(cwd, '.gitleaks.toml'), `[extend]\nuseDefault = true\n[[allowlists]]\nregexes = ['${secret}']\n`);
  assert.throws(() => revisarSecretos({ cwd }), /github-pat/);
});
test('service_role borrada no se confunde con anon en el mismo renglón', t => {
  const cwd = fixture(t);
  const jwt = role => [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ iss: 'supabase', role, ref: 'fixture-publico', iat: 1700000000, exp: 2000000000 })).toString('base64url'), randomBytes(32).toString('base64url')].join('.');
  writeFileSync(join(cwd, 'publico.txt'), `key=${jwt('service_role')}\n`); git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: alta');
  writeFileSync(join(cwd, 'publico.txt'), `key=${jwt('anon')}\n`); git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: reemplazo');
  assert.throws(() => revisarSecretos({ cwd }), /jwt/);
});
