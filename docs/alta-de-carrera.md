# Alta de una carrera: qué hay que hacer

Lista de todo lo que toca una carrera nueva, de las tres casas. Se recorre entera cada
vez que se da de alta una carrera, se le cambia el nombre o se abre una de las anunciadas
(`proximamente`).

**La regla de fondo:** el `nivel` de la fila de `carreras` resuelve solo la categoría, la
casa del formulario, la imagen OG, la página de inscripción, el precio y el sitemap. Todo
lo que se busca **por nombre** hay que agregarlo a mano: áreas, tipos de Teclab, fichas,
escuelas de Identidad, el lead a HubSpot, el test vocacional, el bot y los folletos. Si se
olvida, nada falla: la carrera simplemente queda afuera de ese lugar.

Marcas: **A** = sale solo de la fila. **M** = hay que tocar código, datos o un archivo.

## 0. Antes de empezar

- [ ] **Datos oficiales a mano**: nombre exacto, duración, título, plan, modalidad. Si no
  están, la carrera entra como `proximamente` (ver [la de Teclab](../odd/tasks/teclab-carreras-proximamente.md)).
- [ ] **El slug no choca con un redirect viejo** de `next.config.ts`. Hotelera quedó
  tapada por un 301 a la home de una baja anterior (`tests/redirect-hotelera.test.mjs`).
- [ ] **Orden de publicación**: primero el código (push y deploy), después la fila. El
  trigger de `carreras` revalida al instante, así que la fila sin el código publicado se
  ve rota en producción.

## 1. La fila en Supabase (las tres casas)

- [ ] **M** — Fila en `carreras`: `nivel`, `prefix`, `nombre`, `nombre_corto`, `duracion`,
  `titulo`, `modalidad`, `orden`, `activa`, `nueva`, `destacada`, `proximamente`, `slides`,
  `plan_estudios`, `enfoque`, `descripcion`. Se escribe con un SQL fechado en `sql/` y
  `npm run db -- --archivo <sql>` (rol `cau_editor`, [docs/rol-editor.md](rol-editor.md)).
  Siglo 21: skill `cargar_carrera` (ojo, la parte de precios está vieja; ver abajo).
- [ ] **M** — Teclab: `descripcion` abre con «Estudiá <tema> a distancia» y la **última
  oración es la salida laboral** (`partirDescripcionTeclab` la separa). `enfoque` con el
  formato `Modalidad: / Duración: / Título: / Certificado intermedio: / Cocreación:`
  (`parseEnfoqueTeclab`, `components/index/teclab.ts`). Rutina en [rutinas.md](rutinas.md).
- [ ] **A** — El `nivel` tiene que ser uno de los conocidos (`getCategoryForCarrera`,
  `components/index/types.ts`); cualquier otro la esconde.
- [ ] Verificar: `npm run auditar` (plan vacío, sin slides, campos vacíos, slugs
  duplicados).

## 2. Catálogo y taxonomía

- [ ] **M** — Área (`AREA_KEYWORDS`, `components/index/types.ts`): palabras clave sobre el
  nombre, gana la primera. Alimenta el filtro de la home, las fichas relacionadas, el test
  vocacional y el ícono de portada. Comprobar con `getAreaForCarrera(nombre)`; ojo con
  palabras ambiguas («administración» manda a Negocios).
- [ ] **A** — Grupo de duración (`getDurationGroup`), si `duracion` dice «N años», «N
  meses» o «Título previo + N».
- [ ] **M, opcional** — Orden en el formulario (`DESTACADAS_FORMULARIO`, mismo archivo,
  nombre exacto).
