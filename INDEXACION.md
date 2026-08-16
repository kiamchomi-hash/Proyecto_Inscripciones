# Indexación — siglo21sur.com

**16/08/2026 · 86 de 88 carreras (98%)** · total 108/111.

Lo que falta no se movió desde el 14/08: las mismas tres URLs afuera y `/sobre-nosotros`
todavía con la copia vieja. La revisión de hoy fue incremental —las tres pendientes, el
recrawl y un par de testigos—, así que las fechas de la lista que no se nombran acá
siguen siendo las del 14/08.

La oferta se achicó: cuatro diplomaturas de Identidad salieron (302 a la home) y el
curso de mindfulness se renombró (301 a la diplomatura homónima, ya indexada). Por eso
la lista de carreras baja de 93 a 88 filas.

Hoy se deployó `b90ab59`, que le cambia el `<title>` a 25 de las 63 fichas de Siglo 21
—las de Teclab y las de convenio llevan otros sufijos y no se tocaron—: donde el nombre
no entra con el sufijo largo, ahora gana " a Distancia | Siglo 21" y se suelta "Villa
Lugano". Mientras Google no las vuelva a rastrear, el título que muestra en el resultado
es el viejo. No hay que pedir recrawl por esto: las 25 ya están indexadas y el barrido
normal las va a levantar. El efecto se mide con `npm run seo` a principios de septiembre,
comparando el CTR de esas 25 contra las 38 que quedaron igual.

## Pedir indexación

```
https://www.siglo21sur.com/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos
https://www.siglo21sur.com/carreras/tecnicatura-superior-en-customer-experience
```

Las dos siguen en "Discovered - currently not indexed" y **nunca fueron rastreadas**.
No es un problema técnico: responden 200, tienen `<title>` propio, están en el sitemap
y reciben enlace interno desde una ficha hermana (Diseño y Animación Digital y
Marketing Digital respectivamente). Google simplemente no llegó.

`/novedades/2` sigue "Crawled, currently not indexed" con copia del 05/04: es paginación
y Google no le ve valor propio. No insistir.

## Recrawl

`/sobre-nosotros` es el único pedido que vale la pena: se reescribió el 11/08 para
competir por "CAU en CABA" y lo que Google tiene indexado es del 21/07, o sea el texto
viejo.

```
https://www.siglo21sur.com/sobre-nosotros
```

Del resto no hace falta pedir nada. Administración era el caso testigo —copia del 26/06,
sin BreadcrumbList— y se rastreó sola el 11/08; Informática (04/06) el 10/08 y
`/clases-apoyo` (11/06) el 09/08. Google está barriendo el sitio de más viejo a más
nuevo y ya se llevó puesta toda la cola de junio.

Quedan 16 páginas cuya copia indexada es anterior al BreadcrumbList (deployado el 24/07);
se reconocen por rastreo ≤23/07 y `rich_results: null` en la inspección. Van a caer solas,
igual que las tres de arriba: no gastar cuota de "Solicitar indexación" en ellas.

La que era la más atrasada, Administración de Servicios de Salud, se rastreó sola el
15/08 y ya emite Breadcrumbs; el fondo de la cola pasa a ser el 18/07, con Negocios
Digitales, Clima Laboral y `/clases-apoyo/computacion` verificadas hoy sin moverse.

## La lista

`○` marca la copia indexada anterior al BreadcrumbList del 24/07.

### Carreras

