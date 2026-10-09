# Fichas de carrera de Teclab con el sistema piezas_teclab (pendiente 38)

## Objetivo

Que `/carreras/<slug>` de las carreras y cursos de Teclab use la paleta, la tipografía y el logo oficiales de `piezas_teclab`, sin cambiar la disposición ni los textos.

## Alcance

- `components/carreras/career-detail.tsx`: sólo una clase modificadora y los tokens de color para Teclab.
- `app/carreras/career-detail-teclab.css` (nuevo): todo el override, anclado a `.career-page--teclab`.
- `app/carreras/[slug]/page.tsx`: Poppins con `preload: false` y su variable, sólo aplicada si la carrera es de Teclab.
- Fuera: `career-detail.css` (compartida), textos, estructura del JSX, modal, páginas de inscripción.

## Restricciones

- Azul `#0055F0`, navy `#0C1824`, cian `#4AE2E7`, blanco y `#F0F0F6`. Sin violeta `#8E2CF2`, sin cian `#2EE7D7`, sin ámbar (los cursos también van en cian). Menta sólo en cross-sell con Siglo 21.
- Poppins; titulares Bold/SemiBold, interlineado ~1.0. Sin Unbounded.
- Siglo 21 e Identidad Argentina no pueden cambiar un píxel.
- Contraste AA en texto de lectura.

## Tareas

- [x] T1. Modificador `career-page--teclab`, tokens y Poppins condicional. Ruta: delegada (writer).
- [x] T2. `career-detail-teclab.css`. Ruta: delegada (mismo writer).
- [x] T3. Verificación: `npm run check`, capturas escritorio y 375 px de una tecnicatura y un curso, y una carrera de Siglo 21 sin cambios. Ruta: inline.

## Progreso

- 09/10/2026: documento creado.
- 09/10/2026: T1 y T2 hechas (writer): clase career-page--teclab + tokens en career-detail.tsx, Poppins (preload false) en la clase de <main> sólo si es Teclab, y app/carreras/career-detail-teclab.css. Pendiente T3 (verificación visual).
- 09/10/2026: T3 hecha. Se sumó el stub de `next/font/google` a los arneses de `resiliencia` y `carrera-detalle`, el h1 móvil se achicó (Poppins Bold desbordaba a 375 px) y los formularios (fuera del article) se tiñen con los tokens `--catalogo-*` desde `.ficha-teclab`. Tests 370/370, lint sin errores. Capturas: tecnicatura y curso en escritorio, tecnicatura a 375 px, Siglo 21 sin cambios.
- 09/10/2026: se sumaron los bloques de datos de colores y centrados con el logo en Institución, el navbar con la marca Teclab (por `body:has`), el pie (`footer-teclab.css`) y el scroll y la flecha de subir. El pendiente 38 queda parcialmente hecho: el usuario prevé más mejoras.
