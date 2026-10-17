# Responsive de los modales de carrera

## Objetivo
Que los cuatro modales de carrera (`career-modal`, `carousel-modal`, `ia-modal`, `teclab-modal`) compartan un solo armazón y se adapten por CSS al lugar que tienen, en vez de valores sueltos copiados en cada archivo.

## Problema
El relevamiento del 17/10/2026 encontró:
- El armazón (velo, panel, foco, `inert`) está copiado cuatro veces, unas 700-900 líneas, y los valores ya se separaron. El alto del panel tiene tres variantes, y el de Siglo 21 usa `90vh` en el celular, que no descuenta la barra del navegador.
- El modal de Siglo 21 escala la tipografía con `clamp(...vh...)` y lee `window.innerWidth >= 768` en cuatro lugares, uno de ellos durante el render.
- El de Teclab reparte las tarjetas en tandas midiendo alturas con JS.
- Hay unos 460 valores arbitrarios, con una escala tipográfica escondida por debajo de `text-xs` y el color de marca repetido más de 60 veces.

## Alcance
Los cuatro modales, `components/index/modales.css` y los archivos nuevos que hagan falta en `components/index/`. Sin cambiar textos, datos, colores de marca ni el comportamiento: foco, Escape, Tab, flechas, la flecha de scroll y el bloqueo del scroll del fondo con la barra oscurecida.

## Restricciones
- Trabajo en main, sin ramas ni push. Un commit por tarea, solo con sus archivos (el usuario tiene cambios en paralelo).
- Tailwind 4.3: container queries nativas y tokens en `@theme`.
- El resultado visual se tiene que mantener o mejorar. Nada de saltos de layout.

## Tareas
- [x] T1: `ModalShell` compartido más el hook de foco. Un solo tamaño de panel (`min(92dvh, 52rem)`, un solo ancho, `container-type`), con los cuatro modales usándolo.
- [x] T2: el modal de Siglo 21 sin `vh` en la tipografía ni en los espacios (unidades del contenedor) y sin lecturas de `innerWidth`.
- [x] T3: el de Teclab, con el reparto de tarjetas en tandas resuelto por CSS en lugar de `repartir`/`useTandas`.
- [x] T4: tokens para los tamaños de etiqueta, el tracking y el color de marca, que reemplacen los valores arbitrarios más repetidos.

Ruta: delegada, porque cada tarea toca varios archivos no triviales. Estrategia de entrega: un commit por tarea en main, por pedido del usuario.

## Verificación
Por tarea: `npm run typecheck`, `npm run lint` y `npm test`. Las 2 fallas previas de `siglo21-cierre` vienen de un módulo comercial ignorado y son ajenas a este trabajo. Además, revisión visual de los cuatro modales en 375x667, 812x375, 768x1024 y 1366x650.

## Progreso
- T1 (delegada): `ModalShell` y `useFocoModal` creados; los cuatro modales los usan (86 líneas agregadas y 321 borradas). Panel único `min(92dvh, 52rem, 100dvh - 2rem)` con `container-type: inline-size`. Medido: 375x667, 349x614; 812x375, 771x345; 1366x650, 845x598; sin scroll del velo en ninguno. typecheck y lint ok; npm test 506/507 (solo falla `siglo21-cierre`, ajena). `tests/carreras-faq` venía roto desde d1c7d28 (faltaba simular `./flechas-de-scroll`) y se arregló en esta tarea. `career-modal` (carreras sin slides) no se probó en el navegador: no se encontró una carrera visible que lo use.
- T2 (delegada): el carrusel de Siglo 21 ya no lee `innerWidth` (usa `matchMedia` en efectos y clics; se borró `showFloatingNav`, que no se usaba) ni usa `vh`: la tipografía mide contra `--alto-tipo` y las fotos contra `--alto-modal`, las dos variables del panel. Se agregó un bloque `@media (max-height: 500px)` que compacta cabecera, navegación y pie. Medido a 812x375: foto de portada de 321x230 y sin scroll del velo. A 375x667, «5° Año» queda arriba del plan (11 px del borde). typecheck y lint ok; npm test 506/507 (solo falla `siglo21-cierre`).
- T3 (delegada): se sacaron `repartir`, `useTandas`, el medidor invisible, el `ResizeObserver`, `useArrastre` y `FlechaTanda`. Las competencias ahora son una grilla con filas `minmax(min-content,1fr)`. En pantalla baja (`max-height: 500px`) scrollea el slide entero y las tarjetas se ponen en columnas por container query. Medido: a 812x375 el marco mide 728x205 y no desborda; scrollea solo el slide, con la flecha, y el velo no. A 375x667 queda sin el desborde de 2 px. Se pierde el gesto de arrastrar y las flechas de tanda, reemplazados por el scroll con la flecha global. typecheck y lint ok; npm test 506/507.
- T4 (delegada): tokens en `@theme` de `app/globals.css`: `text-6xs`…`text-2xs` (de 0.45 a 0.65rem), `tracking-amplio/etiqueta/etiqueta-ancha` y `color-s21` (lee `--color-highlight`). Clases arbitrarias en los cuatro modales: de 343 a 196. Sin cambio visual: se compararon con Playwright 6593 elementos en 20 capturas (3 modales, a 1366x650 y 375x667) y difieren 0 una vez normalizado el formato de color (lab/oklab). typecheck y lint ok; npm test 506/507.
