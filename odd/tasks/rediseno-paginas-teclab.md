# Rediseño de las páginas de Teclab (pendiente 38)

## Objetivo

Llevar las páginas de Teclab al sistema visual de `piezas_teclab` (paleta oficial, Poppins, logo y fotos oficiales) sin cambiar la disposición ni los textos.

## Alcance

- `/teclab` (`app/teclab/page.tsx`, `app/teclab/teclab.css`).
- `/teclab/inscripcion` y `/carreras/<carrera de Teclab>/inscripcion` (`app/carreras/[slug]/inscripcion/inscripcion.css`, exclusiva de Teclab por `tieneInscripcionPropia`).
- `/inscripcion/<codigo>` (`app/inscripcion/[codigo]/inscripcion-enlace.css`).
- Fuera: `app/carreras/career-detail.css` (compartida con todas las carreras), el modal `teclab-modal.tsx`, textos y estructura del JSX.

## Restricciones

- Paleta: azul `#0055F0`, navy `#0C1824`, cian `#4AE2E7`, blanco y `#F0F0F6`. Sin el violeta `#8E2CF2` ni el cian `#2EE7D7` del sitio. El menta `#78FCBA` sólo en cross-sell con Siglo 21.
- Poppins vía `next/font`, cargada sólo en estas rutas (no en el layout global). Titulares Bold/SemiBold con interlineado ~1.0, remate en italic donde ya haya énfasis.
- Logo original (`public/imagenes/teclab/logo-teclab.webp` y la versión blanca); no se redibuja.
- Contraste AA en texto de lectura; el verde de WhatsApp del CTA se mantiene.

## Tareas

- [x] T1. Poppins en las rutas de Teclab y tokens de marca. Ruta: delegada (writer: 3 hojas de estilo + páginas, preparación con lectura). Poppins 400/600/700 con `next/font/google` en las cuatro `page.tsx`, expuesta como `--font-poppins` en la clase raíz; tokens `--tl-*` en `.teclab-page`, `.inscripcion-teclab` e `.inscripcion-enlace`. Check: lint y typecheck sin errores.
- [x] T2. `/teclab` con la paleta y la tipografía oficiales. Ruta: delegada (mismo writer). Violeta y cian del sitio reemplazados por azul/cian/navy; menta sólo en el paso de Siglo 21 de la ruta; el acento "Gestión" del catálogo se ubica por `:has()` y no por el valor del estilo en línea. Check: lint, typecheck y los tests de `/teclab` pasan.
- [x] T3. Páginas de inscripción (`inscripcion.css`, `inscripcion-enlace.css`). Ruta: delegada (mismo writer). Estilos hechos en las tres rutas. Bloqueado: `npm run check` da 3 fallas en `tests/inscripcion-pagina.test.mjs` (128, 133, 158) con `Poppins is not a function`, porque el arnés reemplaza por `{}` todo módulo que no declara y no tiene `next/font/google`. Resuelto sumando el stub de `next/font/google` al arnés del test, sin aflojar aserciones.
- [x] T4. Verificación: `npm run check` y capturas en celular y escritorio. Ruta: inline (preview). Tests 325/325, lint sin errores; capturas de las cuatro rutas en escritorio y `/teclab` a 375 px sin scroll horizontal. En la verificación apareció la píldora activa del filtro con el verde del CAU fijo en `index.css`; se pasó al azul de Teclab.

## Progreso

- 04/10/2026: documento creado; T1 a T3 delegadas a un writer.
- 04/10/2026: T1 y T2 hechas; T3 con estilos completos y el check frenado por el stub de `next/font/google` en el test de la página de inscripción.
- 04/10/2026: T3 y T4 cerradas; commit de la unidad de trabajo.
