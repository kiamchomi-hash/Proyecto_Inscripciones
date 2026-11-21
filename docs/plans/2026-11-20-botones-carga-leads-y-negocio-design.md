# Botones separados: Cargar lead y Cargar negocio

Diseño aprobado: la ventana tendrá tres acciones. **Cargar lead** solo busca o crea el contacto por correo y muestra su ID en el estado. **Cargar negocio** usa el correo y la carrera del formulario, abre la ficha de ese contacto, completa el negocio y pulsa Enviar una vez. **Cargar viendo** conserva el recorrido completo con Brave visible. El auxiliar recibe `--solo-contacto` o `--solo-negocio`; sin esas banderas hace el flujo completo. Sin verificación posterior del negocio y sinreenvío automático.
