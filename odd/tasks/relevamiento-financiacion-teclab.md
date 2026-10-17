# Relevamiento mensual de la financiación de Teclab

## Objetivo

Que la financiación de Teclab (bot, buscador y modal «Ver precio») se mantenga igual a lo que muestra el Simulador de Precios del Portal Administrativo, relevándolo solo una vez por mes.

## Problema

El 16/10/2026 se relevó a mano el simulador del portal: no hay cuotas sin interés, y el bot decía «1 o 3 sin interés» por seguir una placa vieja. Las tasas, los bancos y los medios de pago cambian, y pueden aparecer formas de pago nuevas que un script fijo no sabría mostrar.

## Alcance (pedido del usuario, 16/10/2026)

- Script que entra al portal con `TECLAB_DNI` y `TECLAB_PASSWORD` de `.env.local`, busca el lead de prueba, elige una carrera de referencia y lee todo lo que ofrece el simulador sin tocar «Crear» ni enviar nada.
- Descubre lo que hay, no recorre una lista fija: formas de pago, tarjetas, bancos, cuotas y opciones de la suscripción.
- Cambios conocidos (tasas, CFT, bancos que cambian de grupo, aparecen o desaparecen): actualiza la fuente, regenera bot y buscador, publica el buscador y avisa por Telegram.
- Estructura nueva (forma de pago, tarjeta, cantidad de cuotas, opción de suscripción o pantalla que no entiende): no publica; avisa por Telegram con lo encontrado.
- Si cambian las tasas, el aviso dice que el modal del sitio (`components/formularios/financiacion-teclab.ts`) necesita commit y deploy.
- Timer mensual de systemd del usuario, con el mismo patrón que `cau-precios`.

## Restricciones

- Nunca «Crear», «Enviar resumen» ni «Enviar link de pago».
- Las credenciales sólo se leen del entorno; no se escriben en logs, salidas ni avisos.
- `herramientas/ventas/` y `ventas/` son privados y gitignorados.

## Tareas

- [x] T1. Script de relevamiento, comparación y clasificación, con pruebas deterministas de la comparación (ruta: delegada; disparador: varios archivos no triviales y lectura previa del flujo de ventas).
- [x] T2. Integración: regenerar, publicar y avisar por Telegram; timer mensual (ruta: delegada, mismo writer).
- [x] T3. Corrida real autorizada y verificación del resultado (ruta: inline). Cerrada el 17/10/2026, ver «Cierre».

## Verificación

- `node --test --test-isolation=none herramientas/ventas/tests/*.test.mjs`
- Corrida real del script en modo sin publicar.

## Progreso

Documento creado el 16/10/2026.

### T1 y T2 (16/10/2026, writer delegado)

- Script: `herramientas/ventas/relevar-financiacion-teclab.mjs` (privado). Funciones puras exportadas: `parsearImporte`, `parsearOpcionCuota`, `armarFuente`, `compararRelevamientos`, `evaluarRelevamiento` (suma `validarExtraccionFinanciacionTeclab`), `decidirAccion`, `mensajeAviso`, `ocultarSecretos`, `parsearArgumentos`. El navegador (Playwright, Chromium sin ventana) queda aparte en `relevarEnPortal`.
- La fuente guarda una sección `estructura` (formas de pago, tarjetas, cuotas, suscripción con totales). `validarExtraccionFinanciacionTeclab` no rechaza claves extra, así que va en el mismo archivo. La fuente relevada a mano no la tiene: se compara contra `ESTRUCTURA_CONOCIDA` y la primera corrida la escribe (cuenta como cambio).
- Sin cambios: no escribe y avisa en una línea (el silencio no distingue «no cambió» de «no corrió»). Cambio conocido: respalda la anterior, escribe la fuente, corre extraer-externos, los dos generadores y publicar-buscador, y avisa; si cambiaron tasas o bancos, el aviso pide revisar `components/formularios/financiacion-teclab.ts`. Estructura nueva o lectura incompleta: no escribe, deja `ventas/fuentes/teclab/revision-financiacion/revisar-*.json` y avisa; sale con 2. Error: sale con 1.
- `--sin-publicar` no escribe la fuente, no publica y no manda Telegram; deja `revision-financiacion/sin-publicar-*.json`.
- Unidades: `herramientas/ventas/systemd/cau-financiacion-teclab.service` y `.timer` (día 1, 10:00 ART, Persistent=true), sin instalar; el comando está en el encabezado del `.timer`. `systemd-analyze --user verify` sin errores; próxima corrida calculada: 01/11/2026 10:00 -03.
- Documentación: sección en `docs/herramientas.md` y nota en la skill `bot_respuestas`.

Verificación observada:

- `node --test herramientas/ventas/tests/relevar-financiacion-teclab.test.mjs`: RED antes de implementar (módulo inexistente); después 16/16.
- `node --test --test-isolation=none herramientas/ventas/tests/*.test.mjs`: 471/471.
- `node --check herramientas/ventas/relevar-financiacion-teclab.mjs`: ok.
- `npm run check`: salida 0, 475/475 (con el mensaje conocido de `npm ci`).

Pendiente: T3, corrida real autorizada en modo `--sin-publicar`; el flujo de navegador no se probó contra el portal.

### Punto de pausa (16/10/2026, a pedido del usuario)

Estado al detener:

