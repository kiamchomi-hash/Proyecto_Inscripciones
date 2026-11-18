const PREFIJO = '/__assets/';
const VERSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIGEST = /^[0-9a-f]{64}$/;
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const RUTAS_ASSETS = /^\/(?:_astro|imagenes|fuentes|folletos|planes|derivados)\//;
const ARCHIVOS_RAIZ = new Set([
  '/favicon.ico', '/apple-touch-icon.png', '/icon.png', '/icon-192.png', '/icon-512.png',
]);

export interface EntradaManifiesto {
  digest: string;
  contentType: string;
  size: number;
  contentLanguage?: string;
  contentDisposition?: string;
}

export interface ManifiestoAssets {
  version: string;
  files: Record<string, EntradaManifiesto>;
}

export function versionarUrlAsset(valor: string, origen: string, version: string): string {
  if (!VERSION.test(version)) return valor;
  let url: URL;
  let base: URL;
  try {
    url = new URL(valor, origen);
    base = new URL(origen);
  } catch { return valor; }
  if (url.hostname !== base.hostname || url.pathname.startsWith(PREFIJO)
    || (!RUTAS_ASSETS.test(url.pathname) && !ARCHIVOS_RAIZ.has(url.pathname))) return valor;
  url.pathname = `${PREFIJO}${version}${url.pathname}`;
  return url.toString();
}

