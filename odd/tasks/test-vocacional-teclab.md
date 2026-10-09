# Test vocacional de Teclab

Tarea «Crear un test vocacional para Teclab» de `PENDIENTES.md`.

## Objetivo

Un test vocacional propio de Teclab, con su marca, que recomiende entre las tecnicaturas y el curso activos de Teclab y lleve a la ficha o a WhatsApp de Teclab.

## Problema

`/test-vocacional` mezcla Siglo 21 y Teclab: sus preguntas cubren derecho, salud o educación, que Teclab no dicta, y su pregunta de duración no distingue entre tecnicaturas que duran lo mismo. Quien llega desde `/teclab` no tiene un recorrido pensado para esa oferta.

## Alcance

- Ruta `/teclab/test-vocacional`, con la marca de Teclab (Poppins, cian `#2ee7d7` en Tecnología, violeta `#8e2cf2` en Gestión).
- Sólo carreras activas y visibles de los niveles `Teclab - Tecnología`, `Teclab - Gestión` y `Teclab - Curso`, leídas de Supabase (no una lista escrita a mano). Incluye las cinco «Próximamente» (22 en total al 09/10/2026); su resultado lo dice y lleva a la ficha, que pide el aviso.
- Preguntas propias de esa oferta; puntaje por carrera, no por las áreas de Siglo 21.
- Resultado: las tres carreras con más afinidad, enlace a `/carreras/<slug>` y consulta por WhatsApp al número de Teclab.
- Enlace desde `/teclab` y alta en el sitemap.
- No se toca el test general.

## Criterios de aceptación

- Cada una de las 22 carreras puede salir primera con alguna combinación de respuestas.
- El puntaje es determinístico y está cubierto por tests.
- Nada salta de lugar al avanzar o al elegir opciones.

## Tareas

- [x] T1. Preguntas, puntaje y tests (ruta: delegada, 2+ archivos no triviales).
- [x] T2. Página `/teclab/test-vocacional`, componente, estilos, enlace desde `/teclab` y sitemap (ruta: delegada, mismo escritor).
- [x] T3. `npm run check`, capturas y commit (ruta: inline).

## Verificación

- `node --test tests/test-vocacional-teclab.test.mjs`
- `npm run check`

## Progreso

Documento creado el 09/10/2026. Estuvo en pausa hasta que se sumaron las cinco carreras nuevas; retomado el 09/10/2026 con las 22. T1 y T2 van a un solo escritor delegado (disparador: 2+ archivos no triviales).

09/10/2026, T1 y T2 (escritor delegado):

- T1: `components/test-vocacional-teclab/puntaje.ts` (siete preguntas de una respuesta, puntaje por carrera, perfiles reconocidos por nombre como `getFichaTeclab`) y `tests/test-vocacional-teclab.test.mjs`. RED: el test falló al no existir el módulo. GREEN: 8/8, incluida la búsqueda exhaustiva (6^6 x 3 combinaciones) donde cada una de las 22 carreras sale primera con puntaje estrictamente mayor, sin depender del desempate.
- T2: `app/teclab/test-vocacional/page.tsx` y su CSS, `components/test-vocacional-teclab/test-vocacional-teclab.tsx`, franja con enlace en `/teclab` y alta en `app/sitemap.ts`. Pregunta con alto fijo y opciones con el lugar de seis reservado. WhatsApp: `numeroWhatsAppDe('teclab')` + `mensajeWhatsAppInfo`, como la ficha.
- `npm run check`: 0 errores de lint (28 avisos previos, ninguno en estos archivos), typecheck limpio, 408/408 tests.
- Pendiente fuera del alcance: `/api/revalidar` no mapea `/teclab/test-vocacional`; la página usa `revalidate = 3600` como `/teclab`.


T3 (09/10/2026): el padre sumó la ruta a `rutasA()` de `/api/revalidar`, la marca de Teclab en el navbar (`.tvt-page` en `app/navbar.css`) y el título absoluto. Recorrido completo a 375 px: las opciones quedan a 330 px en las siete preguntas (sin saltos) y el resultado muestra tres carreras con «Ver la carrera» y WhatsApp. `npm run check`: 408/408. Falta: push a `main` (decisión del usuario).
