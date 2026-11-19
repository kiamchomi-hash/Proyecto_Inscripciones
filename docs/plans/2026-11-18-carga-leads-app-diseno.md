# App independiente de carga de leads en HubSpot

## Objetivo

Una aplicación de escritorio nueva, separada del panel actual y dedicada sólo a cargar leads. Recibe cinco datos del operador —nombre, apellido, teléfono, correo y carrera— y completa el contacto y el negocio en HubSpot con los valores habituales del CAU. No pide confirmaciones: ejecuta *Crear* y *Enviar* y sólo avisa cuando hay un error.

## Diseño aprobado

### Arquitectura

- App nueva en una carpeta propia (`carga-leads-app/`), sin tocar el panel de `herramientas/ventas/`.
- **Interfaz nativa en Rust** con `egui/eframe`: binario liviano, sin Electron. Muestra los campos, el botón *Cargar lead*, el paso en curso y el panel de errores.
- **Auxiliar local en Node/Playwright**: recibe los datos por JSON y opera HubSpot usando el perfil Brave `siglo21`. Aplica la misma técnica ya probada en `herramientas/ventas/hubspot-negocios.mjs`: localizar controles por etiquetas, roles y `data-test-id`, nunca por coordenadas.
- Rust lanza el auxiliar como proceso hijo, le pasa el lead por stdin y lee por stdout los eventos de progreso y el resultado.

### Interfaz

- Campos: nombre, apellido, teléfono, correo y carrera elegida de una lista buscable con filtro por texto.
- Un botón de sesión muestra *Sesión iniciada* (verde) o *Sesión no iniciada* (ámbar); al pulsarlo abre una sola ventana y una sola pestaña de Brave con el login de HubSpot en el perfil privado de la app. La ventana **no se cierra sola**: mientras está abierta aparece el botón *Ya inicié sesión*, que es el único cierre desde la app y dispara la verificación. La comprobación espera la redirección para no dar un falso positivo.
- Dos botones: *Cargar lead* (Brave en segundo plano) y *Cargar viendo* (Brave visible para seguir la carga en HubSpot). Mientras corre, muestra y acumula cada paso en el panel *Estado*; al terminar, muestra el resultado.
- Estética con la paleta del CAU: fondo `#013729`, tarjetas `#1c2f31`, acento `#00c7b1`, verde `#058c70` y azul `#005587`.
- Los errores aparecen **dentro de la app**, con el mensaje y el paso donde falló. No hay diálogos de confirmación ni revisión manual previa al envío.

### Datos que completa en HubSpot

**Contacto** (modal *Crear Contacto*):
- Correo, nombre, apellidos y teléfono. Al cargar el teléfono se aplica *Aplicar formato de número* y después *Eliminar formato de número*, para guardarlo sin formato.
- Localidad y ciudad `Villa Lugano`, provincia `CIUDAD AUTONOMA DE BUENOS AIRES`.
- `Contacto (B2C) ó (B2B)` = `Admisiones (B2C)`.
- `Origen Contacto` = `Lead CAU`; `Suborigen Contacto` = `Pauta Digital`.
- Si ya existe un contacto con ese correo, se reutiliza para crear el negocio: no se detiene ni se avisa, porque el fin es automatizar.

**Negocio**:
- `Tipo de programa` = `Grado` o `Pregrado`, según el nivel de la carrera elegida.
- `Carrera` = la seleccionada en la app.
- `Modalidad` = `Educación Distribuida Home`.
- `Localidad` = `Villa Lugano`.
- `Origen` = `Lead CAU`.
- `INT_Codigo Cau` = `VLG01`.
- `Suborigen` = `Pauta Digital`.
- Cierra con *Enviar*, sin revisión previa.

### Errores y sesión

- Usa la sesión existente del perfil Brave `siglo21`; no guarda credenciales ni lee correo.
- Si HubSpot pide login o código 2FA, la carga se detiene y el error se muestra en la app. No reintenta automáticamente ni reenvía OTP.
- Ningún secreto ni dato privado entra al repositorio.

## Contexto técnico

El perfil y las rutas locales ya están declarados en `herramientas/ventas/rutas.mjs` (`PERFIL_HUBSPOT`) y `entorno-ventas.mjs` (`ejecutableBrave`, `datosBrave`). El flujo de negocio y sus selectores semánticos están en `herramientas/ventas/hubspot-negocios.mjs`; la demostración del 17/11/2026 sobre el modal *Crear Contacto* confirmó las etiquetas y el procedimiento del teléfono. La lista de carreras se toma de la base local sin precios (`conocimiento/`), no se escribe a mano. El teléfono se normaliza con la misma función del robot actual (`normalizarTelefono` en `hubspot-negocios-dominio.mjs`).

## Verificación prevista

- Pruebas del mapeo carrera → `Grado`/`Pregrado` y de la normalización del teléfono.
- Corrida de prueba controlada con modo sin envío, para validar que los selectores encuentran cada campo del flujo real.
- Comprobación de que el aviso de error llega a la app y de que no hay diálogos de confirmación en el recorrido.
