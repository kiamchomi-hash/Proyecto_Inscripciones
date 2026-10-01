import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, renameSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const moduleUrl = new URL('../herramientas/deploy.mjs', import.meta.url);
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'deploy-seleccion-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-b', 'main');
  git(cwd, 'config', 'core.autocrlf', 'false');
  git(cwd, 'config', 'user.name', 'Prueba');
  git(cwd, 'config', 'user.email', 'prueba@example.invalid');
  for (const name of ['propio.txt', 'ajeno.txt', 'borrar.txt', 'antes.txt']) writeFileSync(join(cwd, name), 'base\n');
  git(cwd, 'add', '--', 'propio.txt', 'ajeno.txt', 'borrar.txt', 'antes.txt');
  git(cwd, 'commit', '-m', 'test: iniciar fixture');
  git(cwd, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  return cwd;
}
async function run(cwd, answers, overrides = {}) {
  const { runDeploy } = await import(moduleUrl);
  const output = [];
  let pushes = 0;
  const result = await runDeploy({ cwd, ask: async () => answers.shift() ?? '', print: s => output.push(s), check: () => {}, push: () => { pushes++; }, ...overrides });
  return { result, output: output.join('\n'), pushes };
}

test('los envoltorios delegan y no agregan todos los archivos', () => {
  for (const extension of ['bat', 'sh']) {
    const text = readFileSync(new URL(`../herramientas/5 - Subir cambios (deploy).${extension}`, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /git add -A/);
    assert.match(text, /deploy\.mjs/);
  }
});

test('sólo commitea el archivo elegido y muestra el diff antes de confirmar', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'propio.txt'), 'propio nuevo\n');
  writeFileSync(join(cwd, 'ajeno.txt'), 'ajeno nuevo\n');
  const { listChanges } = await import(moduleUrl);
  const number = listChanges(cwd).findIndex(x => x === 'propio.txt') + 1;
  const result = await run(cwd, [String(number), 'fix: cambio propio', 'S']);
  assert.equal(result.result, 0);
  assert.equal(result.pushes, 1);
  assert.match(result.output, /\+propio nuevo/);
  assert.equal(git(cwd, 'show', 'HEAD:ajeno.txt'), 'base');
  assert.equal(git(cwd, 'show', 'HEAD:propio.txt'), 'propio nuevo');
  assert.match(git(cwd, 'status', '--porcelain'), /ajeno\.txt/);
});

test('staged preexistente bloquea sin modificarlo', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'ajeno.txt'), 'staged ajeno');
  git(cwd, 'add', '--', 'ajeno.txt');
  const before = git(cwd, 'write-tree');
  const result = await run(cwd, []);
  assert.equal(result.result, 1);
  assert.equal(result.pushes, 0);
  assert.equal(git(cwd, 'write-tree'), before);
  assert.match(result.output, /git restore --staged/);
});

test('selección inválida o vacía no prepara archivos', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo');
  for (const answer of ['', '0', '2', '1; echo peligro', '1 1', '*']) {
    const result = await run(cwd, [answer]);
    assert.equal(result.result, 1);
    assert.equal(git(cwd, 'diff', '--cached'), '');
  }
});

test('admite espacios, unicode, metacaracteres, alta, baja y renombre', async t => {
  const cwd = fixture(t);
  unlinkSync(join(cwd, 'borrar.txt'));
  renameSync(join(cwd, 'antes.txt'), join(cwd, 'después espacio &.txt'));
  writeFileSync(join(cwd, 'nuevo [literal] &.txt'), 'nuevo');
  const { listChanges } = await import(moduleUrl);
  const changes = listChanges(cwd);
  const result = await run(cwd, [changes.map((_, i) => i + 1).join(' '), 'feat: alta baja y renombre', 's']);
  assert.equal(result.result, 0);
  assert.equal(git(cwd, 'show', 'HEAD:después espacio &.txt'), 'base');
  assert.equal(git(cwd, 'show', 'HEAD:nuevo [literal] &.txt'), 'nuevo');
  assert.doesNotMatch(git(cwd, 'ls-tree', '--name-only', 'HEAD'), /borrar|antes/);
});

