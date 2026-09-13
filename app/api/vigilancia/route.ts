// Vigilancia de produccion, corriendo en Vercel cada 6 horas (vercel.json).
//
// Es el mismo chequeo que herramientas/smoke.mjs pero sin depender de que la
// maquina de casa este prendida: el watchdog local deja un aviso en el
// escritorio, o sea que si la PC esta apagada no hay vigilancia. Este avisa por
// Telegram, que es el canal que ya usan los formularios.
//
// Que NO hace, a proposito: no mide el peso comprimido de la home. Eso necesita
// leer los bytes del socket sin descomprimir y fetch los descomprime solo; ese
// chequeo es de rendimiento, no de caida, y sigue viviendo en smoke.mjs.
//
// Solo avisa cuando encuentra algo. Si el cron mismo dejara de correr, eso se ve
// en el tab Cron Jobs del proyecto en Vercel, no aca.
//
// Con ?prueba=1 manda un aviso de prueba y no corre ningun chequeo, para poder
// confirmar que el canal de Telegram sigue vivo sin esperar a que algo falle.

import { NextRequest, NextResponse } from 'next/server';
import {
  BASE_PROD,
  CABECERAS_ESPERADAS,
  HSTS_ESPERADO,
  NOINDEX,
  RUTAS,
  redirectsEsperados,
} from '@/lib/vigilancia-esperado';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CONCURRENCIA = 6;
const TIMEOUT_MS = 15000;

function pedir(url: string) {
  return fetch(url, {
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'user-agent': 'vigilancia-siglo21sur/1.0',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
}

async function enTandas<T>(items: T[], fn: (item: T) => Promise<void>) {
  let i = 0;
  const obreros = Array.from({ length: Math.min(CONCURRENCIA, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  });
  await Promise.all(obreros);
}

/** El mensaje de un fallo tiene que alcanzar para saber que romper mirar. */
const motivo = (e: unknown) => (e instanceof Error ? e.message : String(e));

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

  if (que === 'cabeceras de la home' || que === 'content-security-policy' || que === 'x-content-type-options' || que === 'referrer-policy' || que === 'permissions-policy' || que === 'strict-transport-security') {
    return 'La página principal no cumple una configuración de seguridad esperada. Revisar las cabeceras del sitio.';
  }

  if (que.startsWith('/')) {
    return `La página ${que} no está disponible. Revisar el sitio publicado.`;
  }

  return `El redireccionamiento ${que} no funciona como debería. Revisar la configuración de enlaces del sitio.`;
}

async function correrChequeos(base: string) {
  const fallos: string[] = [];
  const falla = (que: string, detalle: string) => fallos.push(`${que} — ${detalle}`);

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

  // 5. Barrido del sitemap: es el chequeo que agarra la ficha de carrera rota.
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
        await enTandas(urls, async u => {
          try {
            const r = await pedir(u);
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

  return { fallos, urlsSitemap };
}

async function avisar(texto: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return 'sin configurar';

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return r.ok ? 'enviado' : `error HTTP ${r.status}`;
  } catch (e) {
    return `error ${motivo(e)}`;
  }
}

export async function GET(request: NextRequest) {
  // Sin secreto el endpoint quedaria abierto y cualquiera podria disparar el
  // barrido entero a piacere, asi que preferimos no atender.
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: 'CRON_SECRET sin configurar' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
  }

  // Modo prueba: fuerza un aviso sin correr los chequeos. El canal de avisos de
  // este proyecto ya fallo callado una vez (el trigger encola y el INSERT
  // responde 201 igual), asi que poder confirmarlo cuando uno quiere, y no el
  // dia que algo se rompe, es la diferencia entre saber y suponer.
  if (request.nextUrl.searchParams.has('prueba')) {
    const aviso = await avisar(
      `Prueba de vigilancia de ${BASE_PROD}. Si estas leyendo esto, el canal de avisos funciona.`,
    );
    return NextResponse.json({ prueba: true, aviso });
  }

  const arranque = Date.now();
  const { fallos, urlsSitemap } = await correrChequeos(BASE_PROD);
  const segundos = ((Date.now() - arranque) / 1000).toFixed(1);

  let aviso = 'no hacia falta';
  if (fallos.length > 0) {
    aviso = await avisar(
      [
        `Vigilancia del sitio ${BASE_PROD}`,
        fallos.length === 1 ? 'Se detectó un problema:' : `Se detectaron ${fallos.length} problemas:`,
        '',
        ...fallos.slice(0, 20).map(f => `• ${mensajeParaTelegram(f)}`),
        fallos.length > 20 ? `También hay ${fallos.length - 20} problemas más.` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    console.error(`[vigilancia] ${fallos.length} falla(s):\n${fallos.join('\n')}`);
  }

  return NextResponse.json({
    ok: fallos.length === 0,
    fallos,
    urlsSitemap,
    segundos: Number(segundos),
    aviso,
  });
}
