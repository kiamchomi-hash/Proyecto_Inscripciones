# Preinscripción corta de Teclab — plan de implementación

**Objetivo:** la preinscripción de Teclab pide nombre, apellido, mail, teléfono,
provincia y carrera; los 20 campos actuales pasan a un modo nuevo, `usuario`
(«Generá tu usuario de Teclab»), que se muestra debajo del corto en `/teclab` y en
las fichas de Teclab.

**Diseño aprobado:** `docs/plans/2026-11-27-preinscripcion-corta-teclab-design.md`.

**Arquitectura:** un tercer `Modo` en `components/formularios/casas.ts`
(`'usuario'`), declarado sólo por Teclab. El modo viaja como `tipoFormulario` y se
guarda en `consultas.tipo_formulario`, así que la distinción en D1 y en Telegram
sale sola. La provincia es un campo nuevo, `provinciaTeclab`, que escribe la
columna `provincia` como desplegable: `provincia` sigue siendo texto libre para
Identidad.

**Sin migración:** `consultas.provincia` y `consultas.tipo_formulario` ya existen
y son texto sin `CHECK`.

---

### Tarea 1: `casas.ts` — modo `usuario` y campo `provinciaTeclab`

**Archivos:** `components/formularios/casas.ts`, prueba en `tests/formularios.test.mjs`.

1. Prueba que falla, en `tests/formularios.test.mjs`:
   - `camposDe('teclab', 'preinscripcion')` es
     `['nombre', 'apellido', 'email', 'telefono', 'provinciaTeclab']`.
   - `camposDe('teclab', 'usuario')` son los 20 campos de hoy, en el mismo orden.
   - `camposDe('siglo21', 'usuario')` y `camposDe('identidad', 'usuario')` son `[]`.
   - `CAMPOS.provinciaTeclab.opciones` son las 23 de `PROVINCIAS_HUBSPOT` y su
     columna es `provincia`.
   - `obligatoriosDe('teclab', 'usuario')` no incluye `codigoPostal` ni piso/depto.
   - `armarPayload('teclab', 'usuario', …)` lleva `tipoFormulario: 'usuario'`.
2. Correr `node --test tests/formularios.test.mjs` → falla.
3. Implementar:
   - `CampoId` suma `'provinciaTeclab'`.
   - Subir `PROVINCIAS_HUBSPOT` arriba de `CAMPOS_DECLARADOS` (se usa en los dos
     lados) y agregar `ETIQUETAS_PROVINCIA` con los acentos: Córdoba, Entre Ríos,
     Neuquén, Tucumán. Comentario: lista copiada del formulario de vinculación
     de Teclab (HubSpot 5880041, form `a19c1564-…`, 27/11/2026); CABA va dentro
     de «Buenos Aires».
   - `provinciaTeclab: { columna: 'provincia', grupo: 'personales', label: 'Provincia', max: 80, tipo: 'select', opciones: PROVINCIAS_HUBSPOT, etiquetasOpciones: ETIQUETAS_PROVINCIA }`.
   - `Modo = 'contacto' | 'preinscripcion' | 'usuario'`.
   - `Casa.usuario?: CampoId[]`; Teclab: `preinscripcion` corto y `usuario` con la
     lista actual. El comentario del portal sobre el código postal pasa a
     `usuario`; `opcionales: ['codigoPostal']` se mantiene.
   - `camposDe = (casa, modo) => CASAS[casa][modo] ?? []`.
4. Correr de nuevo → pasa. `npm run typecheck` en la raíz.

### Tarea 2: API — aceptar el modo nuevo

**Archivos:** `cloudflare/src/api/filas.ts`, `cloudflare/src/api/alertas-analytics.ts`,
el validador de telemetría que use `modo` (buscar `MODOS_FORMULARIO` y
`formulario-visto`), `cloudflare/src/api/demo.ts`.

1. Pruebas que fallan, en las de `cloudflare/tests/` que ya cubren `filaConsulta`:
   - un payload `{ casa: 'teclab', tipoFormulario: 'usuario', … }` guarda
     `tipo_formulario = 'usuario'` y las columnas del legajo.
   - `{ casa: 'teclab', tipoFormulario: 'preinscripcion', provinciaTeclab: 'Cordoba' }`
     guarda `provincia = 'Cordoba'`; con `'Narnia'` guarda `null` y la consulta entra.
