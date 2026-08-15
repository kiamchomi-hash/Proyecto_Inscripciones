---
name: bot-respuestas
version: 1.0.0
description: Cuando se trabaja sobre el bot de respuestas de WhatsApp del CAU Villa Lugano — agregar o corregir respuestas del corpus, atender notas del entrenador, resolver de dónde sale un dato, o cotizar Siglo 21 / Teclab / Identidad Argentina. Úsese también ante cualquier duda sobre qué fuente manda cuando dos se contradicen.
---

# Bot de respuestas del CAU

Motor sin IA que, ante lo que escribe un lead por WhatsApp, propone **hasta** tres respuestas para copiar y pegar. Elige por parecido entre la consulta y las preguntas de ejemplo de cada intención. Sólo ofrece las intenciones que quedan a menos del 30% de puntaje de la que ganó (`RELEVANCIA` en el motor): a una consulta clara le propone una sola respuesta, y las tres aparecen cuando de verdad hay tres lecturas posibles. El relleno con intenciones de respaldo corre nada más cuando no hubo ninguna coincidencia. **El corpus es el producto**: la carpeta `ventas/corpus/`.

## Dónde vive cada cosa

Repartido en tres carpetas, todas gitignoradas (Grep no las ve, buscar con Bash):
`herramientas/ventas/` los scripts, `carreras/` el material academico separado por
casa (`siglo21/`, `teclab/`, `identidad/`),
`ventas/` los precios, el corpus y los dos HTML. El mapa de rutas vive en
`herramientas/ventas/rutas.mjs`.

| Archivo | Qué es |
|---|---|
| `ventas/corpus/siglo21.json`<br>`ventas/corpus/teclab.json`<br>`ventas/corpus/identidad.json` | **el corpus, uno por casa**: intenciones, preguntas, respuestas, estados y notas |
| `ventas/corpus/comun.json` | lo que comparten las tres: sinónimos, sugerencias y textos de referencia. Nada de esto se le manda a un lead |
| `herramientas/ventas/corpus.mjs` | los carga y le pega `comun.json` a cada uno. **Único lugar que lee esos JSON**: nadie los abre a mano desde el código |
| `herramientas/ventas/bot-respuestas.mjs` | el motor. Se inyecta en las páginas con `toString()`, así el navegador corre el mismo código que cubren los tests. Recibe **un** corpus, el de la casa que se atiende |
| `entrenar-bot.html` | la página de trabajo: probar consultas, revisar y aprobar respuestas |
| `buscador-carreras.html` | la página de atención: ficha, precios y **el mismo bot**, en la caja "Responder al lead" |
| `herramientas/ventas/contexto-carreras.mjs` | **arma el contexto de marcadores** de las tres instituciones. Lo usan los dos generadores: si cada uno armara el suyo, una respuesta probada en el entrenador saldría distinta al atender |
| `herramientas/ventas/generar-entrenador.mjs` | arma la página de entrenamiento |
| `herramientas/ventas/aplicar-corpus.mjs` | compara la descarga contra el corpus instalado y lo reemplaza |
| `carreras/teclab/carreras-externas.json`<br>`carreras/identidad/carreras-externas.json` | las carreras de esas dos casas, con precios ya resueltos: un archivo por institución |
| `herramientas/ventas/extraer-externos.mjs` | las lee de las carpetas del escritorio y arma ese archivo |

## Un corpus por institución

Desde el 08/08/2026 cada casa tiene su archivo y **el bot carga uno solo por vez**: el de la institución de la carrera que se está atendiendo. Antes convivían en un `respuestas-bot.json` único, separadas nada más que por el campo `institucion` de cada respuesta — alcanzaba con olvidárselo para que el mensaje le saliera a las tres, y las tres funcionan distinto, así que un texto escrito para una es casi siempre falso para las otras.

Lo que cambia al trabajar:

- **Se corrige el archivo de la casa que falló, y sólo ese.** Si el arreglo también les sirve a las otras, se copia a mano: es una decisión sobre qué contesta cada una, no un detalle de edición.
- Las 12 respuestas que antes eran universales están **copiadas en los tres archivos**, cada una estampada con su `institucion`. Varias les quedan mal a alguna casa; se corrigen ahí sin tocar a las demás.
- Una intención puede quedar **sin ninguna respuesta** en un archivo: hay temas que a esa casa no le aplican. No es un hueco, y `auditar-instituciones.mjs` las lista como aviso, no como problema.
- `institucion` sigue estando en cada respuesta aunque el archivo ya la declare: es la red de abajo, y hay un test que falla si un archivo trae una respuesta de otra casa.

