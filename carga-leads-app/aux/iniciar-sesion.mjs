import { existsSync } from 'node:fs';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PERFIL = path.join(AQUI, '..', 'perfil-hubspot');
const FLAG = path.join(PERFIL, 'cerrar.flag');
const RUTAS_BRAVE = [
  '/usr/bin/brave-browser', '/usr/bin/brave-browser-stable',
  '/opt/brave.com/brave/brave', '/snap/bin/brave',
];
const LIMITE_MS = 30 * 60 * 1000;
const LOGIN = 'https://app.hubspot.com/contacts/44080364/objects/0-1/views/my/list';

const brave = process.env.BRAVE_EJECUTABLE || RUTAS_BRAVE.find(existsSync);
if (!brave) throw new Error('No se encontró Brave instalado.');

// Brave restaura las pestañas guardadas al abrir el perfil. Sin esto se
// acumulan pestañas about:blank cada vez que se pulsa el botón de sesión.
const preferencias = path.join(PERFIL, 'Default', 'Preferences');
try {
  const datos = JSON.parse(await readFile(preferencias, 'utf8'));
  datos.session = { ...(datos.session ?? {}), restore_on_startup: 5 };
  await writeFile(preferencias, JSON.stringify(datos));
} catch { /* Perfil nuevo: Brave crea las preferencias al abrirse. */ }

const contexto = await chromium.launchPersistentContext(PERFIL, {
  executablePath: brave,
  headless: false,
  viewport: { width: 1280, height: 900 },
  locale: 'es-AR',
});

try {
  const paginas = contexto.pages();
  const pagina = paginas[0] ?? await contexto.newPage();
  for (const extra of paginas.slice(1)) await extra.close().catch(() => {});
  contexto.on('page', otra => { if (otra !== pagina) otra.close().catch(() => {}); });
  await pagina.goto(LOGIN, { waitUntil: 'domcontentloaded' });
  await pagina.bringToFront();
  console.log('Entrá a HubSpot, a Mis contactos. La ventana se cierra cuando pulses «Ya inicié sesión» en la app.');

  const limite = Date.now() + LIMITE_MS;
  while (Date.now() < limite && !pagina.isClosed()) {
    await pagina.waitForTimeout(1000);
    if (existsSync(FLAG)) {
      await rm(FLAG, { force: true }).catch(() => {});
      console.log('Cerrando la ventana a pedido.');
      break;
    }
  }
} finally {
  await contexto.close().catch(() => {});
  await rm(FLAG, { force: true }).catch(() => {});
}
