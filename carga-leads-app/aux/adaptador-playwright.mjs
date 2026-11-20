const BASE = 'https://app.hubspot.com';
const INICIO = BASE + '/contacts/44080364/objects/0-1/views/my/list';
const NOMBRES_PROGRAMA_HUBSPOT = new Map([
  ['Licenciatura en Administración de Servicios de Salud', 'Licenciatura en Administración de Servicios de Salud (CCC)'],
  ['Licenciatura en Emprendimiento', 'Licenciatura En Emprendimiento (CCC)'],
  ['Licenciatura en Gerontología', 'Licenciatura En Gerontología (CCC)'],
  ['Licenciatura en inteligencia en Negocios Digitales', 'Licenciatura en Inteligencia de Negocios Digitales'],
  ['Profesorado Universitario Nivel Secundario y Superior', 'Profesorado Universitario para el Nivel Secundario y Superior'],
  ['Tecnicatura en Administración y Gestión de Políticas Públicas', 'Tecnicatura Universitaria En Administración Y Gestión De Políticas Públicas'],
  ['Tecnicatura en Dirección de Equipos de Venta', 'Tecnicatura En Dirección De Equipos De Ventas'],
  ['Tecnicatura en Diseño y Animación Digital', 'Tecnicatura Universitaria En Diseño Y Animación Digital'],
  ['Tecnicatura en la Investigación de la Escena del Crimen', 'Tecnicatura en Investigación de la Escena del Crimen'],
  ['Tecnicatura en Martillero, Corredor Público y Corredor Inmobiliario', 'Martillero, Corredor Público Y Corredor Inmobiliario'],
  ['Tecnicatura en Promoción Comunitaria en Niñez y Adolescencia', 'Tecnicatura Universitaria en Promoción Comunitaria en Niñez y Adolescencia'],
  ['Tecnicatura en Marketing y Publicidad Digital', 'Tecnicatura Universitaria En Marketing Y Publicidad Digital'],
]);

