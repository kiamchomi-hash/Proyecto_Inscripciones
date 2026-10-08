# Precios diarios en Linux

Objetivo: actualizar Siglo 21, Teclab e Identidad Argentina a las 09:00 de Argentina y publicar los datos autorizados.

Problema: la tarea diaria quedó en Windows; Linux no tiene programación. El coordinador no publica la tabla privada Teclab.

Alcance: flujo comercial local, pruebas, documentación y timer systemd de usuario. Sin sudo, linger, ramas, push ni credenciales en archivos versionados. Scripts comerciales gitignorados no se fuerzan a git. Publicaciones autorizadas por el usuario: CASA/SharePoint perfil privado, Teclab portal/dashboard, Identidad API, DEPC Suite, sitio BUSCADOR_SECRET y Supabase cau_editor EDITOR_DATABASE_URL.

## Tareas
- [x] T1 — Integrar publicación de precios Teclab al flujo de las tres casas, respetando --sin-publicar y fallos independientes.
- [x] T2 — Instalar timer diario 09h Argentina con recuperación al iniciar sesión; prueba real autorizada.

Ruta: delegada para ambas tareas; preparación y múltiples archivos no triviales. TDD con pruebas locales stub RED/GREEN antes de implementar. Verificar suite comercial, npm run check, systemd-analyze verify y calendar; registrar fallos honestamente.

Estrategia: ask-on-risk, estimación 300 líneas; no commits de archivos comerciales ignorados. main sin ramas por política específica. No push.

## Evidencia y próximo paso
Implementación local verificada y activada:
- T1: publicación Teclab tras extracción y regeneración propia; --solo-teclab evita leer/escribir Identidad. --sin-publicar omite ambos destinos. Prueba real exitosa. Sin commit de scripts comerciales ignorados; cierre documental a cargo del padre.
- T2: instalador idempotente systemd usuario preparado, calendario 09:00 America/Argentina/Buenos_Aires y Persistent=true. Unidades instaladas y timer activado; prueba real única exitosa.
- TDD observado: dos fallos de publicación independiente antes del cambio; módulo instalador ausente antes de implementarlo; prueba --solo-teclab falló antes del cambio. GREEN final suite comercial: 372/372.
- npm run check: primera corrida PASS lint sin errores (27 advertencias), typecheck PASS, tests 337/337; repetición final PASS tras último test comercial (337/337, sin errores de lint/typecheck).
- systemd-analyze verify: PASS unidades fixture con rutas reales y con espacios; calendar resuelve 05/10/2026 09:00 Argentina como próxima ejecución. Primera verificación reveló WorkingDirectory con comillas inválido, corregido antes de GREEN.
- git diff --check PASS. Sin normalizadores mutantes aplicables; no commits ni push. Publicaciones remotas autorizadas verificadas en prueba real.
- Superficie ampliada por padre: herramientas/ventas/extraer-externos.mjs para aislar regeneración Teclab.
- Estimación authored del trabajo: ~275 líneas, sin minificar por presupuesto.

## Activación y prueba real — 04/10/2026
- Instalación: node herramientas/ventas/programar-precios-linux.mjs --instalar PASS, unidades en configuración local de systemd usuario fuera git, sin secretos.
- systemd-analyze --user verify unidades reales PASS; systemctl --user enable --now cau-precios.timer PASS.
- No se inició automáticamente una ejecución persistente pendiente: se comprobó servicio inactive/dead sin timestamp antes de start.
- Una sola ejecución: systemctl --user start cau-precios.service, inicio 15:11:58 y fin 15:18:35 Argentina, ExecMainStatus=0.
- Financiación, extracción Teclab, Identidad y Siglo 21: éxito. Regeneración Teclab independiente y publicación precios privados: éxito. Calendario, encuentros, externas, buscador, bot y publicación buscador: éxito.
- estadoDePrecios: las tres casas vigentes y con antigüedad 0 días.
- SELECT de verificación precios_privados: 17 filas Teclab, las 17 vigentes hasta 04/10/2026; última publicación 15:18:20 Argentina.
- Timer enabled, próximo 05/10/2026 09:00 Argentina. Sin sudo ni linger.
- No retries, cambios manuales de vigencia ni nueva corrida. Recuperación al iniciar sesión pendiente de comprobar en una interrupción real; Persistent=true validado estructuralmente.
- La revisión nativa del candidato documental no cubre scripts comerciales ignorados: no se afirma receipt de éstos. Verificación independiente local y prueba real son la evidencia.

Próximo paso: entrega del padre y sincronización del mirror Engram. Operación diaria automática ya activa.
