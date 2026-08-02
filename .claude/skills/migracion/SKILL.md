---
name: migracion
description: "Auditar el estado de migración de archivos HTML a Next.js/React/Tailwind en el proyecto CAU Villa Lugano. Usar cuando el usuario dice '/migracion', 'estado de migración', 'qué falta migrar', 'revisá la migración de X', o pide un checklist de migración para un archivo o componente específico."
---

# Migración — Auditoría de estado

## Proceso

1. Leer `MIGRACION.md` en la raíz del proyecto para conocer el estado general
2. Si el usuario especifica un archivo o componente (ej: `faq.html`, `navbar`, `index.html`):
   - Leer el archivo HTML original (si existe)
   - Leer el equivalente Next.js (`app/*/page.tsx`, `components/*.tsx`)
   - Comparar funcionalidad, estilos y estructura
3. Si no especifica archivo, dar el resumen general de todas las fases

## Formato de salida

Producir una lista donde cada línea tiene un indicador a la derecha y una descripción breve de acción:

```
Elemento auditado                    ✅  Completo
Elemento con mejoras posibles        ⚠️  Descripción de qué se puede mejorar
Elemento faltante                    ❌  Descripción de qué falta hacer
```

### Categorías a evaluar por archivo/componente

- **Estructura HTML → JSX**: Markup migrado a componentes React
- **Estilos → Tailwind**: Clases CSS custom reemplazadas por utilidades Tailwind
- **JavaScript → React state**: Lógica inline migrada a hooks (useState, useEffect, useRef, etc.)
- **Datos**: Fetch de JSONs, props, datos hardcodeados
- **Interactividad**: Modales, acordeones, búsqueda, formularios
- **Responsive**: Diseño mobile/tablet/desktop
- **Accesibilidad**: aria-labels, roles, semántica
- **SEO**: Metadata de Next.js (title, description)
- **Rendimiento**: Imágenes optimizadas (next/image), lazy loading, code splitting
- **Fidelidad visual**: Que se vea igual o mejor que el HTML original

### Reglas

- No inventar estado — basar el reporte en lectura real de los archivos
- Si un archivo HTML ya fue eliminado y no hay copia, indicarlo
- Ser concreto en las descripciones: "Faltan aria-labels en los botones del acordeón", no "Mejorar accesibilidad"
- Al final, dar un resumen de 1 línea: "X de Y ítems completos, Z con mejoras posibles, W pendientes"
