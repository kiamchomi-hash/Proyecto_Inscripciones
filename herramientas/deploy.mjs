// Publicador compartido: los envoltorios sólo abren la terminal y llaman a Node.
import { execFileSync } from 'node:child_process';
import { revisarSecretos } from './secretos.mjs';
import { checkCandidate, checkLocal } from './deploy-check.mjs';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

function environment() {
  const env = { ...process.env, GIT_LITERAL_PATHSPECS: '1', GIT_PAGER: 'cat' };
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;
  return env;
}
function git(cwd, ...args) {
  return execFileSync('git', ['--no-pager', ...args], {
    cwd, env: environment(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
const value = (cwd, ...args) => git(cwd, ...args).trim();
const paths = text => text.split('\0').filter(Boolean);

export function listChanges(cwd) {
  // Sin detección de renombres: se eligen explícitamente la baja y el alta.
  return paths(git(cwd, 'status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'))
    .map(record => record.slice(3));
}
function assertEmptyIndex(cwd) {
  if (value(cwd, 'diff', '--cached', '--name-only')) {
    throw new Error('Hay archivos staged previos. No se modificó el index. Revisarlos con git diff --cached; resolverlos por separado o usar git restore --staged -- "ruta" para retirar cada archivo sin borrar su contenido. Después, volver a ejecutar el publicador.');
  }
}
function assertBinding(cwd, head, tree) {
  if (value(cwd, 'branch', '--show-current') !== 'main' || value(cwd, 'rev-parse', 'HEAD') !== head || value(cwd, 'write-tree') !== tree) {
    throw new Error('La rama, HEAD o el index cambiaron desde la revisión. No se publicó nada. Revisar git status y git diff --cached antes de volver a ejecutar el publicador.');
  }
}
function pushLocal(cwd) {
  execFileSync('git', ['push', 'origin', 'main:main'], { cwd, env: environment(), stdio: 'inherit' });
}

export async function runDeploy({ cwd, ask, print = console.log, check = checkLocal, push = pushLocal, scan = revisarSecretos }) {
  let prepared = false;
  let committed = false;
  try {
    print('SUBIR CAMBIOS A PRODUCCIÓN — push a main despliega el sitio.');
    if (value(cwd, 'branch', '--show-current') !== 'main') throw new Error('Este publicador sólo funciona en main. Cancelado.');
    assertEmptyIndex(cwd);
    const head = value(cwd, 'rev-parse', 'HEAD');
    const originalTree = value(cwd, 'write-tree');
    // Una referencia ausente no equivale a cero commits pendientes.
    const remote = value(cwd, 'rev-parse', '--verify', 'refs/remotes/origin/main');
    const pending = value(cwd, 'log', '--oneline', `${remote}..${head}`);
    if (pending) print(`También se publicarán estos commits locales anteriores:\n${pending}`);
    const changes = listChanges(cwd);
    let message;
    let reviewedTree = originalTree;
    if (changes.length) {
      print('Archivos disponibles (un renombre aparece como baja y alta: seleccionar ambas):');
      changes.forEach((path, i) => print(`${i + 1}. ${JSON.stringify(path)}`));
      const answer = (await ask('Números de los archivos propios, separados por espacios (vacío cancela): ')).trim();
      const numbers = answer.split(/\s+/).map(Number);
      if (!/^\d+(?:\s+\d+)*$/.test(answer) || new Set(numbers).size !== numbers.length || numbers.some(n => !Number.isSafeInteger(n) || n < 1 || n > changes.length)) {
        throw new Error('Selección vacía o inválida. No se preparó ningún archivo.');
      }
      const selected = numbers.map(n => changes[n - 1]);
      message = (await ask('Descripción con formato convencional (por ejemplo, fix: corregir formulario): ')).trim();
      if (!/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^\r\n]+\))?!?: .+$/u.test(message) || /[\r\n]/.test(message)) {
        throw new Error('Descripción inválida: usar un mensaje convencional de una sola línea.');
      }
      assertBinding(cwd, head, originalTree);
      // Argumentos literales y separados: espacios, unicode y metacaracteres no son comandos.
      git(cwd, 'add', '--', ...selected);
      prepared = true;
      const staged = paths(git(cwd, 'diff', '--cached', '--name-only', '--no-renames', '-z'));
      if (!staged.length || staged.some(path => !selected.includes(path))) throw new Error('El index no coincide con la selección. Cancelado.');
      reviewedTree = value(cwd, 'write-tree');
      await scan({ cwd, tree: reviewedTree, base: remote, head });
      assertBinding(cwd, head, reviewedTree);
      print('Revisar exactamente lo preparado para el commit:');
      print(git(cwd, 'diff', '--cached', '--stat'));
      print(git(cwd, 'diff', '--cached', '--no-ext-diff', '--no-textconv', '--binary'));
    } else if (!pending) {
      print('No hay nada para publicar.');
      return 0;
    }
    if (!changes.length) await scan({ cwd, tree: reviewedTree, base: remote, head });
    if ((await ask('¿Publicar lo revisado y los commits anteriores indicados? (S/N): ')).trim().toUpperCase() !== 'S') {
      throw new Error('Cancelado. No se commiteó ni publicó nada.');
    }
    assertBinding(cwd, head, reviewedTree);
    print('[1/3] Revisando el árbol seleccionado: instalación aislada y npm run check (puede tardar varios minutos).');
    await checkCandidate(cwd, reviewedTree, check);
    assertBinding(cwd, head, reviewedTree);
    if (changes.length) {
      print('[2/3] Guardando sólo el staged revisado.');
      git(cwd, 'commit', '-m', message);
      committed = true;
      // Si un hook modifica el commit, no publicar una versión que nadie revisó.
      if (value(cwd, 'rev-parse', 'HEAD^{tree}') !== reviewedTree || value(cwd, 'rev-parse', 'HEAD^') !== head) {
        throw new Error('El commit no coincide con lo revisado. Quedó local; inspeccionarlo antes de publicar.');
      }
      assertBinding(cwd, value(cwd, 'rev-parse', 'HEAD'), reviewedTree);
    }
    print('[3/3] Subiendo a GitHub.');
    await push(cwd);
    print('Publicado. Vercel iniciará el deploy; después ejecutar el smoke de producción.');
    return 0;
  } catch (error) {
    print(`No se completó la publicación: ${error.message}`);
    if (committed) print('El commit quedó local. Revisar git log origin/main..HEAD antes de reintentar.');
    else if (prepared) print('Los archivos seleccionados quedaron staged para inspección. Usar git diff --cached y git restore --staged -- "ruta" si se quiere retirarlos. No se borró ningún cambio.');
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.exitCode = await runDeploy({ cwd: resolve(dirname(fileURLToPath(import.meta.url)), '..'), ask: prompt => rl.question(prompt) });
  } finally {
    rl.close();
  }
}
