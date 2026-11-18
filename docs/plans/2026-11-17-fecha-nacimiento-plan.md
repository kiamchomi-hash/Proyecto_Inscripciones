# Plan de implementación: fecha de nacimiento segmentada

> **Para Claude:** REQUIRED SUB-SKILL: usar `superpowers:executing-plans` para ejecutar este plan tarea por tarea.

**Objetivo:** Simplificar el ingreso de la fecha de nacimiento con un solo campo `DD/MM/AAAA`, sin botón de calendario visible y conservando su código como componente reutilizable.

**Arquitectura:** `CampoFecha` mantiene un campo accesible con formato automático y sigue emitiendo una fecha ISO válida al formulario. El calendario se extrae a un componente independiente que no se renderiza actualmente. Las pruebas existentes de fecha y E2E cubren el flujo.

**Tecnologías:** React, TypeScript, Astro, Playwright, Node test runner.

---

### Tarea 1: Cubrir los segmentos de fecha

**Archivos:**
- Modificar: `cloudflare/tests/e2e.test.mjs`
- Consultar: `components/formularios/fecha.ts`

1. Añadir una prueba E2E que escriba los ocho dígitos en el campo de fecha y compruebe que se agregan las barras.
2. Comprobar que pegar una fecha completa conserva el formato.
3. Comprobar que una fecha real se mantiene como ISO en el formulario y que una fecha imposible muestra el error.
4. Comprobar que el formulario ya no muestra el control de calendario.
5. Ejecutar `npm run test:e2e` desde `cloudflare/` y confirmar que la prueba nueva falla antes del cambio.

### Tarea 2: Implementar los campos y conservar el calendario

**Archivos:**
- Modificar: `components/formularios/formulario-lead.tsx`
- Crear: `components/formularios/calendario-fecha.tsx`

1. Extraer la interfaz y la lógica actual del calendario a `CalendarioFecha`, con props para valor ISO y callback, sin montarlo desde `CampoFecha`.
2. Mantener el único input de texto con `inputMode="numeric"`, autocompletado de fecha de nacimiento y formato de barras.
3. Convertir la fecha completa mediante `fechaEntradaAIso`; conservar el valor ISO, el mensaje de error y el espacio reservado que evita saltos de layout.
4. Quitar del render el botón y el panel de calendario; conservarlos en el componente independiente.
5. Correr las pruebas de fecha y la prueba E2E focalizada; verificar pegado, accesibilidad, calendario ausente y fecha ISO.

### Tarea 3: Verificar presentación y publicación

**Archivos:**
- Actualizar, sólo si la comparación visual revisada lo justifica: `cloudflare/tests/fixtures/visuales-corregidas/`
- Mantener: `components/formularios/formulario-lead.tsx` y `components/formularios/calendario-fecha.tsx`

1. Revisar capturas de escritorio y móvil con el campo segmentado, sin calendario visible.
2. Actualizar sólo las referencias afectadas después de revisar el resultado.
3. Ejecutar `npm run check` en la raíz y `npm run check` en `cloudflare/`.
4. Revisar `git diff --cached` y `git diff`, manteniendo fuera cualquier archivo ajeno.
5. Usar el publicador guiado; no publicar si algún control falla.
