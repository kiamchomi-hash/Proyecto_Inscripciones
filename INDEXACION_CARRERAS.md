# Estado de indexación — Carreras

**Fecha del relevamiento:** 2026-07-24
**Sitio:** https://www.siglo21sur.com
**Carreras de la oferta vigente:** 96 — Grado, Pregrado, Grado CCC, Teclab e Identidad
Argentina. Posgrado, APLV/Extragrado, Certificaciones y Cursos quedaron fuera del sitio el
27/07/2026: sus filas siguen en Supabase pero no tienen catálogo, sitemap ni página.

---

## Cómo leer este informe

> **Aclaración:** este relevamiento **no consulta el índice de Google**. El estado real
> (Indexada / Descubierta / Rastreada sin indexar / Duplicada) solo lo da
> **Google Search Console → Cobertura → Inspección de URL**.
>
> Lo que se midió acá es la **indexabilidad**: si la página existe, si Google puede
> encontrarla y si tiene motivos para indexarla. Es lo que determina el resultado
> en Search Console.

Cada carrera se verificó contra producción con estos chequeos:

| Chequeo | Qué valida |
|---|---|
| HTTP 200 | La URL responde y no redirige ni tira 404 |
| En `sitemap.xml` | Google la recibe declarada |
| `canonical` correcto | Apunta a sí misma, no al home |
| JSON-LD `Course` | Datos estructurados de curso presentes |
| `<title>` propio | Incluye el nombre completo con su prefijo |
| Visible en el catálogo | Un usuario puede llegar navegando |

**Leyenda:**

- ✅ **Indexable** — pasa todos los chequeos.
- ⚠️ **Indexable con reservas** — la página está bien, pero el `<title>` omite el prefijo
  (`Licenciatura en` / `Tecnicatura en`), que es justo el término que se busca.
- ❌ **No indexable en la práctica** — la URL existe y está en el sitemap, pero no aparece
  en el catálogo: no hay forma de llegar ni navegando ni por enlace. Google la ve como
  una URL suelta sin contexto.

---

## Resumen

| Estado | Carreras | % |
|---|---:|---:|
| ✅ Indexable | 35 | 36% |
| ⚠️ Indexable con reservas | 61 | 64% |
| **Total** | **96** | **100%** |

### Estado global del sitio

| Chequeo | Resultado |
|---|---|
| URLs que responden 200 | ✅ 96 / 96 |
| Declaradas en `sitemap.xml` | ✅ 96 / 96 |
| `canonical` correcto | ✅ 96 / 96 |
| JSON-LD `Course` | ✅ 96 / 96 |
| Sin `noindex` | ✅ 96 / 96 |
| `<title>` con nombre completo | ⚠️ 49 (medido sobre las 115 de entonces) |
| Visibles en el catálogo | ✅ 96 / 96 |
| **Enlaces internos rastreables** | ❌ **0 / 96** |
| **HTML propio (distinto del home)** | ❌ **0 / 96** |

---

## Los dos bloqueos que afectan a las 96

### 1. Todas las páginas de carrera son huérfanas

Buscando `href="/carreras/..."` en el HTML servido del home aparecen **0 enlaces**.
Las tarjetas del catálogo son `<button>` que abren un modal y cambian la URL con
`window.history.pushState` (`components/index/careers-catalog.tsx:303`).

Googlebot no hace clic: **no existe un solo enlace rastreable hacia ninguna carrera**.
Solo llegan por el sitemap. Una URL que únicamente está en el sitemap y no recibe
ningún enlace interno es la primera candidata a quedar en *"Descubierta – actualmente
sin indexar"*.

### 2. Todas las páginas son casi idénticas al home

| Página | Tamaño del HTML |
|---|---:|
| Home | 628.435 bytes |
| Carreras (mínimo) | 624.706 bytes |
| Carreras (máximo) | 626.689 bytes |

Es aproximadamente el **99,5% del mismo HTML**. `app/carreras/[slug]/page.tsx` renderiza
Hero + catálogo completo + formulario, exactamente igual que el home. Lo único que
cambia es `<title>`, `<meta description>`, el `canonical` y el JSON-LD.

El contenido real de la carrera (plan de estudios, enfoque, duración) vive **dentro del
modal, que es client-side y no está en el HTML servido**. Para Google son 96
duplicados del home, y va a elegir el home como canónica.

---