export function patronProgramaHubSpot(carrera) {
  const nombre = NOMBRES_PROGRAMA_HUBSPOT.get(carrera) ?? carrera;
  return new RegExp(`^${nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

export function exigirSesion(pagina) {
  let url;
  try { url = new URL(pagina.url()); } catch { url = null; }
  if (!url || url.origin !== BASE || !url.pathname.includes('/44080364/')
    || /\/login(?:\/|$)|confirm-to-login/.test(url.pathname)) {
    throw Object.assign(
      new Error('Iniciá sesión en HubSpot con el botón de la app; no se pedirán códigos.'),
      { etapa: 'sesion' },
    );
  }
}

async function abrirFormularioContacto(pagina) {
  await pagina.locator('[data-test-id="create-object-dropdown"]').click();
  await pagina.locator('[data-test-id="create-object-dropdown-create-object"]').click();
}

function idDeContacto(href) {
  try {
    const url = new URL(href);
    if (url.origin !== BASE) return null;
    return url.pathname.match(/\/record\/0-1\/(\d+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

async function elegirSelect(marco, nombre, texto) {
  const select = marco.locator(`select[name="${nombre}"]`);
  const opciones = await select.locator('option').allTextContents();
  const buscado = texto.trim().toLowerCase();
  const elegida = opciones.map(o => o.trim()).find(o => o.toLowerCase() === buscado)
    ?? opciones.map(o => o.trim()).find(o => o.toLowerCase().includes(buscado));
  if (!elegida) throw Object.assign(new Error(`No hay opción «${texto}» en ${nombre}.`), { etapa: 'negocio' });
  await select.selectOption({ label: elegida });
}

export async function cargarTelefono(marco, etiqueta, numero, emitir) {
  emitir('paso', { texto: `Cargando ${etiqueta.toLowerCase()}` });
  await marco.getByRole('textbox', { name: etiqueta }).click();
  const editor = marco.locator('[id^="uiopenpopup-"]:visible')
    .filter({ has: marco.getByText(new RegExp(`^Editar ${etiqueta}$`, 'i')) });
  await editor.waitFor({ state: 'visible' });
  const eliminar = editor.getByText('Eliminar formato de número', { exact: true });
  if (await eliminar.isVisible()) await eliminar.click();
  const campo = editor.locator('input:is([type="text"], [type="tel"]):not([aria-label="Extensión telefónica"]):visible');
  await campo.waitFor({ state: 'visible', timeout: 20000 });
  await campo.fill(numero);
  await editor.getByRole('button', { name: 'Aplicar', exact: true }).click();
}

export function crearAdaptador(pagina, { emitir = () => {} } = {}) {
  const modalContacto = () => pagina.frameLocator(
    '#object-builder-ui, #nav-object-create-iframe iframe',
  );

  const verificar = () => exigirSesion(pagina);

  return {
    async sesion() {
      verificar();
    },

    async contactoPorCorreo(correo) {
      await pagina.goto(`${INICIO}?query=${encodeURIComponent(correo)}`, { waitUntil: 'domcontentloaded' });
      await pagina.waitForTimeout(4000);
      verificar();
      const encontrados = await pagina.locator('a[href*="/record/0-1/"]').evaluateAll((enlaces, buscado) => enlaces
        .map(enlace => ({
          href: enlace.href,
          texto: (enlace.closest('tr')?.innerText ?? enlace.innerText ?? '').toLowerCase(),
        }))
        .filter(item => item.texto.includes(buscado.toLowerCase())), correo);
      if (!encontrados.length) return null;
      const ids = [...new Set(encontrados.map(item => idDeContacto(item.href)).filter(Boolean))];
      if (ids.length !== 1) throw Object.assign(new Error('Hay varios contactos con ese correo.'), { etapa: 'contacto' });
      return ids[0];
    },

    async crearContacto(lead) {
      verificar();
      await abrirFormularioContacto(pagina);
      emitir('paso', { texto: 'Abriendo el formulario de contacto' });
      const marco = modalContacto();
      await marco.getByRole('textbox', { name: 'Correo' }).waitFor({ state: 'visible', timeout: 30000 });

      await marco.getByRole('textbox', { name: 'Correo' }).fill(lead.correo);
      await marco.getByRole('textbox', { name: 'Nombre' }).fill(lead.nombre);
      await marco.getByRole('textbox', { name: 'Apellidos' }).fill(lead.apellido);
      emitir('paso', { texto: 'Cargando correo, nombre y apellido' });

      await marco.getByRole('textbox', { name: 'Localidad' }).fill('Villa Lugano');
      await marco.getByRole('textbox', { name: 'Ciudad' }).fill('Villa Lugano');
      await marco.getByRole('button', { name: 'provincia_drop' }).click();
      await marco.getByRole('button', { name: 'CIUDAD AUTONOMA DE BUENOS AIRES' }).click();
      emitir('paso', { texto: 'Cargando localidad y provincia' });

      await marco.getByRole('button', { name: 'Contacto (B2C) ó (B2B)' }).click();
      await marco.getByRole('button', { name: 'Admisiones (B2C)' }).click();
      await marco.getByRole('button', { name: 'Origen Contacto' }).click();
      await marco.getByRole('button', { name: 'Lead CAU' }).click();
      await marco.getByRole('button', { name: 'Suborigen Contacto' }).click();
      await marco.getByRole('button', { name: 'Pauta Digital' }).click();
      emitir('paso', { texto: 'Cargando tipo, origen y suborigen' });

      await cargarTelefono(marco, 'Número de teléfono', lead.telefono, emitir);
      await cargarTelefono(marco, 'Número de móvil', lead.telefono, emitir);

      emitir('paso', { texto: 'Guardando el contacto' });
      await marco.getByRole('button', { name: 'Crear', exact: true }).click();
      await pagina.waitForURL(/\/contacts\/44080364\/record\/0-1\/\d+/, { timeout: 30000 });
      const id = new URL(pagina.url()).pathname.match(/\/record\/0-1\/(\d+)/)?.[1] ?? null;
      emitir('paso', { texto: 'Contacto creado' });
      return id;
    },

    async crearNegocio(datos) {
      verificar();
      if (!/^\d+$/.test(datos.contacto ?? '')) throw new Error('No se pudo identificar la ficha del contacto.');
      const ficha = `${BASE}/contacts/44080364/record/0-1/${datos.contacto}`;
      await pagina.goto(ficha, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await pagina.waitForTimeout(4000);
      verificar();
      emitir('paso', { texto: 'Abriendo el formulario de negocio' });
      const tarjeta = pagina.locator('[data-test-id="hs-create-deal-custom-card"]');
      if (await tarjeta.count()) {
        await tarjeta.getByRole('button', { name: 'Crear Negocio', exact: true }).click();
      } else {
        await pagina.getByRole('button', { name: 'Crear Negocio', exact: true }).click();
      }
      const marco = pagina.frameLocator('iframe[src*="landing-negocios-agentes"]');
      await marco.locator('select[name="tipo_de_programa"]').waitFor({ state: 'visible', timeout: 30000 });

      await elegirSelect(marco, 'tipo_de_programa', datos.nivel);
      emitir('paso', { texto: 'Seleccionando el programa' });
      const choicesPrograma = marco.locator('.choices')
        .filter({ has: marco.locator('select[name="program_generic"]') });
      await choicesPrograma.locator('.choices__inner').click();
      await choicesPrograma.locator('input[name="search_terms"]')
        .fill(NOMBRES_PROGRAMA_HUBSPOT.get(datos.carrera) ?? datos.carrera);
      const opcionCarrera = choicesPrograma.locator('.choices__list--dropdown [data-choice]:visible')
        .filter({ hasText: patronProgramaHubSpot(datos.carrera) }).first();
      await opcionCarrera.click();
      emitir('paso', { texto: 'Cargando tipo de programa y carrera' });

      await elegirSelect(marco, 'modalidad_de_interes', 'Educación distribuida home');
      await marco.locator('input[name="localidad"]').fill('Villa Lugano');
      await pagina.waitForTimeout(1200);
      const sugerenciaLocalidad = marco.getByText(/VILLA LUGANO - CIUDAD AUTONOMA DE BUENOS AIRES - ARGENTINA/i).first();
      if (await sugerenciaLocalidad.count()) await sugerenciaLocalidad.click();
      await elegirSelect(marco, 'int_origen_agentes', 'Lead CAU');
      await elegirSelect(marco, 'int_suborigen_script', 'Pauta Digital');
      await marco.locator('input[name="int_cau_code"]').fill('VLG01');
      emitir('paso', { texto: 'Negocio completado' });
    },

    async enviar() {
      verificar();
      const marco = pagina.frameLocator('iframe[src*="landing-negocios-agentes"]');
      await marco.locator('input[type="submit"]').click();
    },
  };
}
