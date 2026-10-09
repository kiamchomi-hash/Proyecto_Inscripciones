# Preinscripción enfocada

## Objetivo
Priorizar el formulario en las páginas dedicadas y alinearlo al ingresar, con una orientación breve aprobada debajo, sin alterar los formularios incrustados ni su envío.

## Alcance y criterios
- /carreras/[slug]/inscripcion y /teclab/inscripcion sin navbar, footer ni contenido auxiliar.
- Inicio del formulario visible; si supera la pantalla, conservar scroll y campos legibles.
- Sin autofocus móvil, bloqueo de scroll ni cambios en API, datos o captcha.
- Trabajo local en main, sin push ni PR; preservar archivos ajenos.

## Tareas
- [x] T1: Implementar shell enfocado y llegada al formulario con tests de regresión. Ruta delegada: múltiples archivos no triviales y preparación de escritura.
- [x] T3: Priorizar nacionalidades regionales e hispanohablantes, con Otra como alternativa. Ruta delegada: modificación de fuente compartida y tests.
- [x] T4: Compactar contacto sólo en páginas dedicadas. Ruta delegada: markup
  compartido, CSS acotado y regresión. Sin cambios en campos ni envío.
- [x] T2: Verificar check y capturas desktop/móvil, registrar evidencia y cierre.
- [x] T5: Agregar orientación breve de próximos pasos debajo del formulario.
  Ruta delegada: dos páginas y CSS, con regresión de render y fuentes verificadas.

## Verificación
Test-first con node --test tests/inscripcion-pagina.test.mjs tests/inscripcion-enfocada.test.mjs; npm run check; capturas a 1280 y 375 px de ambas páginas y control de home.

## Entrega
ask-on-risk; previsión <400 líneas autoradas. No publicación autorizada. RDD activo por defecto; evaluación pendiente. Commit sólo tras check y política aplicable.

## Progreso
Implementación y verificaciones locales completadas, sin commit ni publicación.
- RED: 3 tests nuevos fallaron por helper inexistente, shell no enfocado y alineación ausente.
- GREEN: node --test tests/inscripcion-pagina.test.mjs tests/inscripcion-enfocada.test.mjs, 12/12.
- npm run check: lint sin errores (28 warnings previos), typecheck aprobado y 351/351 tests aprobados.
- Relectura posterior de navbar: eslint de archivos propios y tests enfocados aprobados.
- Capturas desktop 1280x900 y móvil 375x900 de ambas rutas: navbar/footer ausentes; BODY conserva foco, sin teclado. Desktop tarjeta completa de ~660px visible; móvil tarjeta de ~1313px conserva scroll.
- Reload: escritorio 0px, móvil 3px de ajuste (tarjeta inicia a 12px). Home conserva navbar/footer y scroll inicial 0 en ambas medidas.
- Navegación cliente desde ficha a inscripción: navbar/footer ausentes, offset 0; volver restaura navbar y alto 42.78px.
- Playwright networkidle agotó timeout en reload por tráfico de desarrollo; comprobaciones repetidas con domcontentloaded e hidratación acotada aprobadas.
- Capturas locales fuera del repo; sin envíos reales, API ni campos modificados.
- Evaluación RDD y commit: pendientes del coordinador. Archivo ajeno aranceles-teclab.md intacto.
Próximo paso: revisión proporcional y entrega de capturas; sin push.


## Corrección de foco inicial
La carrera inicial sí estaba seleccionada. El ancla #preinscripcion enfocaba el
primer campo en escritorio y abría su lista, dando apariencia de selección
pendiente. Se omite ese foco cuando hay carreraInicial o alinearAlLlegar, sin
modificar la selección, la validación ni la apertura manual del buscador.
- RED real: el efecto enfocaba una carrera precargada (1 foco frente a 0 esperado).
- GREEN: 13/13 tests enfocados, incluido efecto real con carrera precargada,
  página dedicada y formulario incrustado sin selección.
