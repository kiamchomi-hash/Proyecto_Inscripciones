# Preinscripción con confirmación directa

## Objetivo y alcance autorizado
Eliminar «Ahora no» y los pasos opcionales posteriores al envío en todas las entradas de preinscripción. Confirmar «Preinscripción enviada» y «Nos comunicamos a la brevedad». Preservar los POST actuales por entrada, validación, avisos, precios y robot; no convertir consultas normales en autoinscripciones.

## Problema
La elección posterior parece indicar que el usuario todavía no pidió preinscribirse aunque ya envió sus datos.

## Estrategia
Trabajo sobre main según política del proyecto; sin publicación nueva salvo autorización. Forecast: menos de 400 líneas propias, ask-on-risk. RDD global off en último estado, verificar. No tocar cambios ajenos.

## Tareas
- [x] T1 — Confirmación directa en todas las entradas y retiro de «Ahora no», pruebas y documentación. Ruta: delegated; dos componentes y navegación post-submit requieren análisis. RED/GREEN con tests existentes; npm run check. Capturas demo local, sin envíos reales. Commit propio de unidad al cerrar verificaciones.

## Aceptación
El envío exitoso termina sin decisión adicional; título Preinscripción enviada y aviso de contacto. Las entradas normales conservan kind consulta; dedicadas y enlaces conservan sus operaciones existentes. Sin credenciales ni Ahora no. Sin regresiones en captcha/reintentos ni próximas.

## Superficies
components/formularios/formulario-lead.tsx
components/formularios/autoinscripcion-teclab.tsx
tests/flujo-preinscripcion.test.mjs
tests/autoinscripcion-confirmacion.test.mjs
tests/preinscripcion-proximamente.test.mjs
docs/formularios-por-casa.md

## Verificación
node --test tests/flujo-preinscripcion.test.mjs tests/autoinscripcion-confirmacion.test.mjs tests/preinscripcion-proximamente.test.mjs tests/enlace-inscripcion.test.mjs
npm run check

## Estado
T1 implementada en `7b1d6ca` (`fix(formularios): confirmar preinscripcion sin pasos opcionales`), 268 líneas propias (87 agregadas, 181 eliminadas). Publicado por autorización explícita posterior del usuario; push origin/main confirmado y /teclab HTTP 200 con bundles nuevos sin Ahora no. Verificación independiente y cierre visual completados.

### Evidencia de T1
- RED real: 5 fallos de confirmación/directo antes del cambio, observados fuera del sandbox. Dentro del sandbox, Node reportaba fallo de archivo sin detalle; no se usó como RED funcional.
- GREEN: `node --test tests/flujo-preinscripcion.test.mjs tests/autoinscripcion-confirmacion.test.mjs tests/preinscripcion-proximamente.test.mjs tests/enlace-inscripcion.test.mjs`: 37 tests aprobados, 0 fallos.
- `npm run check`: lint sin errores (27 advertencias), typecheck aprobado, 544 tests aprobados, 0 fallos. Corrida fuera del sandbox; log local temporal conservado para consulta (no versionado).
- `git diff --check` sobre las seis superficies propias: aprobado.
- RDD: `gentle-ai review mode status` confirmó off por preferencia global; no se inició revisión. `gentle-ai review assess --cwd <repo> --json` devolvió high/unassessable por archivos untracked ajenos sin inventario declarado. Corresponde verificación independiente, no inferir riesgo bajo.
- Todas las preinscripciones normales conservan `kind: consulta` y llegan al panel corto de confirmación. Dedicadas y enlaces conservan autoinscripcion/enlace; contacto conserva «Consulta enviada».
- Precio vigente queda detrás de «Ver precio»; la vuelta no envía datos. Próximamente nunca ofrece precio.
- Eliminados Ahora no, gestionar, callbacks saltear y pase huérfano del formulario actual; el backend conserva compatibilidad de pases anteriores.
- Verificación independiente: 37/37 tests. Demo real /teclab confirma con un POST consulta, sin guardar; Ver precio y Volver no reenvían. Sin Ahora no en app/components, sin overflow móvil. Capturas completas y detalle guardadas temporalmente fuera del repositorio. Spot check padre: test SSR aprobado. Next dev mostró advertencia CSP/eval y alerta analytics local sin service role, sin escritura.
- Reversión acotada: las seis superficies de `7b1d6ca`, sin backend ni cambios ajenos.

Publicado y confirmado. Secretos y pre-push aprobados; hook local faltante instalado. Capturas entregadas al usuario.