- ✅ `/carreras/abogacia` 06/08
- ✅ `/carreras/actuario` 09/08
- ✅ ○ `/carreras/contador-publico` 19/07
- ✅ `/carreras/curso-de-actualizacion-profesional-en-inteligencia-artificial` 03/08
- ✅ `/carreras/curso-de-constitucion-de-sociedades-sa-sas-srl` 04/08
- ✅ `/carreras/diplomatura-en-ciberseguridad-aplicada` 09/08
- ✅ ○ `/carreras/diplomatura-en-compliance` 19/07
- ✅ `/carreras/diplomatura-en-fraude-financiero-y-digital` 04/08
- ✅ `/carreras/diplomatura-en-gestion-de-equipos-de-alto-desempeno` 04/08
- ✅ `/carreras/diplomatura-en-mindfulness-liderazgo-personal-y-gestion-de-vinculos` 12/08
- ✅ `/carreras/diplomatura-en-oratoria` 05/08
- ✅ `/carreras/diplomatura-integral-en-rrhh` 03/08
- ✅ ○ `/carreras/escribania` 21/07
- ✅ `/carreras/licenciatura-en-administracion` 11/08
- ✅ ○ `/carreras/licenciatura-en-administracion-agraria` 21/07
- ✅ `/carreras/licenciatura-en-administracion-de-servicios-de-salud-ccc` 15/08
- ✅ `/carreras/licenciatura-en-administracion-publica` 08/08
- ✅ ○ `/carreras/licenciatura-en-bioinformatica` 19/07
- ✅ `/carreras/licenciatura-en-ciencia-politica-y-gobierno` 27/07
- ✅ `/carreras/licenciatura-en-ciencias-de-datos` 25/07
- ✅ `/carreras/licenciatura-en-comercializacion` 25/07
- ✅ `/carreras/licenciatura-en-comercio-internacional` 25/07
- ✅ ○ `/carreras/licenciatura-en-criminologia-y-seguridad` 19/07
- ✅ `/carreras/licenciatura-en-desarrollo-de-negocios-inmobiliarios-ccc` 12/08
- ✅ `/carreras/licenciatura-en-diseno-y-animacion-digital` 27/07
- ✅ `/carreras/licenciatura-en-educacion-ccc` 05/08
- ✅ `/carreras/licenciatura-en-educacion-y-nuevas-tecnologias` 28/07
- ✅ `/carreras/licenciatura-en-emprendimiento-ccc` 09/08
- ✅ `/carreras/licenciatura-en-finanzas` 31/07
- ✅ `/carreras/licenciatura-en-gerontologia-ccc` 05/08
- ✅ `/carreras/licenciatura-en-gestion-ambiental` 25/07
- ✅ `/carreras/licenciatura-en-gestion-de-recursos-humanos` 27/07
- ✅ `/carreras/licenciatura-en-gestion-deportiva` 27/07
- ✅ `/carreras/licenciatura-en-gestion-turistica` 27/07
- ✅ `/carreras/licenciatura-en-higiene-seguridad-y-medio-ambiente-del-trabajo` 25/07
- ✅ `/carreras/licenciatura-en-informatica` 10/08
- ✅ `/carreras/licenciatura-en-inteligencia-artificial-y-robotica` 25/07
- ✅ `/carreras/licenciatura-en-logistica-global` 25/07
- ✅ `/carreras/licenciatura-en-matematica` 13/08
- ✅ ○ `/carreras/licenciatura-en-negocios-digitales` 18/07
- ✅ `/carreras/licenciatura-en-periodismo` 27/07
- ✅ `/carreras/licenciatura-en-psicopedagogia-ccc` 05/08
- ✅ ○ `/carreras/licenciatura-en-publicidad` 19/07
- ✅ `/carreras/licenciatura-en-relaciones-internacionales` 27/07
- ✅ `/carreras/licenciatura-en-relaciones-publicas-e-institucionales` 12/08
- ✅ `/carreras/licenciatura-en-seguridad-informatica` 25/07
- ✅ `/carreras/licenciatura-en-terapia-ocupacional-y-desarrollo-humano` 27/07
- ✅ `/carreras/martillero-corredor-publico-y-corredor-inmobiliario` 14/08
- ✅ `/carreras/procurador` 28/07
- ✅ `/carreras/profesorado-universitario-para-nivel-secundario-y-superior-ccc` 11/08
- ✅ `/carreras/tecnicatura-en-administracion-y-gestion-de-politicas-publicas` 28/07
- ✅ `/carreras/tecnicatura-en-administracion-y-gestion-tributaria` 28/07
- ✅ `/carreras/tecnicatura-en-direccion-de-equipos-de-venta` 29/07
- ✅ `/carreras/tecnicatura-en-direccion-de-protocolo-organizacion-de-eventos-y-rrpp` 29/07
- ✅ `/carreras/tecnicatura-en-diseno-y-animacion-digital` 28/07
- ❌ `/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos` — nunca rastreada
- ✅ `/carreras/tecnicatura-en-estadistica-aplicada-y-analisis-avanzado` 13/08
- ✅ `/carreras/tecnicatura-en-gestion-administrativa-de-servicios-de-salud` 29/07
- ✅ `/carreras/tecnicatura-en-gestion-contable-e-impositiva` 09/08
- ✅ `/carreras/tecnicatura-en-gestion-de-empresas-familiares` 28/07
- ✅ `/carreras/tecnicatura-en-gestion-de-moda` 09/08
- ✅ ○ `/carreras/tecnicatura-en-gestion-del-clima-laboral-de-la-organizacion` 18/07
- ✅ `/carreras/tecnicatura-en-gestion-y-auditorias-ambientales` 29/07
- ✅ `/carreras/tecnicatura-en-hidrocarburos-y-geociencias` 09/08
- ✅ ○ `/carreras/tecnicatura-en-higiene-y-seguridad-laboral` 19/07
- ✅ ○ `/carreras/tecnicatura-en-investigacion-de-la-escena-del-crimen` 19/07
- ✅ `/carreras/tecnicatura-en-marketing-y-publicidad-digital` 28/07
- ✅ ○ `/carreras/tecnicatura-en-negocios-agroecologicos` 19/07
- ✅ ○ `/carreras/tecnicatura-en-promocion-comunitaria-en-ninez-y-adolescencia` 19/07
- ✅ `/carreras/tecnicatura-en-recursos-turisticos` 29/07
- ✅ ○ `/carreras/tecnicatura-en-redes-informaticas-y-telecomunicaciones` 19/07
- ✅ `/carreras/tecnicatura-en-relaciones-laborales` 29/07
- ✅ `/carreras/tecnicatura-superior-en-cloud-administration` 25/07
- ❌ `/carreras/tecnicatura-superior-en-customer-experience` — nunca rastreada
- ✅ `/carreras/tecnicatura-superior-en-data-science` 10/08
- ✅ `/carreras/tecnicatura-superior-en-gestion-agraria` 31/07
- ✅ `/carreras/tecnicatura-superior-en-gestion-contable` 09/08
- ✅ `/carreras/tecnicatura-superior-en-gestion-hotelera` 31/07
- ✅ ○ `/carreras/tecnicatura-superior-en-inbound-marketing` 23/07
- ✅ `/carreras/tecnicatura-superior-en-marketing-digital` 25/07
- ✅ `/carreras/tecnicatura-superior-en-periodismo-y-nuevas-tecnologias` 01/08
- ✅ `/carreras/tecnicatura-superior-en-planificacion-y-organizacion-de-eventos` 31/07
- ✅ `/carreras/tecnicatura-superior-en-programacion` 01/08
- ✅ `/carreras/tecnicatura-superior-en-quality-assurance` 01/08
- ✅ `/carreras/tecnicatura-superior-en-redes-informaticas` 01/08
- ✅ `/carreras/tecnicatura-superior-en-relaciones-laborales` 31/07
- ✅ `/carreras/tecnicatura-superior-en-seguridad-informatica` 31/07
- ✅ `/carreras/tecnicatura-superior-en-seguros` 31/07

