import { existsSync } from 'node:fs';
import { readlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pidDeSingleton } from './dominio.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PERFIL = path.join(AQUI, '..', 'perfil-hubspot');
const INICIO = 'https://app.hubspot.com/contacts/44080364/objects/0-1/views/my/list';
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
  console.log(JSON.stringify({ ocupado: true }));
  process.exit(0);
}

const brave = process.env.BRAVE_EJECUTABLE || RUTAS_BRAVE.find(existsSync);
if (!brave) {
  console.log(JSON.stringify({ iniciada: false }));
  process.exit(0);
}

let contexto;
try {
  const { chromium } = await import('playwright');
  contexto = await chromium.launchPersistentContext(PERFIL, {
    executablePath: brave,
    headless: true,
    viewport: { width: 1280, height: 800 },
    locale: 'es-AR',
    timeout: 15000,
  });
  const pagina = contexto.pages()[0] ?? await contexto.newPage();
  await pagina.goto(INICIO, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await pagina.waitForTimeout(4000);
  const url = new URL(pagina.url());
  const iniciada = url.origin === 'https://app.hubspot.com'
    && url.pathname.includes('/44080364/')
    && !/\/login(?:\/|$)|confirm-to-login/.test(url.pathname);
  console.log(JSON.stringify({ iniciada }));
} catch {
  console.log(JSON.stringify({ iniciada: false }));
} finally {
  await contexto?.close().catch(() => {});
}
