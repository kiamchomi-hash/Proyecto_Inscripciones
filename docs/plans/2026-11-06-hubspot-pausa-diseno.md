# Pausa general del automático de HubSpot Leads

## Objetivo

Agregar al panel un control único para detener la automatización de HubSpot Leads y silenciar sus avisos locales y de Telegram. Al reactivarlo, vuelven a funcionar el automático y sus avisos.

## Diseño aprobado

- Reutilizar el interruptor «Automatización» de la cabecera como control general, en lugar de sumar otro interruptor que pueda confundirse con el existente.
- Apagado: no iniciar nuevos ciclos automáticos de negocios ni revisiones automáticas de Activity, y no emitir avisos automáticos desde el panel por notify-send ni por Telegram. Las acciones manuales del panel, como actualizar la lista, siguen disponibles.
- Encendido: reanudar el ciclo automático y permitir avisos ante nuevos cambios de estado.
- Persistir la preferencia para que sobreviva al reinicio del servicio. La pausa manual no debe borrar los diagnósticos ni cambiar el estado de sesión.
- Si una escritura CRM ya comenzó al momento de pausar, dejarla concluir y verificarla; impedir que empiecen operaciones automáticas siguientes. Esto evita dejar un guardado en estado incierto.
- Los fallos automáticos ocurridos mientras está silenciado se conservan en el estado visible, pero no disparan aviso local ni Telegram.

## Contexto técnico

El panel se inicia desde `herramientas/ventas/hubspot-panel-inicio.mjs` y el servicio, ciclo y API local viven en `herramientas/ventas/hubspot-panel.mjs`. La interfaz y el sondeo están en `herramientas/ventas/hubspot-panel-ui.mjs`. El interruptor actual gobierna `activity.habilitada` y `soloListar`, pero el ciclo sigue haciendo lecturas automáticas y puede llamar a `notificar`; `avisarEscritorio` manda notify-send y usa `avisarResultado` para sonido/Telegram. El estado persistente se guarda en `ventas/hubspot-panel-estado.json`, privado y fuera de git.

## Verificación prevista

Probar con `herramientas/ventas/tests/hubspot-panel.test.mjs` y sus ejecutores simulados: pausa persistente, ausencia de ciclos y avisos durante la pausa, reanudación y seguridad del endpoint local (Host/Origin/JSON). No ejecutar escrituras reales en HubSpot ni abrir WhatsApp durante las pruebas.
