# Acceso local automatizado a HubSpot

## Objetivo y autorización
Abrir un navegador externo con perfil exclusivo, iniciar sesión con las variables SIGLO_MICROSOFT_EMAIL y SIGLO_MICROSOFT_PASSWORD y obtener únicamente el código de acceso de HubSpot del correo institucional. Autorizado por el usuario el 17/10/2026. No usar el navegador interno ni modificar negocios, contactos, tareas o mensajes.

## Alcance y restricciones
- Herramientas privadas en herramientas/ventas/, que está ignorada por git.
- Perfil exclusivo; no reutilizar perfiles cotidianos ni de precios.
- No registrar credenciales, cookies, tokens ni códigos en archivos o logs.
- Detener ante CAPTCHA, aprobación adicional, cambios de permisos o código ambiguo.
- No publicar ni forzar archivos privados a git; no tocar cambios ajenos.
- Ruta delegada: preparación y escritura de varios archivos no triviales.
- Entrega ask-on-risk; estimación inicial 250–400 líneas privadas. Sin push ni PR.

## Tareas
- [ ] T1 Implementar acceso seguro y pruebas deterministas; observar RED y GREEN.
- [ ] T2 Probar navegador externo y verificar sesión real, incluida lectura acotada de OTP cuando sea necesaria.

## Superficies previstas
- herramientas/ventas/rutas.mjs
- herramientas/ventas/hubspot-acceso.mjs
- herramientas/ventas/tests/hubspot-acceso.test.mjs
- herramientas/ventas/LEER-hubspot.md
- herramientas/ventas/perfil-hubspot/ (estado privado generado)

## Criterios y comprobaciones
Acceso sólo a orígenes oficiales observados, credenciales sólo desde entorno local, OTP reciente y vinculado al intento actual. Éxito sólo con sesión autenticada de HubSpot verificada. Ejecutar node --test herramientas/ventas/tests/hubspot-acceso.test.mjs y node --check herramientas/ventas/hubspot-acceso.mjs. La prueba real debe informar bloqueos sin confundirlos con éxito.

## Estado
Exploración completada: existe Playwright y lanzamiento persistente de Brave en navegar-fuentes.mjs; login Microsoft parcial en descargar-precios-xlsx.mjs. Computer Use externo desconectado; esto no verifica aún el lanzamiento local independiente. Implementación y prueba real pendientes. Sin commits; herramientas privadas no se fuerzan a git. Espejo de memoria pendiente de lectura de confirmación.

## Cierre parcial, 17/10/2026
- El usuario señaló que no se consiguió el resultado. Se detuvo la implementación y los reintentos.
- Existen script privado, pruebas y LEER-hubspot.md. Once pruebas focales y sintaxis aprobadas; verificación independiente inicial sin defectos graves (anterior a los últimos ajustes de estados Microsoft).
- Una sesión existente se verificó; el acceso autónomo desde perfil vacío NO quedó probado. Los intentos nuevos terminaron en Microsoft. T1 y T2 siguen abiertos: no se declara login automatizado completo.
- npm run check falló: deploy.test.mjs, pre-push.test.mjs, secretos.test.mjs y supabase-local-safety.test.mjs; hay restricciones de subprocess y Gitleaks no disponible. No se atribuyeron a cambios base sin prueba.
- RDD desactivado globalmente; evaluación no pudo delimitar cambios privados ignorados y archivos ajenos sin inventario. No se inició revisión nativa ni se hicieron commits/push.
- Limpieza: final diagnóstico interrumpido (exit 130); no quedaron procesos Brave identificados con el perfil exclusivo. Se conservan archivos y perfil principal. No se modificaron negocios ni se enviaron mensajes comerciales.
- Siguiente paso sólo si el usuario pide retomarlo: identificar el estado real de Microsoft con diagnóstico acotado y verificar un único recorrido desde cero antes de declarar éxito.
