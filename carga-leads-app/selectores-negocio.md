# Selectores confirmados de HubSpot

Vista de entrada: `https://app.hubspot.com/contacts/44080364/objects/0-1/views/my/list` (Mis contactos).

## Crear contacto

| Paso | Control | Selector |
| --- | --- | --- |
| 1 | Botón «Agregar contactos» | `[data-test-id="create-object-dropdown"]` |
| 2 | Opción «Crear nuevo» de ese menú | `[data-test-id="create-object-dropdown-create-object"]` |
| 3 | Formulario | iframe `#object-builder-ui` |
| 4 | Correo, nombre, apellidos, localidad, ciudad | `getByRole('textbox', { name: ... })` |
| 5 | Provincia, tipo B2C, origen, suborigen | `getByRole('button', { name: ... })` |
| 6 | Teléfono y móvil | abrir editor → **Eliminar formato de número** → escribir en el campo liberado → **Aplicar**. Ambos son obligatorios y se carga el mismo número. |
| 7 | Guardar | `getByRole('button', { name: 'Crear', exact: true })` |

Al guardar, HubSpot navega a la ficha del contacto `/contacts/44080364/record/0-1/<id>`. El robot espera esa URL y toma el id de ahí.

## Crear negocio

Se hace desde la ficha del contacto (el menú global no tiene permisos y muestra «No tienes acceso para ver esta página»).

| Paso | Control | Selector / valor |
| --- | --- | --- |
| 1 | Tarjeta «Crear un nuevo negocio» | `[data-test-id="hs-create-deal-custom-card"]` → botón «Crear Negocio» |
| 2 | Modal | iframe `iframe[src*="landing-negocios-agentes"]` |
| Tipo de programa | `select[name="tipo_de_programa"]` | `Grado` o `Pregrado` |
| Programa | Choices de `select[name="program_generic"]` | abrir `.choices__inner`, escribir en `input[name="search_terms"]`, elegir opción de `.choices__list--dropdown .choices__item` |
| Modalidad | `select[name="modalidad_de_interes"]` | `Educación distribuida home` |
| Localidad | `input[name="localidad"]` | escribir `Villa Lugano` y elegir la sugerencia `VILLA LUGANO - CIUDAD AUTONOMA DE BUENOS AIRES - ARGENTINA` |
| Origen | `select[name="int_origen_agentes"]` | `Lead CAU` |
| Suborigen | `select[name="int_suborigen_script"]` | `Pauta Digital` |
| Código CAU | `input[name="int_cau_code"]` (aparece al elegir Lead CAU) | `VLG01` |
| Enviar | `input[type="submit"]` | — |

Notas:

- El formulario de contacto tarda unos 10 segundos en renderizarse; la espera es de 30 segundos.
- `int_cau` (hidden) no es el campo visible; el visible es `int_cau_code`.
- Las capturas de cada paso se guardan en `/tmp/opencode/carga-leads-pasos/` al correr con `--capturas`.
