---
name: seo-audit
version: 2.0.0
description: Auditar, revisar o diagnosticar el SEO de un sitio, y decidir qué tocar para ganar tráfico. Usar cuando se pida una auditoría SEO, se pregunte "por qué no rankeamos", se revisen títulos y descripciones, se interprete un informe de Search Console, o se busquen consultas nuevas para atacar. Cubre también autoridad y enlaces, enlazado interno y mantenimiento. En inglés: "SEO audit", "technical SEO", "on-page SEO", "why am I not ranking", "keyword research", "link building". Para generar páginas a escala, ver programmatic-seo. Para datos estructurados, ver schema-markup.
---

# Auditoría SEO

## Antes que nada: separar la intención

**Esto va primero porque, si se saltea, todo lo que sigue mide mal.**

Las impresiones de un sitio no son una bolsa homogénea. Las consultas que
incluyen el nombre de una marca ajena son navegacionales: la persona quiere el
sitio oficial de esa marca, lo ve arriba y saltea el resto. Aunque el sitio
propio esté quinto, el CTR de ese grupo va a ser una fracción del que predice
cualquier curva.

Consecuencia práctica: **un informe que ordena las páginas por "CTR bajo para su
posición" sin separar marca de genérica se llena de páginas cuyo techo es de
intención y no de título**, y esconde las pocas que sí tienen margen. Antes de
proponer reescribir un solo metadato, partir los datos en dos y medir cada grupo
por separado.

Medido en este proyecto (agosto 2026): la marca se llevaba el 78% de las
impresiones nombradas y clickeaba al 1,0%, contra 1,8% de las genéricas con una
posición promedio mucho peor. Las consultas genéricas dentro del top 10 clickean
entre 8% y 27%. Ahí está el crecimiento, no en la marca.

El método para calibrar la curva con los datos propios está en
[Investigación de consultas](references/investigacion-de-consultas.md).

## Orden de prioridad

1. **Rastreo e indexación** — ¿Google puede encontrarla e indexarla?
2. **Base técnica** — ¿carga rápido y funciona?
3. **On-page** — ¿el contenido está trabajado?
4. **Calidad del contenido** — ¿merece rankear?
5. **Autoridad y enlaces** — ¿alguien la respalda?

No saltear el orden: optimizar el título de una página que Google nunca rastreó
no hace nada.

## Contexto antes de auditar

Si existe `.claude/product-marketing-context.md`, leerlo antes de preguntar nada.
Después, saber: qué tipo de sitio es, cuál es el objetivo del SEO, qué páginas y
consultas importan, si hay acceso a Search Console, y si hubo cambios o
migraciones recientes.

## Técnico

### Rastreo

- **robots.txt**: sin bloqueos involuntarios, con referencia al sitemap.
- **Sitemap**: accesible, enviado, sólo URLs canónicas e indexables, y que se
  regenere de verdad cuando cambia el contenido. Un sitemap cacheado que sólo se
  rehace en el deploy deja contenido nuevo invisible durante días.
- **Arquitectura**: las páginas importantes a menos de tres clics de la home,
  sin páginas huérfanas.
- **Presupuesto de rastreo**: URLs con parámetros bajo control, paginación con
  respaldo sin JavaScript.

### Indexación

- Comparar indexadas contra esperadas en Search Console.
- Buscar `noindex` en páginas importantes, canónicas apuntando mal, cadenas de
  redirecciones, 404 blandos y duplicados sin canónica.
- Canónicas autorreferenciales, coherencia entre HTTP/HTTPS, con y sin `www`, y
  barra final.
- **Una URL "descubierta, sin rastrear" durante semanas no siempre es contenido
  pobre.** Antes de reescribirla, contar sus enlaces internos entrantes: si son
  suficientes y está en el sitemap, es prioridad de rastreo del dominio y lo que
  corresponde es pedirla a mano y esperar. Ver
  [Autoridad y enlaces](references/autoridad-y-enlaces.md).
- Ante un cambio de estado raro en la API de inspección, confirmar con una
  segunda consulta antes de anotarlo: rebota.

### Velocidad

LCP menor a 2,5 s · INP menor a 200 ms · CLS menor a 0,1. Mirar tiempo de
respuesta del servidor, imágenes, JavaScript, entrega de CSS, cache, CDN y carga
de fuentes.

### Móvil, seguridad y URLs

Diseño adaptable, áreas táctiles suficientes, viewport declarado, sin scroll
horizontal, mismo contenido que en escritorio. HTTPS en todo el sitio, sin
contenido mixto. URLs legibles, en minúsculas, con guiones y sin parámetros
innecesarios.

## On-page

### Títulos

Únicos, con la consulta principal adelante, y que entren en el resultado. El
corte se mide en píxeles y no en caracteres, así que hay algo de margen sobre los
60, pero **es peor una marca cortada a la mitad que una marca ausente**.

Si el nombre no entra con el sufijo más informativo, probar sufijos más cortos en
orden, y recién al final bajar a un nombre más corto.

