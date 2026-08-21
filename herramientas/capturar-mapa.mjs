/**
 * Captura el mapa de Google de la sede como PNG, para usarlo de fondo en el
 * video institucional (Remotion).
 *
 * Por qué una captura y no el iframe: Remotion renderiza cuadro por cuadro y
 * no espera a que un iframe de terceros termine de cargar sus tiles, así que
 * el render sale con el mapa a medio pintar o vacío. Con la imagen ya
 * descargada el resultado es determinista.
 *
 * Uso:  node herramientas/capturar-mapa.mjs [--alcance=9000] [--salida=ruta.png]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { GEO } from '../lib/sede.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const salida = resolve(
  args.salida ?? 'C:/Users/matia/Desktop/remotion-cau-villa-lugano/public/images/mapa-lugano.png'
);

import { MAPS_EMBED_SRC } from '../lib/sede.ts';

/* Usamos el mismo embed que muestra el sitio, no la vista normal de Maps: la
   vista normal trae buscador, chips, panel lateral y botonera, y esconderlos
   por CSS es una carrera contra los nombres de clase ofuscados de Google. El
   embed viene con el mapa y poco más.

   El parámetro `!1d<n>` del blob `pb` es el alcance: cuanto más grande, más
   barrio entra. El del sitio está en ~287 (la puerta); para el video hace
   falta ver las avenidas alrededor. */
const alcance = Number(args.alcance ?? 9000);
const url = MAPS_EMBED_SRC.replace(/!1d[0-9.]+/, `!1d${alcance}`);

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
});

/* El embed responde "must be used in an iframe" si se lo abre como página:
   Google chequea que esté anidado. Así que se le arma una página local con el
   iframe a pantalla completa, que es exactamente el contexto que espera. */
await pagina.setContent(
  `<style>html,body{margin:0;height:100%;overflow:hidden}iframe{border:0;width:100vw;height:100vh;display:block}</style>
   <iframe src="${url}" loading="eager" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
  { waitUntil: 'load', timeout: 60000 }
);

// Los tiles entran de a poco y no hay evento que avise. Esperar a que la red
// se aquiete es lo más cerca que se puede estar de "ya está dibujado".
await pagina.waitForTimeout(9000);

// Lo poco de interfaz que trae el embed: el pie de atribución y el botón de
// pantalla completa. La atribución del mapa se repone en el video.
// La interfaz que trae el embed vive DENTRO del iframe, así que el estilo hay
// que inyectarlo en el frame, no en la página que lo contiene.
const marco = pagina.frames().find((f) => f.url().includes('google.com/maps'));
if (marco) {
  await marco.addStyleTag({
    content: `
      .gm-style-cc, .gmnoprint, .gm-fullscreen-control,
      a[href*="maps.google.com"], .gm-style-moc,
      /* La ficha del lugar que Google pega arriba a la izquierda. */
      .place-card, .place-card-large, .gm-style-iw, .gm-style-iw-a,
      .gm-iv-address, .gm-iv-marker { display: none !important; }
    `,
  }).catch(() => {});
}
await pagina.waitForTimeout(1200);

mkdirSync(dirname(salida), { recursive: true });
await pagina.screenshot({ path: salida });
await navegador.close();

console.log(`mapa capturado en ${salida} (alcance ${alcance})`);
