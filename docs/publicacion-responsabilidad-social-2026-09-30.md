# Publicación de Responsabilidad y Gestión Social

Verificado el 30/09/2026. El usuario confirmó que la carrera se ofrece desde el CAU.

## Estado

- Se reutilizó la fila `carreras.id = 92`, previamente inactiva. No se creó otra carrera ni una página hardcoded.
- La tarjeta ya aparece en la home pública, dentro de Tecnicaturas.
- La ficha usa la página dinámica existente: `/carreras/tecnicatura-en-responsabilidad-y-gestion-social`.
- **La URL pública todavía devuelve 301 hacia la home:** se retiró su redirect de `next.config.ts` en local, pero no se hizo commit, push ni deploy. La página propia se verificó en el servidor local.

## Contenido

Duración: 2.5 años. Título: Técnico/a Universitario/a en Responsabilidad y Gestión Social, según la ficha oficial que cita la Resolución Ministerial 1483/2021.

Se conservó la foto local y la estructura de tres slides. Se reemplazó el plan antiguo por las 18 materias oficiales distribuidas en cinco cuatrimestres. La portada muestra el título correcto. El cierre dice «Cursá online y rendí tus exámenes en el CAU», sin prometer exámenes remotos, y se corrigieron las comillas del HTML del título. La sección de modalidad distingue Educación Distribuida de Educación Distribuida Home.

## Evidencia

- SQL aplicado: `sql/2026-09-30_publicar_responsabilidad_social.sql`; afectó exactamente la fila 92.
- Lectura posterior: `activa = true`, duración `2.5 años`, título universitario y tres slides.
- Regresión: `tests/responsabilidad-social.test.mjs` falló primero por el redirect 301 y pasó después de retirarlo; conserva las bajas de Agroinformática y Venta Directa.
- `npm run check`: lint sin errores (29 advertencias existentes), typecheck correcto, 129 pruebas aprobadas.
- Capturas en `output/playwright/responsabilidad-social/`: escritorio de 1280 px y móvil de 375 px, página local completa, tres slides y tarjeta/home públicas. Sin desbordamiento horizontal en la página propia.
- No se enviaron formularios. Las solicitudes de analytics y seguimiento se bloquearon en las comprobaciones del navegador. Un primer intento local no bloqueó `track-direct-open`; no pudo escribir porque la service role no está configurada en local.

## Reversión y publicación restante

El estado anterior, sin precios ni credenciales, está en `notas-locales/responsabilidad-social-antes-2026-09-30.json`. Su SQL de reversión local restaura sólo los campos modificados de la fila 92. No ejecutarlo salvo pedido explícito.

Falta publicar el cambio de `next.config.ts` y verificar que la URL directa responda 200 con su canónica propia. El modal de la home no necesita ese deploy para mostrar los datos actualizados.

## Fuentes

- https://21.edu.ar/carreras-y-programas/tecnicatura-en-responsabilidad-y-gestion-social — duración, título, modalidades y plan vigente.
