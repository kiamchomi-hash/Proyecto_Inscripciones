# Fichas de carrera de Teclab

## Objetivo

Dos versiones por carrera de Teclab, 1080×1080 para pantalla: una con el sistema de `piezas_siglo21` en colores de Teclab (ficha G) y otra con el sistema de `piezas_teclab`. No se mezclan los dos sistemas en una misma pieza.

## Alcance

- 21 tecnicaturas con `activa = true` en `carreras` (niveles `Teclab - Gestión` y `Teclab - Tecnología`). Primero las 16 que no son «Próximamente» (`proximamente` falso); las cinco «Próximamente» quedan para después (pedido del usuario, 10/10/2026).
- Fuera: Venta Directa, Fintech, Acompañamiento Terapéutico y Producto Digital (`activa = false`), y la Actualización Profesional en Inteligencia Artificial (es un curso). Filtrar siempre por `activa`.
- Las fotos quedan para después: el usuario las resuelve aparte.
- Las piezas viven en `contenidos/teclab/en-curso/2026-10-09-fichas-carreras/`, fuera de git.

## Decisiones

- Paleta de Teclab en los roles del sistema de Siglo 21: navy `#0C1824` ocupa el lugar del petróleo, cian `#4AE2E7` el del titular y el triángulo, azul `#0055F0` el de la banda del lema y menta `#78FCBA` el de la franja angosta.
- Cada carrera es una pieza propia, no una plantilla compartida (pedido del usuario, 09/10/2026): cambia la composición y el reparto de colores entre carreras. La primera es Seguros.
- Sin la franja menta debajo de la banda azul y sin texto en cian (no le gustaron).
- No se toman como referencia piezas anteriores, ni siquiera las aprobadas, salvo que el usuario lo pida.

## Tareas

- [x] T1 Paso 1: fondo (aprobada la trama de puntos desde la esquina; el halo con malla quedó guardado en `fondos.md`)
- [x] T2 Paso 2: disposición (versión Siglo: nombre a lo ancho arriba, retrato y lema abajo, logo al pie)
- [x] T3 Paso 3: imágenes y elementos (logo y aval en línea con barra; foto provisoria)
- [x] T4 Paso 4: tipografía (Seguros: píldora azul con volumen, nombre DM Sans 132, datos en píldoras con ícono, certificado intermedio de `enfoque`, lema y WhatsApp juntos sin línea, aval a 66 px). Fuente en `pieza.html`.
- [x] T5 Paso 5: cohesión (espaciados de 32, degradado tonal en la franja azul y la píldora de WhatsApp, sombra que asienta la franja)
- [x] T6 Paso 6: detalles finales. Seguros exportada a 1080 y 2160 (`ficha-seguros-siglo*.png`); textos verificados y contrastes medidos. Retrato definitivo (Gemini) en `contenidos/teclab/imagenes_personas/seguros-retrato.png`.
- [ ] T7 Las 20 carreras restantes, versión Siglo, una por una y con composiciones distintas
- [ ] T7b Versión `piezas_teclab`: seis pasos y plantilla
- [ ] T7c Las 21 carreras, versión Teclab, una por una
- [ ] T8 Fotos de carrera (pendiente del usuario)

## Ruta

Inline: es un proceso interactivo paso a paso con aprobación del usuario en cada capa; delegarlo cortaría el ida y vuelta.

## Progreso

