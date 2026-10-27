import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Astro resuelve `@/` a la raíz del repo (ver `astro.config.mjs`). Node no
// conoce ese alias, así que los módulos puros compartidos con el sitio
// (`components/formularios/mail-precio.ts`, `casas.ts`) no se pueden importar
// desde las pruebas sin este gancho: es sólo resolución de rutas, no ejecuta
// ningún módulo del sitio ni sale a la red.
//
// El registro tiene que ocurrir antes de resolver el módulo que usa el alias,
// por eso las pruebas registran y después importan con `await import()`.

const raiz = fileURLToPath(new URL('../../../', import.meta.url));

/** Primer candidato que existe: la ruta tal cual, con `.ts`/`.tsx` o un índice. */
function archivo(base) {
  for (const candidato of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
    if (existsSync(candidato)) return candidato;
  }
  return null;
}

let registrado = false;

export function registrarAlias() {
  if (registrado) return;
  registrado = true;
  registerHooks({
    resolve(especificador, contexto, siguiente) {
      if (!especificador.startsWith('@/')) return siguiente(especificador, contexto);
      const destino = archivo(join(raiz, especificador.slice(2)));
      // Sin destino se deja el especificador original: falla con el error de
      // siempre en vez de apuntar a una ruta inventada.
      return destino ? { url: pathToFileURL(destino).href, shortCircuit: true } : siguiente(especificador, contexto);
    },
  });
}

registrarAlias();
