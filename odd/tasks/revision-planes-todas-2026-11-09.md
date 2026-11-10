# Revisión de planes de estudio — 09/11/2026

Contraste de las 101 fichas publicadas contra la fuente oficial de cada casa: página de la carrera en `21.edu.ar` para Siglo 21, página de Teclab con su programa en PDF, y el programa en PDF de Identidad Argentina. La fuente que manda es la oficial.

**Correcciones aplicadas en D1 el 09/11/2026:** se agregó «Sociología Social» a Gerontología (CCC); se quitaron los bloques «Programa de Ingreso» y «Adicionales» que la página oficial no lista (15 carreras); se rehicieron los módulos de RRHH, Ciberseguridad Aplicada y Mindfulness según su PDF oficial, y se corrigió el nombre del módulo 4 de Oratoria. SQL en `sql/2026-11-09-planes-quitar-extras.sql` y `sql/2026-11-09-planes-identidad.sql`.

## Siglo 21 — 69 carreras

Comparación del conjunto de materias de cada ficha contra la página oficial (sin contar el orden por cuatrimestre).

- **33 coinciden** sin diferencias de materias.
- **36 presentan diferencias**, y en la mayoría son abreviaturas del sitio, cortes de línea de la página oficial o textos de requisitos capturados como materias. Abajo quedan sólo las diferencias que no se explican por esos motivos.

### Diferencias confirmadas

| Carrera | Diferencia |
| --- | --- |
| Licenciatura en Gerontología (CCC) | Faltaba **Sociología Social** en el 1er cuatrimestre. La página oficial lista 7 materias en ese cuatrimestre y el sitio 6. **Corregido en D1 el 09/11.** |
| Licenciatura en Higiene, Seguridad y Medio Ambiente del Trabajo | La página oficial repite **Grupo y Liderazgo** en el 3er cuatrimestre (dos veces); el sitio lo lista una vez. Se interpreta como error de la página oficial. |
| Tecnicatura en Gestión de Empresas Familiares | El sitio agrega **Introducción a la Vida Universitaria (IVU)**, **Aprender en el Siglo 21** y **Tecnología, Humanidades y Modelos Globales**, que no figuran en la página oficial (18 materias contra 21). |
| Tecnicatura en Diseño y Animación Digital | Mismas tres materias agregadas; la página oficial lista 18. |
| Tecnicatura en Recursos Turísticos | Mismas tres materias agregadas; la página oficial lista 18. |
| Tecnicatura en Relaciones Laborales | Mismas tres materias agregadas; la página oficial lista 18. |
| Tecnicatura en Gestión de Moda | Mismas tres materias agregadas; la página oficial lista 18. |
| Tecnicatura en Negocios Agroecológicos | Mismas tres materias agregadas; la página oficial lista 18. |
| Martillero, Corredor Público y Corredor Inmobiliario | El sitio muestra **Práctica Solidaria** dentro del plan; la página oficial no la lista. |
| Tecnicatura en Administración y Gestión Tributaria | Ídem: **Práctica Solidaria** sin respaldo en la página oficial. |
| Tecnicatura en Administración y Gestión de Políticas Públicas | Ídem. |
| Tecnicatura en Hidrocarburos y Geociencias | Ídem. |
| Tecnicatura en Dirección de Equipos de Venta | Ídem. |
| Tecnicatura en Dirección de Protocolo, Organización de Eventos y RRPP | Ídem. |
| Tecnicatura en Gestión del Clima Laboral de la Organización | Ídem. |
| Tecnicatura en Promoción Comunitaria en Niñez y Adolescencia | Ídem. |
| Tecnicatura en Gestión Administrativa de Servicios de Salud | Ídem. |

**Corregidas en D1 el 09/11:** se quitaron las tres materias del «Programa de Ingreso» en las seis tecnicaturas y el bloque «Adicionales» con Práctica Solidaria en las nueve restantes. No se tocó Higiene, Seguridad y Medio Ambiente del Trabajo porque la diferencia es una repetición de la propia página oficial.

El resto de las diferencias son abreviaturas del sitio respecto del nombre completo oficial (por ejemplo `Dcho. Trabajo y Seg. Social`, `Modelos de Simulación` por `Herramientas Matemáticas VI – Modelos de Simulación`, `Intro. a la Ciencia Política y RRII`) o materias que la página oficial parte en dos líneas y la extracción toma como dos ítems. No se corrigen por no ser errores de contenido.

## Teclab — 24 carreras

Comparación de las cuatro cuatrimestres de cada ficha contra el programa en PDF enlazado desde la página oficial de Teclab.

- **13 coinciden** exactamente.
- **10 difieren sólo por cortes de línea** del PDF (el nombre de la materia se parte en dos renglones): Gestión Agraria, Gestión Hotelera, Administración de Empresas, Logística, Gestión de Proyectos Mineros, Higiene y Seguridad en el Trabajo, Gestión Ambiental, Diseño de Producto Digital, Desarrollo de Videojuegos y Comercio Electrónico. Sin diferencia de contenido.
- **1 caso dudoso:** Tecnicatura en Seguros. El programa oficial lista **Práctica Profesional** dos veces (bimestres 7 y 8) y el sitio una sola. No se agregó una línea duplicada: no hay dato que permita distinguirlas como I y II.

## Identidad Argentina — 8 carreras

Comparación de los módulos del sitio contra el programa en PDF.

| Carrera | Resultado |
| --- | --- |
| Diplomatura en Oratoria | Coinciden 5 módulos; el módulo 4 se llamaba **Estructura del Discurso y Técnicas de Expresión** y el oficial es **Técnicas de Expresión**. **Corregido.** |
| Diplomatura en Gestión de Equipos de Alto Desempeño | Coinciden los 8 módulos. |
| Diplomatura en Compliance | Coinciden los 4 módulos. |
| Curso en Constitución de Sociedades S.A, S.A.S, S.R.L | Coinciden los 4 módulos; el nombre del módulo 2 está redactado distinto pero es equivalente. |
| Diplomatura Integral en RRHH | El sitio mostraba 4 módulos y el programa tiene 7. **Rehechos según el PDF.** |
| Diplomatura en Ciberseguridad Aplicada | El sitio mostraba 7 módulos con otra secuencia; el programa tiene 4 (**Fundamentos de Ciberseguridad**, **Seguridad de Redes y Arquitecturas**, **Criptografía, Cifrado y Seguridad de Datos**, **Hacking Ético y Pruebas de Penetración (Pentesting)**). **Rehechos según el PDF.** |
| Diplomatura en Mindfulness, Liderazgo Personal y Gestión de Vínculos | El programa tiene 6 módulos (**La Bienvenida**, **Energía**, **Neurociencias / Neuroplasticidad**, **Glándula Timo**, **Conciencia**, **Inteligencia Emocional**) y el sitio mostraba 4 con otra estructura. **Rehechos según el PDF.** |
| Diplomatura en Prevención de Fraude Financiero y Digital | El PDF oficial devuelve HTTP 403 desde S3: **no se pudo verificar**. |

## Alcance

- Siglo 21: las 69 carreras activas tienen página oficial localizada y comparada.
- Teclab: 24 carreras, 22 con programa en PDF descargado y comparado.
- Identidad Argentina: 7 de 8 comparadas; falta el PDF de Fraude.

Archivos de trabajo de la comparación: `relevamiento-preliminar-planes-2026-11-09.md` y `comparacion-cuatrimestres-2026-11-09.md`.
