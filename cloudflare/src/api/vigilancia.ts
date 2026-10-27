import {
  BASE_PROD, CABECERAS_ESPERADAS, HSTS_ESPERADO, NOINDEX, RUTAS, redirectsEsperados,
} from '../../../lib/vigilancia-esperado.ts';
import { preciosVencidos } from '../../../lib/vigilancia-precios.ts';
import type { Buscar } from '../operativa/telegram.ts';
import { rechazoBearer } from './auth.ts';

/**
 * Vigilancia de producción, con el mismo contrato que
 * `app/api/vigilancia/route.ts`: `GET`, `Bearer CRON_SECRET`, 503 sin secreto,
 * 401 con otro valor, `?prueba` que sólo manda un aviso y el resumen
 * `{ ok, fallos, urlsSitemap, segundos, aviso }`.
 *
 * La lista de lo esperado sigue viniendo de `lib/vigilancia-esperado.ts`: no se
 * duplica ni se amplía. El chequeo de precios reutiliza su función pura; las
 * lecturas D1 llegan como puertos para probarlas sin base.
 *
 * Los tests no auditan producción: `buscar` se inyecta y el handler no tiene un
 * `fetch` global de reserva. Además, cualquier URL que no sea del dominio propio
 * —incluida una `<loc>` inyectada en el sitemap— se rechaza antes de pedirla.
 */

const CONCURRENCIA = 6;
const TIMEOUT_MS = 15_000;

const HOSTS_PERMITIDOS = new Set([
  'www.siglo21sur.com',
  'siglo21sur.com',
]);

const motivo = (e: unknown) => (e instanceof Error ? e.message : String(e));

function validarDestino(url: string): void {
  const destino = new URL(url);
  if (destino.protocol !== 'https:' || !HOSTS_PERMITIDOS.has(destino.hostname)) {
    throw new Error('destino no permitido');
  }
}

