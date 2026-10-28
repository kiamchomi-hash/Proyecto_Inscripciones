// Genera la referencia de la home desde Next con el fixture aislado de paridad.
// Dos procesos independientes deben dar la misma proyección antes de escribir.
import { writeFile } from 'node:fs/promises';
import { arrancarNext, esperarHttp, nextEnEjecucion, puertoLibre, stubSupabase } from './servidores.mjs';
import { canonical, enlacesDe, idioma, jsonLd, metas, textoPrincipal, titulo } from './html.mjs';

async function muestra() {
  if (nextEnEjecucion()) throw new Error('Ya hay un Next en ejecución; no se puede compartir el directorio .next.');
  const supabase = await stubSupabase();
  let next;
  try {
    const puerto = await puertoLibre();
    next = arrancarNext({ puerto, supabase });
    const respuesta = await esperarHttp(`http://127.0.0.1:${puerto}/`, 240_000);
    if (respuesta.status !== 200) throw new Error(`La home respondió ${respuesta.status}.`);
    const html = await respuesta.text();
    const texto = textoPrincipal(html);
    if (texto.length < 150) throw new Error('La home no contiene suficiente texto para ser referencia.');
    return {
      idioma: idioma(html), titulo: titulo(html), canonical: canonical(html),
      metas: metas(html), jsonLd: jsonLd(html), texto,
      enlaces: enlacesDe(html, { apertura: /<main\b/, cierre: '</main>' }).sort(),
      navegacion: enlacesDe(html, { apertura: /<nav\b[^>]*class="main-navbar"/, cierre: '</nav>' }).sort(),
      pie: enlacesDe(html, { apertura: /<footer\b/, cierre: '</footer>' }).sort(),
    };
  } finally {
    next?.detener();
    await supabase.cerrar();
  }
}

const destino = process.argv[2];
if (!destino) throw new Error('Indicar ruta de salida: node tests/helpers/referencia-home.mjs <archivo.json>');
const primera = JSON.stringify(await muestra());
const segunda = JSON.stringify(await muestra());
if (primera !== segunda) throw new Error('La home no fue estable entre dos procesos Next independientes; no se escribió la referencia.');
await writeFile(destino, `${JSON.stringify(JSON.parse(primera), null, 2)}\n`, { flag: 'wx' });
console.log(`Referencia estable escrita en ${destino}`);
