# Referencias para las correcciones — 05/09/2026

- https://nextjs.org/docs/app/guides/incremental-static-regeneration — contrastado con la documentación instalada: una regeneración fallida conserva la última versión exitosa.
- https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss — contrastado con la documentación instalada: duplicación documentada de estilos y soporte sólo en producción; se conservó habilitado.
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ — validación de captcha en servidor, usada durante la auditoría previa.
- https://developers.cloudflare.com/turnstile/troubleshooting/testing/ — alternativa con claves de prueba; el bypass local quedó explícito y separado de producción.
- https://github.com/advisories/GHSA-g8qq-57p8-ggw5 — parche de sanitize-html aplicado.
- https://github.com/advisories/GHSA-px8p-9vwx-vf98 — parche de fflate aplicado.
- https://github.com/advisories/GHSA-c83g-rgw3-j3cx — rango vulnerable de Browserslist superado.
- https://www.siglo21sur.com/sitemap.xml — referencia de producción de la auditoría, no un despliegue de las correcciones.
