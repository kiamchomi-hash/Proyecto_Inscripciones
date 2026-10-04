# Contrato tipado de Supabase

`lib/database.types.ts` se generó el 02/10/2026 desde el esquema `public` del
proyecto remoto configurado en `.env.local`, con la CLI 2.118.0 fijada en el
lock. Contiene metadatos de tablas, columnas, relaciones y RPC; no contiene
filas, precios, contactos ni credenciales. No proviene del fixture sintético.

Los cuatro clientes y el cliente del proxy reciben `Database` como genérico.
Eso permite comprobar tablas, inserts, updates y argumentos de RPC al compilar;
no concede permisos, no sustituye RLS y no valida los JSON en tiempo de ejecución.
Los errores de columnas en un `select` pueden inferirse como un tipo de error:
hay que consumir el resultado con un contrato concreto, sin ocultarlo con casts.

## Regenerar después de cambiar el esquema

Con la CLI autenticada mediante `supabase login` y acceso al proyecto:

```bash
npm run db:tipos
git diff -- lib/database.types.ts
npm run check
```

También están los envoltorios `herramientas/tipos-supabase.sh` y `.bat`.
El comando usa la CLI ya instalada, obtiene el identificador desde
`NEXT_PUBLIC_SUPABASE_URL` y consulta sólo el esquema público remoto. No ejecuta
SQL de migración ni necesita service role. Ante fallo de la CLI o salida inválida
conserva el archivo anterior. Se revisa el diff antes de versionarlo, especialmente
si aparecen tablas, relaciones o RPC ajenas al sitio. No agregar tokens al código
ni usar `--debug` para compartir salidas de autenticación.

## Separar esquema y presentación

`FaqPregunta` es un `Pick` del tipo generado: sólo las columnas publicables.
`Campo.columna` y `columnaDe()` se limitan a las claves del insert de `consultas`;
`casas.ts` sigue declarando qué pide cada formulario. No se agregaron campos ni
cambiaron payloads. Una columna nueva requiere actualizar el esquema, regenerar
los tipos y verificar la base real según `docs/formularios-por-casa.md`.

La home y `/teclab` usan la proyección literal `COLUMNAS_CATALOGO`, que permite
inferir las columnas, y `carreraACatalogo()` adapta los resultados: normaliza
texto anulable y orden, calcula `tieneSlides` sólo para listas y excluye los
slides del objeto publicado. Conservan los filtros de oferta y las exclusiones
de Identidad Argentina en la home.

`tests/contratos/supabase.ts` se compila, sin ejecutar consultas. Sus
`@ts-expect-error` comprueban que nombres de tablas, columnas y RPC incorrectos,
valores inválidos y argumentos incompletos sigan rechazados. Si el contrato
pierde precisión, typecheck falla porque deja de existir el error esperado.
Las pruebas del adaptador verifican normalización y exclusión del JSON pesado.

## Detalle de carreras: JSON validado antes de publicar

`lib/datos/carrera-detalle.ts` comparte la frontera de datos entre
`/api/carreras-detalle` y `/carreras/[slug]`. Sus proyecciones literales permiten
inferir las columnas consultadas. Los adaptadores reconstruyen exclusivamente
los campos públicos; ni una fila completa ni claves extra del JSON pueden
arrastrar `descuento_especial` u otros datos ajenos al contrato.

La validación recorre las cinco variantes: portada, modalidad, evaluación,
plan de estudios y cierre, con sus listas y objetos anidados. Conserva `slides`
null y listas vacías. Normaliza los opcionales null a ausencia, no a un valor
inventado. Las columnas anulables `descripcion`, `enfoque`, `duracion` y `titulo`
se convierten en texto vacío, y `orden` en cero. Los demás campos anulables
conservan null. No cambia los consumidores ni la presentación.

La oferta oculta se filtra **antes** de validar. Un slide inválido de una carrera
visible impide publicar toda la respuesta: API 502 sin `Cache-Control` público;
página, metadata y parámetros estáticos propagan un error con id y ruta del
campo. El registro de validación no incluye el contenido. No se omite la carrera
corrupta para simular éxito parcial ni se cambia el reintento del cliente.

La lectura remota autorizada del 02/10/2026 encontró 89 filas activas visibles
compatibles: ocho `imagen_mobile: null` y una `paginas[1].derecha: null` se
normalizan a ausencia; un `extras: null` en la raíz de un plan se descarta por
ser una clave desconocida. No se modificó la base.

`tests/carrera-detalle.test.mjs` ejecuta los adaptadores y los handlers reales
con consultas simuladas. Cubre campos conocidos, proyección exacta, nulabilidad,
errores anidados, filtro previo, caché y propagación de errores. Los contratos
compilados comprueban además que una proyección incompleta o inválida no sirve
para alimentar los adaptadores y que `Json` no es un arreglo de slides tipado.

## Alcance pendiente de A3

Este avance no elimina todos los casts del proyecto. Siguen pendientes
el adaptador de materias, el tipado del armado dinámico de la fila de consultas
y las demás fronteras JSON fuera del detalle de carreras.
`Carrera` sigue siendo un tipo de presentación manual; el tipo generado refleja
las nulabilidades reales y no afirma que `slides` tenga un formato particular.
No convertir `Json` a una estructura de slides con un cast y presentar eso como
validación. Las pruebas de integración de RLS y permisos siguen siendo necesarias.

Fuentes: [referencias](../referencias/2026-10-02-tipos-supabase.md).
