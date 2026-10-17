# Modo demo de formularios (sólo desarrollo)

## Objetivo

Recorrer en local todo el frontend de la preinscripción («Ver precio», preinscripción,
«¿Querés gestionar tu inscripción?», autoinscripción y «¡Listo!») con las carreras reales,
sin resolver el captcha en cada envío y sin escribir nada en producción.

## Problema y por qué

El modo `NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL` saltea el captcha sólo si no hay site key
de Turnstile, y después escribe con la service role: en local da 503 (la máquina no tiene
la service role) y, con ella, crearía un lead real, un aviso de Telegram, un mail, un alta
en HubSpot y una corrida del robot. Supabase local no sirve porque su fixture no tiene
carreras. Usuario, 17/10/2026: «que pueda ver el frontend en todo el proceso de
preinscripción, sin que tenga que dar el check de no soy robot siempre».

## Alcance

- Bandera nueva `NEXT_PUBLIC_FORMULARIOS_DEMO=1`, activa sólo con
  `NODE_ENV === 'development'`. Producción la ignora aunque esté en `1`.
- Widget de Turnstile: con la bandera no carga Cloudflare (aunque haya site key) y
  entrega un token de demo.
- `/api/formularios`: con la bandera responde 201 con la misma forma que la respuesta
  real (precio, estado, pase) sin tocar la base, la cuota, Turnstile, SMTP2GO, HubSpot,
  Telegram ni el robot.
- El modo `PRUEBA_LOCAL` de las pruebas de integración no cambia.

## Restricciones

- Nada de la bandera puede alterar el comportamiento fuera de desarrollo.
- Los precios de demo son ficticios y se ven como tales; no se leen de `precios_privados`.
- El enlace personalizado `/inscripcion/<código>` queda fuera: su página lee la base con
  la service role.

## Tareas

- [x] T1. Bandera, widget y endpoint en modo demo, con tests (RED antes) y documentación
  en `docs/variables-de-entorno.md`, `docs/formularios-por-casa.md` y `.env.example`
  (este último lo pega el usuario: los permisos no dejan leerlo).
- [x] T2. Recorrido en el navegador con `npm run dev`: los pasos de Siglo 21 y Teclab
  sin captcha, sin errores en consola y sin pedidos a Supabase de escritura.

## Criterios de aceptación

- Con la bandera en desarrollo, se llega a «¡Listo!» sin captcha en las dos casas.
- Sin la bandera, o con `NODE_ENV` distinto de `development`, todo igual que hoy (tests).
- `npm run check` en verde.

## Ruta

- T1: delegada a un escritor (endpoint, widget, tests y docs: más de dos archivos no
  triviales).

## Progreso

- 17/10/2026: documento creado.
- 17/10/2026, T1 (ruta: escritor delegado): helper `lib/formularios-demo.ts`, widget y
  `/api/formularios` en modo demo; docs en `docs/variables-de-entorno.md` y
  `docs/formularios-por-casa.md`. RED: `tests/formularios-demo.test.mjs` con 3 de 9
  fallando (503 en vez de 201 o 400). GREEN: 9 de 9. `npm test` 498 de 498,
  `npm run typecheck` sin errores, `npm run lint` 0 errores (28 avisos previos, ninguno de
  los archivos tocados). Pendiente del usuario: sumar `NEXT_PUBLIC_FORMULARIOS_DEMO=0` a
  `.env.example`. Sin commit.
- 17/10/2026, T2 (inline): `npm run dev` con `NEXT_PUBLIC_FORMULARIOS_DEMO=1`. Teclab
  (`/carreras/tecnicatura-superior-en-programacion/inscripcion`): formulario completo sin
  captcha, «Solicitud recibida» con usuario y contraseña; el servidor registró «Envío de
  demo (autoinscripcion)» y respondió 201 sin escribir. Siglo 21
  (`/carreras/licenciatura-en-informatica`): el formulario se muestra sin captcha; no se
  completaron sus 21 campos. Consola: sólo el aviso de `eval()` de desarrollo.
