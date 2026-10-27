# Adaptar extractor Teclab al portal actual

**Resuelto el 23/10/2026:** adaptación y verificación independiente completas. No se ejecutó la actualización completa ni se publicaron precios.

## Objetivo y alcance autorizado
Restablecer la extracción de precios frente al menú contraído y formulario nuevo del portal Teclab. Adaptar selectores y probar lectura sin crear preinscripciones, guardar leads, publicar precios ni ejecutar el actualizador completo. Usar únicamente la credencial del actualizador para el portal autorizado. Preservar cambios ajenos y material comercial ignorado; no forzar su inclusión en Git.

## Evidencia y restricciones
El 22/10/2026 a las 09:19, el extractor agotó 15 segundos esperando Admisión: el único elemento coincidente estaba oculto por el menú rail. Identidad descargó correctamente su fuente a las 09:19:06, pero el fallo de Teclab bloqueó los derivados compartidos. No fue un problema de contraseña.

El portal actual duplica etiquetas (una copia sin `for`), vincula menús mediante `aria-controls`, usa overlays y opciones con roles accesibles, y tapa el input de período con la selección: el activador es `.v-field`. El menú lateral también contiene elementos `role=option`, de modo que no se pueden buscar opciones globalmente.

La consulta GET `products-with-price` se dispara al cambiar Carrera en Información del lead cuando hay carrera, localidad y lead resuelto. «Simular precio» sólo navega al paso; la espera de respuesta debe comenzar antes de cambiar la carrera. Esto se verificó leyendo el recurso público del formulario, sin llamar a búsquedas de leads.

RDD desactivado globalmente: no iniciar revisión nativa. Trabajar en main según política específica, sin push ni commits de material comercial. El alcance del lanzador 2B se amplió explícitamente para conservar la ejecución después de hacer importable el módulo base.

## Tareas
- [x] T3 Estabilizar inventarios virtualizados y selección de financiación. Ruta delegated: evidencia viva y escritura con análisis; fixtures RED antes del cambio y nueva verificación completa, sin ampliar timeouts. Autorizado por el usuario al pedir resolver las inestabilidades restantes.
- [x] T1 Adaptar navegación y formulario con pruebas de regresión RED/GREEN.
- [x] T2 Cerrar la verificación independiente del candidato final. Resultado independiente final: 15/15 fixtures y sintaxis de ambos extractores correctos; spot check del coordinador correcto. Cotización real, resumen, aritmética, vigencia y financiación completa comprobados.

## Ruta y aceptación
T1 delegated: preparación y escritura con análisis. T2 delegated: pruebas y verificación independiente. Forecast inicial 150–300 líneas, estrategia ask-on-risk. No publicación ni commits de material comercial. No ejecutar el actualizador completo para verificar.

### Archivos propios
- `ventas/fuentes/teclab/marketing-agent/precios_lote_extractor.js`: selectores actuales, menú por campo, etiquetas funcionales, lista virtualizada, respuesta antes del cambio de Carrera, rótulo Matrícula con tilde, importación sin ejecución automática. No se cambió el cálculo de importes ni períodos.
- `ventas/fuentes/teclab/marketing-agent/precios_lote_extractor_2b.js`: llama explícitamente a `run()` y conserva `PRICE_STRUCTURE=matricula-2b` y el error del proceso.
- `ventas/fuentes/teclab/marketing-agent/tests/precios-portal.test.cjs`: fixtures locales con Playwright y pruebas de importación/lanzador sin red.
- `referencias/2026-10-22-teclab-extractor.md`: fuentes del diagnóstico.

## Verificación observada
1. RED anterior a modificar la fuente: `node --test ventas/fuentes/teclab/marketing-agent/tests/precios-portal.test.cjs`: 5 pruebas, 4 fallidas y 1 correcta. Fallaron menú rail, etiquetas duplicadas, opciones actuales y período.
2. RED adicional con el disparador real de precios: mismo comando, 6 pruebas, 5 correctas y 1 fallida; el evento se perdía al esperar después de elegir Carrera.
3. GREEN final: mismo comando, 8 pruebas correctas, 0 fallidas. Cubre los cuatro cambios del DOM, cálculo aritmético, consulta disparada al seleccionar carrera, importación sin abrir navegador y lanzador 2B con stub.
4. `node --check ventas/fuentes/teclab/marketing-agent/precios_lote_extractor.js`: salida 0.
5. `node --check ventas/fuentes/teclab/marketing-agent/precios_lote_extractor_2b.js`: salida 0.
6. Prueba viva con el código corregido y credencial exacta del actualizador: login, Admisión, Preinscripciones, apertura de Nuevo, selección de `2B 2026` y lectura de 18 carreras. No se confundieron opciones del menú lateral. El email del lead permaneció vacío. Tras el login se bloquearon todas las solicitudes distintas de GET/HEAD/OPTIONS; sólo se bloquearon POST de telemetría `/cdn-cgi/rum`. No se pulsaron Crear, Guardar ni Enviar.

