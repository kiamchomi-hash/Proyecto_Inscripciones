# Articulaciones de Teclab con Universidad Siglo 21

- [Dashboard Comercial de Agentes (fuente en vivo, HTML público)](https://informacion.teclab.edu.ar/hubfs/ADMISION/CALIDAD%20Y%20%20TRAINING/Dashboard_Comercial_Teclab%20%28Agentes%29.html) — bajado el 23/11/2026.
- Bloques que mandan: `FICHA360` (campo `art` de TEC-001 a TEC-016) y `NOV05_INDEX` (15 entradas con rótulo «Articulación Siglo 21 · …»). Coinciden: **15 de las 16 tecnicaturas articulan; la única sin articulación es Seguros (TEC-008, `art` vacío)**.
- El campo «Articulación Siglo XXI» de `GUIAS` está incompleto: sólo 6 carreras lo traen cargado (Programación, Cloud Administration, Data Science, Inbound Marketing, Marketing Digital y Redes Informáticas) y QA lo tiene vacío. No alcanza para armar la lista.
- Otros respaldos del mismo panel: `DATA.carreras` pone «Articulación Universitaria con Siglo 21» en `msgSecundarios` de Programación y Marketing Digital, y «Articulación directa con Universidad Siglo 21 para obtener la Licenciatura» en el `factorSorpresa` de Gestión Contable, Gestión Hotelera y Relaciones Laborales. La sección «Articulación con Universidad Siglo 21» del propio panel dice que la articulación es válida para todas las carreras excepto Seguros.
- Detalle por carrera (cuántas materias se reconocen) vive en los textos largos del panel; el nombre completo de la licenciatura de Data Science se toma de ahí («Ing. En Innovación y Desarrollo»), porque `FICHA360` lo acorta.
- Volcado local: `carreras/teclab/articulaciones-teclab.json` (15 carreras). Lo consume `marcadoresInstitucionales()` para el marcador `{articulacionesTeclab}` del corpus de Teclab.
- El snapshot `carreras/teclab/dashboard-comercial.json` es del 03/09/2026 y no sirve para este chequeo.
