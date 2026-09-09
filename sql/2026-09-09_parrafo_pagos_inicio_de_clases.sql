-- Suma al articulo perenne del inicio de clases el parrafo sobre cuando se paga
-- cada concepto. El texto es el mismo que ya sale en la FAQ (components/faq-page.tsx).
--
-- Por que aca y no en 2026-07-27_novedades_guias.sql: ese archivo inserto la
-- version original, con slug segundo-semestre-2026-inicio-3-de-agosto, que
-- 2026-08-08_novedad_inicio_de_clases.sql reescribio. El articulo vivo sale de
-- aquel update, asi que tocar el insert viejo no cambia nada publicado.
--
-- Va por replace() sobre el ancla del h2 siguiente y no reescribiendo el
-- contenido entero, para no pisar ediciones posteriores del articulo. El
-- position() del where lo hace repetible: correrlo dos veces no duplica nada.
--
-- El texto no lleva un mes de ejemplo ni el codigo de periodo. La primera version
-- decia "en agosto de 2026 se puede pagar la matricula para la inscripcion de
-- octubre": se publico el 09/09, o sea con el mes ya vencido, y se corrigio el
-- mismo dia. Un ejemplo con fecha envejece solo y nadie se entera; 2A/2B es
-- vocabulario interno que al que lee no le dice nada.
--
-- Aplicado el 09/09/2026 con `npm run db`. El trigger on_novedades_revalidar
-- publico el cambio solo; verificado en produccion el mismo dia.
update public.novedades
set contenido = replace(
  contenido,
  '<h2>Si todavía no elegiste carrera</h2>',
  '<h2>Cuándo se paga cada concepto</h2>
<p>La matrícula y el arancel del período no siempre se pagan juntos. Si la inscripción al próximo período todavía no abrió, puede habilitarse el pago anticipado de la matrícula, y el arancel se abona recién cuando ese período empieza. No es una regla fija: cambia según el momento del año, así que conviene confirmarlo antes de contar con esa fecha.</p>

<h2>Si todavía no elegiste carrera</h2>'
)
where slug = 'inicio-de-clases'
  and position('Cuándo se paga' in contenido) = 0;
