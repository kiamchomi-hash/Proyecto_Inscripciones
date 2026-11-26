# Academia Identidad Argentina en topykly.com

Desde el 26/11/2026 las ocho fichas de Identidad Argentina se sirven en
`https://topykly.com` y dejan de indexarse en `https://www.siglo21sur.com`.
El repositorio `kiamchomi-hash/topykly` no se toca: la aplicación de chat que
vivía en ese dominio estaba despublicada (`402 DEPLOYMENT_DISABLED` en Vercel)
y el dominio pasa a un segundo Worker de este paquete.

## Qué hace cada dominio

| Dominio | Worker | Contenido |
| --- | --- | --- |
| `www.siglo21sur.com` y `siglo21sur.com` | `cau-produccion-20261026` | Todo el CAU. Las ocho fichas de Identidad responden **301** a topykly. |
| `topykly.com` y `www.topykly.com` | `cau-identidad-20261126` | Portada de la Academia, sus ocho fichas, formularios y assets. Todo lo demás vuelve al CAU (o a la portada nueva si era una URL del chat). |

La decisión se toma por `APP_SITIO` en producción y por el host en local. El
`middleware` de Astro aplica el allowlist de rutas y los redirects; el entry de
producción (`produccion/worker.ts`) manda `www.topykly.com` al ápice.

## SEO

- Las fichas del CAU responden 301 permanente con la ruta y la query intactas;
  no llevan `noindex` para no mandar señales contradictorias.
- El sitemap del CAU ya no lista Identidad Argentina; el de topykly lista sólo
  su portada y sus ocho fichas, con `https://topykly.com` como base.
- El canónico, `og:url`, JSON-LD y el breadcrumb de cada ficha usan el dominio
  que la sirve.
- La portada del CAU no enlaza las fichas (el catálogo las excluye desde antes);
  la de topykly sí, con tarjetas enlazadas de verdad.
- En Search Console hay que dar de alta `topykly.com`, enviar
  `https://topykly.com/sitemap.xml` y pedir la indexación de la portada. No
  corresponde «Cambio de dirección»: es para un sitio entero, no para ocho URLs;
  el 301 se encarga de la transferencia.

## Publicación

```bash
cd cloudflare
npm run publicar:identidad            # plan, sin red
npm run publicar:identidad:ensayo     # build + deploy --dry-run
npm run publicar:identidad:produccion # build + deploy + smoke
```

El Worker comparte la base D1 y el productor de la cola con el CAU. **No**
declara crons ni consume la cola: los avisos y los programados siguen en el
Worker de producción del CAU.

## Requisitos de infraestructura

1. **DNS**: el dominio tenía registros DNS-only de Vercel (`A` en el ápice y
   `CNAME` en `www`). Hay que borrarlos para que Cloudflare pueda crear los
   registros del Worker; el deploy falla con `code: 100117` si siguen ahí.
2. **Turnstile**: el widget `0x4AAAAAAFncCnVXxSdGTsIO` tiene que incluir
   `topykly.com` y `www.topykly.com` en sus dominios. El Worker nuevo necesita
   el secreto `TURNSTILE_SECRET_KEY`:

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY --config produccion/wrangler-identidad.json
   ```

3. **Search Console**: verificar la propiedad de topykly (por DNS o con el
   registro TXT que indique Google) y enviar el sitemap.

## Vuelta atrás

Si hay que volver al estado anterior, el orden es: quitar las rutas/custom
domains del Worker de Identidad, volver a publicar el Worker del CAU sin el 301
(revertir el commit) y, si se quiere, reponer los registros de Vercel. El
repositorio de topykly nunca se modifica.
