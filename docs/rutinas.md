# Rutinas y tareas periódicas

Este archivo contiene trabajo recurrente, no tareas puntuales del backlog. No se crea ni modifica ninguna automatización con esta lista.

[Volver a los pendientes](../PENDIENTES.md).

Las rutinas por evento se revisan cuando ocurre el disparador. Las tareas periódicas se hacen en la frecuencia acordada. En ambos casos se anota la fecha de la última revisión y no se cierran para siempre. Si aparece un problema concreto, se crea un pendiente separado en `PENDIENTES.md`; la rutina continúa.

## Por evento o cambio

- [ ] **Actualizar las novedades del sitio cuando haya información nueva.** Revisar noticias, fechas, aperturas, cambios de oferta o información institucional; cargar o corregir `novedades`, generar la imagen OG del artículo y comprobar que aparezca en la página, el sitemap y la navegación.

- [ ] **Actualizar fuentes comerciales cuando cambien.** Revisar los dashboards y comunicaciones oficiales de Siglo 21, Teclab e Identidad Argentina; actualizar precios, cuotas, fechas, financiación, modalidad y oferta sólo con fuente verificable. Regenerar los artefactos derivados y correr los tests de ventas.

- [ ] **Revisar y mantener el corpus del bot cuando haya conversaciones o respuestas dudosas.** Confirmar cada dato contra su fuente vigente, corregir el corpus de la casa correspondiente y regenerar siempre las páginas de entrenador y buscador. Verificar especialmente precios, fechas, modalidad, requisitos, cuotas y documentación.

- [ ] **Revisar producción después de cada deploy o cambio sensible.** Ejecutar `npm run smoke` y, cuando corresponda, `npm run seo`; comprobar rutas, redirects, cabeceras, noindex del admin, sitemap, formularios y panel. Si se toca CSP, secretos, triggers o Edge Functions, seguir además el procedimiento documentado y hacer la prueba manual correspondiente.

- [ ] **Reescribir la intro de cada carrera nueva de Teclab** desde su página oficial (`teclab.edu.ar/carrera/<slug>/`). No copiar frases: tomar datos y vocabulario de búsqueda. La intro abre con «Estudiá <tema> a distancia», nombra temas y herramientas concretos y termina con la salida laboral, porque `partirDescripcionTeclab` la separa. Última revisión: 09/10/2026, con las 16 vigentes reescritas; Seguros suma la matrícula de PAS sin examen. Venta Directa y el curso de IA quedaron afuera.

## Por calendario

Todavía no hay una frecuencia mensual confirmada para estas tareas. Cuando se defina una, va en esta sección con su periodicidad y la fecha de la próxima revisión; no se inventa una cadencia.

## Revisiones recurrentes sin frecuencia acordada

- [ ] **Revisar la oferta oficial de Teclab para detectar carreras nuevas.** Si Teclab publica una, crear un pendiente puntual para darla de alta y recorrer `docs/alta-de-carrera.md`; no confundir revisar si apareció con hacer el alta.

- [ ] **Auditar el contenido publicado.** Ejecutar `npm run auditar` y resolver o registrar faltantes de carreras, planes, imágenes OG, materias, novedades y FAQ. Aplicar `esCarreraVisible()` a cualquier lectura nueva de `carreras` antes de publicar cambios.

- [ ] **Renovar `precios_privados`.** La actualización corre de madrugada. Entre el vencimiento y esa corrida hay una ventana sin precios vigentes en la que `mail-precio` responde `sin-precio-vigente` y el newsletter no encuentra candidatas. **Es esperado**: no es una caída del sitio ni un precio faltante.

- [ ] **Controlar leads y canales.** Revisar consultas recibidas, clics de WhatsApp y el embudo de `npm run leads`; verificar que el número de WhatsApp, los formularios y los avisos por Telegram sigan funcionando. Para avisos, mirar `net._http_response`: un formulario que responde `201` no confirma que Telegram haya recibido el mensaje.

- [ ] **Seguir el piloto de RSP y exámenes libres de Teclab.** Revisar las comunicaciones oficiales para confirmar si sigue vigente y si cambian carreras, materias, requisitos o circuito. Confirmar los puntos por definir y actualizar `ventas/procesos-teclab.html` con fuente y fecha. Última revisión de la presentación: 05/11/2026; vigencia del piloto sin confirmar.

- [ ] **Revisar el diseño de las fichas de Teclab (`/carreras/<slug>`).** Ya aplican el sistema de `piezas_teclab`: paleta, Poppins, hero, bloques de datos en color, plan, formularios, navbar, pie, scroll y flecha. Las mejoras no están definidas; preguntar antes de tocar nada. `/teclab`, `/teclab/inscripcion`, `/carreras/<slug>/inscripcion` e `/inscripcion/<codigo>` ya están hechas (commit `d73a904`). [Detalle](../odd/tasks/rediseno-paginas-teclab.md). Última revisión: 09/10/2026.

El recordatorio `/api/recordatorio-teclab` avisa por Telegram los lunes a las 9:00 sobre diseño e intros de fichas vigentes que aún no tienen intro nueva; no recuerda el piloto de RSP.

## Seguimiento permanente de indexación y rendimiento

La antigua tarea 13 del backlog continúa acá: no se cierra con una revisión. Se revisa tras altas de carreras o cambios de contenido y durante las revisiones de mantenimiento; registrar la fecha, las URLs revisadas, los resultados y cualquier limitación de acceso o medición.

- **Indexabilidad pública:** ejecutar `npm run smoke` y comprobar respuesta directa `200`, canónica, permisos de rastreo/indexación y presencia de las URLs y `lastmod` esperados en el sitemap. Estas comprobaciones no demuestran que Google haya indexado una página.
- **Indexación y tráfico en Google:** ejecutar `npm run seo`, comparar con [el registro de indexación](indexacion.md) y el informe anterior; revisar Search Console (cobertura, páginas excluidas, consultas, CTR y posiciones). Si no hay acceso, dejar esa parte pendiente sin inferir el estado a partir del sitio público.
- **Rendimiento de carga:** distinguir mediciones de laboratorio de datos de usuarios reales; registrar herramienta, fecha, URL, dispositivo y condiciones para poder comparar. El peso del HTML o el tiempo de una petición aislada no prueban la experiencia de carga. Mantener `inlineCss` conforme a los criterios vigentes: no apagarlo sólo para reducir el peso del HTML.

Los problemas concretos que aparezcan vuelven a [Pendientes](../PENDIENTES.md) con su evidencia; esta rutina sigue vigente. No agrega automatizaciones ni duplica la vigilancia de producción existente.

## CSS de la home al actualizar Next

Retirada el 17/10/2026. No hace falta remedirla en cada actualización. [Causa y medición](historial-pendientes.md#css-de-la-home--tercera-copia-cerrada-17102026).
