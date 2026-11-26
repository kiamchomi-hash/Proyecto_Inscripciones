import { env } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
import { aplicarCabeceras } from './entrega/cabeceras.ts';
import {
  buscarRedireccion, redireccionDeHost, ubicacionRedireccion,
} from './entrega/redirects.ts';
import {
  BASE_IDENTIDAD, HOST_WWW_IDENTIDAD, destinoFueraDeIdentidad, esDestinoIdentidad,
  normalizarHost, sitioDe,
} from './entrega/sitios.ts';

// Primero los redirects (host, después ruta, como el borde de producción) y
// después las cabeceras de entrega. Los redirects de `next.config.ts` no
// llevan cabeceras de seguridad: el navegador sigue el salto, no renderiza.
//
// El paquete sirve dos sitios: el CAU y la Academia Identidad Argentina en
// topykly.com. `APP_SITIO` decide en producción; en local decide el host.
export const onRequest = defineMiddleware(async (contexto, siguiente) => {
  const pedida = new URL(contexto.request.url);
  const sitio = sitioDe(pedida.host, (env as unknown as { APP_SITIO?: string }).APP_SITIO);

  // El ápice es el canónico de Identidad: `www` no compite con él.
  if (normalizarHost(pedida.host) === HOST_WWW_IDENTIDAD) {
    return new Response(null, {
      status: 301,
      headers: { Location: `${BASE_IDENTIDAD}${pedida.pathname}${pedida.search}` },
    });
  }

  if (sitio === 'identidad') {
    const fuera = destinoFueraDeIdentidad(pedida.pathname, pedida.search);
    if (fuera) {
      return new Response(null, {
        status: fuera.estado,
        headers: { Location: fuera.destino },
      });
    }
  } else {
    const porHost = redireccionDeHost(pedida.host, pedida.pathname);
    if (porHost) {
      return new Response(null, {
        status: porHost.estado,
        headers: { Location: ubicacionRedireccion(porHost, pedida.search) },
      });
    }

    const redireccion = buscarRedireccion(pedida.pathname);
    if (redireccion) {
      // Un renombre que aterriza en una ficha de la Academia no se sirve desde
      // el CAU: la URL vieja responde 410 en vez de encadenar hasta una página
      // que este dominio ya no ofrece.
      if (esDestinoIdentidad(redireccion.destino)) {
        return new Response(null, { status: 410 });
      }
      return new Response(null, {
        status: redireccion.estado,
        headers: { Location: ubicacionRedireccion(redireccion, pedida.search) },
      });
    }
  }

  const original = await siguiente();
  const respuesta = new Response(original.body, original);
  return aplicarCabeceras(respuesta, { ruta: pedida.pathname, estado: original.status, sitio });
});
