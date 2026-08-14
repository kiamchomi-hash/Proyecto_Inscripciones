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

Flujo disponible ahora:

1. Ejecutar localmente los actualizadores actuales.
2. Generar `ventas/buscador-carreras.html`.
3. Entrar como administrador a `/admin/buscador`.
4. Subir el HTML desde la acción de actualización.
5. La API valida tamaño, estructura y datos antes de reemplazar el snapshot privado.

Pendiente: desacoplar los actualizadores de las carpetas externas del Escritorio y ejecutarlos online mediante jobs programados. No asumir que el cron ya está implementado.

## Ajuste visual reciente

Se eliminó `group-hover:scale-110` de los íconos de las tarjetas del panel. La lupa de “Carreras y precios” y el ícono de “Clases de apoyo” ya no cambian de tamaño ni se desplazan al pasar el cursor; sólo cambia el fondo de la tarjeta.

## Coordinación del workspace

- Estos cambios todavía no están agrupados en un commit.
- Hay modificaciones ajenas a esta implementación en `CLAUDE.md`, `.claude/skills/bot_respuestas/SKILL.md` y `body.xml`; preservarlas y no sobrescribirlas.
- Las carpetas `ventas/`, `carreras/` y `herramientas/ventas/` contienen material privado o comercial y siguen excluidas de Git.
