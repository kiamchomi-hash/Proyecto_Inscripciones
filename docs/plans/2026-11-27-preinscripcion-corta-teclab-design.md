# Preinscripción corta de Teclab y «Generá tu usuario de Teclab»

Aprobado el 27/11/2026.

## Objetivo

La preinscripción de Teclab pasa a ser corta, con lo justo para hacer la
vinculación. El formulario largo actual se conserva como formulario para generar
el usuario (legajo) de Teclab.

## Preinscripción corta

- Campos: nombre, apellido, mail, teléfono, provincia y carrera.
- La provincia es un desplegable con las 23 opciones del formulario de
  vinculación de Teclab (HubSpot, portal 5880041, form
  `a19c1564-e23a-475c-a16a-11aa244c1b9e`, campo `provincia`). Los valores son los
  de `PROVINCIAS_HUBSPOT` en `components/formularios/casas.ts`; se muestran con
  acentos (Córdoba, Entre Ríos, Neuquén, Tucumán). CABA no va aparte: es
  «Buenos Aires».
- Todos los «Quiero inscribirme» de Teclab siguen apuntando a `#preinscripcion`,
  que ahora es el formulario corto.
- Se guarda en `consultas` (columna `provincia`, ya existente) con el aviso de
  Telegram de siempre. Sin migración.

## «Generá tu usuario de Teclab»

- Son los campos actuales de la preinscripción de Teclab, sin cambios.
- Va debajo del corto, con ancla propia `#usuario-teclab`.
- Se guarda en `consultas` con un tipo propio, para que en Telegram y en D1 se
  distinga de una preinscripción.
- No lleva enlace al portal oficial de Teclab.

## Dónde aparece

| Página | Corto | Largo |
| --- | --- | --- |
| `/teclab` | sí | sí |
| `/carreras/[slug]` (carrera de Teclab) | sí | sí |
| Home general, al elegir una carrera de Teclab | sí | no |
| `/teclab/inscripcion` | sí | no |
| `/carreras/[slug]/inscripcion` (carrera de Teclab) | sí | no |

El formulario de contacto de Teclab no cambia. Siglo 21 e Identidad no cambian.

## Verificación

- Pruebas de campos por casa en `tests/` y de `/api/formularios` en
  `cloudflare/tests/`.
- Recorrido en local de los dos formularios en `/teclab` y en una ficha de
  Teclab, en escritorio y en celular, sin enviar consultas de prueba a
  producción.
- Revisión final con `revision_go` (toca formularios).
