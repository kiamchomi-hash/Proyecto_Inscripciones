# Indexación — siglo21sur.com

Archivo único de indexación. Reemplaza a `INDEXACION_CARRERAS.md`,
`INDEXACION_REAL_GSC.md` y `PLAN_INDEXACION.md`, que se unificaron acá el 27/07/2026.

**Última medición: 01/08/2026** — Search Analytics completo más una inspección de
muestra (20 URLs). El último censo de indexación de las 96 fichas sigue siendo el del
**29/07**.

**Propiedad:** `sc-domain:siglo21sur.com` · **Fuente:** Search Console (URL Inspection
API + Search Analytics)

**Alcance:** las 96 carreras de la oferta vigente — Grado, Pregrado, Grado CCC, Teclab
e Identidad Argentina.

---

# 1 · Estado actual

## Tráfico — medición del 01/08/2026

**El deploy del 24/07 aterrizó entre el 26 y el 30/07, y el salto es grande.**

| | 04–14/07 | 27–30/07 |
|---|--:|--:|
| Impresiones por día | 30–50 | **350 → 664** |
| Clics por día | 1–2 | **5 → 11** |
| Posición media | 14,1 | **8,6** |

Totales de los 28 días cerrados (04/07–01/08): **68 clics, 3.547 impresiones, CTR 1,92%,
posición 10,1.** El 31/07 figura con 271 impresiones y 1 clic: es dato parcial del último
día, no una caída.

Las impresiones se multiplicaron por trece en cuatro días. Ya no las trae el home: las
traen sesenta y pico de fichas de carrera que entraron a la primera página.

### El cuello de botella es el CTR, y el dato de hoy todavía no lo mide

En los 6 días del 26 al 31/07, estas fichas están en primera página y no traen a nadie:

| Página | Impresiones | Posición | Clics |
|---|--:|--:|--:|
| Martillero y Corredor | 247 | 7,5 | **0** |
| Higiene, Seguridad y Medio Ambiente | 128 | 8,7 | **0** |
| Licenciatura en Finanzas | 90 | 7,7 | **0** |
| Comercio Internacional | 73 | 8,2 | **0** |
| Procurador | 72 | 7,7 | **0** |
| Gestión Deportiva | 54 | 8,4 | **0** |
| Ciencias de Datos | 50 | 12,4 | **0** |
| Nutrición | 50 | 7,2 | **0** |

Son unas 800 impresiones en posición ~8 sin un solo clic. Contra las que sí funcionan:
Agroinformática **16,7%** en posición 5,8, Responsabilidad y Gestión Social **13,6%** en
6,0, Redes Informáticas **6,25%** en 6,7.

**Pero este CTR no mide la reescritura del 29/07.** Se inspectaron las 10 páginas con más
impresiones: **8 tienen último rastreo entre el 25 y el 28/07**, o sea anterior al deploy
de títulos y descriptions. Google sigue sirviendo el snippet viejo. Es exactamente lo que
la sección 3 anticipó y lo que la sección 7 marca como el error más fácil de cometer acá.

**Conclusión operativa: no tocar títulos ni descriptions todavía.** Primero el Día 0 de la
sección 2 —que al 01/08 sigue sin ejecutarse, con todos los casilleros vacíos—, después
medir. Cambiarlos ahora quema la única lectura limpia que va a haber.

Único de esa tanda ya rastreado después del deploy: **Lic. en Finanzas (31/07)**. Sale de
la cola.

### Movimientos en la indexación, sobre una muestra de 10

De diez pendientes del 29/07 que se volvieron a inspeccionar, **cuatro se indexaron solos**
sin pedido manual:

| Carrera | Estado 29/07 | Estado 01/08 | Rastreo |
|---|---|---|---|
| Tec. Sup. en Seguridad Informática | ⬜ desconocida | ✅ indexada | 31/07 |
| Tec. Sup. en Relaciones Laborales | ⬜ desconocida | ✅ indexada | 31/07 |
| Tec. en Relaciones Laborales | 🟠 rastreada sin indexar | ✅ indexada | 29/07 |
| Tec. en Gestión Admin. de Servicios de Salud | ⬜ desconocida | ✅ indexada | 29/07 |

Los otros seis siguen igual. Cinco están en ❌ *Discovered* con **último rastreo `Never`**:
Tec. Sup. en Programación, Tec. Sup. en Data Science, Lic. en Educación (CCC), Lic. en
Psicopedagogía (CCC) y Tec. en Diseño y Desarrollo de Videojuegos.

**Es una muestra de 10 sobre 40, no un censo.** No sirve para actualizar el conteo global:
para eso hay que rehacer las 10 llamadas de *Cómo volver a medir*. Lo que sí muestra es que
las ⬜ y 🟠 —el grupo que el 29/07 se marcó como "el caso más urgente"— se resolvieron
solas, y que el resto sigue quieto.

## Indexación — censo del 29/07/2026

**56 de las 96 carreras están indexadas (58%).** Eran 23 el 24/07.

| | 24/07 (base) | 27/07 (estimado) | 29/07 (medido) |
|---|--:|--:|--:|
| Carreras indexadas | 23 | 38 | **56** |
| Sobre el total de 96 | 24% | 40% | **58%** |

