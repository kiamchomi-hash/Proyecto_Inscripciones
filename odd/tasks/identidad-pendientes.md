# Identidad Argentina — pendientes de diseño y separación

Fecha: 26/11/2026.
Estado: la Academia vive en `https://topykly.com` con el Worker
`cau-identidad-20261126`, la misma D1 y el mismo código que el CAU. El dominio
ya está separado, pero el código sigue dentro de `proyecto-cau`.

## 1. Footer — rehecho el 26/11/2026

- Quedó un pie propio de columnas: marca, Navegación, Contacto y Modalidad, con
  un filete vertical simple en escritorio y dos columnas centradas en mobile.
  Sin CTA duplicados: la barra fija sigue siendo la acción principal.
- No nombra Villa Lugano, el CAU ni Siglo 21. El WhatsApp va en verde y los
  enlaces no se ponen amarillos al pasar el puntero.
- Capturas de control: `screenshots/topykly-footer-columnas2.png` y
  `screenshots/topykly-footer-mobile-centrado.png`.

## 2. Formulario

- Mejorar el formulario de preinscripción de Identidad: hoy es el mismo
  componente de tres casas con los campos de la Academia.
- Relevar en escritorio y celular, acortar lo que no se use, revisar el orden de
  los campos, el copy de ayuda y el paso a WhatsApp.
- Mantener el registro en la misma D1 y el aviso por el outbox.

## 3. Modales — rehechos el 26/11/2026

- El cierre («Estudiá con nosotros») se dejó igual: era el que funcionaba.
- Portada: los objetivos dejaron de ser tarjetas con filo amarillo y se leen
  como lista con viñeta azul; los tres datos (escuela, duración, certificación)
  pasaron a una fila con filete arriba en vez de tres cajas, y la de la escuela
  ya no va llena de amarillo. El slide se centra en el alto cuando sobra aire.
- Plan: una sola superficie de lectura. El índice del escritorio perdió las
  cajas (el activo se marca con fondo y filo azul) y los módulos se separan con
  filetes; en el celular scrollea el slide completo, sin tarjeta dentro de
  tarjeta. Las masterclases conservan el rótulo amarillo.
- Pie del modal: se fue el campo con la URL -ocupaba un renglón entero en el
  teléfono y repetía lo que hace «Compartir»-. Quedó una fila: compartir,
  WhatsApp con borde verde e «Inscribite ya» lleno en azul.
- Capturas de control: `screenshots/topykly-modal-portada.png`,
  `topykly-modal-plan.png` y sus versiones `-mobile`.

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
