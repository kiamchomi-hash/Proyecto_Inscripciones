# Recuperar Supabase sin afectar producción

**Estado al 01/10/2026: dashboard comprobado y ensayo ficticio aprobado;
recuperación de producción NO verificada.** Docker ya funciona en Linux.

## Comprobación del 01/10/2026

El dashboard del proyecto `yuwfkdehaowkselkhtck` mostró **Free Plan does not
include project backups** en Scheduled backups. Point in time mostró que PITR
es un adicional de Pro. Por lo tanto no hay copia programada ni punto PITR
disponibles en estas pantallas; no se confirmó una copia independiente externa.
No se cambió el plan ni se ejecutó Restore sobre producción.

Se ensayó PostgreSQL 17 con la imagen
`public.ecr.aws/supabase/postgres:17.6.1.171` en dos contenedores nuevos,
independientes de `cau-guardrails-local`, sin red (`--network none`) y sin
puertos publicados. Se crearon dos cursos y dos contactos `example.invalid`,
una relación por clave foránea y un rol lector con RLS. Se respaldaron roles
sin contraseñas y la base con `pg_dump --format=custom`; se restauraron mediante
`psql` y `pg_restore --exit-on-error`.

Resultado: datos idénticos al punto de copia, ninguna relación huérfana, RLS
conservada (el lector ve sólo un curso), lectura de contactos y escritura
denegadas. Una tercera fila insertada después del respaldo no se recuperó,
como corresponde al punto de copia. Sin triggers externos. Restauración:
204 ms; antigüedad de copia al iniciar restore: 317 ms; ciclo completo: 10.271 ms.
Dump sintético de 4.094 bytes, SHA-256
`1cca24afe3b014f578108bce14779f7f5f25105b647d97c0563606ef4eb51cc3`.
Los dos contenedores y sus volúmenes se retiraron al finalizar.

Este ensayo sólo verifica PostgreSQL ficticio: no Auth, Storage, Vault,
servicios Supabase ni una copia real. Los tiempos no son un RPO/RTO de producción.

Próximo paso concreto: obtener acceso de respaldo completo desde una fuente
privada autorizada (esta máquina sólo tiene `EDITOR_DATABASE_URL`, cuyo rol no
cubre toda la base), preparar custodia cifrada fuera del repo y un destino local
aislado, y obtener autorización específica para copiar datos reales. La contraseña
se proporciona por un medio privado, nunca en chat ni en archivos versionados.
Sin esa credencial y custodia no se puede crear ni restaurar una copia completa.

## Antes de restaurar

### Revisión previa al cambio de contraseña (01/10/2026)

No se encontró uso de la contraseña de `postgres` en el sitio, Edge Functions,
herramientas versionadas o scripts comerciales locales revisados. El sitio y
las funciones usan la API con anon/service role; las conexiones PostgreSQL de
`db.mjs`, `leads.mjs` e `integraciones.mjs` usan `EDITOR_DATABASE_URL`, cuyo
usuario comprobado es `cau_editor`. Vercel (`proyecto-inscripciones`, scope
`iuys-projects-18eed4e5`) no tiene variables de conexión PostgreSQL entre las
variables listadas de producción, preview y desarrollo.

Consulta de sólo lectura en el SQL Editor: `pg_stat_activity`, agrupada por
`usename` y `application_name` para `backend_type = 'client backend'`. Mostró
dos conexiones `authenticator/postgrest`, una `postgres/supabase/dashboard-query-editor`
(la propia consulta) y dos `supabase_admin` (una `postgres_exporter`). No apareció
un cliente externo conectado como `postgres`. Es una foto del momento: no prueba
ausencia de clientes apagados, jobs externos o configuraciones de otra máquina.

Conclusión: no se identificó una dependencia propia que requiera actualizar su
contraseña al cambiar la de `postgres`. El dashboard advierte que el reset corta
conexiones existentes; puede haber una reconexión transitoria. No se cambió ninguna
contraseña. La clave nueva debe ingresarla y guardarla el usuario mediante un
medio privado; luego comprobar lectura pública, formularios y `cau_editor`.

1. El responsable confirma en **Database > Backups** el mecanismo disponible,
   fecha/zona horaria del punto recuperable, retención y costos. Conservar
   evidencia privada sin claves ni datos personales.
2. Acordar pérdida aceptable de datos (RPO) y tiempo sin servicio (RTO).
   Son objetivos de negocio pendientes, no garantías del proveedor.
3. Identificar un destino separado y descartable, distinto del origen.
   Un ensayo nunca restaura sobre producción ni cambia Vercel o DNS.
4. Aislar las salidas **antes** de restaurar: Telegram, revalidación, cron,
   correo y extensiones con acceso externo.

**Detenerse** si falta identidad del destino, autorización, copia accesible,
material criptográfico necesario o aislamiento previo. No ejecutar Restore/PITR
sobre el proyecto original para probar.

## Alcance de recuperación

