# Skill: Cargar Carrera en Supabase

Workflow para cargar los slides JSON de una carrera en la tabla `carreras` de Supabase.

## Flujo

1. **El usuario pasa una URL** de 21.edu.ar con la carrera
2. **Fetch de datos**: extraer título, duración, área, plan de estudios completo y 2 bullets
3. **Buscar imagen local**: `public/imagenes/Modales/[Nombre Carrera]/**/*`
4. **Verificar nombre en DB**: `SELECT id, nombre, prefix, nombre_corto, nivel, duracion, titulo, enfoque FROM carreras WHERE nombre ILIKE '%...%' AND activa = true` — el nombre en DB puede diferir del nombre completo (ej: "Informática" en vez de "Licenciatura en Informática")
5. **Armar y subir slides** con UPDATE

## Formato de slides (3 slides siempre)

### Slide 1: Portada
```json
{
  "type": "portada",
  "imagen_desktop": "/imagenes/Modales/[Carpeta]/[archivo]",
  "imagen_desktop_position": "center|left center|right center|top",
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

### Slide 3: Cierre (SIEMPRE igual)
```json
{
  "type": "cierre",
  "imagen": "/imagenes/imagenes_cau/entrada_estetica.png",
  "titulo": "Estudiá<br><span style=\"color:#00c7b1\">con nosotros</span>",
  "beneficios": [
    { "icono": "location", "texto": "Estamos en Villa Lugano, cerca de Zona Sur y Oeste" },
    { "icono": "chat", "texto": "Chateá con nosotros y resolvé todas tus dudas" }
  ]
}
```

## Reglas IMPORTANTES

- **Solo 2 bullets** en portada, nunca más
- **Badges siempre**: Título + Área (NUNCA Duración ni Modalidad)
- **Cierre siempre estándar**: misma imagen (`entrada_estetica.png`), mismo título, mismos beneficios. No inventar cierres custom
- **Imagen**: buscar primero en `public/imagenes/Modales/`. El usuario indica posición si es necesario
- **`imagen_desktop_position`**: usar `object-position` CSS. Mostrar desde donde está el contenido importante de la foto. Se aceptan valores como `center`, `left center`, `30% center`, etc.
- **Títulos largos en badges**: el componente ya reduce automáticamente el tamaño de fuente cuando `badge.value.length > 35` caracteres. No hace falta intervención manual
- **Carreras CCC**: detectar por `(CCC)` en nombre. Duración = "Título previo + X años". Agregar requisito en `paginas[0].extras` con `titulo: "Requisito obligatorio"`
- **Extras y requisitos**: van en la última página del plan, dentro de `extras[]`
- **No cambiar nombres en DB** sin que el usuario lo pida
- **Verificar que el WHERE matchea** antes de hacer UPDATE (el nombre en DB puede ser distinto al nombre completo)
