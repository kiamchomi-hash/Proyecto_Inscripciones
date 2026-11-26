# Identidad Argentina — pendientes de diseño y separación

Fecha: 26/11/2026.
Estado: la Academia vive en `https://topykly.com` con el Worker
`cau-identidad-20261126`, la misma D1 y el mismo código que el CAU. El dominio
ya está separado, pero el código sigue dentro de `proyecto-cau`.

## 1. Footer

- Rehacer el footer mobile de Identidad. Hoy es un pie propio y compacto
  (marca, enlaces, modalidad, teléfono y copyright) para no arrastrar el pie del
  CAU, pero el usuario lo sigue considerando mejorable.
- No debe nombrar Villa Lugano, el CAU ni Siglo 21, ni repetir los CTA que ya
  están en la barra fija.
- Revisar los hovers: nada de texto amarillo; el WhatsApp va en verde y la
  preinscripción sigue siendo la acción principal.

## 2. Formulario

- Mejorar el formulario de preinscripción de Identidad: hoy es el mismo
  componente de tres casas con los campos de la Academia.
- Relevar en escritorio y celular, acortar lo que no se use, revisar el orden de
  los campos, el copy de ayuda y el paso a WhatsApp.
- Mantener el registro en la misma D1 y el aviso por el outbox.

## 3. Modales

- Mejorar los modales de las fichas de Identidad. Ya se sacó el slide del
  profesor y quedó detalle + plan + cierre; falta revisar jerarquía, alturas,
  tipografía, navegación y el CTA de inscripción.
- Relevar primero en escritorio y celular antes de tocar, como en Teclab.

## 4. Separar Identidad de Siglo 21 en el escritorio

- Mover todo lo de Identidad a una carpeta propia del escritorio, fuera de
  `proyecto-cau`, para que no se mezcle con Siglo 21 ni con el CAU.
- Definir el alcance: si la carpeta nueva se lleva sólo el Worker de topykly y
  los componentes de Identidad, o si se duplica el paquete compartido. Evaluar
  el costo de mantener dos copias de `components/`, `lib/` y los estilos.
- La carpeta nueva necesita su propio `package.json`, build, configuración de
  Wrangler, D1/colas y forma de publicar. No mezclar el deploy de Identidad con
  el del CAU.
- Hacerlo recién cuando el usuario lo autorice; por ahora queda anotado como
  pendiente.

## Operación

El Worker de Identidad se publica a mano con
`npm run publicar:identidad:produccion` porque el workflow de GitHub sólo
despliega el Worker del CAU. Para que un push actualice también topykly falta
un token acotado a la zona `topykly.com` (Workers Scripts:Edit y Workers
Routes:Edit) y un paso en el workflow.

## Decisiones vigentes

- Identidad Argentina es una marca independiente: no se nombran Villa Lugano,
  el CAU ni Universidad Siglo 21 en la página.
- La oferta publicada es sólo la de la web oficial de la Academia.
- No crear una ruta `/identidad` en el sitio del CAU.
