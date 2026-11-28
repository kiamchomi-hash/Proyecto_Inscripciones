# Respuestas multitema de Siglo 21

Objetivo: contestar consultas con varios temas en un mensaje, sin enumerar combinaciones ni cambiar otras instituciones.
Alcance: motor, corpus Siglo 21, dos generadores y pruebas comerciales privadas. Publicación autorizada del snapshot; sin commit ni push.
Ruta: delegada, lectura preparatoria e implementación coordinada.
Estimación: 250 líneas de fuente y pruebas; HTML generado excluido. Estrategia: ask-on-risk.

- [x] T1 detectar segmentos e intenciones del corpus, conservar consultas simples y ambigüedad.
- [x] T2 componer variantes aplicables, sin saludos duplicados ni notas internas; integrar ambas páginas.
- [x] T3 observar RED/GREEN, suite comercial, auditoría, regeneración, check y diferencias.

Criterios: orden de consulta, deduplicación, filtros de contexto y vigencia, respaldo sin inventar, una copia multitema.
Comprobaciones: pruebas focalizadas y completas, auditoría institucional, ambos generadores con beneficio 10, npm run check, git diff --check.
## Evidencia
RED: responder no existía, 1 prueba fallida. GREEN final: 16/16 pruebas nuevas; 99/99 focalizadas; 349/349 suite comercial; npm run check 305/305. Ambos generadores exit 0 con beneficio 10; git diff --check exit 0. Auditoría exit 1 por dos problemas preexistentes de Teclab, no modificados.
Motor serializado validado. Pruebas incluyen tres temas, cinco temas, orden inverso, repetición precio/aranceles, idiomas/TP/parciales, contexto grado/pregrado/ciclo, vencimiento, desconocidos, recordatorios y corpus sintético extensible.
Teclab SHA256 42e0be8d2b68bf61e2d67bc9dcf068691e4387a4c906dcf7406a1f9e7a504c8c; Identidad bd5c6e1c8b5db7f5bd0c78590415801810adc936d91bf6d13c2b6858e4b19bce. No escritos, salidas del motor iguales a elegir para otras casas.

## Decisiones y límites
responder es opt-in del corpus y elegir conserva las alternativas existentes. Segmentar por preguntas, saltos, comas y conjunciones, preferir ejemplos literales para evitar colisiones de sinónimos, y resolver cada segmento usando todo el corpus. consultasBreves permite listas sin separadores; se cargaron ocho familias frecuentes y ventajas académicas, sin combinaciones prearmadas. Las demás intenciones participan mediante sus preguntas existentes. Empates y desconocidos piden aclaración; faltantes no envían marcadores. No implica comprensión lingüística universal: una consulta sin separadores ni señales presentes en el corpus puede seguir ofreciendo alternativas.
textoCompuesto contiene fragmentos explícitos sin cierres comerciales repetitivos. Las condiciones y advertencias se conservan. Recordatorios separados del texto copiado. La composición no se vota ni edita como intención inexistente en el entrenador.

## Pendiente
Revisión independiente completada con cinco hallazgos resueltos y regresiones verificadas. Publicación completada por la API del buscador. Commit no realizado; los cambios comerciales permanecen ignorados, sin force-add. La función se valida en buscar_carreras; no requiere una prueba de WhatsApp. Mirror Engram a cargo del padre.

## Corrección adversarial acotada
Cinco casos fallaron RED: estudiar y trabajar inventaba salida laboral; beneficios académicos con modificadores caía en modalidad; 2027 cotizaba 2026; examen ambiguo se respondía como cursada/parcial; precio y cuotas duplicaban financiación.
GREEN 16/16 nuevas, 99/99 focalizadas y 349/349 comerciales después de corregir causas. Proteger conjunciones internas presentes en ejemplos y priorizar coincidencias literales; consultas breves compuestas prevalecen sobre señales débiles. Metadata anioAranceles permite rechazar importes de otro año aunque el contexto diga vigente. Metadata aclaracionesConsulta pregunta el tipo de examen si faltan parciales/finales/EFIP. variantesCompuestas con siTemas elimina redundancia precio/cuotas preservando la advertencia del ciclo y condiciones de tarjeta/banco. No se agregan combinaciones de intenciones ni limpieza destructiva al copiar.
Ambos generadores final exit 0; corpus de otras casas SHA256 idénticos. Los cinco hallazgos de revisión independiente quedaron resueltos; prueba focalizada repetida 16/16 antes de publicar. No hace falta una prueba de WhatsApp para validar la función del buscador.

## Teclab (27/11/2026)
Lead real de Data Science: pidió en un mensaje "más información de la carrera" + horarios + arancel + plan. Teclab no tenía la composición habilitada y el motor no separaba por punto, así que ganaba `pide-todo` y los horarios y el plan se perdían.
- Motor: el punto final de oración separa preguntas; el saludo pegado al principio no arrastra la primera; un segmento que repite un ejemplo de una intención `noComponer` no agrega un tema derivado (pedir "la carrera tecnicatura superior" no es tener un título terciario).
- Corpus de Teclab: `multitema:true`, `anioAranceles:2026`, `aclaracionesConsulta`, `noComponer` en pide-todo, modalidad-y-precio, saludo, saludo-formal, info-general, seguimiento, no-entiendo y retomar-contacto; `tema:'precio'` y `consultasBreves`; `textoCompuesto` en precio-teclab-detalle, horarios-teclab y enviar-ficha-teclab-plan, con una variante para cuando el mensaje ya pide cuotas.
- Pruebas: 18/18 en `respuesta-compuesta.test.mjs`; `npm run check` 344/344 con Node 24. Tres pruebas de `herramientas/ventas` fallan sin relación con el motor (preexistentes). La auditoría institucional sigue con sus 3 problemas anteriores.
- PENDIENTE: publicar `ventas/buscador-carreras.html` con el flujo comercial (`herramientas/ventas/publicar-buscador.mjs`), sin tocar precios.
- Revisión independiente (GLM-5.3 de Go, no es otro proveedor): tres hallazgos resueltos. `gracias por la info` pegado a una pregunta se colaba como tema basura en Siglo 21 y Teclab (se evalúa antes de sacar la cortesía, y si queda una sola pregunta se contesta esa con `elegir`); la fecha de inicio se duplicaba cuando el mensaje pedía precio y fechas (sale del texto compuesto del precio: la aporta su propio tema); el comentario de la separación por punto decía que "S.A." no se cortaba, y sí se corta. `siTemas` de `variantesCompuestas` exige **todos** los temas (es un AND): para desactivar una línea ante cualquiera de varios temas hay que declarar una variante por tema, no una lista.

## Publicación verificada
- [x] T4 publicar solamente el snapshot comercial por `herramientas/ventas/publicar-buscador.mjs`, sin push, SQL ni actualización de precios.
Una única petición PUT a `https://www.siglo21sur.com/api/admin/buscador` respondió HTTP 200. Metadata: actualizado `2026-10-03T23:50:12.563Z`, generado `2026-10-03T23:37:59.857Z`, 95 carreras (70 Siglo 21 y 25 externas), 2145217 bytes, período 2B, promoción hasta 4/10/2026. SHA256 local enviado: `749ca617020d28a8c44a433aa772c6508875128f6269cc404c23d2a6e851fd7e`. El HTML contiene `bot.responder`, `anioAranceles`, `aclaracionesConsulta` y `variantesCompuestas`. Test focalizado repetido: 16/16. La respuesta del endpoint confirma publicación; no se hizo una lectura autenticada independiente del HTML remoto. El entrenador sigue siendo local, sin endpoint de publicación.
