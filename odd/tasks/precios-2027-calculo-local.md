# Siglo 21 2027: cálculo local como en 2026

## Objetivo
Que la actualización diaria de Siglo 21 1A 2027 calcule los finales en local a partir del libro "1 2027", igual que la planilla 2026, en vez de cotizar las ~70 carreras una por una en la calculadora de CASA.

## Problema
El relevamiento por calculadora tarda ~2,4 min por carrera (~3 h el lote), depende de la navegación por teclado en Excel Online y un solo error de foco aborta la tanda. El 16/10/2026 se cortó dos veces (09:47 y 14:39) con 30/70 y el buscador quedó en "Actualización incompleta - Valores de referencia". El timer sólo intenta a las 09 h y 14 h, con `TimeoutStartSec=1h`.

## Evidencia que habilita el cambio
- El libro 2027 extraído trae la promoción 1A con `completa: true`, `confiable: true`, vigencia y porcentajes por segmento.
- Cálculo local (lista del libro + promoción + 10% Amigo Referido desde el segundo concepto, `aplicarDescuentos`) contra finales observados en CASA del 15 y 16/10/2026: 100 de 100 coinciden.

## Alcance autorizado
- Paso diario nuevo que calcula los finales 1A desde el libro y los registra con procedencia de cálculo local, sólo con promoción completa, confiable y vigente.
- Control por muestra contra CASA (pocas carreras): una diferencia de importes bloquea; una falla técnica de la calculadora queda como aviso y no bloquea.
- `actualizar-todo.mjs` usa el paso nuevo; el relevamiento masivo por calculadora queda disponible a mano.
- Fuera de alcance: 2026, Teclab, Identidad, financiación, cambios de esquema.

## Restricciones
- `herramientas/ventas/` y `ventas/` son privados y gitignorados: no se versionan ni se citan importes acá.
- Promoción vencida, incompleta o no confiable no habilita finales: el estado queda incompleto como hasta ahora.

## Tareas
- [x] T1 — Paso local de finales 1A 2027 con procedencia propia, control por muestra e integración en la actualización diaria, con pruebas. Ruta: delegada (escritor único, varios archivos privados no triviales).
- [x] T2 — Correr el paso real, regenerar el buscador y verificar que el estado quede completo.

## Checks
Pruebas focales de `herramientas/ventas/tests` (RED/GREEN), suite comercial, `npm run check`.

## Progreso
16/10/2026: diagnóstico y comparación 100/100 hechos; documento creado.
- T1 (delegada): paso nuevo `calcular-precios-2027.mjs`, procedencia `calculo_libro`, control por muestra de 2 carreras rotando por fecha. RED 7/14, GREEN 20/20 focales. Suite comercial 485/486; la falla restante (palabras clave de áreas contra `components/index/types.ts`) es ajena a este cambio.
- T2: `actualizar-todo.mjs --solo-siglo21-2027 --sin-publicar` en 2 min 33 s, 70/70 finales, estado `completa`, buscador local regenerado. El cálculo local da los finales de CASA al centavo en las 70 cotizaciones observadas.
- El control contra CASA no llegó a comparar: Excel Online no cargó en 60 s en las dos carreras de la muestra y quedó como aviso, según lo diseñado. Pendiente: publicación online, que corre con el próximo intento programado o a mano.
- Espejo en Engram: pendiente.
