# Indexación — siglo21sur.com

**Medición: 05/08/2026.** Propiedad `sc-domain:siglo21sur.com` (consulta API GSC en tiempo real). Sitemap: 115 URLs, 92 carreras.

**82 de 92 carreras indexadas (89%).** Antes: 82 el 04/08, 75 el 03/08, 76 el 01/08, 56 el 29/07, 23 el 24/07.

Las 10 que faltan tienen `last_crawled: Never` y ninguna está descartada por contenido. Medición API del 05/08: Google descubrió automáticamente `Lic. en Psicopedagogía (CCC)` y `Tec. en Hidrocarburos y Geociencias` (pasaron de `URL is unknown` a `Discovered`). Solo `Lic. en Emprendimiento (CCC)` osciló temporalmente a desconocida.


---

# 1 · Qué pedir en Search Console

Pegar la URL en la barra de inspección → **"Solicitar indexación"**. Tope ~10-12 por día.

Son **16 URLs**: entran en dos días. El § 1.3 va después del deploy, así que sirve como corte —
día 1 los § 1.1 y § 1.2 (12 URLs), día 2 las cuatro de clases de apoyo.

## 1.1 · Las que no se indexaron

Primero la que en la medición en vivo del 05/08 figura como **desconocida** (`URL is unknown to Google`):

```
https://www.siglo21sur.com/carreras/licenciatura-en-emprendimiento-ccc
```

*(Nota: Psicopedagogía e Hidrocarburos pasaron a `Discovered` el 05/08; Emprendimiento osciló a desconocida).*

Después las 9 que están en `Discovered` —Google las conoce y no pasó— más el artículo de novedades. Ninguna se rastreó nunca, y ninguna está descartada por contenido.

```
https://www.siglo21sur.com/carreras/licenciatura-en-psicopedagogia-ccc
https://www.siglo21sur.com/carreras/tecnicatura-en-hidrocarburos-y-geociencias
https://www.siglo21sur.com/carreras/licenciatura-en-gerontologia-ccc
https://www.siglo21sur.com/carreras/licenciatura-en-educacion-ccc
https://www.siglo21sur.com/carreras/profesorado-universitario-para-nivel-secundario-y-superior-ccc
https://www.siglo21sur.com/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos
https://www.siglo21sur.com/carreras/tecnicatura-superior-en-customer-experience
https://www.siglo21sur.com/carreras/diplomatura-en-oratoria
https://www.siglo21sur.com/carreras/curso-de-mindfulness-y-tecnicas-de-gestion-del-estres
https://www.siglo21sur.com/novedades/articulo/carreras-de-grado-a-distancia
```

**No pedir `/novedades/2`**: `Crawled - currently not indexed` desde el 05/04, y está bien. Es
paginación y compite con sus propios artículos.

## 1.2 · Recrawl

```
https://www.siglo21sur.com/clases-apoyo
```

Está indexada con último rastreo del **11/06**: Google sirve un snippet con un calendario vencido
de hace dos meses. Es el peor recrawl pendiente del sitio.

**Los recrawls hay que pedirlos.** Medido el 04/08 sobre 15 URLs indexadas: ninguna cambió de
fecha de rastreo desde la medición anterior. Google descubre rápido —7 URLs nuevas indexadas el
04/08 sin pedir nada— pero no vuelve solo a lo que ya tiene.

Aun así, **los recrawls por título nuevo no valen la cuota**: los títulos se reescribieron el
29/07 y refrescar un snippet rinde menos que indexar lo que no está. Si sobra cuota después de
todo lo demás, las candidatas son las de rastreo más viejo — Lic. en Informática (04/06),
Lic. en Administración (26/06), Actuario (27/06) y Abogacía (01/07).

## 1.3 · Clases de apoyo

Las cuatro materias con contenido propio. El SQL ya corrió; **falta deployar**. No pedirlas antes
del deploy: hasta que salga, las seis URLs sirven el mismo HTML (99,5% idéntico entre sí) y Google
las vuelve a descartar como duplicadas — que es lo que venía pasando: indexó `matematica` y
`computacion`, dejó `lengua`, `arte` y `secundario` en `Discovered` y nunca descubrió `ingles`.

```
https://www.siglo21sur.com/clases-apoyo/lengua
https://www.siglo21sur.com/clases-apoyo/arte
https://www.siglo21sur.com/clases-apoyo/matematica
https://www.siglo21sur.com/clases-apoyo/computacion
```