| Parte | Qué comprobar |
|---|---|
| PostgreSQL | Esquema, datos, roles, grants, RLS, funciones, triggers, extensiones, jobs y publicaciones. Los SQL históricos son manuales, no un bootstrap completo ni respaldo de datos. |
| Auth | Usuarios y registros del esquema auth incluidos por el método elegido. Configuración de proveedores, SMTP, redirects y claves API se revisan aparte. |
| Storage | La base conserva metadatos, **no los archivos**. Copia independiente de objetos, inventario y huellas; verificar buckets, permisos y lectura en destino. |
| Vault | Un dump lógico no transporta automáticamente la clave raíz: seguir transferencia privada oficial y comprobar descifrado sin mostrar valores. La clonación física documentada sí copia esa clave. |
| Servicios y secretos | Edge Functions, configuración y secretos Supabase/Vercel se recuperan aparte desde fuentes privadas autorizadas. Usar el [inventario de variables](variables-de-entorno.md) y [notas operativas](notas-operativas.md), sin copiar valores al repo. |

El rol [cau_editor](rol-editor.md) no permite un respaldo completo.
Un snapshot del buscador/contenido y la exportación del entorno de las máquinas
tampoco recuperan todo Supabase.

## Custodia

- Copias privadas y cifradas **fuera del repo y de carpetas públicas**, permisos
  mínimos y clave de descifrado guardada por separado.
- Nunca dumps, objetos privados, datos de leads, URLs de conexión ni secretos en
  chat, git, CI o logs. Un archivo ignorado no es una custodia segura.
- Registrar fecha, alcance, versiones, huella, responsable, retención y acceso
  a la copia cifrada. Evitar contraseñas en argumentos e historial de terminal.
- Revisar exclusiones del método elegido: no asumir que un pg_dump por defecto
  incluye roles o todos los esquemas. Contraseñas de roles personalizados pueden
  necesitar reconfiguración; no publicar sus valores.

## Ensayo seguro

**Primero un ciclo ficticio; después, con autorización específica, una copia real.**
El ciclo sintético no demuestra recuperabilidad de producción.

1. Preparar origen y destino independientes con usuarios y archivos ficticios.
   No reutilizar cau-guardrails-local: su fixture es sólo sintético y su harness
   no es una herramienta de restauración.
2. Registrar conteos, relaciones, policies/roles y huellas esperados. Tomar y
   restaurar una copia siguiendo la
   [guía CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
   Fijar versiones compatibles y alcance de auth/storage; sus cambios
   personalizados pueden requerir restauración separada.
3. Aislar salidas desde **antes** de cargar el esquema. Revisar funciones,
   triggers, cron y endpoints en copia de trabajo privada; no habilitar jobs
   ni secretos reales. No confiar sólo en desactivar triggers durante el INSERT.
4. Comparar integridad y relaciones; probar Auth, lectura pública y denegación
   de datos privados con roles reales. Formularios sólo con contactos ficticios
   y avisos aislados. Comprobar archivos y Vault sin registrar valores.
   Un conteo correcto no prueba RLS.
5. Registrar inicio/fin, punto recuperado, pérdida y duración observadas;
   comparar con RPO/RTO acordados. Limpiar sólo el destino identificado y
   conservar evidencia privada sin datos personales ni secretos.

**No usar directamente clonación física como ensayo aislado aquí.** Supabase
advierte que jobs y extensiones con operaciones externas copiados pueden
ejecutarse al finalizar y no se pueden excluir previamente. Este proyecto tiene
avisos y revalidación: un nuevo identificador no evita efectos sobre producción.
La [guía de clonación](https://supabase.com/docs/guides/platform/clone-project)
recomienda restore lógico cuando deben inspeccionarse antes de ejecutarse.

Recuperar una copia real requiere autorización específica, custodia privada,
destino separado y aislamiento demostrado, más el mismo checklist. No se hizo
en esta sesión. No hay comandos genéricos destructivos para copiar y pegar:
se preparan para el destino identificado al retomar, sin credenciales en el repo.

## Ante un incidente

Preservar el estado y registrar el último momento sano. Identificar una copia
anterior al incidente y estimar la pérdida. No sobrescribir el origen sin
decisión explícita del responsable. Recuperar primero en destino aislado.
Cambiar claves, variables, despliegue o tráfico es una operación posterior,
autorizada por separado, con reversión acordada.

## Cierre del pendiente

- [x] Dashboard verificado el 01/10/2026: plan gratuito sin copia programada ni PITR disponibles; no hay punto/retención recuperables que confirmar en esas pantallas.
- [ ] Cobertura DB/Auth/Storage/secretos registrada y copias privadas accesibles.
- [ ] RPO/RTO acordados y medidos, no inferidos de npm run check.
- [ ] Copia real restaurada en destino separado y aislado; integridad,
      permisos y funcionamiento comprobados; limpieza registrada.

Fuentes oficiales consultadas el 30/09/2026:
[Backups](https://supabase.com/docs/guides/platform/backups),
[restore CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore),
[clonación](https://supabase.com/docs/guides/platform/clone-project).
