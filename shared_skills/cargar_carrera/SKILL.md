# Skill: Cargar Carrera en Supabase

Workflow para cargar los slides JSON de una carrera en la tabla `carreras` de Supabase.

## Flujo

1. **El usuario pasa una URL** de 21.edu.ar con la carrera (opcionalmente indica posición de imagen)
2. **Fetch de datos**: extraer título, duración, área, plan de estudios completo y 2 bullets
3. **Buscar imagen local**: `public/imagenes/Modales/[Nombre Carrera]/**/*`
4. **Verificar nombre en DB**: `SELECT id, nombre, prefix, nombre_corto, nivel, duracion, titulo, enfoque FROM carreras WHERE nombre ILIKE '%...%' AND activa = true` — el nombre en DB puede diferir del nombre completo (ej: "Informática" en vez de "Licenciatura en Informática")
5. **Armar slides** (portada + plan_estudios + cierre — los 3 deben cargarse explícitamente)
6. **Subir slides** con UPDATE
7. **Ajustar imagen** si el usuario lo pide: actualizar `imagen_desktop_position` en DB

## Formato de slides (3 slides — todos explícitos en el JSON)

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

## Reglas IMPORTANTES

- **Solo 2 bullets** en portada, nunca más
- **Badges siempre**: Título + Área (NUNCA Duración ni Modalidad)
- **SIEMPRE incluir slide de cierre** en el JSON — el frontend NO lo genera automáticamente. Formato:
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
- **Imagen**: buscar primero en `public/imagenes/Modales/`. El usuario indica posición si es necesario
- **`imagen_desktop_position`**: usar `object-position` CSS. Mostrar desde donde está el contenido importante de la foto. Se aceptan valores como `center`, `left center`, `30% center`, etc.
- **Brillo (`imagen_brightness`)**: campo opcional del slide portada (ej. `1.5`). Sin campo = sin filtro. Solo agregarlo si la foto es oscura; las fotos nuevas bien expuestas no lo necesitan. Se ajusta con UPDATE en Supabase, sin deploy.
- **Títulos largos en badges**: el componente ya reduce automáticamente el tamaño de fuente cuando `badge.value.length > 35` caracteres. No hace falta intervención manual
- **Títulos largos en h2**: el componente reduce automáticamente el font-size según la longitud del nombre y se adapta a viewports cortos con `vh` units
- **Carreras CCC**: detectar por `(CCC)` en nombre. Duración = "Título previo + X años". Agregar requisito en `paginas[0].extras` con `titulo: "Requisito obligatorio"`
- **Extras y requisitos**: van en la última página del plan, dentro de `extras[]`
- **No cambiar nombres en DB** sin que el usuario lo pida
- **Verificar que el WHERE matchea** antes de hacer UPDATE (el nombre en DB puede ser distinto al nombre completo)
- **Descuentos especiales**: después de cargar slides, preguntar al usuario si quiere sincronizar descuentos especiales con `/sync_descuentos`. Algunas carreras tienen promociones especiales (matrícula, cuotas) que se muestran en el slide de cierre
- **Verificar precios**: el usuario puede consultar precios actualizados en `/admin/precios` (requiere Excel cacheado en `/tmp/precios.xlsx` via `node scripts/scrape-descuentos.mjs`)
- **Sincronizar nombres después de cargar**: si el usuario renombra `carreras.nombre` (ej: quita el prefijo "Tecnicatura en"), hay que actualizar también:
  1. `precios_carreras.nombre_supabase` — para que el JOIN de precios matchee
  2. `NOMBRE_MAP` en `scripts/scrape-descuentos.mjs` — para que futuras syncs escriban el nombre correcto
  3. (Ya no aplica: la exclusion list de brillo fue reemplazada por el campo `imagen_brightness` del slide portada — ver regla de brillo arriba)
