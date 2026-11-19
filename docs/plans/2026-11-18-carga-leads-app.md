# Carga de leads en HubSpot — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> En este entorno la skill equivalente es `executing-plans`.

**Goal:** Una app de escritorio independiente que recibe nombre, apellido, teléfono, correo y carrera, y crea el contacto y el negocio en HubSpot sin confirmaciones intermedias, avisando errores dentro de la app.

**Architecture:** Interfaz nativa en Rust (`egui/eframe`) que lanza como proceso hijo un auxiliar Node/Playwright. El auxiliar abre Brave con un perfil persistente privado de la app, ubica los controles por etiqueta/rol/`data-test-id` en el modal de HubSpot y escribe eventos JSON por stdout. Rust muestra el paso en curso y los errores. El auxiliar reutiliza el patrón de `herramientas/ventas/hubspot-negocios.mjs` (`chromium.launchPersistentContext` + `ejecutableBrave`) pero no importa esa carpeta, porque es privada y no viaja por git.

**Tech Stack:** Rust 1.100 (`cargo`, `egui`, `eframe`, `serde_json`), Node 22 con `playwright` ya instalado en la raíz, Brave. Fuente de carreras: `conocimiento/siglo21.md` (versionado, sin precios).

---

### Task 1: Lista de carreras versionada

La lista buscable no se escribe a mano: se genera desde el conocimiento versionado. Cada entrada lleva nombre y nivel (`Grado`/`Pregrado`).

**Files:**
- Create: `carga-leads-app/generar-carreras.mjs`
- Create: `carga-leads-app/carreras.json` (generado)
- Test: `carga-leads-app/tests/carreras.test.mjs`

**Step 1: Write the failing test**

```js
// carga-leads-app/tests/carreras.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearCarreras } from '../generar-carreras.mjs';

const fragmento = `## Abogacía

- **Grado académico:** Grado
- **Nivel local:** Grado

## Tecnicatura en Redes Informáticas y Telecomunicaciones

- **Grado académico:** Pregrado
- **Nivel local:** Pregrado
`;

test('extrae nombre y nivel de cada carrera', () => {
  assert.deepEqual(parsearCarreras(fragmento), [
    { nombre: 'Abogacía', nivel: 'Grado' },
    { nombre: 'Tecnicatura en Redes Informáticas y Telecomunicaciones', nivel: 'Pregrado' },
  ]);
});

test('un nivel local con aclaración sigue siendo Grado o Pregrado', () => {
  const texto = '## Licenciatura en Educación (CCC)\n\n- **Nivel local:** Grado (CCC)\n';
  assert.deepEqual(parsearCarreras(texto), [{ nombre: 'Licenciatura en Educación (CCC)', nivel: 'Grado' }]);
});

test('descarta carreras sin nivel reconocible', () => {
  const texto = '## Sin nivel\n\n- **Nivel local:** No informado\n';
  assert.deepEqual(parsearCarreras(texto), []);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test carga-leads-app/tests/carreras.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND` (el módulo todavía no existe).

**Step 3: Write minimal implementation**

```js
// carga-leads-app/generar-carreras.mjs
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FUENTE = path.join(AQUI, '..', 'conocimiento', 'siglo21.md');
const DESTINO = path.join(AQUI, 'carreras.json');

export function parsearCarreras(texto) {
  const resultado = [];
  let nombre = null;
  for (const linea of texto.split(/\r?\n/)) {
    const titulo = linea.match(/^##\s+(.+?)\s*$/);
    if (titulo) { nombre = titulo[1].trim(); continue; }
    const nivel = linea.match(/^\s*-\s+\*\*Nivel local:\*\*\s*(Grado|Pregrado)/i);
    if (nombre && nivel) {
      resultado.push({ nombre, nivel: nivel[1].toLowerCase() === 'grado' ? 'Grado' : 'Pregrado' });
      nombre = null;
    }
  }
  return resultado.filter((carrera, indice, todas) =>
    todas.findIndex(otra => otra.nombre === carrera.nombre) === indice);
}

export async function main() {
  const carreras = parsearCarreras(await readFile(FUENTE, 'utf8'));
  if (carreras.length < 50) throw new Error('La fuente no dio la cantidad esperada de carreras.');
  await writeFile(DESTINO, JSON.stringify(carreras, null, 2) + '\n', 'utf8');
  return carreras.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`${await main()} carreras escritas en ${DESTINO}`);
}
```

