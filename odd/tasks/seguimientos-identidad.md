# Seguimientos de Academia Identidad Argentina

## Objetivo y alcance
Completar el pendiente 14 con dos mensajes manuales de recontacto para Identidad, accesibles en el buscador local. Teclab ya tiene ambos seguimientos. Sin diseño, envío automático ni publicación.

## Restricciones
Corpus de Identidad únicamente; presentar la institución y carrera, sin precios, fechas, cupos ni urgencia inventada. Preinscripción asistida, no autoservicio. No modificar Siglo 21, Teclab, fuentes ni precios. Preservar staged FAQ y cambios ajenos; archivos comerciales gitignorados no se fuerzan a git.

## Tareas
- [x] T1: Prueba RED, incorporar dos mensajes y verificar GREEN. Ruta delegada por preparación y escritura multiarchivo.
- [ ] T2: Verificar suite comercial, auditar y regenerar ambos HTML locales; comprobar mensajes y aislamiento entre casas.

## Comprobaciones
node --test herramientas/ventas/tests/mensajes-identidad.test.mjs; node --test herramientas/ventas/tests/*.test.mjs; auditoría institucional; ambos generadores con --descuento-beneficio 10, sin --promocion. Registrar fallos ajenos sin ocultarlos.

## Entrega
Previsión menor a 200 líneas; ask-on-risk. Sin push, envío o publicación. Trabajo comercial ignorado queda local; commits sólo si política permite y sobre archivos propios, nunca incluir staged FAQ anterior ni forzar privados. Documentación y estado se actualizan con evidencia.

## Próximo paso
Resolver o aceptar los dos problemas preexistentes del auditor de Teclab; no se modificaron en este alcance.

## Evidencia observada
T1: RED observado: faltaban retomar-panel y retomar-panel-2; GREEN: 6/6 pruebas nuevas. Dos mensajes añadidos sin alterar seguimiento (respuesta a «lo pienso»). Primer seguimiento recuperable mediante consultas del asesor; segundo manual, sin preguntas para el motor. Ambos exigen carrera.
T2 parcial: suite comercial 380/380, ambos generadores con --descuento-beneficio 10 salieron 0 y contienen ambos mensajes. Sin --promocion. Hashes de corpus Teclab/Siglo 21 iguales antes/después. Auditoría sale 1 por dos problemas preexistentes de Teclab (cuando-empieza-teclab-curso e inscripcion-abierta-teclab-curso), idénticos en la base; tres avisos estructurales sin cambios. No hay problemas nuevos de Identidad.
No commit, stage, push, native review ni envío: corpus, tests comerciales y HTML gitignorados; no se fuerza contenido privado. Staged FAQ ajeno preservado.
