# Agregar cinco carreras al buscador local de Siglo 21

## Objetivo y alcance

Incorporar Antropología Organizacional, Administración Hotelera, Ambiente y Energías Renovables, Hidrocarburos y Geociencias, y Administración de Infraestructura Tecnológica. Autorizado por el usuario el 03/10/2026, únicamente buscador local y entrenador. No dar altas en Supabase ni sitio público, no publicar ni usar credenciales remotas.

## Tareas de una unidad coherente

- [x] T1: observar RED y cargar las cinco fichas públicas, alias, enlaces y planes con fuentes verificadas.
- [x] T2: comprobar matching, precios locales y contextos; regenerar ambos HTML y verificar aislamiento.

## Ruta y restricciones

Delegada por lectura preparatoria y múltiples archivos no triviales. Una unidad integrada de catálogo con sus pruebas. Estimación versionada menor de 100 líneas; contenido comercial permanece gitignorado. Estrategia ask-on-risk. Trabajar en main según regla específica del proyecto; no forzar git add, no ramas ni PRs. Cualquier commit sólo puede incluir trazabilidad pública propia, no fichas, precios o HTML privados.

Tres alias restantes siguen null; Nutrición no se agrega. No modificar precios, promociones, corpus, generadores, manifiesto de extracción KB ni archivos ajenos. No usar extracción autenticada/CDP ni conectar Supabase. Planes manuales y agregado reciben sólo cinco entradas comprobadas sin cambiar otras. No inferir títulos intermedios o resolución ministerial.

## Criterios de aceptación y comprobaciones

Cinco nombres distintos, fichas y planes oficiales completos, grado/duración verificados, URL pública y fecha de consulta; matching único en planilla local 2B, importes finitos y contexto con contenidos. Conservar diferencias entre licenciatura y tecnicatura de Hidrocarburos, e Infraestructura e Informática. Esperado con inputs actuales: 70 carreras, una ficha sin fila de precios y tres exclusiones deliberadas.

Prueba nueva determinística antes de fuente (RED), después GREEN; suite comercial completa, auditoría institucional y dos generadores con --descuento-beneficio 10. No --promocion ni actualizadores de precios. Hashes de precios, corpus y otras casas idénticos; verificar nuevos datos embebidos en ambos HTML. Auditoría ajena Teclab falla previamente en dos entradas: se informa, no se corrige. Checks del sitio no aplican si sólo se modifican datos y herramientas locales ignoradas.

## Evidencia y siguiente paso

Exploración verificó cinco páginas oficiales públicas, modalidad EDH y cuatro años. Cinco filas de precios locales 2B ya existen. No se usó acceso autenticado. Implementación local verificada; pendiente verificación independiente. RDD activo, pero árbol contiene trabajos ajenos y datos comerciales ignorados: no iniciar una revisión que abarque cambios ajenos ni declarar aprobación del material no capturado.

RED observado antes de cargar fuentes: prueba focalizada exit 1, 0/7 aprobadas; cinco altas ausentes, conteo previo 65/1/8 y contextos nuevos ausentes. Se capturaron hashes de 209 archivos protegidos y registros previos de cinco mapas. Las cinco fuentes públicas respondieron 200 el 03/10/2026. Planes publicados: Antropología 50 entradas, Hotelera 47, Ambiente 48, Hidrocarburos 51, Infraestructura 50. Hotelera publica dos ítems separados para Pisos y Habitaciones y Hotelera; se conservó esa anomalía sin inferir su corrección. Hidrocarburos incluye un Noveno Cuatrimestre bajo Otros requisitos, sin cambiar duración oficial de cuatro años.

T1: cinco fichas con fuente pública y fecha, sin IDs de Supabase inventados. Cinco alias exactos y cinco entradas de enlaces, FAQ, planes manuales y derivado insertadas sin reformatear mapas anteriores. GREEN focalizado 7/7, exit 0. Se omitió título intermedio de Infraestructura por no identificarlo la página; Hotelera conserva el intermedio confirmado. Ambiente conserva el instrumento a distancia como R.S.E. N.º 13/25, sin convertirlo en Resolución Ministerial. El derivado de planes recibió actualización offline selectiva autorizada, sin ejecutar extractor conectado a Supabase.