**Step 4: Run tests y generar el archivo**

Run: `node --test carga-leads-app/tests/carreras.test.mjs && node carga-leads-app/generar-carreras.mjs`
Expected: tests PASS; salida `67 carreras escritas en .../carga-leads-app/carreras.json` (o la cantidad que tenga la fuente).

**Step 5: Commit** (sólo si el usuario autorizó commitear en esta sesión)

```bash
git add carga-leads-app/generar-carreras.mjs carga-leads-app/carreras.json carga-leads-app/tests/carreras.test.mjs
git commit -m "feat(carga-leads): generar lista de carreras desde conocimiento versionado"
```

---

### Task 2: Relevar los selectores del negocio en HubSpot

Antes de escribir el auxiliar hay que confirmar los nombres reales de los controles del modal de creación de negocio. No se inventan selectores ni se usan coordenadas.

**Files:**
- Create: `carga-leads-app/selectores-negocio.md`

**Step 1: Abrir HubSpot con el perfil del usuario**

Usar `browse.navigate` a `https://app.hubspot.com/contacts/44080364/objects/0-1/views/all/list`, con `allowedOrigins` de `app.hubspot.com`. Verificar sesión con un `browse.snapshot`.

**Step 2: Abrir el modal de negocio sin guardar**

Desde *Crear nuevo* elegir *Negocio* (o el acceso equivalente que aparezca en el snapshot). No pulsar *Guardar* ni *Enviar*.

**Step 3: Capturar la accesibilidad**

`browse.snapshot` con `frames: true`, `mode: "aria"`, `depth: 12`, `maxItems: 120` sobre el modal y sus iframes. Anotar el nombre accesible y el rol de: `Tipo de programa`, `Carrera`, `Modalidad`, `Localidad`, `Origen`, `INT_Codigo Cau`, `Suborigen` y el botón `Enviar`. Si algún control es un desplegable, anotar el texto exacto de la opción `Educación Distribuida Home`, `Lead CAU`, `Pauta Digital` y `VLG01`.

**Step 4: Cerrar sin guardar y documentar**

Cerrar el modal con *Cancelar*. Escribir `carga-leads-app/selectores-negocio.md` con la tabla `Campo | Rol | Nombre accesible | Valor`. Este archivo es la fuente para el Task 4; si un nombre no aparece, queda marcado como `PENDIENTE` y se ajusta el auxiliar antes de la prueba controlada.

**Step 5: Commit** (sólo con autorización)

```bash
git add carga-leads-app/selectores-negocio.md
git commit -m "docs(carga-leads): relevar selectores del modal de negocio"
```

---

### Task 3: Dominio del auxiliar

**Files:**
- Create: `carga-leads-app/aux/dominio.mjs`
- Test: `carga-leads-app/tests/dominio.test.mjs`

**Step 1: Write the failing test**

```js
// carga-leads-app/tests/dominio.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { validarLead, normalizarTelefono, nivelDe, evento } from '../aux/dominio.mjs';

const base = {
  nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
  correo: 'ejemplo@example.invalid', carrera: 'Abogacía',
};

test('acepta un lead completo', () => {
  assert.equal(validarLead(base), null);
});

test('rechaza correo, teléfono y campos vacíos', () => {
  assert.match(validarLead({ ...base, correo: 'sin-arroba' }), /correo/i);
  assert.match(validarLead({ ...base, telefono: 'abc' }), /teléfono/i);
  assert.match(validarLead({ ...base, nombre: '  ' }), /nombre/i);
});

test('normaliza el teléfono a dígitos sin agregar prefijo', () => {
  assert.equal(normalizarTelefono('00 0000-0000'), '0000000000');
  assert.equal(normalizarTelefono('+54 9 00 0000-0000'), '5490000000000');
});

test('derive el nivel de la lista generada', () => {
  const carreras = [{ nombre: 'Abogacía', nivel: 'Grado' }, { nombre: 'Tecnicatura en Redes', nivel: 'Pregrado' }];
  assert.equal(nivelDe(carreras, 'Abogacía'), 'Grado');
  assert.equal(nivelDe(carreras, 'Tecnicatura en Redes'), 'Pregrado');
  assert.equal(nivelDe(carreras, 'Inexistente'), null);
});

test('serializa eventos como JSON de una línea', () => {
  assert.equal(evento('paso', { texto: 'Abriendo HubSpot' }), '{"evento":"paso","texto":"Abriendo HubSpot"}');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test carga-leads-app/tests/dominio.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

**Step 3: Write minimal implementation**

```js
// carga-leads-app/aux/dominio.mjs
export function normalizarTelefono(texto) {
  const limpio = String(texto ?? '').trim();
  if (!/^\+?[\d\s()\-]{8,20}$/.test(limpio)) throw new Error('Formato de teléfono inválido.');
  const digitos = limpio.replace(/\D/g, '');
  if (!/^\d{8,15}$/.test(digitos)) throw new Error('Formato de teléfono inválido.');
  return digitos;
}

