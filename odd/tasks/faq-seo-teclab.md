# FAQ SEO de carreras Teclab

## Objetivo y autorización
Añadir preguntas frecuentes útiles para búsquedas y decisiones de inscripción en las carreras activas y visibles de Teclab. Usuario autoriza SELECT/UPDATE/readback de FAQ exclusivamente mediante cau_editor con TLS verificado. Sin planes, precios, descripción ni diseño. Identidad y cursos fuera de alcance.

## Alcance
16 elegibles: 217-225 y 227-233. Crear FAQ sólo para 217-225 y 229-233 (14 con slides nulos); preservar 227/228 que ya tienen FAQ. Excluir 226 inactiva y 235 curso. Aplicar activa && esCarreraVisible && esTeclab.

## Tareas y ruta
- [x] T1: Preparar 42 preguntas/respuestas originales respaldadas por fuentes oficiales y SQL transaccional de 14 filas con backup/precondiciones. Delegada por investigación preparatoria y escritura coordinada.
- [x] T2: Validar parsers/preservación y riesgo/revisión nativa aplicable antes de UPDATE. Delegada verificación; padre coordina revisión.
- [x] T3: Aplicar una vez, leer datos y HTML público, verificar contenido y capturas sin alterar otras filas. Delegada ejecución autorizada.

## Restricciones y fuentes
Dashboard comercial prioritario, contrastar fichas oficiales; campos cruzados comprobados no se usan. No prometer salarios, empleo, certificados contradictorios ni posiciones SEO. Intenciones inferidas, no volúmenes GSC. Backup privado 0600; no credenciales en SQL ni git. Mantener staged FAQ anterior y cambios ajenos intactos; no push.

## Comprobaciones
Validación estructural FAQ mediante parser real, identidad y filtro de14filas, ausencia de otros cambios salvo slides/updated_at. SQL transacción bloqueos huellas/rowcounts. npm run check, HTML público fresh y capturas. RED de ranking no aplicable; validación documental y funcional parser sí.

## Entrega y progreso
ask-on-risk; previsión aproximadamente 300-380 líneas propias (sin comprimir para caber). RDD activo; preparar candidato de unidad aislado antes de ejecutar SQL. No commits que incluyan staged previo ni force-add archivos privados; publicar FAQ ocurre por triggers existentes, no requiere push. Revisión/commit de unidad pendientes de comprobaciones.

## Evidencia T1 / T2
T1 preparada: SQL transaccional de 14 filas / 42 FAQ y referencia con respaldo por respuesta. SELECT fresco mediante cau_editor y TLS verificado: 14 filas sin deriva; respaldo privado 0600. Tabla sin columna slug: se valida carreraToSlug real y se preservan nombre/prefix en SQL. Fuentes oficiales contrastadas; campo cruzado y perfilEgreso de Periodismo descartados.
T2 parcial: `node notas-locales/faq-seo-teclab/validar.mjs` PASS con parser real, filtro (16 elegibles), 14 con slides nulos, 3 items cada una y preservación simulada de campos/exclusiones. `npm run check` PASS: lint (0 errores, 28 warnings), typecheck y 348 tests aprobados, 0 fallos/omitidos. En esa etapa preparatoria no se ejecutó SQL; la evidencia de aplicación posterior figura abajo.
SQL 370 líneas + referencia 48 = 418 nuevas, más actualización de esta tarea. ask-on-risk corresponde al padre antes de cualquier commit; ningún commit/stage/push efectuado. Staged anterior intacto.

## Revisión, pruebas y publicación
Padre informó revisión reliability aprobada, ACK consumido/burned `review-c2a4e766df810216`; SQL SHA256 `bef70c2b9f1339617192102aa49dc982271e95468aacb16ec661fc263c673a0d`, bytes preservados.
Bloqueo inicial Docker resuelto tras autorización explícita del usuario: `sudo -n systemctl start docker`. Prueba representativa en imagen PostgreSQL 17.6 existente, contenedor propio sin red, puertos, volúmenes ni credenciales remotas. Fixture público conserva serialización/huellas exactas: ID integer y demás columnas jsonb; no replica tipos completos ni triggers de producción. SQL exacto sin editar: COMMIT y 14 filas/42 items, preservación de todo campo ajeno y cuatro exclusiones. Deriva intencional en última fila 233: excepción/exit 3 y rollback mantiene las 14 filas sin FAQ. Logs y fixture privados.
Preflight remoto cau_editor/TLS verificado: 18 filas sin deriva, hash exacto. Una única ejecución remota del SQL: COMMIT confirmado. Readback: 14 FAQ/42 respuestas exactas; campos ajenos preservados excepto updated_at de trigger; 226/227/228/235 idénticas al respaldo.
HTML público: 14 HTTP 200 y 42 preguntas/respuestas verificadas sin JavaScript tras revalidación. Capturas revisadas visualmente: Programación desktop, Marketing Digital móvil y Experiencia del Cliente móvil; primer acordeón abierto, texto legible y sin desbordamiento.
Contenedor propio detenido/eliminado. Ningún contenedor ajeno activo; docker.service y docker.socket quedaron inactivos, como al inicio. Sin stage, commit, push ni publicación de código. No se repitió npm check porque no cambió código desde sus 348 pruebas aprobadas.

## Próximo paso
Contenido FAQ publicado y verificado. Padre puede registrar entrega/commit documental según política y decisión humana; no queda aplicación de datos pendiente. Medición de SEO posterior no ejecutada ni prometida.
