# Los formularios por casa: `components/formularios/casas.ts`

Sale de `CLAUDE.md`, que deja la invariante y el puntero. Leer esto antes de tocar un formulario o agregarle un campo.

El sitio tiene **dos formularios por casa** —contacto y preinscripción— y un único componente que los pinta, `components/formularios/formulario-lead.tsx`. Lo que cambia entre uno y otro no está en el componente sino en `casas.ts`, que declara tres cosas:

- **`CAMPOS`**: los campos que existen y, al lado de cada uno, **la columna de `consultas` donde se guarda**. Ahí está el punto: `insertConsulta` arma la fila con `columnaDe()` y no tiene ni un nombre de columna escrito a mano. El 23/08/2026 el endpoint apuntó a nueve columnas inexistentes y, como PostgREST rechaza la fila entera cuando una no existe (PGRST204), **dejaron de entrar todas las consultas del sitio** —home, `/contacto` y los dos de `/teclab`— porque los tres mandan `kind: 'consulta'`. Un test de `security.test.mjs` falla si vuelve a aparecer un literal de columna en el endpoint.
- **`CASAS`**: qué pide cada casa (`siglo21`, `teclab`, `identidad`) en cada modo, y cuáles bloquean el envío. Los obligatorios bloquean **sólo en preinscripción**: un legajo a medias no sirve, una consulta que rebota es un lead perdido. Ojo con las diferencias reales — Siglo 21 pide tipo de documento, tipo de domicilio, torre y barrio, y **no** pide nivel de estudios, colegio ni medio de pago, que son de Teclab.
- **`armarPayload()`**: qué viaja. Los campos que la casa no pide siguen en el estado del componente —si el lead vuelve a esa carrera los encuentra como los dejó— pero no se mandan.

En la home la casa **la define la carrera elegida** y el formulario cambia solo; en `/teclab` va fija por props. `casa` y `tipo_formulario` se guardan en la fila, y con eso el aviso de Telegram encabeza "PREINSCRIPCIÓN — Teclab" o "Consulta — Siglo 21".

Va todo en un archivo a propósito: Node strippea los tipos y corre los `.ts` en los tests, pero **no resuelve imports de valor entre `.ts` sin extensión**, y el `tsconfig` usa `moduleResolution: bundler` sin `allowImportingTsExtensions`. Separarlo deja la lógica sin poder testearse.

Antes de agregar un campo, **verificar que la columna exista de verdad**: desde local se puede con la anon key, `GET /rest/v1/consultas?select=<columna>&limit=1` — un `42703` en la respuesta es la columna que falta. Y después, mandar una consulta real: el incidente pasó porque el `INSERT` nunca se ejecutó contra la tabla.

Rate limit: RPC `check_form_rate_limit(p_key, p_max_requests, p_window_seconds)` con la IP hasheada en SHA-256. La clave incluye el `kind` (`consulta:<hash>`), así que el tope es **5 pedidos por cada tipo** por 10 min — una misma IP puede mandar 15 en total entre los tres. `/api/track-click` usa 60 (navegar 20 tarjetas es uso normal).

Turnstile se verifica en `lib/turnstile.ts`, que además compara el `hostname` que devuelve Cloudflare contra `TURNSTILE_EXPECTED_HOSTNAME` (normaliza `www.`). Si `TURNSTILE_SECRET_KEY` no está seteada, el endpoint acepta el token literal `rate-limit-only`. **Ese atajo solo, sin embargo, no alcanza para probar formularios en local**: el rate limit se consulta igual y usa la service role, así que sin `SUPABASE_SERVICE_ROLE_KEY` el endpoint devuelve 503.