export function validarLead(lead) {
  for (const campo of ['nombre', 'apellido', 'correo', 'carrera']) {
    if (typeof lead?.[campo] !== 'string' || !lead[campo].trim()) return `Falta ${campo}.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.correo.trim())) return 'El correo no es válido.';
  try { normalizarTelefono(lead.telefono); } catch { return 'El teléfono no es válido.'; }
  return null;
}

export function nivelDe(carreras, nombre) {
  return carreras.find(c => c.nombre === nombre)?.nivel ?? null;
}

export function evento(tipo, datos = {}) {
  return JSON.stringify({ evento: tipo, ...datos });
}
```

**Step 4: Run test to verify it passes**

Run: `node --test carga-leads-app/tests/dominio.test.mjs`
Expected: PASS (5 tests).

**Step 5: Commit** (sólo con autorización)

```bash
git add carga-leads-app/aux/dominio.mjs carga-leads-app/tests/dominio.test.mjs
git commit -m "feat(carga-leads): validar datos del lead en el auxiliar"
```

---

### Task 4: Secuencia de carga y auxiliar Playwright

**Files:**
- Create: `carga-leads-app/aux/hubspot.mjs`
- Create: `carga-leads-app/aux/cargar.mjs`
- Test: `carga-leads-app/tests/flujo.test.mjs`

**Step 1: Write the failing test**

```js
// carga-leads-app/tests/flujo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ejecutarCarga } from '../aux/hubspot.mjs';

function adaptadorFalso() {
  const pasos = [];
  return {
    pasos,
    async sesion() { pasos.push('sesion'); },
    async contactoPorCorreo() { pasos.push('buscar-contacto'); return null; },
    async crearContacto() { pasos.push('crear-contacto'); return '101'; },
    async crearNegocio() { pasos.push('crear-negocio'); return '202'; },
    async enviar() { pasos.push('enviar'); },
  };
}

test('crea contacto, negocio y envía en ese orden', async () => {
  const adaptador = adaptadorFalso();
  const resultado = await ejecutarCarga(adaptador, {
    nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
    correo: 'ejemplo@example.invalid', carrera: 'Abogacía', nivel: 'Grado',
  });
  assert.deepEqual(adaptador.pasos, ['sesion', 'buscar-contacto', 'crear-contacto', 'crear-negocio', 'enviar']);
  assert.deepEqual(resultado, { contacto: '101', negocio: '202' });
});

test('reutiliza el contacto existente sin crear otro', async () => {
  const adaptador = adaptadorFalso();
  adaptador.contactoPorCorreo = async () => { adaptador.pasos.push('buscar-contacto'); return '99'; };
  await ejecutarCarga(adaptador, {
    nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
    correo: 'ejemplo@example.invalid', carrera: 'Abogacía', nivel: 'Grado',
  });
  assert.ok(!adaptador.pasos.includes('crear-contacto'));
});

test('el modo sin envío no pulsa Enviar', async () => {
  const adaptador = adaptadorFalso();
  await ejecutarCarga(adaptador, {
    nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
    correo: 'ejemplo@example.invalid', carrera: 'Abogacía', nivel: 'Grado',
  }, { secar: true });
  assert.ok(!adaptador.pasos.includes('enviar'));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test carga-leads-app/tests/flujo.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

**Step 3: Write minimal implementation**

```js
// carga-leads-app/aux/hubspot.mjs
export async function ejecutarCarga(adaptador, lead, { secar = false, emitir = () => {} } = {}) {
  emitir('paso', { texto: 'Comprobando la sesión' });
  await adaptador.sesion();

  emitir('paso', { texto: 'Buscando el contacto' });
  let contacto = await adaptador.contactoPorCorreo(lead.correo);
  if (!contacto) {
    emitir('paso', { texto: 'Creando el contacto' });
    contacto = await adaptador.crearContacto(lead);
  }

  emitir('paso', { texto: 'Creando el negocio' });
  const negocio = await adaptador.crearNegocio({ ...lead, contacto });
  if (!secar) {
    emitir('paso', { texto: 'Enviando el negocio' });
    await adaptador.enviar(negocio);
  }
  emitir('paso', { texto: 'Listo' });
  return { contacto, negocio };
}
```

Ahora el adaptador real. Los selectores del contacto ya están confirmados por la demostración del 17/11; los del negocio se toman de `selectores-negocio.md` (Task 2).

```js
// carga-leads-app/aux/cargar.mjs
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ejecutarCarga } from './hubspot.mjs';
import { crearAdaptador } from './adaptador-playwright.mjs';
import { validarLead, nivelDe, normalizarTelefono, evento } from './dominio.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PERFIL = path.join(AQUI, '..', 'perfil-hubspot'); // privado, gitignorado
const BASE = 'https://app.hubspot.com';
const INICIO = BASE + '/contacts/44080364/objects/0-1/views/all/list';

const emitir = (tipo, datos = {}) => console.log(evento(tipo, datos));

async function leerEntrada() {
  let texto = '';
  for await (const trozo of process.stdin) texto += trozo;
  return JSON.parse(texto);
}

async function main() {
  const secar = process.argv.includes('--secar');
  const datos = await leerEntrada();
  const error = validarLead(datos);
  if (error) throw Object.assign(new Error(error), { etapa: 'validar' });

  const carreras = JSON.parse(await readFile(path.join(AQUI, '..', 'carreras.json'), 'utf8'));
  const nivel = nivelDe(carreras, datos.carrera);
  if (!nivel) throw Object.assign(new Error('La carrera no está en la lista.'), { etapa: 'validar' });

  const { chromium } = await import('playwright');
  const brave = process.env.BRAVE_EJECUTABLE || ['/usr/bin/brave-browser', '/usr/bin/brave-browser-stable', '/opt/brave.com/brave/brave', '/snap/bin/brave'].find(existsSync);
  if (!brave) throw Object.assign(new Error('No se encontró Brave.'), { etapa: 'abrir_navegador' });

  const contexto = await chromium.launchPersistentContext(PERFIL, {
    executablePath: brave, headless: true, viewport: { width: 1920, height: 1080 },
    locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', timeout: 15000,
  });
  contexto.setDefaultTimeout(12000);
  try {
    const pagina = contexto.pages()[0] ?? await contexto.newPage();
    await pagina.goto(INICIO, { waitUntil: 'domcontentloaded', timeout: 25000 });
    const adaptador = crearAdaptador(pagina, { emitir });
    const resultado = await ejecutarCarga(adaptador, {
      ...datos, telefono: normalizarTelefono(datos.telefono), nivel,
    }, { secar, emitir });
    console.log(evento('ok', resultado));
  } finally {
    await contexto.close();
  }
}

main().catch(error => {
  console.log(evento('error', { etapa: error.etapa ?? 'general', mensaje: error.message }));
  process.exitCode = 1;
});
```

`crearAdaptador` vive en `carga-leads-app/aux/adaptador-playwright.mjs` y usa los selectores confirmados:

```js
// carga-leads-app/aux/adaptador-playwright.mjs
export function crearAdaptador(pagina, { emitir = () => {} } = {}) {
  const modalContacto = () => pagina.frameLocator('#nav-object-create-iframe').frameLocator('iframe');
  return {
    async sesion() {
      const url = new URL(pagina.url());
      if (url.origin !== 'https://app.hubspot.com' || !url.pathname.includes('/44080364/')
        || /\/login(?:\/|$)|confirm-to-login/.test(url.pathname)) {
        throw Object.assign(new Error('Iniciá sesión en HubSpot en el perfil de la app; no se pedirán códigos.'), { etapa: 'sesion' });
      }
    },
    async contactoPorCorreo(correo) {
      await pagina.goto(`https://app.hubspot.com/contacts/44080364/objects/0-1/views/all/list?query=${encodeURIComponent(correo)}`, { waitUntil: 'domcontentloaded' });
      const enlace = pagina.locator(`a[href*="/record/0-1/"]`).first();
      if (!await enlace.count()) return null;
      return new URL(await enlace.getAttribute('href')).pathname.match(/\/record\/0-1\/(\d+)/)?.[1] ?? null;
    },
    async crearContacto(lead) {
      await pagina.getByRole('button', { name: 'Crear nuevo' }).click();
      await pagina.getByText('Contacto', { exact: true }).first().click();
      const marco = modalContacto();
      await marco.getByRole('textbox', { name: 'Correo' }).fill(lead.correo);
      await marco.getByRole('textbox', { name: 'Nombre' }).fill(lead.nombre);
      await marco.getByRole('textbox', { name: 'Apellidos' }).fill(lead.apellido);
      await marco.getByRole('textbox', { name: 'Localidad' }).fill('Villa Lugano');
      await marco.getByRole('textbox', { name: 'Ciudad' }).fill('Villa Lugano');
      await marco.getByRole('button', { name: 'provincia_drop' }).click();
      await marco.getByRole('button', { name: 'CIUDAD AUTONOMA DE BUENOS AIRES' }).click();
      await marco.getByRole('button', { name: 'Contacto (B2C) ó (B2B)' }).click();
      await marco.getByRole('button', { name: 'Admisiones (B2C)' }).click();
      await marco.getByRole('button', { name: 'Origen Contacto' }).click();
      await marco.getByRole('button', { name: 'Lead CAU' }).click();
      await marco.getByRole('button', { name: 'Suborigen Contacto' }).click();
      await marco.getByRole('button', { name: 'Pauta Digital' }).click();
      await marco.getByRole('textbox', { name: 'Número de teléfono' }).click();
      const editor = marco.getByRole('textbox').last();
      await editor.fill(lead.telefono);
      await marco.getByRole('button', { name: 'Aplicar formato de número' }).click();
      await marco.getByRole('button', { name: 'Eliminar formato de número' }).click();
      await marco.getByRole('button', { name: 'Aplicar' }).click();
      await marco.getByRole('button', { name: 'Crear', exact: true }).click();
      return await pagina.locator('a[href*="/record/0-1/"]').first().getAttribute('href')
        .then(href => new URL(href).pathname.match(/\/record\/0-1\/(\d+)/)?.[1] ?? null);
    },
    async crearNegocio(datos) {
      // Completar con la tabla de carga-leads-app/selectores-negocio.md (Task 2).
      // Los nombres de etiqueta acordados son: Tipo de programa, Carrera, Modalidad,
      // Localidad, Origen, INT_Codigo Cau y Suborigen.
      const marco = pagina;
      await marco.getByRole('button', { name: 'Crear nuevo' }).click();
      await marco.getByText('Negocio', { exact: true }).first().click();
      await marco.getByLabel('Tipo de programa').selectOption({ label: datos.nivel });
      await marco.getByLabel('Carrera').fill(datos.carrera);
      await marco.getByLabel('Modalidad').selectOption({ label: 'Educación Distribuida Home' });
      await marco.getByLabel('Localidad').fill('Villa Lugano');
      await marco.getByLabel('Origen').selectOption({ label: 'Lead CAU' });
      await marco.getByLabel('INT_Codigo Cau').fill('VLG01');
      await marco.getByLabel('Suborigen').selectOption({ label: 'Pauta Digital' });
      return 'pendiente-de-id';
    },
    async enviar() {
      await pagina.getByRole('button', { name: 'Enviar', exact: true }).click();
    },
  };
}
```

**Step 4: Run tests**

Run: `node --test carga-leads-app/tests/flujo.test.mjs carga-leads-app/tests/dominio.test.mjs carga-leads-app/tests/carreras.test.mjs`
Expected: PASS (3 + 5 + 3 tests).

**Step 5: Corrida controlada sin envío**

Run:

```bash
printf '%s' '{"nombre":"Ejemplo","apellido":"Prueba","telefono":"0000000000","correo":"ejemplo@example.invalid","carrera":"Abogacía"}' \
  | node carga-leads-app/aux/cargar.mjs --secar
```

Expected: una línea `{"evento":"paso",...}` por etapa y una final `{"evento":"ok",...}`. Si el perfil no tiene sesión, la última línea es `{"evento":"error","etapa":"sesion",...}` con código de salida 1: eso es correcto y hay que iniciar sesión antes (ver Task 6).

**Step 6: Commit** (sólo con autorización)

```bash
git add carga-leads-app/aux
git commit -m "feat(carga-leads): auxiliar que completa contacto y negocio en HubSpot"
```

---

### Task 5: Interfaz nativa en Rust

**Files:**
- Create: `carga-leads-app/Cargo.toml`
- Create: `carga-leads-app/src/main.rs`
- Modify: `.gitignore` (agregar `carga-leads-app/perfil-hubspot/`, `carga-leads-app/target/`)

**Step 1: Write the failing test**

Dentro de `src/main.rs`, agregar al final:

```rust
#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn valida_el_formulario() {
        let lead = Lead::nuevo("Ejemplo", "Prueba", "0000000000", "ejemplo@example.invalid", Some("Abogacía".into()));
        assert!(lead.validar().is_ok());
    }

    #[test]
    fn rechaza_un_correo_invalido() {
        let lead = Lead::nuevo("Ejemplo", "Prueba", "0000000000", "sin-arroba", Some("Abogacía".into()));
        assert!(lead.validar().is_err());
    }

    #[test]
    fn convierte_eventos_del_auxiliar() {
        assert_eq!(
            Evento::desde_linea(r#"{"evento":"paso","texto":"Creando el negocio"}"#).unwrap(),
            Evento::Paso("Creando el negocio".into())
        );
        assert!(Evento::desde_linea("no es json").is_none());
    }
}
```

Para `validar_correo`, el test se refiere a un lead con correo inválido; usar `Lead::nuevo(..., "sin-arroba", ...)`.

**Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path carga-leads-app/Cargo.toml`
Expected: FAIL porque `Cargo.toml` y `main.rs` no existen.