- 09/10/2026: encargo armado; empieza el paso 1.
- 09/10/2026: paso 1 aprobado. Paso 2 mostrado con tres variantes, falta la elección. Se corta por el límite de uso.
- 09/10/2026: Seguros, versión Siglo: elegida la propuesta B (retrato alto a la izquierda, nombre a la derecha, franja azul con lema y consulta de precios por WhatsApp 11 3297-3801, el de `NUMERO_CAU`). Falta el estilo del nombre.
- 09/10/2026: Seguros, paso 5 mostrado (antes y después). Espera aprobación.
- 09/10/2026: Seguros versión Siglo terminada salvo la foto. Sigue la próxima carrera con otra composición.
- 09/10/2026: Seguros versión Siglo con retrato definitivo, reexportada. Espera aprobación para pasar a `aprobados/`.
- 09/10/2026: Seguros versión Siglo aprobada y copiada a `contenidos/teclab/aprobados/2026-10-09-ficha-seguros-siglo/` con su `ficha.md`. En `en-curso/` quedan sólo los scripts y los recursos compartidos (logo y aval).
- 09/10/2026: Experiencia del Cliente, versión Siglo: fondo cuadrícula luminosa; composición I con tarjeta blanca de datos y el logo dentro de la banda azul; marcas con Teclab | Zendesk y aval debajo. Paso 4 mostrado. Falta la persona recortada (prompt sobre verde croma ya entregado).
- 09/10/2026: foto de Experiencia del Cliente sobre verde croma; recorte hecho con PIL (dominancia de verde y supresión del reflejo). Original en `imagenes_personas/experiencia-cliente-croma.jpeg`, recorte en `experiencia-cliente.png`.
- 09/10/2026: Customer Experience (el nombre oficial; «Experiencia del Cliente» le sonó raro al usuario): paso 4 aprobado con «Estudiá la Tecnicatura Superior en» y la carrera en Bold. Paso 5 mostrado: márgenes de 56, consulta centrada, degradado tonal en la franja, sombra en la tarjeta, recorte rehecho con umbral 12–40.
- 09/10/2026: Customer Experience versión Siglo: datos en vidrio teñido redondeado (3a) con base al 88 %, aval a 82 px. Exportada a 1080 y 2160; textos verificados, sin el número de Identidad. Espera aprobación.
- 09/10/2026: Customer Experience versión Siglo aprobada y copiada a `aprobados/2026-10-09-ficha-customer-experience-siglo/` con `ficha.md`. Hechas 2 de 21 (Seguros, Customer Experience). Sigue Gestión Agraria.
- 09/10/2026: Customer Experience reabierta a pedido del usuario: consulta y marcas centradas en la columna de la tarjeta (x 56–616). Reexportada en en-curso; falta reemplazar la copia de aprobados.
- 09/10/2026: Customer Experience reaprobada; la copia de aprobados ya tiene la consulta y las marcas centradas. Hechas 2 de 21. Sigue Gestión Agraria.
- 10/10/2026: orden acordado: primero las 16 sin «Próximamente». Hechas 2 de 16. Empieza Gestión Agraria.
- 10/10/2026: Gestión Agraria versión Siglo: fondo aprobado (barrido + constelación en dos capas con el centro atenuado). Cada paso abre ahora con nueve opciones: 3 de UIverse, 3 de afuera y 3 inventadas (pedido del usuario). Paso 2 mostrado.
- 10/10/2026: disposiciones de Gestión Agraria: descartadas «todo centrado», «foto en círculo» y «tapa de revista»; guardadas las otras seis en `agraria-paso-2-disposicion.html` (no se planifica reusarlas: cada carrera abre sus propias opciones).
- 10/10/2026: Gestión Agraria: disposición aprobada (corchetes: nombre arriba a lo ancho, foto a la izquierda, datos y consulta a la derecha, marcas al pie). Paso 3 mostrado con nueve tratamientos del marco de la foto; la foto todavía no se pide (pedido del usuario).
- 10/10/2026: Gestión Agraria: paso 3 aprobado (corchetes con un nodo brillante en cada punta, a recomendación). Paso 4 mostrado con nueve tipografías; nombre «Gestión Agraria» (HubSpot: «Gestion de la empresa agraria»), certificado de `enfoque`.
- 10/10/2026: Gestión Agraria: paso 4 armado con la tipografía «pastillas en el renglón» (Inter + IBM Plex Mono), datos en recuadro blanco con íconos y consulta sobre azul hondo; marcas centradas. Fuente en `agraria-pieza.html`. Espera aprobación.
- 10/10/2026: Gestión Agraria: datos en navy un punto más claro con borde cian y rótulos a 18 px (el blanco no se leía); consulta sobre azul hondo. Paso 4 armado en `agraria-pieza.html`.
- 10/10/2026: Gestión Agraria: paso 4 aprobado. Paso 5 mostrado: medido todo centrado (márgenes 74/76, bloques centrados ±1 px); calle de 40 px entre foto y columna; degradado tonal en el recuadro de datos.
- 10/10/2026: Gestión Agraria: paso 5 aprobado. Paso 6: textos verificados (11, ninguno marcado salvo el rótulo de la foto, que se va con la foto) y contrastes medidos (mínimo 5,2:1). Falta la foto para exportar.
- 10/10/2026: Gestión Agraria: foto de Gemini en `imagenes_personas/gestion-agraria.jpeg`; trae bordado un logo inventado («Escuela Técnica Agropecuaria - Res. 4»), el usuario prefiere la foto completa igual (no le importan marcas ni logos en la ropa). Exportada a 1080 y 2160. Espera aprobación.
- 10/10/2026: Gestión Agraria versión Siglo aprobada y copiada a `aprobados/2026-10-10-ficha-gestion-agraria-siglo/` con `ficha.md`. Hechas 3 de 16. Sigue Gestión Contable.
