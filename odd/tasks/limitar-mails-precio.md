# Limitar mails repetidos de precio

## Objetivo y alcance autorizado
Un envío de «Ver precio» por correo normalizado y carrera cada 168 horas, sin impedir consultar precios ni alterar el consentimiento de newsletter. Sin correos reales. El usuario autorizó explícitamente la aplicación del SQL por la sesión Supabase y el push a main mediante la credencial Git.

## Diseño aprobado
Reserva atómica persistente previa al envío, independiente de suscripciones. Conservar reserva ante resultado incierto de SMTP para priorizar no duplicar; si falla la reserva, omitir correo pero devolver precio. No modificar el envío de preinscripción ni el cron del newsletter.

## Tareas
- [x] T1 Implementar reserva SQL privada y control backend sólo para «Ver precio»; pruebas deterministas RED/GREEN, documentación operativa.
- [x] T2 Verificar checks y revisar diff; registrar verificaciones SQL y limitaciones.

## Ruta y verificaciones
Delegada: lectura preparatoria, backend + SQL + pruebas. Ejecutar pruebas enfocadas y npm run check. Concurrencia multisesión real pendiente. No tocar cambios ajenos. No commit ni push sin pedido explícito, por regla específica del proyecto. Se trabaja en main.

## Entrega
Estimación 250-350 líneas, estrategia ask-on-risk. Publicado el 16/10/2026.

## Estado
T1 y T2 completadas. SQL aplicado el 16/10/2026 en el proyecto Supabase verificado contra la configuración del sitio. Backend en proceso de publicación por el padre; este worker no realizó commit/push.

## Evidencia y pendientes
- RED: `node tests/ver-precio.test.mjs` mostró `2 !== 1` en la nueva prueba de repetición antes de modificar el backend.
- GREEN: `node --test tests/ver-precio.test.mjs` pasó; ejecución directa permite observar 33 pruebas internas aprobadas.
- `npm run check`: aprobado por verificador fuera del sandbox, exit 0, lint y typecheck aprobados, 473/473 pruebas. Los cuatro fallos iniciales fueron exclusivamente restricciones del sandbox; no se omitieron hooks ni se modificaron archivos ajenos.
- `git diff --check`: aprobado.
- PostgreSQL real: aserciones dentro de una transacción revertida confirmaron primer permiso `true`, repetición con correo normalizado `false`, y habilitación tras 168 horas `true`. Sin SMTP ni reservas de prueba persistidas.
- Permisos reales: RLS activo; RPC denegada a `anon` y `authenticated`, permitida a `service_role`; lectura de tabla denegada a `anon`.
- No se ejecutó concurrencia multisesión real: la cobertura concurrente del mock no prueba los bloqueos PostgreSQL.
- Contrato nuevo agregado a `lib/database.types.ts` con ampliación de superficie autorizada; regenerar después de aplicar SQL.
- T2: revisión independiente sin hallazgos accionables; 33/33 pruebas enfocadas aprobadas por verificador. Spot check del padre: `node --test tests/ver-precio.test.mjs` aprobado. RDD desactivado; assessment no evaluable por archivos no rastreados, tratado como alto y cubierto por verificación independiente.
- Publicación 16/10/2026: commit `1349acc`, deploy `dpl_2xxbhzgWkGfb9di64a224HEh7FBB` en Ready; `npm run smoke` verde (rutas, cabeceras, redirects y 213 URLs del sitemap). Tipos regenerados con `npm run db:tipos`: mismo contrato, sólo formato y `PostgrestVersion` 14.1; typecheck aprobado.
- Prueba real del usuario, 16/10/2026: primer «Ver precio» en una carrera de Teclab mandó el mail; el segundo en la misma carrera mostró el precio y no mandó otro. Queda sin probar sólo la concurrencia multisesión.
- Cambio estimado final: aproximadamente 270 líneas incluyendo SQL/documentación; no se modificaron cambios preexistentes de otros trabajos.
