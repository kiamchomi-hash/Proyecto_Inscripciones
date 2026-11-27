# Carga de leads

App de escritorio independiente para cargar leads en HubSpot. Pide nombre, apellido, teléfono, correo y carrera; completa el contacto y el negocio con los datos habituales del CAU y envía sin pedir confirmación. Los errores se muestran en la misma ventana.

## Puesta en marcha

1. Iniciar sesión en HubSpot. El botón **Abrir sesión de HubSpot** abre una ventana de Brave con el perfil de la app en la página de **Mis contactos** (`/contacts/44080364/objects/0-1/views/my/list`). **La ventana queda abierta hasta que la cerrés**: la app no detecta el login, no cierra pestañas y no tiene límite de tiempo. Cuando termines, cerrala; el botón vuelve a quedar disponible. Mientras esté abierta, la app muestra **Cerrá la ventana de HubSpot** y no permite cargar leads, porque el perfil no puede usarse en dos ventanas a la vez. El perfil no viaja por git.

   También se puede abrir directamente con:

   ```bash
   node carga-leads-app/aux/iniciar-sesion.mjs
   ```

2. Generar la lista de carreras (sale de `conocimiento/siglo21.md`, sin precios):

   ```bash
   node carga-leads-app/generar-carreras.mjs
   ```

3. Compilar y abrir la ventana:

   ```bash
   cargo build --release --manifest-path carga-leads-app/Cargo.toml
   carga-leads-app/target/release/carga-leads
   ```

## Botones

- **Abrir sesión de HubSpot**: abre la ventana de Brave con el perfil de la app. No se cierra sola ni verifica el login: la cerrás vos y el botón vuelve a quedar disponible.
- **Cargar lead**: abre Brave en segundo plano, busca o crea el contacto y muestra su ID en el estado. No crea el negocio.
- **Cargar negocio**: usa el correo y la carrera del formulario, abre la ficha del contacto existente, completa el negocio y pulsa **Enviar** una vez. Si el contacto no existe, avisa.
- **Cargar lead viendo**: igual que Cargar lead, pero con Brave visible.
- **Cargar negocio viendo**: igual que Cargar negocio, pero con Brave visible.

Los cuatro botones muestran cada paso en el panel **Estado**.

Los pasos se acumulan en el panel y quedan visibles cuando termina. Los errores aparecen en rojo dentro de la misma ventana. Si la ventana de sesión sigue abierta, la carga se detiene y pide cerrarla primero: el perfil no puede usarse en dos ventanas a la vez.

## Pruebas

```bash
node --test carga-leads-app/tests/*.test.mjs
cargo test --manifest-path carga-leads-app/Cargo.toml
```

Para revisar los selectores sin crear nada en HubSpot, agregar `--secar` al auxiliar: completa los campos pero no pulsa *Enviar*.

```bash
printf '%s' '{"nombre":"Ejemplo","apellido":"Prueba","telefono":"0000000000","correo":"ejemplo@example.invalid","carrera":"Abogacía"}' \
  | node carga-leads-app/aux/cargar.mjs --secar
```

## Datos que carga

- Contacto: correo, nombre, apellido, teléfono sin formato, Villa Lugano, CABA, `Admisiones (B2C)`, origen `Lead CAU`, suborigen `Pauta Digital`.
- Negocio: `Grado` o `Pregrado` según la carrera, carrera, `Educación Distribuida Home`, Villa Lugano, origen `Lead CAU`, `INT_Codigo Cau = VLG01`, suborigen `Pauta Digital`.

Si el correo ya existe en HubSpot, se usa ese contacto; no se crea otro.
