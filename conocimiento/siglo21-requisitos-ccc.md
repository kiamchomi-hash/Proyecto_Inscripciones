# Ciclos de Complementación Curricular (CCC) — títulos que habilitan

> **Fuentes:** KB del CAU, [Documentación de Legajo → Ciclo Complementario Curricular](https://kb-cau.21.edu.ar/bcsiglo21/servicio/informacion-para-gestiones/gestion-del-estudiante/g21_servicio_informacionparagestiones_gestiondelegajo)
> y la planilla que esa página linkea ([Google Sheets](https://docs.google.com/spreadsheets/d/1n5PRHBwxvLRSBWaJ0tHkcJbkj4NXAm2DkJHzl-Aj_WE/edit?gid=0#gid=0)).
> Psicopedagogía sale de su propia ficha del KB, que es la única que trae el listado adentro.
> **Verificación:** 09/08/2026, contra el KB en vivo.

Complementa [`requisitos.md`](siglo21-requisitos.md), que cubre el ingreso común. **Un
CCC no se ingresa desde el secundario**: hace falta un título previo, y la
carrera de base tiene que estar **terminada** — no sirve sumar años de dos
carreras distintas sin haber finalizado ninguna (KB, *Rebate de objeciones en
carreras de salud*).

> **Este archivo lo lee el bot.** Desde el 14/08/2026 los listados de acá salen
> tal cual en el mensaje de WhatsApp: `herramientas/ventas/titulos-ccc.mjs`
> parsea las secciones de abajo y arma los marcadores `{condicionCiclo}` y
> `{titulosHabilitantes}`, que usa la respuesta `requisitos-ciclo-titulos`. Un
> título por línea, con viñeta. Antes iba nada más el resumen del campo
> `requisitos` de la ficha, que nombra las áreas ("del área salud") pero ningún
> título, y había que abrir este archivo a mano para contestar si el del
> aspirante entraba.
>
> Lo que eso obliga al editar:
>
> - **El separador entre títulos es ` · `** y no se cambia: es por donde corta el
>   parseo. El párrafo que lleva las horas reloj es la condición y no se toma
>   por un listado, así que ese sí puede usarlo.
> - **Un encabezado antes de la lista se corta por los dos puntos** ("Del área
>   salud: …"). No meter dos puntos adentro de un título.
> - **El nombre de la sección no tiene por qué coincidir con el del KB**: los
>   empareja `nombres-carreras.mjs` (acá "Desarrollo", el KB "Desarrollos").
> - Si una sección queda sin listado, esa carrera se queda sin los marcadores y
>   el bot contesta el resumen de siempre. No sale una lista a medias.
> - **Un párrafo que arranca con `**Para el lead:**` sale tal cual en el mensaje**,
>   como `{condicionExtra}`. Es la única prosa de este archivo que se le manda a
>   un aspirante: el resto son notas internas y no se parsean. Se usa donde la
>   carrera pide algo más que el título, y se redacta pensando en quien lo va a
>   leer, no en quien atiende.
>
> El campo `requisitos` de `carreras/siglo21/datos/*.json` sigue siendo el
> resumen y **ahí no se pegan los listados**: 37 títulos corridos, sin
> separadores, vuelven ese mensaje ilegible (ya pasó con Psicopedagogía). Ojo
> que ese campo lo pisa una re-extracción del KB
> (`consultar-kb-siglo21.mjs`, `extraer-todas-carreras-kb.mjs`), que lo vuelve a
> dejar en `null` o con el texto crudo. Si eso pasa, se recarga desde acá.

## Lo que se evalúa

Tres cosas, siempre: la **denominación** del título, la **duración** y la **carga
horaria en horas reloj**. El mínimo de horas **cambia por carrera** — es el error
más fácil de cometer al contestar de memoria.

| Carrera | Duración mínima | Horas reloj |
|---|---|---|
| Educación | — | 1200 |
| Administración de Servicios de Salud | 2 años | 1400 |
| Emprendimiento | 2 años | 1400 |
| Desarrollo de Negocios Inmobiliarios | 2 años | 1400 |
| Psicopedagogía | 2 años | 1400 |
| Gerontología | 2 años | 1600 |
| Profesorado Universitario Nivel Secundario y Superior | 4 años | 2600 |

Si el **certificado analítico no consigna las horas**, se acreditan con una
constancia de horas cursadas emitida por la institución de origen, o con copia
legalizada de la Resolución Ministerial que aprobó el título. Ese papel es el que
destraba el legajo y conviene pedirlo desde el primer mensaje.

**Plazo:** la documentación se presenta **dentro del primer año de cursado**
(Escribanía es la excepción: 6 meses). No frena la inscripción, pero sin ella no
puede reinscribirse al período siguiente. El KB avisa que ya hubo **bajas
administrativas** por título habilitante faltante; la baja no es definitiva y se
revierte con una Reapertura de Legajo.

**Si el título del aspirante no figura con el nombre exacto pero se le parece,
no descartarlo**: lo que se evalúa es el plan de estudios y la carga horaria. Va
a consulta.

---

## Administración de Servicios de Salud

2 años · 1400 horas reloj.

Del área salud: Técnico/a Universitario/a en Gestión Administrativa de Servicios
de Salud · Analista Universitario en Administración de Establecimientos y
Servicios de Salud · Promotor de la Salud · Técnico/a Laboratorista
Universitario/a en Salud · Técnico/a Universitario/a de Administración en Salud ·
Técnico/a Universitario/a en Administración de Salud · Técnico/a Universitario/a
en Administración de Servicios de Salud · Técnico/a Universitario/a en Educación
para la Salud · Técnico/a Universitario/a en Emergencias de Salud · Técnico/a
Universitario/a en Gestión de Servicios de Salud · Técnico/a Universitario/a en
Informática Aplicada a la Salud · Técnico/a Universitario/a en Saneamiento y
Desinfección de los Servicios de Salud · Técnico en Estadísticas de Salud ·
Técnico en Gestión de Instituciones Universitarias del Área de la Salud · Técnico
Superior en Gestión de Mantenimiento en Instituciones de Salud · Técnico
Universitario en Administración de Organizaciones de la Salud · Técnico
Universitario en Estadísticas de Salud · Técnico Universitario en Gestión
Administrativa de Servicios de Salud · Técnico Universitario en Mantenimiento de
Establecimientos de Salud · Técnico Universitario en Promoción de la Salud ·
Técnico Universitario en Promoción y Protección de la Salud · Técnico
Universitario en Salud Ambiental · Técnico Universitario Promotor de la Salud ·
Técnico Universitario en Enfermería

**Fuera del área salud** (sorprende, pero están en el listado): Técnico/a
Universitario/a en Relaciones Laborales · Técnico/a Universitario/a en
Responsabilidad y Gestión Social · Técnico/a Universitario/a en Administración y
Gestión de Políticas Públicas · Técnico/a Universitario/a en Gestión del Clima
Laboral en la Organización · Técnico/a Universitario/a en Planificación Gerencial
· Técnico/a Universitario/a en Gestión de Recursos Humanos · Analista
Universitario/a en Mercado y Estrategias de Comercialización · Analista
Universitario/a en Administración Pública · Técnico/a Superior Universitario en
Comercialización · Técnico/a Superior Universitario en Administración de
Cooperativas y Mutuales · Técnico/a Superior Universitario en Recursos Humanos ·
Técnico/a Superior en Gestión Contable · Técnico/a Superior en Relaciones
Laborales

## Emprendimiento

2 años · 1400 horas reloj.

Martillero · Corredor Público y Corredor Inmobiliario · Técnico/a Universitario
en Administración y Gestión Tributaria · Técnico/a Universitario/a en Gestión de
Empresas Familiares · Técnico/a Universitario/a en Relaciones Laborales ·
Técnico/a Universitario/a en Responsabilidad y Gestión Social · Técnico/a
Universitario/a en Administración y Gestión de Políticas Públicas · Técnico/a
Universitario/a en Gestión de Moda · Técnico/a Universitario/a en Gestión de
Recursos Turísticos · Técnico/a Universitario/a en Gestión del Clima Laboral en
la Organización · Técnico/a Universitario/a en Marketing y Publicidad Digital ·
Técnico/a Universitario/a en Gestión Administrativa de Servicios de Salud ·
Técnico/a Universitario/a en Diseño y Animación Digital · Técnico/a
Universitario/a en Planificación Gerencial · Técnico/a Universitario/a en Gestión
de Recursos Humanos · Técnico/a Universitario/a en Administración Agraria ·
Técnico/a Universitario/a en Hotelería · Técnico/a Universitario/a en Comercio
Internacional · Técnico/a Universitario/a en Evaluación del Impacto Ambiental ·
Técnico/a Universitario/a en Publicidad · Técnico/a Universitario/a en Diseño
Gráfico · Técnico/a Universitario/a en Diseño Industrial · Técnico/a
Universitario/a en Diseño de Indumentaria y Textil · Analista Universitario/a en
Relaciones Públicas e Institucionales · Analista Universitario/a en Mercado y
Estrategias de Comercialización · Analista de Software · Analista Universitario/a
en Administración Pública · Técnico/a Superior Universitario en Comercialización
· Técnico/a Superior Universitario en Administración de Cooperativas y Mutuales ·
Técnico/a Superior Universitario en Recursos Humanos · Técnico/a Superior en
Venta Directa · Técnico/a Superior en Gestión Contable · Técnico/a Superior en
Gestión de la Empresa Agraria · Técnico/a Superior en Gestión Hotelera ·
Técnico/a Superior en Gestión y Marketing de Moda · Técnico/a Superior en
Periodismo y Nuevas Tecnologías · Técnico/a Superior en Planificación y
Organización de Eventos · Técnico/a Superior en Programación · Técnico/a superior
en Redes Informáticas · Técnico/a Superior en Relaciones Laborales

## Desarrollo de Negocios Inmobiliarios

2 años · 1400 horas reloj. **Condición extra**: la planilla agrega "y cumplir con
las materias de Universitario 21" — es la única de las cinco columnas que lo
pide. Además la ficha del KB suma *ser mayor de edad* y *poseer título
secundario*.

**Para el lead:** se pide ser mayor de edad, tener el secundario completo y
cursar las materias de Universitario 21.

Corredor/a de Comercio y Martillero/a Público/a · Corredor de Comercio, Corredor
Inmobiliario y Martillero Público · Corredor Inmobiliario y Martillero Público ·
Corredor/a Inmobiliario/a · Corredor Publico Inmobiliario · Martillero/a
Público/a, Corredor/a y Administrador/a de Consorcios · Martillero/a Público/a y
Corredor/a de Comercio · Martillero/a Público/a y Corredor/a Inmobiliario ·
Martillero/a y Corredor/a Público/a · Martillero/a y Corredor/a Público/a e
Inmobiliario/a · Martillero, Corredor Público y Corredor Inmobiliario ·
Martillero, Corredor Publico y Tasador · Martillero Publico · Martillero Publico,
Corredor (Inmobiliario y Mobiliario) Administrador de Consorcios y Tasador ·
Martillero Publico, Corredor y Administrador de Consorcio · Martillero Público y
Corredor Inmobiliario · Martillero y Corredor de Comercio · Martillero y Corredor
Público Rural · Martillero y Corredor Universitario · Tasador, Martillero Publico
y Corredor · Tasador, Martillero Público y Corredor Rural · Tasador y Martillero
Publico · Técnico/a en Martillero/a Público/a y Corredor/a Inmobiliario/a ·
Técnico/a Superior Universitario/a de Martillero Público y Corredor · Técnico/a
Universitario/a en Martillero/a Público/a · Corredor/a y Administrador/a de
Consorcios · Técnico/a Universitario/a en Tasación, Martillero/a Público/a y
Corredor/a · Técnico Superior Universitario de Martillero Público y Corredor ·
Técnico Universitario de Subastador y Martillero Publico · Técnico Universitario
en Martillero Público y Corredor · Técnico en Corretaje Inmobiliario · Técnico en
Negocios Inmobiliarios · Técnico Universitario de Tasador y Corredor Inmobiliario
· Técnico Universitario en Corretaje Inmobiliario · Técnico en Administración de
Propiedades · Martillero/a, Corredor/a Público/a y Corredor/a Inmobiliario/a ·
Procurador/a · Técnico/a Universitario/a en Administración de la Propiedad
Horizontal y Conjuntos Inmobiliarios · Técnico/a Universitario en Administración
y Gestión Tributaria · Técnico/a Universitario en Gestión Contable e Impositiva ·
Técnico/a Universitario/a en Planificación Gerencial · Técnico/a Superior en
Gestión Contable · Técnico/a Universitario/a en Administración · Analista en
Administración

## Psicopedagogía

2 años · 1400 horas reloj. **Condición adicional**: entre la formación de base y
el ciclo, el total tiene que ser **igual o superior a 4 años y 2600 horas reloj**.
Es la única que declara ese piso combinado.

**Para el lead:** entre la carrera previa y el ciclo, el total tiene que llegar a
4 años y 2600 horas reloj.

Título con reconocimiento oficial y validez nacional de: Psicopedagogo/a ·
Profesor/a en Psicopedagogía · Profesor/a en Ciencias de la Educación · Profesor
en Psicología · Profesor Superior en Psicopedagogía · Técnico Superior en
Psicopedagogía · Técnico/a Universitario/a en Psicopedagogía · Técnico/a Superior
en Psicopedagogía · Profesor de/en Psicopedagogía · Asistente Psicopedagógico ·
Auxiliar Psicopedagógico · Técnico en Psicopedagogía · Profesor en Psicopedagogía
· Técnica Universitaria en Psicopedagogía · Asistente en Psicopedagogía ·
Asistente Psicopedagógico Universitario · Profesor/a en/de Psicopedagogía ·
Profesor/a de Psicopedagogía **u homólogos**

## Gerontología

2 años · 1600 horas reloj. Es la lista más corta de todas.

Enfermero · Trabajador Social · Terapista Ocupacional · Técnico en Gerontología
y/o Técnico Universitario en Acompañamiento, Cuidado y Asistencia al Adulto Mayor

**Dos casos ya resueltos** (KB, objeciones en carreras de salud): el título de
**podología no califica**. El de **paramédico** depende de la carga horaria y lo
evalúa la asesora de la carrera, no se contesta desde el CAU.

## Educación

1200 horas reloj. Título de **profesor**, con la certificación de las 1200 horas
en el analítico, el plan de estudios o la resolución ministerial.

No hay listado de denominaciones: alcanza con que sea un profesorado.

## Profesorado Universitario para Nivel Secundario y Superior

4 años · 2600 horas reloj. Dos vías:

1. **Título de Nivel Superior** de una carrera de 4 años o más, con carga horaria
   mínima de 2600 horas reloj.
2. **Título previo + un CCC** que, sumados, lleguen a 4 años y 2600 horas reloj.

El título previo tiene que decir expresamente **"Licenciado/a"** y venir de
institución autorizada: esa condición es la que garantiza los 4 años y las 2600
horas.

## Contradicción anotada, sin resolver

La prosa del KB dice que "es condición necesaria poseer título de **Técnico/a
Universitario/a**", pero los listados incluyen títulos que **no** son
universitarios — Técnico/a Superior en Gestión Contable, Técnico/a Superior en
Relaciones Laborales, Promotor de la Salud, Técnico Superior en Gestión de
Mantenimiento en Instituciones de Salud. El listado es más ancho que la prosa.

Aparte, el sitio público de Administración de Servicios de Salud resume el
requisito como "título superior relacionado con gestión, administración o
servicios de salud", lo que deja afuera los de RRHH, comercialización y gestión
contable que sí están en el listado. **La versión pública es un resumen, no el
criterio.**

Ante un caso terciario no universitario: consultar antes de afirmar.
