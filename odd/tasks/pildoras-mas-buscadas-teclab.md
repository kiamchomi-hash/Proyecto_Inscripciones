# Más buscadas y etiqueta Teclab

## Objetivo y alcance autorizado
Marcar las once carreras del ranking 05/09–04/10/2026 como destacadas y ubicar Más buscada dentro de las tarjetas Teclab, en una fila propia sobre el título. Preservar Nueva roja y su prioridad, duración y tipo. No publicar Identidad Argentina en la home ni modificar su exclusión.

## Tareas
- [x] T1: Actualizar destacada en las once filas identificadas, preservando otros campos y verificar lectura posterior.
- [x] T2: Integrar la etiqueta Teclab dentro de la tarjeta con acento familiar y verificar escritorio y celular.

## Ruta y restricciones
Ambas tareas delegadas a un único escritor: lectura preparatoria, cambio de componente/estilos y pruebas. Sin ramas ni PR, conforme a la regla específica del proyecto. Sin push ni deploy autorizados. Trabajo local sobre main; commits propios al cierre del trabajo sustancial, si las comprobaciones lo permiten.

## Aceptación y comprobaciones
Once destacadas coincidentes con el ranking; ninguna otra columna modificada salvo updated_at por trigger. Nueva conserva prioridad. Más buscada Teclab no sobresale por arriba ni colisiona con duración/tipo a 1280 y 375 px. Prueba determinística RED/GREEN cuando aplicable, npm run check, capturas completas y detalle Teclab. Revisión nativa según el modo activo.

## Presupuesto y entrega
Estimación: 100–180 líneas de autoría, estrategia ask-on-risk. Una unidad coherente, sin publicación remota de código. SQL remoto autorizado exclusivamente mediante cau_editor para carreras.

## Progreso
T1 completada: transacción cau_editor con identidad exacta y baseline (sólo Abogacía destacada), diez UPDATE y COMMIT confirmado. Readback de once destacadas IDs 2, 8, 76, 85, 86, 87, 103, 132, 181, 217 y 228. Snapshot de todas las filas/columnas confirmó que sólo cambió destacada (se excluyó updated_at de la comparación). Compliance no se reintrodujo en la home.

T2 completada: fila propia debajo de duración/tipo y arriba del título, posición estática, borde tinta y acento familiar. Nueva y Próximamente conservan prioridad y ubicación.

Verificación observada: prueba de regresión RED antes del cambio (faltaba badgeInternoTeclab), GREEN después (1/1); npm run check exit 0, lint sin errores con 27 advertencias, typecheck correcto, 337/337 tests. El AssertionError del fixture de deploy es una salida esperada de su prueba negativa; la suite concluye sin fallas. git diff --check correcto.

Servidor local existente puerto 3000, sin iniciar ni detener procesos ajenos. Capturas completas home-1280.png y home-375.png, detalles teclab-1280-0.png / teclab-1280-1.png / teclab-375-0.png / teclab-375-1.png en screenshots/pildoras-carreras/. Geometría de las cuatro tarjetas: badge dentro, debajo de cabecera, encima del título y position static. Navegación sin clics ni modales, sin eventos career_clicks.

Referencias: referencias/2026-10-04-pildoras-carreras.md. Próximo paso: coordinador muestra capturas, sincroniza espejo Engram, revisa y registra commit propio. Sin commit, push ni deploy del escritor.
