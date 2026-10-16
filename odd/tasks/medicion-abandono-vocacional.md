# Medición del recorrido vocacional

Objetivo: medir dónde se interrumpen los tests general y Teclab sin registrar respuestas ni datos personales.
Problema: ninguno tiene eventos propios de inicio, avance o finalización; WhatsApp ya cuenta con medición global.
Alcance autorizado: instrumentación local de ambos tests, pruebas y documentación. Sin cambiar preguntas, puntajes, interfaz ni publicar.
Ruta: delegada; lectura preparatoria e implementación en varios archivos. Trabajo directo en main por política del proyecto; sin commit salvo pedido explícito.
Estimación: unas 350 líneas de código y pruebas, más documentación. Estrategia de entrega: ask-on-risk; sin PR ni push.

## Tareas

- [x] T1 implementar controlador/hook compartido e integrar ambos tests con pruebas RED → GREEN.
- [x] T2 verificar comportamiento, privacidad y ciclo de vida de ambos tests; documentar cómo leer el embudo y sus límites. Verificación funcional aprobada; check global parcial, según evidencia siguiente.

## Criterios de aceptación

- Distinguir general y Teclab; inicio sólo con interacción real.
- Medir preguntas alcanzadas, finalización y CTA sin duplicar WhatsApp global.
- Registrar salidas observables, no afirmar abandono irreversible al ocultar una pestaña.
- Deduplicar salida/desmontaje y soportar remontaje de StrictMode y restauración BFCache.
- No enviar respuestas, perfiles, puntajes, datos personales ni identificadores persistentes.
- Sin DB, endpoints, Telegram ni eventos de prueba en producción.
- Mantener intactos los cambios previos en PENDIENTES.md, components/index/ver-precio-teclab.tsx y tests/ver-precio.test.mjs.

## Comprobaciones

`node --test tests/vocacional-analytics.test.mjs`, `npm run check`, `git diff --check` y verificación independiente proporcional. RDD global desactivado: no iniciar revisión nativa.

## Estado y siguiente paso

T1 implementada y comprobada con 8 casos deterministas locales. RED observado: `node --test tests/vocacional-analytics.test.mjs` falló por ENOENT del controlador antes de implementarlo. GREEN: mismo comando exit 0; ejecución directa `node tests/vocacional-analytics.test.mjs` muestra 8/8 casos aprobados. Hook probado con dependencias falsas y listeners reales de EventTarget; sin navegador ni eventos de producción.

`npm run check`: lint y typecheck aprobados; suite 56/60 archivos aprobados, fallan `deploy`, `pre-push`, `secretos` y `supabase-local-safety`. Diagnóstico local de deploy: `spawnSync git EPERM` en fixtures temporales. Pre-push: no puede inspeccionar `core.hooksPath`. Secretos: Gitleaks 8.30.1 no disponible. Supabase local: una aserción espera `/override Docker/` pero obtiene salida vacía (causa no atribuida). No se alteraron esas herramientas para esconder los fallos. `git diff --check`: aprobado.

T2: verificador independiente ejercitó los handlers reales con React simulado, las 10 preguntas generales y 6 de Teclab, reinicios, privacidad y límites de BFCache. Detectó un error de lint en el harness agregado después del primer check: el nombre del hook dentro de un bucle activaba rules-of-hooks. RED reproducido con `npx eslint tests/vocacional-analytics.test.mjs`; se corrigió usando un alias de función de harness, sin desactivar reglas. El primer reporte de lint aprobado correspondía a bytes anteriores, no al harness final. Revalidación tras la corrección: `node tests/vocacional-analytics.test.mjs` 8/8; `npm run check` vuelve a aprobar lint y typecheck y termina exit 1 con los mismos 56/60 archivos aprobados y los cuatro fallos detallados arriba; `git diff --check` aprobado. No quedan errores de lint del harness. Sin build ni comprobación de envío real a Vercel, deliberadamente. Sin commits, ramas, push ni cambios visuales. Espejo Engram a cargo del coordinador. RDD desactivado; no se inició revisión nativa.

## Superficies previstas

lib/analytics.ts; lib/vocacional-analytics.ts; components/test-vocacional/use-analytics-vocacional.ts; components/test-vocacional/test-vocacional.tsx; components/test-vocacional-teclab/test-vocacional-teclab.tsx; tests/vocacional-analytics.test.mjs; docs/medicion-test-vocacional.md; referencias/2026-10-16-medicion-vocacional.md; este documento.

## Cierre local

Spot check del coordinador tras la corrección: eslint del test, 8/8 casos directos y `git diff --check` aprobados. Evaluación de riesgo no clasificable por archivos nuevos, tratada como alta para exigir verificación independiente; no se inició RDD porque está desactivado.

Implementación y documentación locales terminadas. Pendiente resolver o verificar fuera de este entorno los cuatro fallos del check global antes de publicar; después del deploy, reunir datos reales antes de proponer cambios al contenido del test. No se marca terminado el pendiente general de mejorar el test, ni se modifican cambios ajenos del backlog.

## Publicación

16/10/2026: commit `e239bc9`, deploy `dpl_2xxbhzgWkGfb9di64a224HEh7FBB` en Ready. `npm run check` aprobado en Linux (475/475): los cuatro fallos anteriores eran del entorno de la otra máquina. `npm run smoke` verde; `/test-vocacional` y `/teclab/test-vocacional` responden 200. No se dispararon eventos contra producción. Primera revisión de datos: 23/10/2026.
