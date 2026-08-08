# Herramientas

Verificaciones que no cubre `npm run check`. Nada de esto llega al sitio
publicado: Vercel sirve el build de Next y estos archivos no entran en el
bundle, así que se pueden correr y editar sin miedo a romper producción.

**Doble clic en el `.bat`** y listo. La ventana queda abierta al terminar.

En Linux, al lado de cada `.bat` hay un `.sh` con el mismo nombre y el mismo
comportamiento (`bash "herramientas/1 - Auditar contenido.sh"`, o doble clic si
el escritorio ofrece «Ejecutar en una terminal»). Son envoltorios: los `.mjs` que
hacen el trabajo son los mismos en los dos sistemas, así que un cambio de fondo
se toca una sola vez.

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
carreras visibles sin plan de estudios, carreras sin slides (esas abren una ficha
vacía), slugs duplicados, niveles desconocidos y novedades publicadas sin imagen,
que salen con el `og:image` vacío al compartirlas.

Correrla es la única forma de enterarse: antes había además un aviso por Telegram
cada vez que alguien abría una ficha vacía, y se eliminó el 01/08/2026.

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

El `.bat` copia `verificar-avisos.sql` al portapapeles y abre el SQL Editor. El
`.sh` hace lo mismo, pero el portapapeles en Linux depende del servidor gráfico:
usa `wl-copy` (Wayland), `xclip` o `xsel`, el primero que encuentre. Si no hay
ninguno instalado no se rompe: avisa la ruta del archivo para abrirlo a mano.
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

En Windows, en el mensaje no usar comillas dobles: cmd las come. Acentos, `%` y
`&` van bien. El `.sh` de Linux no tiene esa limitación.

## Vigilancia automática (sin doble clic)

Los cinco numerados son para usar a mano: abren una ventana y esperan una tecla
al terminar. Aparte de esos está `vigilancia.bat` (y su `vigilancia.sh`), que es
lo contrario — corre solo, sin ventana, y devuelve el código de salida de verdad.
Es el que usan las tareas programadas de Windows:

| Tarea programada | Cuándo | Qué corre |
|---|---|---|
| `CAU - Vigilancia dependencias` | lunes 9:00 | `npm audit` |
| `CAU - Vigilancia produccion` | todos los días 9:15 | el smoke completo contra producción |
| `CAU - Vigilancia contenido` | lunes 9:30 | `npm run auditar` |

**Esto no gasta créditos de Claude.** Los tres chequeos son programas de Node que
no llaman a ningún modelo; corren gratis las veces que haga falta. Los agentes de
`.claude/agents/` entran después, a mano, y sólo cuando hay algo que interpretar.

Cómo avisa: si un chequeo encuentra algo, aparece **`REVISAR-SITIO.txt` en el
escritorio** con el resumen, la ruta al log completo y qué agente pedirle a Claude
Code. El archivo se reconstruye entero en cada corrida a partir del estado de los
tres chequeos, así que **desaparece solo** cuando todos vuelven a dar limpio — no
hay que acordarse de borrarlo. Si no hay nada que reportar, no aparece nada.

Los logs quedan en `herramientas/vigilancia-logs/` (fuera de git) junto con
`estado.json`, que es lo que sostiene el borrado automático del aviso.

Dos decisiones que conviene conocer:

- **Sin internet no avisa, saltea.** Las tres tareas consultan la red, y una
  notebook arranca fuera de línea seguido. Antes de correr, resuelve un host
  neutral (`github.com`, no el dominio propio — si preguntara por el propio, una
  caída del sitio se confundiría con una caída de la conexión). Sin conexión deja
  constancia en el log y sale con 0.
- **`npm audit` se lee, no se obedece.** El código de salida es 1 ante cualquier
  vulnerabilidad, incluso una moderada en una devDependency, así que el aviso
  parsea el JSON y lista paquete, severidad y de qué se trata. La decisión de qué
  actualizar es del agente `auditor-dependencias`, que sabe que `npm audit fix`
  a veces propone downgrades peligrosos.

Para cambiar horarios o desactivarlas, buscar `CAU - Vigilancia` en el
Programador de tareas de Windows.

En Linux lo mismo va por cron (`crontab -e`), con la ruta absoluta del proyecto:

```cron
0  9 * * 1 cd /ruta/al/proyecto && herramientas/vigilancia.sh deps
15 9 * * * cd /ruta/al/proyecto && herramientas/vigilancia.sh smoke
30 9 * * 1 cd /ruta/al/proyecto && herramientas/vigilancia.sh contenido
```

Cuidado con el `PATH` de cron, que es mínimo: si node está instalado con nvm o
fnm no lo va a encontrar y las tres tareas fallan sin decir por qué. La forma
más simple de zanjarlo es una línea `PATH=...` arriba del crontab, con el
resultado de `dirname $(which node)` incluido.

El aviso sale al escritorio en los dos sistemas: `vigilancia.mjs` resuelve la
carpeta real (`Desktop`, `Escritorio` o lo que declare XDG), no la hardcodea.

## Mudarse a otra máquina

`git clone` trae el código, `CLAUDE.md`, los agentes de `.claude/agents/` y las
skills de `.claude/skills/`. Lo que **no** trae es lo que está gitignoreado a
propósito: las credenciales, la memoria de Claude Code y las preferencias.

Para eso está `entorno.mjs`. En la máquina que ya funciona:

```bash
node herramientas/entorno.mjs exportar
```

Deja `entorno-cau.tar.gz` en el home — fuera del repo, porque adentro van la
anon key de Supabase y la service account de Search Console. **No subirlo a
ningún lado.** Del otro lado, con el repo ya clonado:

```bash
node herramientas/entorno.mjs importar --desde=~/entorno-cau.tar.gz
```

No pisa nada que ya exista salvo que se le pase `--forzar`. Lo importante que
resuelve solo: la memoria de Claude Code vive en una carpeta cuyo nombre sale de
la ruta del proyecto (`~/.claude/projects/<ruta con guiones>/memory`), así que la
de Windows no le sirve a Linux; el script la recalcula.

Lo que no se puede empaquetar porque es un login, lo lista al terminar:
`vercel login`, `supabase login`, `gh auth login` y el alta del MCP de Search
Console.

Lo que **tampoco** viaja, y hoy no tiene solución automática, es el material
comercial: `carreras/`, `ventas/` y `herramientas/ventas/`. Están gitignoradas
—el repo es público y ahí hay precios— y desde la reorganización del 08/08/2026
ya no son un repo aparte que se clone. Son ~600 MB (los videos de Teclab pesan
casi todo), así que hay que copiarlas a mano entre máquinas. La historia vieja
quedó archivada en `~/Desktop/historico-repo-ventas.git`.