**Esta medición es exacta, las anteriores no.** El 27/07 se contaron las carreras que
habían recibido impresiones en 30 días, que es un piso: una página puede estar indexada
sin haber aparecido en ninguna búsqueda. El 29/07 se consultó el estado real de las 96
con la **URL Inspection API** (`batch_url_inspection`, 10 URLs por llamada). Los
números de arriba comparan métodos distintos, así que el salto de 38 a 56 mezcla
carreras nuevas con carreras que ya estaban y no se veían.

## Por grupo

| Grupo | Total | Indexadas | % | Sin indexar |
|---|--:|--:|--:|--:|
| Siglo 21 — Grado | 36 | **36** | **100%** | 0 |
| Siglo 21 — Pregrado | 25 | 14 | 56% | 11 |
| Siglo 21 — Grado CCC | 7 | 1 | 14% | 6 |
| Identidad Argentina | 11 | 2 | 18% | 9 |
| Teclab — Gestión | 11 | 2 | 18% | 9 |
| Teclab — Tecnología | 6 | 1 | 17% | 5 |
| **Total** | **96** | **56** | **58%** | **40** |

**Las 36 licenciaturas de Grado están indexadas, sin excepción.** Era el grupo que el
24/07 tenía 13 de 36. El deploy de ese día —contenido propio renderizado en servidor,
96 enlaces internos y sitemap depurado— alcanzó para que Google rastreara el resto
solo, sin pedir una sola a mano.

Lo que no se movió está concentrado: **Teclab (14 de 17 afuera), Identidad Argentina
(9 de 11) y CCC (6 de 7)**. Son 29 de las 40 pendientes.

## Los estados que devuelve la API

| | Estado | Carreras |
|--|--|--:|
| ✅ | Indexada | 56 |
| ❌ | Descubierta, sin rastrear | 34 |
| ⬜ | Desconocida para Google | 5 |
| 🟠 | Rastreada, sin indexar | 1 |

**Las 5 "desconocidas" son el caso raro y el más urgente:** están las tres en el
sitemap que Google ya procesó, pero dice no tenerlas registradas. Son Diplomatura
Integral en RRHH, Diplomatura en Oratoria, Tec. en Gestión Administrativa de Servicios
de Salud, Tec. Sup. en Seguridad Informática y Tec. Sup. en Relaciones Laborales. Un
pedido manual las mete de una.

**La única 🟠 es Tec. en Relaciones Laborales**, rastreada el **30/03** —o sea, antes
del deploy del 24/07 que arregló el contenido duplicado— y descartada con la versión
vieja de la página. Es la que más gana con un pedido a mano: Google tiene que volver a
verla para cambiar de opinión.

---

# 2 · Cola de pedidos manuales — 10 recrawls + las que falten indexar

> **Al 01/08/2026 esta cola no se ejecutó**: los cinco días siguen con los casilleros
> vacíos, salvo los cuatro que Google resolvió por su cuenta y quedaron tachados.

**Pedir a mano dejó de ser urgente para Grado y sigue siendo lo único que mueve el
resto.** Las 36 de Grado se indexaron solas; los otros grupos llevan tres semanas
quietos en "descubierta, sin rastrear", que es Google diciendo que conoce la URL y no
le da prioridad para visitarla.

Matiz del 01/08: Google avanza solo, pero despacio y desparejo. De diez pendientes que se
volvieron a mirar, cuatro se indexaron sin pedido —incluidas las tres ⬜ que el 29/07 se
habían marcado como el caso más urgente— y cinco siguen con **rastreo `Never`**. Esas
cinco son las que de verdad necesitan el pedido a mano; están señaladas abajo.

**Cómo se pide (2 clics):** pegás la URL en la barra de inspección de Search Console →
botón **"Solicitar indexación"** → esperás ~1 min. Tope práctico: ~10-12 por día por
propiedad. Al pasarte devuelve *"Se superó la cuota diaria de esta función"* y seguís
al día siguiente.

**Empezá por el Día 0, no por el Día 1.** El Día 0 no son carreras sin indexar: son
las páginas que ya tienen impresiones y a las que Google todavía no les leyó el título
nuevo del 29/07 (el porqué está en la sección 3). Convierte tráfico que ya existe, y
además es lo único que hace medible la reescritura en agosto.

Después: Siglo 21 (Pregrado y CCC), Teclab, Identidad Argentina. Son 5 días en total.

### Día 0 — recrawl de las páginas con tráfico

> **Lista rehecha el 01/08/2026.** La versión anterior se armó con impresiones del
> 30/06–28/07, o sea antes del salto de tráfico. Con seis días de datos nuevos el orden
> cambió bastante: **Actuario se cayó de la lista** (pasó de 53 impresiones a 1, en
> posición 29) y entraron cuatro fichas que antes no aparecían. Impresiones y posición
> son del 26 al 31/07, por dimensión `page`.

- [ ] **Martillero, Corredor Público y Corredor Inmobiliario** — 247 impr · pos 7,5 · 0 clics · rastreo 28/07
      https://www.siglo21sur.com/carreras/martillero-corredor-publico-y-corredor-inmobiliario
- [ ] **Tec. Sup. en Marketing Digital** (Teclab) — 163 · pos 9,3 · 2 clics · rastreo 25/07
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-marketing-digital
- [ ] **Lic. en Higiene, Seguridad y Medio Ambiente del Trabajo** — 128 · pos 8,7 · 0 clics · rastreo 25/07
      https://www.siglo21sur.com/carreras/licenciatura-en-higiene-seguridad-y-medio-ambiente-del-trabajo