**Step 3: Write minimal implementation**

```toml
# carga-leads-app/Cargo.toml
[package]
name = "carga-leads"
version = "0.1.0"
edition = "2021"

[dependencies]
egui = "0.31"
eframe = "0.31"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Si `cargo add` está disponible, también vale `cargo add --manifest-path carga-leads-app/Cargo.toml egui eframe serde serde_json`.

```rust
// carga-leads-app/src/main.rs
use eframe::egui;
use serde::Deserialize;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::mpsc::{self, Receiver, Sender};

#[derive(Clone)]
struct Lead {
    nombre: String,
    apellido: String,
    telefono: String,
    correo: String,
    carrera: Option<String>,
}

impl Lead {
    fn nuevo(nombre: &str, apellido: &str, telefono: &str, correo: &str, carrera: Option<String>) -> Self {
        Self { nombre: nombre.into(), apellido: apellido.into(), telefono: telefono.into(), correo: correo.into(), carrera }
    }
    fn validar(&self) -> Result<(), String> {
        if self.nombre.trim().is_empty() { return Err("Falta el nombre.".into()); }
        if self.apellido.trim().is_empty() { return Err("Falta el apellido.".into()); }
        if self.correo.trim().is_empty() || !self.correo.contains('@') { return Err("El correo no es válido.".into()); }
        if self.telefono.trim().is_empty() { return Err("Falta el teléfono.".into()); }
        if self.carrera.is_none() { return Err("Elegí una carrera.".into()); }
        Ok(())
    }
}