## Siglo 21 — Grado (Licenciaturas y títulos de grado)

**36 carreras** — ✅ 4 · ⚠️ 32

| | Carrera | Observación |
|:--:|---|---|
| ✅ | Abogacía | — |
| ✅ | Escribanía | — |
| ✅ | Contador Público | — |
| ⚠️ | Licenciatura en Administración | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Finanzas | `<title>` sin el prefijo del tipo de carrera |
| ✅ | Actuario | — |
| ⚠️ | Licenciatura en Comercio Internacional | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Comercialización | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Negocios Digitales | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Inteligencia Artificial y Robótica | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Ciencias de Datos | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Seguridad Informática | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Informática | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Matemática | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Bioinformática | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Logística Global | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Gestión Ambiental | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Higiene, Seguridad y Medio ambiente del Trabajo | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Gestión Turística | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Administración Hotelera | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Gestión de Recursos Humanos | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Gestión Deportiva | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Administración Agraria | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Ciencia Política y Gobierno | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Administración Pública | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Relaciones Internacionales | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Criminología y Seguridad | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Periodismo | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Publicidad | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Relaciones Públicas e Institucionales | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Diseño y Animación Digital | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Terapia Ocupacional y Desarrollo Humano | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Educación y Nuevas Tecnologías | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Nutrición | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Agroinformática | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Sociología | `<title>` sin el prefijo del tipo de carrera |

## Siglo 21 — Grado CCC (Ciclos de Complementación Curricular)

**7 carreras** — ✅ 1 · ⚠️ 6

| | Carrera | Observación |
|:--:|---|---|
| ⚠️ | Licenciatura en Desarrollo De Negocios Inmobiliarios (CCC) | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Gerontología (CCC) | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Emprendimiento (CCC) | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Administración de Servicios de Salud (CCC) | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Educación (CCC) | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Licenciatura en Psicopedagogía (CCC) | `<title>` sin el prefijo del tipo de carrera |
| ✅ | Profesorado Universitario para Nivel Secundario y Superior (CCC) | — |

## Siglo 21 — Pregrado (Tecnicaturas)

**25 carreras** — ✅ 2 · ⚠️ 23

| | Carrera | Observación |
|:--:|---|---|
| ✅ | Martillero, Corredor Público y Corredor Inmobiliario | — |
| ✅ | Procurador | — |
| ⚠️ | Tecnicatura en Investigación de la escena del crimen | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Administración y Gestión Tributaria | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Gestión de Empresas Familiares | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Administración y Gestión de Políticas Públicas | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Responsabilidad y Gestión Social | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Higiene y Seguridad Laboral | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Diseño y Animación Digital | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Marketing y Publicidad Digital | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Recursos Turísticos | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Hidrocarburos y Geociencias | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Gestión y Auditorías Ambientales | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Dirección de Equipos de venta | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Gestión Contable e impositiva | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Relaciones Laborales | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Dirección de Protocolo, Organización de Eventos y RRPP | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Gestión de Moda | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Gestión del Clima Laboral de la Organización | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Promoción Comunitaria en Niñez y Adolescencia | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Gestión Administrativa de Servicios de Salud | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Redes Informáticas y Telecomunicaciones | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Diseño y Desarrollo de Videojuegos | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Negocios Agroecológicos | `<title>` sin el prefijo del tipo de carrera |
| ⚠️ | Tecnicatura en Estadística Aplicada y Análisis Avanzado | `<title>` sin el prefijo del tipo de carrera |

## Teclab — Tecnología

**6 carreras** — ✅ 6

| | Carrera | Observación |
|:--:|---|---|
| ✅ | Tecnicatura Superior en Programación | — |
| ✅ | Tecnicatura Superior en Data Science | — |
| ✅ | Tecnicatura Superior en Quality Assurance | — |
| ✅ | Tecnicatura Superior en Redes Informáticas | — |
| ✅ | Tecnicatura Superior en Seguridad Informática | — |
| ✅ | Tecnicatura Superior en Cloud Administration | — |

## Teclab — Gestión

**11 carreras** — ✅ 11

