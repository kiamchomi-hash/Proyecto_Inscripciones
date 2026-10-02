# Pruebas reales con Supabase local

Este entorno es exclusivo para pruebas. No usa `.env.local`, un proyecto remoto,
datos reales ni triggers de Telegram, revalidación, cron o analytics.

## Preparación

Requiere Node 24, dependencias instaladas (`npm ci`) y Docker con motor
Linux disponible. En Windows, Docker Desktop necesita WSL 2 habilitado; puede
requerir instalación como administrador y reinicio. Sus términos se aceptan
manualmente, no mediante este script.

```bash
npm run db:local:iniciar
npm run test:integracion
npm run db:local:detener
```

La primera ejecución descarga imágenes y puede consumir varios GB de disco.
Mientras está activo consume memoria y CPU. `detener` sólo detiene el proyecto
`cau-guardrails-local`, conserva datos ficticios y no afecta otros proyectos.
`npm run db:local:estado` comprueba disponibilidad sin imprimir claves.

Los puertos dedicados son 55421 (API), 55422 (Postgres), 55420 (shadow) y 55430
(servidor Next de prueba). No reutiliza el servidor del sitio ni su `.next`:
copia el endpoint y sus dependencias, sin modificarlos, a una carpeta temporal.
Sólo ese servidor se cierra al terminar. El stack se detiene con el comando anterior.

## Qué se verifica

- Insert directo de formularios y lectura de datos privados rechazados para anon
  y usuarios autenticados; FAQ pública sólo aprobada y sin datos de contacto.
- Profesor pendiente/no asignado sin actualizaciones; aprobado actualiza su materia
  y no columnas prohibidas. Admin actualiza otras materias con los mismos grants.
- Registro propio pendiente sin autoaprobarse, cambiar rol o asignarse materia.
- Endpoint HTTP real: consulta, FAQ y clase devuelven 201 y persisten en Postgres.
- Token local inválido no inserta y consume cuota; sexto intento devuelve 429.

Se usan Auth, PostgREST y PostgreSQL reales, no mocks. Los SQL de seguridad de
`sql/2026-07-20_seguridad_admin.sql`, `sql/2026-07-20_seguridad_formularios.sql` y
`sql/2026-07-22_cerrar_lectura_publica.sql` se leen y aplican en cada corrida;
no se copia su lógica a otra colección de policies.

El esquema mínimo de `herramientas/supabase-local/fixture.sql` es sintético:
esto prueba esas políticas y la persistencia del endpoint, **no** paridad completa
con producción, navegación del panel, notificaciones o Turnstile real.
El endpoint utiliza su modo local de desarrollo existente (`rate-limit-only`);
no se cambia ni saltea la protección de producción.

## Seguridad y resultados

Antes de escribir se exige contexto Docker local, ID del contenedor, URL y puertos
exactos, marca del fixture, tablas esperadas y ausencia de triggers ajenos.
Se rechazan otros destinos, incluso otro Supabase local. Cualquier override
`DOCKER_*` heredado exige quitarlo antes de correr; el endpoint local validado queda
fijado para Docker y la CLI. La limpieza valida el destino temporal resuelto y
retira el enlace a node_modules antes de borrar recursivamente. Las cuentas se crean con
correos `example.invalid`, se eliminan al finalizar y las tablas ficticias se vacían.
Un lock de Postgres impide dos corridas simultáneas sobre el fixture.

`npm run check` incluye las guardas unitarias, pero no sustituye esta integración.
Ejecutá además `npm run test:integracion` cuando cambien formularios, clientes de
Supabase o los SQL de permisos. Docker/stack ausente es **fallo no verificado**,
no un skip aprobado. No conectar este comando a credenciales de producción.

Si cambió el esquema del fixture, se requiere recrear exclusivamente este entorno
local; no ejecutar `db reset`, `db push`, `link` o comandos remotos para arreglarlo.

## Validación en Linux (01/10/2026)

Docker Engine 29.8.2 instalado en Linux Mint 22.3 mediante el repositorio oficial
para Ubuntu Noble. Usuario agregado al grupo `docker`; cerrar sesión y volver
a entrar para que las terminales y la aplicación incorporen el grupo. Mientras
tanto, `sg docker -c 'npm run db:local:iniciar'` permite ejecutar con ese grupo.
Usar Node 24 (instalado con nvm): `nvm use 24` y comprobar `node --version`.
La terminal inicial usaba Node 18 y fallaba al importar TypeScript.

`npm run test:integracion` aprobó 6 pruebas sin skips sobre Auth, PostgREST y
PostgreSQL reales. `npm run check` aprobó 155 pruebas, con 27 advertencias de lint
y ningún error. Se corrigió el rechazo de PostgreSQL al BOM UTF-8 de algunos SQL
de Windows retirándolo sólo de la cadena que envía el harness, sin alterar las
políticas. El proyecto aislado se detuvo al finalizar; conserva el fixture vacío.
Esto cierra la validación local, no verifica recuperación de respaldos ni Windows.

## Estado inicial en Windows (30/09/2026)

CLI Supabase 2.118.0 instalada. Docker Desktop instalado, pero su motor no está
disponible: la captura del 30/09/2026 muestra «Virtualization support not detected».
Este mensaje no confirma por sí solo una causa en BIOS/UEFI. La configuración
quedó postergada por pedido del usuario. La suite real no pudo validarse en Windows.
No interpretar la aprobación de tests unitarios como integración aprobada.

## Retomar la configuración en Windows

Abrir PowerShell **como administrador** y completar WSL 2:

```powershell
winget install --id Microsoft.WSL --exact --version 2.7.13 --source winget
wsl --install --no-distribution
```

Reiniciar si lo solicita, abrir Docker Desktop y aceptar personalmente sus
términos si aparecen. Comprobar que WSL y el motor Linux estén disponibles:

```powershell
wsl --status
docker info
```

Si sigue el error de virtualización, diagnosticar el entorno antes de continuar;
los comandos de WSL no garantizan resolverlo. Cuando el motor funcione, desde la
raíz del proyecto ejecutar:

```powershell
npm run db:local:iniciar
npm run test:integracion
npm run db:local:detener
```

Cerrar el pendiente únicamente cuando la integración real termine aprobada.