#[derive(Deserialize, Debug, PartialEq)]
struct EventoCrudo {
    evento: String,
    #[serde(default)]
    texto: Option<String>,
    #[serde(default)]
    etapa: Option<String>,
    #[serde(default)]
    mensaje: Option<String>,
}

#[derive(Debug, PartialEq)]
enum Evento {
    Paso(String),
    Ok,
    Error(String, String),
}

impl Evento {
    fn desde_linea(linea: &str) -> Option<Self> {
        let crudo: EventoCrudo = serde_json::from_str(linea).ok()?;
        match crudo.evento.as_str() {
            "paso" => Some(Self::Paso(crudo.texto.unwrap_or_default())),
            "ok" => Some(Self::Ok),
            "error" => Some(Self::Error(
                crudo.etapa.unwrap_or_default(),
                crudo.mensaje.unwrap_or_else(|| "Error sin detalle.".into()),
            )),
            _ => None,
        }
    }
}

#[derive(Deserialize)]
struct Carrera {
    nombre: String,
    nivel: String,
}

#[derive(Default, PartialEq)]
enum Estado { #[default] Inactivo, Cargando, Listo, Error }

struct AppCarga {
    lead: Lead,
    carreras: Vec<(String, String)>, // (nombre, nivel)
    filtro: String,
    indice: usize,
    estado: Estado,
    paso: String,
    error: String,
    rx: Receiver<Evento>,
    tx: Sender<Evento>,
}

impl AppCarga {
    fn nueva(tx: Sender<Evento>, rx: Receiver<Evento>) -> Self {
        let carreras = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/carreras.json"))
            .ok()
            .and_then(|texto| serde_json::from_str::<Vec<Carrera>>(&texto).ok())
            .map(|lista| lista.into_iter().map(|c| (c.nombre, c.nivel)).collect())
            .unwrap_or_default();
        Self {
            lead: Lead::nuevo("", "", "", "", None),
            carreras,
            filtro: String::new(), indice: 0,
            estado: Estado::Inactivo, paso: String::new(), error: String::new(), rx, tx,
        }
    }