test('cancelar deja la selección staged sin commit ni push', async t => {
  const cwd = fixture(t);
  const head = git(cwd, 'rev-parse', 'HEAD');
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo');
  const result = await run(cwd, ['1', 'fix: prueba', 'N']);
  assert.equal(result.result, 1);
  assert.equal(result.pushes, 0);
  assert.equal(git(cwd, 'rev-parse', 'HEAD'), head);
  assert.equal(git(cwd, 'diff', '--cached', '--name-only'), 'propio.txt');
});

test('check fallido no commitea ni publica', async t => {
  const cwd = fixture(t);
  const head = git(cwd, 'rev-parse', 'HEAD');
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo');
  const result = await run(cwd, ['1', 'fix: prueba', 'S'], { check: () => { throw new Error('check falló'); } });
  assert.equal(result.result, 1);
  assert.equal(result.pushes, 0);
  assert.equal(git(cwd, 'rev-parse', 'HEAD'), head);
});

test('cambio concurrente del index después de revisar bloquea el commit', async t => {
  const cwd = fixture(t);
  const head = git(cwd, 'rev-parse', 'HEAD');
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo');
  const result = await run(cwd, ['1', 'fix: prueba', 'S'], { check: () => { writeFileSync(join(cwd, 'ajeno.txt'), 'ajeno'); git(cwd, 'add', '--', 'ajeno.txt'); } });
  assert.equal(result.result, 1);
  assert.equal(result.pushes, 0);
  assert.equal(git(cwd, 'rev-parse', 'HEAD'), head);
});

test('sin cambios muestra commits pendientes y permite publicarlos tras check', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'propio.txt'), 'pendiente');
  git(cwd, 'add', '--', 'propio.txt');
  git(cwd, 'commit', '-m', 'fix: pendiente');
  const result = await run(cwd, ['S']);
  assert.equal(result.result, 0);
  assert.equal(result.pushes, 1);
  assert.match(result.output, /fix: pendiente/);
});

test('rama distinta de main y referencia remota faltante fallan cerrado', async t => {
  const cwd = fixture(t);
  git(cwd, 'checkout', '-b', 'otra');
  assert.equal((await run(cwd, [])).result, 1);
  git(cwd, 'checkout', 'main');
  git(cwd, 'update-ref', '-d', 'refs/remotes/origin/main');
  assert.equal((await run(cwd, [])).result, 1);
});

test('un hook que agrega trabajo ajeno deja el commit local sin push', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo');
  writeFileSync(join(cwd, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\nprintf ajeno > ajeno.txt\ngit add -- ajeno.txt\n', { mode: 0o755 });
  const result = await run(cwd, ['1', 'fix: prueba', 'S']);
  assert.equal(result.result, 1);
  assert.equal(result.pushes, 0);
  assert.match(result.output, /commit no coincide/);
});

test('mensaje con comillas y metacaracteres se guarda literal; push fallido conserva commit', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo');
  const message = 'fix: corregir "dato" & conservar 100%';
  const result = await run(cwd, ['1', message, 'S'], { push: () => { throw new Error('push rechazado'); } });
  assert.equal(result.result, 1);
  assert.equal(git(cwd, 'log', '-1', '--format=%s'), message);
  assert.match(result.output, /commit quedó local/);
});

test('sin descripción convencional no prepara archivos ni publica', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo');
  for (const message of ['', 'mensaje libre', 'fix: uno\nCo-Authored-By: otro']) {
    const result = await run(cwd, ['1', message]);
    assert.equal(result.result, 1);
    assert.equal(result.pushes, 0);
    assert.equal(git(cwd, 'diff', '--cached'), '');
  }
});

test('el guardrail bloquea antes de imprimir el diff, commitear o pushear', async t => {
  const cwd = fixture(t);
  const head = git(cwd, 'rev-parse', 'HEAD');
  writeFileSync(join(cwd, 'propio.txt'), 'valor privado que no debe imprimirse');
  const result = await run(cwd, ['1', 'fix: prueba', 'S'], { scan: () => { throw new Error('scanner bloqueó'); } });
  assert.equal(result.result, 1);
  assert.equal(result.pushes, 0);
  assert.equal(git(cwd, 'rev-parse', 'HEAD'), head);
  assert.doesNotMatch(result.output, /valor privado que no debe imprimirse/);
});

