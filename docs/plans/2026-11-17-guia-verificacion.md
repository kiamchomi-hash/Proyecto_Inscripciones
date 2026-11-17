# Guía práctica de verificación Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Documentar una ruta breve de verificación por tipo de cambio y un checklist pequeño activado por señales del diff.

**Architecture:** Añadir dos documentos canónicos en `docs/`: una guía de uso cotidiano y un checklist de confiabilidad. Enlazarlos desde `AGENTS.md` sin reemplazar los controles existentes ni crear automatización.

**Tech Stack:** Markdown; revisión de enlaces y comandos documentados.

---

### Task 1: Redactar guía práctica

**Files:**
- Create: `docs/verificacion.md`
- Read: `AGENTS.md`
- Read: `cloudflare/LEER.md`

**Step 1: Escribir la guía**

Incluir el recorrido común (mirar diff, elegir controles por área, ejecutar el conjunto mínimo suficiente, revisar el resultado) y una matriz breve por tipo de cambio. Distinguir controles raíz de los de `cloudflare/`; documentar que los cambios visuales requieren revisión escritorio/móvil y build, mientras que lógica de datos/API requiere pruebas del área afectada. Para trabajos visuales, recordar entregar capturas visibles en el chat.

**Step 2: Comprobar comandos**

Verificar que cada comando exista en la documentación actual y no presentar el `check` raíz como cobertura del paquete Cloudflare ni como auditoría de producción.

### Task 2: Crear checklist guiado por el diff

**Files:**
- Create: `docs/checklist-confiabilidad.md`
- Read: `docs/seguridad.md`
- Read: `docs/criterios.md`
- Read: `docs/controles-automaticos.md`

**Step 1: Elegir disparadores sustentados**

Usar sólo un conjunto corto de áreas con incidentes o reglas verificadas: cambios de contratos/datos, rutas/redirects/SEO, formularios/seguridad, renderizado visual y workflow/publicación. Para cada una, escribir disparador, riesgo a revisar y evidencia concreta; enlazar el antecedente cuando exista.

**Step 2: Revisar alcance y utilidad**

Eliminar preguntas redundantes con tests automáticos y cualquier regla genérica sin evidencia. Confirmar que el checklist no ordene operar sobre producción ni tocar D1.

### Task 3: Integrar y validar documentación

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/verificacion.md`
- Modify: `docs/checklist-confiabilidad.md`

**Step 1: Enlazar la guía**

Agregar en `AGENTS.md` una referencia breve para que se consulte antes de verificar un cambio, sin duplicar el contenido.

**Step 2: Validar**

Revisar enlaces relativos, nombres de comandos y consistencia con las reglas vigentes de `AGENTS.md`, `docs/criterios.md` y `cloudflare/LEER.md`.

**Step 3: Informar**

Resumir los archivos añadidos y aclarar que no se modificaron suites, gates ni workflows.