Matemática y Computación ya están indexadas: se piden igual, como recrawl, para que Google levante
el título y el texto nuevos.

`ingles` y `secundario` quedan **fuera a propósito** mientras estén `en_construccion`: salen del
sitemap y van con `noindex`. Cuando se les cargue contenido vuelven solas al sitemap y ahí sí se
piden.

---

# 2 · Cómo volver a medir

1. Sacar las URLs de `/carreras/` de `https://www.siglo21sur.com/sitemap.xml`. **No reusar la
   lista de acá** — el catálogo cambia.
2. `batch_url_inspection` de a **10 URLs** (con más falla). Toma ~10 min: mejor en segundo plano.
3. Contar `coverage_state: "Submitted and indexed"`. `Discovered - currently not indexed` (está
   en la cola) es distinto de `URL is unknown to Google` (ni la descubrió). Ese campo oscila
   entre mediciones; no leerlo como regresión.

El informe "Indexación → Páginas" del panel atrasa días y muestra menos: la verdad es la
inspección de URL.

---

# 3 · La lista, carrera por carrera

Las 92 del sitemap del 04/08. **82 ✅ / 10 ❌.** La fecha es el último rastreo; ❌ = todas con
`last_crawled: Never`, *(desconocida)* = `URL is unknown to Google`.

## Siglo 21 — Grado (32 / 32)

- ✅ Abogacía (01/07)
- ✅ Actuario (27/06)
- ✅ Contador Público (19/07)
- ✅ Escribanía (21/07)
- ✅ Lic. en Administración (26/06)
- ✅ Lic. en Administración Agraria (21/07)
- ✅ Lic. en Administración Pública (06/07)
- ✅ Lic. en Bioinformática (19/07)
- ✅ Lic. en Ciencia Política y Gobierno (27/07)
- ✅ Lic. en Ciencias de Datos (25/07)
- ✅ Lic. en Comercialización (25/07)
- ✅ Lic. en Comercio Internacional (25/07)
- ✅ Lic. en Criminología y Seguridad (19/07)
- ✅ Lic. en Diseño y Animación Digital (27/07)
- ✅ Lic. en Educación y Nuevas Tecnologías (28/07)
- ✅ Lic. en Finanzas (31/07)
- ✅ Lic. en Gestión Ambiental (25/07)
- ✅ Lic. en Gestión de Recursos Humanos (27/07)
- ✅ Lic. en Gestión Deportiva (27/07)
- ✅ Lic. en Gestión Turística (27/07)
- ✅ Lic. en Higiene, Seguridad y Medio Ambiente del Trabajo (25/07)
- ✅ Lic. en Informática (04/06)
- ✅ Lic. en Inteligencia Artificial y Robótica (25/07)
- ✅ Lic. en Logística Global (25/07)
- ✅ Lic. en Matemática (25/07)
- ✅ Lic. en Negocios Digitales (18/07)
- ✅ Lic. en Periodismo (27/07)
- ✅ Lic. en Publicidad (19/07)
- ✅ Lic. en Relaciones Internacionales (27/07)
- ✅ Lic. en Relaciones Públicas e Institucionales (27/07)
- ✅ Lic. en Seguridad Informática (25/07)
- ✅ Lic. en Terapia Ocupacional y Desarrollo Humano (27/07)

## Siglo 21 — Pregrado (22 / 24)