## El ciclo

**Desde el 04/08/2026 el corpus se edita acá, en la conversación**: se lee el
mensaje que salió mal, se corrige el archivo de esa casa en `ventas/corpus/` y se
regenera. El entrenador dejó de usarse — no mandar a nadie a aprobar ahí ni
esperar una descarga suya. `aplicar-corpus.mjs` queda para el día que se vuelva
a usar (instala en la casa que diga el campo `institucion` del archivo bajado).

```bash
# 1. Editar el archivo de la casa en ventas/corpus/.
# 2. Y siempre LOS DOS generadores, aunque el entrenador ya no se abra: si sólo
#    se regenera uno, las dos páginas contestan distinto.
node --test herramientas/ventas/tests/*.test.mjs
node herramientas/ventas/auditar-instituciones.mjs
node herramientas/ventas/generar-entrenador.mjs --descuento-beneficio 10
node herramientas/ventas/generar-buscador.mjs  --descuento-beneficio 10
```

**El buscador también lleva el bot**, leyendo los mismos archivos de `ventas/corpus/` al generarse: una corrección aparece en el buscador recién al regenerarlo. Regenerar sólo uno deja las dos páginas contestando distinto.

**No pasar `--promocion`**: el porcentaje sale solo de la planilla de CASA, que es lo que hace el `.bat` (deja el valor vacío a propósito). Forzarlo rompe la página en silencio: el período 2A cobra matrícula + ticket A + ticket B, o sea que necesita **tres** porcentajes, y con `--promocion 50,20` el generador avisa «Sin período 2A en la página» por stderr y arma la página con 2B solo, sin el selector de períodos. Pasó el 15/08/2026 y estuvo publicado medio día. Si alguna vez hay que forzarlo, van tres valores: `--promocion 50,20,20`.

Para actualizar precios de las tres instituciones y rearmar todo: `Actualizar precios de las tres.bat`. Y el flujo completo del buscador (bajar precios, armar y publicar) es `ventas/3 - Actualizar buscador de carreras.bat`.

**Ojo con `node --test herramientas/ventas/tests/`** (la carpeta): falla. Va con `*.test.mjs`.

## Jerarquía de fuentes

Cuando dos se contradicen, manda la de arriba. No elegir en silencio: dejar la contradicción anotada en la respuesta.

1. **La Nube 21** — `https://www.lanube.21.edu.ar`, el portal oficial del alumno de Siglo 21, y la fuente de más peso sobre cómo funciona la cursada: modalidades, EFIP, prácticas, equivalencias, becas, titulación, idiomas. Ante una diferencia con cualquier otra, manda ésta y la diferencia se deja anotada. Es Wix: el texto se baja con `curl` y se limpian los tags, **pero las tablas viven en widgets que no viajan en el HTML** (becas y beneficios, organizaciones amigas, el FAQ por modalidad). Esas se leen con Playwright recorriendo los `frames()` de la página, y el filtro del FAQ es un `<select>`, no un botón: va con `selectOption`. Sólo Siglo 21; Teclab e Identidad no tienen equivalente.
2. **Dashboard Comercial de Teclab** — `informacion.teclab.edu.ar/hubfs/ADMISION/CALIDAD%20Y%20%20TRAINING/Dashboard_Comercial_Teclab%20(01).html`, el panel que Teclab arma para sus asesores de admisión. Es el equivalente de La Nube para Teclab y manda sobre el sitio comercial: trae las 16 tecnicaturas con ficha completa, los 186 convenios con su porcentaje, la tabla de recargos por banco, el manual de objeciones, el calendario y el benchmark contra la competencia. **El HTML es público y el login es de JavaScript**: los datos viajan embebidos, así que se baja con `curl` y se extraen las constantes del script (`DATA`, `BENCHX`, `GUIAS`, `CONV`) balanceando llaves y evaluándolas en un `vm`. Copia en `carreras/teclab/dashboard-comercial.json`, bajada el 15/08/2026.
3. **API pública de Identidad Argentina** — `POST https://nd2rzkufzb.execute-api.us-east-1.amazonaws.com/dev/curso`, su fuente oficial. Es API Gateway con Lambda proxy: se manda el sobre entero (`httpMethod`, `headers`, `queryStringParameters`, `pathParameters`, `isBase64Encoded`) y el `body` como **string** con `{"curso_id":"<id>"}`. Un curso fuera de la oferta contesta 200 con una fila vacía, y así se sabe qué se vende hoy. Devuelve título, subtítulo (Diplomatura o Curso), modalidad y duración en la `bajada`, docente con antecedentes, PDF, precios y el temario por unidades. Copia en `carreras/identidad/api-cursos.json`; se cruza con el KB por `url_pdf`, que es lo único que no cambia cuando renombran una diplomatura.
4. **Reglamento Institucional** — la norma escrita.
   - Teclab: `portalalumnopre.teclab.edu.ar/5e01120d0cdce5c39761b58700f275b4.pdf` (37 pp.). No se lee por web: bajarlo y extraerlo con PyMuPDF.
   - Siglo 21: `contenidos.21.edu.ar/microsites/reglamento/` — versión **2026**, 14 capítulos, navegable por `index.php?put=<capitulo>-<seccion>-<slug>`.