2. Implementar: `MODOS` suma `'usuario'`; `camposAceptados` sin casa/modo suma
   `CASAS[id].usuario ?? []`; `MODOS_FORMULARIO` suma `'usuario'`.
3. `registrarConsulta` no cambia: el precio sigue atado a `preinscripcion`, así
   que el corto conserva el mail de precio y `usuario` sólo avisa.
4. Correr las pruebas tocadas.

### Tarea 3: aviso de Telegram

**Archivo:** `cloudflare/src/operativa/mensajes.ts` (prueba junto a las del aviso).

1. Prueba que falla: una fila `tipo_formulario = 'usuario'`, casa Teclab, arma un
   aviso con cabecera `🪪 *USUARIO TECLAB — Teclab*` y los bloques Domicilio y
   Estudios previos; una `preinscripcion` corta muestra la provincia.
2. Implementar: `cabecera` con el caso `usuario`; el armado por bloques que hoy
   usa `esPreinscripcion` se aplica también a `usuario`.
3. Correr la prueba.

### Tarea 4: `FormularioLead`

**Archivo:** `components/formularios/formulario-lead.tsx`.

Repasar cada uso de `esPreinscripcion` y separar dos ideas:
- `pideLegajo = modo !== 'contacto'`: obligatorios, `(opcional)`, reparto de
  columnas, mail y teléfono los dos obligatorios, no contar como abandono.
- `esPreinscripcion` (sólo `preinscripcion`): id `preinscripcion`, precio y pasos
  de confirmación, mensaje de WhatsApp con la carrera.

Para `usuario`: `id="usuario-teclab"`, `prefijo` propio (ya es `modo`), título
`GENERÁ TU USUARIO DE TECLAB` (sin el «FORMULARIO DE»), overlay final
«Datos enviados». `casaVisual` cae en `siglo21` sólo para `preinscripcion`.

Verificar: `npm run typecheck` y `node --test tests/flujo-preinscripcion.test.mjs tests/bloques-formulario.test.mjs`.

### Tarea 5: dónde se monta

**Archivos:** `cloudflare/src/entrega/PaginaTeclab.tsx`,
`components/carreras/deferred-enrollment-form.tsx`,
`cloudflare/src/entrega/PaginaCarrera.tsx`.

- `/teclab`: debajo de la preinscripción,
  `<FormularioLead carreras={carreras} modo="usuario" casa="teclab" origen="teclab" />`.
- Ficha de Teclab: `DeferredEnrollmentForm` acepta `conUsuario`; con
  `modoUnico="preinscripcion"` y `conUsuario` monta la preinscripción y debajo
  `usuario` con `casa="teclab"`, y el hueco previo lleva los dos ids.
  `PaginaCarrera` lo pasa sólo si `teclab`.
- `/teclab/inscripcion`, `/carreras/[slug]/inscripcion` y la home no cambian de
  código: toman el corto solos por `camposDe`.

### Tarea 6: pruebas existentes y documentación

1. `npm run check` en la raíz y, en `cloudflare/`, las pruebas de formularios,
   API y telemetría (`node --test` de los archivos tocados) más `npm run build`.
   Las fixtures que arman el legajo largo de Teclab con `preinscripcion`
   (`cloudflare/tests/fixtures/inscripciones.mjs`, `helpers/consultas.mjs`)
   pasan a `usuario`.
2. `docs/formularios-por-casa.md`: los tres modos de Teclab y de dónde sale la
   lista de provincias.
3. Recorrido local con `npm run dev` en `cloudflare/`: `/teclab` y una ficha de
   Teclab, escritorio y celular, sin enviar a producción. Capturas al usuario.

### Tarea 7: revisión y commit

- Diff completo a `revision_go` con el criterio: formularios, validación de la
  API, D1 sin migración, Identidad y Siglo 21 sin cambios.
- Commit con sólo los archivos propios. El push publica: no se hace sin pedirlo.