async function enTandas<T>(items: T[], fn: (item: T) => Promise<void>) {
  let i = 0;
  const obreros = Array.from({ length: Math.min(CONCURRENCIA, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  });
  await Promise.all(obreros);
}

function mensajeParaTelegram(fallo: string) {
  const separador = ' — ';
  const separadorEn = fallo.indexOf(separador);
  const que = separadorEn >= 0 ? fallo.slice(0, separadorEn) : fallo;
  const detalle = separadorEn >= 0 ? fallo.slice(separadorEn + separador.length) : '';

  if (que === '/sitemap.xml') {
    if (detalle.includes('no devolvio ninguna')) {
      return 'El mapa de páginas del sitio está vacío. Google no puede descubrir las páginas nuevas; revisar la generación del sitemap y la conexión con la base de datos.';
    }
    return 'El mapa de páginas del sitio no estuvo disponible. Google podría no detectar cambios o páginas nuevas; revisar la conexión del sitio con la base de datos.';
  }

  if (que === 'URL del sitemap') {
    const url = detalle.split(' → ')[0];
    return `Una página incluida en el mapa no está disponible: ${url}. Revisar esa página publicada.`;
  }

  if (que === 'cabeceras de la home' || que === 'content-security-policy'
    || que === 'x-content-type-options' || que === 'referrer-policy'
    || que === 'permissions-policy' || que === 'strict-transport-security') {
    return 'La página principal no cumple una configuración de seguridad esperada. Revisar las cabeceras del sitio.';
  }

  if (que === 'precios vencidos') return detalle;

  if (que.startsWith('/')) {
    return `La página ${que} no está disponible. Revisar el sitio publicado.`;
  }

  return `El redireccionamiento ${que} no funciona como debería. Revisar la configuración de enlaces del sitio.`;
}

export interface OpcionesChequeos {
  buscar: Buscar;
  precios?: () => Promise<{ institucion: string; vigente_hasta: string }[]>;
  ahora?: () => Date;
}

/**
 * Lector de precios: único lugar que declara la consulta.
 *
 * Lo usan la ruta HTTP y el cron. Si un camino arma los chequeos sin este
 * lector, la vigilancia responde «sin lector» en cada corrida y el aviso real
 * de precios vencidos nunca se ve: es lo que pasó con el cron hasta el
 * 27/10/2026.
 */
export function lectorDePrecios(db: D1Database) {
  return async (): Promise<{ institucion: string; vigente_hasta: string }[]> => (await db.prepare(
    'SELECT institucion, vigente_hasta FROM precios_privados',
  ).all<{ institucion: string; vigente_hasta: string }>()).results;
}

export async function correrChequeos(base: string, opciones: OpcionesChequeos) {
  const { buscar } = opciones;
  const fallos: string[] = [];
  const falla = (que: string, detalle: string) => fallos.push(`${que} — ${detalle}`);

  const pedir = (url: string) => {
    validarDestino(url);
    return buscar(url, {
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent': 'vigilancia-siglo21sur/1.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
  };

  // 1. Rutas fijas.
  await enTandas(RUTAS, async ruta => {
    try {
      const r = await pedir(base + ruta);
      if (r.status !== 200) falla(ruta, `HTTP ${r.status}`);
    } catch (e) {
      falla(ruta, motivo(e));
    }
  });

  // 2. Cabeceras de seguridad sobre la home.
  try {
    const home = await pedir(base + '/');
    for (const [cabecera, patron] of Object.entries(CABECERAS_ESPERADAS)) {
      const valor = home.headers.get(cabecera);
      if (!valor) falla(cabecera, 'ausente');
      else if (!patron.test(valor)) falla(cabecera, `valor inesperado: ${valor.slice(0, 80)}`);
    }
    const hsts = home.headers.get('strict-transport-security');
    if (!hsts || !HSTS_ESPERADO.test(hsts)) {
      falla('strict-transport-security', hsts ? `valor inesperado: ${hsts}` : 'ausente');
    }
  } catch (e) {
    falla('cabeceras de la home', motivo(e));
  }

  // 3. noindex en el panel y las APIs.
  await enTandas(NOINDEX, async ([ruta, esperado]) => {
    try {
      const r = await pedir(base + ruta);
      const tag = r.headers.get('x-robots-tag');
      if (!tag || !esperado.test(tag)) {
        falla(ruta, tag ? `X-Robots-Tag: ${tag}` : 'sin X-Robots-Tag — indexable');
      }
    } catch (e) {
      falla(ruta, motivo(e));
    }
  });

  // 4. Redirects declarados.
  await enTandas(redirectsEsperados(base), async ([desde, hasta, codigo]) => {
    try {
      const r = await pedir(desde);
      const location = r.headers.get('location');
      const destino = location ? new URL(location, desde).href.replace(/\/$/, '') : null;
      const esperado = hasta.replace(/\/$/, '');
      const codigoOk = codigo ? r.status === codigo : r.status >= 300 && r.status < 400;
      if (!codigoOk || destino !== esperado) {
        falla(desde, `HTTP ${r.status}${destino ? ` → ${destino}` : ''}, esperaba ${codigo ?? '3xx'} → ${hasta}`);
      }
    } catch (e) {
      falla(desde, motivo(e));
    }
  });

  // 5. Barrido del sitemap. Una `<loc>` de otro origen no se pide: se informa.
  let urlsSitemap = 0;
  try {
    const sm = await pedir(base + '/sitemap.xml');
    if (sm.status !== 200) {
      falla('/sitemap.xml', `HTTP ${sm.status}`);
    } else {
      const xml = await sm.text();
      const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
      urlsSitemap = urls.length;

      if (urls.length === 0) {
        falla('/sitemap.xml', 'no devolvio ninguna <loc>');
      } else {
        const origen = new URL(base).origin;
        await enTandas(urls, async u => {
          try {
            const destino = new URL(u, base);
            if (destino.origin !== origen) {
              falla('URL del sitemap', `${destino.href} → fuera del dominio`);
              return;
            }
            const r = await pedir(destino.href);
            if (r.status !== 200) falla('URL del sitemap', `${u} → HTTP ${r.status}`);
          } catch (e) {
            falla('URL del sitemap', `${u} → ${motivo(e)}`);
          }
        });
      }
    }
  } catch (e) {
    falla('/sitemap.xml', motivo(e));
  }

  const ahora = opciones.ahora?.() ?? new Date();

  // 6. Precios vencidos hace más de un día.
  if (!opciones.precios) {
    falla('precios vencidos', 'No se pudo revisar la vigencia de los precios: sin lector');
  } else {
    try {
      const aviso = preciosVencidos(await opciones.precios(), ahora);
      if (aviso) falla('precios vencidos', aviso);
    } catch (e) {
      falla('precios vencidos', `No se pudo revisar la vigencia de los precios: ${motivo(e)}`);
    }
  }

  return { fallos, urlsSitemap };
}

export interface EntornoVigilancia extends OpcionesChequeos {
  secretoCron?: string;
  telegram?: (texto: string, timeoutMs?: number) => Promise<string>;
}

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function manejarVigilancia(
  request: Request, entorno: EntornoVigilancia,
): Promise<Response> {
  const negado = await rechazoBearer(request, entorno.secretoCron, 'CRON_SECRET');
  if (negado) return negado;
  if (!entorno.buscar) return respuesta({ error: 'Vigilancia sin transporte' }, 503);

  const avisar = (texto: string) => entorno.telegram
    ? entorno.telegram(texto, TIMEOUT_MS)
    : Promise.resolve('sin configurar');

  if (new URL(request.url).searchParams.has('prueba')) {
    const aviso = await avisar(
      `Prueba de vigilancia de ${BASE_PROD}. Si estas leyendo esto, el canal de avisos funciona.`,
    );
    return respuesta({ prueba: true, aviso });
  }

  const arranque = Date.now();
  const { fallos, urlsSitemap } = await correrChequeos(BASE_PROD, entorno);
  const segundos = ((Date.now() - arranque) / 1000).toFixed(1);

  let aviso = 'no hacia falta';
  if (fallos.length > 0) {
    aviso = await avisar([
      `Vigilancia del sitio ${BASE_PROD}`,
      fallos.length === 1 ? 'Se detectó un problema:' : `Se detectaron ${fallos.length} problemas:`,
      '',
      ...fallos.slice(0, 20).map(f => `• ${mensajeParaTelegram(f)}`),
      fallos.length > 20 ? `También hay ${fallos.length - 20} problemas más.` : '',
    ].filter(Boolean).join('\n'));
    console.error(`[vigilancia] ${fallos.length} falla(s):\n${fallos.join('\n')}`);
  }

  return respuesta({
    ok: fallos.length === 0,
    fallos,
    urlsSitemap,
    segundos: Number(segundos),
    aviso,
  });
}