- [ ] **A** — Badges Nueva / Más buscada / Próximamente, por los flags de la fila.
- Teclab (`components/index/teclab.ts`):
  - [ ] **M** — `TIPOS` (Gestión): sin entrada no tiene chip ni entra en las píldoras.
  - [ ] **M** — `getCategoriaTeclabTecnologia` (Tecnología): sin coincidencia queda fuera
    de los filtros Desarrollo / Datos e IA / Infraestructura / Ciberseguridad.
  - [ ] **M** — `FICHAS`: url oficial, imagen, imagen de cierre y partner. Las fotos se
    bajan con `scripts/descargar-assets-teclab.mjs`. Una anunciada va en
    `PORTADAS_ANUNCIADAS` hasta que tenga ficha oficial.
  - [ ] **M, opcional** — `DESTACADAS` (las tres competencias del modal).
  - [ ] **A** — `articulaConSiglo21` (todas menos Seguros y las `proximamente`). Si la
    nueva no articula, agregarla a mano.
  - [ ] **M** — `/teclab`: `PARTNERS` y `MOSAICO` (`app/teclab/page.tsx`), en sincronía
    con `FICHAS.partner`.
- [ ] **M** — Identidad: `ESCUELAS` (`components/index/identidad-argentina.ts`); sin
  entrada la tarjeta sale sin escuela.

## 3. Ficha `/carreras/<slug>` y modales

- [ ] **A** — Página, sitemap, JSON-LD `Course` y `BreadcrumbList`, OG por familia y
  relacionadas.
- [ ] **M, si hace falta** — `SEO_ESPECIFICO` (`app/carreras/[slug]/page.tsx`) cuando el
  título automático pasa de 61 caracteres o sale feo.
- [ ] **M** — Imagen del hero: Teclab en `public/imagenes/teclab/carreras/`, Siglo 21 en
  los `slides` (`public/imagenes/Modales/<Carrera>/`). Sin imagen cae en la genérica del
  sitio. Encuadre opcional en `HERO_POSITIONS` y similares
  (`components/carreras/career-detail.tsx`).
- [ ] **M, opcional** — Ícono de portada móvil del modal de Siglo 21 (`COVER_OVERRIDES`,
  `components/index/carousel-modal.tsx`); si no, sale del área.
- [ ] Verificar: ficha y modal a 1280 y 375 px, sin «null», sin palabras cortadas en el
  título, y `npm run calidad:seo`.

## 4. Formularios, inscripción y precio

- [ ] **A** — Casa del formulario por `nivel` (`components/formularios/casas.ts`). Un nivel
  nuevo es **M**: hay que sumarlo a su casa.
- [ ] **A** — Aparece en el selector de carreras. La preinscripción saca las
  `proximamente` (`opcionesDelModo`); el contacto las deja para pedir el aviso.
- [ ] **A** — Página propia `/carreras/<slug>/inscripcion` (sólo Teclab sin
  `proximamente`, `tieneInscripcionPropia`). **M** — `TITULO_ESPECIFICO`
  (`components/carreras/inscripcion-carrera.tsx`) si el título no entra. Siglo 21 e
  Identidad no tienen página propia.
- [ ] **M** — Precio («Ver precio» y mail de precio, hoy sólo Teclab): fila en
  `precios_privados`, que carga `herramientas/ventas/publicar-precios.mjs`. Empareja por
  nombre; si el del pipeline difiere, va en `SINONIMOS` (`casas.ts`). Sin fila el modal
  ofrece WhatsApp en vez del precio.
- [ ] **M** — Fechas de inicio de Teclab (`components/index/inicio-teclab.ts`).
- [ ] **M** — Lead a HubSpot de la sede (`CARRERAS_HUBSPOT`, `casas.ts`). **Sin entrada el
  lead no se manda y sólo queda un `console.warn`.** Probar con
  `tests/lead-sede-teclab.test.mjs`.
- [ ] **M** — Robot de autoinscripción de Teclab: el nombre tiene que existir en el
  desplegable del portal. El mapeo vive en el repo del robot (`src/mapeo.mjs`, fuera de
  este repo); probar con `--ensayo`. Ver [autoinscripción](../odd/tasks/autoinscripcion-teclab.md).

## 5. Test vocacional

- [ ] **A** — Entra a `/test-vocacional` (lee las visibles menos Identidad).
- [ ] **M** — Para que el test la pueda recomendar necesita área y algún término en
  `PREGUNTAS[].terminos` (`components/test-vocacional/test-vocacional.tsx`). Si falta,
  en desarrollo la consola avisa «Carreras sin una ruta específica». Probar con
  `tests/test-vocacional.test.mjs`.
