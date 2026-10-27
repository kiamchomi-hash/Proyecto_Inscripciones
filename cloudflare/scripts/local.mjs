import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));

/** Ningún token, variable pública ni opción de Node del padre pasa a herramientas. */
export function entornoLocal(origen, root) {
  const env = {};
  for (const key of ['PATH', 'LANG', 'LC_ALL', 'TZ', 'SYSTEMROOT', 'WINDIR']) {
    if (origen[key] !== undefined) env[key] = origen[key];
  }
  return {
    ...env,
    HOME: join(root, '.local', 'home'),
    XDG_CONFIG_HOME: join(root, '.local', 'config'),
    XDG_CACHE_HOME: join(root, '.local', 'cache'),
    CI: '1',
    ASTRO_TELEMETRY_DISABLED: '1',
    WRANGLER_SEND_METRICS: 'false',
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false',
    CLOUDFLARE_INCLUDE_PROCESS_ENV: 'false',
  };
}

export function verificarArchivosLocales(root) {
  for(const directorio of [root,join(root,'staging')]) {
    if(existsSync(directorio) && readdirSync(directorio).some(name => /^\.(?:env|dev\.vars)(?:\.|$)/.test(name))) {
      throw new Error('Este incremento no admite archivos de entorno dentro de cloudflare/.');
    }
  }
}