5. **FAQ y sitio oficiales**: `teclab.edu.ar/faq/`, `teclab.edu.ar/becas/`, `teclab.edu.ar/partnerships/`, `teclab.edu.ar/aspirante/`, `21.edu.ar/programas/preguntas-frecuentes`.
6. **Fichas del KB** del proyecto (`carreras/siglo21/fichas-sitio-oficial.json`, `carreras/siglo21/datos/`).
7. **Documentos internos** (`Teclab_Info/conocimiento-hermes/faq_ventas_y_modalidad.md`, guías de WhatsApp). Sirven, pero no alcanzan para afirmarle algo a un lead si una fuente oficial dice otra cosa.

Casos ya resueltos, para no rediscutirlos:

- **La cursada de Siglo 21 no es "100% virtual"** y el bot dejó de decirlo (14/08/2026). Lo presencial de la modalidad que vende el CAU (Educación Distribuida Home) son tres cosas: la charla de ingreso (IVU / Despegue 21), obligatoria y por única vez en el CAU; el **EFIP I y el EFIP II** en las carreras de grado, que se rinden en una sede o CAU; y la **Defensa Oral**, que es siempre en el campus de Córdoba. Se dice "virtual" o "desde tu casa" y se nombra lo presencial.
- **Los "4 encuentros en el CAU" son de ED, no de EDH.** La página de EDH muestra la tarjeta, pero la guía del ingresante dice que en EDH "todo el cursado se realiza desde casa, sin necesidad de asistir al CAU", y sus condiciones de cursado no piden asistencia; las de ED sí (75%) y ahí sí son 4 encuentros por materia cada 15 días. La fuente se contradice a sí misma: no afirmarle los 4 encuentros al lead de EDH.
- **La constancia de "título en trámite" no cierra el legajo** (14/08/2026): la fuente oficial dice que no es válida para constatar los estudios y que hay que esperar el documento final. Contradice al Reglamento 2026, que la aceptaba un año como documentación provisoria; manda la fuente oficial. Sí se puede ingresar y cursar mientras tanto, porque el legajo tiene plazo: año y medio en grado, un año en pregrado, un semestre en los ciclos de complementación.
- **Las becas por postulación tienen contraprestación**: 4 horas semanales de apoyo a la universidad con el 30%, 8 con el 50% y 10 con el 70%. Y se confirman antes del 1 de febrero (primer semestre) o del 20 de julio (segundo): sobre un semestre ya empezado no hay beca por postulación.
- **Las becas de Siglo 21 no se acumulan entre sí** (sí con la promoción vigente) y **se piden antes de abonar el arancel**: pagado el ticket, ya no se aplican.
- **Pregrado no rinde EFIP ni hace Trabajo Final de Grado**: se recibe al aprobar la última materia. Lo separa el marcador `esPregrado`, que sale del nivel del catálogo local.
- **El convenio con la empresa existe y está listado**: 2465 organizaciones, en `ventas/organizaciones-amigas.md` (se busca con grep). Descuenta sobre aranceles, casi siempre 10%, se acredita con el recibo de sueldo y alcanza a familiares directos. Están el Gobierno de la Ciudad y el de la Provincia de Buenos Aires, ANSES y el Consejo de la Magistratura, que es la mitad de los leads de la zona. Las 32 becas y beneficios, con requisitos y documentación, están en `ventas/becas-y-beneficios.md`.
- **Garantía de Adaptación y Seguro de Continuidad** son las dos respuestas a "¿y si no me va bien?" y "¿y si me quedo sin trabajo?": la universidad reconoce lo abonado. Estaban sin usar y ahora contestan en `ahora-no-puedo`.
- **Las fechas de cursado salen del calendario académico oficial de la modalidad** (`contenidos.21.edu.ar/descargas/calendarios-2026/`), no de un dato suelto. En 2026 la modalidad a distancia arrancó 1A el 16/03, 1B el 18/05, 2A el 03/08 y 2B el 05/10, con inscripción a materias hasta dos semanas después de cada inicio.
- **Mayores de 25 sin secundario: confirmado** (14/08/2026), después de estar meses en "sin confirmar". La fuente oficial lo publica: con más de 25 años y secundario incompleto se puede ser alumno teniendo el ciclo básico completo (los primeros 3 años aprobados) o 9 años de escolaridad desde 1° grado. Se presenta DNI, analítico legalizado, CV con teléfono, certificados de cursos y una **carta a la Rectora** explicando los motivos (hay modelo), por los canales de contacto virtuales y no por Digital Admin. Al lead no se le dice "CBU": es vocabulario cordobés.
- **La oferta de Identidad son 8 y hay que preguntársela a la API** (15/08/2026): Oratoria, Gestión de Equipos de Alto Desempeño, Mindfulness, Constitución de Sociedades, Integral en RRHH, Fraude financiero y digital, Compliance y Ciberseguridad Aplicada. Los ids son 11, 15, 16, 17, 20, 25, 37986 y 37988. Fuera quedaron Bienestar Integral, Inteligencia Artificial, Marketing para Emprendedores y Management Hotelero: contestan con la fila vacía. Barrí los ids vecinos y no hay ninguna nueva escondida.
- **Constitución de Sociedades es un CURSO, no una diplomatura**: dura un mes y la API lo clasifica así. Lo veníamos llamando diplomatura. En el texto va el marcador `{programaConArticulo}`, que dice «un curso» o «una diplomatura» según corresponda.
- **La duración la manda la API, no la ficha**: el proyecto de Identidad la toma de un snapshot viejo y Mindfulness figuraba con 2 meses cuando son 4. El contexto pisa ese campo. Lo que **no** se pisa es la modalidad: la API dice «Híbrido» en Alto Desempeño y eso le hace creer al lead que viaja, cuando cursa en vivo por Innova Virtual desde su casa.
- **Cada programa de Identidad tiene docente con nombre y antecedentes**, que salen de la API y ahora contesta la intención `docente`. En una diplomatura corta el lead compra a la persona.
- **Tarjetas de Teclab**: van las 8 (Visa, Mastercard, American Express, Naranja, Cabal, Diners, Argencard, Sucrédito). El FAQ del sitio nombra 4; es la versión corta, no una corrección.
- **Quién elige la empresa de las prácticas**: la elige el alumno. Lo dice el reglamento 3.5.2, contra lo que sugería el FAQ.
- **Convenios de Teclab: son 186 y están listados** (15/08/2026), en `ventas/teclab-convenios.md`. El beneficio se llama «Comunidad Teclab» y va sobre el arancel: 15% en 162 casos, 10% en 22 y 20% en uno; 183 activos y 3 pendientes. El sitio dice «más de 200», que es redondeo comercial. Y la lista de policía y municipios, que antes sólo estaba en el documento interno, ahora tiene respaldo: figuran la **Policía de la Ciudad de Buenos Aires** y 20 municipios. Cada convenio tiene página propia en `vinculacion.teclab.edu.ar`.
- **Las cuotas de Teclab tienen recargo, salvo Naranja X**: 3 cuotas al 6,15% en los bancos principales y 7,41% en el resto; 6 cuotas al 12,48% y 12,99%. Sólo Naranja X va sin interés, y aparte está la financiación propia de Teclab (suscripción con gasto administrativo, en cuotas sin interés). Decir «6 cuotas» a secas era prometer de más.
- **Las clases en vivo de Teclab son a la noche**: una por materia, a las 18:00 o 19:30, y no es obligatorio conectarse porque quedan grabadas. En 4 de las 16 tecnicaturas la segunda materia del bimestre es directamente asincrónica. El día y la hora exactos son del bimestre en curso y viven en el bloque `MATERIAS` del panel: no se escriben en el texto porque vencen.
- **El curso corto de IA va por ediciones con ventana de venta** y el panel publica las tres del semestre. El marcador `inicioCurso` elige sola la primera cuya venta sigue abierta, así que el bot ya da la fecha en vez de ofrecer confirmarla, y la respuesta se apaga cuando no queda ninguna.
- **La articulación con Siglo 21 tiene nombre y apellido** en 6 de las 16 tecnicaturas (Programación, Cloud Administration, Data Science, Inbound Marketing, Marketing Digital y Redes Informáticas): la licenciatura concreta está cargada como marcador `articulacionSiglo21`. En las otras 10 se sigue mandando al buscador de equivalencias.
- **Legislatura porteña y Senado de la Nación**: Teclab **no** tiene convenio con ninguno de los dos; **con ATE sí**. Lo confirmó la dirección el 03/08/2026 ante la consulta de un lead. Es de Teclab: para Siglo 21 no hay dato y ahí sigue contestando la respuesta general ("pasame el nombre del organismo y lo consulto").
- **Becas de Teclab: por el momento no hay.** Lo confirmó el administrador de Teclab el 04/08/2026. Contradice a `teclab.edu.ar/becas` y al FAQ comercial, que publican la Beca de Inclusión y la de mejor alumno de secundario: manda el administrador, que es más reciente y habla de lo que se puede ofrecer hoy. **Las dos versiones conviven**: en `becas` y en `becas-ayuda`, Teclab tiene primero la del administrador, que es la que se manda, y detrás la oficial con las dos becas, para el día que vuelvan a abrirse o si el lead llega diciendo que las vio publicadas. Las cuatro llevan la contradicción anotada en `fuente`. Lo que sí se ofrece hoy: el descuento ya aplicado, las 6 cuotas y el convenio de la empresa u organismo.

