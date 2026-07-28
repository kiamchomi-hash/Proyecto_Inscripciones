# Herramientas

Verificaciones que no cubre `npm run check`. Nada de esto llega al sitio
publicado: Vercel sirve el build de Next y estos archivos no entran en el
bundle, así que se pueden correr y editar sin miedo a romper producción.

**Doble clic en el `.bat`** y listo. La ventana queda abierta al terminar.

| Archivo | Qué hace | Cuándo |
|---|---|---|
| `1 - Auditar contenido.bat` | Lee Supabase y lista lo que falta cargar | Después de tocar carreras o novedades |
| `2 - Smoke de produccion.bat` | Revisa el sitio publicado de punta a punta | Después de cada deploy |
| `3 - Capturas del sitio.bat` | PNG desktop + mobile de 6 páginas | Para revisar un cambio visual |
| `4 - Verificar avisos (SQL).bat` | Copia el SQL y abre el editor de Supabase | Al tocar `WEBHOOK_SECRET`, la función `notificar` o el trigger |
| `5 - Subir cambios (deploy).bat` | Commit + push a main, o sea **deploy** | Cuando el cambio está listo |

Las tres primeras salen con código 1 si encontraron algo, así que también sirven
desde una terminal: `npm run auditar`, `npm run smoke`, `npm run capturas`.

## Detalles de cada una

### 1 — Auditar contenido

Busca el desfasaje entre la base y las fuentes reales, que es lo que nadie avisa:
carreras visibles sin plan de estudios, carreras sin slides (esas disparan un
mail de `/api/notificar-carrera` **cada vez** que alguien abre la ficha), slugs
duplicados, niveles desconocidos y novedades publicadas sin imagen, que salen con
el `og:image` vacío al compartirlas.

Las carreras marcadas `proximamente` bajan a aviso: todavía no tienen temario
publicado, no es un error.

Lee con la anon key, así que no necesita credenciales extra.

### 2 — Smoke de producción

Rutas principales en 200, las cinco cabeceras de seguridad, `noindex` donde
corresponde, los cinco redirects, las ~119 URLs del sitemap y el peso real
comprimido de la home.

El peso se mide pidiendo a producción, no comprimiendo el HTML local: Vercel
comprime al vuelo con otra calidad y el número local no sirve para comparar.

Desde una terminal admite opciones:

```
npm run smoke -- --rapido                  # saltea el barrido del sitemap
npm run smoke -- --base=http://localhost:3000
```

### 3 — Capturas del sitio

Sale a `screenshots/<AAAAMMDD-HHMM>/`, que ya está fuera de git. Al terminar
abre la carpeta sola.

Usa el perfil `iPhone 13` de Playwright. Importa: `chrome --headless
--window-size=390,...` **no** da un viewport CSS de 390 px (la página se maqueta
a ~504 y la imagen recorta), o sea que inventa recortes en móvil que en un
teléfono real no existen. Ya hizo reportar un bug inexistente una vez.

Opciones desde una terminal:

```
npm run capturas -- --rutas=/faq,/contacto
npm run capturas -- --solo=mobile --viewport
npm run capturas -- --base=http://localhost:3000
```

Desde Git Bash las rutas con `/` inicial se manguean a rutas de Windows; usar
PowerShell, o escribirlas sin la barra: `--rutas=faq,contacto`.

Lo que depende de timing (restauración de scroll, carga de imágenes) hay que
mirarlo contra producción: en `npm run dev` da falso verde.

### 4 — Verificar avisos

Los avisos de formulario fallan **en silencio**: `net.http_post` encola el pedido
sin bloquear, así que el `INSERT` responde 201 aunque la notificación se caiga.
Exactamente eso pasó del 20 al 27/07/2026, una semana entera, sin un solo error
visible desde la web.

El `.bat` copia `verificar-avisos.sql` al portapapeles y abre el SQL Editor.
Correr **un PASO por vez** (seleccionar el bloque y Run): no anda de una sola
pasada porque `pg_net` recién despacha el pedido cuando la transacción commitea,
y un `pg_sleep` en el mismo bloque que el `INSERT` esperaría algo que todavía no
salió.

Prueba los tres triggers, no sólo `consultas`. Esperado: tres filas con
`status_code` 200. Un 401 significa que el secreto del trigger no coincide con
el de la Edge Function.

### 5 — Subir cambios

Commit y push a `main`. **Push a main = deploy**, así que este botón publica el
sitio. Por eso no es un clic solo: pide confirmación y frena si algo no cierra.

El orden:

1. Corta si no estás en `main`, o si no hay nada para subir.
2. Muestra la lista completa de lo que se va a subir. **Mirarla.** Sube todo lo
   que esté modificado o sin trackear, no sólo lo último que tocaste.
3. Pide una descripción del cambio. Sin descripción no sube nada.
4. Pide confirmar con `S`.
5. Corre `npm run check` (lint + tipos + tests). **Si falla, no commitea ni
   sube**: es lo que evita publicar el sitio roto.
6. Commit, push, y te recuerda correr el 2 cuando Vercel termine.

Si el push falla, el commit ya quedó guardado en local: no se pierde nada, se
resuelve después.

Vacía `GH_TOKEN` y `GITHUB_TOKEN` antes de empujar. Si quedaron seteados en el
entorno con valores viejos, el push falla con un error que no explica nada.

En el mensaje no usar comillas dobles: cmd las come. Acentos, `%` y `&` van bien.
