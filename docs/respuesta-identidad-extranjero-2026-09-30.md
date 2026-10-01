# Identidad Argentina: cursar desde el extranjero

Revisión cerrada el 30/09/2026. Alcance exclusivo: respuesta `extranjero` del bot de Academia Identidad Argentina. No cambia requisitos de Siglo 21 ni Teclab.

## Fuentes y criterio

- El usuario confirmó el 30/09/2026 que la documentación argentina no es requisito para este caso de inscripción en Academia Identidad Argentina.
- Modalidad: contexto existente por programa; Gestión de Equipos cursa por Innova Virtual aunque la API diga «Híbrido». Cursada virtual y grabaciones confirmadas el 09/08/2026.
- Pagos: resumen comercial local DEPC generado el 28/08/2026, opciones del campo `lstmedios`. Siete programas enumeran Western Union y PayPal. Ciberseguridad Aplicada no los enumera: consulta opciones sin prometer esos medios. No se incluyen precios ni enlaces comerciales privados en este documento.
- El marcador de pagos se deriva por programa mediante la normalización ya usada para cronogramas; respeta la vigencia de 60 días del resumen. Con fuente vencida o ausente se usa la respuesta general.
- Se retiró la promesa de que la diferencia horaria «no es un problema» y la inferencia de reconocimiento en el país de destino. Se informa horario argentino y grabaciones sin garantizar exención de asistencia.

## Verificación

- RED: la prueba nueva falló por ausencia del marcador antes de implementar.
- GREEN: `node --test herramientas/ventas/tests/*.test.mjs`: 288/288.
- Auditoría institucional: sin errores; tres avisos preexistentes de intenciones no aplicables a Teclab.
- Prueba del motor con «vivo en el extranjero» en los ocho contextos reales generados: 8/8; Ciberseguridad no menciona Western Union ni PayPal. Esta consulta inicialmente seleccionaba modalidad; se agregaron ejemplos de residencia a la intención extranjera y una regresión.
- Ambos generadores ejecutados con `--descuento-beneficio 10`, sin forzar promoción. Código de salida 0 y 70 respuestas de Identidad en cada página.
- El buscador conserva el aviso de que CASA no trae promociones de 2A; genera 2B sin forzar datos. No se actualizaron precios.
- `npm run check`: lint, typecheck y 114/114 pruebas, código de salida 0.

## Entrega y reversión

Sin commit, push, deploy ni publicación del buscador. Los archivos comerciales y HTML continúan ignorados por Git. Para revertir esta unidad: retirar el marcador `pagosInternacionales`, su helper, los ejemplos y variantes de esta intención, su prueba y regenerar ambas páginas; no revertir otras tareas del árbol de trabajo.
