// Conserva las respuestas de Next con el fixture local antes de retirar Next.
// No publica nada ni usa la base real.
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { join } from 'node:path';
import { arrancarNext, esperarHttp, nextEnEjecucion, puertoLibre, stubSupabase } from './servidores.mjs';

async function muestra() {
  if (nextEnEjecucion()) throw new Error('Ya hay un Next en ejecución; no se puede compartir .next.');
  const supabase = await stubSupabase();
  let next;
  try {
    const puerto = await puertoLibre();
    next = arrancarNext({ puerto, supabase });
    await esperarHttp(`http://127.0.0.1:${puerto}/`, 240_000);
    const resultado = {};
    for (const ruta of ['sitemap.xml', 'robots.txt']) {
      const respuesta = await fetch(`http://127.0.0.1:${puerto}/${ruta}`);
      if (respuesta.status !== 200) throw new Error(`${ruta} respondió ${respuesta.status}.`);
      resultado[ruta] = await respuesta.text();
      if (!resultado[ruta].trim()) throw new Error(`${ruta} está vacío.`);
    }
    return resultado;
  } finally {
    next?.detener();
    if (next && next.proceso.exitCode === null && next.proceso.signalCode === null) {
      await once(next.proceso, 'exit');
    }
    await supabase.cerrar();
  }
}

const destino = process.argv[2];
if (!destino) throw new Error('Indicar directorio de salida.');
const primera = await muestra();
const segunda = await muestra();
for (const ruta of Object.keys(primera)) {
  if (primera[ruta] !== segunda[ruta]) throw new Error(`${ruta} cambió entre procesos; no se escribió ninguna referencia.`);
}
await mkdir(destino, { recursive: true });
for (const ruta of Object.keys(primera)) await writeFile(join(destino, ruta), primera[ruta], { flag: 'wx' });
console.log(`Referencias estables escritas en ${destino}`);
