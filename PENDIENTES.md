# Pendientes

Última actualización: 2026-07-29

## Abierto

- [ ] **Pedirle a la universidad el plan de la Tecnicatura en Estadística Aplicada y Análisis Avanzado** (id 132). Es la única carrera visible sin temario del que agarrarse: al 29/07 no existe ni el PDF de `contenidos.21.edu.ar` ni la página en `21.edu.ar` ni una entrada en su sitemap; lo único público es un posteo del CAU Corrientes (2 años, inicio en octubre). Quedó marcada `proximamente` mientras tanto.

  **Cuando llegue el temario**, el cambio son dos cosas: cargar el slide de plan como el de Sociología y sacarle el `proximamente` —`update public.carreras set proximamente = false where id = 132;`—, que le devuelve el botón "Quiero inscribirme" y la píldora "Nueva". Ojo: si el CAU empieza a inscribir **antes** de que aparezca el plan, hay que sacar el `proximamente` igual, aunque la ficha se quede sin temario.

  (Agroinformática está en la misma situación: tiene slides pero no plan de estudios. Las dos salen como aviso, no como problema, en `npm run auditar`.)

- [ ] **Falta una foto decente de la entrada del CAU.** La única imagen del local es `public/imagenes/imagenes_cau/entrada_estetica.png`, de 475×598: estirada a 1200×630 queda blanda, y el recorte automático agarra el logo de la marquesina en vez del cartel. Hoy la usa el og de "Dónde queda el CAU Villa Lugano".

  Con una foto sacada de frente con cualquier celular actual se resuelve: hay que dejarla en `public/imagenes/imagenes_cau/` y volver a correr `node herramientas/generar-og.mjs` apuntando esa ruta en la entrada `#69` del script. La alternativa —usar el campus— se ve nítida pero no es la sede de Lugano, que es justo lo que el artículo explica.

- [ ] **Avisos por mail desde un remitente propio** — bloqueado por Resend, no por el sitio. El plan free permite **un solo dominio verificado** y ese lugar lo ocupa topykly, con el que se comparte la cuenta. Decisión del 28/07: Telegram es el canal principal de avisos y el mail sigue saliendo de `onboarding@resend.dev` (entrega peor y cae en spam más seguido).

  Si algún día se libera el lugar o se pasa a Pro, quedan tres pasos **en este orden**:

  1. Verificar `siglo21sur.com` en Resend y cargar en Cloudflare los registros que dé. **Los CNAME de DKIM van con la nube gris** (sin proxear): proxeados, Cloudflare los reescribe y la verificación no pasa nunca. Y **un dominio admite un solo registro SPF**: si Resend lo pide en la raíz, hay que fusionarlo con el de Email Routing (`v=spf1 include:_spf.mx.cloudflare.net ~all`, que Cloudflare deja "Unlocked" justo para eso), no agregar un segundo TXT — dos SPF invalidan los dos. Si lo pide sobre un subdominio (`send.siglo21sur.com`), no hay conflicto.
  2. **Recién ahí** setear el secret `RESEND_FROM` = `CAU Villa Lugano <avisos@siglo21sur.com>` en Edge Functions → Secrets. Adelantarlo hace que Resend rechace cada envío con 403 y los avisos se corten en silencio. El deploy de la función ya está hecho (v10, 28/07, con el fallback al sandbox), así que sólo falta el secret.
  3. Verificar con `herramientas/4 - Verificar avisos (SQL).bat`: tiene que llegar el mail desde la dirección nueva y no caer en spam.

## Para tener presente

**Los avisos de formularios fallan en silencio.** `net.http_post` encola el pedido sin bloquear el `INSERT`, así que la web responde `201` aunque la notificación se caiga. Fue exactamente lo que pasó del 20/07 al 27/07: el endurecimiento de seguridad le agregó validación de secreto a la Edge Function y el trigger de la base nunca se actualizó para mandarlo. (Ese corte no costó ningún lead real: la única consulta del período, `id 43`, era una prueba propia.)

Cada vez que se toque el `WEBHOOK_SECRET`, la función `notificar` o el trigger, verificar así:

