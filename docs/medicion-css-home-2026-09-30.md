# CSS de la home: remedición del 30/09/2026

**La tercera copia sigue presente.** Se completó la medición, no se corrigió la anomalía. Se mantiene `inlineCss` y se vuelve a comprobar cuando se actualice Next. [Datos exactos](medicion-css-home-2026-09-30.json).

## Resultado

Un GET de https://www.siglo21sur.com/ con `Accept-Encoding: identity`, sin navegador ni ejecución de analytics, respondió 200, identity, Vercel HIT y Age 3061.

| Medida | Bytes | KiB |
|---|---:|---:|
| HTML sin compresión | 634.975 | 620,09 |
| Contenido de style | 148.532 | 145,05 |
| Scripts RSC que contienen capa base, serializados | 273.169 | 266,77 |
| Contenido de esos fragmentos, desescapado | 266.574 | 260,33 |
| Payload RSC desescapado completo | 343.883 | 335,82 |
| Gzip nivel 9 calculado localmente | 105.964 | 103,48 |
| Brotli calidad 11 calculado localmente | 43.749 | 42,72 |

La raíz `:root{--cau-brand-teal` y las capas base, theme y utilities aparecen tres veces: una en style y dos en el RSC concatenado. Se analizaron los elementos HTML con htmlparser2 y los argumentos de push con el AST de Acorn, sin ejecutar JavaScript remoto. Los valores de cadena del AST desescapan el payload; no hubo errores de parseo. Los fragmentos pueden partir una hoja o un marcador: no se equipara un script con una copia completa, ni se afirma identidad byte a byte entre hojas sólo contando marcadores.

## Comparación y límites

- Package.json declara Next ^16.3.3; package-lock y paquete instalado resuelven 16.3.3. No hubo actualización de Next desde la [medición del 05/09](correcciones-auditoria-2026-09-05.md). Los cambios posteriores del lock no prueban una actualización del framework.
- La guía instalada de inlineCss sigue describiendo dos copias esperadas: SSR y RSC. Producción sigue mostrando tres apariciones de los marcadores.
- El 05/09 se midieron 626,4 KiB y 105,0 KiB gzip en un build local. Hoy se mide producción: esos números son contexto, no un A/B comparable. La medición de producción del 28/08 también encontró tres apariciones; conserva unidades y método históricos en el detalle.
- Gzip y Brotli de esta tabla son compresiones locales de la misma respuesta, no bytes transferidos por Vercel. No se solicitó una segunda respuesta comprimida ni se midieron cabeceras de transporte.
- No se verificó la versión desplegada: la versión local no demuestra qué build sirve Vercel. Una muestra cacheada no representa todas las regiones o estados de caché.
- No se midieron LCP, CLS ni usuarios reales. No hubo build, cambio de dependencias, configuración, código, commit o deploy.

## Seguimiento

La anomalía queda abierta y sin urgencia nueva demostrada. La repetición condicional se registra en [rutinas](rutinas.md#css-de-la-home-al-actualizar-next); no debe figurar como un arreglo realizado. El [detalle original](pendientes-detalle.md#pendiente-02) conserva las mediciones anteriores.
