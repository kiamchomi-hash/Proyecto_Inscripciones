# Checklist de confiabilidad guiado por el diff

Usá sólo los apartados cuyo disparador aparezca en los archivos modificados.
Cada pregunta apunta a un fallo que ya ocurrió o a una frontera del sistema
documentada; no reemplaza los tests.

| Disparador en el diff | Riesgo conocido | Qué comprobar |
|---|---|---|
| Cambia un componente, helper o estilo compartido que también importa `cloudflare/` | Un control de la raíz puede pasar aunque el Worker no compile o renderice igual. | Identificá ambos consumidores; corré `npm run check` y el build o test afectado de Cloudflare. Ver [arquitectura del sitio](../AGENTS.md#arquitectura-y-base-de-datos). |
| Cambian slugs, redirects, sitemap, canónicas o metadata de páginas | Una regla vieja puede interceptar una ruta nueva; metadata y página pueden divergir. Ya ocurrió con Hotelera y con un artículo cacheado con título de error. | Revisá conflictos con redirects, destino/código exactos y consistencia entre HTML y metadata; corré la prueba de regresión afectada. Ver [alta de carrera](alta-de-carrera.md) y [bitácora de seguridad](seguridad.md#14092026-controles-automáticos-de-producción). |
| Cambian formularios, validaciones, outbox o notificaciones | Una respuesta exitosa no garantiza que el aviso se entregue; un efecto puede duplicarse o quedar sin fila asociada. | Comprobá rechazos antes de guardar y el vínculo entre fila y efecto; ejecutá las pruebas del handler y del outbox afectado. Ver [modelo de seguridad](seguridad.md#modelo-vigente) y [herramientas de leads](herramientas.md). |
| Cambian autenticación, permisos, Turnstile, CSP, sanitización o secretos | Una validación sólo en la interfaz deja el endpoint expuesto; contenido o credenciales pueden cruzar una frontera. | Verificá la denegación en el servidor, el fallo cerrado y que no haya efectos privilegiados antes de autorizar; corré la suite de seguridad pertinente. Ver [seguridad](seguridad.md). |
| Cambia UI, layout, fuentes, imágenes o interacción de teclado | Tests de lógica pueden pasar con una regresión visual o de foco. | Revisá escritorio y celular, foco/teclado y capturas; no actualices referencias visuales sin inspeccionar primero la diferencia. Ver [controles automáticos](controles-automaticos.md#navegador-y-comparación-visual). |
| Cambian workflows, publicación o configuración del Worker | El CI de raíz no ejecuta el control completo de Cloudflare; una publicación puede validar un contrato distinto al esperado. | Ejecutá el test del contrato que cambió y confirmá qué workflow corre realmente. No confundas CI con `npm --prefix cloudflare run check`. Ver [controles automáticos](controles-automaticos.md#ejecución-recurrente). |

Si no aparece ningún disparador, no agregues pasos por cumplir una lista: usá
la comprobación mínima suficiente de [`verificacion.md`](verificacion.md).
