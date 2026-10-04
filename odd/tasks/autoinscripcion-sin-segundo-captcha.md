# Autoinscripción sin segundo captcha

## Objetivo y motivo
En el carrusel de preinscripción de Teclab, la persona resuelve Turnstile en el paso 1 (preinscripción, `kind: 'consulta'`) y el paso «¿Querés gestionar tu inscripción?» monta otro Turnstile invisible porque los tokens son de un solo uso. Cuando ese segundo desafío falla, la persona ve «Estamos verificando la conexión…» y no entiende. Ya verificó una vez: el servidor tiene que devolverle un pase firmado y la autoinscripción tiene que aceptarlo en lugar de un token nuevo.

## Diseño
- Al entrar una preinscripción de una carrera con autoinscripción, `POST /api/formularios` devuelve además `pase`: firmado con HMAC-SHA256, con vencimiento corto (10 min), atado a la persona y la carrera (hash de mail normalizado + `carreraId`). La clave se deriva de `TURNSTILE_SECRET_KEY` con separación de dominio (sin variable de entorno nueva). Sin esa clave no se emite pase.
- `kind: 'autoinscripcion'` acepta `pase` en lugar de `token`: pase válido y que coincide con el payload → no se llama a Turnstile. El rate limit corre siempre. Pase inválido o vencido → 403, igual que un captcha inválido.
- Reuso acotado: rechazar si ya existe en `consultas` una autoinscripción del mismo mail y carrera creada después de emitido el pase.
- Cliente: guarda el pase; el paso «gestionar» no monta captcha si hay pase. Si el servidor lo rechaza, se descarta y aparece un Turnstile visible con un aviso claro. La entrada directa y el enlace no cambian.

## Plan
- [x] T1: pase firmado en el endpoint + uso en el carrusel, con tests y docs. Ruta: delegada (2+ archivos no triviales, toca el control de seguridad).

## Aceptación
- Paso 1 resuelto → «Inscribirme» envía sin segundo captcha.
- Pase vencido, adulterado, de otra persona o de otra carrera → 403, sin Turnstile salteado.
- Rate limit sigue corriendo con pase.
- Sin pase o rechazado → captcha visible con instrucción entendible.
- `tests/security.test.mjs` y el resto de `npm run check` en verde.

## Comprobaciones
- RED/GREEN con los tests del endpoint (`tests/formularios-api.test.mjs`, `tests/autoinscripcion.test.mjs`).
- `npm run check`.

## Evidencia
- T1 (ruta delegada, un escritor; sin commit todavía, lo hace el padre).
  - RED: `node --test tests/formularios-api.test.mjs tests/autoinscripcion.test.mjs tests/pase-autoinscripcion.test.mjs` → 15 tests, 10 pass, 5 fail (los 5 nuevos del endpoint: emisión, uso sin Turnstile con cuota, rechazos, reuso, sin secreto). Excepción honesta: `lib/pase-autoinscripcion.ts` se escribió antes que su test unitario; el RED observado es el del endpoint.
  - GREEN: `node --test tests/formularios-api.test.mjs tests/autoinscripcion.test.mjs tests/security.test.mjs tests/pase-autoinscripcion.test.mjs` → 23/23.
  - `npm run check` → exit 0: lint 0 errores (27 warnings previos), typecheck ok, 336 pass / 0 fail.
  - El endpoint importa `lib/pase-autoinscripcion.ts` con `import()` diferido (mismo patrón que `mail-precio`): con import estático, los otros tests que cargan el endpoint sin ese módulo (enlace, lead de la sede, newsletter, robot, ver-precio) fallaban al cargar.
  - Pendiente: prueba manual en el navegador del carrusel (pase aceptado, rechazo → captcha visible).

## Notas
- El reuso del pase no es atómico: dos envíos simultáneos con el mismo pase pueden entrar los dos, dentro de la cuota. Aceptado: lo que se gana es una fila repetida, no saltear el captcha.
- Sin pase (secreto ausente, mail vacío, error al emitir) la pregunta muestra ahora el Turnstile visible en vez del invisible, según la aceptación.