```sql
INSERT INTO public.consultas (nombre, apellido, email, carrera)
VALUES ('PRUEBA', 'WEBHOOK', 'prueba@siglo21sur.com', 'Test');

SELECT id, status_code, content, created
FROM net._http_response ORDER BY created DESC LIMIT 3;

DELETE FROM public.consultas WHERE nombre='PRUEBA' AND apellido='WEBHOOK';
```

Esperado: `200` y `{"ok":true,"email":true,"telegram":true}`. Un `401` significa que el secreto del trigger no coincide con el de la Edge Function. Detalle completo en `sql/2026-07-27_webhook_notificar.sql`.

**Las Edge Functions se despliegan por CLI, nunca por el dashboard.** El deploy por dashboard deja el `slug` distinto del `name` y la URL se arma con el slug, así que la lista muestra el nombre correcto mientras la ruta devuelve 404; además queda con `verify_jwt: true`, que rechaza el `Bearer <WEBHOOK_SECRET>` del cron por no ser un JWT. Las dos cosas sólo se ven con `npx supabase functions list`. La forma buena: `npx supabase functions deploy <fn> --project-ref yuwfkdehaowkselkhtck --no-verify-jwt`.

**El captcha no se puede probar automatizado.** Cloudflare no emite token para un navegador manejado por Playwright, ni headless ni con ventana visible. El chequeo rápido del vencimiento es mirar el **desmarque**: pasados los 300 s el checkbox se vacía solo y el botón se apaga; no hace falta llegar a enviar. El iframe del widget mide 71 px y monta después del `load`, pero desde el 29/07 el contenedor de `components/turnstile-widget.tsx` reserva esa altura, así que ya no mueve el layout (en local no se renderiza: falta `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).

**`openGraph` dentro de un `generateMetadata` reemplaza al del layout, no lo completa** — por eso el fallback global no alcanza para las páginas que declaran el suyo. Lo mismo con `twitter:image`, que además gana sobre `og:image` cuando está presente. Las compuestas se sirven por convención de ruta desde `/imagenes/og/<slug>.jpg` y no están en la base, así que `npm run auditar` las chequea contra el disco: un artículo nuevo sin generar dejaría el og en 404 sin que nada lo delate.

**Sociología (131) usa el plan de Relaciones Internacionales a propósito.** La ficha oficial dice que sólo se dicta como doble titulación: son 11 materias adicionales al plan de RRII, cargadas en un bloque `extras`. No es un error de carga.

**Los planes de Identidad Argentina se van a volver a desfasar.** Las fichas de convenio se regeneran solas desde las landings, pero nada vuelca eso a Supabase: la carga es manual. Al 28/07 están al día contra las fichas de `Desktop\Academia Identidad Argentina\fichas-diplomaturas\`. Dos decisiones quedaron abiertas ahí: los módulos 2 a 6 de Bienestar Integral no tienen título en la ficha (dice literal "MÓDULO 2") y se conservaron los de la base, y Mindfulness bajó de 8 módulos a los 4 de la ficha.

**Hay un hueco en los datos de clicks entre el 22 y el 29/07.** `/api/track-click` fallaba en silencio —devolvía `{"ok":false}` con status 200— porque la tabla `career_clicks` y su RPC no existían. No se puede reconstruir.

**DMARC está en `p=reject`** y hoy no lo rompe nada, porque ningún sistema manda mails como `@siglo21sur.com` (los avisos salen del sandbox de Resend y Email Routing sólo recibe). **Lo único que lo rompería** es configurar el Gmail para "enviar como" `contacto@siglo21sur.com`: si algún día se hace, primero hay que aflojar la política o sumar el remitente al SPF. Mejora menor pendiente: el SPF está en `~all` y podría ir a `-all`, aunque con DMARC en `reject` el margen es chico.

**Los PAT de Supabase no vencen y dan acceso a todos los proyectos de la cuenta.** Al 27/07 quedan vivos `codex-release` (`sbp_ae97…`, en uso) y `mercadolibrebot` (`sbp_bc7d…`). Conviene revisarlos cada tanto en https://supabase.com/dashboard/account/tokens y borrar el que deje de usarse.

**En Resend no queda ninguna clave con acceso total.** Quedan `Onboarding` (Sending access, la que manda los avisos) y `topykly-dev`, del otro proyecto que comparte la cuenta.
