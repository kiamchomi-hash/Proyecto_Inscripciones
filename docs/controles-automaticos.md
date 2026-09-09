# Controles automáticos

`npm run calidad` ejecuta código, dependencias, contenido, Search Console, medición,
producción, SEO de todas las páginas, integraciones y navegador. Cada control deja
su log en `herramientas/vigilancia-logs/calidad/<fecha>/` y se ejecutan todos aunque
uno falle. Un código 2 significa que falta una fuente o no se pudo verificar; nunca
se convierte en un aprobado. `npm run leads -- --estricto` exige las tres fuentes.
El informe renueva las sesiones OAuth vencidas mediante la CLI de Vercel. Compara
Analytics y Supabase con la misma ventana de días UTC y muestra el desglose diario
si difieren. Los timeouts y errores 5xx tienen hasta dos reintentos; si persisten,
la fuente queda no disponible.

## Comandos por área

| Comando | Qué comprueba |
|---|---|
| `npm run check` | ESLint, TypeScript, tests de API, campos, resiliencia, roles, eventos y taxonomía |
| `npm audit` | Vulnerabilidades del árbol instalado |
| `npm run auditar` | Faltantes y consistencia de contenido en Supabase |
| `npm run smoke` | Rutas, cabeceras, redirects, sitemap y compresión |
| `npm run seo` | Indexación y rendimiento en Search Console |
| `npm run leads -- --estricto` | Disponibilidad de las tres fuentes y discrepancias entre eventos y filas |
| `npm run calidad:seo` | Todas las URLs del sitemap: title, descripción, canónica, idioma, h1, JSON-LD e imágenes sociales accesibles |
| `npm run calidad:integraciones` | Acceso anónimo al panel/API; columnas reales, RLS, grants, triggers y respuestas recientes de pg_net, con transacción de sólo lectura |
| `npm run calidad:web` | Chromium: 360, 390, 768 y 1440 px, desbordes, errores JS, axe WCAG A/AA, catálogo, diálogos, foco, contacto y presupuestos de rendimiento |

El navegador incluye las rutas públicas principales y una muestra descubierta desde
el sitemap de cada plantilla dinámica: carrera, materia y artículo. SEO recorre todas.
No se crea un segundo inventario de rutas, cabeceras ni redirecciones: la fuente sigue
siendo `lib/vigilancia-esperado.ts`.

## Navegador y comparación visual

Instalación en una máquina nueva: `npx playwright install chromium firefox webkit`.
En Linux puede necesitar `npx playwright install --with-deps`.

```bash
npm run calidad:web -- --base=http://localhost:3100
npm run calidad:web -- --navegador=firefox
npm run calidad:web -- --navegador=webkit
npm run calidad:web -- --base=http://localhost:3100 --simular-formularios
npm run calidad:web -- --registrar-visual
npm run calidad:web -- --visual
```

`--rutas=/,/contacto` y `--anchos=390,1440` permiten una revisión acotada. La corrida
completa es la que no lleva esos filtros. Se debe servir un build de producción
para medir rendimiento; `next dev` sirve para depurar, no para certificar presupuesto.
Se toman tres muestras y se exige mediana LCP <= 4000 ms, CLS <= 0,1 y JavaScript
comprimido <= 1,5 MB. Es laboratorio sin red móvil emulada; no sustituye datos de campo.

Las referencias visuales se registran explícitamente y **se revisan antes de aceptarlas**.
Se guardan por sistema operativo y navegador en `herramientas/visuales/`, fuera de git.
No se aprueba una comparación si falta una referencia. El límite es 0,5% de píxeles
distintos, con tolerancia de color 0,15; cambió el alto/ancho también es fallo. Los
iframes, canvas y videos se enmascaran; las imágenes y el resto del contenido no.
Las capturas y diferencias quedan en `output/playwright/calidad/<fecha>/`.
Actualizar Playwright, fuentes, contenido o sistema puede requerir revisar una nueva
referencia; no registrar otra automáticamente ante una diferencia.

El navegador intercepta analytics y tracking **antes de navegar**, y bloquea las
escrituras al sitio. La prueba de error/reintento del formulario sólo acepta localhost,
con captcha y respuesta API simulados. Verifica la reacción del componente y el evento
de conversión, no la entrega real. Las pruebas de roles ejecutan el proxy con sesiones
simuladas; el chequeo público sí consulta los endpoints reales sin sesión.
En HTTP local se retira sólo `upgrade-insecure-requests` del documento interceptado:
WebKit lo aplica también a localhost y sin esto intenta descargar el JavaScript por
HTTPS desde un puerto HTTP. Las demás directivas se conservan; producción no se altera.

## Ejecución recurrente

GitHub Actions ejecuta `check` y `npm audit` en cada push a main. Vercel ejecuta
`check` antes del build: un fallo detiene esa publicación. Los workflows se activan
cuando el archivo está publicado en GitHub, no por existir en la carpeta local.

La vigilancia existente incorpora la opción `calidad`, que ejecuta
`npm run calidad -- --solo-web --visual`. No agrega otro cron de Vercel ni duplica
los avisos del smoke. La tarea local requiere referencias visuales registradas,
navegadores instalados y las credenciales existentes en `.env.local`.
En esta PC quedó registrada `CAU - Vigilancia calidad web`, los domingos a las
10:30, con ejecución al recuperar disponibilidad y sin superponer instancias.
La corrida incluye Chromium completo y los recorridos principales en Firefox y WebKit.

## Límites que requieren evidencia adicional

- Axe y capturas no certifican la calidad del diseño ni conformidad WCAG completa.
- La vigencia académica requiere contrastar fuentes oficiales; detectar un campo
  lleno no significa que su dato siga vigente.
- pg_net reciente no prueba que **cada** integración haya enviado hoy; puede no
  haber actividad o haber sólo una familia de eventos. Sin observaciones queda
  explícitamente no verificado. No se inventan consultas para producir actividad.
- Los recorridos reales de profesor/admin requieren cuentas de prueba autorizadas.
- Turnstile real, recepción en WhatsApp y entrega de Telegram se verifican con sus
  procedimientos existentes; no se saltean protecciones ni se crean triggers.
- El nuevo evento `formulario-iniciado` mide el primer foco por montaje, sin valores
  ingresados. La diferencia con envíos es orientativa, no abandono por paso o sesión;
  no existe historial previo a su publicación. No se emiten eventos de prueba a producción.

Resultados técnicos: `.agents/reports/web-quality.json`, `seo-paginas.json` e
`integraciones.json`. No publicar estos archivos con datos de entornos privados.