Las pruebas con Chromium requieren permiso para lanzar el navegador fuera de la restricción del sandbox; corren sobre fixtures locales, sin acceso al portal. No se ejecutó `npm run check` porque el código privado no participa en el bundle del sitio; la verificación aplicable está arriba.

## Límite inicial y nueva autorización
La búsqueda del lead de consulta fue inicialmente rechazada por falta de autorización específica para los datos personales. No se reintentó bajo aquel alcance. Posteriormente el usuario autorizó expresamente comprobar la cotización real consultando el lead existente del actualizador, sólo lectura, sin crear ni guardar. La nueva ejecución fue aceptada con ese permiso específico.

## Cotización real comprobada tras la autorización
Se ejecutó `node` mediante entrada estándar, importando los helpers corregidos sin invocar `run()` ni escribir resultados. Secuencia: `login`, `abrirFormulario` con el lead existente, `elegirPeriodo`, `listarCarreras`, `simular` y `armarResultado`. Sólo la autenticación ocurrió antes del control de red; desde entonces se bloquearon todas las solicitudes distintas de GET/HEAD/OPTIONS.

Resultado real: matrícula, bimestre 2B, total y fecha de promoción presentes; ambas selecciones de carrera coinciden; la suma de conceptos menos descuentos coincide con el total. La promoción es vigente para la fecha cliente 23/10/2026. Se recibieron consultas reales GET `products-with-price`. No se registran importes, email ni nombre del lead en este documento.

No se ejecutó el actualizador completo, no se publicaron precios ni buscador, no se guardaron JSON comerciales, no se pulsaron Crear/Guardar/Enviar y no se crearon leads ni preinscripciones.

## Historial: primera verificación financiera parcial
Se invocó `extraerFinanciacion` sobre el resultado real, sólo en memoria y manteniendo bloqueadas las escrituras. La lectura completó cuatro tarjetas y 149 consultas financieras GET antes de fallar en Mastercard / Takenos con `locator.click: Timeout 30000ms exceeded`. Se observaron cero intentos de mutación de negocio y cuatro POST de telemetría bloqueados.

La prueba aislada posterior, sin repetir el recorrido completo, sí eligió Mastercard y Takenos y leyó una opción de cuotas. Por tanto el timeout del recorrido largo no está reproducido de forma determinista y no se atribuye a una causa no comprobada. En ese punto todavía no había prueba integral de todas las tarjetas, bancos y cuotas; la fase T3 posterior la completó.

Hallazgo a investigar: `listarCarreras` devolvió 18 en las primeras pruebas y 11 en una ejecución posterior. La lectura completa de listas virtualizadas debe estabilizarse y verificarse antes de declarar cobertura total de financiación. No se aplicaron correcciones adicionales durante esta fase de comprobación, que sólo autorizaba lectura y actualización del seguimiento.

Ese pendiente fue retomado con autorización del usuario en T3 y corregido según la evidencia posterior. El relevador mensual `herramientas/ventas/relevar-financiacion-teclab.mjs` conserva selectores anteriores y requiere un seguimiento separado; no se editó.

Sin commit ni push por la excepción de material comercial privado. El espejo Engram queda a cargo del coordinador. Cambios ajenos preservados.

### Verificación independiente anterior (8 fixtures)
Verificador independiente: 8/8 fixtures aprobados con permiso para Chromium y sintaxis de ambos JS correcta; sin bloqueantes en alcance inspeccionado. El spot check del coordinador dentro del sandbox falló al lanzar la suite; no se interpreta como aprobación ni como regresión del código. Esta verificación local es anterior a la nueva autorización del lead. La cotización real y la financiación quedaron comprobadas después. Resta incorporar la verificación independiente del candidato final de 15 fixtures. No se ejecutó actualización ni publicación.

## T3: corrección de las inestabilidades restantes

