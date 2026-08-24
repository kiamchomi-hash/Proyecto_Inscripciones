# Formularios por casa — Plan de implementación

> **Para Claude:** SUB-SKILL REQUERIDA: usar executing-plans para implementar este plan tarea por tarea.

**Objetivo:** que cada casa tenga su formulario de contacto y su preinscripción, con un solo componente parametrizado, y que la preinscripción de la home cambie de campos según la carrera que el lead elija.

**Arquitectura:** un módulo puro `casas.ts` declara los campos que existen y cuáles pide cada casa en cada modo, **incluida la columna de Supabase donde va cada uno**. El componente y el endpoint leen esa misma declaración, así que un campo nuevo se agrega en un solo lugar y no puede volver a apuntar a una columna inexistente. Todo lo que decide qué viaja es una función pura, testeable sin React.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase, `node --test`.

**Diseño:** `docs/plans/2026-08-23-formularios-por-casa-design.md`

**Nota sobre el worktree:** no se usa. En este proyecto se trabaja directo en `main` y cada push es un deploy, así que las tareas commitean pero **no pushean**: el push va al final, junto, cuando `npm run check` y las capturas estén verdes.

---

## Estado

Tareas **1, 2 y 3 hechas** (`3cdc040`, `69118b7`, `81dce94`), 13 tests propios en
verde. Corrección sobre lo planeado: los tres módulos van en **un solo archivo**,
`components/formularios/casas.ts`. Node strippea los tipos y corre los `.ts` en
los tests, pero **no resuelve imports de valor entre `.ts` sin extensión**, y el
`tsconfig` usa `moduleResolution: bundler` sin `allowImportingTsExtensions`:
separarlos en tres dejaba la lógica sin poder testearse. Es además el idioma del
repo — `types.ts` y `teclab.ts` son módulos autocontenidos.

Siguiente: tarea 4.

---

## Por qué este orden

Las tres primeras tareas son módulos puros con tests de verdad. Cuando terminan, la regla que rompió producción el 23/08 —escribir una columna que no existe— es imposible de repetir, porque ya no quedan nombres de columna sueltos en el endpoint. Recién después se toca la interfaz.

---

### Tarea 1: el registro de campos

**Archivos:**
- Crear: `components/formularios/campos.ts`
- Test: `tests/formularios.test.mjs`

Un solo lugar donde vive cada campo: cómo se llama en el payload, en qué columna de `consultas` se guarda, y cómo se pinta.

**Paso 1: escribir el test que falla**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPOS, columnaDe } from '../components/formularios/campos.ts';

test('cada campo declara la columna real de la tabla', () => {
  // Las dos que rompieron producción el 23/08: la tabla las llama así.
  assert.equal(columnaDe('lugarNacimiento'), 'localidad_nacimiento');
  assert.equal(columnaDe('domicilio'), 'direccion');
});

test('ningún campo comparte columna con otro', () => {
  const columnas = Object.values(CAMPOS).map(c => c.columna);
  assert.equal(new Set(columnas).size, columnas.length);
});
```

**Paso 2: correrlo y ver que falla**

Correr: `node --test tests/formularios.test.mjs`
Esperado: FAIL, `Cannot find module '../components/formularios/campos.ts'`

**Paso 3: escribir el módulo**

```ts
// Un campo del formulario, de punta a punta: cómo se llama en el payload, en
// qué columna de `consultas` se guarda y cómo se pinta. Que la columna viva
// acá y no en el endpoint es lo que impide repetir el incidente del 23/08,
// cuando el INSERT apuntó a nueve columnas inexistentes y PostgREST rechazó
// todas las consultas del sitio.
export type CampoId =
  | 'nombre' | 'apellido' | 'dni' | 'sexo'
  | 'fechaNacimiento' | 'lugarNacimiento' | 'nacionalidad' | 'estadoCivil'
  | 'paisResidencia' | 'domicilio' | 'domicilioNumero' | 'domicilioPiso'
  | 'domicilioDepartamento' | 'barrio' | 'codigoPostal' | 'localidad'
  | 'nivelEstudios' | 'colegio' | 'colegioLocalidad' | 'medioPago'
  | 'modalidad' | 'equivalencias' | 'email' | 'telefono';

export interface Campo {
  columna: string;
  label: string;
  placeholder?: string;
  max: number;
  tipo?: 'texto' | 'select' | 'checkbox';
  opciones?: readonly string[];
  numerico?: boolean;
}

