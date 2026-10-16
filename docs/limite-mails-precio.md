# Límite de correos de «Ver precio»

## Alcance

«Ver precio» reserva un correo por dirección normalizada (`trim` y minúsculas)
y carrera ID durante 168 horas. Volver a consultar sigue guardando el lead y
mostrando el precio. No crea suscripciones ni cambia su consentimiento.
Preinscripción y cron de newsletter mantienen su comportamiento anterior;
por eso este límite no garantiza un máximo conjunto entre esos canales.

La RPC `reservar_mail_precio` usa un `INSERT ... ON CONFLICT DO UPDATE` condicional:
la clave primaria arbitra pedidos concurrentes en PostgreSQL. El reloj y el
plazo se resuelven en la base. No se utiliza memoria de una instancia Vercel.
La tabla tiene RLS, sin acceso directo para los roles de aplicación. Sólo
`service_role` puede ejecutar la RPC, con `search_path` cerrado.

## Despliegue manual, en este orden

1. Ejecutar `sql/2026-10-16_limitar_mails_precio.sql` en el SQL Editor de Supabase.
   Es idempotente y no envía correos. No incorpora historial anterior: el primer
   pedido tras el despliegue puede enviar aunque hubiera un correo previo.
2. Revisar la definición de la función, la clave primaria y permisos en el
   dashboard. Confirmar que `anon` y `authenticated` no tienen `EXECUTE`, ni
   acceso a la tabla. La RPC debe permitir sólo a `service_role`.
3. Desplegar el backend con el procedimiento habitual. Si falta la RPC o falla,
   se omite únicamente el correo; el precio y el lead siguen funcionando.
4. Regenerar los tipos desde el esquema real según `docs/tipos-supabase.md` y
   revisar que coincidan con el contrato incorporado para este cambio.

El 16/10/2026 se aplicó el SQL en el dashboard del proyecto Supabase verificado
contra la configuración del sitio. El despliegue del backend está en curso.
Los archivos de `sql/` no son migraciones automáticas.

## Fallos y recuperación

Se reserva dentro de `after()`, después de responder y antes de SMTP. La reserva
permanece incluso ante rechazo, timeout o excepción: un resultado incierto no
autoriza reintentar, porque el proveedor podría haber aceptado el correo.
Esto prioriza no duplicar; una falla podría dejar a la persona sin correo esa
semana, aunque siempre pueda volver a ver el precio. El plazo empieza en la
reserva, no en la entrega del proveedor. Un fallo antes de ejecutar `after()`
puede dejar el pedido sin correo, como antes del cambio.

No borrar reservas para reintentar sin verificar previamente el resultado del
proveedor. No hay una transacción distribuida entre PostgreSQL y SMTP2GO.
Los registros llevan códigos y tipos de error, nunca direcciones ni claves.

Para volver al comportamiento anterior basta revertir el cambio backend del
límite; la tabla y función pueden permanecer sin uso. Esto vuelve a habilitar
correos repetidos. No borrar infraestructura compartida ni cambiar el cron.

## Pruebas

`node --test tests/ver-precio.test.mjs` simula Supabase, SMTP2GO, Turnstile y
`after()`, y rechaza cualquier `fetch` inesperado. Cubre repetición, normalización,
claves independientes, frontera de 168 horas, concurrencia del consumidor,
fallos de RPC/SMTP y preinscripción sin cambios. `npm run check` agrega lint,
tipos y la suite completa.

El 16/10/2026 se verificó en PostgreSQL real, con aserciones dentro de una
transacción revertida: primer pedido `true`, repetición con correo normalizado
`false`, y nuevo permiso tras 168 horas `true`. No se ejecutó SMTP ni quedaron
reservas de prueba. Se verificaron RLS activo, `EXECUTE` denegado a `anon` y
`authenticated`, permitido a `service_role`, y lectura denegada a `anon`.

`npm run check` pasó con lint, typecheck y 473/473 pruebas, fuera de las
restricciones del sandbox. Los fallos iniciales eran del entorno restringido,
no requirieron cambios de código ni omitir hooks.

El mock no demuestra bloqueos reales de PostgreSQL. La concurrencia de dos
sesiones reales sobre el mismo correo/carrera no se ejecutó; queda pendiente
verificar que obtengan exactamente un `true`. La prueba SQL sólo debe reservar
filas dentro de una transacción revertida, sin SMTP ni consultas al endpoint
público con correos reales.
