# Descuentos de precios 2027

## Objetivo y alcance autorizado
Aplicar las promociones verificadas del pendrive por carrera y período al buscador local. Ofrecer únicamente 1A y 1B de 2027 y conservar el proceso y los mensajes de 2026 para reutilización. No publicar, desplegar ni modificar financiación.

## Tareas
- [x] T1: seleccionar y validar promociones por carrera/período y conservarlas sólo con la misma fuente e identidad. **Cerrada el 16/10/2026:** verificación GREEN (6/6 focales) y buscador regenerado con 70 cotizaciones 2027 el 15/10/2026 (ver `estado-actualizacion-precios-2027.md`).
- [x] T2: importar las verificaciones compatibles, regenerar el buscador y comprobar importes. **Cerrada el 16/10/2026:** verificación GREEN (6/6 focales) y buscador regenerado con 70 cotizaciones 2027 el 15/10/2026 (ver `estado-actualizacion-precios-2027.md`).
- [x] T3: mostrar sólo 2027 y conservar el flujo anterior sin exponer precios 2026. **Cerrada el 16/10/2026:** verificación GREEN (6/6 focales) y buscador regenerado con 70 cotizaciones 2027 el 15/10/2026 (ver `estado-actualizacion-precios-2027.md`).

## Ruta y estrategia
Ruta delegada: varios archivos de lógica. Pronóstico: 220 líneas propias, salidas generadas excluidas. Estrategia ask-on-risk. Sin commit: material comercial ignorado que no debe incorporarse al repositorio público.

## Aceptación y controles
Pruebas RED/GREEN sobre vigencia, porcentajes, identidad y conservación al refrescar; suite local ventas; generación sin red; sintaxis; navegador local sin red. Importes esperados definidos en el snapshot y las pruebas comerciales locales, excluidos de este documento. No extender fechas ni descuentos a otras carreras.

## Reversión
Restaurar únicamente herramientas/ventas/precios-lista-2027.mjs, extraer-precios-2027.mjs, generar-buscador.mjs, sus pruebas autorizadas, ventas/precios/2027/precios-lista-1-2027.json y ventas/buscador-carreras.html. No tocar fuentes ni mensajes 2026.

## Progreso
Exploración: el workbook del ZIP es idéntico byte a byte al local; sólo se importan las verificaciones compatibles del snapshot privado. CodeGraph no indexa scripts comerciales ignorados; lectura directa acotada.

## Evidencia de ejecución
T1 implementada: promoción exacta por carrera/período, fecha y porcentajes validados, fechas de Argentina. Refresh retiene verificados sólo ante workbook idéntico, identidad igual e importes iguales; guarda SHA256. RED observado: promoción válida esperada, resultado null. GREEN: 13/13 pruebas extractor/promociones/cotización.
T2 implementada: importadas únicamente verificaciones compatibles y validadas del snapshot privado, sin extender alcance ni vigencia. Generación local exitosa sin red; importes esperados confirmados. Aviso heredado de generación: 2A ausente por promociones incompletas en archivo anterior (2026), no impide 2027.
T3 implementada: selector sólo 2027, 1A/1B; mensajes y tablas anteriores archivados sin exposición. Bot bloquea precios 2026. Navegador vuelve a comprobar vigencia al mostrar y copiar.
Sintaxis: seis módulos JS comprobados. Suite completa sandbox: 399 pruebas, 395 pasan, 4 fallan (dos Chromium bloqueado por sandbox, taxonomía distinta del sitio, subprocess Identidad con salida 1 en lugar de 7). Pruebas de catálogo/beneficios focales: 12/12 antes de la prueba adicional de fecha.
Estado: comprobación independiente de navegador/capturas y suite fuera del sandbox pendiente del coordinador. Sin commit, push ni red; no marcar tareas completadas hasta esa comprobación. Los valores comerciales concretos permanecen únicamente en archivos locales ignorados, no en este documento.

## Corrección de verificación
El verificador observó RED por timeout del caso de prioridad en vivo: el test pulsaba el ciclo ya seleccionado y no solicitaba la cotización. Se corrigió únicamente el test para pulsar «Consultar precio de 2027», sin alterar el comportamiento del producto. GREEN observado fuera del sandbox, sin red externa: node --test --test-isolation=none herramientas/ventas/tests/precios-lista-2027-buscador.test.mjs, 6/6 pruebas pasan. Sintaxis del test correcta.
Se retiraron importes concretos y valores específicos de promociones de este documento; las expectativas comerciales siguen en el snapshot y pruebas locales ignoradas. No hubo commit ni publicación.

## Ajuste de presentación solicitado
Restaurado el estilo de los mensajes de precios 2026 en la oferta 2027: encabezado de carrera y modalidad, emojis por concepto, nombres de bimestres, total en negrita, bloque separado de descuentos por concepto, vencimiento y cobertura. No se anuncia financiación no verificada ni se incluyen notas internas en el mensaje para el aspirante. Se mantienen las mismas fuentes e importes por período y la prioridad de la consulta verificada en vivo.
Ruta delegada: lectura del formato conservado y edición acotada del generador y sus pruebas. RED observado en navegador por encabezado sin el estilo esperado; GREEN final: 6/6 pruebas focales, con red bloqueada. Generación sin red y sintaxis de generador/prueba correctas. Captura local revisada. Aviso heredado 2026 durante generación: falta tabla concluyente de promociones 2A; no afecta la oferta 2027. Sin commit ni publicación.
