# Suscripción en efectivo de Teclab: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** Incluir en los mensajes de precio de Teclab la opción de suscripción en efectivo, en tres cuotas mensuales con gasto administrativo.

**Architecture:** `marcadoresDeFinanciacionTeclab` genera `financiacionCorta` desde los datos del Simulador de Precios. Se agregará ahí la línea aprobada, manteniendo separados los medios de pago de un solo pago y la suscripción; las respuestas del corpus que consumen el marcador recibirán el cambio sin editar el corpus.

**Tech Stack:** Node.js, módulos ES, `node:test`.

---

### Task 1: Actualizar la financiación corta de Teclab

**Files:**
- Modify: `herramientas/ventas/financiacion-teclab.mjs`
- Test: `herramientas/ventas/tests/financiacion-teclab.test.mjs`
- Test: `herramientas/ventas/tests/contexto-carreras.test.mjs`
- Test: `herramientas/ventas/tests/mensaje-precio-teclab.test.mjs`

**Step 1: Actualizar primero la expectativa exacta del marcador**

En la prueba del relevamiento limpio, exigir que `financiacionCorta` contenga, en ese orden y con saltos de línea, el pago por tarjeta, el pago único por plataformas, y la suscripción:

```js
'Podés pagar en 1 pago sin recargo, en 6 cuotas sin interés con Naranja X, o en 3 o 6 cuotas con tarjeta de crédito (con interés según el banco).\n📲 También podés pagar en 1 pago con Mercado Pago, Pago Fácil o Rapipago.\n💵 Si no tenés tarjeta, podés pagar por suscripción en efectivo: son 3 cuotas mensuales con un gasto administrativo.'
```

**Step 2: Ejecutar la prueba y confirmar que falla**

Run: `node --test herramientas/ventas/tests/financiacion-teclab.test.mjs`
Expected: FAIL porque el marcador actual no incluye emojis ni la línea de suscripción.

**Step 3: Cambiar la composición mínima del marcador**

En `marcadoresDeFinanciacionTeclab`, agregar los emojis aprobados a las líneas de plataformas y suscripción. Conservar el texto dinámico de tarjeta y cuotas que el simulador genera. No agregar montos ni porcentajes de recargo.

**Step 4: Ajustar las pruebas de integración del texto**

Actualizar `contexto-carreras.test.mjs` para reconocer la línea de plataformas y la suscripción después de la frase dinámica de tarjetas. Actualizar `mensaje-precio-teclab.test.mjs` para probar que el mensaje rellenado contiene las dos líneas nuevas y conserva el párrafo inicial de financiación.

**Step 5: Ejecutar las pruebas del área**

Run: `node --test herramientas/ventas/tests/financiacion-teclab.test.mjs herramientas/ventas/tests/contexto-carreras.test.mjs herramientas/ventas/tests/mensaje-precio-teclab.test.mjs`
Expected: todas las pruebas pasan.

**Step 6: Revisar el diff propio y commitear sólo estos archivos**

No incluir los cambios preexistentes en `cloudflare/tests/e2e.test.mjs`, `components/formularios/formulario-lead.tsx` ni `components/index/hero-carousel.tsx`.

```bash
git add herramientas/ventas/financiacion-teclab.mjs herramientas/ventas/tests/financiacion-teclab.test.mjs herramientas/ventas/tests/contexto-carreras.test.mjs herramientas/ventas/tests/mensaje-precio-teclab.test.mjs
git diff --cached
git commit -m "fix(ventas): incluir suscripcion en efectivo de Teclab"
```
