# Indexación — siglo21sur.com

**25/08/2026 · 110/112.**

## Enviar a GSC

Solicitar indexación:

```
https://www.siglo21sur.com/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos
https://www.siglo21sur.com/carreras/tecnicatura-superior-en-customer-experience
https://www.siglo21sur.com/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto
https://www.siglo21sur.com/novedades/articulo/teclab-tecnicaturas-online
```

Las dos primeras siguen "descubiertas sin rastrear", igual que el 22/08. **La causa no es
el enlazado interno**: se contaron los `<a href>` de las 88 fichas y videojuegos recibe 9
enlaces y customer-experience 7, por arriba del piso de 6 que da el bloque de carreras
relacionadas; las dos están además en la home y en el sitemap. Con contenido cargado,
enlaces y sitemap en orden, lo que queda es prioridad de rastreo del dominio: se piden a
mano y se espera.

Las dos últimas son los 301 que Google todavía no vio (último rastreo 30/07 y 29/07). El
del segundo semestre importa porque sigue recibiendo las consultas de calendario en
posición 6,5 con 727 impresiones.

`que-hace-un-administrador-cloud`, publicada el 22/08, **se indexó el mismo día**: es la
tercera vez seguida que una URL nueva entra el día del deploy, así que la revalidación
del sitemap sin deploy quedó confirmada en la práctica.

## El apex redirigía con 307 (corregido el 25/08/2026)

Buscando por qué esas dos fichas no se rastrean se descartó todo lo demás —canónica,
`X-Robots-Tag`, estado HTTP, datos estructurados, `lastmod`, enlaces internos— y quedó
una sola cosa en pie: **`siglo21sur.com` redirigía a `www` con 307 Temporary**, aunque
`next.config.ts` declara ese redirect con `permanent: true`.

La regla del repo nunca se ejecutaba: Vercel tiene su propio redirect a nivel de dominio,
corre en el borde antes que la app y traía `redirectStatusCode: 307` de fábrica. El código
decía una cosa y producción hacía otra, sin que ningún diff lo mostrara.

Que importe no es teórico: la API de inspección devuelve, para las tres fichas que se
consultaron, una sola URL de referencia y es `https://siglo21sur.com/sitemap.xml` —**apex,
sin www**—. Google entraba por ahí, se comía un salto en cada pedido y, como el 307 dice
"temporal", nunca consolidaba ni dejaba de reintentarlo. En un dominio con poco
presupuesto de rastreo, eso se lo come la cola.

Se corrigió en el dominio, que es donde se decide, no en el código. El código esperado
quedó fijado en `lib/vigilancia-esperado.ts` con el 308 explícito, así que si alguien lo
mueve desde el panel los dos vigilantes avisan.

**No es una palanca, es sacar un desperdicio.** Puede que no alcance para que las dos
fichas se rastreen.

Ojo con `npm run seo`: el 25/08 informó "Google no reconoce esta URL" para videojuegos y
la inspección directa devolvió "Descubierta: actualmente sin indexar" un minuto después.
Es un rebote de la API, no una caída del índice; ante un cambio de estado raro, confirmar
con una segunda inspección antes de anotarlo.

## La lista

`○` marca la copia indexada anterior al BreadcrumbList del 24/07.

### Carreras

