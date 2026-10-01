# Páginas de materia independientes — plan de implementación

> Diseño: `docs/plans/2026-09-26-materias-independientes-design.md`.

**Objetivo:** que `/clases-apoyo/[materia]` sea una página independiente (volver + contenido + reserva + otras materias), con un bloque de reserva sobrio y común, y computación con el diseño del folleto pixel.

**Arquitectura:** se desarma `components/clases-apoyo/clases-apoyo-page.tsx` (935 líneas, `'use client'`) en piezas: la reserva (cliente, con toda la lógica actual intacta), el contenido genérico de materia y la navegación (servidor). La página elige el contenido por `slug`. El CSS del "shell" (sidebar, pestañas, grilla de alto fijo) se borra; el del calendario pasa a su propio archivo con variables en su propio ámbito.

**Stack:** Next.js 16 App Router, React 19, CSS plano por página, `next/font/google` (Silkscreen), tests `node --test` que leen el código como texto.

---

### Task 1: Test de estructura (falla primero)

**Archivo:** crear `tests/materias-independientes.test.mjs`, con el patrón de `tests/teclab-landing.test.mjs` (`readFile` + `assert.match`).

Afirma:
- `app/clases-apoyo/[materia]/page.tsx` no importa `clases-apoyo-page` y sí importa `reserva-clase`, `navegacion-materia` y `computacion-pixel`.
- `components/clases-apoyo/clases-apoyo-page.tsx` no existe.
- `components/clases-apoyo/reserva/reserva-clase.tsx` postea a `/api/formularios` con `kind: 'clase'` y llama a `trackDiaClase`, `trackHorarioClase` y `trackSolicitudClase`.
- `components/clases-apoyo/computacion/computacion-pixel.tsx` no tiene números de teléfono escritos (`/\d{2}\s?\d{4}[\s-]?\d{4}/` no matchea): sale de la base.
- `app/clases-apoyo/clases-apoyo.css` ya no define `.ca-sidebar`, `.ca-mobile-tabs` ni `.ca-app`.

Correr `node --test tests/materias-independientes.test.mjs` → FALLA. Commit.

### Task 2: Bloque de reserva

**Crear** `components/clases-apoyo/reserva/reserva-clase.tsx` (`'use client'`):
- Se mueven tal cual desde `clases-apoyo-page.tsx`: `MonthlyCalendar` (L108-237), `buildHours`, `ScheduleMode`, `HourPills`, `DayInfo`, `calKeyToIso`, `parseHorariosBloqueados`, `formatDay` (L240-308) y `SchedulePanel` (L310-726).
- `export default function ReservaClase({ materia }: { materia: Pick<MateriaDB, 'id'|'slug'|'modo_manana'|'dias_bloqueados'|'horarios_bloqueados'> })`: absorbe el estado de L753-783 (`selectedDays`, `selectedDayInfoMap`, `requestDone`, `calendarLocked`, `scheduleKey`, `handleToggleDay`) y el cableado de L884-885.
- `scrollToBottom` deja de apuntar al footer de la página: usa un `ref` al panel de horarios del propio bloque (misma condición `innerWidth <= 768`).
- Raíz: `<section id="reservar" className="reserva-clase" aria-labelledby="reservar-titulo">` con `h2` "Reservá tu clase" y la grilla `.rc-grid` (calendario | horarios).
- **Crear** `components/clases-apoyo/tipos.ts` con `MateriaNav` y `MateriaDB` (L14-31), más `texto_seo?: string[] | null`.

**Crear** `app/clases-apoyo/reserva-clase.css`:
- Se mueven de `clases-apoyo.css` las reglas del calendario y el horario (L211-331 y L343-365).
- Todas quedan bajo `.reserva-clase`, que define sus propias variables (`--rc-acento: #00c7b1`, `--rc-fondo: #0e1918`, `--rc-borde: rgba(255,255,255,.1)`, `--rc-texto: #c8d4cf`, `--rc-texto-suave: #87a89e`, etc.). Las reglas movidas pasan de `var(--ca-*)` a `var(--rc-*)`.
- Tarjeta: fondo liso, borde de 1px, `border-radius: 12px`, Inter, sin sombras.
- `.rc-grid`: `grid-template-columns: 1.1fr 1fr` desde 769px y una columna debajo. El calendario ya no depende de `h-full` del padre (sacar la altura heredada).

`npm run typecheck`. Commit.

### Task 3: Navegación y contenido genérico

