# Un contacto y una preinscripción por casa

Fecha: 2026-08-23

## Por qué

El sitio tiene dos casas con oferta propia —Siglo 21 y Teclab— y hoy sólo
Teclab tiene sus dos formularios. La home ofrece un contacto general y ninguna
preinscripción.

Identidad Argentina queda afuera de este diseño: esa oferta se migra a otro
sitio web. Hasta que la migración ocurra, sus diplomaturas siguen apareciendo
en el catálogo de la home y en el buscador del formulario de contacto, pero no
tienen formulario de preinscripción ni página propia.

El detonante inmediato fue otro: el 23/08 el endpoint empezó a escribir columnas
que no existían y dejaron de entrar **todas** las consultas del sitio. La causa
de fondo es que cada formulario nuevo se escribió copiando el anterior, sin un
lugar único que declarara qué campos existen. Este diseño ataca las dos cosas.

## Las dos casas

| | Siglo 21 | Teclab |
|---|---|---|
| Dónde | `/` (home) | `/teclab` |
| Oferta | Grado, Grado (CCC), Pregrado | Teclab Tecnología / Gestión / Curso |
| Marca | verde `--color-highlight` | cian `#2ee7d7` / violeta `#8e2cf2` |

## Los dos formularios

### Contacto — idéntico en las dos

Carrera, tipo, modalidad, nombre, apellido, localidad, y mail o teléfono (al
menos uno). Por casa cambian sólo dos cosas: qué carreras ofrece el buscador y
el checkbox de equivalencias, que es exclusivo de Siglo 21 (Teclab no acredita
equivalencias).

El de la home sigue ofreciendo **toda** la oferta del sitio, Identidad incluida:
es la puerta general y mientras esas diplomaturas se dicten acá tienen que poder
consultarse.

### Preinscripción — cada casa pide lo suyo

**Teclab** es la referencia y no se toca. Es el juego que ya está en producción:

- Personales: nombre, apellido, DNI, sexo, fecha de nacimiento, lugar de
  nacimiento, nacionalidad, estado civil.
- Domicilio y estudios: calle, número, piso, depto, código postal, localidad,
  nivel de estudios, colegio, localidad del colegio, medio de pago.
- Contacto: mail, teléfono.

**Siglo 21** hereda ese juego entero y suma tres campos: `país de residencia`,
`barrio` y `equivalencias`. Es el legajo más pesado —el ingreso pide DNI,
solicitud firmada, fotos y ficha médica— así que no recorta nada.

La preinscripción de la home ofrece **sólo carreras de Siglo 21**. Quien quiera
preinscribirse a Teclab va a `/teclab`; para una diplomatura de Identidad, el
camino sigue siendo el contacto.

## Arquitectura

Un solo componente parametrizado, no cuatro copias.

- `components/formularios/casas.ts` — la fuente de verdad. Por casa: marca,
  niveles de su oferta, y la lista de campos de cada modo. Agregar una casa o
  mover un campo es editar esta lista.
- `components/formularios/formulario-lead.tsx` — un componente, dos modos
  (`contacto` y `preinscripcion`). Reemplaza a `ContactForm` y `EnrollmentForm`,
  que hoy son dos gemelos de 848 líneas en un archivo.
- Los campos sueltos (`CampoTexto`, `CampoSelect`) ya existen y se reusan.
- La marca sigue saliendo por variables CSS, como ahora.

`tests/security.test.mjs` sigue valiendo sin cambios: nada escribe directo en
Supabase, todo pasa por `POST /api/formularios`.

## Base de datos

Un solo SQL, `sql/2026-08-23_consultas_preinscripcion.sql`:

- Las 7 columnas que faltan y hoy rompen el insert: `direccion_numero`,
  `direccion_piso`, `direccion_departamento`, `nivel_estudios`, `colegio`,
  `colegio_localidad`, `medio_pago`.
- Las 2 del discriminador: `casa` y `tipo_formulario`.

`pais_residencia` y `barrio` **ya existen** en la tabla y no las escribe nadie;
el legajo de Siglo 21 las empieza a usar.

Dos columnas de la tabla se llaman distinto de lo que el endpoint escribía:
son `localidad_nacimiento` (no `lugar_nacimiento`) y `direccion` (no
`domicilio`). Eso se arregla en el endpoint, no en la base.

Con `casa` y `tipo_formulario` cargados, la Edge Function `notificar` encabeza
el aviso de Telegram con "PREINSCRIPCIÓN — Teclab" o "Consulta — Siglo 21", y
el panel puede filtrar.

## Fuera de alcance

- **La migración de Identidad Argentina a otro sitio.** Es un trabajo aparte.
  Cuando ocurra, acá hay que sacar la categoría del catálogo, el `ia-modal`,
  las diplomaturas del buscador del contacto y sus URLs del sitemap.
- El corpus de Teclab (`ventas/corpus/teclab.json`, intención `inscripcion`)
  dice que alcanzan cuatro datos y en la práctica se pide el legajo completo.
  Está desactualizado y hay que corregirlo, pero no es parte de esto.
