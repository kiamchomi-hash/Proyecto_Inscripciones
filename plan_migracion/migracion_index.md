# Migración — index.html → app/page.tsx

Estado: PLACEHOLDER

Archivos: app/page.tsx (placeholder)
HTML original: migracion_pendiente/index.html (la página más compleja del sitio)

---

## Tecnologías por fase

### Fase 1 — Base
Tailwind CSS                       ❌  Solo clases básicas en el placeholder

### Fase 2 — Lenguaje
TypeScript                         ✅  Archivo .tsx
Axios                              ❌  No se usa — el original hacía fetch a datos_carreras.json
Zod                                ❌  No se usa — el original validaba con schemas.ts via Express

### Fase 3 — Framework
React + Next.js                    ⚠️  Componente existe pero es solo texto placeholder
Zustand                            ❌  No se usa

### Fase 4 — UI
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa

### Fase 5 — Backend
Supabase (PostgreSQL)              ❌  No conectado — datos_carreras.json (60+ carreras) sin migrar a BD

### Fase 6 — Extras
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

---

## Auditoría general

Estructura HTML → JSX              ❌  Solo placeholder, no hay componentes migrados
Estilos → Tailwind                 ❌  Nada migrado
JavaScript → React state           ❌  Lógica compleja sin migrar: búsqueda fuzzy (Levenshtein), drag-and-drop, calculadora de aranceles, localStorage
Datos                              ❌  datos_carreras.json (60+ carreras) sin migrar a Supabase
Interactividad                     ❌  Buscador, filtros, formulario de inscripción, calculadora, upload de archivos — todo pendiente
Responsive                        ❌  No aplica aún
Accesibilidad                      ❌  No aplica aún
SEO                                ✅  Metadata con title y description
Rendimiento                        ❌  No aplica aún
Fidelidad visual                   ❌  No aplica aún

---

## Sugerencias de mejora

- Migrar datos_carreras.json a tabla carreras en Supabase
- Reimplementar búsqueda fuzzy (Levenshtein) como hook React o con Zustand
- Calculadora de aranceles como componente independiente
- Drag-and-drop de archivos con react-dropzone o similar
- Formulario de inscripción con validación Zod
- Usar next/image para imágenes de carreras
- Considerar shadcn/ui para formularios y cards de carreras

## Pendientes
- Todos los modales correctos
- revisar logica de ordenamiento
- Mejorar responsive
- Poner el botón de tipo de carrera en el formulario
- Filtro por area (medicina, finanzas) en el buscador
- carrouselle agregar inscribete ya y arreglar responsive
- modales, agregar un modal de inscribete ya y los descuentos
-  excelente, por ultimo, bloquear el tipo de carrera en el formulario no tiene sentido, quita esa funcion y en desktop hazlo un botón desplegable, del mismo tamaño que seleccionar
  formacion, cambia el texto seleccionar formacion por buscar carrera 
-acreditar equivalencias si no en base de datos
- detener carrouselle

-favicon
-cambiar svg deportistas federados
-botón de formulario no lleva exactamente a formulario