export const CAMPOS: Record<CampoId, Campo> = {
  nombre:   { columna: 'nombre',   label: 'Nombre',   placeholder: 'Nombre',   max: 100 },
  apellido: { columna: 'apellido', label: 'Apellido', placeholder: 'Apellido', max: 100 },
  dni:      { columna: 'dni',      label: 'DNI',      placeholder: 'Tu DNI',   max: 12, numerico: true },
  sexo:     { columna: 'sexo',     label: 'Sexo',     max: 40, tipo: 'select', opciones: ['Femenino', 'Masculino', 'Otro'] },
  fechaNacimiento: { columna: 'fecha_nacimiento', label: 'Fecha de nacimiento', placeholder: 'DD/MM/AAAA', max: 20 },
  // La tabla la llama `localidad_nacimiento`, no `lugar_nacimiento`.
  lugarNacimiento: { columna: 'localidad_nacimiento', label: 'Lugar de nacimiento', placeholder: 'Ciudad y provincia', max: 120 },
  nacionalidad:   { columna: 'nacionalidad',    label: 'Nacionalidad',       placeholder: 'Argentina', max: 80 },
  estadoCivil:    { columna: 'estado_civil',    label: 'Estado civil',       max: 40, tipo: 'select', opciones: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro'] },
  paisResidencia: { columna: 'pais_residencia', label: 'País de residencia',  placeholder: 'Argentina', max: 80 },
  // La tabla la llama `direccion`, no `domicilio`.
  domicilio:             { columna: 'direccion',             label: 'Domicilio', placeholder: 'Calle',  max: 160 },
  domicilioNumero:       { columna: 'direccion_numero',      label: 'Número',    placeholder: 'N°',     max: 20, numerico: true },
  domicilioPiso:         { columna: 'direccion_piso',        label: 'Piso',      placeholder: 'Piso',   max: 20 },
  domicilioDepartamento: { columna: 'direccion_departamento',label: 'Depto.',    placeholder: 'Depto.', max: 20 },
  barrio:        { columna: 'barrio',        label: 'Barrio',            placeholder: 'Barrio', max: 120 },
  codigoPostal:  { columna: 'codigo_postal', label: 'Código postal',     placeholder: 'Código postal', max: 20 },
  localidad:     { columna: 'localidad',     label: 'Localidad',         placeholder: 'Ciudad o localidad', max: 120 },
  nivelEstudios: { columna: 'nivel_estudios',label: 'Nivel de estudios', placeholder: 'Secundario completo', max: 80 },
  colegio:       { columna: 'colegio',       label: 'Colegio',           placeholder: 'Nombre del colegio', max: 160 },
  colegioLocalidad: { columna: 'colegio_localidad', label: 'Localidad del colegio', placeholder: 'Ciudad o localidad', max: 120 },
  medioPago:     { columna: 'medio_pago',    label: 'Medio de pago',     placeholder: 'Según opción del portal', max: 60 },
  modalidad:     { columna: 'modalidad',     label: 'Modalidad',         max: 40, tipo: 'select' },
  equivalencias: { columna: 'equivalencias', label: 'Quiero acreditar equivalencias', max: 0, tipo: 'checkbox' },
  email:         { columna: 'email',         label: 'Email',             placeholder: 'Ejemplo: tu@correo.com', max: 254 },
  telefono:      { columna: 'telefono',      label: 'Teléfono',          placeholder: 'Ejemplo: 11 1234-5678', max: 30 },
};

export const columnaDe = (id: CampoId) => CAMPOS[id].columna;
```

**Paso 4: correr el test y verlo pasar**

Correr: `node --test tests/formularios.test.mjs`
Esperado: PASS, 2 tests.

**Paso 5: commit**

```bash
git add components/formularios/campos.ts tests/formularios.test.mjs
git commit -m "feat(formularios): registro unico de campos con su columna"
```

---

### Tarea 2: qué pide cada casa

**Archivos:**
- Crear: `components/formularios/casas.ts`
- Modificar: `tests/formularios.test.mjs`

**Paso 1: escribir el test que falla**

```js
import { camposDe, casaDeCarrera } from '../components/formularios/casas.ts';

test('la casa sale del nivel de la carrera', () => {
  assert.equal(casaDeCarrera({ nivel: 'Grado' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Grado (CCC)' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Pregrado' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Teclab - Gestión' }), 'teclab');
  assert.equal(casaDeCarrera({ nivel: 'Teclab - Curso' }), 'teclab');
  assert.equal(casaDeCarrera({ nivel: 'Identidad Argentina' }), 'identidad');
});

test('Identidad no pide legajo: no hay requisitos de ingreso', () => {
  const campos = camposDe('identidad', 'preinscripcion');
  for (const ausente of ['colegio', 'nivelEstudios', 'estadoCivil', 'domicilio', 'medioPago']) {
    assert.ok(!campos.includes(ausente), `identidad no deberia pedir ${ausente}`);
  }
  assert.ok(campos.includes('dni'));
  assert.ok(campos.includes('localidad'));
});

test('las equivalencias son solo de Siglo 21', () => {
  assert.ok(camposDe('siglo21', 'contacto').includes('equivalencias'));
  assert.ok(!camposDe('teclab', 'contacto').includes('equivalencias'));
  assert.ok(!camposDe('identidad', 'contacto').includes('equivalencias'));
});

test('el contacto es corto en las tres casas', () => {
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    assert.ok(camposDe(casa, 'contacto').length <= 8);
  }
});
```

**Paso 2: correrlo y ver que falla**

Correr: `node --test tests/formularios.test.mjs`
Esperado: FAIL, no existe `casas.ts`.

**Paso 3: escribir el módulo**

```ts
import type { CampoId } from './campos';

export type CasaId = 'siglo21' | 'teclab' | 'identidad';
export type Modo = 'contacto' | 'preinscripcion';

// Los comunes: los que toda casa pide y, en la home, los únicos que se muestran
// antes de que el lead elija carrera. Al cambiar de carrera son los que se
// conservan sí o sí.
export const COMUNES: CampoId[] = ['nombre', 'apellido', 'dni', 'email', 'telefono', 'localidad'];

interface Casa {
  nombre: string;
  niveles: string[];
  modalidades: string[];
  contacto: CampoId[];
  preinscripcion: CampoId[];
}

export const CASAS: Record<CasaId, Casa> = {
  siglo21: {
    nombre: 'Universidad Siglo 21',
    niveles: ['Grado', 'Grado (CCC)', 'Pregrado'],
    modalidades: ['Educación Distribuida Home (Virtual)'],
    contacto: ['modalidad', 'nombre', 'apellido', 'localidad', 'equivalencias', 'email', 'telefono'],
    // PENDIENTE: reemplazar por la lista que dé el usuario. Hasta entonces, el
    // juego de Teclab más los tres que suma el legajo de Siglo 21.
    preinscripcion: [
      'nombre', 'apellido', 'dni', 'sexo', 'fechaNacimiento', 'lugarNacimiento',
      'nacionalidad', 'estadoCivil', 'paisResidencia',
      'domicilio', 'domicilioNumero', 'domicilioPiso', 'domicilioDepartamento',
      'barrio', 'codigoPostal', 'localidad',
      'nivelEstudios', 'colegio', 'colegioLocalidad', 'medioPago',
      'equivalencias', 'email', 'telefono',
    ],
  },
  teclab: {
    nombre: 'Teclab',
    niveles: ['Teclab - Tecnología', 'Teclab - Gestión', 'Teclab - Curso'],
    modalidades: ['100% online'],
    contacto: ['modalidad', 'nombre', 'apellido', 'localidad', 'email', 'telefono'],
    // Tal cual está hoy en producción. No se toca.
    preinscripcion: [
      'nombre', 'apellido', 'dni', 'sexo', 'fechaNacimiento', 'lugarNacimiento',
      'nacionalidad', 'estadoCivil',
      'domicilio', 'domicilioNumero', 'domicilioPiso', 'domicilioDepartamento',
      'codigoPostal', 'localidad',
      'nivelEstudios', 'colegio', 'colegioLocalidad', 'medioPago',
      'email', 'telefono',
    ],
  },
  identidad: {
    nombre: 'Academia Identidad Argentina',
    niveles: ['Identidad Argentina'],
    modalidades: ['Virtual en vivo (Innova Virtual)'],
    contacto: ['modalidad', 'nombre', 'apellido', 'localidad', 'email', 'telefono'],
    // Sin requisitos de ingreso, y cierra con link de pago, no con legajo.
    preinscripcion: ['nombre', 'apellido', 'dni', 'localidad', 'email', 'telefono'],
  },
};

const PORNIVEL = new Map<string, CasaId>(
  (Object.entries(CASAS) as [CasaId, Casa][])
    .flatMap(([id, casa]) => casa.niveles.map(nivel => [nivel, id] as [string, CasaId])),
);

export const casaDeCarrera = (carrera: { nivel: string } | null | undefined): CasaId | null =>
  (carrera && PORNIVEL.get(carrera.nivel)) || null;

export const camposDe = (casa: CasaId, modo: Modo): CampoId[] => CASAS[casa][modo];
```

**Paso 4: correr y ver pasar**

Correr: `node --test tests/formularios.test.mjs`
Esperado: PASS, 6 tests.

**Paso 5: commit**

```bash
git add components/formularios/casas.ts tests/formularios.test.mjs
git commit -m "feat(formularios): declarar que pide cada casa en cada modo"
```

---

### Tarea 3: qué viaja en el envío

La regla del diseño: lo que el lead cargó **no se borra** al cambiar de carrera, pero **no viaja** si la casa nueva no lo pide. Es una función pura, así que se prueba sin montar nada.

**Archivos:**
- Crear: `components/formularios/payload.ts`
- Modificar: `tests/formularios.test.mjs`

**Paso 1: escribir el test que falla**

```js
import { armarPayload } from '../components/formularios/payload.ts';

test('lo que la casa no pide no viaja, aunque este cargado', () => {
  const estado = { nombre: 'Ana', dni: '30111222', colegio: 'Normal 5', medioPago: 'Tarjeta' };
  const payload = armarPayload('identidad', 'preinscripcion', estado);

  assert.equal(payload.nombre, 'Ana');
  assert.equal(payload.dni, '30111222');
  assert.equal('colegio' in payload, false);
  assert.equal('medioPago' in payload, false);
});

test('el sobre lleva la casa y el modo', () => {
  const payload = armarPayload('teclab', 'preinscripcion', {});
  assert.equal(payload.casa, 'teclab');
  assert.equal(payload.tipoFormulario, 'preinscripcion');
});
```

**Paso 2: correr y ver fallar.** `node --test tests/formularios.test.mjs`

**Paso 3: implementar**

```ts
import { camposDe, type CasaId, type Modo } from './casas';

// Los campos ocultos siguen en el estado a propósito: si el lead vuelve a una
// carrera que sí los pide, los encuentra como los dejó. Lo que no puede pasar
// es que viajen cuando la casa elegida no los pide.
export function armarPayload(casa: CasaId, modo: Modo, estado: Record<string, unknown>) {
  const payload: Record<string, unknown> = { casa, tipoFormulario: modo };
  for (const campo of camposDe(casa, modo)) {
    if (campo in estado) payload[campo] = estado[campo];
  }
  return payload;
}
```

**Paso 4: correr y ver pasar.**

**Paso 5: commit**

```bash
git add components/formularios/payload.ts tests/formularios.test.mjs
git commit -m "feat(formularios): armar el envio desde lo que la casa declara"
```

---

### Tarea 4: el endpoint deja de tener nombres de columna sueltos

**Archivos:**
- Modificar: `app/api/formularios/route.ts:51-84` (`insertConsulta`)
- Modificar: `tests/security.test.mjs`

`insertConsulta` pasa a construir la fila recorriendo `camposDe(casa, modo)` y usando `columnaDe(campo)`. Ya no hay literales de columna en el endpoint.

**Paso 1: el test que falla** (en `tests/security.test.mjs`, con el estilo de análisis estático que ya usa ese archivo)

```js
test('el endpoint no escribe nombres de columna a mano', async () => {
  const source = await readFile(path.join(root, 'app/api/formularios/route.ts'), 'utf8');
  const insert = source.slice(source.indexOf('insertConsulta'), source.indexOf('insertFaq'));
  // Las columnas salen de campos.ts; en el endpoint no puede quedar ninguna suelta.
  assert.doesNotMatch(insert, /\b(localidad_nacimiento|direccion|nivel_estudios|colegio_localidad|medio_pago)\s*:/);
  assert.match(insert, /columnaDe|camposDe/);
});
```

**Paso 2: correr y ver fallar.** `node --test tests/security.test.mjs`

**Paso 3: reescribir `insertConsulta`.** Las validaciones se conservan tal cual: mail o teléfono obligatorio, `EMAIL`, `PHONE`, `soloDni`, `unaOpcionDe`. Se suman `casa` y `tipo_formulario`, validados contra las claves de `CASAS` y contra `['contacto','preinscripcion']`; si vienen mal, van en `null` y la consulta entra igual — perder un lead por un discriminador sería peor que no saber de qué casa vino.

**Paso 4: correr `npm test`** y ver todo en verde.

**Paso 5: commit**

```bash
git add app/api/formularios/route.ts tests/security.test.mjs
git commit -m "fix(formularios): el endpoint arma la fila desde campos.ts"
```

---

### Tarea 5: el componente único

**Archivos:**
- Crear: `components/formularios/formulario-lead.tsx`
- Crear: `components/formularios/formulario-lead.css` (partiendo de `components/index/enrollment-form.css`)

Un componente, props `{ carreras, casa?, modo, origen }`. Si `casa` viene, es fija (`/teclab`); si no viene, sale de la carrera elegida (home).

El estado es **un solo objeto** `Record<CampoId, string | boolean>`, no veinticuatro `useState` sueltos como hoy: eso es exactamente lo que permite conservar lo cargado cuando cambia la casa.

Los campos se pintan recorriendo `camposDe(casa, modo)` y leyendo `CAMPOS[id]`. `CampoTexto` y `CampoSelect` se mudan acá desde `enrollment-form.tsx` sin cambios.

Turnstile, rate limit, overlay de éxito y manejo de error se copian tal cual del componente actual: no son parte de este refactor.

**Verificación:** `npm run typecheck` y `npm run lint`.

**Commit:** `feat(formularios): componente unico parametrizado por casa`

---

### Tarea 6: la home

**Archivos:**
- Modificar: `app/page.tsx:47-52`

Dos secciones: `#formulario` (contacto, toda la oferta) y `#preinscripcion` (preinscripción, dinámica). La casa la deduce la carrera elegida; sin carrera elegida se muestran sólo los `COMUNES`.

El alto del formulario cambia al cambiar de casa. Reservar el espacio o animar la transición para que no salte y el lead no pierda el lugar.

**Verificación:** `npm run dev` y `npm run capturas -- --rutas=/ --solo=mobile`. Y a mano, el caso que importa: elegir una carrera de Siglo 21, cargar nombre y DNI, cambiar a una de Teclab y confirmar que **nombre y DNI siguen ahí**.

**Commit:** `feat(home): contacto y preinscripcion dinamica`

---

### Tarea 7: /teclab y el resto de los consumidores

**Archivos:**
- Modificar: `app/teclab/page.tsx:229`
- Modificar: `components/carreras/deferred-enrollment-form.tsx`
- Modificar: `components/contacto/contacto-page.tsx:89`
- Borrar: `components/index/enrollment-form.tsx` y su `.css`

`/teclab` pasa `casa="teclab"` fija. La ficha de carrera pasa la casa de esa carrera. `/contacto` manda `casa` y `tipoFormulario: 'contacto'`.

**Verificación:** `npm run check`. Comparar capturas de `/teclab` antes y después: **no tiene que cambiar nada visible**.

**Commit:** `refactor(formularios): un solo componente en todo el sitio`

---

### Tarea 8: el aviso de Telegram distingue

**Archivos:**
- Modificar: `supabase/functions/notificar/index.ts`

Encabezar con la casa y el tipo: `📝 PREINSCRIPCIÓN — Teclab`, `💬 Consulta — Siglo 21`. Si `casa` viene en `null` (las filas viejas), mantener el encabezado actual.

Desplegar con `npx supabase functions deploy notificar` y verificar con `herramientas/verificar-avisos.sql`.

**Commit:** `feat(avisos): distinguir preinscripcion de consulta`

---

### Tarea 9: verificación final y push

1. `npm run check` — lint, typecheck y tests.
2. `npm run capturas` — desktop y mobile de `/` y `/teclab`.
3. Enviar **una consulta real de cada tipo** desde producción y confirmar en Supabase que la fila trae `casa` y `tipo_formulario`, y que llegó el Telegram.
4. Recién ahí, un solo push a `main`.

El punto 3 no es opcional: el incidente del 23/08 pasó porque el `INSERT` se dio por bueno sin ejecutarlo nunca contra la tabla real.

---

## Lo que queda pendiente de vos

`CASAS.siglo21.preinscripcion` está cargado con el juego de Teclab más `paisResidencia`, `barrio` y `equivalencias`. Cuando pases la lista real de Siglo 21, lo que cambia es **una sola entrada de ese archivo**: no toca el componente, ni el endpoint, ni los tests.
