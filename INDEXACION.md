# Indexación — siglo21sur.com

**Medición: 07/08/2026.** Propiedad `sc-domain:siglo21sur.com` (inspección de URL por API, las 113 del sitemap). Sitemap: 113 URLs, 92 carreras.

**88 de 92 carreras indexadas (96%).** Antes: 82 el 05/08, 82 el 04/08, 75 el 03/08, 76 el 01/08, 56 el 29/07, 23 el 24/07.

Entraron seis de un saque, todas rastreadas el 05/08 —el día siguiente al pedido manual—: las cuatro
CCC que faltaban (Educación, Gerontología, Psicopedagogía, Profesorado) más Mindfulness y Oratoria.
Grado CCC pasó de 2/7 a 6/7 e Identidad Argentina cerró 11/11.

Quedan **cuatro**, todas con `last_crawled: Never`: Emprendimiento (CCC), Hidrocarburos, Customer
Experience y Videojuegos. Ninguna está descartada por contenido.

> **Baja del 07/08/2026:** Teclab dejó de ofrecer *Tec. Sup. en Venta Directa*, así que salió del
> catálogo (`activa = false`) y su URL redirige 301 a la home. Estaba indexada. Los números de arriba
> todavía la cuentan porque la medición se hizo antes del deploy; **una vez publicado son 112 URLs,
> 91 carreras y 87 indexadas (96%)** y no hay que pedirla.

**Fuera de `/carreras/`: 20 de 21.** La única afuera es `/novedades/2`, a propósito (ver § 1.1).
El sitemap bajó de 115 a 113 porque `clases-apoyo/ingles` y `/secundario` salieron con el deploy
del 04/08: siguen `en_construccion`, con `noindex`.

---

# 1 · Qué pedir en Search Console

Pegar la URL en la barra de inspección → **"Solicitar indexación"**. Tope ~10-12 por día.

Son **5 URLs**: entran todas en un día.

## 1.1 · Las cuatro carreras que faltan

Primero la que figura como **desconocida** (`URL is unknown to Google`). El 05/08 estaba en
`Discovered` y retrocedió; el campo oscila, no hay que leerlo como un problema nuevo:

```
https://www.siglo21sur.com/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos
```

Después las tres en `Discovered` —Google las conoce y no pasó a rastrearlas—:

```
https://www.siglo21sur.com/carreras/licenciatura-en-emprendimiento-ccc
https://www.siglo21sur.com/carreras/tecnicatura-en-hidrocarburos-y-geociencias
https://www.siglo21sur.com/carreras/tecnicatura-superior-en-customer-experience
```

Emprendimiento venía de `URL is unknown` el 05/08 y ahora está en `Discovered`: avanzó, pero sigue
sin rastrearse. Es la única de las siete CCC que quedó afuera.

**No pedir `/novedades/2`**: `Crawled - currently not indexed` desde el 05/04, y está bien. Es
paginación y compite con sus propios artículos.

## 1.2 · El recrawl que sí vale la pena

```
https://www.siglo21sur.com/clases-apoyo
```

Sigue con último rastreo del **11/06**, igual que en las dos mediciones anteriores: Google sirve un
snippet con un calendario vencido de hace casi dos meses. Es el peor recrawl pendiente del sitio, y
encima es la única de las cinco páginas de clases de apoyo que no se refrescó con el deploy.

**Los recrawls hay que pedirlos, salvo cuando la página cambió de verdad.** El deploy del 04/08 se
llevó rastreos nuevos el 06/08 en `arte`, `lengua`, `matematica`, la home y Abogacía. Lo que no
cambió no se movió: Lic. en Informática sigue en 04/06, Lic. en Administración en 26/06 y Actuario
en 27/06. Si sobra cuota, esas tres son las candidatas — pero rinden menos que cualquier otra cosa.

## 1.3 · Clases de apoyo — resuelto

Las cuatro materias con contenido propio **quedaron indexadas**: `matematica` y `computacion` ya
estaban, y `lengua` y `arte` entraron con el rastreo del 06/08, sin pedirlas. Era exactamente el
diagnóstico: mientras las seis URLs servían el mismo HTML Google las descartaba como duplicadas; con
contenido propio entraron solas.

`ingles` y `secundario` siguen **fuera a propósito** mientras estén `en_construccion`: no están en el
sitemap y van con `noindex`. Cuando se les cargue contenido vuelven solas y ahí sí se piden.

---

# 2 · Cómo volver a medir

1. Sacar las URLs de `https://www.siglo21sur.com/sitemap.xml`. **No reusar la lista de acá** — el
   catálogo cambia.