- Navegador: llegada desktop con ancla mantiene Eventos elegida, sin foco ni
  lista; clic manual abre la lista; /teclab#preinscripcion sigue enfocando el
  buscador vacío.
- Captura local adicional: eventos-1280-hash.png.
- Check completo de esta corrección: lint sin errores (28 warnings previos),
  typecheck aprobado y 352/352 tests aprobados.
- El consentimiento anterior correspondía a bytes anteriores; requiere nuevo
  preflight. No se inició revisión ni se publicó.

## Nacionalidades
Alcance autorizado: Argentina, Uruguay, los demás países limítrofes, Perú y
los restantes países hispanohablantes. Se conservan gentilicios y Otra al final,
sin cambios de campos, columnas, API ni elegibilidad de postulantes.
Guinea Ecuatorial no se incluye (usuario, 09/10/2026): sólo Ecuatoriana.
- RED: la comparación exacta detectó el orden anterior y opciones fuera del alcance.
- GREEN: node --test tests/formularios.test.mjs tests/formularios-api.test.mjs,
  27/27. Se verifica orden exacto, ausencia de duplicados y Siria, Otra al final
  y aceptación de Otra por validarPayloadAutoinscripcion.
- npm run check: lint sin errores (28 warnings previos), typecheck aprobado,
  354/354 tests aprobados; git diff --check aprobado.
- Selector abierto en navegador: Argentina, Uruguaya, Boliviana, Brasileña,
  Chilena, Paraguaya y Peruana visibles primero. Captura local
  nacionalidades-1280.png. Sin envío real ni publicación.

### Corrección aceptada de T3: países y población inmigrante
El usuario reemplazó la prioridad regional manual por frecuencia de inmigrantes
y pidió nombres de países, no gentilicios. Argentina queda primero por uso local.
El prefijo extranjero usa población residente en viviendas particulares nacida
en otro país (stock, no ciudadanía ni llegadas recientes), Censo 2022:
Paraguay 522.598, Bolivia 338.299, Venezuela 161.495, Perú 156.251,
Chile 149.082, Uruguay 95.384, Brasil 49.943, España 48.492,
Colombia 46.482 y Cuba 3.921. Fuente:
https://biblioteca.indec.gob.ar/bases/minde/1c2022_7.pdf
Desde Costa Rica, el sufijo se ordena alfabéticamente por país porque no se
verificaron cifras individuales. No se afirma que ese sufijo siga el ranking.
El alcance de países se conserva. Otro país sigue último.

Las etiquetas y la búsqueda muestran países; los valores internos siguen siendo
los gentilicios históricos (Perú → Peruana, Otro país → Otra). No hay migración,
cambios de columnas ni invalidación de legajos por el cambio de etiqueta.
La búsqueda sin tilde se aplica a opciones con etiquetas personalizadas;
los demás selectores mantienen su comportamiento.
- RED: fallaron orden esperado y mapa de etiquetas ausente.
- GREEN: 33/33 pruebas enfocadas. El selector real renderiza países, buscar Peru
  ofrece Perú y elegirlo entrega Peruana; payload y validación conservan valores.
- npm run check: lint sin errores (28 warnings previos), typecheck aprobado y
  356/356 tests aprobados. git diff --check aprobado.
- Navegador: prefijo correcto y buscar Peru encuentra sólo Perú, seleccionado sin
  modificar el valor interno. Captura local nacionalidades-censo-1280.png.
- Sin envíos reales, cambios de esquema, commit, push ni revisión iniciada.

### Ajuste de teclado de T3
El spot check detectó que Enter sobre una selección previa usaba el gentilicio
interno para buscar contra etiquetas de país. Se corrigió el fallback a la
etiqueta visible, manteniendo el valor del legajo.
- RED: Enter sobre Perú ya seleccionado dejaba la lista abierta (true frente
  a false esperado).
- GREEN: 33/33 pruebas enfocadas, incluido Enter con Peruana seleccionada.
- Check completo: lint sin errores (28 warnings previos), typecheck aprobado,
  356/356 tests aprobados. git diff --check aprobado.
