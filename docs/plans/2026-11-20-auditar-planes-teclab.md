# Auditoría de planes de Teclab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Crear una skill manual que compare los planes de las carreras activas de Teclab con las fuentes oficiales y corrija en producción sólo `carreras.plan_estudios` cuando la diferencia esté confirmada.

**Architecture:** OpenCode debe anunciar e invocar la skill cuando la conversación trate planes de estudio o materias de Teclab. La skill vive en `.claude/skills`, se expone con el enlace selectivo de `.agents/skills` y la excepción de `opencode.jsonc`; ese enlace se añade a la allowlist pública de `herramientas/secretos.mjs`. Los recordatorios recurrentes por Telegram se gestionan aparte y no ejecutan una auditoría por sí solos.

**Tech Stack:** Markdown, YAML frontmatter, JSONC, symlink Git y Node.js (pruebas existentes).

---

### Task 1: Crear el procedimiento de auditoría

**Files:**
- Create: `.claude/skills/auditar-planes-teclab/SKILL.md`
- Reference: `docs/plans/2026-11-20-auditar-planes-teclab-design.md`
- Reference: `docs/alta-de-carrera.md`
- Reference: `docs/criterios.md`

**Step 1: Inicializar la skill con la plantilla del proyecto**

Run: `python3 .claude/skills/skill-creator/scripts/init_skill.py auditar-planes-teclab --path .claude/skills`
Expected: crea `.claude/skills/auditar-planes-teclab/SKILL.md` y los directorios de ejemplo.

**Step 2: Reemplazar la plantilla por instrucciones específicas**

Escribir `name: auditar-planes-teclab` y una descripción que haga que OpenCode anuncie/invoque la skill cuando se mencionen planes de estudio o materias de Teclab, especialmente al cierre de un cuatrimestre.

El cuerpo debe ordenar:

1. Leer desde D1 la lista vigente de carreras activas de Teclab y `plan_estudios`; excluir inactivas y `proximamente`.
2. Obtener la ficha oficial de Teclab y el PDF oficial enlazado desde esa ficha para cada carrera. No usar la ficha del CAU como fuente de verdad.
3. Comparar materias y período por período, anotando ausencias, diferencias de nombre, orden, año/cuatrimestre y materias vacías.
4. Si la ficha y el PDF oficial discrepan, o alguna fuente no está disponible, no inferir ni escribir ese plan; dejarlo como no resuelto.
5. Al invocar la skill, aplicar la autorización del usuario para modificar exclusivamente `plan_estudios` de carreras Teclab activas con diferencias verificadas. No modificar otros campos, casas o carreras.
6. Preparar SQL fechado con `WHERE id = ... AND nombre = ...`; inspeccionar el archivo y usar `npm run db:d1 -- --archivo ... --escribir`.
7. Ante un error de escritura, leer primero D1 para descartar aplicación parcial. Sólo reintentar si la lectura confirma que no se aplicó.
8. Leer de vuelta cada fila, comprobar las páginas públicas `.md`, y guardar las fuentes y el resultado en `referencias/AAAA-MM-DD-planes-teclab.md`.
9. Informar carreras revisadas, corregidas y no resueltas. Si la conversación sólo consulta una materia o un plan, responder esa consulta sin iniciar una auditoría masiva.

**Step 3: Eliminar los ejemplos no usados**

Borrar sólo `scripts/example.py`, `references/api_reference.md` y `assets/example_asset.txt` generados por `init_skill.py`; no agregar recursos sin necesidad.

**Step 4: Revisar el archivo**

Confirmar frontmatter válido, nombres consistentes, autorización acotada a la invocación y que las fuentes oficiales tengan precedencia. No empaquetar ni ejecutar el workflow contra producción durante la creación de la skill.

### Task 2: Habilitar la skill en OpenCode y el control de publicación

**Files:**
- Create symlink: `.agents/skills/auditar-planes-teclab` → `../../.claude/skills/auditar-planes-teclab`
- Modify: `opencode.jsonc`
- Modify: `herramientas/secretos.mjs`
- Test: `tests/secretos.test.mjs`

**Step 1: Agregar el enlace al mapa explícito de skills públicas**

En `herramientas/secretos.mjs`, añadir:

```js
'.agents/skills/auditar-planes-teclab': '../../.claude/skills/auditar-planes-teclab',
```

Conservar el mismo destino relativo que la entrada de `cargar-carrera`.

**Step 2: Crear el symlink selectivo**

Run: `ln -s ../../.claude/skills/auditar-planes-teclab .agents/skills/auditar-planes-teclab`
Expected: `.agents/skills/auditar-planes-teclab/SKILL.md` resuelve al archivo de `.claude/skills`.

**Step 3: Permitir el uso en OpenCode**

En `opencode.jsonc`, añadir la política allow para `skill:auditar-planes-teclab`, junto a las demás excepciones y sin alterar el deny general.

**Step 4: Extender la prueba del enlace público**

En `tests/secretos.test.mjs`, agregar casos que confirmen que la ruta exacta se reconoce como enlace público, acepta el destino esperado y rechaza un destino distinto.

**Step 5: Ejecutar la prueba focal**

Run: `node --test tests/secretos.test.mjs`
Expected: PASS.

### Task 3: Verificar integración y dejar lista la skill

**Files:**
- Verify: `.claude/skills/auditar-planes-teclab/SKILL.md`
- Verify: `.agents/skills/auditar-planes-teclab`
- Verify: `opencode.jsonc`
- Verify: `herramientas/secretos.mjs`

**Step 1: Comprobar la skill desde ambos caminos**

Leer `.claude/skills/auditar-planes-teclab/SKILL.md` y `.agents/skills/auditar-planes-teclab/SKILL.md`; deben resolver al mismo contenido.

**Step 2: Ejecutar controles de proyecto**

Run: `npm test`
Expected: PASS, incluyendo `tests/secretos.test.mjs`.

Run: `npm run check`
Expected: lint, typecheck y tests pasan antes del commit. Si ya había fallos, registrarlos sin corregirlos fuera del alcance.

**Step 3: Revisar la selección Git**

Verificar que el commit contenga sólo la skill, su enlace permitido, `opencode.jsonc`, la prueba y el plan/documentación propios. Preservar cambios ajenos ya presentes en el worktree.

**Step 4: Empaquetar la skill**

Run: `python3 .claude/skills/skill-creator/scripts/package_skill.py .claude/skills/auditar-planes-teclab /tmp/opencode`
Expected: validación correcta y paquete generado fuera del repositorio.

**Step 5: Commit**

```bash
git add .claude/skills/auditar-planes-teclab/SKILL.md \
  .agents/skills/auditar-planes-teclab \
  opencode.jsonc herramientas/secretos.mjs tests/secretos.test.mjs
git diff --cached
git commit -m "feat: agregar skill para planes de Teclab"
```

No ejecutar auditorías ni escrituras D1 por el solo hecho de crear o probar la skill; la invocación futura de la skill inicia ese workflow.
