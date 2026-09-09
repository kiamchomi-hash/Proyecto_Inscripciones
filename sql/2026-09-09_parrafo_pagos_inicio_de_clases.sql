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
-- Aplicado el 09/09/2026 con `npm run db`. El trigger on_novedades_revalidar
-- publico el cambio solo; verificado en produccion el mismo dia.
update public.novedades
set contenido = replace(
  contenido,
  '<h2>Si todavía no elegiste carrera</h2>',
  '<h2>Cuándo se paga cada concepto</h2>
<p>La matrícula y el arancel del período no necesariamente se pagan al mismo tiempo. Cuando la inscripción a un próximo período todavía no comenzó, puede habilitarse el pago anticipado de la matrícula y el arancel se abona cuando empieza ese período. Por ejemplo, en agosto de 2026 se puede pagar la matrícula para la inscripción de octubre y dejar el arancel para el inicio de octubre. Es una posibilidad de la ventana comercial vigente, no una regla permanente.</p>

<h2>Si todavía no elegiste carrera</h2>'
)
where slug = 'inicio-de-clases'
  and position('Cuándo se paga' in contenido) = 0;
