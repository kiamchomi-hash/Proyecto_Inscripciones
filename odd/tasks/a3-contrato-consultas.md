# A3-C1: contrato del armado de consultas

## Objetivo

Tipar campo, columna y valor de las tres filas de consultas (consulta, precio y
autoinscripción), sin alterar payloads, validaciones tolerantes ni escrituras.
Usuario autorizó continuar la auditoría y usar Astra. Sólo trabajo local.

## Estado y límites

A3-D1 ya está integrada: ad52917 y 3ca9614 son ancestros de HEAD4018a3b.
Su nota del 02/10 sobre falta de commit es histórica; no acredita revisión nativa.
Preservar odd/tasks/descuentos-precios-2027.md, ajeno a esta unidad.
No tocar UI, esquema generado, permisos, datos, dependencias ni columnas nuevas.
No ejecutar build, regeneración de tipos ni operaciones remotas.

## Tarea y aceptación

- [ ] A3-C1: definiciones correlacionadas y filas TablesInsert, contratos negativos,
  regresiones de payload y documentación.
  Ruta delegada: nuevos contratos compartidos y múltiples archivos no triviales.
  Sin any, casts amplios ni setters que admitan columna/valor incompatibles.
  casas.ts conserva la única declaración de columnas.
  RED: checkbox/email, texto/equivalencias e id prohibidos deben producir TS2578
  con las expectativas negativas antes de la corrección; después GREEN.

## Verificación

- npm run typecheck
- node --test tests/formularios-api.test.mjs tests/formularios.test.mjs tests/security.test.mjs tests/newsletter.test.mjs tests/ver-precio.test.mjs tests/autoinscripcion.test.mjs tests/enlace-inscripcion.test.mjs tests/preinscripcion-proximamente.test.mjs
- npm run check
- git diff --check
- RLS y build remotos fuera de alcance.

## Entrega

Estimación: 250 líneas propias. Estrategia ask-on-risk.
Regla específica del repo: main, sin ramas/PR. No commit ni push solicitados.
RDD on; evaluación y consentimiento del candidato pendientes.
Espejo: odd/a3-contrato-consultas/tasks. Próximo paso: implementación delegada Astra.

## Resultado parcial

Implementación preservada en los seis archivos autorizados. RED observado:
tres TS2578 antes de fuentes; GREEN typecheck confirmado. Verificador Astra
independiente sin bugs introducidos identificados; cinco casos directos de
formularios y selección de ocho archivos aprobados. Spot check padre:
git diff --check aprobado.

Check global exit 1: lint 0 errores/28 warnings, typecheck aprobado, 53/57
archivos de test aprobados. Fallos ajenos: deploy/git EPERM, pre-push/hooksPath,
secretos/Gitleaks ausente, supabase-local-safety/stderr vacío. No cerrar la tarea
como totalmente verificada hasta resolver o repetir esas comprobaciones.

Evaluación nativa (índice temporal local autorizado): medium, seis archivos,
282 líneas, review_due=false, under_budget. Sin revisión aprobada ni commit.
Las notas de tarea sin seguimiento y el archivo ajeno quedaron fuera del candidato.
Build, RLS y remotos no ejecutados. Próximo paso: completar check en un entorno
que permita los fixtures locales y tenga Gitleaks; luego seguir con materias.

## Diagnóstico posterior del entorno

Gitleaks 8.30.1 sí estaba instalado en node_modules/.cache/gitleaks/8.30.1/gitleaks.
El mensaje de ausencia ocultaba EPERM de spawnSync bajo sandbox. Fuera del
sandbox, con escalación autorizada, pasaron secretos 14/14, pre-push 9/9,
supabase-local-safety 7/7 y deploy 21/21 casos. No se instaló Gitleaks ni se
cambiaron políticas, código o tests.

Incidencia: el filtro --test-name-pattern sin --test no excluyó los tres casos
de deploy con npm ci. Se ejecutaron instalaciones de fixtures temporales (dos
sin dependencias, uno con lock incompatible que falló deliberadamente).
No se puede certificar ausencia de consultas al registry en esa corrida; no
se presenta como offline. Se detuvieron nuevas ejecuciones.

El check íntegro sigue pendiente: requiere autorizar los npm ci temporales y
su posible acceso al registro público npm, sin credenciales ni publicación.
