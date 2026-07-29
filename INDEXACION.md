# Indexación — siglo21sur.com

Archivo único de indexación. Reemplaza a `INDEXACION_CARRERAS.md`,
`INDEXACION_REAL_GSC.md` y `PLAN_INDEXACION.md`, que se unificaron acá el 27/07/2026.

**Propiedad:** `sc-domain:siglo21sur.com` · **Fuente:** Search Console (URL Inspection
API + Search Analytics)

**Alcance:** las 96 carreras de la oferta vigente — Grado, Pregrado, Grado CCC, Teclab
e Identidad Argentina.

---

# 1 · Estado actual — 27/07/2026

**Al menos 38 de las 96 carreras están indexadas.** Eran 23 el 24/07.

| | 24/07 (base) | 27/07 | Cambio |
|---|--:|--:|--:|
| Carreras indexadas | 23 | **38** | **+15** |
| Sobre el total de 96 | 24% | **40%** | +16 pts |

Es un piso, no un techo: se contaron las carreras que **aparecieron en resultados de
Google** en los últimos 30 días, y una página puede estar indexada sin haber recibido
impresiones en ese lapso. El número real es 38 o más.

## Qué se movió

Las 10 carreras del Día 1 del plan estaban todas en ❌ *Descubierta, sin rastrear* y hoy
aparecen en Google:

| Carrera | Impresiones (30 días) | Posición |
|---|--:|--:|
| Higiene, Seguridad y Medio Ambiente del Trabajo | 28 | 9,3 |
| Seguridad Informática | 20 | 10,9 |
| Logística Global | 15 | 8,3 |
| Inteligencia Artificial y Robótica | 12 | 14,7 |
| Finanzas | 10 | 8,8 |
| Comercio Internacional | 9 | 9,3 |
| Ciencias de Datos | 9 | 14,0 |
| Gestión Ambiental | 9 | 13,6 |
| Matemática | 9 | 6,3 · 1 clic |
| Comercialización | 5 | 14,0 |

Y cinco más de otros grupos: **Gestión de Recursos Humanos**, **Relaciones
Internacionales**, **Periodismo**, **Marketing Digital** (Teclab) y **Cloud
Administration** (Teclab).

**Ninguna se pidió a mano.** El deploy del 24/07 —contenido propio renderizado en
servidor, 96 enlaces internos y sitemap depurado— alcanzó para que Google las rastreara
solo.

Verificado además con inspección directa de URL:

| Carrera | 24/07 | 27/07 |
|---|---|---|
| Tec. Sup. en Marketing Digital | ❌ Descubierta | ✅ **Indexada** (rastreada 25/07, con breadcrumbs) |
| Tec. Sup. en Inbound Marketing | ✅ Indexada | ✅ Indexada (rastreada 23/07) |
| Tec. Sup. en Seguros | ⬜ Desconocida | ❌ **Descubierta** |
| Tec. Sup. en Gestión Agraria | ⬜ Desconocida | ❌ **Descubierta** |
| Tec. Sup. en Gestión Contable | ❌ Descubierta | ❌ Descubierta |

## Tráfico del sitio — 30 días (28/06 al 27/07)

| | |
|---|--:|
| Páginas con impresiones | 55 |
| Impresiones | 1.578 |
| Clics | 38 |

El home se lleva 631 impresiones (40%) con posición 15,3 y CTR 2,85%. Agroinformática
sola aporta 11 de los 38 clics —el 29% del total— en una carrera que todavía no se
dicta (ver `proximamente` en `components/index/types.ts`).

---

# 2 · Plan de solicitudes

## Progreso

**15 de 73 ya están indexadas** — y ninguna se pidió a mano.

| Día | Grupo | Indexadas |
|---|---|--:|
| 1 | Siglo 21 — Grado | **10 de 10** ✅ |
| 2 | Siglo 21 — Grado | 3 de 10 |
| 3 | Siglo 21 — Grado y Pregrado | 0 de 10 |
| 4 | Siglo 21 — Pregrado | 0 de 10 |
| 5 | Siglo 21 — Pregrado, CCC · Teclab | 0 de 10 |
| 6 | Teclab — Tecnología y Gestión | 2 de 10 |
| 7 | Teclab — Gestión · Identidad Argentina | 0 de 10 |
| 8 | Identidad Argentina | 0 de 3 |
| | **Total** | **15 de 73** |

