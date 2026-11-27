import { mkdir, readFile, readlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ejecutarCarga } from './hubspot.mjs';
import { crearAdaptador, exigirSesion } from './adaptador-playwright.mjs';
import { validarLead, nivelDe, normalizarTelefono, evento, esVer, pidDeSingleton } from './dominio.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PERFIL = path.join(AQUI, '..', 'perfil-hubspot');
const INICIO = 'https://app.hubspot.com/contacts/44080364/objects/0-1/views/my/list';
const RUTAS_BRAVE = [
  '/usr/bin/brave-browser', '/usr/bin/brave-browser-stable',
  '/opt/brave.com/brave/brave', '/snap/bin/brave',
];

async function leerEntrada() {
  let texto = '';
  for await (const trozo of process.stdin) texto += trozo;
  return JSON.parse(texto);
}

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

const CARPETA_CAPTURAS = '/tmp/opencode/carga-leads-pasos';

async function main() {
  let etapa = 'validar';
  let paginaActual = null;
  let numeroCaptura = 0;
  let capturasPendientes = Promise.resolve();
  const capturas = process.argv.includes('--capturas');
  if (capturas) await mkdir(CARPETA_CAPTURAS, { recursive: true });
  const informar = (tipo, datos = {}) => {
    if (tipo === 'paso' && datos.texto) etapa = datos.texto;
    console.log(evento(tipo, datos));
    if (capturas && tipo === 'paso' && paginaActual && !paginaActual.isClosed()) {
      numeroCaptura += 1;
      const limpio = String(datos.texto ?? '').replace(/[^\p{L}\p{N} -]/gu, '').slice(0, 40);
      const archivo = path.join(CARPETA_CAPTURAS, `${String(numeroCaptura).padStart(2, '0')}-${limpio}.png`);
      capturasPendientes = capturasPendientes.then(async () => {
        await paginaActual.waitForTimeout(1200).catch(() => {});
        await paginaActual.screenshot({ path: archivo, timeout: 15000 }).catch(() => {});
      });
    }
  };

  try {
    const secar = process.argv.includes('--secar');
    const noCrear = process.argv.includes('--no-crear');
    const soloContacto = process.argv.includes('--solo-contacto');
    const soloNegocio = process.argv.includes('--solo-negocio');
    const ver = esVer();
    const datos = await leerEntrada();
    const error = validarLead(datos);
    if (error) throw Object.assign(new Error(error), { etapa });

    const carreras = JSON.parse(await readFile(path.join(AQUI, '..', 'carreras.json'), 'utf8'));
    const nivel = nivelDe(carreras, datos.carrera);
    if (!nivel) throw Object.assign(new Error('La carrera no está en la lista.'), { etapa });

    const { chromium } = await import('playwright');
    const brave = process.env.BRAVE_EJECUTABLE || RUTAS_BRAVE.find(existsSync);
    if (!brave) throw Object.assign(new Error('No se encontró Brave instalado.'), { etapa: 'abrir_navegador' });

    if (await perfilOcupado()) {
      throw Object.assign(
        new Error('Cerrá la ventana de HubSpot antes de cargar el lead.'),
        { etapa: 'sesion' },
      );
    }

    informar('paso', { texto: ver ? 'Abriendo Brave en pantalla' : 'Abriendo HubSpot' });
    const contexto = await chromium.launchPersistentContext(PERFIL, {
      executablePath: brave,
      headless: !ver,
      viewport: { width: 1920, height: 1080 },
      locale: 'es-AR',
      timezoneId: 'America/Argentina/Buenos_Aires',
      timeout: 15000,
    });
    contexto.setDefaultTimeout(12000);
    try {
      const pagina = contexto.pages()[0] ?? await contexto.newPage();
      paginaActual = pagina;
      await pagina.goto(INICIO, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await pagina.waitForTimeout(4000);
      exigirSesion(pagina);
      const resultado = await ejecutarCarga(
        crearAdaptador(pagina, { emitir: informar }),
        { ...datos, telefono: normalizarTelefono(datos.telefono), nivel },
        { secar, noCrear, soloContacto, soloNegocio, emitir: informar },
      );
      informar('ok', resultado);
    } finally {
      await capturasPendientes;
      await contexto.close();
    }
  } catch (error) {
    error.etapa ??= etapa;
    throw error;
  }
}

main().catch(error => {
  console.log(evento('error', { etapa: error.etapa ?? 'general', mensaje: error.message }));
  process.exitCode = 1;
});
