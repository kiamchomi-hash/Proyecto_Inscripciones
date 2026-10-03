# «Ver precio» con registro liviano y newsletter (Teclab)

Tareas 24 y 25 de `PENDIENTES.md`, alcance Teclab.

## Objetivo

En el último slide del modal de Teclab, un botón «Ver precio» abre una ventana con dos opciones: dejar nombre y mail (con checkbox de newsletter) y ver el precio ahí mismo, o hablar por WhatsApp. Además, los formularios que piden mail suman el checkbox de newsletter. Después, la tarea 25: ocultar la ubicación en los slides.

## Decisiones

- Registro liviano, sin cuentas ni contraseñas (usuario, 02/10/2026).
- El precio no puede estar en un lugar público: si viaja en el HTML o en una tabla legible por `anon`, el registro es decorativo. Va en una tabla privada y lo devuelve la API recién después de registrar el lead.
- El precio tiene vigencia (la de la promoción). Vencido, la ventana no lo muestra y ofrece WhatsApp. Al 02/10/2026 los precios cargados vencieron el 01/10.
- El registro entra como una consulta más (`consultas`, casa Teclab), así llega el aviso por Telegram como cualquier lead. El checkbox además guarda en `suscripciones_newsletter` (tabla ya creada el 16/09/2026; el código de aquel intento se revirtió).
- Todo pasa por `POST /api/formularios` (Turnstile + rate limit + service role), como manda el modelo de seguridad.

## Tareas

- [ ] T1. (escrito, falta correrlo) SQL: tabla privada de precios por carrera (conceptos, total, vigente hasta), sin acceso de `anon`/`authenticated`, escribible por `cau_editor`. Lo corre el usuario en el SQL Editor.
- [x] T2. Publicar los precios de Teclab en esa tabla desde el pipeline local de precios, con su vigencia.
- [x] T3. API: registro de «ver precio» en `/api/formularios`; devuelve el precio vigente o avisa que venció. Tests.
- [x] T4. UI: botón «Ver precio» y ventana en el último slide del modal de Teclab.
- [ ] T5. (código hecho, falta correr `sql/2026-10-02_newsletter_general.sql`) Checkbox de newsletter en los formularios que piden mail.
- [ ] T6. Tarea 25: ocultar la ubicación en los slides.
- [ ] T7. Pedido del usuario (03/10/2026, corregido): «Ver precio» tiene que ser otro slide del carrusel del modal de Teclab, no una ventana encima. El aviso de inicio queda en el slide de cierre.
- [ ] T10. Revisar con el usuario que la newsletter sea correcta (qué se guarda, consentimiento y casilla marcada por defecto).
- [ ] T8. Pedido del usuario (03/10/2026): en el resultado de «Ver precio», mostrar la financiación general vigente de Teclab (placa «Opciones de financiación» del período: Visa/Mastercard en 3 cuotas con interés según banco, Naranja X Plan Z en 3 sin interés, GoCuotas y WiBond hasta 6 sin interés, AMEX según emisor). Con CFT visible, como pide la normativa de publicidad de financiación.
- [ ] T9. Pedido del usuario (03/10/2026): en el formulario de preinscripción, cuando elige banco y tarjeta, mostrar la financiación específica de esa combinación (cuotas, interés y CFT, y el valor de cada cuota sobre el total vigente). Antes de mostrar cifras, resolver la contradicción entre la placa oficial (3 cuotas con interés) y el texto del panel (1 y 3 cuotas sin interés).

## Verificación

- `npm run check`
- Prueba de punta a punta del formulario: requiere la service role (en local devuelve 503) o probar en producción.

## Progreso

Creado el 02/10/2026.

- T1–T3 (02/10): writer delegado. Tabla `precios_privados` (no `precios_carrera`: ya existe `precios_carreras` de Siglo 21). `cau_editor` no saltea RLS, así que lleva una policy propia. El lead se marca con `tipo_formulario='precio'` y `tipo='Ver precio'` (sale en el aviso de Telegram). Script `herramientas/ventas/publicar-precios.mjs` con `--dry-run`. Tests: ver-precio 12/12, bot 311/311, npm test 195/195, typecheck OK. Falta: el usuario corre el SQL; después `npm run db:tipos` y publicar precios vigentes (los cargados vencieron el 01/10).
- T4 (02/10): ventana de un solo paso (solo mail, casilla de novedades marcada, «Ver precio» y WhatsApp abajo), captcha invisible (`interaction-only`, opción nueva `invisible` del widget). Aprobada en capturas por el usuario.
- T5 (02/10): casilla marcada por defecto en formulario-lead (las tres casas, contacto y preinscripción), /contacto y las dos vías de la FAQ. Suscripciones generales con `carrera_id` NULL (SQL nuevo, `UNIQUE NULLS NOT DISTINCT`). Tests 205/205.
