---
name: bot-respuestas
version: 1.0.0
description: Cuando se trabaja sobre el bot de respuestas de WhatsApp del CAU Villa Lugano — agregar o corregir respuestas del corpus, atender notas del entrenador, resolver de dónde sale un dato, o cotizar Siglo 21 / Teclab / Identidad Argentina. Úsese también ante cualquier duda sobre qué fuente manda cuando dos se contradicen.
---

# Bot de respuestas del CAU

Motor sin IA que, ante lo que escribe un lead por WhatsApp, propone **hasta** tres respuestas para copiar y pegar. Elige por parecido entre la consulta y las preguntas de ejemplo de cada intención. Sólo ofrece las intenciones que quedan a menos del 30% de puntaje de la que ganó (`RELEVANCIA` en el motor): a una consulta clara le propone una sola respuesta, y las tres aparecen cuando de verdad hay tres lecturas posibles. El relleno con intenciones de respaldo corre nada más cuando no hubo ninguna coincidencia. **El corpus es el producto**: la carpeta `ventas/corpus/`.

## Dónde vive cada cosa

Repartido en tres carpetas, todas gitignoradas (Grep no las ve, buscar con Bash):
`herramientas/ventas/` los scripts, `carreras/` las fichas y el material de Teclab,
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
| `carreras/carreras-externas.json` | carreras de Teclab e Identidad, con precios ya resueltos |
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
node herramientas/ventas/generar-entrenador.mjs --promocion 5 --descuento-beneficio 10
node herramientas/ventas/generar-buscador.mjs  --promocion 5 --descuento-beneficio 10
```

**El buscador también lleva el bot**, leyendo los mismos archivos de `ventas/corpus/` al generarse: una corrección aparece en el buscador recién al regenerarlo. Regenerar sólo uno deja las dos páginas contestando distinto.

`--promocion` es obligatorio y sale de `ventas/precios/promocion-vigente.json`. Para actualizar precios de las tres instituciones y rearmar todo: `Actualizar precios de las tres.bat`.

**Ojo con `node --test herramientas/ventas/tests/`** (la carpeta): falla. Va con `*.test.mjs`.

## Jerarquía de fuentes

Cuando dos se contradicen, manda la de arriba. No elegir en silencio: dejar la contradicción anotada en la respuesta.

1. **Reglamento Institucional** — el árbitro.
   - Teclab: `portalalumnopre.teclab.edu.ar/5e01120d0cdce5c39761b58700f275b4.pdf` (37 pp.). No se lee por web: bajarlo y extraerlo con PyMuPDF.
   - Siglo 21: `contenidos.21.edu.ar/microsites/reglamento/` — versión **2026**, 14 capítulos, navegable por `index.php?put=<capitulo>-<seccion>-<slug>`.
2. **FAQ y sitio oficiales**: `teclab.edu.ar/faq/`, `teclab.edu.ar/becas/`, `teclab.edu.ar/partnerships/`, `teclab.edu.ar/aspirante/`, `21.edu.ar/programas/preguntas-frecuentes`.
3. **Fichas del KB** del proyecto (`carreras/fichas-sitio-oficial.json`, `carreras/datos/`).
4. **Documentos internos** (`Teclab_Info/conocimiento-hermes/faq_ventas_y_modalidad.md`, guías de WhatsApp). Sirven, pero no alcanzan para afirmarle algo a un lead si una fuente oficial dice otra cosa.

Casos ya resueltos, para no rediscutirlos:

- **Tarjetas de Teclab**: van las 8 (Visa, Mastercard, American Express, Naranja, Cabal, Diners, Argencard, Sucrédito). El FAQ del sitio nombra 4; es la versión corta, no una corrección.
- **Quién elige la empresa de las prácticas**: la elige el alumno. Lo dice el reglamento 3.5.2, contra lo que sugería el FAQ.
- **Convenios de Teclab**: hay "más de 200 empresas y organizaciones" y categoría "Gobiernos & ONGs". La lista de fuerzas armadas, policía y municipios **sólo existe en el documento interno**: no afirmarla.
- **Legislatura porteña y Senado de la Nación**: Teclab **no** tiene convenio con ninguno de los dos; **con ATE sí**. Lo confirmó la dirección el 03/08/2026 ante la consulta de un lead. Es de Teclab: para Siglo 21 no hay dato y ahí sigue contestando la respuesta general ("pasame el nombre del organismo y lo consulto").
- **Becas de Teclab: por el momento no hay.** Lo confirmó el administrador de Teclab el 04/08/2026. Contradice a `teclab.edu.ar/becas` y al FAQ comercial, que publican la Beca de Inclusión y la de mejor alumno de secundario: manda el administrador, que es más reciente y habla de lo que se puede ofrecer hoy. **Las dos versiones conviven**: en `becas` y en `becas-ayuda`, Teclab tiene primero la del administrador (aprobada, la que se manda) y detrás la oficial con las dos becas (sin revisar), para el día que vuelvan a abrirse o si el lead llega diciendo que las vio publicadas. Las cuatro llevan la contradicción anotada en `fuente`. Lo que sí se ofrece hoy: el descuento ya aplicado, las 6 cuotas y el convenio de la empresa u organismo.

## Cómo se cotiza

**Siglo 21.** El período A cobra Matrícula + Ticket A + Ticket B; desde el 2B, sólo Matrícula + Ticket B. Al aspirante nunca se le dice "ticket": es **primer período** y **segundo período**. Una matrícula por ciclo, y el ciclo cubre los dos períodos — hoy 2A + 2B; en 2027 arranca otro con 1A + 1B y matrícula nueva. El total es el del ciclo, no el de la carrera. Financiación: 6 cuotas con tarjeta.

**Teclab.** Matrícula + bimestre 2A + bimestre 2B. La matrícula es **cuatrimestral** (reglamento 4.1: "el pago de la matrícula y aranceles tienen una periodicidad cuatrimestral"), y el cuatrimestre son esos dos bimestres, de 9 semanas cada uno — 8 de cursada y 1 de repaso. Los descuentos por bimestre vienen como campo; el **50% off de matrícula que tienen algunas carreras no viene**: se deduce restando los descuentos de bimestre a `ahorroTotal`. `extraer-externos.mjs` controla que el desglose sume el total y, si no cierra, manda sólo el total y deja aviso.

**Regla dura**: toda respuesta que escriba un importe tiene que exigir `preciosVigentes`. Hay un test que recorre el corpus y falla si alguna no lo hace. Cuando la fuente queda vieja, el bot no cotiza: contesta que lo confirma.

## Reglas del corpus

- **No inventar.** Si el dato no está, la respuesta dice que se confirma. Cada respuesta lleva en `notas` de dónde salió.
- **Estados**: `aprobada`, `descartada`, `sin revisar`. Los decide una persona. Lo aprobado sale primero; lo descartado no sale nunca. **Si se cambia el texto de una respuesta aprobada, vuelve a `sin revisar`** — la aprobación era sobre el texto anterior. Ahora que se trabaja en la conversación, la aprobación es el "así está bien" del usuario sobre el mensaje que se le mostró: ahí se marca `aprobada`. Lo que se escribe por iniciativa propia queda `sin revisar`.
- **`institucion`**: la declara el archivo, y cada respuesta la repite. Una respuesta escrita en `teclab.json` es de Teclab, punto; ya no existe la respuesta que sirve para las tres.
- **`requiere` va en la respuesta, no en la intención.** Un `requiere` a nivel intención apaga la intención entera de esa casa, aunque tenga respuestas que sí podrían salir. Este error ya dejó mudas a `requisitos`, `cuotas`, `horarios` y `doble-titulacion`.
- Al agregar una respuesta a una intención existente, mirar **el orden**: entre dos sin revisar gana la que está antes en el array.

## Cobertura al 08/08/2026

Las tres arrancan con las mismas 47 intenciones: las 12 respuestas que eran universales se copiaron a los tres archivos, así que ninguna casa quedó muda por el corte.

| | Carreras | Intenciones sin respuesta | Aprobadas | Sin revisar |
|---|---|---|---|---|
| Universidad Siglo 21 | 65 | **0** | 16 | 54 |
| Teclab | 18 | **4** | 35 | 20 |
| Academia Identidad Argentina | 11 | **0** | 18 | 40 |

Las 4 de Teclab son estructurales, no huecos: `dos-carreras`, `titulo-exterior` y `titulo-terciario` no aplican, y `enviar-ficha` necesita la URL de cada carrera, que no está cargada. `doble-titulacion` dejó de estar en la lista sólo porque heredó la copia universal, que exige `{dobleTitulacion}` y ninguna carrera de Teclab lo trae: en la práctica sigue sin contestarse.

**Identidad se quedó con 4 copias universales, no con 12.** El 08/08/2026 se le sacaron 7 y se aprobaron las propias que quedaban solas. Las que le hablaban al lead como si la diplomatura fuera una carrera universitaria a distancia:

| Copia sacada | Qué decía de más | Contesta ahora |
|---|---|---|
| `duracion-a` | «es a distancia, vas manejando tus tiempos» | `duracion-identidad` |
| `horarios-a` | «no tiene horarios fijos de cursada» | `horarios-identidad` / `-sin-cronograma` |
| `equivalencias-a` | pedía plan de estudios y analítico para elevar | `equivalencias-identidad` |
| `inscripcion-a` | «te armo el legajo» | `inscripcion-identidad` (preinscripción + link de pago) |
| `requisitos-a`, `validez-a`, `doble-titulacion-a` | nunca se disparaban (descartadas o con un `requiere` que Identidad no cumple) | la propia de cada una |

Las 4 que quedan son las únicas de su intención y funcionan: `pedir-datos-a`, `no-entiendo-a`, `seguimiento-a` y `convenio-organismo-consulta`, más `pide-todo-sin-precio`, que es el respaldo para cuando el precio queda viejo. Dos detalles sin resolver: `seguimiento-a` cierra con «así no se te pasa la fecha de inscripción» y en Identidad se entra con la cursada empezada, y `convenio-organismo-consulta` afirma «convenios hay varios», que está documentado para Teclab y para Identidad no tiene fuente (ofrece chequear antes de confirmar, así que no promete nada falso).

Al revisar copias en las otras casas, mirar esto mismo: se escribieron pensando en Siglo 21, y hay que probarlas **con los contextos reales** — varias parecen rotas y en verdad nunca se disparan porque exigen un marcador que esa casa no tiene.

**Identidad Argentina sigue siendo el trabajo pendiente**: 40 respuestas sin revisar y ninguna fuente oficial procesada. Su sitio bloquea el scraping (robots + SPA); el material está en la carpeta del escritorio.

## Sin confirmar

- **Secundario incompleto en Siglo 21.** El reglamento 2026 pide "copia legalizada del certificado de estudios secundario completo" y no contempla excepciones. La vía de mayores de 25 está en la base de conocimiento del CAU y la respuesta la linkea, pero el reglamento no la respalda. **Título en trámite sí tiene respuesta** desde el 08/08/2026: el certificado de estudios en trámite vale un año como documentación provisoria, siempre que conste que no adeuda materias — o sea que adeudar materias sigue sin vía. Todo el detalle, con los plazos del legajo, en `ventas/requisitos.md`.
- **Financiación mensual.** No existe pago mensual: el reglamento compromete el pago por cuatrimestre o bimestre. Las 6 cuotas son financiación de tarjeta. Las consultas de "¿cuánto por mes?" siguen contestándose con el total.

## Trampas conocidas

- La solapa Revisar rellena los marcadores con la carrera elegida. Si la respuesta exige un dato que esa carrera no tiene, se muestra con otra **de la misma institución** y lo avisa. Antes cruzaba instituciones y mostraba Abogacía revisando Data Science.
- `finalAmounts` en el archivo de precios de Teclab **sólo existe** cuando lo generó el pipeline de Python. Con el extractor de una pasada hay que leer `prices`.
- El perfil profesional de las fichas viene como párrafo corrido y varias cierran con "Texto para enviar por mail": se corta en viñetas y se limpia en `generar-entrenador.mjs`.
