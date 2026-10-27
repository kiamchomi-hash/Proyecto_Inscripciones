import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { setTimeout as esperar } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { filasPostgrest } from '../fixtures/catalogo-home.mjs';

// Servidores locales compartidos por las pruebas de paridad y de navegador:
// Next del sitio vigente en `next dev` (loopback) y utilidades de puerto y
// espera. Nada de acá abre la red externa.

export const RAIZ = fileURLToPath(new URL('../../../', import.meta.url));
export const NEXT = `${RAIZ}node_modules/next/dist/bin/next`;
const LOCK = `${RAIZ}.next/dev/lock`;

/**
 * Next deja el proceso en `.next/dev/lock`. Un lock viejo (PID muerto) no debe
 * bloquear la prueba; uno vivo sí, porque los dos procesos pelearían por `.next`.
 *
 * Un PID recién terminado sigue existiendo como zombie unos instantes y
 * `process.kill(pid, 0)` lo da por vivo: los dos tests de paridad corren seguidos
 * y el segundo veía el proceso que el primero acababa de matar. Por eso, cuando
 * `/proc` está disponible, se confirma que ese PID es realmente un `next`.
 */
export function nextEnEjecucion() {
  try {
    const { pid } = JSON.parse(readFileSync(LOCK, 'utf8'));
    if (!Number.isInteger(pid)) return null;
    process.kill(pid, 0);
    let cmdline;
    try {
      cmdline = readFileSync(`/proc/${pid}/cmdline`, 'utf8');
    } catch {
      // Sin `/proc` no se puede confirmar el comando: se conserva el criterio
      // conservador (un PID vivo bloquea).
      return pid;
    }
    return cmdline.includes('next') ? pid : null;
  } catch {
    return null;
  }
}

export async function puertoLibre() {
  const servidor = createServer();
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const { port } = servidor.address();
  servidor.close();
  await once(servidor, 'close');
  return port;
}

/** Espera a que una URL responda (cualquier estado) o falla con el último error. */
export async function esperarHttp(url, limiteMs) {
  const hasta = Date.now() + limiteMs;
  let ultimoError;
  while (Date.now() < hasta) {
    try {
      const respuesta = await fetch(url);
      if (respuesta.status > 0) return respuesta;
    } catch (error) {
      ultimoError = error;
    }
    await esperar(500);
  }
  throw new Error(`No respondió ${url}: ${ultimoError?.message ?? 'sin detalle'}`);
}

