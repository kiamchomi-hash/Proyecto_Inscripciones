# Pausar automático y avisos de HubSpot Leads Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permitir pausar y reanudar desde el panel todos los ciclos automáticos de HubSpot Leads junto con los avisos locales y de Telegram.

**Architecture:** Reutilizar el interruptor general de automatización en la cabecera. Persistir una pausa manual independiente de los errores transitorios, hacer que el ciclo automático y la emisión de avisos respeten esa preferencia y mantener las acciones manuales disponibles. Si una escritura ya empezó, dejarla finalizar, pero no iniciar otra operación automática después de confirmar la pausa.

**Tech Stack:** Node.js ESM, servidor HTTP local de Node, HTML/CSS/JS generados desde módulos ESM, `node:test`.

---

### Task 1: Cubrir pausa manual y persistencia con pruebas

**Files:**
- Modify: `herramientas/ventas/tests/hubspot-panel.test.mjs`
- Reference: `herramientas/ventas/hubspot-panel.mjs`

**Step 1: Agregar pruebas fallidas**

Cubrir que el estado inicial habilita el automático; el control autenticado local puede pausarlo y reanudarlo; la pausa guardada sobrevive a crear la app desde el estado recargado; una solicitud con origen incorrecto o cuerpo inválido no cambia la pausa; mientras está pausado el tick no invoca `ejecutar`, `ejecutarActivity` ni `notificar`; y al reanudar se vuelve a permitir el ciclo.

**Step 2: Ejecutar la prueba y confirmar que falla**

Run: `node --test herramientas/ventas/tests/hubspot-panel.test.mjs`
Expected: FAIL porque todavía no existe el estado persistente y el endpoint de pausa general.

### Task 2: Implementar control general persistente

**Files:**
- Modify: `herramientas/ventas/hubspot-panel.mjs`
- Modify: `herramientas/ventas/hubspot-panel-ui.mjs`

**Step 1: Agregar el estado persistente independiente**

Inicializar una propiedad booleana con valor habilitado por defecto para instalaciones existentes. No reutilizar `automatico.pausado`, que representa errores recuperables, ni `activity.habilitada`, que tiene su lógica de escrituras verificadas.

**Step 2: Agregar una ruta POST local para cambiar el control**

Validar exclusivamente el booleano esperado, confirmar Host/Origin y JSON con los guardas ya existentes, serializar y persistir con el mecanismo `persistir`. Rechazar claves extra. Al pausar, marcar el control antes de esperar cualquier operación en vuelo; no abortar operaciones CRM ya iniciadas.

**Step 3: Hacer que la pausa frene nuevos ciclos**

Comprobar el estado general antes de iniciar el ciclo, antes de cada operación automática del drenaje y antes de comenzar la revisión automática de Activity. Si la pausa ocurre durante una operación en curso, dejar que termine y evitar iniciar el siguiente trabajo automático.

**Step 4: Silenciar los avisos del panel durante la pausa**

Centralizar la condición antes de las llamadas a `notificar`, incluyendo errores de negocio y avisos de lecturas Activity. No cambiar `avisarResultado` globalmente, porque lo usan otras tareas fuera del panel. Conservar el mensaje y diagnóstico en el estado del panel.

**Step 5: Conectar el interruptor existente a la pausa general**

Hacer que el estado visible del control refleje la preferencia general persistida, actualice el texto activada/detenida y envíe el POST de cambio. Mantener «Actualizar lista» como acción manual; evitar que esa acción vuelva a activar el automático por accidente.

### Task 3: Verificar

**Files:**
- Test: `herramientas/ventas/tests/hubspot-panel.test.mjs`
- Reference: `herramientas/ventas/LEER-hubspot.md`

**Step 1: Correr las pruebas focalizadas**

Run: `node --test herramientas/ventas/tests/hubspot-panel.test.mjs`
Expected: PASS, incluyendo ciclo en vuelo, persistencia, reanudación y supresión de avisos en pausa.

**Step 2: Revisar que los límites se mantengan**

Confirmar mediante pruebas simuladas que no se llama al robot después de pausar, que una operación ya iniciada no se interrumpe, que el endpoint sigue rechazando origen ajeno y que la pausa no envía ni produce escrituras reales en HubSpot.

**Step 3: Actualizar la guía privada del panel**

Documentar el comportamiento del interruptor y la disponibilidad de la actualización manual en `herramientas/ventas/LEER-hubspot.md`. No incluir credenciales, datos comerciales ni rutas absolutas.