2. `batch_url_inspection` de a **10 URLs** (con más falla). Se pueden lanzar varios lotes en
   paralelo; cada uno tarda ~2 min.
3. Contar `coverage_state: "Submitted and indexed"`. `Discovered - currently not indexed` (está
   en la cola) es distinto de `URL is unknown to Google` (ni la descubrió). Ese campo oscila
   entre mediciones; no leerlo como regresión.

El informe "Indexación → Páginas" del panel atrasa días y muestra menos: la verdad es la
inspección de URL.

---

# 3 · La lista, carrera por carrera

Las 92 del sitemap del 07/08. **88 ✅ / 4 ❌.** La fecha es el último rastreo; ❌ = todas con
`last_crawled: Never`, *(desconocida)* = `URL is unknown to Google`.

## Siglo 21 — Grado (32 / 32)

- ✅ Abogacía (06/08)
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
- ❌ Tec. en Diseño y Desarrollo de Videojuegos — *(desconocida)*
- ❌ Tec. en Hidrocarburos y Geociencias

## Siglo 21 — Grado CCC (6 / 7)

- ✅ Lic. en Administración de Servicios de Salud (CCC) (07/07)
- ✅ Lic. en Desarrollo de Negocios Inmobiliarios (CCC) (04/08)
- ✅ Lic. en Educación (CCC) (05/08)
- ✅ Lic. en Gerontología (CCC) (05/08)
- ✅ Lic. en Psicopedagogía (CCC) (05/08)
- ✅ Profesorado Universitario para Nivel Secundario y Superior (CCC) (05/08)
- ❌ Lic. en Emprendimiento (CCC)

## Identidad Argentina (11 / 11)

- ✅ Curso de Constitución de Sociedades (SA, SAS, SRL) (04/08)
- ✅ Curso de Mindfulness y Técnicas de Gestión del Estrés (05/08)
- ✅ Diplomatura en Bienestar Integral (19/07)
- ✅ Diplomatura en Compliance (19/07)
- ✅ Diplomatura en Fraude Financiero y Digital (04/08)
- ✅ Diplomatura en Gestión de Equipos de Alto Desempeño (04/08)
- ✅ Diplomatura en Inteligencia Artificial (04/08)
- ✅ Diplomatura en Management Hotelero (04/08)
- ✅ Diplomatura en Marketing para Emprendedores y Dueños de Negocios (04/08)
- ✅ Diplomatura en Oratoria (05/08)
- ✅ Diplomatura Integral en RRHH (03/08)

## Teclab — Tecnología (7 / 7)

- ✅ Curso de Actualización Profesional en Inteligencia Artificial (03/08)
- ✅ Tec. Sup. en Cloud Administration (25/07)
- ✅ Tec. Sup. en Data Science (01/08)
- ✅ Tec. Sup. en Programación (01/08)
- ✅ Tec. Sup. en Quality Assurance (01/08)
- ✅ Tec. Sup. en Redes Informáticas (01/08)
- ✅ Tec. Sup. en Seguridad Informática (31/07)

## Teclab — Gestión (10 / 11 — queda 9 / 10 con la baja)

- ✅ Tec. Sup. en Gestión Agraria (31/07)
- ✅ Tec. Sup. en Gestión Contable (31/07)
- ✅ Tec. Sup. en Gestión Hotelera (31/07)
- ✅ Tec. Sup. en Inbound Marketing (23/07)
- ✅ Tec. Sup. en Marketing Digital (25/07)
- ✅ Tec. Sup. en Periodismo y Nuevas Tecnologías (01/08)
- ✅ Tec. Sup. en Planificación y Organización de Eventos (31/07)
- ✅ Tec. Sup. en Relaciones Laborales (31/07)
- ✅ Tec. Sup. en Seguros (31/07)
- ❌ Tec. Sup. en Customer Experience
- ⛔ Tec. Sup. en Venta Directa — indexada (31/07), dada de baja el 07/08; la URL redirige a la home

## Fuera de `/carreras/` (20 / 21)

- ✅ Home (06/08), `/faq` (19/07), `/contacto` (19/07), `/sobre-nosotros` (21/07)
- ✅ Clases de apoyo, **5 de 5**: `/clases-apoyo` (11/06 — el recrawl del § 1.2), `arte` (06/08),
  `computacion` (18/07), `lengua` (06/08), `matematica` (06/08)
- ✅ Novedades: `/novedades/1` (19/07) y los 10 artículos, incluido `carreras-de-grado-a-distancia`
  (05/08), que era el último que faltaba
- ❌ `/novedades/2` — `Crawled - currently not indexed` desde el 05/04, y está bien así