test('check real rechaza A seleccionado cuando depende de B excluido, sin tocar trabajo paralelo', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'fixture-check', version: '1.0.0', scripts: { check: 'node validar.cjs' } }));
  writeFileSync(join(cwd, 'package-lock.json'), JSON.stringify({ name: 'fixture-check', version: '1.0.0', lockfileVersion: 3, packages: { '': { name: 'fixture-check', version: '1.0.0' } } }));
  writeFileSync(join(cwd, 'validar.cjs'), "const fs = require('node:fs'); require('node:assert/strict').equal(fs.readFileSync('propio.txt', 'utf8'), fs.readFileSync('ajeno.txt', 'utf8'));\n");
  git(cwd, 'add', '--', 'package.json', 'package-lock.json', 'validar.cjs');
  git(cwd, 'commit', '-m', 'test: preparar check real');
  git(cwd, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  const head = git(cwd, 'rev-parse', 'HEAD');
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo\n');
  writeFileSync(join(cwd, 'ajeno.txt'), 'nuevo\n');
  const { listChanges } = await import(moduleUrl);
  const number = listChanges(cwd).findIndex(x => x === 'propio.txt') + 1;
  const result = await run(cwd, [String(number), 'fix: sólo A', 'S'], { check: undefined, scan: () => {} });
  assert.equal(result.result, 1);
  assert.equal(result.pushes, 0);
  assert.equal(git(cwd, 'rev-parse', 'HEAD'), head);
  assert.equal(git(cwd, 'diff', '--cached', '--name-only'), 'propio.txt');
  assert.equal(readFileSync(join(cwd, 'ajeno.txt'), 'utf8'), 'nuevo\n');
});

test('check recibe bytes Git, no cambios posteriores, archivos ignorados ni credenciales heredadas', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'propio.txt'), 'revisado\n');
  writeFileSync(join(cwd, '.git', 'info', 'exclude'), '.env.local\n');
  writeFileSync(join(cwd, '.env.local'), 'fixture local sin publicar');
  const prior = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-no-debe-heredarse';
  t.after(() => { if (prior === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = prior; });
  const answers = ['1', 'fix: revisado', 'S'];
  let snapshotPath;
  const result = await run(cwd, [], {
    ask: async () => {
      const answer = answers.shift();
      if (answer === 'S') writeFileSync(join(cwd, 'propio.txt'), 'posterior\n');
      return answer;
    },
    check: (snapshot, env) => {
      snapshotPath = snapshot;
      assert.notEqual(snapshot, cwd);
      assert.equal(readFileSync(join(snapshot, 'propio.txt'), 'utf8'), 'revisado\n');
      assert.equal(readFileSync(join(snapshot, 'ajeno.txt'), 'utf8'), 'base\n');
      assert.throws(() => readFileSync(join(snapshot, '.env.local')), /ENOENT/);
      assert.throws(() => readFileSync(join(snapshot, '.git', 'config')), /ENOENT/);
      assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, undefined);
      assert.equal(env.NODE_OPTIONS, undefined);
      assert.notEqual(env.HOME, process.env.HOME);
    },
  });
  assert.equal(result.result, 0);
  assert.equal(git(cwd, 'show', 'HEAD:propio.txt'), 'revisado');
  assert.equal(readFileSync(join(cwd, 'propio.txt'), 'utf8'), 'posterior\n');
  assert.throws(() => readFileSync(join(snapshotPath, 'propio.txt')), /ENOENT/);
});

test('un check que modifica, elimina o agrega código en el snapshot bloquea y limpia', async t => {
  for (const mutate of [
    snapshot => writeFileSync(join(snapshot, 'propio.txt'), 'mutado'),
    snapshot => unlinkSync(join(snapshot, 'propio.txt')),
    snapshot => writeFileSync(join(snapshot, 'extra.txt'), 'nuevo'),
  ]) {
    const cwd = fixture(t);
    const head = git(cwd, 'rev-parse', 'HEAD');
    writeFileSync(join(cwd, 'propio.txt'), 'revisado\n');
    let snapshotPath;
    const result = await run(cwd, ['1', 'fix: revisado', 'S'], { check: snapshot => { snapshotPath = snapshot; mutate(snapshot); } });
    assert.equal(result.result, 1);
    assert.equal(result.pushes, 0);
    assert.equal(git(cwd, 'rev-parse', 'HEAD'), head);
    assert.equal(git(cwd, 'diff', '--cached', '--name-only'), 'propio.txt');
    assert.match(result.output, /check modificó/);
    assert.throws(() => readFileSync(join(snapshotPath, 'ajeno.txt')), /ENOENT/);
  }
});

