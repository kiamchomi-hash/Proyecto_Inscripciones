# Escribir contenido desde local: el rol `cau_editor`

`npm run db "<sql>"` (o `npm run db -- --archivo x.sql`) corre SQL contra la base con un rol de Postgres acotado, definido en `sql/2026-08-28_rol_editor_contenido.sql`. Es lo que evita copiar cada `UPDATE` al SQL Editor.

No es la service role con buenos modales: es un rol distinto, con su propia contraseña, que **sólo tiene privilegios sobre las tablas de contenido**.

| Tabla | Qué puede |
|---|---|
| `carreras`, `novedades`, `materias` | `SELECT`, `INSERT`, `UPDATE` |
| `faq_preguntas` | `SELECT`/`UPDATE` **por columna**, sin `contacto` ni `nombre_contacto` |
| `consultas` | `SELECT`, `DELETE` — **no** `INSERT`/`UPDATE` (`sql/2026-08-28_editor_consultas.sql`) |
| `solicitudes_clase`, `profesores`, `form_rate_limits`, `career_clicks` | nada |

`DELETE` no está en ninguna de las de contenido: una carrera sale de la oferta cambiando `nivel`/`activa`, una novedad se despublica. Sobre `consultas` es al revés — lee y borra, pero no escribe: se agregó el 28/08/2026 para poder limpiar la fila que deja probar el formulario contra producción, y las consultas siguen entrando sólo por `/api/formularios`. Contra el resto de las tablas de formularios la respuesta es `permission denied for table solicitudes_clase`, y eso es el rol funcionando, no un bug — esa consulta va al dashboard.

Se conecta por Postgres directo con `EDITOR_DATABASE_URL` (`postgresql://cau_editor:<clave>@db.<ref>.supabase.co:5432/postgres`), no por PostgREST: no hay que tocar el JWT ni el `authenticator`. Se descartó firmar un JWT con el secreto del proyecto justamente porque ese secreto también emite tokens `service_role` — habría sido una credencial más poderosa que la que se quería evitar.

**Ese host se publica sólo por IPv6**, y la máquina de Windows lo alcanza. Si la de Linux no tiene IPv6, ahí hay que pasar al pooler: mismo string con el host `aws-<n>-<región>.pooler.supabase.com`, puerto 6543 y el usuario `cau_editor.<ref>` (el sufijo del proyecto es obligatorio en el pooler).

El certificado del servidor lo firma la PKI propia de Supabase (`Supabase Root 2021 CA`), que no está en el almacén de Node: verificar la cadena falla con `SELF_SIGNED_CERT_IN_CHAIN`. `db.mjs` pincha ese root si encuentra `herramientas/supabase-ca.crt` (se baja del dashboard, *Connect → SSL certificate*) y, si no está, avisa y sigue sin verificar — la contraseña viaja cifrada igual, pero sin protección contra alguien en el medio.

`herramientas/db.mjs` **frena los `UPDATE` y `DELETE` sin `WHERE`** antes de mandarlos (`--sin-red` los deja pasar). El rol cubre escribir en la tabla equivocada; esto cubre escribir en la correcta sin acotar la fila.

Los permisos concedidos se verifican con la consulta del final del archivo SQL: si ahí aparece una tabla de formularios, se concedió de más.

Los archivos de `sql/` **no son migraciones automáticas** — se corren a mano en el SQL Editor de Supabase, en orden de fecha. `sql/instrucciones.md` documenta el setup inicial de clases de apoyo. Hay jobs de `pg_cron` (limpieza de clases pasadas, digest diario de clicks) que se programan desde ahí.