    fn cargar(&mut self) {
        if let Err(mensaje) = self.lead.validar() {
            self.error = mensaje;
            self.estado = Estado::Error;
            return;
        }
        self.estado = Estado::Cargando;
        self.error.clear();
        let tx = self.tx.clone();
        let lead = self.lead.clone();
        std::thread::spawn(move || {
            let aux = concat!(env!("CARGO_MANIFEST_DIR"), "/aux/cargar.mjs");
            let hijo = Command::new("node")
                .arg(aux)
                .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped())
                .spawn();
            let mut hijo = match hijo {
                Ok(h) => h,
                Err(e) => { let _ = tx.send(Evento::Error("proceso".into(), e.to_string())); return; }
            };
            if let Some(entrada) = hijo.stdin.as_mut() {
                use std::io::Write;
                let _ = writeln!(entrada, "{}", serde_json::to_string(&serde_json::json!({
                    "nombre": lead.nombre, "apellido": lead.apellido, "telefono": lead.telefono,
                    "correo": lead.correo, "carrera": lead.carrera,
                })).unwrap());
            }
            drop(hijo.stdin.take());
            if let Some(salida) = hijo.stdout.take() {
                for linea in BufReader::new(salida).lines().map_while(Result::ok) {
                    if let Some(evento) = Evento::desde_linea(&linea) {
                        let fin = matches!(evento, Evento::Ok | Evento::Error(_, _));
                        let _ = tx.send(evento);
                        if fin { break; }
                    }
                }
            }
            let _ = hijo.wait();
        });
    }
}

