# Fecha de inicio y aviso de inscripción en Teclab

Tarea 5 de `PENDIENTES.md`, alcance Teclab.

## Objetivo

Mostrar en las carreras de Teclab la fecha de inicio de clases y el mensaje «Todavía estás a tiempo de inscribirte» mientras la inscripción esté abierta.

## Datos y fuentes

- Tecnicaturas, bimestre 2B: inicio 14/10/2026 (Dashboard Comercial, `carreras/teclab/calendario-teclab.json`). Admisión abierta hasta el 03/11/2026 (dato del usuario, 02/10/2026; el calendario no lo publica).
- Curso de IA: 12.ª edición inicia 13/10/2026, venta hasta 12/10/2026; 13.ª edición inicia 17/11/2026, venta del 13/10 al 16/11/2026 (mismo calendario).

## Criterio

- Tecnicaturas: hasta el 03/11/2026 inclusive se muestra la fecha de inicio y el aviso. Después no se muestra nada hasta cargar el bimestre siguiente.
- Curso de IA: se muestra la edición cuya ventana de venta contiene el día de hoy.
- Fechas evaluadas en hora de Argentina. Nunca se muestran códigos de período (2B).

## Tareas

- [x] T1. Módulo puro con las fechas y la función que decide qué mostrar, con tests (ruta: delegada, 2+ archivos no triviales).
- [x] T2. Aviso en el último slide del modal de Teclab, en el hero de `/teclab` y en la ficha `/carreras/[slug]` de Teclab. A pedido del usuario se sacó de la portada del modal.
- [ ] T3. `npm run check`, revisión visual y commit.

## Verificación

- `node --test tests/inicio-teclab.test.mjs`
- `npm run check`

## Progreso

Creado el 02/10/2026.

- T1/T2 (02/10): writer delegado; RED observado y luego 9/9 tests verdes. Ajuste inline de ubicación (cierre del modal y /teclab). `npm test` 172/172, lint sin errores, typecheck OK. Revisión visual en escritorio y móvil: ficha, modal (último slide) y /teclab; curso de IA muestra 13 de octubre; Siglo 21 sin aviso.
- Siguiente: confirmar si se mantiene en la ficha y commitear.
- Pendiente para después del 14/10/2026: que el bot (seguimiento 2 de Teclab) diga «podés inscribirte hasta el 3 de noviembre» entre el inicio y el cierre de admisión. El usuario pidió no cargarlo antes.
