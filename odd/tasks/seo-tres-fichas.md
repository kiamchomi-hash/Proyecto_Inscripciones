# Mejora SEO de tres fichas

## Objetivo y alcance autorizado
Mejorar la información útil de Seguros, Procurador y Gestión Contable, conservando Supabase como fuente única. El usuario autorizó leer, actualizar y verificar únicamente esas tres filas mediante `cau_editor` y `EDITOR_DATABASE_URL`.

## Restricciones
- No cambiar planes, certificados, títulos, precios ni modalidades sin confirmar versión académica.
- No usar service role ni exponer credenciales. Exigir TLS verificado y certificado CA disponible.
- Preservar cambios ajenos; trabajar en main sin ramas ni PR, según política del proyecto. No push.
- Textos y documentación en español; no prometer posiciones, matrícula ni equivalencias automáticas.

## Tareas y criterios de aceptación
- [x] T1: Leer las tres filas, guardar respaldo local privado y preparar textos respaldados por fuentes oficiales. Ruta delegada: análisis y preparación de escritura.
- [x] T2: Preparar SQL con transacción, filas inequívocas y precondiciones; validar parsers y campos preservados antes de aplicar. Ruta delegada: cambios coordinados.
- [x] T3: Aplicar sólo las tres filas; verificar lectura posterior, HTML público y presentación móvil/escritorio. Ruta delegada: ejecución y verificación.

## Comprobaciones
Validación estructural previa y posterior, SQL acotado, contenido visible y canónicas; `npm run check` antes de cualquier commit. No hay RED de ranking determinista: la posición es resultado posterior, no prueba funcional. Los cambios de contenido se contrastan con el respaldo. Verificación independiente según evaluación nativa de riesgo.

## Entrega y progreso
Estrategia ask-on-risk; previsión menor a 250 líneas propias. RDD activo por defecto; evaluar candidato antes de publicar la actualización. Commit de unidad en main sólo con comprobaciones observadas; no push. T1/T2/T3 completadas; tres fichas aplicadas y verificadas en producción. SELECT de tres filas (87, 227, 228) con TLS verificado; respaldo privado ignorado y permisos 0600. SQL y referencias preparados. Parsers reales y preservación de campos: PASS. npm run check: exit 0, 342 pruebas aprobadas, 0 fallas; lint con advertencias existentes. SQL exacto aplicado una vez con COMMIT confirmado y comparación posterior PASS. Preflight verificó también los bullets existentes. RDD aprobado y reconocido por el padre (lineage review-cad309f84568001a). HTML público y seis vistas escritorio/móvil PASS; capturas viewport privadas, sin overflow. Primer check final terminó con exit 143; repetición acotada aprobada con exit 0. Unidad implementada en commit defc959 (feat(seo): mejorar tres fichas con información académica verificada), 201 líneas propias añadidas. Sin push.

## Próximo paso
Check final y commit de unidad completados; no push. Comparar más adelante en GSC el rendimiento genérico con períodos equivalentes; no prometer ranking inmediato.

## Ajuste autorizado: introducción breve y FAQ
El usuario pidió reducir el texto inicial y mover las explicaciones a preguntas frecuentes debajo. Autorizó implementar y publicar el soporte mediante push a main, seguido de la actualización acotada de las tres fichas con el rol editor ya autorizado. Esta autorización sustituye la restricción de no push únicamente para este ajuste.

- [x] T4: Agregar variante FAQ validada a slides, renderizar details/summary en servidor y excluirla del carrusel. Ruta delegada por cambios coordinados de tipos, validación, render y pruebas. Criterios: preguntas/respuestas presentes en HTML, ausencia cuando no hay FAQ, texto escapado y navegación/modal existentes sin regresiones.
- [ ] T5: Preparar introducciones cortas y FAQ de tres fichas, revisar, publicar primero el soporte de código y verificar deploy. Ruta delegada por ejecución y datos coordinados. Sin modificar el SQL anterior aplicado ni los datos remotos antes del soporte publicado.
- [ ] T6: Actualizar descripción y FAQ en una transacción de tres filas con precondiciones; verificar preservación, HTML, interacción y capturas completas 1280/375. Ruta delegada por ejecución y comprobaciones.

Pruebas: RED/GREEN del parser y render FAQ; npm run check y build antes de publicación. Mantener los planes, certificados, títulos, canónicas y competencias. Teclab conserva la última oración de salida laboral. Respaldo privado y TLS verificado obligatorios. Pronóstico inicial del ajuste: aproximadamente 300 líneas; si supera la estrategia ask-on-risk, revisar el alcance antes de otro commit, sin comprimir ni omitir pruebas. Main sin ramas ni PR por política específica. Revisión nativa según riesgo y consentimiento del candidato. Próximo paso: implementación local y preparación de SQL, sin publicar todavía.

## Evidencia del ajuste local
T4 implementada con RED de tres pruebas seguido de GREEN 16/16. Soporte FAQ validado, SSR escapado, interacción nativa sin JS, carrusel y modal Teclab comprobados. T5: textos y SQL preparados, respaldo privado de tres filas con TLS; publicación y aplicación pendientes. npm run build: exit 0, 161 páginas. npm run check: exit 0. Preview local SSR mock: 18 capturas completas/hero/FAQ 1280/375, sin overflow y teclado aprobado; servidor cerrado. No commit, push ni UPDATE en este ajuste.
Pronóstico observado del ajuste: 291 líneas propias añadidas/eliminadas antes de esta línea, incluyendo los archivos nuevos SQL (102) y pruebas (68); aproximadamente 292 líneas en total, por debajo de la heurística de 400. next-env.d.ts restaurado únicamente en sus dos imports generados contra HEAD 08422ce después del check final, con autorización expresa del padre.
