// Qué pide cada casa en cada formulario, y dónde se guarda cada dato.
//
// Este archivo es la fuente de verdad de los formularios: lo leen el componente
// (para pintar los campos) y `app/api/formularios/route.ts` (para armar la fila
// que va a `consultas`). Que la columna de Supabase viva acá, al lado del campo,
// es lo que impide repetir el incidente del 23/08/2026: el endpoint escribía
// nueve columnas que no existían y PostgREST rechaza la fila entera cuando una
// no existe (PGRST204), así que dejaron de entrar TODAS las consultas del sitio.
//
// Va todo en un archivo a propósito. Node strippea los tipos y corre estos
// módulos en los tests, pero no resuelve imports de valor entre `.ts` sin
// extensión; separarlo en tres dejaría la lógica sin poder testearse.

// ── Los campos ──

/** Los bloques del formulario, en el orden en que se pintan. */
export const GRUPOS = ['consulta', 'personales', 'domicilio', 'estudios', 'contacto'] as const;
export type Grupo = (typeof GRUPOS)[number];

export type CampoId =
  | 'nombre' | 'apellido' | 'tipoDocumento' | 'dni' | 'sexo'
  | 'fechaNacimiento' | 'lugarNacimiento' | 'nacionalidad' | 'estadoCivil'
  | 'paisResidencia' | 'tipoDomicilio' | 'domicilio' | 'domicilioNumero'
  | 'domicilioPiso' | 'domicilioDepartamento' | 'torre' | 'barrio'
  | 'codigoPostal' | 'localidad'
  | 'nivelEstudios' | 'colegio' | 'colegioLocalidad' | 'medioPago'
  | 'modalidad' | 'equivalencias' | 'email' | 'telefono';

export interface Campo {
  /** Columna de `consultas` donde se guarda. */
  columna: string;
  /** Bloque del formulario donde se pinta. Ordena la pantalla sola. */
  grupo: Grupo;
  label: string;
  placeholder?: string;
  /** Tope de caracteres, espejado por el endpoint. `0` en los booleanos. */
  max: number;
  tipo?: 'texto' | 'select' | 'checkbox';
  opciones?: readonly string[];
  numerico?: boolean;
}