- ✅ `/carreras/abogacia` 06/08
- ✅ `/carreras/actuario` 09/08
- ✅ `/carreras/contador-publico` 16/08
- ✅ `/carreras/curso-de-actualizacion-profesional-en-inteligencia-artificial` 03/08
- ✅ `/carreras/curso-de-constitucion-de-sociedades-sa-sas-srl` 04/08
- ✅ `/carreras/diplomatura-en-ciberseguridad-aplicada` 09/08
- ✅ `/carreras/diplomatura-en-compliance` 19/08
- ✅ `/carreras/diplomatura-en-prevencion-de-fraude-financiero-y-digital` 21/08 — se indexó
  el mismo día del deploy. La vieja (`diplomatura-en-fraude-financiero-y-digital`) estaba
  indexada desde el 04/08 y va con 301 a esta.
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
- ❌ `/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos` — descubierta, nunca rastreada (9 enlaces internos)
- ✅ `/carreras/tecnicatura-en-estadistica-aplicada-y-analisis-avanzado` 13/08
- ✅ `/carreras/tecnicatura-en-gestion-administrativa-de-servicios-de-salud` 29/07
- ✅ `/carreras/tecnicatura-en-gestion-contable-e-impositiva` 09/08
- ✅ `/carreras/tecnicatura-en-gestion-de-empresas-familiares` 28/07
- ✅ `/carreras/tecnicatura-en-gestion-de-moda` 09/08
- ✅ ○ `/carreras/tecnicatura-en-gestion-del-clima-laboral-de-la-organizacion` 18/07
- ✅ `/carreras/tecnicatura-en-gestion-y-auditorias-ambientales` 29/07
- ✅ `/carreras/tecnicatura-en-hidrocarburos-y-geociencias` 09/08
- ✅ `/carreras/tecnicatura-en-higiene-y-seguridad-laboral` 19/08
- ✅ `/carreras/tecnicatura-en-investigacion-de-la-escena-del-crimen` 16/08
- ✅ `/carreras/tecnicatura-en-marketing-y-publicidad-digital` 28/07
- ✅ `/carreras/tecnicatura-en-negocios-agroecologicos` 14/08
- ✅ ○ `/carreras/tecnicatura-en-promocion-comunitaria-en-ninez-y-adolescencia` 19/07
- ✅ `/carreras/tecnicatura-en-recursos-turisticos` 29/07
- ✅ `/carreras/tecnicatura-en-redes-informaticas-y-telecomunicaciones` 17/08
- ✅ `/carreras/tecnicatura-en-relaciones-laborales` 29/07
- ✅ `/carreras/tecnicatura-superior-en-cloud-administration` 25/07
- ❌ `/carreras/tecnicatura-superior-en-customer-experience` — descubierta, nunca rastreada (7 enlaces internos)
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
- ✅ `/novedades/2` 17/08 (se indexó solo, sin pedirlo)
- ✅ `/novedades/articulo/carreras-de-grado-a-distancia` 05/08
- ✅ `/novedades/articulo/clases-de-apoyo-como-reservar-turno` 30/07
- ✅ `/novedades/articulo/documentacion-legajo-inscripcion` 30/07
- ✅ `/novedades/articulo/donde-queda-el-cau-villa-lugano` 30/07
- ✅ `/novedades/articulo/identidad-argentina-diplomaturas` 30/07
- ✅ `/novedades/articulo/inicio-de-clases` 08/08
- ↪️ `/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto` → 301 a
  `inicio-de-clases`. Sigue indexada con rastreo del 30/07: Google no vio la
  redirección y ya no está en el sitemap. Es la URL que recibe las consultas de
  calendario en posición 6,5, así que conviene pedirla a mano para forzar el recrawl.
- ✅ `/novedades/articulo/ivu-universitario-21-inicio-cursada` 30/07
- ✅ `/novedades/articulo/que-es-el-cau-villa-lugano` 30/07
- ✅ `/novedades/articulo/que-hace-un-administrador-cloud` 22/08 — se indexó el mismo día
  que se publicó. Apunta al puesto y no a la carrera para no competirle a la
  ficha de Cloud Administration, y le da a `customer-experience` su primer enlace
  editorial.
- ↪️ `/novedades/articulo/teclab-tecnicaturas-online` → 301 a `/teclab` (21/08). Estaba
  indexada desde el 29/07, pero cubría el mismo tema que la landing y competía por
  sus mismas consultas de marca con 4 impresiones y 0 clics en 90 días.
- ✅ `/novedades/articulo/tecnicaturas-pregrado-dos-tres-anos` 30/07
- ✅ `/sobre-nosotros` 21/08
- ✅ `/teclab` 21/08 — se indexó el mismo día del deploy, con Breadcrumbs. Recibe el 301
  del artículo de Teclab, que sigue figurando indexado con rastreo del 29/07: Google
  todavía no vio la redirección. Revisar que termine tomando la landing como canónica de
  las consultas de marca.

El `○` no aplica a `/`, `/contacto`, `/faq`, `/novedades/*` ni `/sobre-nosotros`: esas
páginas no emiten BreadcrumbList, así que su `rich_results: null` es lo esperado y no
dice nada sobre la antigüedad de la copia.
