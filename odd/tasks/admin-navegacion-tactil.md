# Navegación del panel con respuesta visible

## Objetivo y alcance autorizado
Dar respuesta visible al abrir Carreras y precios y evitar que el menú desplace los objetivos táctiles. El usuario autoriza implementación, commit y push a main. No se modifican sesión, permisos, datos privados ni descarga del buscador.

## Tareas
- [x] T1: convertir las tarjetas en enlaces accesibles y agregar estado de carga del buscador.
- [x] T2: mantener estable el menú táctil y verificar navegación, foco y carga.

Ruta delegada: varias superficies con lógica no trivial. Previsión: hasta 250 líneas propias. Estrategia: ask-on-risk. Se trabaja en main por la política del proyecto; el coordinador realiza commit y push.

## Aceptación y verificaciones
Tarjeta completa navegable con teclado y toque; foco visible; carga anunciada; menú de 48 px estable con entrada táctil y expansión con mouse compatible; cierre de sesión sin cambios.
Pruebas: node --test tests/admin-navegacion.test.mjs; npm run check. Capturas locales de escritorio y móvil; sin afirmar mediciones de producción.

## Progreso
T1 implementada. T2 implementada, cierre pendiente del check global y verificación independiente.
RED observado: node tests/admin-navegacion.test.mjs, 4 fallos antes de implementar. GREEN: node --test tests/admin-navegacion.test.mjs, 4 pruebas aprobadas (fuera del sandbox restringido). Árbol React y manejadores reales con dependencias simuladas, sin credenciales. git diff --check aprobado.
npm run check: lint aprobado con 28 advertencias preexistentes; typecheck aprobado; suite completa todavía en ejecución al traspaso.
Capturas SSR de componentes reales, Tailwind real y sesión/router simulados en escritorio (1280 px) y móvil (375 px). No verifican navegación hidratada ni tiempos de producción. Referencias técnicas: documentación local Next, Link y loading.js (node_modules/next/dist/docs).

## Reversión
Revertir solamente app/admin/page.tsx, components/admin/sidebar.tsx, app/admin/buscador/loading.tsx y tests/admin-navegacion.test.mjs. No tocar trabajos paralelos.

## Próximo paso
Verificación independiente final: npm run check terminó con código 0, 431 pruebas aprobadas, ninguna omitida; lint con 28 advertencias y typecheck aprobado. Prueba focal repetida por el coordinador: 4/4 aprobadas. Componentes hidratados comprobados a 375 y 1280 px con sesión y navegación simuladas: toque sobre texto/icono/borde, Enter, foco, estabilidad táctil, hover con mouse y cierre de sesión. Sin errores de navegador. No demuestra latencia de producción ni streaming real de Next. Capturas en /tmp/admin-hydrated-375.png y /tmp/admin-hydrated-1280.png.
Coordinador: commit y push de estos archivos autorizados; registrar identidad y revisión en el espejo de recuperación.
