---
name: piezas-para-el-publico
description: "Escribir el contenido de cualquier pieza que va a ver alguien más — video institucional o de redes, folleto, placa, flyer, landing, presentación. Usar DESDE EL PRIMER TEXTO que se escribe, no al final: al armar una escena, una tarjeta, un rótulo, un título o una bajada, y al editar cualquiera de ellos. Fija dónde va cada cosa: en pantalla sólo lo que le sirve a quien mira; el pendiente, el criterio de armado y la fuente del dato van en el mensaje al usuario o en un comentario de código, nunca en los datos que se renderizan. Fija además los pisos de forma que ninguna decisión estética puede cruzar: contraste del texto de lectura, peso de la acción principal, color de plataforma y números que son afirmaciones."
---

# Lo que se ve en pantalla es para quien mira

Regla única, de la que salen todas las demás:

> Cada palabra que se renderiza está dirigida a quien mira la pieza. Todo lo
> demás —lo que falta, cómo se eligió, de dónde salió— va en el mensaje al
> usuario o en un comentario de código. Nunca en el dato.

Esto se aplica **mientras se escribe**, no revisando después. Al tipear cada
texto, la pregunta es: *¿esto se lo digo a quien mira, o me lo estoy diciendo a
mí?*

En este proyecto se renderizaron dos veces notas internas que llegaron al video
terminado. Las dos se escribieron sin mala intención, en el momento de armar la
escena.

## Ajustar el texto al gusto visual del usuario

Cuando la pieza también se diseña, leer `~/Desktop/uiverse/LEER.md` y consultar
primero **★ Mías**. Usar tres o cuatro referencias pertinentes para calibrar el
presupuesto de texto: cuánto ocupa el título, cuántos niveles de lectura admite
la composición, cómo se rotulan los bloques y cuánto aire necesita el CTA.

UIverse orienta la densidad y la forma de presentar el contenido; no autoriza a
inventar datos, copiar frases de una referencia ni convertir una decisión de
diseño en texto visible. El brief explícito, la voz de la marca y la utilidad
para quien mira siguen mandando. La skill visual activa decide la estética; esta
skill hace que el contenido entre en ella sin perder claridad ni verdad.

## Dónde va cada cosa

| Qué es | Dónde va | Dónde NO va |
|---|---|---|
| Falta un dato | Mensaje al usuario, diciendo qué se necesita | Un `PENDIENTE` en el campo |
| Criterio de selección | Comentario de código | El rótulo de la sección |
| De dónde salió el dato | Comentario de código | Un pie de página en la pieza |
| Dato sin confirmar | Se omite, y se avisa | Escrito como si fuera cierto |

## Las cuatro fugas, al escribirlas

### 1. La instrucción del prompt como copy

El pedido fue *"destacá las fuertes de cada área"* y se escribió como rótulo
**"Una fuerte de cada área"**. Quien mira no tiene por qué leer el criterio con
que se armó el contenido.

El rótulo nombra **qué se muestra**: `Universidad Siglo 21`. El criterio, si
vale la pena registrarlo, va arriba en el código:

```js
/* Se destaca una carrera fuerte por área en vez del ranking de búsquedas:
   el ranking lo domina Martillero y deja afuera Abogacía y Contador. */
export const carrerasSiglo = [ ... ];
```

### 2. El dato que falta

La escena de consultorios se armó sin profesiones, horarios ni precio, y se
escribió `detalle: "PENDIENTE: profesiones, horarios y precio"`. Eso se
renderizó. En una pieza que ve el jefe no se lee como "falta un dato": se lee
como que está sin terminar.

Al escribir el dato faltante, **no se escribe nada**. El campo se omite y el
marcado lo contempla:

```js
// El campo `detalle` aparece cuando el dato exista. No se pone un marcador:
// lo que está en los datos se renderiza.
export const espacios = [
  { nombre: "Consultorios", icono: "consultorio" },
  { nombre: "Salas de reunión", icono: "sala" }
];
```

```jsx
{e.detalle ? <div className="detalle">{e.detalle}</div> : null}
```

