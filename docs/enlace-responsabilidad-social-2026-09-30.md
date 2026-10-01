# Enlace oficial de Responsabilidad y Gestión Social

Verificado el 30/09/2026: la [página oficial](https://21.edu.ar/carreras-y-programas/tecnicatura-en-responsabilidad-y-gestion-social) respondió HTTP 200, sin cambio de URL, y declara esa dirección como canónica.

## Identidad y contenido comprobados

- H1: Tecnicatura en Responsabilidad y Gestión Social.
- Título HTML: Tecnicatura Universitaria en Responsabilidad y Gestión Social | Universidad Siglo 21.
- Título otorgado: Técnico/a Universitario/a en Responsabilidad y Gestión Social, Resolución Ministerial 1483/2021; coincide con la ficha del KB local.
- Plan de 18 materias en cinco cuatrimestres, con modalidades Educación Distribuida y Educación Distribuida Home. No es un curso ni una certificación de responsabilidad social.

## Cambio y límites

Se incorporó el enlace a carreras/siglo21/enlaces-sitio-oficial.json y se retiró únicamente esta carrera de sinEnlace. La fecha generado del snapshot original permanece intacta: no se volvió a extraer el catálogo.

En la primera revisión, la web publicó dos años y medio mientras el KB local indicaba dos años. El 30/09/2026, por autorización del usuario, se corrigió la duración local a **2 años y medio**, según la web oficial y su plan de cinco cuatrimestres. Se registró la fuente puntual sin cambiar la fecha de extracción del KB. La lectura pública de Supabase devolvió una lista vacía y no permitió confirmar la fila actual; eso no prueba que la carrera no exista.

En el cierre original del enlace no se modificaron la base, el corpus, precios, fichas ni generadores. La corrección posterior actualizó únicamente la duración de la ficha local y sus derivados; la base publicada permanece sin modificar. Se conservaron las demás entradas de sinEnlace y el registro histórico.

## Verificación de la corrección de duración

Se regeneraron buscador y entrenador con `--descuento-beneficio 10`, sin forzar promoción ni actualizar precios. La lectura puntual confirmó `2 años y medio` en el JSON, la ficha Markdown y los datos de ambas páginas. Las 288 pruebas de ventas pasaron; la auditoría institucional no encontró cruces entre casas y conservó los tres avisos de Teclab conocidos. CASA continúa sin promoción 2A, por lo que el buscador genera sólo 2B; no es una consecuencia de esta corrección.

El primer chequeo auxiliar comparó cadenas JSON y falló por el orden de claves; el primer selector del entrenador buscó `nombre` en vez de `carrera`. Las comprobaciones estructurales posteriores confirmaron el dato. No se modificó lógica, corpus, precios ni base de datos. Sin commit ni publicación.