- [ ] **M** — Test vocacional de Teclab: todavía no existe ([tarea](../odd/tasks/test-vocacional-teclab.md)).
  Cuando exista, cada alta de Teclab va a necesitar su puntaje.

## 6. Bot de WhatsApp y material comercial (carpetas gitignoradas)

- Siglo 21 (`carreras/siglo21/`):
  - [ ] **M** — `alias-carreras.json`, `enlaces-sitio-oficial.json` (y `EXCEPCIONES` en
    `herramientas/ventas/extraer-enlaces-sitio.mjs`), la FAQ, `planes-siglo21-manuales.json`
    → `planes-siglo21.json`, `manifiesto-carreras.json` y la ficha del KB
    (`extraer-todas-carreras-kb.mjs`). Referencia: [alta de cinco carreras](../odd/tasks/altas-cinco-carreras-siglo21.md).
  - [ ] **M** — Tarjeta de WhatsApp en `carreras/siglo21/tarjetas-whatsapp/`.
  - [ ] Regenerar `generar-buscador.mjs --descuento-beneficio 10` y
    `generar-entrenador.mjs`, publicar con `publicar-buscador.mjs`, y correr la suite de
    `herramientas/ventas/tests/` y `auditar-instituciones.mjs`.
- Teclab:
  - [ ] **M** — Que la carrera exista en el pipeline de precios (`extraer-externos.mjs`).
  - [ ] **M** — PDF en `carreras/teclab/pdfs/` e ID de Drive en `contenidos-minimos.mjs`.
  - [ ] **M** — Marcadores de `contenidos-teclab.json` (por ejemplo, la articulación).
- Identidad:
  - [ ] **A** — La trae su API con `actualizar-identidad.mjs`. Si cambia el nombre, va en
    `ALIAS_DIPLOMATURA` (`extraer-externos.mjs`).
- [ ] **M** — Corpus del bot (`ventas/corpus/<casa>.json`): releer las respuestas que
  cuentan carreras («16 tecnicaturas» y similares). Flujo de la skill `bot_respuestas`.
- [ ] **M** — Folletos: las listas están escritas a mano en
  `scripts/generar-folletos-whatsapp.mjs`; regenerar las imágenes de `public/folletos/`.

## 7. SEO, indexación y control

- [ ] **A** — Sitemap. Verificar con `npm run smoke`.
- [ ] **M** — Pedir la indexación en Search Console y anotarla en
  [indexacion.md](indexacion.md), según [rutinas.md](rutinas.md). Una semana después,
  `npm run seo`.
- [ ] **M, al renombrar** — Redirect del slug viejo en `next.config.ts` y, si se quiere
  vigilar, en `lib/vigilancia-esperado.ts`.
- [ ] `npm run check` antes de commitear.

## Encontrado al armar esta lista (09/10/2026)

Problemas que existen hoy, todavía sin corregir:

1. **La skill `cargar_carrera` está vieja**: nombra `scripts/scrape-descuentos.mjs`,
   `NOMBRE_MAP`, `/admin/precios` y `precios_carreras`, que ya no existen. El precio vive en
   `precios_privados`. Además sólo cubre Siglo 21.
2. **El test vocacional no mira `proximamente`**: puede recomendar Fintech o Administración
   Pública, que no tienen inscripción abierta. Y su descripción habla sólo de Siglo 21,
   aunque también lista Teclab.
3. **`CARRERAS_HUBSPOT` no tiene las cinco Teclab anunciadas**: cuando abran, sus leads
   no van a llegar a la sede sin ningún aviso.
4. **Los folletos están desactualizados**: les faltan las cinco altas de Siglo 21 del
   03/10 y las cinco de Teclab, e incluyen Administración Pública, que está `proximamente`.
5. **Áreas mal asignadas**: Antropología Organizacional no tiene área, y «Administración
   de Infraestructura Tecnológica» cae en Negocios.
6. **`IDENTIDAD_FUERA_DE_OFERTA`** descarta por subcadena («inteligencia artificial»,
   «management hotelero»): una diplomatura nueva con esas palabras se descartaría sola.