impl eframe::App for AppCarga {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        for evento in self.rx.try_iter() {
            match evento {
                Evento::Paso(texto) => self.paso = texto,
                Evento::Ok => { self.estado = Estado::Listo; self.paso = "Lead cargado.".into(); }
                Evento::Error(etapa, mensaje) => {
                    self.estado = Estado::Error;
                    self.error = format!("{}: {}", etapa, mensaje);
                }
            }
        }
        if self.estado == Estado::Cargando { ctx.request_repaint(); }

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("Carga de leads");
            ui.add_enabled_ui(self.estado != Estado::Cargando, |ui| {
                ui.horizontal(|ui| { ui.label("Nombre"); ui.text_edit_singleline(&mut self.lead.nombre); });
                ui.horizontal(|ui| { ui.label("Apellido"); ui.text_edit_singleline(&mut self.lead.apellido); });
                ui.horizontal(|ui| { ui.label("Teléfono"); ui.text_edit_singleline(&mut self.lead.telefono); });
                ui.horizontal(|ui| { ui.label("Correo"); ui.text_edit_singleline(&mut self.lead.correo); });
                ui.label("Buscar carrera");
                ui.text_edit_singleline(&mut self.filtro);
                let filtradas: Vec<_> = self.carreras.iter()
                    .filter(|(nombre, _)| nombre.to_lowercase().contains(&self.filtro.to_lowercase()))
                    .collect();
                for (indice, (nombre, nivel)) in filtradas.iter().enumerate() {
                    if ui.selectable_label(indice == self.indice, format!("{} · {}", nombre, nivel)).clicked() {
                        self.indice = indice;
                        self.lead.carrera = Some((*nombre).clone());
                    }
                }
                if ui.button("Cargar lead").clicked() { self.cargar(); }
            });
            if !self.paso.is_empty() { ui.label(&self.paso); }
            if !self.error.is_empty() {
                ui.colored_label(egui::Color32::RED, &self.error);
            }
        });
    }
}