test('check real pasa con A y B seleccionados y no ejecuta hooks npm', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'fixture-check', version: '1.0.0', scripts: {
    check: 'node validar.cjs', precheck: 'node -e "process.exit(9)"', postcheck: 'node -e "process.exit(9)"', postinstall: 'node -e "process.exit(9)"',
  } }));
  writeFileSync(join(cwd, 'package-lock.json'), JSON.stringify({ name: 'fixture-check', version: '1.0.0', lockfileVersion: 3, packages: { '': { name: 'fixture-check', version: '1.0.0' } } }));
  writeFileSync(join(cwd, 'validar.cjs'), "const fs = require('node:fs'); const assert = require('node:assert/strict'); assert.equal(fs.readFileSync('propio.txt', 'utf8'), fs.readFileSync('ajeno.txt', 'utf8')); assert.equal(process.env.SUPABASE_SERVICE_ROLE_KEY, undefined);\n");
  git(cwd, 'add', '--', 'package.json', 'package-lock.json', 'validar.cjs');
  git(cwd, 'commit', '-m', 'test: preparar check real');
  git(cwd, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  writeFileSync(join(cwd, 'propio.txt'), 'nuevo\n');
  writeFileSync(join(cwd, 'ajeno.txt'), 'nuevo\n');
  const { listChanges } = await import(moduleUrl);
  const numbers = listChanges(cwd).map((_, i) => i + 1).join(' ');
  const result = await run(cwd, [numbers, 'fix: ambos cambios', 'S'], { check: undefined, scan: () => {} });
  assert.equal(result.result, 0);
  assert.equal(result.pushes, 1);
});

test('una instalación con package y lock incompatibles falla antes de check y commit', async t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'fixture-check', version: '1.0.0', scripts: { check: 'node -e "process.exit(0)"' }, dependencies: { 'is-number': '7.0.0' } }));
  writeFileSync(join(cwd, 'package-lock.json'), JSON.stringify({ name: 'fixture-check', version: '1.0.0', lockfileVersion: 3, packages: { '': { name: 'fixture-check', version: '1.0.0' } } }));
  const head = git(cwd, 'rev-parse', 'HEAD');
  const { listChanges } = await import(moduleUrl);
  const numbers = listChanges(cwd).map((_, i) => i + 1).join(' ');
  const result = await run(cwd, [numbers, 'fix: dependencias', 'S'], { check: undefined, scan: () => {} });
  assert.equal(result.result, 1);
  assert.equal(result.pushes, 0);
  assert.equal(git(cwd, 'rev-parse', 'HEAD'), head);
  assert.match(result.output, /npm ci falló/);
});

test('snapshot rechaza enlaces Git antes de ejecutar check', async t => {
  const cwd = fixture(t);
  const oid = execFileSync('git', ['hash-object', '-w', '--stdin'], { cwd, input: '../fuera', encoding: 'utf8' }).trim();
  git(cwd, 'update-index', '--add', '--cacheinfo', `120000,${oid},enlace`);
  const tree = git(cwd, 'write-tree');
  const { checkCandidate } = await import('../herramientas/deploy-check.mjs');
  let ran = false;
  await assert.rejects(checkCandidate(cwd, tree, () => { ran = true; }), /no soportados/);
  assert.equal(ran, false);
  assert.equal(git(cwd, 'write-tree'), tree);
});

test('snapshot permite caches nuevos, pero no cambia los bytes LF Git por autocrlf', async t => {
  const cwd = fixture(t);
  git(cwd, 'config', 'core.autocrlf', 'true');
  const tree = git(cwd, 'write-tree');
  const { checkCandidate } = await import('../herramientas/deploy-check.mjs');
  const { mkdirSync } = await import('node:fs');
  await checkCandidate(cwd, tree, snapshot => {
    assert.equal(readFileSync(join(snapshot, 'propio.txt'), 'utf8'), 'base\n');
    mkdirSync(join(snapshot, '.next'));
    writeFileSync(join(snapshot, '.next', 'tipos.d.ts'), '// cache generado');
    writeFileSync(join(snapshot, 'tsconfig.tsbuildinfo'), '{}');
  });
  assert.equal(git(cwd, 'write-tree'), tree);
});