- Navegador: Perú seleccionado + Enter mantiene Perú, cierra lista y no marca
  borde inválido. Sin envío real ni publicación.


## Contacto compacto (T4)
Alcance autorizado: quitar línea e icono de Datos de contacto sólo en páginas
dedicadas y reducir el espacio antes de la opción de novedades. Se conserva el
nombre accesible del grupo, los labels de campos y el checkbox con label asociado.
El espacio provenía de los párrafos de error vacíos reservados; se ocultan sólo
dentro del bloque compacto dedicado, no los errores reales ni otros formularios.
- RED: regresión detectó ausencia de guard de alcance y CSS compacto.
- GREEN: 6/6 tests de inscripción enfocada.
- Gap medido: 21.125px antes, 6.5px después en escritorio y celular.
- Bloque: 116.75 → 80.75px escritorio; 180.875 → 130.25px celular.
- Navegador: sin overflow horizontal; label de novedades cambia checkbox en
  ambas medidas. Capturas contacto-compacto-1280.png y contacto-compacto-375.png.
- Check completo: lint sin errores (28 warnings previos), typecheck aprobado,
  357/357 tests aprobados. git diff --check aprobado.
- Control /teclab incrustado: encabezado presente, sin clase compacta.
- Los errores de email con contenido siguen visibles.


## Próximos pasos (T5)
Bloque breve autorizado debajo de las dos páginas dedicadas; ambas son Teclab,
por lo que comparten proceso. No se agregan referencias territoriales, botones,
footer, tiempos de atención, importes ni promesas de contacto.

Texto aprobado implementado:
Próximos pasos
Después de enviar tus datos, podés continuar con Inscribirme. Este paso no
realiza ningún cobro.
Teclab te envía por mail el acceso al portal del alumno una vez gestionada la
inscripción. Desde allí elegís el medio de pago y abonás.

Fuentes públicas del proyecto (sin material comercial privado):
- components/formularios/formulario-lead.tsx: enviar termina en precio/gestionar
  según precio vigente; la inscripción es un paso posterior a la preinscripción.
- components/formularios/autoinscripcion-teclab.tsx: AvisoSinPago y PasoListo
  verifican ausencia de cobro, mail de Teclab y pago posterior en portal.
- components/carreras/inscripcion-carrera.tsx: PASOS_INSCRIPCION confirma acceso
  por mail y elección de pago. Se evita presentar ese mail como resultado
  inmediato del mero envío de preinscripción.
- docs/formularios-por-casa.md: proceso consulta y autoinscripción separado.

Verificación:
- RED: render de rutas sin bloque de próximos pasos.
- GREEN: 16/16 tests enfocados, render real de las dos rutas verifica heading,
  formulario anterior, ausencia de pregunta/referencias territoriales/botones.
- Navegador desktop y móvil en ambas rutas: formulario conserva llegada arriba
  (21.5px desktop, 12px móvil), navbar/footer ausentes, sin overflow horizontal.
- Capturas proximos-pasos-1280.png, proximos-pasos-375.png y variantes -teclab.
- Check completo: lint sin errores (28 warnings previos), typecheck aprobado,
  358/358 tests aprobados. git diff --check aprobado.
- Sin envíos reales, material comercial privado, commit, push ni revisión.

### Dirección visual aprobada de T5
El usuario rechazó el bloque plano a la izquierda y aprobó una tarjeta centrada:
título centrado, dos columnas equilibradas en escritorio, apiladas en celular,
superficie navy, radio y borde cian discreto del formulario. Texto intacto,
sin botones, iconos, números, animación ni referencias territoriales.

Biblioteca UIverse propia, todas marcadas Teclab y no ocultas:
- tarjetas-precio-borde-aurora-graphite: columnas y alineación, graphite.com/pricing.
- celda-integracion-corchetes-antimetal: agrupación en superficie, antimetal.com.
- tarjetas-metrica-color-solido-decagon: superficie lisa y separador, decagon.ai.
Autor de las piezas locales: Matías. Se usa la mecánica de composición, no halos,
paletas ajenas, acciones ni tipografía de las referencias. Atribución en CSS.