Y en el mensaje al usuario: *"la escena de consultorios muestra sólo los
nombres; para completarla necesito profesiones, horarios, capacidad y precio"*.

### 3. Vocabulario interno

Códigos de período (`2A`, `2B`), de nivel (`CCC`, `APLV`), `slug`, `prefix`,
`curso_id`. Y el detalle de cómo se armó: "Search Console", "impresiones",
"CTR", "Supabase", "demanda real de búsqueda".

En su lugar va el equivalente humano: la fecha de inicio de clases en vez del
código de período, el nombre de la carrera en vez del slug.

### 4. Rellenar un espacio vacío

Un hueco en la composición tienta a completarlo. El título de consultorios
quedó como *"El CAU se alquila por hora o por turno"* — esa modalidad nunca
estuvo confirmada.

Si no está confirmado, no se afirma. Se reformula a lo que sí se sabe
(`Espacios en alquiler en la sede`) o se saca y se rediseña la escena para el
contenido que hay.

## Los pisos de la pieza

Lo de arriba cuida **qué** se dice. Esto cuida que la forma no se lo coma. Salió
de un caso concreto: el rediseño de la página de ubicación de la sede volvió más
coherente y peor en su trabajo — el texto bajó de `#c8dedd` a `#9fbdb5`, el botón
sólido de WhatsApp se volvió un enlace fino, y los números pasaron a ser
decoración en serif liviana. Las tres eran decisiones estéticas defendibles y las
tres le sirvieron peor a quien leía.

Por eso son **pisos, no preferencias**. Se cruzan sólo si el usuario lo pide.

- **El texto de lectura no queda más callado que el que reemplaza.** Ni más
  chico, ni con menos contraste. Si lo que había pasaba el chequeo de contraste
  y lo nuevo no, es una regresión por linda que se vea en la captura.
- **La acción principal sigue siendo un control sólido.** El enlace con
  subrayado fino es para lo secundario. «Un solo acento» decide *cuál* color se
  repite, nunca si la acción principal todavía parece apretable.
- **El color de una plataforma es información.** El verde de WhatsApp, el azul
  de un mapa: la gente los encuentra por color antes de leer la etiqueta. Se
  puede aplanar la forma; no se los repinta con la paleta.
- **Un número que es una afirmación va con peso.** Un dato que le estás pidiendo
  a alguien que crea se lee como afirmación, no como ornamento.
- **Aire no es lo mismo que espacio.** Mirá la altura final y el ancho que el
  texto ocupa de verdad. Más scroll y una columna muerta al lado de cada sección
  es una pieza peor, no una más calma.

**La referencia da el tono, no el encargo.** Un portfolio de estudio aguanta casi
monocromo y rótulos de 14px porque lo mira otro diseñador, en una laptop,
navegando. La composición se trae; el contraste, el peso de los controles y los
cuerpos se vuelven a decidir contra **este** lector y contra lo que vino a hacer.
Decí quién es antes de empezar, y revisá la pieza terminada contra eso.

## Antes de renderizar

Verificación mecánica, para lo que se haya escapado:

```bash
node .claude/skills/piezas-para-el-publico/scripts/verificar-textos.mjs src/
```

Extrae sólo las cadenas que terminan en pantalla —nodos de texto del marcado y
los campos que son copy (`titulo`, `nombre`, `detalle`, `linea`, `kicker`…)— e
ignora rutas, colores, clases y comentarios. Sin flags lista **todos** los
textos visibles; con `--solo-avisos`, únicamente los que matchean un patrón
conocido. Sale con código 1 si marcó algo.

**Los patrones agarran lo obvio; la instrucción del prompt disfrazada de rótulo
casi siempre los pasa.** Por eso conviene leer el listado completo.

Además, en una pieza que reusa material de otra casa:

- **Cortar antes de su CTA.** Los videos de Teclab e Identidad terminan con
  **su** teléfono y **su** web; la pieza del CAU cierra con los datos del CAU.
- **Confirmar que la oferta esté vigente.** Las carreras dadas de baja no se
  nombran, y las de Identidad Argentina rotan: se consultan a su API antes de
  listarlas.
