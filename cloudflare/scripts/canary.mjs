import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ejecutarArchivo = promisify(execFile);
const raiz = fileURLToPath(new URL('../', import.meta.url));
const repo = fileURLToPath(new URL('../../', import.meta.url));
const CONFIG = join(raiz, 'produccion', 'wrangler.json');
const WORKER = 'cau-produccion-20261026';
const VERSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validarEstado(deployment) {
  const versiones = deployment?.versions;
  if (!Array.isArray(versiones) || versiones.length < 1
    || versiones.some(version => !VERSION_ID.test(version?.version_id ?? '')
      || !Number.isFinite(version.percentage) || version.percentage < 0 || version.percentage > 100)
    || versiones.filter(version => version.percentage === 100).length !== 1
    || versiones.some(version => version.percentage !== 0 && version.percentage !== 100)) {
    throw new Error('El deployment actual no es una única versión estable al 100%; canary detenido.');
  }
  return versiones.find(version => version.percentage === 100).version_id;
}

function confirmarDistribucion(deployment, versionEsperada) {
  const versiones = deployment?.versions;
  if (!Array.isArray(versiones) || versiones.filter(version =>
    version.version_id === versionEsperada && version.percentage === 100).length !== 1
    || versiones.some(version => version.version_id !== versionEsperada && version.percentage !== 0)
    || versiones.reduce((total, version) => total + version.percentage, 0) !== 100) {
    throw new Error(`El estado no confirma ${versionEsperada} al 100%.`);
  }
}

export function versionIdDeUpload(salida) {
  const id = /Worker Version ID:\s*([0-9a-f-]{36})/i.exec(salida)?.[1];
  if (!id || !VERSION_ID.test(id)) throw new Error('Wrangler no devolvió un Worker Version ID válido.');
  return id;
}

export function argsDistribucion(versionNueva, versionEstable, porcentajeNueva) {
  if (!VERSION_ID.test(versionNueva) || !VERSION_ID.test(versionEstable)
    || versionNueva === versionEstable || ![0, 5, 100].includes(porcentajeNueva)) {
    throw new TypeError('Distribución canary inválida.');
  }
  return [
    'versions', 'deploy',
    `${versionNueva}@${porcentajeNueva}`,
    `${versionEstable}@${100 - porcentajeNueva}`,
    '--yes', '--name', WORKER, '--config', 'produccion/wrangler.json',
  ];
}

function salidaComando(resultado) {
  return `${resultado.stdout ?? ''}\n${resultado.stderr ?? ''}`;
}

