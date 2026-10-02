import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { revisarSecretos, verificarBinario } from './secretos.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = new URL('./hooks/pre-push.sh', import.meta.url);
function git(cwd, ...args) {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { throw new Error('No se pudo verificar Git. El push queda bloqueado.'); }
}
export function instalarHook(cwd = ROOT) {
  // No cambiar hooksPath ni reemplazar hooks existentes de otro flujo.
  const config = spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' });
  if (config.error || ![0, 1].includes(config.status)) throw new Error('No se pudo inspeccionar core.hooksPath. No se instaló el hook.');
  if (config.status === 0) throw new Error('Existe core.hooksPath. Integrar el control en ese flujo antes de instalar; no se modificó ningún hook.');
  const target = resolve(cwd, git(cwd, 'rev-parse', '--git-path', 'hooks/pre-push'));
  const bytes = readFileSync(source);
  if (existsSync(target) && !readFileSync(target).equals(bytes)) throw new Error('Ya existe un pre-push distinto. Integrar ambos controles; no se reemplazó el hook.');
  verificarBinario();
  writeFileSync(target, bytes);
  chmodSync(target, 0o755);
  return target;
}
export function revisarPush({ cwd = ROOT, input }) {
  const lines = input.split(/\r?\n/).filter(Boolean);
  const updates = lines.map(line => {
    const fields = line.split(' ');
    if (fields.length !== 4 || !fields[0] || !fields[2] || !fields[1].match(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/) || !fields[3].match(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/)) throw new Error('Entrada del protocolo pre-push inválida. No publicar.');
    return { head: fields[1], base: /^0+$/.test(fields[3]) ? null : fields[3] };
  });
  for (const { head, base } of updates) {
    if (/^0+$/.test(head)) continue;
    // Los OID vienen de Git, no de origin/main ni de la rama actual.
    if (base) {
      try { git(cwd, 'cat-file', '-e', `${base}^{commit}`); }
      catch { throw new Error('Falta el commit remoto anunciado. Ejecutar git fetch del remoto elegido y reintentar el push; no se descargó nada automáticamente.'); }
    }
    revisarSecretos({ cwd, head, base, tree: git(cwd, 'rev-parse', `${head}^{tree}`) });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === 'instalar') {
      instalarHook();
      console.log('Hook pre-push instalado para este clon.');
    } else {
      revisarPush({ cwd: git(process.cwd(), 'rev-parse', '--show-toplevel'), input: readFileSync(0, 'utf8') });
      console.log('Pre-push: secretos y archivos privados revisados.');
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