## Cómo se cotiza

**Siglo 21.** El período A cobra Matrícula + Ticket A + Ticket B; desde el 2B, sólo Matrícula + Ticket B. Al aspirante nunca se le dice "ticket": es **primer período** y **segundo período**. Una matrícula por ciclo, y el ciclo cubre los dos períodos — hoy 2A + 2B; en 2027 arranca otro con 1A + 1B y matrícula nueva. El total es el del ciclo, no el de la carrera. Financiación: 6 cuotas con tarjeta.

**Teclab.** Matrícula + bimestre 2A + bimestre 2B. La matrícula es **cuatrimestral** (reglamento 4.1: "el pago de la matrícula y aranceles tienen una periodicidad cuatrimestral"), y el cuatrimestre son esos dos bimestres, de 9 semanas cada uno — 8 de cursada y 1 de repaso. Los descuentos por bimestre vienen como campo; el **50% off de matrícula que tienen algunas carreras no viene**: se deduce restando los descuentos de bimestre a `ahorroTotal`. `extraer-externos.mjs` controla que el desglose sume el total y, si no cierra, manda sólo el total y deja aviso.

**Regla dura**: toda respuesta que escriba un importe tiene que exigir `preciosVigentes`. Hay un test que recorre el corpus y falla si alguna no lo hace. Cuando la fuente queda vieja, el bot no cotiza: contesta que lo confirma.

