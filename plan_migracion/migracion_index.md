# Migración — index.html → app/page.tsx

Estado: EN PROGRESO (avanzado)

Archivos: app/page.tsx, components/index/*.tsx, app/index.css
HTML original: migracion_pendiente/index.html (la página más compleja del sitio)

---

## Tecnologías por fase

### Fase 1 — Base

Tailwind CSS ✅ Uso extensivo de utilities en todos los componentes + app/index.css para estilos custom

### Fase 2 — Lenguaje

TypeScript ✅ Archivo .tsx con tipos (Carrera, CarreraSlide, etc.)
Axios ❌ No se usa — datos se obtienen via Supabase client directamente
Zod ❌ No se usa — validación server-side pendiente

### Fase 3 — Framework

React + Next.js ✅ Server Component (page.tsx) + Client Components (hero, careers-catalog, enrollment-form, modales, footer)
Zustand ❌ No se usa

### Fase 4 — UI

daisyUI ❌ No se usa
shadcn/ui ❌ No se usa

### Fase 5 — Backend

Supabase (PostgreSQL) ✅ Conectado — page.tsx hace query a tabla `carreras`, enrollment-form inserta en tabla `consultas`

### Fase 6 — Extras

Stagehand ❌ No se usa
Tauri ❌ No aplica

---

## Auditoría general

Estructura HTML → JSX ✅ Componentes: Hero, CareersCatalog, CareerSection, CareerCard, CareerModal, CarouselModal, EnrollmentForm, IndexFooter
Estilos → Tailwind ✅ Utilities + app/index.css para estilos custom (carousel, sticky, pills, cards)
JavaScript → React state ✅ Búsqueda fuzzy (Levenshtein) migrada, filtros por categoría, modales con animación, formulario con state
Datos ✅ Carreras desde Supabase (tabla `carreras`), consultas se insertan en tabla `consultas`
Interactividad ✅ Buscador con fuzzy search, filtros por categoría (pills), formulario de contacto con validación, modales de carrera (simple + carousel con slides)
Drag-and-drop ❌ No migrado (upload de archivos del original)
Calculadora de aranceles ❌ No migrada
localStorage ❌ No migrado (preferencias de usuario del original)
Responsive ✅ Diseño responsive con breakpoints sm/md/lg/xl/2xl en todos los componentes
Accesibilidad ⚠️ Parcial — aria-labels en buscador y modales, role="dialog", pero sin audit completo
SEO ✅ Metadata con title y description
Rendimiento ✅ Server Component para data fetching, revalidate=3600, next/image en Hero
Fidelidad visual ✅ Carrusel hero (3 slides), catálogo de carreras con cards, sidebar de beneficios, modales con slides (portada/modalidad/evaluación/plan/cierre), formulario de contacto, footer

---

## Sugerencias de mejora

- ~~Migrar datos_carreras.json a tabla carreras en Supabase~~ ✅ Hecho
- ~~Reimplementar búsqueda fuzzy (Levenshtein) como hook React o con Zustand~~ ✅ Hecho (inline en careers-catalog.tsx)
- Calculadora de aranceles como componente independiente ❌ Pendiente
- Drag-and-drop de archivos con react-dropzone o similar ❌ Pendiente
- ~~Formulario de inscripción con validación~~ ✅ Hecho (validación manual, Zod pendiente)
- ~~Usar next/image para imágenes de carreras~~ ✅ Parcial (usado en Hero, modales usan <img>)
- Considerar shadcn/ui para formularios y cards de carreras ❌ Pendiente

## Pendientes

- ✅ Todos los modales correctos (CareerModal + CarouselModal con slides: portada, modalidad, evaluacion, plan_estudios, cierre)
- ✅ revisar logica de ordenamiento (ordenado por `orden` desde Supabase + por largo de nombre dentro de categoria)
- ✅ Mejorar responsive (breakpoints sm/md/lg/xl/2xl en todos los componentes)
- ✅ Poner el botón de tipo de carrera en el formulario (pills desktop + select mobile)
- ❌ Filtro por area (medicina, finanzas) en el buscador
- ✅ carrouselle agregar inscribete ya y arreglar responsive (slide 1 tiene boton "Ir al Formulario", responsive con touch swipe)
- ✅ modales, agregar un modal de inscribete ya y los descuentos (boton "Inscribite ya" en footer de modales + slide cierre con beneficios)
- ✅ bloquear el tipo de carrera en el formulario (tipo se auto-detecta de carrera seleccionada, pills desktop + select mobile)
- ✅ acreditar equivalencias (checkbox en formulario, se envia a Supabase)
- ✅ detener carrouselle (pause on hover/touch)
- ✅ favicon
- ❌ cambiar svg deportistas federados
- ✅ boton de formulario lleva al formulario (scrollMarginTop + href="#formulario")
- ❌ poner badge de nuevo o descuento
- ~~falta botón ir arriba~~ ✅
