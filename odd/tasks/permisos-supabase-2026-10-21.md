# Verificar endurecimiento de permisos Supabase

## Objetivo y alcance
Corregir reaplicación del SQL del 21/10 y verificar localmente permisos de Storage, precios y funciones por rol. No aplicar cambios remotos, inspeccionar credenciales, modificar Auth ni tocar recuperación en curso con otra IA. Trabajar sobre main según política específica del proyecto; sin push.

## Tareas
- [x] T1: hacer reaplicable el SQL y ampliar integración local por rol con el SQL real.
- [x] T2: ejecutar verificaciones, revisión independiente y registrar límites y resultados.

## Ruta y aceptación
T1 delegado: lectura preparatoria y varios archivos no triviales. T2 delegado: ejecución y verificación independiente de seguridad. La cobertura debe distinguir anon, usuario sin perfil, profesor aprobado y admin pendiente, rechazado y aprobado; probar segunda aplicación y permisos de precios/funciones. Pruebas directas de tabla no certifican la API HTTP de Storage.

## Verificación
Test-first donde haya prueba determinística ejecutable. npm run check; npm run test:integracion con Supabase local aislado y guardas intactas. Si Docker no permite acceso, informar bloqueo, no inventar aprobación. RDD apagado globalmente; evaluación de riesgo y revisión independiente sin activarlo.

## Entrega
Estrategia ask-on-risk. Estimación inicial 250-380 líneas autorales; reevaluar si crece. Sin PR ni push. Commit sólo de archivos propios con check aprobado; no cerrar tareas sin evidencia.

## Progreso
Unidad T1/T2 guardada en commit local `5832800` (293 adiciones y 18 bajas,
documentación incluida). Sin push ni deploy.
T1 implementado y autoverificado.
Se agregaron DROP de las dos policies nuevas, fixture mínimo de Storage/precios,
helper privado real extraído de julio y ejecución doble del SQL de octubre.
La matriz cubre anon, autenticado sin perfil, profesor aprobado y admin pendiente,
rechazado y aprobado. Conserva guardas de destino y amplía inventario/triggers
para Storage, incluso en primera preparación. No se habilitó Storage HTTP.

### Evidencia de T1
- RED real: `npm run test:integracion` falló con `42710`, policy nueva de
  Storage ya existente. Luego del fix, dos corridas completas aprobaron 9/9,
  sin fallos ni skips; la última incluyó invocaciones públicas rechazadas y
  triggers sintéticos funcionales tras revocar EXECUTE.
- `node --test tests/supabase-local-safety.test.mjs`: 8/8, sin skips.
- `npm run check`: lint sin errores (27 advertencias), typecheck aprobado,
  528/528 pruebas, sin fallos ni skips.
- `git diff --check`: aprobado. Cambios del alcance: aproximadamente 310 líneas
  autorales contando esta documentación; no se cambió la estrategia de entrega.
- El sandbox impidió acceso a Docker y afectó subprocesos Node; con escalación
  acotada y el `sg` de util-linux se verificó el destino local, se inició el
  proyecto aislado y se detuvo al terminar. No se alteraron grupos ni sockets.
- La primera corrida posterior al fix encontró una falla previa del harness:
  faltaban dependencias dinámicas del endpoint en su copia temporal. Se amplió
  esa lista sin tocar el endpoint ni activar caminos de mails reales.

### Límites y siguiente paso
T2 verificado por un segundo agente: integración 9/9 sin skips, guardas 8/8
y diff sin errores. El coordinador repitió las guardas: 8/8 con escalación.
La evaluación nativa de riesgo resultó no evaluable por archivos no rastreados
ajenos al alcance; se trató como riesgo alto y se hizo verificación independiente.
RDD sigue apagado globalmente, sin activación ni ceremonia nativa.
El rol administrativo local sólo construye/inspecciona el fixture; las operaciones
se ejecutan con roles reales y claims locales. Storage es SQL/RLS sintético, no
prueba de su API HTTP. Precios y funciones también tienen esquema mínimo, no
paridad completa. Aplicación remota y ajustes de Auth siguen pendientes y fuera
de esta autorización. No hubo push, PR ni cambios de producción.