**Crear** `components/clases-apoyo/navegacion-materia.tsx` (servidor):
- `VolverAClases`: `<Link href="/clases-apoyo">← Volver a clases de apoyo</Link>`.
- `OtrasMaterias({ materias, actual })`: `<nav aria-label="Otras materias">` con `h2` y una lista de `<Link href={/clases-apoyo/${slug}}>`, sin la actual.

**Crear** `components/clases-apoyo/whatsapp-clase.tsx` (`'use client'`): el enlace de L909-929 con `trackWhatsappClase(slug)` y `WhatsAppIcon`; recibe `{ slug, whatsapp, telefono, profesor, enConstruccion }` y admite `className` para que computación lo vista distinto.

**Crear** `components/clases-apoyo/materia-generica.tsx` (`'use client'`, por el carrusel): `h1` actual (L845-847), `Carousel`, `DescriptionPanel`, `ConstructionBanner` (movidos) y `WhatsappClase`.

**CSS** en `clases-apoyo.css`: `.ca-materia-pagina` (una columna, `max-width: 1100px`, gutter de 16px), `.ca-volver` y `.ca-otras`.

Commit.

### Task 4: Recablear la página y borrar el shell

**Modificar** `app/clases-apoyo/[materia]/page.tsx`:
- Imports nuevos; `import '../reserva-clase.css'`.
- Render: `VolverAClases` → (`ficha.slug === 'computacion' && !ficha.en_construccion ? <ComputacionPixel materia={ficha} /> : <MateriaGenerica materia={ficha} />`) → `{!ficha.en_construccion && <ReservaClase materia={ficha} />}` → `OtrasMaterias` → `TextoMateria` → footer + JSON-LD sin cambios.

**Borrar** `components/clases-apoyo/clases-apoyo-page.tsx`.

**Borrar** de `clases-apoyo.css` el shell: L27-177 (salvo `.ca-carousel-track` y `.ca-desc-item`, que siguen), L387-388, el `@media` L391-518 salvo lo que sea de carrusel o descripción, y `.ca-wa-link` si pasó a `whatsapp-clase`. No tocar desde L520 (portada y `.ca-seo`).

**Modificar** `.agents/preparar-calidad.mjs` L5-6: la ruta vieja pasa a las nuevas.

`npm run check` → la prueba de la Task 1 pasa, salvo la de computación. Commit.

### Task 5: Computación pixel

Usar la skill `calcar-imagenes`. La fuente es `contenidos/cau/aprobados/2026-09-22-folleto-computacion-pixel/folleto.html`: cada ícono es un `<svg class="pixel-svg">` con `shape-rendering="crispEdges"` después de un comentario `<!-- el:… -->`.

1. Script de una vez (scratchpad, no va al repo) que extraiga por marcador `logo`, `computadora`, `ilustracion`, `dato-modalidad`, `dato-dias`, `dato-direccion` y `tema-1`…`tema-5`, y los guarde como SVG en `public/imagenes/clases-apoyo/computacion/`. Verificar con captura contra el PNG del folleto.
2. **Crear** `components/clases-apoyo/computacion/fuente.ts`: `Silkscreen({ weight: ['400','700'], subsets: ['latin'], variable: '--fuente-pixel', display: 'swap' })`. Sólo lo importa computación, así que la fuente sólo baja en esa página.
3. **Crear** `components/clases-apoyo/computacion/computacion-pixel.tsx` (servidor), con las secciones del diseño:
   - encabezado: el `h1` completo en `sr-only` y el visual "CLASES DE / COMPUTACIÓN" con `aria-hidden`
   - ventana "Mis proyectos"
   - tres fichas
   - cinco temas
   - pasos 01-03 que enlazan a `#reservar`
   - `WhatsappClase` con la clase `cp-whatsapp`

   Íconos con `<img>` y `alt=""` (decorativos) o con alt cuando aportan (ubicación).
4. **Crear** `app/clases-apoyo/computacion.css` con la paleta del folleto en variables `--cp-*` bajo `.cp`, e importarlo desde la página. Texto de lectura en Inter, Silkscreen sólo en títulos y etiquetas. Grillas: temas en 5 columnas en escritorio, 2 en móvil; fichas al costado de la ventana en escritorio, debajo en móvil.

`npm run check` → todo verde. Commit.

### Task 6: Verificación visual

- `preview_start` con el dev server. Revisar `/clases-apoyo/computacion` y `/clases-apoyo/matematica` a 1280px y en móvil (375px).
- Revisar: sin scroll horizontal, la reserva recorrible hasta el captcha sin enviar, "Otras materias" sin la actual, la consola sin errores.
- Captura de computación para mostrarle al usuario al lado del folleto.
- No se pushea sin pedido: push a `main` es deploy.
