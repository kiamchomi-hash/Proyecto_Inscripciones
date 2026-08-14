# Traspaso: app privada de carreras y precios

Actualizado: 2026-08-14

## Estado actual

- La app está implementada en `/admin/buscador` y requiere una cuenta aprobada con rol `admin`.
- Preview activa: `https://proyecto-inscripciones-j2x7h6y9h-iuys-projects-18eed4e5.vercel.app/admin/buscador`.
- Producción todavía no fue modificada.
- El proyecto de Vercel pertenece al equipo Pro.
- La preview tiene configuradas las variables de Supabase únicamente para el entorno `Preview`.
- Supabase Storage contiene un bucket privado llamado `ventas-privadas`.
- Snapshot inicial cargado: 90 carreras de Universidad Siglo 21, Teclab y Academia Identidad Argentina.
- El buscador conserva el chatbot determinista embebido en el HTML; no depende de una API de IA.

## Autenticación

- El login usa Supabase Auth mediante email/contraseña o Google.
- La autorización de la aplicación se resuelve con `public.profesores`.
- Para entrar al buscador, el registro debe tener `estado = 'aprobado'` y `rol = 'admin'`.
- En Supabase Auth > URL Configuration se agregó el redirect de previews de Vercel:

  `https://*-iuys-projects-18eed4e5.vercel.app/**`

- El `Site URL` de Supabase debe continuar apuntando a `https://www.siglo21sur.com`.

## Archivos principales

- `app/admin/buscador/page.tsx`: página privada y metadata de la PWA.
- `app/admin/buscador/buscador.css`: interfaz responsive de la aplicación.
- `app/admin/buscador/manifest.webmanifest/route.ts`: manifiesto instalable.
- `components/admin/buscador-workspace.tsx`: visor, estado, instalación y carga manual.
- `app/api/admin/buscador/route.ts`: endpoint administrativo para publicar snapshots.
- `lib/ventas-snapshot.ts`: validación, lectura y escritura en Storage.
- `public/buscador-sw.js` y `public/buscador-icon.svg`: service worker e ícono.
- `proxy.ts`: exige rol administrador para el buscador y su API.
- `app/admin/page.tsx`: tarjeta de acceso desde el panel.

## Variables necesarias

Sólo se documentan los nombres; no copiar valores ni secretos al repositorio.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VENTAS_STORAGE_BUCKET=ventas-privadas`

## Renovación de datos

Los actualizadores siguen corriendo en la máquina de casa; lo que dejó de ser manual es la publicación.

1. `ventas/2 - Actualizar precios de las tres.bat` (o la tarea programada `CAU - Actualizar precios de las tres`) baja los precios y regenera `ventas/buscador-carreras.html`.
2. El mismo script publica solo, con `herramientas/ventas/publicar-buscador.mjs`.
3. La API valida tamaño, estructura y datos antes de reemplazar el snapshot privado.

`ventas/3 - Actualizar buscador de carreras.bat` hace lo mismo en tres pasos, para cuando sólo hace falta rehacer el buscador.

La subida a mano desde `/admin/buscador` sigue funcionando igual y es la salida cuando la automática se saltea.

### Por qué no escribe directo en Storage

Escribir el bucket pide la service role, que vive sólo en Vercel y está marcada Sensitive. Bajarla a una máquina de casa para que un script de precios pueda escribir sería mover la credencial más fuerte del proyecto al lugar más expuesto. En vez de eso el script le pega a `PUT /api/admin/buscador` con `Authorization: Bearer $BUSCADOR_SECRET`, el mismo patrón de `/api/revalidar` y `/api/vigilancia`.

`proxy.ts` deja pasar ese caso —y sólo ese: la ruta exacta y el verbo `PUT`— sin sesión. **No compara el secreto**: en el bundle del proxy las variables se inlinean en el build, así que tenerlo en dos lados significaría que rotarlo exige acordarse de redeployar para que coincidan. La única autoridad es la route. `tests/security.test.mjs` falla si esa excepción se afloja o si la route deja de validar.

### No publica con precios vencidos

`actualizar-todo.mjs` publica al final y sólo si las tres instituciones se pueden cotizar. El buscador se rearma igual aunque una falle —queda con los precios de la corrida anterior—, pero eso es una cosa cuando el archivo se abre localmente y otra cuando queda publicado para atender leads. Si algo no está vigente, avisa y no sube; la subida a mano queda como decisión de quien mira.

Ojo con el cuadro "Estado de los precios" que imprime el script: mide la antigüedad del CSV, no si la actualización de esta corrida anduvo. Una institución puede fallar y salir "al día" porque el archivo previo es de hoy.

Pendiente: desacoplar los actualizadores de las carpetas externas del Escritorio (`Teclab_Info/`, el perfil de Brave de `herramientas/ventas/perfil-navegador/`) y del Python con `openpyxl` que lee el `.xlsx` de CASA. Hasta que eso pase, la generación no puede correr en la nube.

### Lo que no viaja por git

`herramientas/ventas/publicar-buscador.mjs` y los `.bat` de `ventas/` están en carpetas gitignoradas. En una máquina nueva hay que copiarlos a mano, junto con `BUSCADOR_SECRET` en `.env.local`.

## Ajuste visual reciente

Se eliminó `group-hover:scale-110` de los íconos de las tarjetas del panel. La lupa de “Carreras y precios” y el ícono de “Clases de apoyo” ya no cambian de tamaño ni se desplazan al pasar el cursor; sólo cambia el fondo de la tarjeta.

## Coordinación del workspace

- Estos cambios todavía no están agrupados en un commit.
- Hay modificaciones ajenas a esta implementación en `CLAUDE.md`, `.claude/skills/bot_respuestas/SKILL.md` y `body.xml`; preservarlas y no sobrescribirlas.
- Las carpetas `ventas/`, `carreras/` y `herramientas/ventas/` contienen material privado o comercial y siguen excluidas de Git.
