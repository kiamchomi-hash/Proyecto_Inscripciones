# Fichas oficiales de Teclab, revisión del 30/10/2026

Las 22 fichas de carreras activas de Teclab se leyeron en el sitio oficial para
comprobar resoluciones, validez del título, certificado intermedio y estructura
de la página. Fuente única: `teclab.edu.ar`. De cada una se tomó el bloque «Plan
de estudios validado» del pie de la ficha.

## Fichas consultadas

- [Programación](https://teclab.edu.ar/carrera/tecnico-superior-en-programacion/): Res. 2127/22, Dictamen 2662/22, validez 2029/22.
- [Marketing Digital](https://teclab.edu.ar/carrera/tecnico-superior-en-marketing-digital/): Res. 121/26, Dictamen 3158/25.
- [Seguridad Informática](https://teclab.edu.ar/carrera/tecnico-en-seguridad-informatica/): Res. 730/25, Dictamen 3032/24, validez 1413/25.
- [Relaciones Laborales](https://teclab.edu.ar/carrera/tecnico-superior-en-relaciones-laborales/): Dictamen 2654/22, validez 1801/18.
- [Gestión Contable](https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-contable/): Res. 2357/22, Dictamen 2657/22, validez 434/19.
- [Redes Informáticas](https://teclab.edu.ar/carrera/tecnico-superior-en-redes-informaticas/): Dictamen 2656/22, validez 1757/19.
- [Seguros](https://teclab.edu.ar/carrera/tecnico-superior-en-seguros/): Res. 335/24, Dictamen 3052/24, validez 1062/25.
- [Gestión de la Empresa Agraria](https://teclab.edu.ar/carrera/tecnico-superior-gestion-empresa-agraria/): Res. 2261/22, Dictamen 2684/22, validez 1054/18.
- [Planificación y Organización de Eventos](https://teclab.edu.ar/carrera/tecnico-superior-en-planificacion-y-organizacion-de-eventos/): Res. 1237/22, Dictamen 2655/22, validez 1342/22.
- [Periodismo y Nuevas Tecnologías](https://teclab.edu.ar/carrera/tecnico-superior-en-periodismo-y-nuevas-tecnologias/): Res. 2166/22, Dictamen 2671/22, validez 1165/18.
- [Data Science](https://teclab.edu.ar/carrera/tecnico-superior-en-data-science/): Res. 3691/23, Dictamen 2856/23, validez 1266/24.
- [Gestión Hotelera](https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-hotelera/): Res. 1334/25, Dictamen 3051/24, validez 1668/25.
- [Quality Assurance](https://teclab.edu.ar/carrera/tecnico-superior-en-quality-assurance/): Res. 1184/23, Dictamen 2857/23, validez 591/25.
- [Inbound Marketing](https://teclab.edu.ar/carrera/tecnico-superior-en-inbound-marketing/): Dictamen 2661/22, Res. 2208/22.
- [Cloud Administration](https://teclab.edu.ar/carrera/tecnico-en-cloud-administration/): Res. 335/24, Dictamen 3037/24.
- [Customer Experience](https://teclab.edu.ar/carrera/tecnico-superior-en-customer-experience/): Dictamen 2143/22, validez 2663/22.
- [Gestión Ambiental](https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-ambiental/): Dictamen 3389/26.
- [Desarrollo de Videojuegos](https://teclab.edu.ar/carrera/tecnico-superior-en-desarrollo-de-videojuegos/): Dictamen 3396/26.
- [Gestión de Proyectos Mineros](https://teclab.edu.ar/carrera/tecnico-superior-en-proyectos-mineros/): Dictamen 3387/26.
- [Administración de Empresas](https://teclab.edu.ar/carrera/tecnico-superior-en-administracion-de-empresas/): Dictamen 3345/26.
- [Logística](https://teclab.edu.ar/carrera/tecnico-superior-en-logistica/): Dictamen 3403/26.
- [Higiene y Seguridad en el Trabajo](https://teclab.edu.ar/carrera/tecnico-superior-en-higiene-y-seguridad-en-el-trabajo/): Dictamen 3388/26.

Programas de estudio bajados el 30/10/2026, los dos que faltaban en
`carreras/teclab/pdfs/`:

- [Gestión Ambiental](https://teclab.edu.ar/wp-content/uploads/2026/10/10_Plan_de_estudio_Teclab_Gestion_Ambiental.pdf).
- [Desarrollo de Videojuegos](https://teclab.edu.ar/wp-content/uploads/2026/10/08_Plan_de_estudio_Teclab_Desarrollo_de_Videojuegos.pdf).

## Estructura de la ficha oficial

Se anota para comparar, no se copia: chips de duración, modalidad y título sobre
el H1 «Estudiá <carrera> Online en Teclab»; bloque «creada con <empresa>» y
«carrera acreditada por»; cuatro tarjetas de «¿Qué podrás hacer al finalizar?»;
salida profesional; plan por año en acordeones con botón «Descargar Programa»
(el PDF); financiación en tarjetas; cursada; testimonios; FAQ de la carrera (7 a
9 preguntas) y el bloque de resoluciones al pie.

## Cómo se cotejaron los planes

Se bajaron los 22 programas de `teclab.edu.ar` y se extrajeron con
`pdftotext -layout`, tomando la tabla de cuatrimestres de cada PDF. Después se
compararon, materia por materia, contra el `plan_estudios` que publica D1. Las
tres fuentes locales que interesan: `carreras/teclab/pdfs/` (los PDF),
`carreras/teclab/planes-teclab.json` (lo extraído, al día) y
`carreras/teclab/contenidos-teclab.json` (lo escrito a mano, que pisa al
anterior). Resultado: resoluciones y valideces coinciden en las 22; los planes
difieren en 13.

## Descartado

- El bloque «Altos sueldos al titularte» con un importe mensual: es una promesa
  de ingresos, no un dato académico.
- El popup de Naranja X y el contador de cupos: son campaña, cambian con el mes.
- Los logos de «acreditada por» del hero: no se reutilizan sin el archivo
  original y sin saber si corresponden a todas las carreras.
