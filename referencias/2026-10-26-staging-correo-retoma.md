# Referencias de la retoma de correo en staging

- https://developers.cloudflare.com/workers/configuration/multipart-upload-metadata/ — publicación por versión con keep_assets:true para conservar assets existentes y bindings heredados; sin crear infraestructura ni incluir secretos en el bundle.

- https://developers.cloudflare.com/workers/runtime-apis/request/#options — Workers sólo admite redirect follow/manual; error lanza TypeError al construir Request antes del envío. Fundamento de la corrección local con rechazo explícito de 3xx.
- https://developers.cloudflare.com/workers/observability/errors/#illegal-invocation-errors — hipótesis de pérdida de receptor contrastada y descartada en reproducción; no se aplicó bind por conjetura.

- https://developers.smtp2go.com/docs/authentication — autenticación oficial con campo api_key o cabecera X-Smtp2go-Api-Key; no impone prefijo de valor. Corrige la guarda privada demasiado estricta.

- https://developers.smtp2go.com/reference/view-sender-domains — lectura acotada del estado DKIM/return-path del remitente; no se obtuvo respuesta verificable con el archivo local.
- https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/settings/methods/edit/ — permisos Workers y distinción de script-settings; el cierre de bindings usó el endpoint settings multipart descubierto en el MCP.
