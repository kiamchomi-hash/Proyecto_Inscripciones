// Captura únicamente contenido sintético del Next local, sin datos reales.
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { arrancarNext, esperarHttp, nextEnEjecucion, puertoLibre, stubSupabase } from './servidores.mjs';
import { proyectarPagina, RUTAS_REFERENCIA } from './referencias-rutas.mjs';

async function muestra() {
  if (nextEnEjecucion()) throw new Error('Otro Next está usando .next.');
  const supabase = await stubSupabase();
  let next;
  try {
    const puerto = await puertoLibre();
    next = arrancarNext({ puerto, supabase });
    const base = `http://127.0.0.1:${puerto}`;
    await esperarHttp(`${base}/`, 240_000);
    const resultado = {};
    for (const especificacion of RUTAS_REFERENCIA) {
      const respuesta = await fetch(`${base}${especificacion.ruta}`, { redirect: 'manual' });
      if (respuesta.status !== 200) throw new Error(`${especificacion.ruta}: HTTP ${respuesta.status}`);
      const proyeccion = proyectarPagina(await respuesta.text(), especificacion);
      if (proyeccion.texto.length < 50) throw new Error(`${especificacion.ruta}: texto insuficiente`);
      resultado[especificacion.ruta] = proyeccion;
    }
    return resultado;
  } finally {
    next?.detener();
    if (next && next.proceso.exitCode === null && next.proceso.signalCode === null) await once(next.proceso, 'exit');
    await supabase.cerrar();
  }
}

const destino = process.argv[2];
if (!destino) throw new Error('Indicar un archivo de destino nuevo.');
const primera = await muestra();
const segunda = await muestra();
for (const { ruta } of RUTAS_REFERENCIA) {
  if (JSON.stringify(primera[ruta]) !== JSON.stringify(segunda[ruta])) throw new Error(`${ruta}: referencias inestables; no se escribió el archivo.`);
}
await writeFile(destino, `${JSON.stringify(primera, null, 2)}\n`, { flag: 'wx' });
console.log(`${RUTAS_REFERENCIA.length} referencias estables: ${destino}`);
