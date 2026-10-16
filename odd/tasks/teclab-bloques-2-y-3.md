# Alta de las carreras nuevas de Teclab, bloques 2 y 3

## Objetivo

Dar de alta las nueve tecnicaturas nuevas de Teclab de los bloques 2 y 3 con inscripción
abierta: ficha `/carreras/<slug>`, página `/carreras/<slug>/inscripcion`, catálogo,
taxonomía y los dos tests vocacionales.

## Problema y por qué

Teclab publicó las capacitaciones de admisión de tres bloques de carreras nuevas. El
bloque 1 ya está cargado como «Próximamente»
([tarea](teclab-carreras-proximamente.md)). El usuario decidió el 16/10/2026 cargar los
bloques 2 y 3 **con inscripción abierta** (`proximamente = false`), aunque falten el precio,
la fecha de inicio y la opción de HubSpot. Va a haber un bloque 4.

## Alcance

- Bloque 2: Administración de Empresas, Administración de Negocios Digitales
  Financieros, Logística, Comercio Exterior, Administración de Riesgos Empresariales.
- Bloque 3: Diseño de Producto Digital, Diseño de Experiencia de Usuario (User
  Experience), Gestión de Equipos Ágiles (Agile Coaching), Recursos Humanos.
- Fuente: las tres presentaciones «Capacitación de admisión» de Teclab (Descargas del
  usuario, 16/10/2026). Duración, título, certificado intermedio, plan por año, áreas de
  trabajo y competencias salen de ahí; nada se inventa.
- Recorrido completo de [docs/alta-de-carrera.md](../../docs/alta-de-carrera.md) en lo
  que esté en este repo.

## Restricciones

- Primero el código publicado, después las filas (el trigger revalida al instante).
- `Tecnicatura Superior en Producto Digital` (id 245) y `Fintech` (id 244) quedaron
  inactivas el 09/10/2026 con redirect a la home; las nuevas usan otro slug.
- Sin opción de HubSpot conocida para las nueve: sus leads no llegan a la landing de la
  sede hasta sumarlas a `CARRERAS_HUBSPOT`.

## Tareas

- [x] T1. Código: áreas, `TIPOS`, categoría de Tecnología, portadas, test vocacional
  general y de Teclab, tests.
- [x] T2. SQL de alta de las nueve filas (`sql/2026-10-16_teclab_bloques_2_y_3.sql`).
- [x] T3. `npm run check` y commit.
- [ ] T4. Publicar (push, decisión del usuario) y correr el SQL.

## Pendientes fuera de este repo o sin dato

- Precio (pipeline y `precios_privados`), fecha de inicio, opción de HubSpot, mapeo del
  robot de autoinscripción, PDFs y corpus del bot, folletos, pedido de indexación.
- Ficha oficial en teclab.edu.ar: ninguna de las nueve figura en su `carrera-sitemap.xml`
  (16/10/2026). Cuando aparezca, pasar la portada a `FICHAS` con la foto oficial.
- Articulación con Siglo 21: la capacitación no la menciona, así que las nueve van en
  `SIN_ARTICULACION_CONFIRMADA` y la ficha no la promete.

## Decisiones de taxonomía

| Carrera | Nivel | Área | Tipo / categoría | Perfil del test de Teclab |
|---|---|---|---|---|
| Administración de Empresas | Gestión | Negocios | Negocios | `administracion` |
| Administración de Negocios Digitales Financieros | Gestión (no figura en teclab.edu.ar) | Negocios | Negocios | `finanzas-digitales` |
| Logística | Gestión | Negocios | Gestión | `logistica` |
| Comercio Exterior | Gestión | Negocios | Negocios | `comercio-exterior` |
| Administración de Riesgos Empresariales | Gestión | Negocios | Gestión | `riesgos` |
| Diseño de Producto Digital | Tecnología | Tecnología | Desarrollo | `producto-digital` |
| Diseño de Experiencia de Usuario (User Experience) | Tecnología | Tecnología | Desarrollo | `experiencia-usuario` |
| Gestión de Equipos Ágiles (Agile Coaching) | Gestión (no figura en teclab.edu.ar) | RRHH | Gestión | `equipos-agiles` |
| Recursos Humanos | Gestión | RRHH | Gestión | `recursos-humanos` |

Las coincidencias por nombre evitan `producto digital` a secas (la anunciada de baja, id
245). Ninguna de las nueve coincide con una opción de `CARRERAS_HUBSPOT`, y las
carreras de Siglo 21 no cambian de área (comparado sobre las 99 activas).

## Progreso

- 16/10/2026: documento creado. Ruta: escritor delegado (más de dos archivos no
  triviales).
- 16/10/2026: T1 y T2 hechos (escritor delegado). RED observado: 11 de 12 en
  `tests/teclab-bloques-2-y-3.test.mjs` antes de implementar (el de HubSpot pasa desde el
  principio: es una guarda). Test vocacional de Teclab: pregunta nueva («¿Qué desafío
  te gustaría resolver?», siete en total) y pesos reajustados por simulación sobre las
  279.936 combinaciones: cada una de las 30 gana sola entre 2,1% y 4%, empates 9,4%.
  Banda del test: 2,1% a 4,2% (la proporción de la de 3% a 6% con 21). Portadas de
  Wikimedia Commons (dominio público o CC0, fuente anotada en `teclab.ts`). Título
  propio de inscripción para Negocios Digitales Financieros. `/teclab` dice «siete
  preguntas».
- Pendiente de T1 fuera de las superficies autorizadas: la meta description de
  `/teclab/test-vocacional` (`app/teclab/test-vocacional/page.tsx`) sigue diciendo
  «Seis preguntas», y el aviso de inicio (`inicioTeclab`, por nivel) les va a mostrar
  a las nueve la fecha del bimestre en curso (14/10, inscripción hasta el 03/11), que
  no está confirmada para ellas.
- Siguiente: T3 (`npm run check` y commit).
- 16/10/2026: las nueve no muestran fecha de inicio (`SIN_FECHA_CONFIRMADA` en
  `components/index/inicio-teclab.ts`) hasta que Teclab publique su bimestre; meta del
  test de Teclab pasa a «Siete preguntas». `npm run check`: 488/488.
