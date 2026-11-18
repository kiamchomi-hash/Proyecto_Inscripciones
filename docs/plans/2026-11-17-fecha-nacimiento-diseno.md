# Fecha de nacimiento en campos separados

## Decisión

Mantener un único campo de texto accesible con formato `DD/MM/AAAA`, que agrega las barras mientras se escriben los dígitos. Se elimina el botón del calendario de la interfaz.

## Código del calendario

Conservar la implementación actual del calendario en un componente separado, que no se monta desde el formulario. Así no se muestra ni afecta la captura, pero se puede reincorporar después sin reconstruir su comportamiento.

## Datos y validación

El campo único permite pegar la fecha completa y normaliza la escritura numérica a `DD/MM/AAAA`. Sólo una fecha completa y real se convierte al ISO `AAAA-MM-DD` que ya consume el formulario. Se conserva el mensaje de error compacto y un espacio reservado para evitar que el formulario cambie de posición.

## Accesibilidad y pruebas

El campo tiene etiqueta accesible, teclado numérico y longitud acotada. Se verifica el pegado, la normalización, validación, guardado ISO y ausencia del control de calendario en el formulario; se revisan capturas de escritorio y móvil antes de actualizar referencias visuales.
