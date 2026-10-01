## Manifest e íconos, 30/09/2026

`app/manifest.ts` usa la convención de metadata de Next.js 16.3.3 y sirve `/manifest.webmanifest`. Next añade el enlace al head: no se agregó un enlace manual. Nombre completo Universidad Siglo 21 — CAU Villa Lugano, nombre corto Siglo 21 CAU, idioma es-AR e identidad/inicio/alcance `/`. La presentación es standalone; no se ofrece funcionamiento sin conexión.

Los íconos PNG 192×192 y 512×512, y Apple 180×180, se generan desde el mismo vector oficial que el favicon con `node herramientas/generar-favicon.mjs`. Son opacos y de propósito `any`, no maskable: el isologo ocupa el cuadrado completo. La metadata Apple reemplaza el logo anterior no preparado para ese uso. Favicon y SEO conservados; CSP permite los recursos propios mediante `default-src 'self'`.

### Evidencia

- TDD: `node --test tests/manifest.test.mjs`, primero 3 fallos por archivos/metadata ausentes; luego 3/3 aprobados. Se corrigió además la lectura de rutas con acento usando `fileURLToPath`.
- Integración: servidor `npm run dev -- --port 3107`; `node tests/integracion/manifest.mjs` aprobó JSON y MIME `application/manifest+json`, 3 PNG servidos con 200/dimensiones correctas, un enlace manifest, un Apple y canónica pública conservada.
- `npm run check`: lint sin errores (28 advertencias preexistentes), typecheck aprobado, 110/110 pruebas aprobadas.
- Vista previa de los tres íconos inspeccionada; no se modificaron páginas ni estilos.
- Sin nuevas dependencias, service worker, caché offline, push ni cambios de base.

### Reproducción y límites

Arrancar el servidor local y ejecutar `MANIFEST_TEST_URL=<origen>` con `node tests/integracion/manifest.mjs` (PowerShell: `$env:MANIFEST_TEST_URL='<origen>'`). El test usa localhost:3107 si no se declara otro origen. No ejecutarlo contra producción antes de publicar estos archivos.

La instalación efectiva depende del navegador/dispositivo; no se comprobó en un teléfono físico ni en producción. El manifest no garantiza elegibilidad de instalación ni funcionamiento offline.

### Reversión

Retirar `app/manifest.ts`, los tres PNG y sus tests; devolver sólo la entrada `icons.apple` a su valor previo y retirar el bucle de instalación del generador. No revertir el layout completo ni otros cambios ajenos.