- Tres corridas reales `--sin-publicar`: la protección funcionó (salida 2, no se escribió la fuente ni se publicó). La tercera recorrió las 8 tarjetas pero leyó mal.
- Causa raíz verificada en el DOM: el script toma «el último menú activo» (`.v-menu__content.menuable__content__active` + `.last()`), y Vuetify deja menús viejos (el de Carrera queda activo y hay listas duplicadas). Resultado: opciones repetidas y cuotas de un banco atribuidas a otro. Cada campo tiene un elemento con `aria-owns="list-NNN"` (`role=combobox` en Carrera, `role=button` en Tarjeta/Banco/Cuotas); hay que leer siempre `#list-NNN`. Los radios de forma de pago están en un bloque hermano del título del simulador (ya corregido: raíz `.preregistration-scroll`). El autocomplete de Carrera sólo abre con click real.
- Lectura correcta verificada a mano por `aria-owns`: Naranja X → 1 cuota, **6 cuotas sin interés** ($ 102.764,46 con Seguros, mismo total) y **Plan Z**; Sucrédito → 1 y 3 cuotas (sin 6).
- **Lo publicado hoy tiene errores**: bot, buscador y modal del sitio dicen «no hay cuotas sin interés» y Naranja X «sólo 1 pago»; Sucrédito figura con 6 cuotas. La fuente `ventas/fuentes/teclab/conocimiento-hermes/financiacion_teclab.json` se armó con el relevamiento manual del 16/10, que tuvo el mismo problema de menús viejos: puede haber más bancos mal agrupados.
- Un writer estaba reescribiendo la lectura por `aria-owns` y modelando Plan Z como opción conocida; se detuvo a mitad. El script compila y sus pruebas pasan (19/19), pero el cambio no está verificado contra el portal. Últimos archivos: `ventas/fuentes/teclab/revision-financiacion/sin-publicar-2026-10-16T17-40-21-985Z.json` y `error-2026-10-16T17-42-23-216Z.json`.
- El timer mensual está escrito en `herramientas/ventas/systemd/` y **no instalado**.

Para retomar:

1. Terminar la lectura por `aria-owns` (esperar a que la lista de Cuotas se actualice tras elegir banco), Plan Z como plan conocido aceptado por `validarExtraccionFinanciacionTeclab`, y el total de la suscripción desde «Tu Resumen».
2. Lograr una corrida `--sin-publicar` limpia (~20 min) y compararla con la fuente.
3. Con esos datos: escribir la fuente, regenerar bot y buscador y publicarlo; ajustar `marcadoresDeFinanciacionTeclab`, el corpus (hoy hay un test que prohíbe «sin interés» en Teclab y deja de ser verdad para Naranja X) y `components/formularios/financiacion-teclab.ts` con su test; commit y deploy.
4. Instalar el timer mensual.

### Avance fuera de la sesión original (16/10/2026, noche)

- La lectura por `aria-owns` ya estaba completa. Se agregó en `relevarEnPortal` una espera a que los radios de forma de pago se estabilicen (aparecen de a uno y la primera lectura veía sólo «Tarjeta»).
- Corrida real `--sin-publicar --solo-tarjetas "Naranja,Sucredito"` (el nombre en el portal es «Naranja», no «Naranja X»): Naranja → 6 cuotas 0,00% y Plan Z; Sucrédito → sólo 3 cuotas; suscripción con sus dos opciones de Efectivo ($ 770.733,48). Coincide con la verificación manual. Archivo: `ventas/fuentes/teclab/revision-financiacion/sin-publicar-2026-10-16T23-16-29-518Z.json`.
- La corrida completa se lanzó y se detuvo a pedido del usuario, sin resultado. Sigue pendiente el paso 2 de «Para retomar».

### Cierre (17/10/2026)

- Faltaba otra carrera de tiempo: tras elegir un banco, la lista de Cuotas vieja se leía dos veces, parecía estable y quedaba atribuida al banco siguiente (BBVA y BESTCARD de Visa, Cocos y CencoPay de Mastercard cambiaban entre corridas; el primer banco de cada tarjeta a veces salía «sólo 1 pago»). Ahora espera la respuesta de `api.teclab.edu.ar`, comprueba que el campo Banco muestre el banco elegido y exige dos lecturas iguales separadas por 1,5 s. Cuatro pasadas de Visa y Mastercard después del cambio dieron exactamente lo mismo.
- Adaptación a cuotas sin interés y Plan Z (writer delegado): marcadores del bot, corpus con variantes `requiere`/`ausente` sobre `tarjetasSinInteres`, sección de formas de pago del buscador y modal del sitio. Suite privada 495/495; sitio 489/489; lint sin errores; typecheck limpio.
- Corrida real en modo normal: escribió la fuente, regeneró bot y buscador y publicó el buscador (salida 0). Resultado: 1 pago sin recargo con cualquier tarjeta; Naranja X en 6 cuotas sin interés o Plan Z; Visa y Mastercard de Galicia, Nación, Santander, BBVA y Macro al 6,15% (3c) y 12,48% (6c); el resto al 7,41% y 12,99%; Sucrédito sólo 3 cuotas; AMEX de Galicia, Patagonia, Macro y Reba sólo 1 pago. El modal del sitio coincide con esa fuente.
- Timer `cau-financiacion-teclab` instalado y habilitado; próxima corrida 01/11/2026 10:00.
