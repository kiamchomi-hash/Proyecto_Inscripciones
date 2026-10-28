---
name: cargar-carrera
description: Cargar o actualizar los slides de una carrera de Siglo 21 en la tabla carreras de la D1 publicada - portada, plan de estudios y cierre, con la imagen local y su encuadre. Usar cuando se pida dar de alta una carrera de Siglo 21, completarle el plan de estudios o corregirle la ficha a partir de una URL de 21.edu.ar. Para el resto del alta (áreas, formularios, bot, SEO) y para Teclab o Identidad, manda docs/alta-de-carrera.md.
---

# Skill: Cargar Carrera en D1

Workflow para cargar los slides JSON de una carrera **de Siglo 21** en la tabla `carreras`.

## Alcance

- **Sólo Siglo 21.** Teclab no usa slides: su modal sale de `FICHAS` en `components/index/teclab.ts` más `descripcion` y `enfoque` con formato propio. Identidad Argentina la trae su API. Las dos se cargan según [docs/alta-de-carrera.md](../../../docs/alta-de-carrera.md).
- Esta skill cubre el paso 1 de esa lista para Siglo 21. **Un alta completa recorre la lista entera**: áreas, formulario, HubSpot, test vocacional, bot y folletos se buscan por nombre y no se actualizan solos.
- **Precios y descuentos quedan fuera.** El precio vive en `precios_privados` y lo carga `herramientas/ventas/publicar-precios-d1.mjs` (Teclab y Siglo 21). `descuento_especial` no se toca desde acá: se saca a propósito de los datos públicos.

## Flujo

1. **El usuario pasa una URL** de 21.edu.ar con la carrera (opcionalmente indica la posición de la imagen).
2. **Fetch de datos**: título, duración, área, plan de estudios completo y 2 bullets. La ficha oficial en PDF suele tener el plan más limpio que la página.
3. **Buscar imagen local**: `public/imagenes/Modales/[Nombre Carrera]/**/*`.
4. **Verificar nombre en DB**:
   ```bash
   npm run db:d1 "SELECT id, nombre, prefix, nombre_corto, nivel, duracion, titulo, enfoque, slides IS NOT NULL AS tiene_slides FROM carreras WHERE nombre ILIKE '%...%' AND activa = true"
   ```
   El nombre en DB puede diferir del completo (ej: "Informática" en vez de "Licenciatura en Informática").
5. **Armar slides** (portada + plan_estudios + cierre; los 3 explícitos).
6. **Escribir un SQL fechado** en `sql/AAAA-MM-DD_<carrera>.sql` con el `UPDATE` (o el `INSERT` si es alta) y correrlo contra la D1 publicada con `npm run db:d1 -- --archivo sql/<archivo>.sql --escribir`. Mostrar el SQL antes de correrlo.
7. **Verificar** (ver abajo) y **ajustar imagen** si el usuario lo pide: otro `UPDATE` de `imagen_desktop_position` o `imagen_brightness`.

Las páginas leen D1 en cada pedido y salen `no-store`, así que el cambio se ve en la próxima visita: no hace falta revalidar ni deployar. Por lo mismo, **si el alta necesita código nuevo** (área, `SEO_ESPECIFICO`, `COVER_OVERRIDES`), primero se publica el Worker y después se carga la fila; si no, producción muestra la carrera a medio armar.

## Formato de slides

El contrato real está en `lib/datos/carrera-detalle.ts` (`validarSlides`). **Un slide que no lo cumple tira error en la ficha `/carreras/<slug>`**, así que la forma se respeta al pie de la letra. Claves que no figuran ahí se descartan sin aviso.

### Slide 1: Portada
```json
{
  "type": "portada",
  "imagen_desktop": "/imagenes/Modales/[Carpeta]/[archivo]",
  "imagen_desktop_position": "center|left center|right center|30% center|top",
  "bullets": [
    "Bullet 1 corto sobre perfil profesional",
    "Bullet 2 corto sobre perfil profesional"
  ],
  "badges": [
    { "label": "Título", "value": "Título exacto que otorga" },
    { "label": "Área", "value": "Campo profesional" }
  ]
}
```

