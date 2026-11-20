# Indexación de Desarrollo de Videojuegos — verificación 20/11/2026

Comando: `npm run seo -- --inspeccion=<url>` (Search Console, service account de `~/.gsc/service_account.json`).

## URL vigente de Siglo 21

`https://www.siglo21sur.com/carreras/siglo-21-video-juegos`

```json
{
 "verdict": "PASS",
 "estado": "Enviada e indexada",
 "rastreo": "2026-11-15",
 "robots": "ALLOWED",
 "canonicaGoogle": "https://www.siglo21sur.com/carreras/siglo-21-video-juegos"
}
```

## URL vigente de Teclab

`https://www.siglo21sur.com/carreras/tecnicatura-superior-en-desarrollo-de-videojuegos`

```json
{
 "verdict": "PASS",
 "estado": "Enviada e indexada",
 "rastreo": "2026-11-08",
 "robots": "ALLOWED",
 "canonicaGoogle": "https://www.siglo21sur.com/carreras/tecnicatura-superior-en-desarrollo-de-videojuegos"
}
```

## URL antigua (no es la ficha vigente)

`https://www.siglo21sur.com/carreras/tecnicatura-en-videojuegos`

```json
{
 "verdict": "NEUTRAL",
 "estado": "Google no reconoce esta URL",
 "rastreo": null,
 "robots": "ROBOTS_TXT_STATE_UNSPECIFIED",
 "canonicaGoogle": null
}
```

Redirige 301 a `siglo-21-video-juegos` según `cloudflare/src/entrega/redirects-carreras.ts`; no se tiene por ficha vigente.

## Conclusión

Coincide con lo asentado el 15/11 en `docs/historial-pendientes.md#indexación--desarrollo-de-videojuegos-15112026`. El pendiente 2 se cierra y se retira de la cola de aplazados de `PENDIENTES.md`.