- [ ] **Lic. en Inteligencia Artificial y Robótica** — 87 · pos 9,8 · 1 clic · rastreo 25/07
      https://www.siglo21sur.com/carreras/licenciatura-en-inteligencia-artificial-y-robotica
- [ ] **Lic. en Seguridad Informática** — 84 · pos 9,4 · 1 clic · rastreo 25/07
      https://www.siglo21sur.com/carreras/licenciatura-en-seguridad-informatica
- [ ] **Lic. en Comercio Internacional** — 73 · pos 8,2 · 0 clics · rastreo 25/07
      https://www.siglo21sur.com/carreras/licenciatura-en-comercio-internacional
- [ ] **Procurador** — 72 · pos 7,7 · 0 clics · rastreo 28/07
      https://www.siglo21sur.com/carreras/procurador
- [ ] **Lic. en Gestión Deportiva** — 54 · pos 8,4 · 0 clics · rastreo sin verificar
      https://www.siglo21sur.com/carreras/licenciatura-en-gestion-deportiva
- [ ] **Lic. en Ciencias de Datos** — 50 · pos 12,4 · 0 clics · rastreo sin verificar
      https://www.siglo21sur.com/carreras/licenciatura-en-ciencias-de-datos
- [ ] **Lic. en Nutrición** — 50 · pos 7,2 · 0 clics · rastreo sin verificar
      https://www.siglo21sur.com/carreras/licenciatura-en-nutricion

Las tres últimas no se inspeccionaron: la fecha de rastreo está sin verificar y se piden
por volumen de impresiones con cero clics, que es señal suficiente.

**Lic. en Finanzas salió de la lista**: tiene 90 impresiones y 0 clics, pero Google la
rastreó el **31/07** y ya está sirviendo el título nuevo. Es el control natural del
experimento — si en dos semanas su CTR sube y el de las otras no, la reescritura sirvió.

Si sobra cuota ese día:

- **Agroinformática** — rastreo **06/07**, anterior al deploy del 24/07. Es la ficha de
  mejor CTR del sitio (16,7% en posición 5,8) sirviendo una versión vieja de la página.
- **Sobre nosotros** — rastreo 21/07.
- **`/clases-apoyo`** — rastreo **11/06**. Es `force-dynamic` y muestra un calendario
  relativo a hoy, así que lo que Google tiene indexado ahí es contenido vencido.

### Día 1 — Pregrado

- [x] ~~**Tec. en Gestión Administrativa de Servicios de Salud**~~ ✅ se indexó sola — rastreada el 29/07
- [x] ~~**Tec. en Relaciones Laborales**~~ ✅ se indexó sola — rastreada el 29/07, ya no sirve la página del 30/03
- [ ] **Tec. en Dirección de Protocolo, Organización de Eventos y RRPP**
      https://www.siglo21sur.com/carreras/tecnicatura-en-direccion-de-protocolo-organizacion-de-eventos-y-rrpp
- [ ] **Tec. en Dirección de Equipos de Venta**
      https://www.siglo21sur.com/carreras/tecnicatura-en-direccion-de-equipos-de-venta
- [ ] **Tec. en Estadística Aplicada y Análisis Avanzado**
      https://www.siglo21sur.com/carreras/tecnicatura-en-estadistica-aplicada-y-analisis-avanzado
- [ ] **Tec. en Diseño y Desarrollo de Videojuegos** ❌ rastreo `Never` al 01/08
      https://www.siglo21sur.com/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos
- [ ] **Tec. en Gestión de Moda**
      https://www.siglo21sur.com/carreras/tecnicatura-en-gestion-de-moda
- [ ] **Tec. en Recursos Turísticos**
      https://www.siglo21sur.com/carreras/tecnicatura-en-recursos-turisticos
- [ ] **Tec. en Gestión y Auditorías Ambientales**
      https://www.siglo21sur.com/carreras/tecnicatura-en-gestion-y-auditorias-ambientales
- [ ] **Tec. en Gestión Contable e Impositiva**
      https://www.siglo21sur.com/carreras/tecnicatura-en-gestion-contable-e-impositiva

### Día 2 — Pregrado, CCC y Teclab Tecnología

- [ ] **Tec. en Hidrocarburos y Geociencias** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-hidrocarburos-y-geociencias
- [ ] **Lic. en Desarrollo de Negocios Inmobiliarios (CCC)**
      https://www.siglo21sur.com/carreras/licenciatura-en-desarrollo-de-negocios-inmobiliarios-ccc
- [ ] **Lic. en Emprendimiento (CCC)**
      https://www.siglo21sur.com/carreras/licenciatura-en-emprendimiento-ccc
- [ ] **Lic. en Gerontología (CCC)**
      https://www.siglo21sur.com/carreras/licenciatura-en-gerontologia-ccc
- [ ] **Profesorado Universitario para Nivel Secundario y Superior (CCC)**
      https://www.siglo21sur.com/carreras/profesorado-universitario-para-nivel-secundario-y-superior-ccc
- [ ] **Lic. en Educación (CCC)** ❌ rastreo `Never` al 01/08
      https://www.siglo21sur.com/carreras/licenciatura-en-educacion-ccc
- [ ] **Lic. en Psicopedagogía (CCC)** ❌ rastreo `Never` al 01/08
      https://www.siglo21sur.com/carreras/licenciatura-en-psicopedagogia-ccc