## Verificación final de la unidad

- Prueba focalizada: RED inicial 0/7, exit 1 por altas y contextos ausentes; GREEN final 8/8, exit 0. La prueba adicional compara hashes del plan contra la captura pública y evita instrumentos o intermedios inferidos.
- Suite comercial completa: 331/331, sin fallos ni skips, exit 0 (pipefail confirmado).
- Auditoría institucional: exit 1, únicamente los dos problemas previos de Teclab: cuando-empieza-teclab-curso e inscripcion-abierta-teclab-curso usan vocabulario de Identidad Argentina. Tres avisos previos de intenciones Teclab sin respuestas. Fuera de alcance, no corregidos.
- Ambos generadores con --descuento-beneficio 10: exit 0. Buscador 70 carreras, una ficha sin fila de precios (Nutrición), tres exclusiones por alias. Sólo 2B; stderr informa promoción 2A no disponible en planilla, sin alterar fuentes.
- Los cinco contextos nuevos y planes son idénticos en ambos HTML, con matching único. Los 180 contextos anteriores combinados siguen idénticos. Ambas páginas fueron retenidas en memoria del proceso antes de regenerar; no se creó respaldo fuera de la superficie.
- SHA-256: 209 archivos de precios, corpus, otras instituciones y manifiesto KB idénticos. Los cinco mapas conservan metadata y todos los registros ajenos semánticamente idénticos al retirar las cinco claves autorizadas; se insertaron bloques sin reformatear el resto.
- Conteos de entradas publicadas: Antropología 50 (48 + 2 adicionales), Hotelera 47 (incluye anomalía de lista oficial), Ambiente 48, Hidrocarburos 51 (48 + 3 requisitos), Infraestructura 50 (48 + 2 adicionales). Hashes del texto completo del plan están fijados en la prueba determinística.
- No se ejecutó check raíz: no se modificó bundle ni código del sitio. Sin Supabase, CDP, credenciales, actualizador de precios, publicación, commits ni push. Generadores, motor, corpus, tres alias restantes y documento anterior de mensajes intactos.

Verificación independiente positiva: 8/8 focalizadas y 331/331 comerciales; contraste directo de contenido y orden de los cinco planes con sus páginas públicas actuales. Ambos HTML y cinco contextos coinciden, nombres y precios sin cruces. Padre reejecutó la prueba focalizada: 8/8. Los hashes y contextos anteriores conservados son evidencia del writer, no un baseline disponible para el verificador.

Estado: resultados locales implementados y comprobados; comprobación global parcial únicamente por auditoría previa de Teclab. No se declara aprobación RDD ni publicación. Sin commit ni push; la unidad mantiene trazabilidad pública sin versionar material comercial privado. Espejo Engram actualizado bajo la misma identidad.

## Publicación autorizada — 03/10/2026

El usuario autorizó publicar únicamente el buscador en siglo21sur.com usando BUSCADOR_SECRET configurado, sin push ni deploy ajeno. Una solicitud PUT al publicador oficial respondió HTTP 200. Metadata coincidente: 95 carreras totales (70 Siglo 21 y 25 externas existentes), 2.122.489 bytes, generado 2026-10-03T16:00:35.741Z, actualizado remoto 2026-10-03T16:20:48.477Z, período 2B y promoción hasta 04/10/2026. Hash previo del candidato d85334d5fb31b8443783c08dab3d32535cd35641eb4126f6d7237cb93eac4798. Pruebas del publicador: 16/16. No se regeneró durante publicación ni se modificaron precios o carreras en Supabase. Esta confirmación actualiza el estado local anterior.

Límite: BUSCADOR_SECRET sólo admite escritura PUT; la confirmación es metadata del servidor tras guardar el snapshot, no lectura independiente del HTML remoto. No se usó sesión admin ni credencial adicional. Evidencia Engram #559.