### Descripciones

Únicas, alrededor de 160 caracteres. **La frase que distingue a esta página de
las demás va primero**: el buscador corta el final, así que lo que se repite en
todo el sitio es lo que conviene dejar atrás. Si la fórmula es compartida entre
muchas páginas, armarla por partes y soltar las de atrás hasta entrar en el
presupuesto, en vez de truncar a mitad de palabra.

### Encabezados y contenido

Un solo H1, jerarquía sin saltos, encabezados que describan el contenido. La
consulta principal en las primeras líneas. Suficiente profundidad para el tema y
mejor que lo que hoy está primero.

Detectar contenido delgado: páginas que existen pero no dicen nada, y páginas de
categoría o etiqueta sin valor propio.

### Imágenes

Nombres descriptivos, texto alternativo real, comprimidas, formatos modernos,
carga diferida, tamaños adaptables.

### Enlaces internos

Es la palanca de autoridad que se controla del todo y la que más se descuida.
Revisar que las páginas importantes estén bien enlazadas, que el texto del enlace
describa el destino, que no haya páginas huérfanas y que **los bloques de
"relacionados" enlacen a algo que tenga que ver**. Un bloque que elige por
rotación reparte autoridad pero no le dice nada a Google sobre el tema de la
página.

Antes de cambiar el criterio de selección de un bloque así, simular el grafo
resultante y contar enlaces entrantes por página con el algoritmo viejo y con el
nuevo. Detalle en [Autoridad y enlaces](references/autoridad-y-enlaces.md).

### Canibalización

Una consulta principal por página. Dos páginas propias peleando por la misma
consulta se turnan y bajan las dos: la de menos tráfico se redirige con 301 y
sale del sitemap.

## Calidad del contenido

**E-E-A-T**: experiencia de primera mano y datos propios; información precisa y
citada; reconocimiento en el rubro; transparencia, datos de contacto y sitio
seguro.

**Profundidad**: cubrir el tema, responder las preguntas que siguen, estar
actualizado, y ser mejor que quien está primero. Mejor casi nunca significa más
largo.

## Autoridad y enlaces

Es lo que suele explicar por qué un sitio con todo bien hecho sigue en la
posición veinte. No se resuelve con un checklist: ver
[Autoridad y enlaces](references/autoridad-y-enlaces.md).

## Mantenimiento

Qué revisar cuando el sitio ya está publicado, por qué una página que baja casi
nunca empeoró, y por qué conviene medir acciones y no resultados:
[Mantenimiento](references/mantenimiento.md).

## Errores frecuentes por tipo de sitio

- **Producto o software**: fichas sin profundidad, blog desconectado del
  producto, sin páginas de comparación ni alternativas, sin glosario.
- **Comercio electrónico**: categorías delgadas, descripciones duplicadas, sin
  datos estructurados de producto, navegación facetada generando duplicados.
- **Blog o contenido**: contenido viejo sin actualizar, canibalización, sin
  agrupación temática, enlazado interno pobre.
- **Negocio local**: datos de contacto inconsistentes entre sitios, sin datos
  estructurados locales, sin perfil de negocio optimizado, sin contenido local.
- **Institución educativa**: fichas de carrera con la misma plantilla y sin nada
  propio, oferta dada de baja que sigue publicada, y competencia frontal contra
  el sitio oficial de la marca en consultas navegacionales, que no se gana.

## Formato de salida

**Resumen**: estado general, tres a cinco problemas principales, y qué se puede
ganar rápido.

**Cada hallazgo**: qué está mal · impacto (alto/medio/bajo) · cómo se detectó ·
qué hacer · prioridad.

**Plan ordenado**: primero lo que bloquea la indexación, después lo de más
impacto, después lo fácil e inmediato, y al final lo de largo plazo.

Separar siempre lo medido de lo propuesto, y no prometer clics recuperables sin
antes haber descontado la intención de marca.

## Referencias

- [Investigación de consultas](references/investigacion-de-consultas.md):
  intención, calibrar la curva de CTR con datos propios, dónde buscar consultas
  nuevas, igualar y superar, canibalización.
- [Autoridad y enlaces](references/autoridad-y-enlaces.md): cómo se reparte el
  valor de un enlace, enlazado interno, cómo conseguir enlaces externos, qué no
  hacer, y por qué esto decide también qué dice la IA.
- [Mantenimiento](references/mantenimiento.md): intención que cambia, medir
  acciones, errores que hunden un sitio entero.
- [AEO y GEO](references/aeo-geo-patterns.md): patrones de contenido para motores
  de respuesta y para que la IA cite el sitio.
- [Escritura con IA](references/ai-writing-detection.md): patrones a evitar.

## Herramientas

Gratis: Search Console, PageSpeed Insights, Bing Webmaster Tools, prueba de
resultados enriquecidos, validador de datos estructurados.

Pagas, si están disponibles: Screaming Frog, Ahrefs, Semrush, Sitebulb.
