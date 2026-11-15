# Reparto de modelos en T3

## Objetivo
Reproducir el reparto solicitado mediante instrucciones concretas de selección y delegación en T3, sin atribuirle comandos de OpenCode.

## Restricciones
- Trabajar sólo en este worktree; no modificar configuración global, cuentas, secretos, bases ni usar redes.
- No usar subagentes, invocar modelos, hacer commit, merge o push.
- Conservar modelos, funciones y límites solicitados; no sustituir proveedores ni consumir Sol o Astra sin autorización.
- Distinguir guía, selección efectiva y capacidades no verificadas de T3.

## Tareas
- [x] Incorporar a AGENTS.md el reparto y el procedimiento de T3.
- [x] Comparar cada modelo, función y límite con el pedido y la guía existente de OpenCode.
- [x] Verificar diff, estructura y estado; entregar para integración sin commit.

## Verificación
- Comparación de las nueve filas con el pedido: correcta.
- Lectura estructural, `git diff --check` y `git status --short`: realizados.
- No se invocaron modelos ni se comprobó disponibilidad, cuota o cambio de coordinador por turno. Pendiente: integración autorizada y comprobación en T3.

## Verificación previa a integración

`npm run check` pasó: 294 pruebas aprobadas y 2 omitidas; lint y typecheck finalizaron sin errores. La guía no activa ni impone los modos de forma automática y requiere seleccionar explícitamente el coordinador.
