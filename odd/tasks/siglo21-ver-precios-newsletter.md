# Siglo 21: precios 2027 y preinscripción

## Acuerdo del 14/10/2026
CAU VLG01 confirmado por el usuario y validado por el extractor y el integrador. La decisión sobre la fecha de vigencia queda para la tarde, junto con la autoinscripción. No volver a bloquear la conversación pidiendo la fecha ahora; mantener sin publicar los precios privados hasta resolverla.

## Objetivo y alcance autorizado
Replicar el flujo de Teclab para consultar matrícula, bimestre 1 y bimestre 2 de 2027 de Siglo 21; habilitar newsletter y enlazar el formulario de preinscripción desde el sitio y los correos. Autoinscripción excluida y pendiente para la tarde del 14/10/2026.

## Restricciones
- Preservar los cambios ajenos existentes, especialmente el endpoint y casas.ts.
- Importes comerciales sólo en archivos privados ignorados; sin credenciales ni ejecución remota autorizadas.
- No confundir lista con promociones ni inventar vigencias.
- Política específica del proyecto: main, sin ramas/PR; no commit ni push sin pedido explícito.

## Tareas
- [ ] S1 Integrar consulta de precios y preparación privada local de los tres aranceles 2027. Ruta delegada: lectura preparatoria y varios archivos no triviales.
- [x] S2 Integrar newsletter, correos por casa y página de preinscripción sin autoinscripción. Ruta delegada: varios archivos no triviales.
- [ ] S3 Verificar pruebas y capturas escritorio/celular; registrar limitaciones de publicación. Ruta delegada: ejecución de checks.

## Aceptación y comprobaciones
Pruebas deterministas RED/GREEN cuando corresponda; pruebas de precio, mail, newsletter y página; npm run check. Capturas a 1280 y 375 px sin envíos reales. Teclab no debe sufrir regresiones. Publicación de precios privados y deploy pendientes de autorización remota.

## Entrega y progreso
Estimación: 500–800 líneas propias, estrategia single-pr adaptada a la política sin PR del proyecto; cambios locales sin publicar. Revisión nativa habilitada por defecto, consentimiento por candidato pendiente cuando corresponda.
Estado: implementación local del flujo y correos terminada; publicación y capturas pendientes. Fuente de lista verificada localmente: cotizable:false es contrato de lista, no un error del extractor.
Siguiente paso: implementación delegada y comprobaciones locales.


### Evidencia del trabajador
- S1: consulta habilitada para Siglo 21 y exportador privado local creado. Usa `integrarLista2027` sin beneficios/promociones; exporta matrícula, bimestre 1 y bimestre 2 de 2027. No se generó un export real porque falta el export local de carreras con ids, y no se autorizó consultar la base. El esquema local `sql/2026-10-02_precios_carrera.sql` exige `vigente_hasta NOT NULL`; la fuente no declara vigencia. Sin fecha confirmada el preparador devuelve `publicable: false`. Prueba sintética ejecutada: tres conceptos, bloqueo sin vigencia, fecha válida/fecha imposible, todas las aserciones pasaron.
- S2: modal con slides y modal sin slides comparten el panel de precio; el resultado y los accesos enlazan la página dedicada. Página filtrada por casa y taxonomía visible. Siglo 21 usa formulario propio y próximos pasos de contacto manual. Mail separado por institución, sin financiación, promo ni calendario de Teclab. Newsletter amplía casas y mantiene baja y cadencia semanal. Autoinscripción sin cambios, pendiente en PENDIENTES.
- RED observado: `node --test --test-isolation=none tests/mail-precio.test.mjs tests/ver-precio.test.mjs` falló en las nuevas aserciones (asunto Abogacía decía Teclab y carreraConPrecio Grado devolvía false) antes de implementar.
- GREEN final: `node --test --test-isolation=none tests/carreras-faq.test.mjs tests/teclab-proximamente.test.mjs tests/ver-precio.test.mjs tests/mail-precio.test.mjs tests/newsletter-envio.test.mjs tests/inscripcion-pagina.test.mjs`: 93 pruebas, 93 aprobadas.
- `npm run check`: lint 0 errores y 28 advertencias; typecheck aprobado; el runner aislado reportó 53 archivos aprobados y 4 fallidos (`deploy`, `pre-push`, `secretos`, `supabase-local-safety`) con salida `test failed` sin diagnóstico. La corrida alternativa no aislada mostró errores de subprocess con salida vacía en esos mismos scripts. No se modificaron por estar fuera del alcance.
- No se ejecutó formatter mutante: el proyecto no declara uno; lint y typecheck no mutan fuente.
- Capturas no realizadas por el trabajador; pendientes de verificador con harness local y respuestas mock, sin envíos reales.
- Se preservó el diff previo de casas.ts; el cambio propio es CASAS_CON_PRECIO y su comentario. No se tocó el endpoint de formularios ni sus tests ajenos.
- Sin commit, push, carga remota, lectura de credenciales ni mails reales.

Siguiente paso: verificación independiente/capturas, confirmar vigencia y export local con ids antes de publicar precios privados y deploy autorizado. No declarar end-to-end publicado.

### Verificación independiente y cierre local
- S3 comprobaciones locales completadas: suite enfocada 93/93; npm run check 439/439, typecheck aprobado, lint 0 errores/28 advertencias. Los cuatro grupos fallidos dentro del sandbox aprobaron 51/51 fuera de él: EPERM ambiental confirmado.
- Spot check del coordinador: tests/mail-precio.test.mjs 21/21 y git diff --check aprobado.
- Capturas locales con componentes/página/CSS reales, datos sintéticos y tráfico remoto bloqueado: seis imágenes temporales de modal, carrusel y página a 1280/375 px; sin errores JS ni overflow. Mostradas en chat. No incluyen shell global/captcha real y no prueban publicación end-to-end.
- Revisión nativa no disponible: STATUS falló antes de mutar con operation_failed y causa read-only file system. No se creó autoridad ni se reclamó aprobación; sin reintentos ni operaciones de recuperación.
- S1 permanece parcial: fuente extraída correctamente pero falta export real con ids, vigencia confirmada y autorización para carga remota. S3 permanece pendiente sólo respecto del flujo publicado.
- Sin commit ni push. Próxima decisión: confirmar hasta qué fecha rige la lista 2027 antes de preparar publicación.


### Autorización de deploy
El usuario autorizó commit de los cambios propios en main y push a origin main para disparar Vercel producción, usando la sesión Git configurada. No autorizó publicar datos en Supabase ni enviar mails reales. Se verificará el candidato exacto del index por separado, sin los cambios ajenos del working tree. Revisión nativa continúa no disponible; no hay aprobación inventada. Carga de precios sigue pendiente de vigencia confirmada y export con ids.
