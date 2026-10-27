# Fuentes del ensayo de formulario staging

- https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/ — widget limitado al hostname concreto del Worker de staging, sin dominio raíz amplio.
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ — Siteverify de servidor, token máximo de 2048 caracteres, un solo uso, action/hostname y fallo cerrado.
- https://developers.cloudflare.com/workers/configuration/multipart-upload-metadata/ — versión del Worker, bindings heredados y assets existentes cuando corresponde; no publicación productiva.
- https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/methods/create/ — `keep_assets`, `keep_bindings`, binding `inherit` y `bindings_inherit=strict` para no perder los secretos al subir una versión.
- https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/methods/create/ (esquema `assets`) y `POST /workers/assets/upload?base64=true` — subir los assets del build nuevo: `keep_assets` conserva los anteriores y por eso los chunks con hash nuevo daban 404.
- https://developers.cloudflare.com/workers/static-assets/ — `run_worker_first` y `not_found_handling`: el wrapper de staging necesita que toda ruta pase por el Worker.

