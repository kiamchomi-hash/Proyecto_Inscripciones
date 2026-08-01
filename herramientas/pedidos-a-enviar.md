# Pedidos a enviar

Los pendientes que no son trabajo nuestro: dependen de que un tercero conteste.
Están redactados para copiar y pegar. Cuando llegue la respuesta, lo que hay que
hacer con cada dato está en `PENDIENTES.md`.

Última revisión: 2026-08-01

---

## 1 · A Universidad Siglo 21

**Para:** el contacto de sede / referente académico del CAU
**Asunto:** Consultas de oferta académica — CAU Villa Lugano (sitio y atención a aspirantes)

> Hola, ¿cómo estás?
>
> Les escribo desde el CAU Villa Lugano. Estamos manteniendo al día la información
> que publicamos en nuestro sitio y la que usamos para responderle a los aspirantes,
> y nos quedaron cinco cosas que no pudimos confirmar por fuentes públicas.
>
> **1. Plan de estudios de la Tecnicatura Universitaria en Estadística Aplicada y Análisis Avanzado.**
> No encontramos el plan por ningún lado: no está el PDF en `contenidos.21.edu.ar`,
> no tiene página en el sitio ni figura en el sitemap. ¿Nos lo pueden pasar? Y de
> paso: ¿está abierta la inscripción o todavía no?
>
> **2. Cinco carreras sin página pública.** No tienen ficha en 21.edu.ar y no
> sabemos si siguen en la oferta vigente:
>
> - Licenciatura en Administración Pública
> - Licenciatura en Agroinformática
> - Licenciatura en Responsabilidad y Gestión Social
> - Tecnicatura Universitaria en Estadística Aplicada y Análisis Avanzado
> - Tecnicatura Universitaria en Negocios Agroecológicos
>
> Si siguen vigentes, necesitaríamos de cada una el plan de estudios y la
> resolución o disposición que le da validez oficial al título. Si ya no se
> dictan, avisennos y las sacamos.
>
> **3. Un enlace roto del lado de ustedes.** En el índice de carreras y programas
> figura el link a Licenciatura en Administración, pero
> `21.edu.ar/carreras-y-programas/licenciatura-en-administracion` devuelve 404
> (la que funciona es la que lleva tilde en la URL). Lo dejamos por las dudas.
>
> **4. Fecha exacta de inicio del segundo período (2B).** Tenemos confirmado que
> el 2A arranca el 3 de agosto, pero del 2B sólo sabemos que es en octubre.
> Necesitamos el día para poder cerrar inscripciones sin dar una fecha aproximada.
>
> **5. Dos consultas que nos hacen seguido y no queremos responder de memoria:**
>
> - ¿Hay algún programa de becas vigente además del descuento por beneficio?
>   Se mencionan programas por situación socioeconómica y por rendimiento, pero
>   no tenemos nada confirmado por escrito.
> - ¿Cuáles son las condiciones para cursar dos carreras en simultáneo? Sabemos
>   que hay requisitos de avance académico, pero no cuáles.
>
> Cualquier cosa que puedan pasarnos por escrito nos sirve: preferimos decirle al
> aspirante "lo confirmo y te aviso" antes que arriesgar un dato.
>
> Gracias!

**Cuando conteste, qué hacer con cada cosa:**

| Respuesta | Dónde va |
|---|---|
| Plan de Estadística Aplicada (132) | slide de plan + `update carreras set proximamente = false where id = 132` |
| Estado de las 5 carreras | si no se dictan, `activa = false`; si sí, cargar plan y resolución |
| Resoluciones que falten | campo `resoluciones` en `datos/carreras/*.json` del KB |
| Fecha del 2B | corpus del bot + planilla de precios |
| Becas y doble carrera | corpus del bot (hoy contesta "lo confirmo y te aviso") |

---

## 2 · A Teclab

**Para:** el contacto comercial de Teclab (0810-888-9900 / el referente de convenios)
**Asunto:** Curso de Actualización Profesional en IA — datos para publicarlo

> Hola, ¿cómo va?
>
> Les escribo desde el CAU Villa Lugano de Universidad Siglo 21. Ya publicamos en
> nuestro sitio el **Curso de Actualización Profesional en Inteligencia Artificial**
> con lo que figura en la landing (cuatro semanas, online en vivo, los cuatro ejes
> de contenido y el certificado oficial), pero hay cuatro datos que la landing no
> trae y que nos están frenando para venderlo:
>
> 1. **Precio y formas de pago.** Es el primero que nos preguntan y hoy no lo
>    podemos responder.
> 2. **Fecha de inicio de la próxima cohorte**, y cada cuánto se abre una nueva.
> 3. **El detalle de los cuatro encuentros.** Tenemos los cuatro ejes generales,
>    pero no qué se ve en cada semana. Al que consulta le sirve para decidir.
> 4. **Material gráfico propio del curso**, si tienen: fotos o piezas que podamos
>    usar en la ficha. Hoy estamos usando imágenes genéricas.
>
> Y una consulta aparte: ¿el curso tiene algún requisito de ingreso, o está
> abierto a cualquier persona interesada?
>
> Gracias!

**Cuando conteste, qué hacer con cada cosa:**

| Respuesta | Dónde va |
|---|---|
| Precio y formas de pago | KB del bot (`carreras-externas.json`) — hoy no lo puede cotizar |
| Fecha de inicio | KB del bot y la ficha |
| Detalle de los 4 encuentros | columna `plan_estudios` de la carrera 235, **con viñetas** (el formato "Primer Año \| 1er cuatrimestre" es sólo para las tecnicaturas) |
| Fotos | pisar `public/imagenes/teclab/carreras/curso-ia.webp` y `curso-ia-cierre.webp` |
| Requisitos de ingreso | KB del bot |
