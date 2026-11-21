# Carga de leads

App de escritorio independiente para cargar leads en HubSpot. Pide nombre, apellido, teléfono, correo y carrera; completa el contacto y el negocio con los datos habituales del CAU y envía sin pedir confirmación. Los errores se muestran en la misma ventana.

## Puesta en marcha

1. Iniciar sesión en HubSpot. Al abrir la app, el botón *Sesión no iniciada* (ámbar) o *Sesión iniciada* (verde) muestra el estado. Si está ámbar, pulsarlo: se abre **una** ventana de Brave en `carga-leads-app/perfil-hubspot` con una sola pestaña, que entra directo a **Mis contactos** (`/contacts/44080364/objects/0-1/views/my/list`). Iniciá sesión con calma: la ventana **no se cierra sola**. Cuando termines, pulsá **Ya inicié sesión** en la app; recién ahí se cierra Brave y el botón pasa a verde. Mientras esa ventana esté abierta, el botón sigue mostrando **Ya inicié sesión** en lugar de un estado: eso significa que la ventana sigue abierta, no que la sesión se haya perdido. El perfil no viaja por git.

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

- **Sesión iniciada / Sesión no iniciada**: muestra el estado y abre el login al pulsarlo. Mientras la ventana está abierta aparece **Ya inicié sesión**, que es el único modo de cerrarla desde la app.
- **Cargar lead**: abre Brave en segundo plano, busca o crea el contacto y muestra su ID en el estado. No crea el negocio.
- **Cargar negocio**: usa el correo y la carrera del formulario, abre la ficha del contacto existente, completa el negocio y pulsa **Enviar** una vez. Si el contacto no existe, avisa.
- **Cargar lead viendo**: igual que Cargar lead, pero con Brave visible.
- **Cargar negocio viendo**: igual que Cargar negocio, pero con Brave visible.

Los cuatro botones muestran cada paso en el panel **Estado**.

Los pasos se acumulan en el panel y quedan visibles cuando termina. Los errores aparecen en rojo dentro de la misma ventana. Si la ventana de sesión sigue abierta, la carga se detiene y pide cerrarla primero con **Ya inicié sesión**: el perfil no puede usarse en dos ventanas a la vez.

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