- RED: el render no tenía la tarjeta y el contenido en columnas.
- GREEN: 16/16 pruebas enfocadas, copy exacto aprobado sin alteraciones.
- Capturas de ambas rutas a 1280/375 y 1440/390; tarjeta comparte límites con el
  formulario y columnas iguales. 1280: ancho 1135px, columnas 550.25px.
  375: ancho 334px, una columna 299.5px. Sin overflow, navbar ni footer.
- Contraste cuerpo #c8d0dc sobre #14263c: 9.85:1.
- CTA de enviar conserva único fondo cian sólido; bloque informativo es navy.
- Capturas proximos-pasos-tarjeta-1280.png y -375.png, más variantes -teclab.
- `npm run check`: lint sin errores (28 advertencias preexistentes), typecheck correcto y 358 pruebas correctas. La invocación combinada terminó con código 143 después del check, sin iniciar build; `npm run build` independiente completó con código 0. `git diff --check` limpio. Sin publicación ni envío de lead.

## T6 — Solicitud de inscripción en un envío

- [x] Entrada dedicada Teclab envía directamente `autoinscripcion`, sin consulta ni confirmación adicional; resto de entradas intacto.
- [x] DNI validado en cliente (7–9 dígitos), errores conservan datos y permiten reintentar.
- [x] CTA y aviso explican solicitud sin cobro; confirmación no afirma cuenta lista.
- [x] Pruebas de flujo simulado, check/build y capturas sin envío real.
- Ruta delegada: cambio coordinado de flujo, copy, pruebas y documentación; sin cambios de backend. La solicitud registra gestión; el robot del portal aún está pendiente, no se promete creación inmediata.

### Evidencia de T6

- RED observado en `tests/flujo-preinscripcion.test.mjs` antes del cambio: faltaban activación dedicada y error DNI. GREEN final: 35/35 en flujo-preinscripcion, autoinscripcion, pase-autoinscripcion, inscripcion-enfocada e inscripcion-pagina.
- Pruebas ejecutan los handlers reales con fetch/estado simulados: un único `autoinscripcion`, newsletter y valores históricos intactos, errores CAPTCHA/cuota/red sin avance ni analytics y datos conservados para reintentar. DNI vacío/corto/largo/letras y opciones ajenas frenan el envío; resultado renderizado no presenta credenciales disponibles.
- `npm run check`: código 0, lint sin errores (28 advertencias existentes), typecheck correcto, 363/363 pruebas. `npm run build`: código 0, con dev detenido antes. Restituidas únicamente las dos rutas generadas de `next-env.d.ts` que cambió el build; sin diff residual. `git diff --check` limpio.
- Playwright local, externos bloqueados, POST interceptado y respondido con 201 simulado: Eventos 1280/375, cero solicitudes al montar y exactamente un POST `autoinscripcion` al enviar, sin consulta ni segundo botón. Resultado «Solicitud recibida». Sin envío real, robot ni newsletter externo.
- Capturas `inscripcion-un-paso-1280.png`, `inscripcion-un-paso-375.png` y sus variantes `inscripcion-un-paso-confirmacion-*` en el directorio temporal de capturas. Revisadas visualmente las versiones móvil inicial y escritorio resultado.
- Copy: «Solicitar inscripción»; «Al enviar solicitás la gestión de tu inscripción. No se realiza ningún cobro: pagás después desde el portal del alumno de Teclab.» Resultado: «Vamos a gestionar tu inscripción. Una vez gestionada, Teclab te envía por mail el acceso al portal del alumno para que elijas el medio de pago y abones.»
- No cambios de API, precio, almacenamiento ni robot. La creación efectiva de cuenta sigue fuera de este cambio y no se afirma completada. Sin git add, commit, push ni review por el trabajador; staging previo conservado.
- Corrección de verificación independiente: aviso CAPTCHA compartido neutralizado a «Volvé a verificar la seguridad y enviá la solicitud.»; ya no nombra el CTA ajeno «Inscribirme». RED 5/6 → GREEN 36/36 enfocados. Build anterior se conserva como evidencia; no se repite por modificación de copy.
- Check posterior al ajuste CAPTCHA: código 0, 364/364 pruebas, lint sin errores (28 advertencias existentes), typecheck correcto. `git diff --check` limpio.