### Slide 2: Plan de estudios
```json
{
  "type": "plan_estudios",
  "paginas": [
    {
      "izquierda": { "año": "1er Año", "cuatrimestres": [{ "label": "1er Cuatrimestre", "materias": [...] }] },
      "derecha": { "año": "2do Año", "cuatrimestres": [...] }
    },
    {
      "izquierda": { "año": "3er Año", "cuatrimestres": [...] },
      "derecha": { "año": "4to Año", "cuatrimestres": [...] },
      "extras": [{ "titulo": "Adicionales", "items": ["Práctica Solidaria", "Materia electiva"] }]
    }
  ]
}
```
`derecha` es opcional (años impares). `extras[]` admite además `nota`.

### Slide 3: Cierre
El frontend **no** lo genera: va siempre en el JSON.
```json
{
  "type": "cierre",
  "imagen": "/imagenes/imagenes_cau/entrada_estetica.png",
  "titulo": "Estudiá<br><span style=\"color:#00c7b1\">con nosotros</span>",
  "beneficios": [
    {"icono": "monitor", "texto": "Estudiá 100% online, rendí y cursá donde quieras"},
    {"icono": "chat", "texto": "Chateá con nosotros y resolvé todas tus dudas"}
  ]
}
```
Un ícono desconocido cae en `star` (`ICON_PATHS`, `components/index/carousel-modal.tsx`).

Existen además los tipos `modalidad`, `evaluacion` y `faq` (uno solo por carrera). La FAQ se carga aparte; ver `sql/2026-10-05_faq_tres_carreras.sql`.

## Reglas IMPORTANTES

- **Solo 2 bullets** en portada, nunca más.
- **Badges siempre**: Título + Área (NUNCA Duración ni Modalidad).
- **Imagen**: buscar primero en `public/imagenes/Modales/`. El usuario indica posición si es necesario.
- **`imagen_desktop_position`**: valor de `object-position` CSS; sin campo usa `top`. Mostrar desde donde está lo importante de la foto.
- **Brillo (`imagen_brightness`)**: opcional (ej. `1.5`). Sin campo = sin filtro. Solo si la foto es oscura.
- **Títulos largos**: badges con más de 35 caracteres y el h2 se achican solos. No hace falta intervenir.
- **Carreras CCC**: detectar por `(CCC)` en el nombre. Duración = "Título previo + X años". Requisito en `paginas[0].extras` con `titulo: "Requisito obligatorio"` (el modal lo busca por la palabra "requisito").
- **Extras y requisitos**: el resto va en la última página del plan, dentro de `extras[]`.
- **No cambiar nombres en DB** sin que el usuario lo pida.
- **Verificar que el WHERE matchea** antes del UPDATE: `db.mjs` frena los que no tienen `WHERE`, pero no los que pegan en la fila equivocada.

## Verificación

1. `npm run auditar`: plan vacío, sin slides, campos vacíos, slugs duplicados.
2. Modal y ficha `/carreras/<slug>` a **1280 px y 375 px**: imagen, título sin palabras cortadas, bullets, badges, sin "null". Las capturas van al chat (ver `cau_design_patterns`).
3. Si hubo código: `npm run check` antes de commitear.

## Al renombrar una carrera

Cambiar `carreras.nombre` o `prefix` cambia el slug. Además del `UPDATE`:

1. Redirect del slug viejo en `next.config.ts` (y en `lib/vigilancia-esperado.ts` si se quiere vigilar).
2. Todo lo que se busca por nombre: recorrer [docs/alta-de-carrera.md](../../../docs/alta-de-carrera.md) (áreas, `DESTACADAS_FORMULARIO`, `CARRERAS_HUBSPOT`, `COVER_OVERRIDES`, `SEO_ESPECIFICO`, alias del bot, folletos).