## Reglas del corpus

- **No inventar.** Si el dato no está, la respuesta dice que se confirma. Cada respuesta lleva en `notas` de dónde salió.
- **No hay estados ni aprobación** (desde el 15/08/2026). Toda respuesta que está en el corpus está viva y el bot puede ofrecerla. Se decide en la conversación: el usuario dice qué información es oficial, y lo que no sirve **se borra**, no se apaga. Si una respuesta te parece dudosa, no la dejes marcada de ninguna manera: preguntá o no la escribas. El campo `estado` ya no lo lee nadie; si aparece en un archivo viejo, es ruido.
- **`institucion`**: la declara el archivo, y cada respuesta la repite. Una respuesta escrita en `teclab.json` es de Teclab, punto; ya no existe la respuesta que sirve para las tres.
- **`requiere` va en la respuesta, no en la intención.** Un `requiere` a nivel intención apaga la intención entera de esa casa, aunque tenga respuestas que sí podrían salir. Este error ya dejó mudas a `requisitos`, `cuotas`, `horarios` y `doble-titulacion`.
- Al agregar una respuesta a una intención existente, mirar **el orden**: manda la posición en el array, así que la variante más específica va primero y la genérica atrás.

## Cobertura al 09/08/2026

Las tres arrancan con las mismas 47 intenciones: las 12 respuestas que eran universales se copiaron a los tres archivos, así que ninguna casa quedó muda por el corte.

