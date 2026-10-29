import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Dos suites de navegador a la vez agotan la máquina: los servidores de
// wrangler comparten `.local` y Chromium termina cerrando contextos a mitad de
// una prueba. El bloqueo convierte esa interferencia en un error explícito.
const activo = (pid) => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};

/** Toma el bloqueo o falla con una instrucción concreta. Devuelve su liberación. */
export function tomarBloqueo(ruta) {
  mkdirSync(dirname(ruta), { recursive: true });
  const escribir = (modo) => writeFileSync(ruta, String(process.pid), { flag: modo });
  try {
    escribir('wx');
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const anterior = Number(readFileSync(ruta, 'utf8').trim());
    if (Number.isInteger(anterior) && anterior > 0 && activo(anterior)) {
      throw new Error(
        `Otra ejecución de las pruebas de navegador ya usa esta máquina (pid ${anterior}). `
        + 'Esperar a que termine antes de repetir; correrlas en paralelo produce fallas falsas.',
      );
    }
    // Un proceso interrumpido deja el archivo: se reemplaza sólo si su pid no vive.
    escribir('w');
  }
  let liberado = false;
  return () => {
    if (liberado) return;
    liberado = true;
    try { rmSync(ruta); } catch { /* ya se liberó */ }
  };
}