- ✅ Martillero, Corredor Público y Corredor Inmobiliario (28/07)
- ✅ Procurador (28/07)
- ✅ Tec. en Administración y Gestión de Políticas Públicas (28/07)
- ✅ Tec. en Administración y Gestión Tributaria (28/07)
- ✅ Tec. en Dirección de Equipos de Venta (29/07)
- ✅ Tec. en Dirección de Protocolo, Organización de Eventos y RRPP (29/07)
- ✅ Tec. en Diseño y Animación Digital (28/07)
- ✅ Tec. en Estadística Aplicada y Análisis Avanzado (29/07)
- ✅ Tec. en Gestión Administrativa de Servicios de Salud (29/07)
- ✅ Tec. en Gestión Contable e Impositiva (29/07)
- ✅ Tec. en Gestión de Empresas Familiares (28/07)
- ✅ Tec. en Gestión de Moda (29/07)
- ✅ Tec. en Gestión del Clima Laboral de la Organización (18/07)
- ✅ Tec. en Gestión y Auditorías Ambientales (29/07)
- ✅ Tec. en Higiene y Seguridad Laboral (19/07)
- ✅ Tec. en Investigación de la Escena del Crimen (19/07)
- ✅ Tec. en Marketing y Publicidad Digital (28/07)
- ✅ Tec. en Negocios Agroecológicos (19/07)
- ✅ Tec. en Promoción Comunitaria en Niñez y Adolescencia (19/07)
- ✅ Tec. en Recursos Turísticos (29/07)
- ✅ Tec. en Redes Informáticas y Telecomunicaciones (19/07)
- ✅ Tec. en Relaciones Laborales (29/07)
- ❌ Tec. en Diseño y Desarrollo de Videojuegos
- ❌ Tec. en Hidrocarburos y Geociencias

## Siglo 21 — Grado CCC (2 / 7)

- ✅ Lic. en Administración de Servicios de Salud (CCC) (07/07)
- ✅ Lic. en Desarrollo de Negocios Inmobiliarios (CCC) (04/08)
- ❌ Lic. en Educación (CCC)
- ❌ Lic. en Emprendimiento (CCC) — *(desconocida)*
- ❌ Lic. en Gerontología (CCC)
- ❌ Lic. en Psicopedagogía (CCC)
- ❌ Profesorado Universitario para Nivel Secundario y Superior (CCC)

## Identidad Argentina (9 / 11)

- ✅ Curso de Constitución de Sociedades (SA, SAS, SRL) (04/08)
- ✅ Diplomatura en Bienestar Integral (19/07)
- ✅ Diplomatura en Compliance (19/07)
- ✅ Diplomatura en Fraude Financiero y Digital (04/08)
- ✅ Diplomatura en Gestión de Equipos de Alto Desempeño (04/08)
- ✅ Diplomatura en Inteligencia Artificial (04/08)
- ✅ Diplomatura en Management Hotelero (04/08)
- ✅ Diplomatura en Marketing para Emprendedores y Dueños de Negocios (04/08)
- ✅ Diplomatura Integral en RRHH (03/08)
- ❌ Curso de Mindfulness y Técnicas de Gestión del Estrés
- ❌ Diplomatura en Oratoria

## Teclab — Tecnología (7 / 7)

- ✅ Curso de Actualización Profesional en Inteligencia Artificial (03/08)
- ✅ Tec. Sup. en Cloud Administration (25/07)
- ✅ Tec. Sup. en Data Science (01/08)
- ✅ Tec. Sup. en Programación (01/08)
- ✅ Tec. Sup. en Quality Assurance (01/08)
- ✅ Tec. Sup. en Redes Informáticas (01/08)
- ✅ Tec. Sup. en Seguridad Informática (31/07)

## Teclab — Gestión (10 / 11)

- ✅ Tec. Sup. en Gestión Agraria (31/07)
- ✅ Tec. Sup. en Gestión Contable (31/07)
- ✅ Tec. Sup. en Gestión Hotelera (31/07)
- ✅ Tec. Sup. en Inbound Marketing (23/07)
- ✅ Tec. Sup. en Marketing Digital (25/07)
- ✅ Tec. Sup. en Periodismo y Nuevas Tecnologías (01/08)
- ✅ Tec. Sup. en Planificación y Organización de Eventos (31/07)
- ✅ Tec. Sup. en Relaciones Laborales (31/07)
- ✅ Tec. Sup. en Seguros (31/07)
- ✅ Tec. Sup. en Venta Directa (31/07)
- ❌ Tec. Sup. en Customer Experience

## Fuera de `/carreras/` (23 URLs)

Adentro: home, `/faq`, `/contacto`, `/sobre-nosotros`, `/clases-apoyo` y 10 de las 12 de
novedades. Faltan el artículo `carreras-de-grado-a-distancia` y `/novedades/2`, que no se pide.

Clases de apoyo, **2 de 6**: ✅ `matematica` (18/07) y `computacion` (18/07); ❌ `lengua`, `arte`
y `secundario` en `Discovered`, `ingles` en *(desconocida)*. Eran seis copias de la misma página;
la reforma del 04/08 les dio contenido propio. Ver el § 1.