**Pedir indexación a mano dejó de ser urgente.** Sirve para acelerar las que se están
quedando atrás, no para reemplazar un proceso que ya funciona. Si no pedís ninguna, se
van a indexar igual — más lento.

## Cómo se pide (2 clics)

1. Pegá la URL en la barra de inspección de Search Console.
2. Botón **"Solicitar indexación"** → esperás ~1 min → listo.

Tope práctico: ~10-12 por día por propiedad. Al pasarte devuelve *"Se superó la cuota
diaria de esta función"* y seguís al día siguiente.

## Prioridad 1 — Siglo 21 · Prioridad 2 — Teclab · Prioridad 3 — Identidad Argentina

Leyenda: ✅ ya indexada, no hay nada que hacer · ⬜ pendiente de pedir.

### Día 1 — ✅ completo, indexado solo

- ✅ **Licenciatura en Finanzas** — _Grado_ · 10 impresiones, pos. 8,8
- ✅ **Licenciatura en Comercio Internacional** — _Grado_ · 9 impresiones, pos. 9,3
- ✅ **Licenciatura en Comercialización** — _Grado_ · 5 impresiones, pos. 14,0
- ✅ **Licenciatura en Inteligencia Artificial y Robótica** — _Grado_ · 12 impresiones, pos. 14,7
- ✅ **Licenciatura en Ciencias de Datos** — _Grado_ · 9 impresiones, pos. 14,0
- ✅ **Licenciatura en Seguridad Informática** — _Grado_ · 20 impresiones, pos. 10,9
- ✅ **Licenciatura en Matemática** — _Grado_ · 9 impresiones, pos. 6,3 · **1 clic**
- ✅ **Licenciatura en Logística Global** — _Grado_ · 15 impresiones, pos. 8,3
- ✅ **Licenciatura en Gestión Ambiental** — _Grado_ · 9 impresiones, pos. 13,6
- ✅ **Licenciatura en Higiene, Seguridad y Medio ambiente del Trabajo** — _Grado_ · 28 impresiones, pos. 9,3

### Día 2 — 3 de 10

- [ ] **Licenciatura en Gestión Turística** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-gestion-turistica
- [ ] **Licenciatura en Administración Hotelera** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-administracion-hotelera
- ✅ **Licenciatura en Gestión de Recursos Humanos** — _Grado_ · 1 impresión, pos. 10,0
- [ ] **Licenciatura en Gestión Deportiva** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-gestion-deportiva
- [ ] **Licenciatura en Ciencia Política y Gobierno** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-ciencia-politica-y-gobierno
- ✅ **Licenciatura en Relaciones Internacionales** — _Grado_ · 1 impresión, pos. 7,0
- ✅ **Licenciatura en Periodismo** — _Grado_ · 2 impresiones, pos. 7,5
- [ ] **Licenciatura en Relaciones Públicas e Institucionales** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-relaciones-publicas-e-institucionales
- [ ] **Licenciatura en Diseño y Animación Digital** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-diseno-y-animacion-digital
- [ ] **Licenciatura en Terapia Ocupacional y Desarrollo Humano** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-terapia-ocupacional-y-desarrollo-humano

### Día 3 — 0 de 10

- [ ] **Licenciatura en Educación y Nuevas Tecnologías** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-educacion-y-nuevas-tecnologias
- [ ] **Licenciatura en Nutrición** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-nutricion
- [ ] **Licenciatura en Sociología** — _Grado_
      https://www.siglo21sur.com/carreras/licenciatura-en-sociologia
- [ ] **Martillero, Corredor Público y Corredor Inmobiliario** — _Pregrado_
      https://www.siglo21sur.com/carreras/martillero-corredor-publico-y-corredor-inmobiliario
- [ ] **Procurador** — _Pregrado_
      https://www.siglo21sur.com/carreras/procurador
- [ ] **Tecnicatura en Administración y Gestión Tributaria** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-administracion-y-gestion-tributaria
- [ ] **Tecnicatura en Gestión de Empresas Familiares** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-gestion-de-empresas-familiares
- [ ] **Tecnicatura en Administración y Gestión de Políticas Públicas** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-administracion-y-gestion-de-politicas-publicas
- [ ] **Tecnicatura en Responsabilidad y Gestión Social** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-responsabilidad-y-gestion-social
- [ ] **Tecnicatura en Diseño y Animación Digital** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-diseno-y-animacion-digital

### Día 4 — 0 de 10

