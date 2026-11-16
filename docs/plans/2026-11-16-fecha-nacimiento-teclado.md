# Escritura manual de fecha de nacimiento

## Diseño aprobado

En `CampoFecha`, conservar el calendario ya existente y permitir ingresar la fecha
por teclado en `DD/MM/AAAA`. El estado y el payload siguen usando `AAAA-MM-DD`.
La conversión valida día, mes y año como fecha de calendario sin construir un
`Date` desde una cadena ISO, para evitar corrimientos por zona horaria. La
selección del calendario y la escritura manual actualizan el mismo valor.

## Plan de implementación

1. Agregar helpers puros para formatear ISO a `DD/MM/AAAA` y analizar el texto
   manual, rechazando fechas imposibles.
2. Probar fechas válidas, bisiestos, formatos incompletos y días inválidos.
3. Cambiar `CampoFecha` para mostrar un campo de texto con teclado numérico y
   placeholder `DD/MM/AAAA`; conservar el calendario y sincronizar ambas vías.
4. Mostrar el error de fecha inválida al salir del campo y limpiar el error al
   corregir; mantener el bloqueo de envío para una fecha incompleta o inválida.
5. Ejecutar las pruebas focalizadas y `npm run check`.
