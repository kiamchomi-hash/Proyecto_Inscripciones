# Suscripción en efectivo en el mensaje de precios de Teclab

## Objetivo

Que el mensaje de precios de Teclab mencione también la suscripción en efectivo para quien no tiene tarjeta, además de los medios de pago ya informados.

## Diseño aprobado

Modificar el marcador común `financiacionCorta` en `herramientas/ventas/financiacion-teclab.mjs`, que completa las respuestas de precio del bot. Mantener la frase actual de financiación por tarjetas y sumar estas dos líneas:

```text
📲 También podés pagar en 1 pago con Mercado Pago, Pago Fácil o Rapipago.
💵 Si no tenés tarjeta, podés pagar por suscripción en efectivo: son 3 cuotas mensuales con un gasto administrativo.
```

No agregar importes ni afirmar el recargo porcentual: el cargo depende del precio y el dato porcentual disponible no es una cotización vigente verificable.

## Verificación

Actualizar las pruebas del marcador y del mensaje de precios para confirmar el texto, los saltos de línea y que la financiación variable existente siga funcionando. Ejecutar las pruebas afectadas del área de ventas.
