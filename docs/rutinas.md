# Rutinas de mantenimiento

Estas revisiones se repiten; no son tareas que puedan cerrarse para siempre. No se crea ni modifica ninguna automatización con esta lista.

[Volver a los pendientes](../PENDIENTES.md).

Estas tareas no se cierran: se vuelven a marcar cada vez que corresponde y se anota la fecha de la última revisión. Si una revisión encuentra un problema concreto, ese problema pasa a `## Abierto` con su propio detalle.

- [ ] **Actualizar las novedades del sitio.** Revisar si hay noticias, fechas, aperturas, cambios de oferta o información institucional nueva; cargar o corregir `novedades`, generar la imagen OG del artículo y comprobar que aparezca en la página, el sitemap y la navegación.

- [ ] **Revisar y mantener el corpus del bot.** Leer conversaciones reales y respuestas dudosas, confirmar cada dato contra su fuente vigente, corregir el corpus de la casa correspondiente y regenerar siempre las páginas de entrenador y buscador. No aprobar una respuesta sólo porque suena bien: verificar especialmente precios, fechas, modalidad, requisitos, cuotas y documentación.

- [ ] **Revisar indexación y rendimiento SEO.** Ejecutar `npm run seo`, comparar con `docs/indexacion.md` y el informe anterior, revisar Search Console (cobertura, páginas excluidas, consultas, CTR y posiciones) y dejar registradas las conclusiones. Después de cambios de contenido, comprobar también `npm run smoke` y que el sitemap tenga las URLs y `lastmod` esperados.

- [ ] **Auditar el contenido publicado.** Ejecutar `npm run auditar` y resolver o registrar los faltantes de carreras, planes, imágenes OG, materias, novedades y FAQ. Aplicar `esCarreraVisible()` a cualquier lectura nueva de `carreras` antes de publicar cambios.

- [ ] **Actualizar fuentes comerciales cuando cambien.** Revisar los dashboards y comunicaciones oficiales de Siglo 21, Teclab e Identidad Argentina; actualizar precios, cuotas, fechas, financiación, modalidad y oferta sólo con fuente verificable. Regenerar los artefactos derivados y correr los tests de ventas.

- [ ] **Controlar leads y canales.** Revisar consultas recibidas, clics de WhatsApp y el embudo de `npm run leads`; verificar que el número de WhatsApp, los formularios y los avisos por Telegram sigan funcionando. Para avisos, mirar `net._http_response`: un formulario que responde `201` no confirma que Telegram haya recibido el mensaje.

- [ ] **Revisar producción después de cada deploy o cambio sensible.** Ejecutar `npm run smoke` y, cuando corresponda, `npm run seo`; comprobar rutas, redirects, cabeceras, noindex del admin, sitemap, formularios y panel. Si se toca CSP, secretos, triggers o Edge Functions, seguir además el procedimiento documentado y hacer la prueba manual correspondiente.

## CSS de la home al actualizar Next

- [ ] **Al actualizar Next, remedir las copias de CSS sin apagar `inlineCss`.** Última revisión: 30/09/2026, tres apariciones, anomalía abierta. Next local sigue en 16.3.3; no se modificó el framework. [Evidencia actual](medicion-css-home-2026-09-30.md) y [contexto original](pendientes-detalle.md#pendiente-02). Es un seguimiento condicionado a una actualización, no un arreglo terminado.