- [ ] **Tec. Sup. en Redes Informáticas** — _Teclab_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-redes-informaticas
- [ ] **Tec. Sup. en Programación** — _Teclab_ ❌ rastreo `Never` al 01/08
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-programacion
- [ ] **Tec. Sup. en Data Science** — _Teclab_ ❌ rastreo `Never` al 01/08
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-data-science

### Día 3 — Teclab

- [x] ~~**Tec. Sup. en Seguridad Informática**~~ ✅ se indexó sola — rastreada el 31/07
- [x] ~~**Tec. Sup. en Relaciones Laborales**~~ ✅ se indexó sola — rastreada el 31/07
- [ ] **Tec. Sup. en Quality Assurance**
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-quality-assurance
- [ ] **Tec. Sup. en Gestión Hotelera**
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-gestion-hotelera
- [ ] **Tec. Sup. en Planificación y Organización de Eventos**
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-planificacion-y-organizacion-de-eventos
- [ ] **Tec. Sup. en Customer Experience**
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-customer-experience
- [ ] **Tec. Sup. en Venta Directa**
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-venta-directa
- [ ] **Tec. Sup. en Gestión Contable**
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-gestion-contable
- [ ] **Tec. Sup. en Seguros**
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-seguros
- [ ] **Tec. Sup. en Gestión Agraria**
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-gestion-agraria

### Día 4 — Teclab e Identidad Argentina

- [ ] **Diplomatura Integral en RRHH** ⬜ desconocida para Google
      https://www.siglo21sur.com/carreras/diplomatura-integral-en-rrhh
- [ ] **Diplomatura en Oratoria** ⬜ desconocida para Google
      https://www.siglo21sur.com/carreras/diplomatura-en-oratoria
- [ ] **Tec. Sup. en Periodismo y Nuevas Tecnologías** — _Teclab_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-periodismo-y-nuevas-tecnologias
- [ ] **Diplomatura en Gestión de Equipos de Alto Desempeño**
      https://www.siglo21sur.com/carreras/diplomatura-en-gestion-de-equipos-de-alto-desempeno
- [ ] **Diplomatura en Inteligencia Artificial**
      https://www.siglo21sur.com/carreras/diplomatura-en-inteligencia-artificial
- [ ] **Curso de Constitución de Sociedades S.A, S.A.S, S.R.L**
      https://www.siglo21sur.com/carreras/curso-de-constitucion-de-sociedades-sa-sas-srl
- [ ] **Diplomatura en Management Hotelero**
      https://www.siglo21sur.com/carreras/diplomatura-en-management-hotelero
- [ ] **Curso de Mindfulness y Técnicas de Gestión del Estrés**
      https://www.siglo21sur.com/carreras/curso-de-mindfulness-y-tecnicas-de-gestion-del-estres
- [ ] **Diplomatura en Fraude Financiero y Digital**
      https://www.siglo21sur.com/carreras/diplomatura-en-fraude-financiero-y-digital
- [ ] **Diplomatura en Marketing para Emprendedores y Dueños de Negocios**
      https://www.siglo21sur.com/carreras/diplomatura-en-marketing-para-emprendedores-y-duenos-de-negocios

## Cómo volver a medir

No hace falta rehacer el conteo a ojo: son 10 llamadas a `batch_url_inspection` sobre
`sc-domain:siglo21sur.com` con las 96 URLs de `/carreras/` del sitemap. **El tope es de
10 URLs por llamada** — con más, la herramienta responde `Too many URLs provided`. Las
URLs salen de `https://www.siglo21sur.com/sitemap.xml` filtrando por `/carreras/`.

---

# 3 · El cuello de botella ya no es la indexación

> **Estado al 29/07/2026: desplegado y todavía invisible.** El 27/07 (`36e53d6`) se
> sacó la marca duplicada del `<title>`, y el 29/07 se reescribieron título y
> description de las 96 fichas — detalle abajo, en *Qué se hizo*.
>
> **Google no vio nada de eso.** La inspección de las 96 fichas del 29/07 muestra que
> la fecha de último rastreo más nueva de todo el sitio es el **28/07**, un día antes
> del deploy. O sea que Google sirve los títulos viejos en las 56 fichas indexadas,
> incluidas las 8 de la tabla de acá abajo, que son justo las que el arreglo apuntaba.
> Se verificó que las páginas nuevas sí están publicadas: `/carreras/actuario` responde
> con el `<title>` reescrito.
>
> **Consecuencia para la medición de agosto:** si esas páginas no se rastrean antes,
> el CTR va a dar igual que hoy y la lectura fácil —"la reescritura no sirvió"— sería
> falsa. No se puede medir un cambio que el buscador no llegó a publicar. Por eso la
> cola de la sección 2 arranca con un **Día 0** de recrawl, antes que las 40 sin
> indexar.
>
> **Confirmado el 01/08/2026.** Pasó lo previsto: el tráfico se multiplicó por trece y el
> CTR quedó en 1,5%, con ocho de las diez páginas más vistas todavía sirviendo el título
> viejo (rastreos del 25 al 28/07). **Ese 1,5% no es el resultado de la reescritura y no
> debe leerse como tal.** El detalle está en la sección 1.

**La tabla de esta sección quedó vieja.** Se armó con impresiones del 30/06–28/07, antes
del salto de tráfico. Para pedir recrawls usá la lista rehecha del **Día 0 en la sección
2**; lo de acá abajo se conserva como registro de lo que se veía el 29/07.