fn main() -> eframe::Result<()> {
    let (tx, rx) = mpsc::channel();
    let opciones = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default().with_inner_size([520.0, 640.0]),
        ..Default::default()
    };
    eframe::run_native(
        "Carga de leads",
        opciones,
        Box::new(move |_cc| Ok(Box::new(AppCarga::nueva(tx.clone(), rx)))),
    )
}
```

**Step 4: Run tests y build**

Run: `cargo test --manifest-path carga-leads-app/Cargo.toml && cargo build --release --manifest-path carga-leads-app/Cargo.toml`
Expected: 2 tests PASS; binario en `carga-leads-app/target/release/carga-leads`.

**Step 5: Correr la app**

Run: `carga-leads-app/target/release/carga-leads`
Expected: ventana con los cinco campos, la lista buscable y el botón. Cargar un lead con datos de prueba y confirmar que los pasos aparecen en la ventana.

**Step 6: Commit** (sólo con autorización)

```bash
git add carga-leads-app/Cargo.toml carga-leads-app/src/main.rs .gitignore
git commit -m "feat(carga-leads): interfaz nativa en Rust para cargar leads"
```

---

### Task 6: Puesta en marcha y verificación final

**Files:**
- Create: `carga-leads-app/README.md`

**Step 1: Iniciar sesión una vez en el perfil de la app**

El perfil `carga-leads-app/perfil-hubspot` es privado y arranca sin sesión. Para abrirlo con Brave visible:

```bash
BRAVE_EJECUTABLE=$(command -v brave-browser) node carga-leads-app/aux/iniciar-sesion.mjs
```

`iniciar-sesion.mjs` hace `chromium.launchPersistentContext(PERFIL, { executablePath: brave, headless: false })` y navega a `https://app.hubspot.com/login`. El usuario inicia sesión y cierra la ventana. No se guardan credenciales ni se lee correo.

**Step 2: Verificar sin envío**

```bash
node --test carga-leads-app/tests/*.test.mjs
printf '%s' '{"nombre":"Ejemplo","apellido":"Prueba","telefono":"0000000000","correo":"ejemplo@example.invalid","carrera":"Abogacía"}' \
  | node carga-leads-app/aux/cargar.mjs --secar
```

Expected: todos los tests pasan; el auxiliar termina con `ok` y no hay negocio enviado. Si falta sesión, termina con `error` en `sesion`.

**Step 3: Verificación real controlada**

Con el perfil ya autenticado, cargar un lead de prueba desde la ventana y comprobar en HubSpot que el contacto y el negocio quedaron con los valores del diseño. No repetir la misma carga: si el correo ya existe, el auxiliar lo reutiliza.

**Step 4: Documentar el uso**

`carga-leads-app/README.md` debe explicar: cómo iniciar sesión, cómo generar `carreras.json` de nuevo, cómo correr la app, qué significa `--secar` y dónde se muestran los errores. Sin eslóganes ni texto promocional.

**Step 5: Commit** (sólo con autorización)

```bash
git add carga-leads-app/README.md
git commit -m "docs(carga-leads): instructivo de puesta en marcha"
```

---

## Notas para quien ejecuta el plan

- Actualización del 18/11: el Task 5 quedó ampliado con un segundo botón, *Cargar viendo*, que pasa `--ver` al auxiliar para abrir Brave visible (`headless: false`). La ventana acumula los pasos en un registro con `ScrollArea` y usa la paleta del CAU (`#013729`, `#1c2f31`, `#00c7b1`, `#058c70`, `#005587`). El código vigente está en `carga-leads-app/src/main.rs`; el fragmento del Task 5 es la versión inicial.
- No tocar `herramientas/ventas/` ni el panel actual: esta app es independiente.
- No importar módulos de `herramientas/ventas/`: esa carpeta es privada y no viaja por git. Las funciones necesarias (ruta de Brave, normalización del teléfono) están reimplementadas en `carga-leads-app/aux/`.
- No commitear ni pushear sin autorización explícita del usuario; las reglas del repo piden aprobación antes de modificar `main`.
- Ninguna prueba debe crear negocios reales: usar siempre `--secar` salvo en el Step 3 del Task 6, acordado con el usuario.
- Los selectores del modal de negocio se confirman en el Task 2; si difieren de los nombres usados en el Task 4, se corrige `adaptador-playwright.mjs` antes de la verificación.
