# Plan: eliminar el panel de administración

## Alcance aprobado

Eliminar `/admin`, `/api/admin`, el `proxy.ts`, componentes/assets exclusivos del panel y helpers de auth que no tengan otros consumidores. Conservar datos, esquema y RLS de Supabase; páginas públicas de `clases-apoyo`; automatizaciones independientes.

El usuario confirmó que **no usará el buscador de precios**, por lo que `/api/admin/buscador` y su publicación automática también se eliminan.

## Archivos a eliminar

- `app/admin/` completo.
- `app/api/admin/` completo.
- `components/admin/` completo.
- `lib/auth/exigir-admin.ts`.
- `proxy.ts`.
- `public/buscador-sw.js`.
- `public/buscador-icon.svg`.

## Dependencias a verificar y eliminar si quedan huérfanas

- `lib/supabase-server.ts` (`createSupabaseServer`) — usado solo por auth admin.
- `lib/supabase-auth.ts` (`createSupabaseBrowser`) — usado solo por componentes admin.

## Archivos a actualizar

- `next.config.ts`: quitar header `X-Robots-Tag` para `/admin/:path*`.
- `app/robots.ts`: quitar `/admin/` de `disallow`.
- `lib/vigilancia-esperado.ts`: quitar `/admin/login` de `NOINDEX`.
- `components/google-analytics.tsx`: quitar exclusión de `/admin`.
- `herramientas/integraciones.mjs`: quitar pruebas de `/admin` y `/api/admin/profesores`.
- `tests/security.test.mjs`: quitar tests que ya no aplican (admin en proxy, buscador secreto).
- `tests/accesos.test.mjs`: quitar o adaptar casos de `/admin`.
- `tests/admin-navegacion.test.mjs`, `tests/admin-profesores.test.mjs`: eliminar.
- Docs vigentes: `AGENTS.md`, `CLAUDE.md`, `docs/herramientas.md`, `docs/variables-de-entorno.md`, `docs/seguridad.md`, `docs/HANDOFF_BUSCADOR_APP.md`.

## Scripts privados (gitignorados)

- Revisar `herramientas/ventas/publicar-buscador.mjs` solo para quitar la invocación a `/api/admin/buscador`. No borrar cálculos/exportaciones compartidos con el bot u otros consumidores.
- No explorar `contenidos/`.

## Regresión de seguridad

- Agregar test que garantice que no quede ninguna ruta `/admin` ni `/api/admin` expuesta accidentalmente.
- Verificar que `proxy.ts` no quede con lógica admin residual.

## Verificación

- `npm run check`.
- `npm run build` si es posible sin service role.