## Día 0 — forzar el recrawl de las páginas que ya tienen tráfico

Estas **no** están sin indexar: están indexadas, tienen impresiones y acaban de recibir
título y description nuevos que Google todavía no leyó. Un pedido de indexación las
hace releer. Rinde más que las 40 sin indexar, porque acá el tráfico ya existe y lo
único que falta es que cambie el texto del resultado.

Ordenadas por impresiones, con el último rastreo que informó la API el 29/07:

| Página | Impresiones (30 d) | Último rastreo |
|---|--:|---|
| Sobre nosotros | 124 | 21/07 |
| Higiene, Seguridad y Medio Ambiente | 72 | 25/07 |
| Licenciatura en Finanzas | 61 | 25/07 |
| Administración Agraria | 56 | 21/07 |
| Investigación de la Escena del Crimen | 54 | 19/07 |
| Actuario | 53 | **27/06** |
| Logística Global | 49 | 25/07 |
| Seguridad Informática | 48 | 25/07 |
| Martillero y Corredor | 43 | 28/07 |
| Comercio Internacional | 42 | 25/07 |
| Bioinformática | 34 | 19/07 |

Actuario es el caso extremo: **un mes sin rastrear**, con 53 impresiones y cero clics.
Es la que más tarda en volver sola.

Nota aparte: el home (rastreado el 27/07) y `/clases-apoyo` (**11/06**) también están
viejos. `/clases-apoyo` es `force-dynamic` y muestra un calendario relativo a hoy, así
que un rastreo de hace mes y medio es contenido muerto en el índice.

Ocho páginas están en **posición 8 a 11 con cero clics**:

| Página | Impresiones | Posición |
|---|--:|--:|
| Sobre nosotros | 124 | 9,4 |
| Administración Agraria | 55 | 9,6 |
| Actuario | 54 | 8,7 |
| Investigación de la Escena del Crimen | 50 | 8,4 |
| Redes Informáticas y Telecom. | 35 | 8,4 |
| Marketing Digital (Teclab) | 33 | 11,2 |
| Higiene, Seguridad y Medio Ambiente | 28 | 9,3 |
| Bioinformática | 27 | 6,8 |

Google ya las muestra y nadie entra. El problema pasó a ser el `<title>` y la meta
description. Referencia: Agroinformática convierte al **10%** en posición 6,2; Actuario
al **0%** en 8,7.

Reescribir esos títulos le pega a tráfico que ya existe, y es más barato que conseguir
páginas nuevas.

## Qué se hizo — 29/07/2026

**El dato que ordenó las decisiones:** casi todas las consultas que traen impresiones
son `"<carrera> siglo 21"` o `"siglo 21 <carrera>"` — "siglo 21 seguridad e higiene"
(14), "actuario siglo 21" (8), "siglo 21 martillero publico" (6). O sea que **la marca
es la mitad de lo que la persona escribió**, y es la mitad que Google resalta en negrita.

Ojo con la fuente: el desglose por consulta subcuenta fuerte, porque Google anonimiza
las consultas raras. `/sobre-nosotros` da 6 impresiones por consulta y 124 por página.
**Para volumen hay que pedir la dimensión `page`; el desglose por query sirve para saber
qué se busca, no cuánto.**

**1. Títulos que no se cortan.** Eran 36 de 96 los que pasaban de 60 caracteres — el
`??` del selector de sufijo pegaba `" | Siglo 21"` aunque no entrara, así que Google
cortaba justo la marca. Ahora se prueba el nombre completo con el sufijo más informativo
que entre y, si ninguno entra, se baja a `nombre_corto` (poblado en 94 de 96).

| | antes | ahora |
|---|--:|--:|
| Títulos de más de 60 caracteres | 36 | **8** |
| De esos, los que pierden la marca | 36 | **3** |
| Largo medio | — | 54,8 |

Los 5 que se pasan por poco lo hacen a propósito: `Martillero, Corredor Público y
Corredor Inmobiliario | Siglo 21` son 63 caracteres, y la consulta que le trae
impresiones es "siglo 21 martillero publico". Soltar la marca era soltar media consulta.

**2. Descripciones con contenido propio.** Antes eran la misma plantilla en las 96 y
media línea se iba en "atención cerca de Zona Sur y Oeste", que no es lo que se busca
cuando se escribe "plan de estudio comercio internacional siglo 21". Ahora cada familia
arranca por lo que no repite ninguna otra ficha:

- **Siglo 21** (68) → la columna `enfoque`, que viene limpia y distinta en las 68:
  "Prevención de Riesgos, Normativas OHSAS y Ergonomía."
- **Teclab** (17) → el título técnico y la empresa cocreadora de la ficha oficial:
  "Recibite de Técnico Superior en Redes Informáticas en 2 años… cocreada con Cisco."
- **Identidad Argentina** (11) → duración, modalidad y certificación, sin nombrar a la
  universidad, que no dicta estas diplomaturas.

Además se les pusieron los acentos: la plantilla vieja publicaba "Estudia", "atencion",
"inscripcion" y "Todavia no abrio" **en el resultado de Google**.

