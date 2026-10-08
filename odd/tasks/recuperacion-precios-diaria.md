# Recuperación de precios diaria

## Objetivo y alcance
Corregir automatización local: reintento 14h inexistente, recuperación tras interrupción y lock Teclab. La corrección inicial fue local; el usuario autorizó después la extracción, publicación habitual y reactivación completa de las tres casas. Archivos comerciales permanecen ignorados. Política del proyecto: main, sin ramas; commit y push de todos los cambios versionables autorizados el 08/10/2026.

## Tareas
- [x] T1 Reparar timer y recuperación segura; corregir propiedad del lock; probar sin portales ni publicación.

## Ruta y controles
Delegada por preparación y cambios no triviales en varios archivos. RED/GREEN: tests Node del programador y unittest de lock. Regresión actualizacion-segura; npm run check; verificación systemd sin ejecutar servicio.

## Entrega
ask-on-risk; estimación 200-350 líneas. Commit y push autorizados. Sólo se versiona este registro: scripts comerciales y unidades locales quedan fuera de Git.

## Progreso
Investigación completada: corrida 08/10 interrumpida 09:02; reintento apunta a script inexistente; release de lock puede borrar lock ajeno.

## Implementación local y evidencia
- Programador: consulta de calendario cada 15 min con `ExecCondition`, turnos de 09h/14h y estado privado atómico. Sólo repite corrida sin cierre; éxito diario no repite; fallo cerrado espera 14h y no vuelve a correr tras ese turno. SIGTERM/KILL por parada conserva pendiente; timeout cierra como fallo.
- Lock Teclab: bloqueo del kernel sobre archivo persistente (`flock` Linux / byte Windows), sin borrar archivo ajeno; `release(None)` no modifica nada.
- RED observado: export de decisión ausente en Node; Python fallaba al liberar sin propiedad y al recuperar archivo dejado por proceso muerto. GREEN: 5/5 tests programador, 2/2 lock; regresión actualizacion-segura 18/18.
- Units respaldadas fuera repo en `~/.local/state/cau-precios-respaldo-20261008-124502`; instaladas service/timer nuevas, `systemd-analyze --user verify` sin errores; calendario válido. `daemon-reload` realizado; timer obsoleto disabled/inactive.
- Principal mantiene enabled, pero quedó inactive en esta sesión: no existe estado inicial y `Persistent=true` podría lanzar extracción/publicación al activarlo. Próxima sesión de usuario lo inicia normalmente. No se arrancó servicio ni coordinador ni extracción ni publicación.
- `npm run check`: exit 0; lint (28 warnings, 0 errores), typecheck y 366/366 tests completados. No commit/stage/push.
- `ExecStopPost` sólo cierra el intento si coincide el `INVOCATION_ID`: una condición omitida no consume ni altera el intento previo. RED/GREEN adicional observado para ese caso.
- Estado inicial: T1 permaneció abierta hasta comprobación independiente y reactivación; ambas se completaron posteriormente.

## Recuperación ejecutada el 08/10/2026
- Autorización posterior: extracción inmediata de Siglo 21 y Teclab con sesiones guardadas y publicación habitual del buscador; sin actualización remota de Identidad ni push.
- Siglo 21: `planilla-precios-siglo21.mjs --descuento-beneficio 10 --descargar` exit 0, 73 carreras, período 2B; descargado 08/10/2026 12:57 ART, vigencia oficial hasta 09/10/2026.
- Teclab: pipeline Python exit 0, 18 programas y 78 archivos actualizados; extraído 08/10/2026 12:54 ART, vigencia oficial hasta 08/10/2026. Calendario y `extraer-externos.mjs --solo-teclab` exit 0.
- Ambos generadores exit 0. Publicación `publicar-buscador.mjs` confirmada por servidor 08/10/2026 12:58:29 ART: 95 carreras, período 2B. Las tres fuentes locales quedaron vigentes, Identidad conserva extracción previa del 07/10.
- Avisos reales conservados: período 2A omitido por ausencia de tabla de promoción; divergencias de financiación del simulador Teclab (manda placa oficial).
- Timer continúa habilitado/inactivo: activarlo sin estado completo dispararía coordinador de tres casas; no se registra un éxito ficticio del coordinador tras ejecutar sólo dos fuentes. Reactivación pendiente de alcance autorizado.
- Sin commit, stage, push, modificación de fechas manual ni publicación de precios privados en base.

## Reactivación completa verificada el 08/10/2026
- Usuario autorizó activar la tarea completa, incluida Identidad y la publicación habitual del coordinador.
- `systemctl --user enable --now cau-precios.timer`: exit 0; timer enabled/active. Su recuperación persistente disparó una sola ejecución a las 13:01:48 ART, sin ejecución manual duplicada.
- Coordinador de tres casas terminó a las 13:06:31 ART: `Result=success`, `ExecMainStatus=0`; Teclab, Identidad, Siglo 21, precios privados Teclab, calendarios, archivos externos, buscador, bot y publicación habitual informaron listo.
- Estado real persistido: fecha 2026-10-08, turno 9, cerrado true, exito true. No se escribió ningún éxito manual.
- Precios comprobados vigentes: Siglo 21 hasta 09/10/2026; Teclab hasta 08/10/2026; Identidad actualizado 08/10/2026 13:05:44 ART.
- Próxima consulta del timer 08/10/2026 13:15 ART; el éxito diario omite nuevas extracciones hoy. Próxima extracción regular 09/10/2026 09:00 ART; reintento 14:00 ART si falla, recuperación tras interrupción en la próxima consulta.
- Timer obsoleto `cau-precios-siglo21.timer` sigue disabled/inactive. No hubo commit/stage/push.
- T1 completada: servicio real cerrado con éxito y automatización activa. Verificación independiente de código sin bloqueantes, 23/23 tests Node, 2/2 Python y verificación de unidades exit 0; Windows sólo revisión estática.