| | Carrera | Observación |
|:--:|---|---|
| ✅ | Tecnicatura Superior en Marketing Digital | — |
| ✅ | Tecnicatura Superior en Inbound Marketing | — |
| ✅ | Tecnicatura Superior en Customer Experience | — |
| ✅ | Tecnicatura Superior en Venta Directa | — |
| ✅ | Tecnicatura Superior en Gestión Contable | — |
| ✅ | Tecnicatura Superior en Seguros | — |
| ✅ | Tecnicatura Superior en Gestión Agraria | — |
| ✅ | Tecnicatura Superior en Relaciones Laborales | — |
| ✅ | Tecnicatura Superior en Gestión Hotelera | — |
| ✅ | Tecnicatura Superior en Planificación y Organización de Eventos | — |
| ✅ | Tecnicatura Superior en Periodismo y Nuevas Tecnologías | — |

## Identidad Argentina

**11 carreras** — ✅ 11

| | Carrera | Observación |
|:--:|---|---|
| ✅ | Diplomatura en Oratoria | — |
| ✅ | Diplomatura en Gestión de Equipos de Alto Desempeño | — |
| ✅ | Curso de Mindfulness y Técnicas de Gestión del Estrés | — |
| ✅ | Diplomatura en Bienestar Integral: Herramientas para Transformar-te | — |
| ✅ | Diplomatura Integral en RRHH | — |
| ✅ | Diplomatura en Fraude Financiero y Digital | — |
| ✅ | Diplomatura en Inteligencia Artificial | — |
| ✅ | Curso de Constitución de Sociedades S.A, S.A.S, S.R.L | — |
| ✅ | Diplomatura en Marketing para Emprendedores y Dueños de Negocios | — |
| ✅ | Diplomatura en Compliance | — |
| ✅ | Diplomatura en Management Hotelero | — |

---

## Qué hacer, por impacto real sobre la indexación

### 1. Enlaces rastreables — **imprescindible**

Hoy no hay ninguno. Envolver la tarjeta del catálogo en un `<a href="/carreras/{slug}">`.
Se puede seguir interceptando el click con `preventDefault()` para abrir el modal, así que
la experiencia del usuario no cambia. Resuelve el descubrimiento y reparte autoridad
interna hacia cada carrera.

**Efecto sobre la indexación:** alto. Es condición necesaria, pero no suficiente.

### 2. Contenido propio renderizado en servidor — **el que decide**

Mientras `/carreras/X` sea el home con otro `<title>`, Google va a consolidar todo en el
home. Hay que renderizar en servidor el detalle de la carrera (nombre como `<h1>`, enfoque,
duración, plan de estudios) en vez de dejarlo solo dentro del modal client-side.

**Efecto sobre la indexación:** decisivo. Sin esto, los otros dos arreglos no alcanzan:
Google va a rastrear las 96 páginas y va a seguir sin indexar la mayoría porque
las ve como copias del home.

### 3. `<title>` con el nombre completo — **mejora el ranking, no la indexación**

`app/carreras/[slug]/page.tsx:40` usa `carrera.nombre` sin el prefijo. Cambiándolo a
`carreraFullName(carrera)` se corrigen 66 títulos de una sola vez:
"Administración" pasa a ser "Licenciatura en Administración", que es el término real de búsqueda.

**Efecto sobre la indexación:** bajo. Un `<title>` no hace que una página se indexe; sirve
para posicionar y para el CTR una vez que ya está indexada. Es barato de hacer igual.

### 4. Niveles fuera de la oferta — **resuelto**

Posgrado, APLV/Extragrado, Certificaciones y Cursos quedaron fuera del sitio.
`esCarreraVisible()` (`components/index/types.ts:111`) los filtra en el catálogo, en las
opciones del formulario, en `sitemap.ts` y en `generateStaticParams()`; sus URLs devuelven
404. No suman URLs sin indexar al dominio.

---

## Cómo verificar el estado real en Google

1. Entrar a [Google Search Console](https://search.google.com/search-console) con la propiedad `siglo21sur.com`.
2. **Cobertura / Páginas** → ver el desglose de "No indexadas" y su motivo.
3. Los motivos esperables hoy, según este relevamiento:
   - *Descubierta – actualmente sin indexar* → por el bloqueo 1 (sin enlaces internos).
   - *Rastreada – actualmente sin indexar* → por el bloqueo 2 (contenido duplicado).
   - *Página alternativa con etiqueta canónica adecuada* → por el bloqueo 2.
4. Después de aplicar los arreglos, usar **Inspección de URL → Solicitar indexación** en
   algunas carreras testigo y esperar entre 1 y 4 semanas para ver el movimiento.
