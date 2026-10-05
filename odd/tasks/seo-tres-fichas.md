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
Estrategia ask-on-risk; previsión menor a 250 líneas propias. RDD activo por defecto; evaluar candidato antes de publicar la actualización. Commit de unidad en main sólo con comprobaciones observadas; no push. T1/T2/T3 completadas; tres fichas aplicadas y verificadas en producción. SELECT de tres filas (87, 227, 228) con TLS verificado; respaldo privado ignorado y permisos 0600. SQL y referencias preparados. Parsers reales y preservación de campos: PASS. npm run check: exit 0, 342 pruebas aprobadas, 0 fallas; lint con advertencias existentes. SQL exacto aplicado una vez con COMMIT confirmado y comparación posterior PASS. Preflight verificó también los bullets existentes. RDD aprobado y reconocido por el padre (lineage review-cad309f84568001a). HTML público y seis vistas escritorio/móvil PASS; capturas viewport privadas, sin overflow. Primer check final terminó con exit 143; repetición acotada aprobada con exit 0. Commit pendiente, sin push.

## Próximo paso
Check final aprobado. Registrar commit sólo de los tres archivos propios, sin push. Comparar más adelante en GSC el rendimiento genérico con períodos equivalentes; no prometer ranking inmediato.
