# Publicación automática del Worker

**Objetivo:** cada push a `main` publica el Worker sólo después de que pasen las verificaciones del mismo commit.

**Diseño:** agregar un job de publicación al workflow existente de verificación, dependiente de los dos jobs de control y exclusivo para push a `main`. Compartir el grupo de concurrencia del publicador manual, comprobar antes del deploy que el SHA sigue siendo la punta de `main`, y ejecutar el publicador existente con smoke rápido. Mantener el ensayo y la publicación manual. La serialización evita que un deploy anterior termine después de uno nuevo; un push que llegue durante un deploy espera su propia verificación y publicación.

**Verificación:** pruebas sin credenciales para el contrato del workflow y del publicador; `npm run check` de raíz y prueba de publicación del Worker. Confirmar en GitHub Actions el resultado real del primer push sin exponer secretos. Si falla el smoke, el workflow falla pero el deploy no se revierte automáticamente.
