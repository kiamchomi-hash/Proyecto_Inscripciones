# Correo saliente por Cloudflare Email Service

**Estado al 29/10/2026: activado, probado y publicado.** Email Sending está
habilitado en `siglo21sur.com`, un mail real salió desde
`inscripciones@siglo21sur.com` y llegó. El binding `send_email` está desplegado
en producción con el remitente restringido. **SMTP2GO se retiró el mismo día:**
el código y la clave ya no existen.

## Por qué

El correo del sitio es el único canal que nunca quedó cerrado. La clave de
SMTP2GO no se pudo usar como credencial HTTP, el remitente no se pudo verificar
y hubo un despacho ambiguo con cupo consumido; el detalle está en
[`cloudflare/STAGING-PREPARACION.md`](../cloudflare/STAGING-PREPARACION.md).
Cloudflare Email Sending no necesita clave: el Worker manda por binding y la
credencial no existe como dato que custodiar ni rotar.

## Qué se agregó en el código

| Pieza | Archivo | Qué hace |
|---|---|---|
| `CorreoBinding` y `config.email` | `cloudflare/src/operativa/transportes.ts` | Tipo mínimo del binding, declarado estructural para probarlo en Node |
| `porBinding()` | idem | Arma el mensaje con la plantilla de siempre y llama a `send()` |
| `remitenteEstructurado()` | idem | `'CAU Online <inscripciones@siglo21sur.com>'` → `{ email, name }`; el remitente sigue teniendo un solo dueño |
| Cableado | `src/api/runtime.ts`, `src/operativa/produccion.ts`, `produccion/worker.ts` | El binding, si está, llega a las APIs, a la cola y al cron |

Reglas que se conservan del diseño vigente:

- **Un solo camino.** El correo sale por el binding. Sin él no hay transporte:
  `sin-configurar` y la intención espera en el outbox, que la levanta el barrido.
  SMTP2GO y su `SMTP2GO_API_KEY` se retiraron: ya no hay clave que rotar ni dos
  caminos que puedan divergir.
- **Un error del binding con `code`** (`E_SENDER_NOT_VERIFIED`,
  `E_RECIPIENT_NOT_ALLOWED`, …) es un rechazo conocido: la fila queda `error` y
  se puede reintentar a mano.
- **Un error sin `code`** (falla del runtime) queda `ambiguo` y no se reintenta
  solo, igual que una excepción de red en los otros transportes.
- **La plantilla no se duplica**: sigue saliendo de `armarMailPrecio`.
- **Los encabezados RFC 8058** del newsletter pasan de `{ header, value }[]` a
  objeto, que es lo que pide el binding. Los dos están en la lista permitida de
  Cloudflare y el formato `<https://…>` que ya arma `encabezadosBaja` es el que
  exige la validación; `List-Unsubscribe-Post` tiene que ser exactamente
  `List-Unsubscribe=One-Click`.

## Cómo se activó (hecho el 29/10/2026)

1. Onboardear el dominio en Email Sending:

   ```bash
   npx wrangler email sending enable siglo21sur.com
   ```

2. Verificar que el apex quedó intacto. **Cloudflare no toca el dominio raíz**:
   crea el subdominio `cf-bounce` y publica ahí sus propios MX, SPF y DKIM.

   ```bash
   dig +short TXT siglo21sur.com              # un solo v=spf1
   dig +short TXT cf-bounce.siglo21sur.com
   dig +short MX cf-bounce.siglo21sur.com
   dig +short TXT cf-bounce._domainkey.siglo21sur.com
   ```

   Resultado de la activación: `DKIM selector: cf-bounce`, `Return-path domain:
   cf-bounce.siglo21sur.com`, un único `v=spf1` en el apex y el DMARC `p=reject`
   con su `rua` sin cambios.

3. Probar con un mail real **antes** de tocar el Worker:

   ```bash
   npx wrangler email sending send \
     --from inscripciones@siglo21sur.com --from-name "CAU Online" \
     --to una-direccion-propia@ejemplo.com \
     --subject "Prueba de correo" --text "Prueba manual desde el CAU."
   ```

   Con `p=reject`, si llega está autenticado: no hay caso de "cayó en spam".

4. El binding en `cloudflare/produccion/wrangler.json`:

   ```json
   "send_email": [
     { "name": "EMAIL", "allowed_sender_addresses": ["inscripciones@siglo21sur.com"] }
   ]
   ```

   El `allowed_sender_addresses` no es decorativo: sin él el binding puede mandar
   desde cualquier dirección del dominio. La salida del deploy lo muestra como
   `env.EMAIL (unrestricted - senders: inscripciones@siglo21sur.com)`; ese
   "unrestricted" habla de **destinatarios** (los leads tienen direcciones
   cualesquiera), no del remitente.

5. `npm run publicar:ensayo` y después publicar.

**Ojo con el panel.** `wrangler email sending dns get` propone para el apex un
`_dmarc` **sin** `rua` (`"v=DMARC1; p=reject;"`), mientras el vivo tiene
`rua=mailto:…@dmarc-reports.cloudflare.net`. Aceptar "agregar los registros
faltantes" lo reemplazaría y se perderían los reportes. Los tres registros
necesarios ya están publicados; no hay nada que agregar.

**Si el OAuth de wrangler falla** con `Authentication error [code: 10000]` en
`/email/sending/zones`, o con "Could not find a zone" aunque la zona exista, es
el token del perfil, no el dominio: se arregla con `npx wrangler login`.

Para desactivar: `npx wrangler email sending disable siglo21sur.com`.

## Verificar

Sin mandar nada:

```bash
cd cloudflare && npm run test:envios
```

Cubre envío por binding, remitente, rechazo con código, ambiguo sin código y
los encabezados del newsletter.

Para probar de verdad hace falta un envío real, y conviene que sea a una
dirección propia:

```bash
npx wrangler email sending send \
  --from inscripciones@siglo21sur.com \
  --to tu-direccion@ejemplo.com \
  --subject "Prueba de correo" \
  --text "Prueba manual desde el CAU."
```

Los cupos de la base no se tocan con esto: es correo directo, no pasa por el
outbox.

## Probar el binding dentro del Worker

`POST /api/correo-prueba` manda un correo fijo a un destino fijo. No lee cuerpo
ni query, no acepta destinatario ni contenido, no toca D1 ni el outbox.

Existe porque `wrangler email sending send` prueba la API, no el binding del
Worker: hasta que `env.EMAIL.send` corre de verdad, un binding roto se descubre
con un lead esperando un precio que no llega.

Necesita dos secretos del Worker:

- `CORREO_PRUEBA_SECRETO`: el bearer que autoriza la llamada.
- `CORREO_PRUEBA_DESTINO`: la única casilla a la que puede mandar.

```bash
curl -X POST https://www.siglo21sur.com/api/correo-prueba \
  -H "Authorization: Bearer $CORREO_PRUEBA_SECRETO"
```

`200 { ok: true }` es que el binding aceptó. `502` trae el `code` del proveedor
(`E_SENDER_NOT_VERIFIED`, `E_RECIPIENT_NOT_ALLOWED`, …), `504` es ambiguo y `503`
es que falta configuración. Sin los dos secretos responde 503 y no manda nada.

## Qué no cambia

El outbox, los estados, el reclamo durable del newsletter, las reservas de 168 h
y la plantilla. El mail del precio sigue saliendo del outbox por la cola o por el
barrido del cron, y el newsletter sigue mandando de a uno desde su handler.