export async function ejecutarCanary({
  sha,
  riesgo,
  tokenCloudflare,
  tokenR2,
  credencialDisponible = Boolean(tokenCloudflare),
  comando = ejecutarArchivo,
  registrar = () => {},
}) {
  if (!/^[a-f0-9]{40,64}$/i.test(sha ?? '')) throw new Error('SHA del candidato inválido.');
  if (!credencialDisponible) throw new Error('No hay credencial de Cloudflare para publicar.');
  if (!tokenR2) throw new Error('Falta CLOUDFLARE_R2_API_TOKEN; el canary no se inicia.');

  const envWrangler = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    CI: 'true',
    WRANGLER_SEND_METRICS: 'false',
    ...(tokenCloudflare ? { CLOUDFLARE_API_TOKEN: tokenCloudflare } : {}),
  };
  const envR2 = {
    ...envWrangler,
    CLOUDFLARE_API_TOKEN: tokenR2,
    CLOUDFLARE_R2_API_TOKEN: tokenR2,
  };
  const correr = async (etapa, binario, argumentos, opciones = {}) => {
    registrar({ etapa, estado: 'iniciado' });
    try {
      const salida = await comando(binario, argumentos, {
        cwd: opciones.cwd ?? raiz,
        env: opciones.env ?? envWrangler,
        timeout: opciones.timeout ?? 300_000,
        maxBuffer: 4 * 1024 * 1024,
      });
      registrar({ etapa, estado: 'ok' });
      return salida;
    } catch (error) {
      registrar({ etapa, estado: 'falló' });
      const mensaje = String(error.stderr || error.message || 'error de proceso')
        .replaceAll(tokenCloudflare, '[REDACTADO]')
        .replaceAll(tokenR2, '[REDACTADO]')
        .slice(0, 1200);
      throw new Error(`${etapa}: ${mensaje}`);
    }
  };
  const wrangler = ['node_modules/wrangler/bin/wrangler.js'];
  const estadoActual = await correr(
    'leer-deployment-actual', process.execPath,
    [...wrangler, 'deployments', 'status', '--json', '--name', WORKER, '--config', 'produccion/wrangler.json'],
  );
  const versionEstable = validarEstado(JSON.parse(estadoActual.stdout));

  const subida = await correr(
    'subir-candidata', process.execPath,
    [...wrangler, 'versions', 'upload', '--name', WORKER, '--config', 'produccion/wrangler.json',
      '--message', `sha=${sha} riesgo=${riesgo}`],
  );
  const versionNueva = versionIdDeUpload(salidaComando(subida));
  registrar({ etapa: 'identificar-version', estado: 'ok', version: versionNueva });

  // El ID lo asigna Cloudflare al upload. Los assets quedan en R2 antes de que
  // la versión entre en un deployment y pueda recibir tráfico o un override.
  //
  // Esta etapa tiene su propio tope, más alto que el de las demás: sube un
  // objeto por proceso de wrangler (6 a la vez) y el build trae más de 800
  // objetos, así que sólo el arranque de wrangler —cerca de 2s cada uno— ya
  // consume los 300s del valor por defecto. Con ese tope el deploy moría a los
  // 300s exactos y la candidata quedaba subida sin tráfico. El número alcanza
  // con margen para el catálogo actual; si el sync se acerca otra vez, lo que
  // corresponde es dejar de resubir los objetos que ya están en el bucket.
  await correr(
    'sincronizar-assets-r2', process.execPath,
    [join(raiz, 'scripts/sincronizar-assets-r2.mjs'),
      `--version=${versionNueva}`, '--confirmar-escritura'],
    { env: envR2, timeout: 900_000 },
  );

  let deploymentIntentado = false;
  try {
    deploymentIntentado = true;
    for (const [porcentaje, etapa] of [[0, 'canary-cero'], [5, 'canary-cinco'], [100, 'promocion']]) {
      await correr(
        etapa, process.execPath,
        [...wrangler, ...argsDistribucion(versionNueva, versionEstable, porcentaje)],
      );
      registrar({ etapa, estado: 'trafico', version: versionNueva, porcentaje });
      if (porcentaje !== 100) {
        await correr(
          `smoke-${porcentaje}`, process.execPath,
          [join(repo, 'herramientas/smoke.mjs'), '--rapido', `--version-worker=${versionNueva}`],
          { cwd: repo, timeout: 180_000 },
        );
      }
    }
    const verificacion = await correr(
      'verificar-promocion', process.execPath,
      [...wrangler, 'deployments', 'status', '--json', '--name', WORKER, '--config', 'produccion/wrangler.json'],
    );
    const final = JSON.parse(verificacion.stdout);
    confirmarDistribucion(final, versionNueva);
    registrar({ etapa: 'resultado', estado: 'promovida', sha, riesgo, version: versionNueva, porcentaje: 100 });
    return { sha, riesgo, versionEstable, versionNueva, porcentaje: 100, resultado: 'promovida' };
  } catch (error) {
    if (deploymentIntentado) {
      try {
        await correr(
          'rollback-worker', process.execPath,
          [...wrangler, ...argsDistribucion(versionNueva, versionEstable, 0)],
        );
        const salidaRollback = await correr(
          'verificar-rollback', process.execPath,
          [...wrangler, 'deployments', 'status', '--json', '--name', WORKER, '--config', 'produccion/wrangler.json'],
        );
        const estadoRollback = JSON.parse(salidaRollback.stdout);
        confirmarDistribucion(estadoRollback, versionEstable);
        registrar({ etapa: 'resultado', estado: 'rollback', sha, riesgo, version: versionNueva, versionEstable, porcentaje: 0 });
      } catch (rollbackError) {
        registrar({ etapa: 'resultado', estado: 'rollback-fallido', sha, riesgo, version: versionNueva, versionEstable });
        throw new Error(`${error.message} Además, falló el rollback: ${rollbackError.message}`);
      }
    }
    throw error;
  }
}