| | Carreras | Intenciones sin respuesta | Respuestas vivas |
|---|---|---|---|
| Universidad Siglo 21 | 65 | **0** | 95 |
| Teclab | 16 + 1 curso | **3** | 90 |
| Academia Identidad Argentina | 11 | **0** | 63 |

Las 4 de Teclab son estructurales, no huecos: `dos-carreras`, `titulo-exterior` y `titulo-terciario` no aplican, y `enviar-ficha` necesita la URL de cada carrera, que no está cargada. `doble-titulacion` dejó de estar en la lista sólo porque heredó la copia universal, que exige `{dobleTitulacion}` y ninguna carrera de Teclab lo trae: en la práctica sigue sin contestarse.

**Identidad se quedó con 4 copias universales, no con 12.** El 08/08/2026 se le sacaron 7 y se aprobaron las propias que quedaban solas. Las que le hablaban al lead como si la diplomatura fuera una carrera universitaria a distancia:

| Copia sacada | Qué decía de más | Contesta ahora |
|---|---|---|
| `duracion-a` | «es a distancia, vas manejando tus tiempos» | `duracion-identidad` |
| `horarios-a` | «no tiene horarios fijos de cursada» | `horarios-identidad` / `-sin-cronograma` |
| `equivalencias-a` | pedía plan de estudios y analítico para elevar | `equivalencias-identidad` |
| `inscripcion-a` | «te armo el legajo» | `inscripcion-identidad` (preinscripción + link de pago) |
| `requisitos-a`, `validez-a`, `doble-titulacion-a` | nunca se disparaban (borradas, o con un `requiere` que Identidad no cumple) | la propia de cada una |

Las 4 que quedan son las únicas de su intención y funcionan: `pedir-datos-a`, `no-entiendo-a`, `seguimiento-a` y `convenio-organismo-consulta`, más `pide-todo-sin-precio`, que es el respaldo para cuando el precio queda viejo. Dos detalles sin resolver: `seguimiento-a` cierra con «así no se te pasa la fecha de inscripción» y en Identidad se entra con la cursada empezada, y `convenio-organismo-consulta` afirma «convenios hay varios», que está documentado para Teclab y para Identidad no tiene fuente (ofrece chequear antes de confirmar, así que no promete nada falso).

Al revisar copias en las otras casas, mirar esto mismo: se escribieron pensando en Siglo 21, y hay que probarlas **con los contextos reales** — varias parecen rotas y en verdad nunca se disparan porque exigen un marcador que esa casa no tiene.

**Identidad Argentina sigue siendo el trabajo pendiente**: es la única de las tres sin una fuente oficial procesada. Su sitio bloquea el scraping (robots + SPA); el material está en la carpeta del escritorio.

## Sin confirmar

- **Adeudar materias del secundario.** Sigue sin vía: ni la de mayores de 25 (que pide secundario incompleto y edad) ni el legajo lo contemplan. Se pregunta y se confirma, no se afirma.
- **Financiación mensual.** No existe pago mensual: el reglamento compromete el pago por cuatrimestre o bimestre. Las 6 cuotas son financiación de tarjeta. Las consultas de "¿cuánto por mes?" siguen contestándose con el total.

## Trampas conocidas

- **No escribir la modalidad a mano.** «100% online» vale para 10 de las 11 diplomaturas de Identidad: **Gestión de Equipos de Alto Desempeño es híbrida**, y le salía una modalidad falsa en 13 respuestas (corregido el 09/08/2026). Va `{modalidad}` con `"modalidad"` en `requiere`; cuando la frase habla de la oferta entera y no de una carrera, «casi todas 100% online». En Teclab no pasa: las 17 son a distancia.
- La solapa Revisar rellena los marcadores con la carrera elegida. Si la respuesta exige un dato que esa carrera no tiene, se muestra con otra **de la misma institución** y lo avisa. Antes cruzaba instituciones y mostraba Abogacía revisando Data Science.
- `finalAmounts` en el archivo de precios de Teclab **sólo existe** cuando lo generó el pipeline de Python. Con el extractor de una pasada hay que leer `prices`.
- El perfil profesional de las fichas viene como párrafo corrido y varias cierran con "Texto para enviar por mail": se corta en viñetas y se limpia en `generar-entrenador.mjs`.
