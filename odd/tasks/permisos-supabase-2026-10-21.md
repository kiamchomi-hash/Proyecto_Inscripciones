# Verificar endurecimiento de permisos Supabase

## Objetivo y alcance
Corregir reaplicación del SQL del 21/10 y verificar localmente permisos de Storage, precios y funciones por rol. La primera fase T1/T2 excluyó cambios remotos. Luego el usuario autorizó T3 (aplicar ese SQL en producción) y T4 (revisar Auth en modo sólo lectura), usando su sesión del dashboard de Supabase. No modificar Auth, inspeccionar credenciales ni tocar recuperación en curso con otra IA. Trabajar sobre main según política específica del proyecto; sin push.

## Tareas
- [x] T1: hacer reaplicable el SQL y ampliar integración local por rol con el SQL real.
- [x] T2: ejecutar verificaciones, revisión independiente y registrar límites y resultados.
- [x] T3: aplicar el SQL autorizado en producción y comprobar sus permisos por catálogo.
- [x] T4: revisar la configuración de Auth sin modificarla y cerrar el pendiente con evidencia.

## Ruta y aceptación
T1 delegado: lectura preparatoria y varios archivos no triviales. T2 delegado: ejecución y verificación independiente de seguridad. La cobertura debe distinguir anon, usuario sin perfil, profesor aprobado y admin pendiente, rechazado y aprobado; probar segunda aplicación y permisos de precios/funciones. Pruebas directas de tabla no certifican la API HTTP de Storage.
T3/T4: operación del dashboard por el coordinador; registro documental delegado.
Aceptación: confirmar proyecto de producción y SQL exacto, observar éxito y
comprobar el catálogo posterior; registrar Auth sin cambios ni pruebas con datos
personales. No autoriza pruebas HTTP de Storage ni cambios de configuración.

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
paridad completa. Al cerrar T1/T2, la aplicación remota y Auth quedaban fuera de
esa autorización; T3/T4 registran la ampliación posterior. No hubo push ni PR.

### Evidencia de T3: aplicación en producción
- Autorización explícita del usuario para el SQL y la sesión del dashboard.
  Se confirmó el proyecto contra la URL pública configurada y las notas
  operativas, y la rama principal marcada como producción en el dashboard.
- Prelectura de catálogo: policies anteriores y helper
  `private.current_user_is_admin()`, que exige rol admin y estado aprobado.
- Se ejecutaron las sentencias exactas de
  `sql/2026-10-21_endurecer_storage_y_policies.sql` dentro de `BEGIN`/`COMMIT`.
  Resultado visible: «Success. No rows returned».
- Consulta posterior de catálogo: `policies_admin = 5` (todas las objetivo con
  el helper privado), `policies_antiguas_restantes = 0`,
  `execute_trigger_anon_o_authenticated = 0`, `insert_directo_formularios = 0`.
- Sin lectura de filas personales, escrituras de leads, cuentas ni archivos de
  prueba. No se probó la API HTTP de Storage.
- Observación fuera del parche: las policies de `clases-apoyo` exigen rol admin,
  pero no estado aprobado. No se modificaron ni se consideran corregidas aquí.

### Evidencia de T4: revisión de Auth
Lectura del dashboard, sin modificar ajustes:
- Attack Protection: captcha desactivado; contraseñas filtradas desactivadas,
  con disponibilidad desde Pro según la interfaz (proyecto Free).
- Email activado; cambio seguro de email activado; cambio seguro de contraseña
  y exigencia de contraseña actual desactivados.
- OTP por email: vencimiento 3600 segundos y longitud 8.
- Altas y confirmación de email activadas; acceso anónimo desactivado.
- MFA: TOTP activado, máximo 10 factores; límite de duración AAL1 activado,
  con verificación del factor registrado dentro de 15 minutos según la interfaz.
  SMS desactivado, ofrecido sólo desde Pro.

Habilitar TOTP no acredita usuarios enrolados ni MFA exigido por la aplicación.
La revisión de Auth está completa; cualquier ajuste futuro requiere autorización
independiente. Cambiar OTP requiere además comprobar compatibilidad; no se
establece una actualización de plan como requisito.

### Cierre documental de T3/T4
Se cerraron los dos pendientes y se registró evidencia en la bitácora de
seguridad, el historial y las referencias. Verificación proporcional: lectura
estructural y `git diff --check`; no se repitieron pruebas de código por estos
cambios documentales. Sin commit ni push de este registro. No quedan tareas
T1–T4 abiertas; las limitaciones indicadas no se presentan como pruebas hechas.
Enlaces utilizados.

