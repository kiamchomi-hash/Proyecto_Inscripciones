import { avisarIndexNow } from '../../../lib/indexnow.ts';
import { datosSitemap } from '../datos/sitemap.ts';
import { construirSitemap } from '../entrega/sitemap.ts';

/**
 * Aviso a IndexNow desde el cron del Worker.
 *
 * No lo puede hacer el workflow de publicación: Cloudflare devuelve 403 al leer
 * `/sitemap.xml` desde las IPs de GitHub (10/11/2026), y el sitemap no existe en
 * el build porque lo arma el Worker desde D1. Acá la lista sale de la misma
 * función que sirve `/sitemap.xml`, sin ningún pedido HTTP al propio sitio.
 *
 * Se avisa sólo lo nuevo y lo que cambió —la huella es el `lastModified` de la
 * entrada—, no el sitemap entero en cada corrida. Si IndexNow no contesta, no se
 * anota nada: la próxima corrida vuelve a intentarlo.
 */

/** Tope del protocolo por pedido. Más URLs que esto no se mandan. */
export const MAXIMO_POR_PEDIDO = 10000;

export type ResumenIndexNow = {
  /** URLs que hoy tiene el sitemap. */
  urls: number;
  /** URLs nuevas o con huella distinta, que se avisaron en esta corrida. */
  nuevas: number;
  /** Filas borradas porque la URL ya no está en el sitemap. */
  quitadas: number;
  /** Código HTTP de IndexNow, o `null` si no hubo aviso o no respondió. */
  estado: number | null;
};

type Entrada = { url: string; huella: string };

/** La misma lista que sirve `/sitemap.xml`, con la huella de cada URL. */
async function entradasDelSitemap(db: D1Database): Promise<Entrada[]> {
  const sitemap = construirSitemap(await datosSitemap(db));
  return sitemap.map(entrada => ({ url: entrada.url, huella: entrada.lastModified ?? '-' }));
}

async function leerAvisadas(db: D1Database): Promise<Map<string, string>> {
  const { results } = await db
    .prepare('SELECT url, huella FROM indexnow_avisadas')
    .all<{ url: string; huella: string }>();
  return new Map(results.map(fila => [fila.url, fila.huella]));
}

async function anotarAvisadas(db: D1Database, entradas: Entrada[]): Promise<void> {
  const sentencia = db.prepare(`INSERT INTO indexnow_avisadas (url, huella)
    VALUES (?1, ?2)
    ON CONFLICT (url) DO UPDATE SET huella = excluded.huella, avisada_en = datetime('now')`);
  await db.batch(entradas.map(({ url, huella }) => sentencia.bind(url, huella)));
}

async function olvidarAvisadas(db: D1Database, urls: string[]): Promise<void> {
  const marcas = urls.map((_, i) => `?${i + 1}`).join(',');
  await db.prepare(`DELETE FROM indexnow_avisadas WHERE url IN (${marcas})`).bind(...urls).run();
}

export async function manejarIndexNow(
  db: D1Database,
  opciones: { avisar?: (urls: string[]) => Promise<number | null> } = {},
): Promise<ResumenIndexNow> {
  const avisar = opciones.avisar ?? ((urls: string[]) => avisarIndexNow(urls));
  const actuales = await entradasDelSitemap(db);

  // Un sitemap vacío o desmedido es un error de datos, no un cambio de URLs:
  // no se avisa nada y tampoco se borra lo ya anotado.
  if (actuales.length === 0 || actuales.length > MAXIMO_POR_PEDIDO) {
    return { urls: actuales.length, nuevas: 0, quitadas: 0, estado: null };
  }

  const avisadas = await leerAvisadas(db);
  const vigentes = new Set(actuales.map(entrada => entrada.url));
  const nuevas = actuales.filter(entrada => avisadas.get(entrada.url) !== entrada.huella);
  const quitadas = [...avisadas.keys()].filter(url => !vigentes.has(url));

  let estado: number | null = null;
  if (nuevas.length > 0) {
    estado = await avisar(nuevas.map(entrada => entrada.url));
    // IndexNow devuelve 200 o 202 cuando toma el pedido. Cualquier otra cosa
    // deja las URLs sin anotar para reintentar en la corrida siguiente.
    if (estado === 200 || estado === 202) await anotarAvisadas(db, nuevas);
  }
  if (quitadas.length > 0) await olvidarAvisadas(db, quitadas);

  return { urls: actuales.length, nuevas: nuevas.length, quitadas: quitadas.length, estado };
}
