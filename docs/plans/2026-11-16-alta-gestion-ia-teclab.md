# Alta de Gestión de Inteligencia Artificial de Teclab

**Objetivo:** incorporar la carrera al sitio y al circuito de precios, con datos oficiales y sin afectar las demás carreras.

**Arquitectura:** conservar el catálogo en D1 y los componentes compartidos existentes. Publicar primero el código compatible y después cargar la carrera y su precio en D1, con autorización específica para cada operación remota necesaria.

**Fuentes:** Dashboard Comercial de Teclab, registro TEC-026; [ficha oficial](https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-de-inteligencia-artificial-y-transformacion-digital/); presentación de capacitación de admisión del bloque 4. El precio se comprueba en el simulador del Portal Administrativo, no se deduce de otras carreras.

## Consulta del 16/11/2026

- D1 de producción, consulta por nombre: no existe una fila de la nueva carrera.
- Simulador del Portal Administrativo, período 1A 2027: al listar las opciones
  de carrera, la única que contiene «Inteligencia Artificial» es la
  Actualización Profesional. La tecnicatura nueva no apareció, por lo que no se
  obtuvo ni se puede publicar su precio. No se envió ninguna preinscripción.
- El área y el filtro Datos e IA ya reconocen el nombre. El test vocacional de
  Teclab no tiene perfil para esta carrera y la articulación no debe darse por
  confirmada.

## Tareas y verificaciones

1. Contrastar el PDF del Dashboard con la ficha, especialmente el orden del séptimo bimestre, y guardar el programa oficial y las imágenes de la carrera.
2. Revisar la fila existente en D1 y los redirects antes de preparar SQL: no asumir que la carrera no existe sólo porque su URL responde 404. Preparar una operación acotada, sin ejecutarla hasta contar con autorización explícita.
3. Agregar la ficha, imagen, plan descargable, dictamen y exclusión de articulación no confirmada en `components/index/`. Verificar el área y la categoría Datos e IA, que ya reconocen el nombre.
4. Agregar perfil y pesos al test vocacional de Teclab en `components/test-vocacional-teclab/puntaje.ts`; probar que todas las carreras puedan ser recomendadas sin sesgos nuevos.
5. Consultar el simulador en la sesión autorizada, registrar precio y vigencia sólo en el material privado y verificar que los conceptos sumen el total. Incorporar la carrera al pipeline sin interrumpir la actualización de las demás. No inventar el precio ni publicar importes sin autorización explícita.
6. Recorrer todos los puntos aplicables de `docs/alta-de-carrera.md`: ficha, inscripción, bot, material comercial, imagen para compartir, SEO y folletos. Documentar lo que no se pueda completar y su motivo.
7. Ejecutar las pruebas focalizadas y `npm run check`; compilar `cloudflare/`. Verificar ficha y modal en escritorio y celular antes de publicar. Verificar en producción después de las operaciones autorizadas, sin enviar formularios ni generar eventos de prueba.