### Resto

- ✅ `/` 14/08
- ✅ `/calendario-academico` 10/08
- ✅ `/clases-apoyo` 09/08
- ✅ `/clases-apoyo/arte` 06/08
- ✅ ○ `/clases-apoyo/computacion` 18/07
- ✅ `/clases-apoyo/fisica` 11/08 (ya indexada con su URL propia; la vieja `/clases-apoyo/fisico-quimica` va con 301)
- ✅ `/clases-apoyo/lengua` 06/08
- ✅ `/clases-apoyo/matematica` 06/08
- ✅ `/contacto` 19/07
- ✅ `/faq` 19/07
- ✅ `/novedades/1` 19/07
- ❌ `/novedades/2` 05/04
- ✅ `/novedades/articulo/carreras-de-grado-a-distancia` 05/08
- ✅ `/novedades/articulo/clases-de-apoyo-como-reservar-turno` 30/07
- ✅ `/novedades/articulo/documentacion-legajo-inscripcion` 30/07
- ✅ `/novedades/articulo/donde-queda-el-cau-villa-lugano` 30/07
- ✅ `/novedades/articulo/identidad-argentina-diplomaturas` 30/07
- ✅ `/novedades/articulo/inicio-de-clases` 08/08
- ✅ `/novedades/articulo/ivu-universitario-21-inicio-cursada` 30/07
- ✅ `/novedades/articulo/que-es-el-cau-villa-lugano` 30/07
- ✅ `/novedades/articulo/teclab-tecnicaturas-online` 29/07
- ✅ `/novedades/articulo/tecnicaturas-pregrado-dos-tres-anos` 30/07
- ✅ `/sobre-nosotros` 21/07

El `○` no aplica a `/`, `/contacto`, `/faq`, `/novedades/*` ni `/sobre-nosotros`: esas
páginas no emiten BreadcrumbList, así que su `rich_results: null` es lo esperado y no
dice nada sobre la antigüedad de la copia.