**3. Verificado sobre el HTML del build**, no sobre el código: 96 fichas, 0 descripciones
vacías, 0 títulos repetidos, 0 descripciones repetidas, largo medio 152 y ninguna sobre
165. Y ninguna promete "Plan de estudios" en una ficha que no lo tiene — las 93 que
renderizan la sección son exactamente las que marca `npm run auditar`.

---

# 4 · Línea de base — 24/07/2026

> Medición tomada **antes** del deploy del 24/07. Se conserva sin cambios: es el punto
> de comparación para agosto.

| | Estado | Qué quiere decir |
|--|--|--|
| ✅ | Indexada | Está en Google, puede aparecer en búsquedas. |
| 🟠 | Rastreada, sin indexar | Google la visitó pero decidió no indexarla. |
| ❌ | Descubierta, sin rastrear | Google sabe que existe pero **nunca la visitó**. |
| ⬜ | Desconocida para Google | Google ni la tiene registrada. |

| | Estado | Carreras | % |
|--|--|--:|--:|
| ✅ | Indexadas | 23 | 24% |
| 🟠 | Rastreadas sin indexar | 4 | 4% |
| ❌ | Descubiertas sin rastrear | 62 | 65% |
| ⬜ | Desconocidas | 7 | 7% |
| | **Total** | **96** | **100%** |

## Siglo 21 — Grado (Licenciaturas)

**36 carreras** — ✅ 13 · 🟠 1 · ❌ 22 · ⬜ 0

| | Carrera |
|:--:|---|
| ✅ | Abogacía |
| ✅ | Escribanía |
| ✅ | Contador Público |
| ✅ | Licenciatura en Administración |
| ❌ | Licenciatura en Finanzas |
| ✅ | Actuario |
| ❌ | Licenciatura en Comercio Internacional |
| ❌ | Licenciatura en Comercialización |
| ✅ | Licenciatura en Negocios Digitales |
| ❌ | Licenciatura en Inteligencia Artificial y Robótica |
| ❌ | Licenciatura en Ciencias de Datos |
| ❌ | Licenciatura en Seguridad Informática |
| ✅ | Licenciatura en Informática |
| ❌ | Licenciatura en Matemática |
| ✅ | Licenciatura en Bioinformática |
| ❌ | Licenciatura en Logística Global |
| ❌ | Licenciatura en Gestión Ambiental |
| ❌ | Licenciatura en Higiene, Seguridad y Medio ambiente del Trabajo |
| ❌ | Licenciatura en Gestión Turística |
| 🟠 | Licenciatura en Administración Hotelera |
| ❌ | Licenciatura en Gestión de Recursos Humanos |
| ❌ | Licenciatura en Gestión Deportiva |
| ✅ | Licenciatura en Administración Agraria |
| ❌ | Licenciatura en Ciencia Política y Gobierno |
| ✅ | Licenciatura en Administración Pública |
| ❌ | Licenciatura en Relaciones Internacionales |
| ✅ | Licenciatura en Criminología y Seguridad |
| ❌ | Licenciatura en Periodismo |
| ✅ | Licenciatura en Publicidad |
| ❌ | Licenciatura en Relaciones Públicas e Institucionales |
| ❌ | Licenciatura en Diseño y Animación Digital |
| ❌ | Licenciatura en Terapia Ocupacional y Desarrollo Humano |
| ❌ | Licenciatura en Educación y Nuevas Tecnologías |
| ❌ | Licenciatura en Nutrición |
| ✅ | Licenciatura en Agroinformática |
| ❌ | Licenciatura en Sociología |

## Siglo 21 — Grado CCC

**7 carreras** — ✅ 1 · 🟠 0 · ❌ 5 · ⬜ 1

| | Carrera |
|:--:|---|
| ❌ | Licenciatura en Desarrollo De Negocios Inmobiliarios (CCC) |
| ❌ | Licenciatura en Gerontología (CCC) |
| ⬜ | Licenciatura en Emprendimiento (CCC) |
| ✅ | Licenciatura en Administración de Servicios de Salud (CCC) |
| ❌ | Licenciatura en Educación (CCC) |
| ❌ | Licenciatura en Psicopedagogía (CCC) |
| ❌ | Profesorado Universitario para Nivel Secundario y Superior (CCC) |

## Siglo 21 — Pregrado (Tecnicaturas)

**25 carreras** — ✅ 6 · 🟠 3 · ❌ 14 · ⬜ 2

| | Carrera |
|:--:|---|
| ❌ | Martillero, Corredor Público y Corredor Inmobiliario |
| ❌ | Procurador |
| ✅ | Tecnicatura en Investigación de la escena del crimen |
| ❌ | Tecnicatura en Administración y Gestión Tributaria |
| 🟠 | Tecnicatura en Gestión de Empresas Familiares |
| ❌ | Tecnicatura en Administración y Gestión de Políticas Públicas |
| 🟠 | Tecnicatura en Responsabilidad y Gestión Social |
| ✅ | Tecnicatura en Higiene y Seguridad Laboral |
| ❌ | Tecnicatura en Diseño y Animación Digital |
| ❌ | Tecnicatura en Marketing y Publicidad Digital |
| ❌ | Tecnicatura en Recursos Turísticos |
| ⬜ | Tecnicatura en Hidrocarburos y Geociencias |
| ❌ | Tecnicatura en Gestión y Auditorías Ambientales |
| ❌ | Tecnicatura en Dirección de Equipos de venta |
| ❌ | Tecnicatura en Gestión Contable e impositiva |
| 🟠 | Tecnicatura en Relaciones Laborales |
| ❌ | Tecnicatura en Dirección de Protocolo, Organización de Eventos y RRPP |
| ⬜ | Tecnicatura en Gestión de Moda |
| ✅ | Tecnicatura en Gestión del Clima Laboral de la Organización |
| ✅ | Tecnicatura en Promoción Comunitaria en Niñez y Adolescencia |
| ❌ | Tecnicatura en Gestión Administrativa de Servicios de Salud |
| ✅ | Tecnicatura en Redes Informáticas y Telecomunicaciones |
| ❌ | Tecnicatura en Diseño y Desarrollo de Videojuegos |
| ✅ | Tecnicatura en Negocios Agroecológicos |
| ❌ | Tecnicatura en Estadística Aplicada y Análisis Avanzado |