export const CAMPOS: Record<CampoId, Campo> = {
  nombre:   { columna: 'nombre', grupo: 'personales',   label: 'Nombre',   placeholder: 'Nombre',   max: 100 },
  apellido: { columna: 'apellido', grupo: 'personales', label: 'Apellido', placeholder: 'Apellido', max: 100 },
  // El portal de Siglo 21 pide tipo y número por separado; `dni` es el número.
  // OJO: las opciones son las usuales del padrón argentino, no una lista
  // copiada del portal. Confirmar contra el portal antes de darlas por buenas.
  tipoDocumento: { columna: 'tipo_documento', grupo: 'personales', label: 'Tipo de documento', max: 40, tipo: 'select', opciones: ['DNI', 'Libreta Cívica', 'Libreta de Enrolamiento', 'Pasaporte'] },
  dni:      { columna: 'dni', grupo: 'personales',      label: 'Número de documento', placeholder: 'Sin puntos', max: 12, numerico: true },
  sexo:     { columna: 'sexo', grupo: 'personales',     label: 'Sexo',     max: 40, tipo: 'select', opciones: ['Femenino', 'Masculino', 'Otro'] },

  fechaNacimiento: { columna: 'fecha_nacimiento', grupo: 'personales', label: 'Fecha de nacimiento', placeholder: 'DD/MM/AAAA', max: 20 },
  // La tabla la llama `localidad_nacimiento`, no `lugar_nacimiento`.
  lugarNacimiento: { columna: 'localidad_nacimiento', grupo: 'personales', label: 'Lugar de nacimiento', placeholder: 'Ciudad y provincia', max: 120 },
  nacionalidad:   { columna: 'nacionalidad', grupo: 'personales',    label: 'Nacionalidad',      placeholder: 'Argentina', max: 80 },
  estadoCivil:    { columna: 'estado_civil', grupo: 'personales',    label: 'Estado civil',      max: 40, tipo: 'select', opciones: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro'] },
  paisResidencia: { columna: 'pais_residencia', grupo: 'personales', label: 'País de residencia', placeholder: 'Argentina', max: 80 },

  // OJO: opciones inventadas, igual que las de tipoDocumento. Confirmar.
  tipoDomicilio: { columna: 'tipo_domicilio', grupo: 'domicilio', label: 'Tipo de domicilio', max: 40, tipo: 'select', opciones: ['Particular', 'Laboral'] },
  // La tabla la llama `direccion`, no `domicilio`.
  domicilio:             { columna: 'direccion', grupo: 'domicilio',              label: 'Calle',     placeholder: 'Calle',  max: 160 },
  domicilioNumero:       { columna: 'direccion_numero', grupo: 'domicilio',       label: 'Número',    placeholder: 'N°',     max: 20, numerico: true },
  domicilioPiso:         { columna: 'direccion_piso', grupo: 'domicilio',         label: 'Piso',      placeholder: 'Piso',   max: 20 },
  domicilioDepartamento: { columna: 'direccion_departamento', grupo: 'domicilio', label: 'Depto.',    placeholder: 'Depto.', max: 20 },
  torre:        { columna: 'torre', grupo: 'domicilio',         label: 'Torre',         placeholder: 'Torre', max: 20 },
  barrio:       { columna: 'barrio', grupo: 'domicilio',        label: 'Barrio',        placeholder: 'Barrio', max: 120 },
  codigoPostal: { columna: 'codigo_postal', grupo: 'domicilio', label: 'Código postal', placeholder: 'Código postal', max: 20 },
  localidad:    { columna: 'localidad', grupo: 'domicilio',     label: 'Localidad',     placeholder: 'Ciudad o localidad', max: 120 },

  nivelEstudios:    { columna: 'nivel_estudios', grupo: 'estudios',    label: 'Nivel de estudios',     placeholder: 'Secundario completo', max: 80 },
  colegio:          { columna: 'colegio', grupo: 'estudios',           label: 'Colegio',               placeholder: 'Nombre del colegio', max: 160 },
  colegioLocalidad: { columna: 'colegio_localidad', grupo: 'estudios', label: 'Localidad del colegio', placeholder: 'Ciudad o localidad', max: 120 },
  medioPago:        { columna: 'medio_pago', grupo: 'estudios',        label: 'Medio de pago',         placeholder: 'Según opción del portal', max: 60 },

  modalidad:     { columna: 'modalidad', grupo: 'consulta',     label: 'Modalidad', max: 40, tipo: 'select' },
  equivalencias: { columna: 'equivalencias', grupo: 'consulta', label: 'Quiero acreditar equivalencias', max: 0, tipo: 'checkbox' },
  email:         { columna: 'email', grupo: 'contacto',         label: 'Email',     placeholder: 'Ejemplo: tu@correo.com', max: 254 },
  telefono:      { columna: 'telefono', grupo: 'contacto',      label: 'Teléfono',  placeholder: 'Ejemplo: 11 1234-5678', max: 30 },
};

export const columnaDe = (id: CampoId): string => CAMPOS[id].columna;

// ── Las casas ──

export type CasaId = 'siglo21' | 'teclab' | 'identidad';
export type Modo = 'contacto' | 'preinscripcion';

export interface Casa {
  nombre: string;
  /** Niveles de `carreras` que pertenecen a esta casa. */
  niveles: string[];
  modalidades: string[];
  contacto: CampoId[];
  preinscripcion: CampoId[];
  /**
   * Los que bloquean el envío, por modo. El contacto va siempre vacío: un
   * formulario de consulta que rebota pierde el lead, y para eso ya está la
   * regla de "mail o teléfono". El legajo sí puede exigir — uno a medias no
   * sirve para preinscribir a nadie.
   */
  obligatorios: { contacto: CampoId[]; preinscripcion: CampoId[] };
}

export const CASAS: Record<CasaId, Casa> = {
  siglo21: {
    nombre: 'Universidad Siglo 21',
    niveles: ['Grado', 'Grado (CCC)', 'Pregrado'],
    modalidades: ['Educación Distribuida Home (Virtual)'],
    contacto: ['modalidad', 'nombre', 'apellido', 'localidad', 'equivalencias', 'email', 'telefono'],
    // La ficha del portal de Siglo 21, en su orden. No pide nivel de estudios,
    // colegio, medio de pago ni equivalencias: eso es de Teclab, no de acá.
    //
    // El portal parte el teléfono en código de país, código de área y móvil.
    // Acá va en un campo solo: partirlo es fricción que nadie espera en un
    // formulario web, y el área sale sola de un número bien escrito.
    preinscripcion: [
      'tipoDocumento', 'dni', 'apellido', 'nombre', 'email', 'fechaNacimiento',
      'nacionalidad', 'paisResidencia', 'sexo', 'estadoCivil', 'lugarNacimiento',
      'tipoDomicilio', 'domicilio', 'domicilioNumero', 'domicilioPiso',
      'domicilioDepartamento', 'torre', 'barrio', 'codigoPostal', 'localidad',
      'telefono',
    ],
    obligatorios: {
      contacto: [],
      // Los que el portal marca Obligatorio. Piso, depto, torre, CP y teléfono
      // quedan afuera a propósito: el portal tampoco los exige.
      preinscripcion: [
        'tipoDocumento', 'dni', 'apellido', 'nombre', 'email', 'fechaNacimiento',
        'nacionalidad', 'paisResidencia', 'sexo', 'estadoCivil', 'lugarNacimiento',
        'tipoDomicilio', 'domicilio', 'domicilioNumero', 'barrio', 'localidad',
      ],
    },
  },
  teclab: {
    nombre: 'Teclab',
    niveles: ['Teclab - Tecnología', 'Teclab - Gestión', 'Teclab - Curso'],
    modalidades: ['100% online'],
    // Teclab no acredita equivalencias.
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
    // Sin la ficha oficial de Teclab a la vista, no se exige nada todavía.
    obligatorios: { contacto: [], preinscripcion: [] },
  },
  identidad: {
    nombre: 'Academia Identidad Argentina',
    niveles: ['Identidad Argentina'],
    modalidades: ['Virtual en vivo (Innova Virtual)'],
    contacto: ['modalidad', 'nombre', 'apellido', 'localidad', 'email', 'telefono'],
    // Las diplomaturas no tienen requisitos de ingreso —ni secundario, ni
    // título previo, ni examen— y cierran con un link de pago, no con un
    // legajo: pedir domicilio y colegio sería fricción sin destino.
    preinscripcion: ['nombre', 'apellido', 'dni', 'localidad', 'email', 'telefono'],
    // La preinscripción de Identidad se carga con estos cinco datos; el resto
    // lo resuelve el link de pago.
    obligatorios: { contacto: [], preinscripcion: ['nombre', 'apellido', 'dni', 'email'] },
  },
};

const CASA_POR_NIVEL = new Map<string, CasaId>(
  (Object.entries(CASAS) as [CasaId, Casa][])
    .flatMap(([id, casa]) => casa.niveles.map(nivel => [nivel, id] as [string, CasaId])),
);

/**
 * La casa a la que pertenece una carrera, o `null` si su nivel está fuera de la
 * oferta (Posgrado, Certificación y demás, que `esCarreraVisible` ya filtra).
 */
export const casaDeCarrera = (carrera: { nivel: string } | null | undefined): CasaId | null =>
  (carrera && CASA_POR_NIVEL.get(carrera.nivel)) || null;

export const camposDe = (casa: CasaId, modo: Modo): CampoId[] => CASAS[casa][modo];

/**
 * Los campos que toda casa pide en ese modo. Es lo que se muestra en la home
 * mientras el lead no eligió carrera: sin carrera no hay casa, y pedir algo que
 * después desaparece se lee como un error del sitio.
 *
 * Se calcula, no se escribe: si una casa deja de pedir un campo, sale solo de
 * acá y no queda una lista paralela envejeciendo.
 */
export function camposComunes(modo: Modo): CampoId[] {
  const listas = (Object.keys(CASAS) as CasaId[]).map(id => camposDe(id, modo));
  return listas[0].filter(campo => listas.every(lista => lista.includes(campo)));
}

/** Los campos que bloquean el envío en esa casa y ese modo. */
export const obligatoriosDe = (casa: CasaId, modo: Modo): CampoId[] =>
  CASAS[casa].obligatorios[modo];

// ── Qué viaja en el envío ──

/**
 * Arma el `payload` de `POST /api/formularios` a partir del estado del
 * formulario, quedándose sólo con lo que la casa elegida pide en ese modo.
 *
 * Los campos que la casa no pide siguen en el estado del componente a
 * propósito: si el lead vuelve a una carrera que sí los pide, los encuentra
 * como los dejó. Lo que no puede pasar es que viajen igual — el caso testigo
 * son las equivalencias tildadas con una licenciatura elegida y después
 * cambiadas por una carrera de Teclab, que no las acredita.
 *
 * Un campo declarado viaja aunque esté vacío: mandar `''` es cómo se guarda
 * que el lead borró un dato.
 */
export function armarPayload(
  casa: CasaId,
  modo: Modo,
  estado: Partial<Record<CampoId, string | boolean>>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { casa, tipoFormulario: modo };
  for (const campo of camposDe(casa, modo)) {
    if (campo in estado) payload[campo] = estado[campo];
  }
  return payload;
}