/** Stub de PostgREST: aplica los filtros que usa la home, no la consulta entera. */
export async function stubSupabase() {
  const pedidos = [];
  const servidor = createServer((pedido, respuesta) => {
    pedidos.push(`${pedido.method} ${pedido.url}`);
    const url = new URL(pedido.url, 'http://127.0.0.1');
    const tablas = { carreras: filasPostgrest(), materias: MATERIAS, faq_preguntas: FAQS,
      consultas: CONSULTAS, precios_privados: PRECIOS, novedades: NOVEDADES };
    const tabla = url.pathname.replace('/rest/v1/', '');
    if (!['GET', 'HEAD'].includes(pedido.method) || !Object.hasOwn(tablas, tabla)) {
      respuesta.writeHead(404, { 'Content-Type': 'application/json' });
      respuesta.end(JSON.stringify({ message: 'Ruta no simulada' }));
      return;
    }
    let filas = tablas[tabla];
    for (const [clave, valor] of url.searchParams) {
      // Mismo subconjunto que usan las páginas: igualdad, desigualdad y lista
      // `in.(…)` sobre columnas simples, y orden ascendente por `orden`.
      if (['select', 'order', 'limit', 'offset'].includes(clave)) continue;
      if (valor === 'not.is.null') {
        filas = filas.filter(fila => fila[clave] !== null && fila[clave] !== undefined);
      } else if (valor === 'is.null') {
        filas = filas.filter(fila => fila[clave] === null || fila[clave] === undefined);
      } else if (valor.startsWith('neq.')) {
        filas = filas.filter(fila => String(fila[clave]) !== valor.slice(4));
      } else if (valor.startsWith('eq.')) {
        filas = filas.filter(fila => String(fila[clave]) === valor.slice(3));
      } else if (valor.startsWith('in.')) {
        // PostgREST manda `in.("uno","dos")`; los valores van entrecomillados
        // porque pueden tener espacios y guiones.
        const lista = valor.slice(3).replace(/^\(|\)$/g, '')
          .split(',').map(texto => texto.trim().replace(/^"|"$/g, ''));
        filas = filas.filter(fila => lista.includes(String(fila[clave])));
      } else {
        respuesta.writeHead(400, { 'Content-Type': 'application/json' });
        respuesta.end(JSON.stringify({ message: `Filtro no simulado: ${clave}=${valor}` }));
        return;
      }
    }
    const orden = url.searchParams.get('order');
    if (orden === 'orden.asc') {
      // Postgres pone los nulos al final en un ASC y desempata por orden de fila.
      filas = [...filas].sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity) || a.id - b.id);
    } else if (orden === 'orden.asc.nullslast,created_at.desc') {
      filas = [...filas].sort((a,b) => (a.orden ?? Infinity) - (b.orden ?? Infinity) || b.created_at.localeCompare(a.created_at));
    } else if (orden === 'fecha.desc') {
      filas = [...filas].sort((a,b) => b.fecha.localeCompare(a.fecha));
    } else if (orden) {
      respuesta.writeHead(400, { 'Content-Type': 'application/json' });
      respuesta.end(JSON.stringify({ message: `Orden no simulado: ${orden}` }));
      return;
    }
    const total = filas.length;
    const offset = Number(url.searchParams.get('offset') ?? 0);
    filas = filas.slice(offset);
    if (url.searchParams.has('limit')) filas = filas.slice(0, Number(url.searchParams.get('limit')));
    const columnas = url.searchParams.get('select')?.split(',').map(c => c.trim());
    if (columnas && !columnas.includes('*')) filas = filas.map(f => Object.fromEntries(columnas.map(c => [c, f[c]])));
    const singular = pedido.headers.accept?.includes('application/vnd.pgrst.object+json');
    respuesta.writeHead(200, { 'Content-Type': 'application/json',
      ...(pedido.headers.prefer?.includes('count=exact') ? { 'Content-Range': `${offset}-${offset+filas.length-1}/${total}` } : {}) });
    respuesta.end(pedido.method === 'HEAD' ? undefined : JSON.stringify(singular ? filas[0] ?? null : filas));
  });
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const { port } = servidor.address();
  return {
    url: `http://127.0.0.1:${port}`,
    pedidos,
    cerrar: () => new Promise(resolver => servidor.close(resolver)),
  };
}

function entornoNext(extra = {}) {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    LANG: process.env.LANG,
    TZ: process.env.TZ,
    NEXT_TELEMETRY_DISABLED: '1',
    ...extra,
  };
}

export function arrancarNext({ puerto, supabase, extraEnv = {} }) {
  const hijo = spawn(process.execPath, [NEXT, 'dev', '--hostname', '127.0.0.1', '--port', String(puerto)], {
    cwd: RAIZ,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: entornoNext({
      // Todo lo que la home consulta apunta al stub local; la site key vacía
      // deja el widget de Turnstile fuera del HTML en las dos puntas, así el
      // texto comparado no depende de un secreto ni de un servicio externo.
      NEXT_PUBLIC_SUPABASE_URL: supabase.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-ficticia-sin-poder',
      SUPABASE_SERVICE_ROLE_KEY: 'service-fixture-sin-poder',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
      NEXT_PUBLIC_GA_ID: '',
      // Next carga dotenv por defecto aun con las variables públicas definidas.
      // El preload lo impide y bloquea conexiones fuera de loopback en sus hijos.
      NODE_OPTIONS: `--require=${fileURLToPath(new URL('./aislar-next.cjs', import.meta.url))}`,
      ...extraEnv,
    }),
  });
  let registro = '';
  hijo.stdout.on('data', dato => { registro += dato; });
  hijo.stderr.on('data', dato => { registro += dato; });
  return {
    proceso: hijo,
    registro: () => registro,
    detener: () => matarGrupo(hijo),
  };
}

/** Mata el grupo entero: `next dev` y `wrangler dev` dejan hijos. */
export function matarGrupo(hijo) {
  if (!hijo?.pid) return;
  try { process.kill(-hijo.pid, 'SIGKILL'); } catch { /* ya terminó */ }
}
import { MATERIAS, FAQS } from '../fixtures/apoyo-faq.mjs';
import { CONSULTAS, PRECIOS } from '../fixtures/inscripciones.mjs';
import { NOVEDADES } from '../fixtures/novedades.mjs';
