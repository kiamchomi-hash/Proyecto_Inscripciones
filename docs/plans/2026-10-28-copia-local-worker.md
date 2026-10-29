# Copia local del Worker — plan de implementación

**Objetivo:** recuperar la comparación offline de versiones sin modificar datos de producción ni sobrescribir copias existentes.

**Arquitectura:** construir cada versión compatible con Astro en un árbol aislado, iniciar el Worker en loopback con su propia D1 local y capturar sus páginas y recursos. Las versiones incompatibles o las capturas fallidas deben informarse como tales, nunca presentarse como completadas. La copia anterior se conserva hasta que una nueva haya terminado correctamente.

**Tecnología:** Node.js, Astro, Wrangler, D1 local y Playwright.

1. Inventariar versiones disponibles, formato de datos públicos y rutas de recursos, sin tocar producción. Definir una fuente de datos explícita y reproducible para todas las versiones; no confundir el catálogo sintético de pruebas con el real.
2. Añadir pruebas de aislamiento: destino existente, proceso ajeno en el puerto, credenciales no heredadas, errores de compilación y limpieza de recursos propios.
3. Preparar cada versión compatible con su propio directorio de trabajo y D1 local, ejecutar migraciones y cargar datos públicos verificados; no copiar credenciales ni usar bindings remotos. Señalar versiones históricas incompatibles.
4. Capturar HTML y recursos necesarios de Astro, imágenes y fuentes; reescribir enlaces para uso offline y conservar el selector de versiones. Si falla una ruta o recurso necesario, devolver error y conservar la copia anterior.
5. Probar dos versiones diferenciadas con datos controlados, abrir la salida sin conexión y comprobar navegación, imágenes, estilos, fuentes, aislamiento y limpieza. Actualizar la guía de la herramienta y ejecutar los controles pertinentes.
