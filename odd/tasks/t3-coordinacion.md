# Coordinación T3, Codex y OpenCode

## Objetivo

Preparar una referencia local, selectiva y reversible para localizar perfiles y skills existentes, sin alterar OpenCode ni su configuración global.

## Alcance y restricciones

También `.gitignore`, `.codex/agents/*.toml` y los cuatro enlaces existentes en `.agents/skills/`, además de `AGENTS.md` y este documento. Sin secretos, redes, D1, cambios de cuenta, commits, merge ni push. Sol y Astra requieren autorización explícita. Las políticas de OpenCode no se presentan como permisos impuestos por T3.

## Tareas

- [x] T1 — Documentar en `AGENTS.md` cómo localizar instrucciones y perfiles existentes, con límites de activación y autorización.
- [x] T2 — Leer los cambios, comprobar rutas, `git diff --check` y estado de Git; registrar resultados.

- [x] T3 — Preparar cinco perfiles TOML y enlaces selectivos a skills CAU.
- [x] T4 — Verificar sintaxis, rutas, enlaces y estado; documentar límites de activación.
- [x] T5 — Preparar seis perfiles de coordinación con contratos y handoffs.
- [x] T6 — Verificar descubrimiento local, TOML, rutas y estado; precisar límites.
- [x] T7 — Permitir sólo los cuatro enlaces en Git y verificar las exclusiones.

## Verificación

Cambios documentales: lectura estructural y comprobación local de rutas y diff; no corresponde un test funcional ni acceso remoto. La sintaxis TOML no prueba el descubrimiento ni la activación de perfiles en la sesión.

Resultado: lectura de ambos archivos, rutas indicadas existentes en esta máquina, `git diff --check` sin errores y `git status --short` con únicamente los dos archivos autorizados. Sin prueba de activación nativa: la guía no instala ni activa perfiles.

## Ampliación: configuración de Codex

Se prepararon cinco TOML en `.codex/agents/` sin modelo fijado y cuatro enlaces relativos en `.agents/skills/`: `cau-brand`, `cau-design-patterns`, `cargar-carrera` y `bot-respuestas`. `tomllib` validó los cinco archivos; los cuatro enlaces resuelven dentro del worktree a un `SKILL.md`. `git check-ignore -v` confirma que `.agents/` está ignorado: los enlaces no viajan por Git. `git diff --check` y la comprobación de archivos nuevos no señalaron errores; `git status --short --untracked-files=all` mostró sólo las superficies autorizadas.

La comprobación posterior con `codex debug prompt-input` en este worktree mostró los cinco perfiles en `additional_tools` y las cuatro skills en `developer` para un nuevo prompt local. No prueba ejecución de agentes ni disponibilidad en otras conversaciones. Las instrucciones no garantizan sólo lectura y los agentes heredan los permisos del padre.

## Ampliación: seis perfiles de coordinación

Se añadieron `arquitecto`, `frontend`, `backend`, `base-de-datos`, `qa` e `integrador` en `.codex/agents/`, sin fijar modelos. Definen responsabilidades, superficies y handoffs; requieren aprobación antes de integrar y respetan las autorizaciones de base de datos y operaciones remotas. T3 selecciona proveedor por tarea y disponibilidad; OpenCode conserva contexto y permisos propios.

Verificación: `tomllib` interpretó los once TOML; `codex debug prompt-input` mostró los once nombres en `additional_tools` y las cuatro skills en `developer` para un nuevo prompt local. Los cuatro enlaces relativos resuelven dentro del worktree; `.agents/` sigue ignorado. `git diff --check` y la comprobación de archivos nuevos no informaron errores. `git status --short --untracked-files=all` muestra sólo las superficies autorizadas.

Pendiente: probar la ejecución real de los perfiles y el descubrimiento en otras conversaciones o fuera de este worktree. No se ejecutaron agentes ni se accedió a redes o bases. Los perfiles no imponen permisos ni activan OpenCode; los enlaces ignorados no viajan por Git.

## Inclusión selectiva de enlaces

Se permiten sólo los cuatro enlaces existentes en `.agents/skills/`; el resto de `.agents/` permanece ignorado. La inclusión en Git es posible, pero aún no hay commit ni integración. Los resultados de verificación anteriores describen el estado previo a este cambio.

Verificado: `git check-ignore --no-index` mantiene ignoradas `.agents/privado`, `.agents/reports/x`, `.agents/skills/otro` y rutas anidadas representativas; los cuatro enlaces no están ignorados y resuelven a skills dentro del worktree. `git ls-files --others --exclude-standard -- .agents/` mostró exactamente esos cuatro enlaces. `tomllib`, `git diff --check` y `git status --short --untracked-files=all` se comprobaron sin errores. No se prepararon archivos para commit.

## Corrección de privacidad: directorios anidados

La primera excepción selectiva eliminó por error la protección de `.agents/` fuera de la raíz. Se recuperó la regla global y se exceptuó sólo el directorio raíz antes de aplicar sus restricciones y las cuatro excepciones. `git check-ignore --no-index` confirmó que `componentes/.agents/privado`, `cloudflare/.agents/skills/otra`, `.agents/privado` y `.agents/skills/otro` están ignorados; los cuatro enlaces permanecen visibles. `git ls-files --others --exclude-standard -- .agents/` muestra exactamente esos enlaces. Sin staging, commit ni integración.

## Ampliación selectiva de skills

Se agregaron enlaces relativos a `piezas_siglo21`, `piezas_teclab`, `piezas_teclab2`, `piezas-para-el-publico`, `lienzo-de-diseno`, `remotion`, `calcar-imagenes` y `diseno-uiverse`. Antes de agregarlos no aparecían con esos nombres en el prompt local; después, `codex debug prompt-input` mostró cada nombre una vez en `developer`. Esto acredita descubrimiento local para un nuevo prompt, no la ejecución de las skills ni su disponibilidad en otras sesiones. Las ocho descripciones originales suman 4161 bytes UTF-8; sus líneas completas en el prompt suman 4593 bytes, sin estimar tokens.

`git check-ignore --no-index` confirmó las doce excepciones exactas y que siguen ignorados ejemplos privados y `.agents/` anidados. Los doce enlaces resuelven a `SKILL.md` dentro del worktree; `git ls-files --others --exclude-standard -- .agents/` muestra exactamente esos enlaces. TOML y `git diff --check` sin errores. Los cambios siguen sin commit ni integración.

T3 expone la selección de modelo de una conversación y de proveedor por tarea. No se comprobó equivalencia con `/auto`, `/codex` o `/free`, ni conservación de contexto al cambiar de proveedor; esos modos no se migraron ni se aplicaron. Las verificaciones previas de cuatro enlaces son históricas.

## Verificación previa a integración

El control de raíz `npm run check` terminó correctamente usando las dependencias locales: lint sin errores (16 advertencias), typecheck correcto y 296 pruebas (294 aprobadas, 2 omitidas). La carga de perfiles y skills se verificó en un prompt local nuevo; no se ejecutaron los perfiles. OpenCode conserva sus configuraciones propias y sigue pendiente validar las equivalencias de sus comandos de cambio de modo.