/** Reescribe referencias locales de CSS/JS; el prefijo dinámico conserva la versión del módulo. */
export function versionarReferenciasTexto(texto: string, version: string): string {
  if (!VERSION.test(version)) return texto;
  return texto.replace(
    /(?<![\w:])\/(_astro|imagenes|fuentes|folletos|planes|derivados)\//g,
    `/${PREFIJO.slice(1)}${version}/$1/`,
  ).replace(
    /(?<![\w:])\/(favicon\.ico|apple-touch-icon\.png|icon(?:-192|-512)?\.png)(?=["'`?#\s),])/g,
    `/${PREFIJO.slice(1)}${version}/$1`,
  );
}

export function versionarRespuestaHtml(
  respuesta: Response,
  version: string,
  origen: string,
  Rewriter: typeof HTMLRewriter = HTMLRewriter,
): Response {
  if (!VERSION.test(version) || !respuesta.headers.get('Content-Type')?.includes('text/html')) return respuesta;
  return new Rewriter().on(
    'img[src],img[srcset],script[src],script:not([src]),source[src],source[srcset],video[poster],audio[src],track[src],input[src],iframe[src],embed[src],object[data],a[href],area[href],use[href],image[href],link[href],link[imagesrcset],meta[property^="og:image"],meta[name^="twitter:image"],meta[itemprop="image"],[style]',
    {
      element(element) {
        for (const atributo of ['src', 'href', 'poster', 'data', 'content']) {
          const valor = element.getAttribute(atributo);
          if (valor) element.setAttribute(atributo, versionarUrlAsset(valor, origen, version));
        }
        const estilo = element.getAttribute('style');
        if (estilo) element.setAttribute('style', versionarReferenciasTexto(estilo, version));
        for (const atributo of ['srcset', 'imagesrcset']) {
          const valor = element.getAttribute(atributo);
          if (!valor) continue;
          element.setAttribute(atributo, valor.split(',').map(candidato => {
            const partes = /^(\s*)(\S+)([\s\S]*)$/.exec(candidato);
            return partes
              ? `${partes[1]}${versionarUrlAsset(partes[2], origen, version)}${partes[3]}`
              : candidato;
          }).join(','));
        }
      },
    },
  ).on('style,script:not([src])', {
    // `replace` escribe el contenido como texto HTML y escapa `&`, `<` y `>`.
    // Sin `{ html: true }` el `&&` de un script inline llega como `&amp;&amp;`,
    // el navegador no lo puede parsear y la isla de Astro nunca hidrata. Se
    // reemplaza sólo el texto que trae una referencia: el resto queda intacto.
    text(chunk) {
      const versionado = versionarReferenciasTexto(chunk.text, version);
      if (versionado !== chunk.text) chunk.replace(versionado, { html: true });
    },
  }).transform(respuesta);
}

export interface ObjetoR2 {
  body: ReadableStream<Uint8Array>;
  httpEtag: string;
  range?: { offset: number; length: number };
  size?: number;
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
  };
}

export interface BucketAssets {
  get(key: string, options?: { range?: Headers }): Promise<ObjetoR2 | null>;
}

export interface CacheAssets {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export interface ContextoAssets {
  waitUntil(promise: Promise<unknown>): void;
}

async function leerManifiesto(
  version: string,
  origen: string,
  bucket: BucketAssets,
  cache?: CacheAssets,
  contexto?: ContextoAssets,
): Promise<ManifiestoAssets | null> {
  const claveCache = new Request(`${origen}/__r2_cache/manifiestos/${version}`);
  const copia = await cache?.match(claveCache);
  if (copia) {
    try { return await copia.json() as ManifiestoAssets; } catch { return null; }
  }
  const objeto = await bucket.get(`manifests/${version}.json`);
  if (!objeto) return null;
  let manifiesto: ManifiestoAssets;
  try { manifiesto = JSON.parse(await new Response(objeto.body).text()) as ManifiestoAssets; } catch { return null; }
  if (manifiesto.version !== version || !manifiesto.files || typeof manifiesto.files !== 'object') return null;
  if (cache && contexto) {
    const headers = new Headers({ 'Cache-Control': CACHE_CONTROL, 'Content-Type': 'application/json' });
    contexto.waitUntil(cache.put(claveCache, new Response(JSON.stringify(manifiesto), { headers })));
  }
  return manifiesto;
}

/**
 * Sirve rutas versionadas consultando un manifiesto por release y objetos
 * deduplicados por SHA-256. Devuelve null para rutas ajenas a `__assets`.
 */
export async function servirAssetR2(
  request: Request,
  bucket: BucketAssets | undefined,
  cache: CacheAssets | undefined,
  contexto: ContextoAssets,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(PREFIJO)) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
  }
  if (!bucket) return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } });

  const [version, ...segmentos] = url.pathname.slice(PREFIJO.length).split('/');
  let segmentosDecodificados: string[];
  try { segmentosDecodificados = segmentos.map(decodeURIComponent); } catch {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const ruta = segmentosDecodificados.join('/');
  if (!version || !VERSION.test(version) || !ruta || segmentosDecodificados.some(segmento =>
    !segmento || segmento === '.' || segmento === '..' || /[\/\\\u0000-\u001f]/.test(segmento))) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const cacheUrl = new URL(url);
  cacheUrl.search = '';
  const claveCache = new Request(cacheUrl, { method: 'GET' });
  const cacheable = request.method === 'GET' && !request.headers.has('range');
  const copia = cacheable ? await cache?.match(claveCache) : undefined;
  if (copia) return copia;

  const manifiesto = await leerManifiesto(version, url.origin, bucket, cache, contexto);
  const entrada = manifiesto && Object.hasOwn(manifiesto.files, ruta) ? manifiesto.files[ruta] : undefined;
  if (!entrada || !DIGEST.test(entrada.digest) || !Number.isSafeInteger(entrada.size) || entrada.size < 0
    || typeof entrada.contentType !== 'string') {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const tipoTexto = /^(?:text\/css|text\/javascript|application\/javascript)\b/i.test(entrada.contentType);
  const objeto = await bucket.get(`objects/${entrada.digest}`, {
    ...(request.headers.has('range') && !tipoTexto ? { range: request.headers } : {}),
  });
  if (!objeto) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });

  const headers = new Headers({
    'Cache-Control': CACHE_CONTROL,
    ETag: `"${entrada.digest}"`,
    'Content-Type': entrada.contentType,
    'X-Content-Type-Options': 'nosniff',
  });
  if (entrada.contentLanguage) headers.set('Content-Language', entrada.contentLanguage);
  if (entrada.contentDisposition) headers.set('Content-Disposition', entrada.contentDisposition);
  if (objeto.httpMetadata?.contentEncoding) headers.set('Content-Encoding', objeto.httpMetadata.contentEncoding);

  let body: BodyInit = objeto.body;
  let status = 200;
  if (tipoTexto) {
    const texto = versionarReferenciasTexto(await new Response(body).text(), version);
    body = texto;
    headers.delete('ETag');
    headers.delete('Content-Encoding');
  } else if (request.headers.has('range') && objeto.range) {
    status = 206;
    headers.set('Accept-Ranges', 'bytes');
    headers.set(
      'Content-Range',
      `bytes ${objeto.range.offset}-${objeto.range.offset + objeto.range.length - 1}/${entrada.size}`,
    );
    headers.set('Content-Length', String(objeto.range.length));
  } else {
    headers.set('Content-Length', String(entrada.size));
  }

  const respuesta = new Response(body, { status, headers });
  if (cacheable && cache) {
    const guardado = cache.put(claveCache, respuesta.clone());
    contexto.waitUntil(guardado);
  }
  return request.method === 'HEAD'
    ? new Response(null, { status: respuesta.status, headers: respuesta.headers })
    : respuesta;
}
