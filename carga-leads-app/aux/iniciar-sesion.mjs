import { existsSync } from 'node:fs';
import { readlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pidDeSingleton } from './dominio.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PERFIL = path.join(AQUI, '..', 'perfil-hubspot');
const LOGIN = 'https://app.hubspot.com/contacts/44080364/objects/0-1/views/my/list';
const RUTAS_BRAVE = [
  '/usr/bin/brave-browser', '/usr/bin/brave-browser-stable',
  '/opt/brave.com/brave/brave', '/snap/bin/brave',
];

async function perfilOcupado() {
  try {
    const destino = await readlink(path.join(PERFIL, 'SingletonLock'));
    const pid = pidDeSingleton(destino);
    if (!pid) return false;
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

if (await perfilOcupado()) {
  console.error('Ya hay una ventana de HubSpot abierta con este perfil. Cerrála y volvé a intentar.');
  process.exit(1);
}

const brave = process.env.BRAVE_EJECUTABLE || RUTAS_BRAVE.find(existsSync);
if (!brave) {
  console.error('No se encontró Brave instalado.');
  process.exit(1);
}

// Brave se abre como una ventana normal, sin Playwright: no cierra pestañas,
// no detecta el login y no tiene límite de tiempo. Termina cuando la cerrás.
// Las dos primeras banderas mantienen el mismo almacén de cookies que usa
// cargar.mjs con Playwright; sin ellas Brave no puede leer la sesión guardada.
const hijo = spawn(brave, [
  '--password-store=basic',
  '--use-mock-keychain',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${PERFIL}`,
  '--new-window',
  LOGIN,
], { stdio: 'ignore' });

hijo.on('error', error => {
  console.error(`No se pudo abrir Brave: ${error.message}`);
  process.exit(1);
});

hijo.on('exit', () => process.exit(0));