## Teclab — Tecnología

**6 carreras** — ✅ 0 · 🟠 0 · ❌ 6 · ⬜ 0

Programación · Data Science · Quality Assurance · Redes Informáticas · Seguridad
Informática · Cloud Administration — las seis en ❌ *Descubierta, sin rastrear*.

## Teclab — Gestión

**11 carreras** — ✅ 1 · 🟠 0 · ❌ 8 · ⬜ 2

| | Carrera |
|:--:|---|
| ❌ | Tecnicatura Superior en Marketing Digital |
| ✅ | Tecnicatura Superior en Inbound Marketing |
| ❌ | Tecnicatura Superior en Customer Experience |
| ❌ | Tecnicatura Superior en Venta Directa |
| ❌ | Tecnicatura Superior en Gestión Contable |
| ⬜ | Tecnicatura Superior en Seguros |
| ⬜ | Tecnicatura Superior en Gestión Agraria |
| ❌ | Tecnicatura Superior en Relaciones Laborales |
| ❌ | Tecnicatura Superior en Gestión Hotelera |
| ❌ | Tecnicatura Superior en Planificación y Organización de Eventos |
| ❌ | Tecnicatura Superior en Periodismo y Nuevas Tecnologías |

## Identidad Argentina

**11 carreras** — ✅ 2 · 🟠 0 · ❌ 7 · ⬜ 2

| | Carrera |
|:--:|---|
| ❌ | Diplomatura en Oratoria |
| ❌ | Diplomatura en Gestión de Equipos de Alto Desempeño |
| ❌ | Curso de Mindfulness y Técnicas de Gestión del Estrés |
| ✅ | Diplomatura en Bienestar Integral: Herramientas para Transformar-te |
| ❌ | Diplomatura Integral en RRHH |
| ⬜ | Diplomatura en Fraude Financiero y Digital |
| ❌ | Diplomatura en Inteligencia Artificial |
| ❌ | Curso de Constitución de Sociedades S.A, S.A.S, S.R.L |
| ⬜ | Diplomatura en Marketing para Emprendedores y Dueños de Negocios |
| ✅ | Diplomatura en Compliance |
| ❌ | Diplomatura en Management Hotelero |

---

# 5 · Diagnóstico del 24/07 — ya corregido

El relevamiento del 24/07 encontró dos bloqueos que explicaban por qué las fichas no se
indexaban. Los dos se arreglaron en el deploy de ese mismo día.

**1. Todas las páginas de carrera eran huérfanas.** Buscando `href="/carreras/..."` en el
HTML servido del home aparecían **0 enlaces**: las tarjetas del catálogo eran `<button>`
que abrían un modal y cambiaban la URL con `pushState`. Googlebot no hace clic, así que
las carreras solo llegaban por el sitemap — el caso típico de *"Descubierta, actualmente
sin indexar"*.

**2. Todas las páginas eran casi idénticas al home.** El HTML de una carrera pesaba
~625 KB contra los ~628 KB del home: el **99,5% del mismo contenido**. La página
renderizaba Hero + catálogo completo + formulario, igual que el home, y lo único que
cambiaba era `<title>`, `<meta description>`, el `canonical` y el JSON-LD. El contenido
real de la carrera vivía dentro del modal, client-side, fuera del HTML servido. Google
las veía como duplicados y elegía el home como canónica.

**Qué se hizo:** envolver las tarjetas en `<a href>` reales, renderizar el detalle de la
carrera en servidor (`<h1>` con el nombre, enfoque, duración, plan de estudios), usar
`carreraFullName()` en el `<title>` para incluir el prefijo, y depurar el sitemap.

**Resultado:** 23 → 38 carreras indexadas en tres días, sin pedir ninguna a mano.

---

# 6 · Fuera de alcance

Los niveles Posgrado, APLV/Extragrado, Certificaciones y Cursos **quedaron fuera de la
oferta del sitio** (27/07/2026). No están en el catálogo, ni en el sitemap, ni tienen
página: `/carreras/{slug}` les devuelve 404. No se piden ni se miden.

De ese grupo solo una llegaba a aparecer en Google —Maestría en Innovación Educativa, 9
impresiones y 0 clics en posición 6,4— y hoy devuelve 404.

# 7 · Próxima medición

Mediados de agosto de 2026. **La referencia es el 56 de 96 del 29/07**, que es la única
medición exacta que hay; el 23 del 24/07 y el 38 del 27/07 son de otro método —conteo
por impresiones— y sólo sirven para ver la tendencia, no para restar.