- [ ] **Tecnicatura en Marketing y Publicidad Digital** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-marketing-y-publicidad-digital
- [ ] **Tecnicatura en Recursos Turísticos** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-recursos-turisticos
- [ ] **Tecnicatura en Hidrocarburos y Geociencias** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-hidrocarburos-y-geociencias
- [ ] **Tecnicatura en Gestión y Auditorías Ambientales** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-gestion-y-auditorias-ambientales
- [ ] **Tecnicatura en Dirección de Equipos de venta** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-direccion-de-equipos-de-venta
- [ ] **Tecnicatura en Gestión Contable e impositiva** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-gestion-contable-e-impositiva
- [ ] **Tecnicatura en Relaciones Laborales** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-relaciones-laborales
- [ ] **Tecnicatura en Dirección de Protocolo, Organización de Eventos y RRPP** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-direccion-de-protocolo-organizacion-de-eventos-y-rrpp
- [ ] **Tecnicatura en Gestión de Moda** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-gestion-de-moda
- [ ] **Tecnicatura en Gestión Administrativa de Servicios de Salud** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-gestion-administrativa-de-servicios-de-salud

### Día 5 — 0 de 10

- [ ] **Tecnicatura en Diseño y Desarrollo de Videojuegos** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos
- [ ] **Tecnicatura en Estadística Aplicada y Análisis Avanzado** — _Pregrado_
      https://www.siglo21sur.com/carreras/tecnicatura-en-estadistica-aplicada-y-analisis-avanzado
- [ ] **Licenciatura en Desarrollo De Negocios Inmobiliarios (CCC)** — _Grado CCC_
      https://www.siglo21sur.com/carreras/licenciatura-en-desarrollo-de-negocios-inmobiliarios-ccc
- [ ] **Licenciatura en Gerontología (CCC)** — _Grado CCC_
      https://www.siglo21sur.com/carreras/licenciatura-en-gerontologia-ccc
- [ ] **Licenciatura en Emprendimiento (CCC)** — _Grado CCC_
      https://www.siglo21sur.com/carreras/licenciatura-en-emprendimiento-ccc
- [ ] **Licenciatura en Educación (CCC)** — _Grado CCC_
      https://www.siglo21sur.com/carreras/licenciatura-en-educacion-ccc
- [ ] **Licenciatura en Psicopedagogía (CCC)** — _Grado CCC_
      https://www.siglo21sur.com/carreras/licenciatura-en-psicopedagogia-ccc
- [ ] **Profesorado Universitario para Nivel Secundario y Superior (CCC)** — _Grado CCC_
      https://www.siglo21sur.com/carreras/profesorado-universitario-para-nivel-secundario-y-superior-ccc
- [ ] **Tecnicatura Superior en Programación** — _Teclab Tecnología_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-programacion
- [ ] **Tecnicatura Superior en Data Science** — _Teclab Tecnología_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-data-science

### Día 6 — 2 de 10

- [ ] **Tecnicatura Superior en Quality Assurance** — _Teclab Tecnología_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-quality-assurance
- [ ] **Tecnicatura Superior en Redes Informáticas** — _Teclab Tecnología_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-redes-informaticas
- [ ] **Tecnicatura Superior en Seguridad Informática** — _Teclab Tecnología_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-seguridad-informatica
- ✅ **Tecnicatura Superior en Cloud Administration** — _Teclab Tecnología_ · 6 impresiones, pos. 9,8
- ✅ **Tecnicatura Superior en Marketing Digital** — _Teclab Gestión_ · 33 impresiones, pos. 11,2 · rastreada el 25/07
- [ ] **Tecnicatura Superior en Customer Experience** — _Teclab Gestión_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-customer-experience
- [ ] **Tecnicatura Superior en Venta Directa** — _Teclab Gestión_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-venta-directa
- [ ] **Tecnicatura Superior en Gestión Contable** — _Teclab Gestión_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-gestion-contable
- [ ] **Tecnicatura Superior en Seguros** — _Teclab Gestión_ · pasó de desconocida a descubierta
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-seguros
- [ ] **Tecnicatura Superior en Gestión Agraria** — _Teclab Gestión_ · pasó de desconocida a descubierta
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-gestion-agraria

### Día 7 — 0 de 10

- [ ] **Tecnicatura Superior en Relaciones Laborales** — _Teclab Gestión_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-relaciones-laborales
- [ ] **Tecnicatura Superior en Gestión Hotelera** — _Teclab Gestión_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-gestion-hotelera
- [ ] **Tecnicatura Superior en Planificación y Organización de Eventos** — _Teclab Gestión_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-planificacion-y-organizacion-de-eventos
- [ ] **Tecnicatura Superior en Periodismo y Nuevas Tecnologías** — _Teclab Gestión_
      https://www.siglo21sur.com/carreras/tecnicatura-superior-en-periodismo-y-nuevas-tecnologias