### Ajuste aceptado de T6 — aviso sin repetición

- Se conserva intacto el aviso de solicitud sin cobro junto a «Solicitar inscripción». Las dos tarjetas inferiores tienen ahora sólo el párrafo de acceso por mail y pago posterior, sin copiar la explicación previa al envío.
- Una única columna centrada de lectura, limitada a 48rem; misma tarjeta, límites del formulario, título, fondo y colores. Sin separador ni columna vacía.
- RED: 9/10 pruebas de página antes de eliminar el párrafo. GREEN final: 17/17 en inscripcion-pagina y flujo-preinscripcion (incluye aviso CTA intacto y estructura centrada).
- Browser local con todos los POST y externos bloqueados: ambas rutas 1280/375, un párrafo inferior, texto centrado, ancho de lectura 624px/299.5px, sin overflow. Capturas `proximos-pasos-sin-repeticion-1280.png`, `-375.png` y variantes `-teclab-*`. Versiones Eventos escritorio/móvil revisadas visualmente.
- `npm run check` posterior: código 0, 365/365 pruebas, typecheck correcto y lint sin errores (28 advertencias existentes). `git diff --check` limpio. No build requerido para esta deduplicación; dev reiniciado únicamente para capturas. Sin envío real, staging, commit, push ni RDD.

### Corrección aceptada de T6 — continuación completa

- Se elimina el retorno reducido de `PasoListo` que ocultaba portal, ejemplo de mail, guía de acceso y ayuda. La solicitud dedicada reutiliza el panel completo, conserva un único envío y muestra «Solicitud recibida» una sola vez; la bajada pasa a «Acceso y próximos pasos».
- Copy de gestión sin prometer cuenta creada: «Vamos a gestionar tu inscripción. Una vez gestionada, Teclab te envía por mail el acceso al portal para elegir el medio de pago y abonar.» La guía del DNI queda condicionada a la inscripción gestionada; no se muestran credenciales numéricas como disponibles en la solicitud pendiente.
- Se sincronizan sólo los dos archivos de formulario corregidos en la copia externa, preservando sus dos parches de prellenado ficticio. Excepción explícitamente autorizada al original intacto del prototipo: esta corrección sí cambia fuentes del proyecto; la evidencia previa permanece histórica y no se afirma hash original inalterado ahora.
- La copia local mapea únicamente el enlace HTTPS oficial de pago de Teclab a `/portal-alumno`, con login y selección ficticios; mantiene bloqueo de cualquier otro destino externo y ninguna transacción real.
- RED de continuidad: prueba de `PasoListo` falló al faltar «Entrar al portal»; GREEN 6/6 flujo-preinscripcion. Check de fuente: código 0, 366/366 pruebas, typecheck correcto y lint sin errores (28 advertencias existentes). Sin cambio de API ni envío adicional.
- Preview: compilación local correcta. Verificación inicial detectó selector exacto incompatible con el chevrón del summary; corregido. También detectó `/portal-alumno` sin routing HTML (404); superficie `servidor.mjs` ampliada expresamente, se añadió sólo esa ruta, reinició servidor y respondió 200. GET/CSP/bind local intactos.
- Preview final: `node pruebas/verificar.cjs` 38 vistas a1280/375, cero red externa y erroresJS, sin envío al montar y exactamente un `autoinscripcion` por submit dedicado; portal/login/selección ficticios funcionales. `node pruebas/limite-red.cjs` 3/3. Capturas `resultado-completo-*`, `portal-login-*`, `portal-demo-*` en public de la copia local. Sin staging, commit, push ni RDD.