### Causas verificadas
- Se leían opciones montadas fuera del viewport y se cortaba por scroll repetido sin comprobar cobertura de `aria-setsize`. El fixture reprodujo pérdida de las opciones iniciales cuando el menú empezaba desplazado.
- Los `v-select` del portal tienen `readonly=false` pero `inputmode=none`; rellenarlos como un autocomplete era incorrecto. El fixture lo detecta por el evento de entrada indebido.
- El menú ejecuta recálculo/foco en `onAfterEnter`: se midieron animaciones de 225/450 ms y cambios de scroll/altura durante ellas. Unos frames estables antes de acabar la transición no constituyen fin del render; el fixture reprodujo sólo 6 de 10 elementos leídos.
- Los nodos reciclados pueden quedar fuera de pantalla e interceptar la selección por texto. En VSelect se usa ahora su interacción nativa por teclado y se verifica la etiqueta elegida, en lugar de clicar un nodo reciclado. El componente mantiene un prefijo de búsqueda durante 1000 ms: se respeta únicamente el tiempo restante de ese contrato por campo.
- Un campo visible puede seguir sin opciones mientras termina su GET. Se espera a las opciones del `select` nativo generado por el componente antes de enviar teclas.

### Pruebas locales y acotadas
- RED: 11 pruebas, 8 correctas y 3 fallidas por inventario, entrada indebida y opción duplicada fuera de viewport.
- RED de transición: 13 pruebas, 12 correctas y 1 fallida, inventario de 6/10.
- RED de selección nativa no montada: 14 pruebas, 13 correctas y 1 fallida.
- RED de opciones pendientes: 15 pruebas, 14 correctas y 1 fallida.
- GREEN final: `node --test ventas/fuentes/teclab/marketing-agent/tests/precios-portal.test.cjs`, 15/15 correctas. Incluye rechazo explícito de inventarios incompletos.
- Sintaxis de ambos extractores comprobada con `node --check`, salida 0.
- Portal: tres alternancias completas Takenos/SKRILL (seis selecciones) confirmadas con el código final y escrituras bloqueadas.

### Verificación completa final observada
Tras aprobar las tres alternancias se ejecutó una única pasada completa final, con salida 0:
- Inventarios de carreras: 18/18/18, mismo orden.
- Cotización real: matrícula, bimestre 2B, total y promoción presentes; aritmética validada.
- Financiación completa: ocho tarjetas, 121 combinaciones tarjeta/banco y planes validados; todos los totales financiados finitos.
- Auditoría de red: dos GET de precios, 1258 lecturas financieras, cero intentos de mutación de negocio y cuatro POST de telemetría bloqueados.

Los resultados se conservaron únicamente en memoria. No se ejecutó `run()`, no se escribieron archivos comerciales ni se publicaron precios o buscador. No hay commit ni push: los extractores y sus tests son material privado ignorado. La aprobación de esta lectura no equivale a haber actualizado los precios consumidos por el buscador: esa operación sigue fuera del alcance de la prueba.

La verificación independiente final se incorpora en el cierre siguiente; T2 queda cerrado. El espejo Engram permanece a cargo del coordinador. El código fuente queda congelado tras estos controles; no se modificó después de la pasada final.

## Cierre de verificación independiente
Verificador independiente final: 15/15 fixtures aprobados y sintaxis de ambos JS correcta, sin bloqueantes en el alcance inspeccionado. Spot check del coordinador: node --check de ambos extractores, salida 0. T2 verificado para el alcance de lectura segura: inventarios repetidos y cotización de una carrera con recorrido financiero completo. No se ejecutó actualización completa de todas las carreras ni publicación; los archivos comerciales mantienen su estado anterior.

## Medios de pago adicionales: condiciones pendientes

Relevamiento de checkout comunicado por el coordinador el 23/10/2026: MercadoPago con dinero en cuenta, GoCuotas, WiBond, PagoFácil y Rapipago aparecen como opciones con el mismo total visible. Esta observación no demuestra cuotas sin interés ni ausencia de cargos posteriores del proveedor. No se realizaron pagos ni se emitieron cupones.

- [ ] P1 Investigar, para cada uno de los cinco medios, cantidad y periodicidad de cuotas, intereses, CFT, cargos administrativos y condiciones de acceso. Contrastar las condiciones mostradas antes de cualquier confirmación; no inferirlas del total inicial del checkout.

El acceso inicial con las credenciales configuradas fue rechazado; posteriormente el usuario inició sesión manualmente en el navegador integrado y se recorrieron los cinco medios hasta Datos de Facturación. No se pulsó Pagar ni se verificaron condiciones finales dentro de los proveedores. No hay un bloqueo de autenticación confirmado vigente. Este seguimiento es independiente del extractor, que queda resuelto.
