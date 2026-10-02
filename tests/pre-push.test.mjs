import test from 'node:test';
import assert from 'node:assert/strict';
import { instalarHook, revisarPush } from '../herramientas/pre-push.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'hook-prueba-á-'));
  t.after(() => {
    const root = realpathSync(dir);
    assert.ok(root.startsWith(realpathSync(tmpdir()) + sep));
    rmSync(root, { recursive: true, force: true });
  });
  const cwd = join(dir, 'clon'); mkdirSync(cwd);
  const remote = join(dir, 'remoto.git'); git(dir, 'init', '--bare', remote);
  git(cwd, 'init', '-b', 'main'); git(cwd, 'config', 'user.name', 'Prueba'); git(cwd, 'config', 'user.email', 'prueba@example.invalid'); git(cwd, 'config', 'core.autocrlf', 'false');
  writeFileSync(join(cwd, 'publico.txt'), 'limpio\n'); commit(cwd);
  git(cwd, 'remote', 'add', 'destino', remote);
  git(cwd, 'push', 'destino', 'main');
  // El hook real usa el módulo del proyecto, sin copiar herramientas o secretos.
  instalarHook(cwd);
  mkdirSync(join(cwd, 'herramientas'));
  const entry = new URL('../herramientas/pre-push.mjs', import.meta.url).href;
  writeFileSync(join(cwd, 'herramientas/pre-push.mjs'), `import { revisarPush } from ${JSON.stringify(entry)};\nimport { readFileSync } from 'node:fs';\ntry { revisarPush({ cwd: process.cwd(), input: readFileSync(0, 'utf8') }); } catch (e) { console.error(e.message); process.exitCode = 1; }\n`);
  writeFileSync(join(cwd, '.git/info/exclude'), 'herramientas/\n');
  return { cwd, remote };
}
function commit(cwd) { git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'test: fixture'); }
function push(cwd, ...refs) { return spawnSync('git', ['push', 'destino', ...refs], { cwd, encoding: 'utf8' }); }
const token = () => ['ghp', randomBytes(18).toString('hex')].join('_');
test('entrada inválida del protocolo falla cerrado', () => { assert.throws(() => revisarPush({ input: 'entrada inválida' }), /protocolo/); });
test('hook permite push inocuo y no lee el working tree privado', t => {
  const { cwd } = fixture(t);
  writeFileSync(join(cwd, 'publico.txt'), 'cambio público\n'); commit(cwd);
  writeFileSync(join(cwd, '.env.local'), `TOKEN=${token()}\n`);
  assert.equal(push(cwd, 'main').status, 0);
});
test('push real bloquea secreto agregado y luego borrado sin revelarlo', t => {
  const { cwd, remote } = fixture(t); const secret = token();
  const before = git(remote, 'rev-parse', 'main');
  writeFileSync(join(cwd, 'publico.txt'), `TOKEN=${secret}\n`); commit(cwd);
  writeFileSync(join(cwd, 'publico.txt'), 'limpio\n'); commit(cwd);
  const result = push(cwd, 'main'); assert.notEqual(result.status, 0);
  assert.match(result.stderr, /github-pat/); assert.ok(!result.stderr.includes(secret));
  assert.equal(git(remote, 'rev-parse', 'main'), before);
});
test('push bloquea privado aun eliminado antes de HEAD', t => {
  const { cwd } = fixture(t); mkdirSync(join(cwd, 'ventas')); writeFileSync(join(cwd, 'ventas/precio.txt'), 'fixture'); commit(cwd);
  git(cwd, 'rm', 'ventas/precio.txt'); commit(cwd);
  assert.notEqual(push(cwd, 'main').status, 0);
});
test('rama nueva y múltiples refs revisan también la rama no actual', t => {
  const { cwd } = fixture(t); git(cwd, 'checkout', '-b', 'otra');
  writeFileSync(join(cwd, 'publico.txt'), `TOKEN=${token()}\n`); commit(cwd); git(cwd, 'checkout', 'main');
  assert.notEqual(push(cwd, 'main', 'otra').status, 0);
});
test('force push revisa historia divergente y eliminación no agrega blobs', t => {
  const { cwd } = fixture(t); git(cwd, 'checkout', '-b', 'otra'); writeFileSync(join(cwd, 'publico.txt'), 'otra\n'); commit(cwd); assert.equal(push(cwd, 'otra').status, 0);
  git(cwd, 'reset', '--hard', 'main'); writeFileSync(join(cwd, 'publico.txt'), `TOKEN=${token()}\n`); commit(cwd);
  assert.notEqual(push(cwd, '--force', 'otra').status, 0);
  assert.equal(push(cwd, '--delete', 'otra').status, 0);
});
test('clave anon legítima permite push', t => {
  const { cwd } = fixture(t);
  const jwt = [Buffer.from('{"alg":"HS256"}').toString('base64url'), Buffer.from('{"iss":"supabase","role":"anon"}').toString('base64url'), randomBytes(32).toString('base64url')].join('.');
  writeFileSync(join(cwd, 'publico.txt'), `anon=${jwt}\n`); commit(cwd); assert.equal(push(cwd, 'main').status, 0);
});
test('instalador no reemplaza hook ajeno ni hooksPath', t => {
  const { cwd } = fixture(t); const path = join(cwd, '.git/hooks/pre-push'); writeFileSync(path, '#!/bin/sh\nexit 0\n'); const bytes = readFileSync(path);
  assert.throws(() => instalarHook(cwd), /distinto/); assert.deepEqual(readFileSync(path), bytes);
  git(cwd, 'config', 'core.hooksPath', 'custom'); assert.throws(() => instalarHook(cwd), /core.hooksPath/);
});
test('OID remoto ausente bloquea y pide fetch sin revelar destino', t => {
  const { cwd } = fixture(t); const head = git(cwd, 'rev-parse', 'HEAD');
  assert.throws(() => revisarPush({ cwd, input: `refs/heads/main ${head} refs/heads/main ${'a'.repeat(40)}\n` }), /git fetch/);
});