/** No hay passthrough a Wrangler ni shell: sólo tareas locales conocidas. */
export function comandoLocal(nombre) {
  const comandos = {
    tipos: ['node_modules/wrangler/bin/wrangler.js', 'types', 'worker-configuration.d.ts'],
    // Sólo estado local: aplica las migraciones al D1 de `.wrangler/state` para
    // que `dev` y `preview` tengan tablas. Nunca `--remote`.
    migrar: ['node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB', '--local'],
    diagnostico: ['node_modules/astro/bin/astro.mjs', 'check'],
    build: ['node_modules/astro/bin/astro.mjs', 'build'],
    dev: ['node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', '4329'],
    preview: ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', '4329'],
    seguridad: ['--test', 'tests/seguridad.test.mjs'],
    runtime: ['--test', 'tests/runtime.test.mjs'],
    // Sitemap, robots, redirects y cabeceras sobre el build compilado. Las
    // funciones puras se prueban antes; la integración usa workerd y D1 vacío
    // y sembrado. Requiere build previo, igual que runtime y paridad.
    // `cache-produccion` cuida la caché de borde del entry de producción, que
    // no se puede importar desde node.
    entrega: ['--test', 'tests/entrega.test.mjs', 'tests/cache-produccion.test.mjs'],
    datos: ['--test', '--test-concurrency=1', 'tests/datos.test.mjs', 'tests/concurrencia.test.mjs'],
    control: ['--test', '--test-concurrency=1', 'tests/rate-limit.test.mjs', 'tests/contadores.test.mjs', 'tests/migraciones.test.mjs'],
    inscripcion: ['--test', '--test-concurrency=1', 'tests/enlaces.test.mjs', 'tests/robot.test.mjs', 'tests/upgrade-enlaces-robot.test.mjs'],
    api: ['--test', '--test-concurrency=1', 'tests/formularios.test.mjs', 'tests/operativa.test.mjs',
      'tests/upgrade-outbox.test.mjs', 'tests/upgrade-tablas.test.mjs', 'tests/apoyo-faq-baja.test.mjs'],
    // Crons de newsletter y recordatorio, y la vigilancia con transporte doble:
    // no se envía nada ni se audita producción.
    crons: ['--test', '--test-concurrency=1', 'tests/newsletter.test.mjs', 'tests/vigilancia.test.mjs'],
    // Telemetría agregada, alertas, revalidación y registrador local de analítica.
    telemetria: ['--test', '--test-concurrency=1', 'tests/telemetria.test.mjs', 'tests/analitica.test.mjs'],
    identidad: ['--test', 'tests/pase.test.mjs', 'tests/turnstile.test.mjs'],
    // Widget de Turnstile con dobles del documento y del entorno público:
    // ni red ni DOM real.
    navegador: ['--test', 'tests/turnstile-navegador.test.mjs'],
    // Los transportes reales corren con `fetch` inyectado: ni red ni envíos.
    envios: ['--test', '--test-concurrency=1', 'tests/envios.test.mjs', 'tests/programados.test.mjs'],
    recuperacion: ['--test', '--test-concurrency=1', 'tests/recuperacion.test.mjs'],
    // El validador compartido usa parameter properties: Node necesita transformar
    // ese TypeScript, no sólo borrar tipos. Astro ya lo compila en el build.
    materias: ['--experimental-transform-types', '--test', '--test-concurrency=1', 'tests/materias.test.mjs', 'tests/upgrade-materias.test.mjs'],
    // Paridad de las páginas migradas: necesita el build de Astro y el Next de
    // la raíz. Levanta Next dev en loopback con un stub de PostgREST; nada sale
    // de 127.0.0.1. El contrato de `/api/carreras-detalle` también corre acá
    // porque usa el mismo build y un D1 efímero.
    paridad: ['--test', '--test-concurrency=1', 'tests/carreras-detalle.test.mjs', 'tests/fijas.test.mjs', 'tests/paginas-carreras.test.mjs', 'tests/novedades.test.mjs', 'tests/paridad.test.mjs'],
    // E2E real con el Playwright de la raíz: servidores en loopback, capturas y
    // Turnstile interceptado. Requiere build previo y Chromium instalado.
    e2e: ['--test', '--test-concurrency=1', 'tests/e2e.test.mjs'],
    // La fase remota sólo admite GET públicos y lee exclusivamente las
    // variables públicas declaradas. Nunca pasa secretos al entorno del hijo.
    'exportar-publico': ['--experimental-transform-types', 'scripts/exportar-datos.mjs'],
    'verificar-publico': ['--experimental-transform-types', 'scripts/verificar-datos.mjs'],
    importacion: ['--experimental-transform-types', '--test', '--test-concurrency=1', 'tests/importacion.test.mjs'],
    preparacion: ['--experimental-transform-types', '--test', '--test-concurrency=1', 'tests/preparacion.test.mjs'],
    // Contrato del publicador y de produccion/wrangler.json: sin red y sin credenciales.
    publicacion: ['--test', 'tests/publicacion.test.mjs'],
    'preparar-staging': ['scripts/preparar-staging.mjs'],
    'importar-dry-run': ['--experimental-transform-types', 'scripts/importar-datos.mjs', '--dry-run'],
    'staging-local': ['--experimental-transform-types', '--test', '--test-concurrency=1', 'tests/staging-local.test.mjs'],
    'staging-protegido': ['--experimental-transform-types', '--test', '--test-concurrency=1', 'tests/staging-correo.test.mjs', 'tests/staging-formulario.test.mjs', 'tests/staging-telegram.test.mjs', 'tests/produccion-operativa.test.mjs', 'tests/staging-protegido.test.mjs'],
    'imagenes-externas': ['--experimental-transform-types', 'scripts/verificar-imagenes-externas.mjs'],
  };
  if (!Object.hasOwn(comandos, nombre)) throw new Error('Comando local desconocido.');
  return comandos[nombre];
}

export function ejecutar(nombre) {
  verificarArchivosLocales(raiz);
  const env = entornoLocal(process.env, raiz);
  mkdirSync(env.HOME, { recursive: true });
  const pasos = nombre === 'check'
    ? ['seguridad', 'preparacion', 'publicacion', 'tipos', 'diagnostico', 'datos', 'control', 'inscripcion', 'api', 'crons', 'telemetria', 'envios', 'recuperacion', 'identidad', 'materias', 'importacion', 'navegador', 'build', 'staging-local', 'staging-protegido', 'runtime', 'entrega', 'paridad', 'e2e']
    : [nombre];
  for (const paso of pasos) {
    const resultado = spawnSync(process.execPath, comandoLocal(paso), {
      cwd: raiz, env, stdio: 'inherit',
    });
    if (resultado.error) throw resultado.error;
    if (resultado.status !== 0) return resultado.status ?? 1;
  }
  return 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (process.argv.length !== 3) throw new Error('Se requiere exactamente un comando local.');
  process.exitCode = ejecutar(process.argv[2]);
}
