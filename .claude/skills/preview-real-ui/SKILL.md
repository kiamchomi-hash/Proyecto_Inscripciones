---
name: preview-real-ui
description: Cuando el usuario pida ver cómo quedaría una interfaz web o un cambio visual antes de aprobarlo, mostrar una instancia real de la página con el ajuste aplicado, no un boceto en texto. También usar al validar visualmente una propuesta de layout antes de implementarla en producción.
---

# Vista previa de la interfaz real

## Flujo

1. Revisar la página, el componente y sus estilos actuales; reutilizar el diseño y los datos reales del proyecto.
2. Si el objetivo visual no está claro, acordarlo antes de tocar código. Si ya está definido, preparar una prueba local aislada.
3. Mostrar la página real en el navegador local y probar el cambio sólo en esa instancia: por ejemplo, con estilos inyectados en el navegador o una copia temporal fuera de los archivos de producción. No presentar una maqueta textual, ASCII ni una imagen generada cuando existe la página ejecutable.
4. No editar los archivos de producción ni consultar o escribir recursos remotos para fabricar la vista previa sin autorización explícita.
5. Usar primero los datos existentes en la instancia local. No inventar carreras, nombres ni descripciones. Si la copia local no contiene todo lo pedido, decir qué falta y pedir autorización antes de leer datos remotos; no llamar «todas» a una muestra.
6. Capturar la página ajustada en escritorio y celular cuando el cambio sea responsive. Mostrar las capturas directamente en el chat o con la herramienta de vista previa disponible; no limitarse a describirlas.
7. Separar claramente la aprobación de la vista previa de la implementación permanente. Aplicar el cambio a producción sólo cuando el usuario lo pida o apruebe explícitamente; después verificar el sitio real en ambos tamaños y mostrar las capturas.

Si se piden opciones estéticas, mostrar las variantes en la página real antes de pedir que se elija una. Indicar el panel y el nombre de la pestaña, y acompañar con una comparación visible cuando haga falta. Si no se puede abrir la vista, avisar; no pedir una elección a partir de texto solamente.

## Herramientas y límites

- En cambios de HTML/CSS/JavaScript de navegador, consultar primero `modern-web-guidance`.
- En el sitio del CAU, seguir `cau-design-patterns`; las capturas de escritorio y celular forman parte de la entrega visual.
- Abrir la vista en el navegador integrado de OpenCode para que el usuario la vea ahí. No lanzar ni sugerir navegadores externos (`xdg-open`, Chrome/Firefox por shell u otros). Si el navegador integrado no está conectado, mantener la instancia corriendo, explicar que hace falta reconectarlo y esperar; no sustituirlo por un navegador externo ni dar por entregada la vista con capturas o una URL sola.
- Una instancia de desarrollo puede cargar datos locales que no coincidan con producción. Comprobar qué contenido se está mostrando antes de afirmar que la vista cubre todo el catálogo.
- No detener el servidor ni cerrar la pestaña de prueba al terminar de capturar: mantenerlos disponibles hasta que el usuario confirme que pudo verla o pida cerrarlos. Recién entonces cerrar sólo los procesos y pestañas creados para la prueba.
- No borrar ni revertir cambios ajenos.