- [ ] **Diplomatura en Oratoria** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/diplomatura-en-oratoria
- [ ] **Diplomatura en Gestión de Equipos de Alto Desempeño** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/diplomatura-en-gestion-de-equipos-de-alto-desempeno
- [ ] **Curso de Mindfulness y Técnicas de Gestión del Estrés** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/curso-de-mindfulness-y-tecnicas-de-gestion-del-estres
- [ ] **Diplomatura Integral en RRHH** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/diplomatura-integral-en-rrhh
- [ ] **Diplomatura en Fraude Financiero y Digital** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/diplomatura-en-fraude-financiero-y-digital
- [ ] **Diplomatura en Inteligencia Artificial** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/diplomatura-en-inteligencia-artificial

### Día 8 — 0 de 3

- [ ] **Curso de Constitución de Sociedades S.A, S.A.S, S.R.L** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/curso-de-constitucion-de-sociedades-sa-sas-srl
- [ ] **Diplomatura en Marketing para Emprendedores y Dueños de Negocios** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/diplomatura-en-marketing-para-emprendedores-y-duenos-de-negocios
- [ ] **Diplomatura en Management Hotelero** — _Identidad Argentina_
      https://www.siglo21sur.com/carreras/diplomatura-en-management-hotelero

## Resumen de pendientes por grupo

| Grupo | Pendientes | Indexadas desde el 24/07 |
|---|--:|--:|
| Siglo 21 — Grado (Licenciaturas) | 10 de 23 | 13 |
| Siglo 21 — Pregrado (Tecnicaturas) | 19 de 19 | 0 |
| Siglo 21 — Grado CCC | 6 de 6 | 0 |
| Teclab — Tecnología | 5 de 6 | 1 |
| Teclab — Gestión | 9 de 10 | 1 |
| Identidad Argentina | 9 de 9 | 0 |
| **Total** | **58 de 73** | **15** |

**Todo lo que se indexó solo es de Grado.** Pregrado, CCC e Identidad Argentina siguen
enteros afuera: 34 carreras que Google no está alcanzando por su cuenta. Ahí es donde
pedir a mano rinde de verdad.

---

# 3 · El cuello de botella ya no es la indexación

> **Estado al 29/07/2026: atacado, sin medir todavía.** El 27/07 (`36e53d6`) se sacó
> la marca duplicada del `<title>`, y el 29/07 se reescribieron título y description
> de las 96 fichas — detalle abajo, en *Qué se hizo*. La próxima medición dirá si
> movió el CTR; hasta entonces esto es una hipótesis desplegada, no un resultado.

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

Mediados de agosto de 2026. Se compara contra la línea de base del 24/07 (23 de 96) y
contra el estado del 27/07 (38 de 96).

**Qué mirar además de la indexación:** el CTR de las páginas de la sección 3, que son
las que tenían impresiones y cero clics. Son el único modo de saber si la reescritura
de títulos y descripciones del 29/07 sirvió de algo. Línea de base para comparar, del
30/06 al 28/07 y **por dimensión `page`**:

| Página | Impresiones | Clics | Posición |
|---|--:|--:|--:|
| Higiene, Seguridad y Medio Ambiente | 72 | 0 | 8,5 |
| Licenciatura en Finanzas | 61 | 0 | 7,4 |
| Administración Agraria | 56 | 0 | 9,6 |
| Investigación de la Escena del Crimen | 54 | 0 | 8,2 |
| Actuario | 53 | 0 | 8,0 |
| Logística Global | 49 | 0 | 7,6 |
| Seguridad Informática | 48 | 0 | 9,5 |
| Martillero y Corredor | 43 | 0 | 5,7 |
| Comercio Internacional | 42 | 0 | 8,1 |
| Bioinformática | 34 | 0 | 7,3 |
| — referencia — | | | |
| Agroinformática | 111 | 11 | 6,1 |
| Marketing Digital (Teclab) | 97 | 2 | 8,2 |

Agroinformática es la referencia de arriba: **9,9% de CTR en posición 6,1**. Si las
otras se le acercaran aunque sea a la mitad, el sitio pasaría de 38 clics por mes a
tres dígitos sin ganar una sola posición.
