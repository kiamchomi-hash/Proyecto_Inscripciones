# Páginas de materia independientes y computación con estética pixel

Fecha: 26/09/2026. Diseño aprobado en conversación.

## Objetivo

Cada `/clases-apoyo/[materia]` deja de ser una "app" con barra lateral compartida y pasa a ser una página independiente. Computación estrena un diseño propio basado en el folleto pixel aprobado (`contenidos/cau/aprobados/2026-09-22-folleto-computacion-pixel/`). El calendario de turnos se conserva y se unifica en un bloque sobrio, igual en todas las materias.

## Qué cambia

### 1. Estructura común de toda página de materia

De arriba hacia abajo:

1. Enlace "← Volver a clases de apoyo" (`/clases-apoyo`). Navegación normal, apila historial.
2. Contenido propio de la materia (ver 3 y 4).
3. Bloque de reserva (ver 2), con un ancla `#reservar`.
4. "Otras materias": enlaces a las demás materias activas (excluye la actual), ordenadas por `orden`.
5. `TextoMateria` (texto SEO) y el footer del sitio, como hoy.

Se eliminan la sidebar, las pestañas móviles y el alto fijo de pantalla (`100dvh`): la página scrollea como cualquier otra. El `h1` sigue siendo "Clases particulares de {label} en Villa Lugano" en todas (se conserva la intención SEO documentada en el componente actual); en computación puede ser visualmente el encabezado pixel, con el texto completo accesible.

### 2. Bloque de reserva (`ReservaClase`)

Calendario mensual + panel de horarios + formulario de contacto en una sola tarjeta autónoma.

- Se extraen `MonthlyCalendar` y `SchedulePanel` de `clases-apoyo-page.tsx` sin tocar su lógica: días bloqueados, horarios bloqueados, `modo_manana`, bloqueo semanal, Turnstile y envío por `POST /api/formularios` (`kind: 'clase'`) quedan idénticos.
- El estado que hoy vive en `ClasesApoyoPage` (días seleccionados, `requestDone`, `calendarLocked`, `scheduleKey`) pasa al bloque.
- Estilo sobrio y propio, independiente de la estética de la página que lo contiene: fondo oscuro liso, borde fino, un solo acento de marca, Inter, sin sombras de bloque ni tipografía pixel. Variables CSS propias con prefijo del bloque para que ningún tema de página lo altere.
- Layout: calendario y horarios lado a lado en escritorio, apilados en móvil.

### 3. Computación: diseño pixel

Se decide por `slug === 'computacion'` en la página: renderiza `ComputacionPixel` en lugar del contenido genérico. Secciones, en el orden del folleto:

1. Encabezado pixel "CLASES DE COMPUTACIÓN" con el sello VL y la PC.
2. Ventana "Mis proyectos" con los íconos de Word, Excel y PowerPoint y el cursor.
3. Tres fichas: Modalidad (Presencial), Días (De lunes a viernes), Ubicación (Guaminí 4876, Villa Lugano).
4. "Aprendé a usar la PC y a trabajar con ella" + las 5 tarjetas de temas.
5. Pasos 01 Elegí el día, 02 Elegí el horario, 03 Elegí el tema; llevan a `#reservar`.
6. WhatsApp: número desde la base (`telefono_display` / `whatsapp`), no escrito a mano; conserva `trackWhatsappClase`.

Reglas:

- Los íconos y el sello se calcan del SVG del folleto (skill `calcar-imagenes`), se guardan como SVG en `public/` y no se redibujan.
- La tipografía pixel sólo en títulos y etiquetas cortas; el texto de lectura en Inter.
- Paleta del folleto en variables CSS propias de la sección (`app/clases-apoyo/computacion.css` o similar), sin tocar `globals.css`.
- Si `en_construccion` fuera true, se muestra el banner de construcción como en las demás.

### 4. Las demás materias

Contenido actual (carrusel de fotos + descripción, o banner de construcción) en un layout simple de una columna, más el WhatsApp de la materia. Cada una podrá tener su diseño propio más adelante con el mismo mecanismo que computación.

## Qué no cambia

- Rutas, `generateStaticParams`, metadata, canonical, `robots` de materias en construcción, JSON-LD `Service` y `BreadcrumbList`.
- Consultas a Supabase (misma columna por columna) y revalidación on-demand vía trigger de `materias`.
- `/clases-apoyo` (la portada de materias).
- El invariante de formularios: nada escribe directo en la base.

## Verificación

- `npm run check`.
- Preview local de `/clases-apoyo/computacion` y de otra materia, en escritorio y móvil: sin scroll horizontal, calendario usable, "Otras materias" sin la actual.
- Recorrido del calendario hasta el paso de captcha (el POST válido da 503 en local sin service role; no se envía nada a producción).
- Captura de computación para comparar con el folleto.
