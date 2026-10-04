# Precios 2027 aditivos

Objetivo: descargar en sólo lectura el libro 1 2027 y conservar precios de lista separados de 2026.

Alcance: descargador optativo efímero, selección exacta Distancia/Nuevos ingresantes, respaldo 2027 y extracción validada. Sin modificar celdas, publicar ni cotizar promociones.

- [x] T1 Incorporar acceso efímero y selección inequívoca, con regresiones RED/GREEN.
- [x] T2 Descargar y validar 2027, respaldar snapshot anterior, comprobar conservación de 2026.
- [x] T3 Ejecutar tests focales, suite comercial y check.

Ruta: delegada, por preparación de escritura y acceso autenticado. Pronóstico: aproximadamente 180 líneas propias, estrategia ask-on-risk. El usuario autorizó el commit local de esta unidad; no autorizó push.

Criterio: libro 1 2027, CAU VLG01, tablas 1A/1B válidas; cotizable false. Si el acceso falla, preservar snapshot existente y registrar el bloqueo.

## Evidencia y bloqueo

RED: faltaban exports del modo efímero y selección exacta. GREEN: 10/10 focales y 358/358 suite comercial. npm run check: 305/305, sin errores; git diff --check limpio. Regresión adicional verifica copia histórica antes de reemplazar 2027.

Acceso remoto: primer intento se detuvo por selector No prematuro luego de clave; recuperación única, sin repetir credenciales, no capturó XLSX dentro del límite acotado de tres minutos. Se detuvo el proceso sin actualizar 2027. La pantalla posterior a autenticación no prueba falta de permisos.

Snapshot 2027 conservado: archivos fechados 28/09, 74 filas 1A y 73 filas 1B, no vigencia actual confirmada. No se escribieron celdas ni se publicaron cotizaciones.

Hash agregado de archivos raíz precios 2026 antes/después: bb304bac899fc579b19552e0c93242ed755d9b9d09468e8641029673de81df8b. Script 2026: a7c337de21e24dcb13dc4a3558a09c30d3b42e05d84a274a25e6d5fdd6fe1d97. Captura inicial hecha durante autenticación, antes de cualquier escritura de salida; no es snapshot del estado anterior a las modificaciones del descargador compartido.

Bloqueo inicial de T2, resuelto en la recuperación documentada abajo. No se publicaron precios ni se realizó push.

## Recuperación confirmada

Nueva estrategia: abrir el vínculo completo capturado desde CASA antes de iniciar Microsoft. El popup permitió correo y clave una vez, rechazó mantener sesión y entregó XLSX por download.aspx (HTTP 200); REST GetFileById devolvió 401. No se alteraron celdas.

Archivo ZIP: 3.473.890 bytes. Libro validado 1 2027, VLG01; 74 carreras 1A (01MM/01TKA/01TKB) y 73 carreras 1B (02MM/02TK). Snapshot anterior respaldado en histórico. Extracción registrada 03/10/2026 23:05 ART (02:05 UTC del 04/10). Sólo precios de lista, cotizable false.

SHA256 nuevo XLSX: b605ff1e189e309c6fdd1f984a41cca4455453f49d6125e191b21502472faabf. JSON: 6c224857aba54a4e30524818b07eb7c48a36f044d873bfef314aa0599cede6a0. Los hashes 2026 anteriores siguen idénticos. El descargador optativo incorpora la apertura directa antes de autenticar; requiere regresión funcional posterior. No publicación ni commits.

La comparación de tablas extraídas contra el respaldo previo resultó idéntica: no se detectaron cambios de importes de lista respecto del 28/09. Histórico: ventas/precios/2027/historico/2026-10-04T02-05-07.557Z/. Suite comercial posterior al último cambio: 358/358.

Check final posterior: npm run check completó lint, typecheck y tests 325/325 sin errores; la diferencia frente a 305 previos refleja cambios paralelos en la suite. git diff --check limpio.

## Límite del commit

Este commit registra únicamente este documento de recuperación. Los extractores, regresiones comerciales, XLSX y snapshots de precios permanecen en las carpetas privadas ignoradas; no se fuerza su inclusión en el repositorio público. No incluye otros pendientes ni cambios paralelos. Revertir este documento no revierte los archivos privados. Comprobación de ejecución para este cambio documental: no aplica, no modifica comportamiento. El flujo integrado del descargador después del último ajuste sigue pendiente de verificación; la descarga y la extracción descriptas sí se observaron.

## Integración aditiva en buscador

- [x] T4 Integrar snapshot de lista 2027 en selectores existentes, sin alterar cotizaciones 2026.
- [x] T5 Verificar regresiones y capturas de escritorio y celular.

Ruta delegada por preparación de escritura. El snapshot descargado en T2 está verificado; no implica promociones ni financiación confirmadas. No publicación ni commit en esta unidad.

## Resultado de integración local

Snapshot incorporado exclusivamente como lista separada: 70 carreras del catálogo cruzadas en 1A y 70 en 1B. Las tres exclusiones por alias siguen intactas; Lic Producc Artística aparece únicamente en el diagnóstico de 1A y no se activa. Identidad del libro, CAU, modalidad, ingresantes, cotizable false, columnas e importes se validan antes de usarlo. Snapshot ausente permite regenerar 2026; fila sin datos conserva la carrera e informa falta de lista.

RED observado: módulo de integración ausente. GREEN: 4/4 pruebas focales, incluyendo selectores del HTML offline, ambos períodos, copia final deshabilitada y retorno a tabla 2026 idéntica. Suite comercial final: 362/362. npm run check: 325/325, lint y typecheck sin errores. git diff --check limpio. El generador conserva aviso preexistente de 2A sin promoción publicada. No se tocaron fuentes de precios, corpus, contexto compartido, financiación ni datos de otras casas; entrenador no aplica.

Capturas locales inspeccionadas: notas-locales/precios-2027-buscador-desktop.png (1280 px) y notas-locales/precios-2027-buscador-mobile.png (375 px). La tabla agregada muestra importes legibles y fecha en hora argentina, sin descuentos o cuotas inventados. El panel de mensajes existente presenta recorte lateral en estas capturas; no se modificó ese diseño. Comprobación independiente: 4/4 pruebas focales aprobadas. La integración permanece local, sin publicación. Se registra únicamente este documento en el commit solicitado; los cambios comerciales privados permanecen fuera del repositorio público.