Se mide igual que el 29/07: 10 llamadas a `batch_url_inspection`, 10 URLs cada una.
Sin pedidos manuales, lo esperable es que se mueva poco pero no nada: la muestra del
01/08 mostró que Google indexa cuatro de cada diez pendientes por su cuenta en tres días,
mientras otras cinco siguen sin haber sido rastreadas nunca. Si se hicieron los 4 días de
la cola de la sección 2, la comparación dice bastante más.

**Qué mirar además de la indexación:** el CTR de las páginas de la tabla de acá abajo,
que son las que tienen impresiones y cero clics. Son el único modo de saber si la
reescritura de títulos y descripciones del 29/07 sirvió de algo.

**Antes de leer ese CTR, chequeá la fecha de último rastreo de cada página.** Si sigue
siendo anterior al 29/07, Google todavía está mostrando el título viejo y el CTR no
mide la reescritura: mide la versión anterior. En ese caso el dato no dice nada y hay
que hacer el Día 0 de la sección 2 y esperar. Es el error más fácil de cometer acá.

**Línea de base para comparar — actualizada el 01/08/2026.** Del 26 al 31/07 y **por
dimensión `page`**. Reemplaza a la del 30/06–28/07, que quedó sin sentido: se tomó antes
del salto de tráfico y sobre un volumen diez veces menor.

| Página | Impresiones | Clics | CTR | Posición | Rastreo |
|---|--:|--:|--:|--:|---|
| Martillero y Corredor | 247 | 0 | 0% | 7,5 | 28/07 |
| Marketing Digital (Teclab) | 163 | 2 | 1,2% | 9,3 | 25/07 |
| Higiene, Seguridad y Medio Ambiente | 128 | 0 | 0% | 8,7 | 25/07 |
| Licenciatura en Finanzas | 90 | 0 | 0% | 7,7 | **31/07** |
| Logística Global | 88 | 2 | 2,3% | 7,2 | — |
| Inteligencia Artificial y Robótica | 87 | 1 | 1,1% | 9,8 | 25/07 |
| Terapia Ocupacional | 86 | 2 | 2,3% | 6,3 | — |
| Seguridad Informática | 84 | 1 | 1,2% | 9,4 | 25/07 |
| Gestión de Recursos Humanos | 80 | 1 | 1,3% | 8,2 | — |
| Comercio Internacional | 73 | 0 | 0% | 8,2 | 25/07 |
| Procurador | 72 | 0 | 0% | 7,7 | 28/07 |
| — referencia, las que sí convierten — | | | | | |
| Responsabilidad y Gestión Social | 22 | 3 | **13,6%** | 6,0 | — |
| Agroinformática | 6 | 1 | **16,7%** | 5,8 | 06/07 |
| Redes Informáticas y Telecom. | 48 | 3 | **6,3%** | 6,7 | — |
| — el home, para contexto — | | | | | |
| `/` | 190 | 8 | 4,2% | 14,2 | 27/07 |

Totales del sitio en los 28 días al 01/08: **68 clics, 3.547 impresiones, CTR 1,92%,
posición 10,1**.

La brecha es toda la tesis: **Agroinformática y Responsabilidad y Gestión Social
convierten arriba del 13% en posición 6, y Martillero convierte 0% en posición 7,5.** Si
las de la mitad de arriba llegaran aunque sea al 4%, el sitio pasa de 68 clics por mes a
tres dígitos sin ganar una sola posición.

**Lic. en Finanzas es el control.** Es la única de la tanda rastreada después del deploy
del 29/07, así que es la única que hoy muestra el título nuevo. Si en la medición de
agosto su CTR sube y el de Martillero, Higiene o Comercio Internacional no, la reescritura
funcionó y lo que falta es recrawl. Si no sube ninguna, el problema es el texto y hay que
volver a escribirlo.

---

# 8 · Lo que este archivo no puede medir

Todo lo de acá sale de Search Console: **impresiones y clics hasta el borde del sitio.**
Lo que pasa después —si esos 68 clics se convirtieron en una consulta— no está medido en
ningún lado de este repo.

Las dos fuentes que lo tienen están activas en el sitio (`app/layout.tsx:117-119`:
`PublicGoogleAnalytics`, `Analytics` de Vercel, `SpeedInsights`) pero **no se pueden leer
desde acá**:

- **GA4** — no hay MCP ni service account configurada. GSC sí la tiene
  (`sc-domain:siglo21sur.com`, service account con permiso de Owner); GA4 necesitaría el
  mismo tratamiento.
- **Vercel Web Analytics** — el CLI está autenticado y llega al proyecto
  (`prj_Bzj99aKZd8l83qLGYKHdeSFf76Qt`, team `team_4UpMwvtzs6qttpxOeBk0qgNi`), pero la API
  de analytics no es pública: `web-analytics/overview`, `web-analytics/timeseries` y
  `web/insights/overview` devuelven 404 con un token válido. Sólo por el dashboard.
- **La tabla `consultas`** tiene el número real de inscripciones, pero es service role:
  desde la máquina local no hay credencial de lectura (ver `CLAUDE.md`, *Los cuatro
  clientes de Supabase*).

**Por qué importa:** el criterio de éxito de todo lo de arriba es "más clics", que es un
proxy. Si las carreras que traen clics no son las que traen inscripciones, la cola de
recrawls está priorizada por la métrica equivocada. Mientras GA4 no se pueda leer, esto
se decide a ciegas.
