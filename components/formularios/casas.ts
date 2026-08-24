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
//
// Dos campos que estuvieron y se fueron, con sus columnas todavía en la tabla:
// `modalidad`, porque toda la oferta de las tres casas es virtual y preguntarla
// era una fila con una sola respuesta posible; y `medio_pago`, porque eso se
// habla con el lead, no se completa en un formulario.

/** Los bloques del formulario, en el orden en que se pintan. */
export const GRUPOS = ['consulta', 'personales', 'domicilio', 'estudios', 'contacto'] as const;
export type Grupo = (typeof GRUPOS)[number];

export type CampoId =
  | 'nombre' | 'apellido' | 'tipoDocumento' | 'dni' | 'sexo'
  | 'fechaNacimiento' | 'lugarNacimiento' | 'nacionalidad' | 'estadoCivil'
  | 'paisResidencia' | 'tipoDomicilio' | 'domicilio' | 'domicilioNumero'
  | 'domicilioPiso' | 'domicilioDepartamento' | 'torre' | 'barrio'
  | 'codigoPostal' | 'provincia' | 'localidad'
  | 'nivelEstudios' | 'colegio' | 'colegioLocalidad'
  | 'equivalencias' | 'email' | 'telefono';

export interface Campo {
  /** Columna de `consultas` donde se guarda. */
  columna: string;
  /** Bloque del formulario donde se pinta. Ordena la pantalla sola. */
  grupo: Grupo;
  /**
   * Cuánto ocupa en la grilla de seis de su columna. Sin esto todos los campos
   * miden lo mismo y "Piso" queda tan ancho como "Lugar de nacimiento".
   * Por defecto `medio` (media fila).
   */
  ancho?: 'completo' | 'medio' | 'tercio';
  label: string;
  placeholder?: string;
  /** Tope de caracteres, espejado por el endpoint. `0` en los booleanos. */
  max: number;
  /**
   * Opcional por lo que es el dato: un domicilio tiene piso o no lo tiene. Son
   * los únicos que no bloquean el envío de una preinscripción, donde todo lo
   * demás es obligatorio.
   */
  siempreOpcional?: boolean;
  tipo?: 'texto' | 'select' | 'checkbox' | 'fecha';
  opciones?: readonly string[];
  numerico?: boolean;
}

/**
 * Argentina primero porque es la respuesta de casi todos; después el resto en
 * orden alfabético. "Otra" al final: es preferible a que alguien no encuentre
 * la suya y abandone el formulario.
 */
const NACIONALIDADES = [
  'Argentina',
  'Alemana', 'Boliviana', 'Brasileña', 'Canadiense', 'Chilena', 'China',
  'Colombiana', 'Coreana', 'Costarricense', 'Cubana', 'Dominicana',
  'Ecuatoriana', 'Española', 'Estadounidense', 'Filipina', 'Francesa',
  'Guatemalteca', 'Haitiana', 'Hondureña', 'India', 'Inglesa', 'Israelí',
  'Italiana', 'Japonesa', 'Libanesa', 'Mexicana', 'Nicaragüense', 'Panameña',
  'Paraguaya', 'Peruana', 'Polaca', 'Portuguesa', 'Rusa', 'Salvadoreña',
  'Senegalesa', 'Siria', 'Sudafricana', 'Ucraniana', 'Uruguaya', 'Venezolana',
  'Otra',
] as const;

export const CAMPOS: Record<CampoId, Campo> = {
  nombre:   { columna: 'nombre', grupo: 'personales',   label: 'Nombre',   placeholder: 'Nombre',   max: 100 },
  apellido: { columna: 'apellido', grupo: 'personales', label: 'Apellido', placeholder: 'Apellido', max: 100 },
  // El portal de Siglo 21 pide tipo y número por separado; `dni` es el número.
  // OJO: las opciones son las usuales del padrón argentino, no una lista
  // copiada del portal. Confirmar contra el portal antes de darlas por buenas.
  tipoDocumento: { columna: 'tipo_documento', grupo: 'personales', label: 'Tipo de documento', max: 40, tipo: 'select', opciones: ['DNI', 'Libreta Cívica', 'Libreta de Enrolamiento', 'Pasaporte'] },
  dni:      { columna: 'dni', grupo: 'personales',      label: 'Número de documento', placeholder: 'Sin puntos', max: 12, numerico: true },
  sexo:     { columna: 'sexo', grupo: 'personales',     label: 'Sexo',     max: 40, tipo: 'select', opciones: ['Femenino', 'Masculino', 'Otro'] },

  // Va como fecha nativa: el selector del sistema evita el DD/MM/AAAA mal
  // tipeado, y su valor es `AAAA-MM-DD` en texto. Nunca se construye un `Date`
  // con eso — `new Date('1990-04-12')` se parsea como UTC y en Argentina
  // devuelve el día anterior.
  fechaNacimiento: { columna: 'fecha_nacimiento', grupo: 'personales', label: 'Fecha de nacimiento', max: 20, tipo: 'fecha' },
  // La tabla la llama `localidad_nacimiento`, no `lugar_nacimiento`.
  lugarNacimiento: { columna: 'localidad_nacimiento', grupo: 'personales', label: 'Lugar de nacimiento', placeholder: 'Ciudad y provincia', max: 120 },
  // OJO: la lista cubre los orígenes reales de la zona y las corrientes
  // migratorias del país, pero no está copiada del portal de Siglo 21.
  // Confirmar contra el portal antes de darla por buena.
  nacionalidad: { columna: 'nacionalidad', grupo: 'personales', label: 'Nacionalidad', max: 80, tipo: 'select', opciones: NACIONALIDADES },
  estadoCivil:    { columna: 'estado_civil', grupo: 'personales',    label: 'Estado civil',      max: 40, tipo: 'select', opciones: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro'] },
  paisResidencia: { columna: 'pais_residencia', grupo: 'personales', label: 'País de residencia', placeholder: 'Argentina', max: 80 },

  // OJO: opciones inventadas, igual que las de tipoDocumento. Confirmar.
  tipoDomicilio: { columna: 'tipo_domicilio', grupo: 'domicilio', label: 'Tipo de domicilio', max: 40, tipo: 'select', opciones: ['Particular', 'Laboral'] },
  // La tabla la llama `direccion`, no `domicilio`.
  domicilio:             { columna: 'direccion', grupo: 'domicilio',              label: 'Calle',     placeholder: 'Calle',  max: 160 },
  domicilioNumero:       { columna: 'direccion_numero', grupo: 'domicilio', ancho: 'tercio',       label: 'Número',    placeholder: 'N°',     max: 20, numerico: true },
  domicilioPiso:         { columna: 'direccion_piso', grupo: 'domicilio', siempreOpcional: true, ancho: 'tercio',         label: 'Piso',      placeholder: 'Piso',   max: 20 },
  domicilioDepartamento: { columna: 'direccion_departamento', grupo: 'domicilio', siempreOpcional: true, ancho: 'tercio', label: 'Depto.',    placeholder: 'Depto.', max: 20 },
  torre:        { columna: 'torre', grupo: 'domicilio', siempreOpcional: true, ancho: 'tercio',         label: 'Torre',         placeholder: 'Torre', max: 20 },
  barrio:       { columna: 'barrio', grupo: 'domicilio', ancho: 'tercio',        label: 'Barrio',        placeholder: 'Barrio', max: 120 },
  codigoPostal: { columna: 'codigo_postal', grupo: 'domicilio', ancho: 'tercio', label: 'Código postal', placeholder: 'Código postal', max: 20 },
  provincia:    { columna: 'provincia', grupo: 'domicilio', label: 'Provincia', placeholder: 'Provincia', max: 80 },
  localidad:    { columna: 'localidad', grupo: 'domicilio', ancho: 'completo',     label: 'Localidad',     placeholder: 'Ciudad o localidad', max: 120 },

  nivelEstudios:    { columna: 'nivel_estudios', grupo: 'estudios',    label: 'Nivel de estudios',     placeholder: 'Secundario completo', max: 80 },
  colegio:          { columna: 'colegio', grupo: 'estudios',           label: 'Colegio',               placeholder: 'Nombre del colegio', max: 160 },
  colegioLocalidad: { columna: 'colegio_localidad', grupo: 'estudios', label: 'Localidad del colegio', placeholder: 'Ciudad o localidad', max: 120 },

  equivalencias: { columna: 'equivalencias', grupo: 'consulta', ancho: 'completo', label: 'Quiero acreditar equivalencias', max: 0, tipo: 'checkbox' },
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
  contacto: CampoId[];
  preinscripcion: CampoId[];
}

export const CASAS: Record<CasaId, Casa> = {
  siglo21: {
    nombre: 'Universidad Siglo 21',
    niveles: ['Grado', 'Grado (CCC)', 'Pregrado'],
    contacto: ['nombre', 'apellido', 'localidad', 'equivalencias', 'email', 'telefono'],
    // La ficha del portal de Siglo 21, en su orden. No pide nivel de estudios
    // ni colegio: eso es de Teclab, no de acá.
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
  },
  teclab: {
    nombre: 'Teclab',
    niveles: ['Teclab - Tecnología', 'Teclab - Gestión', 'Teclab - Curso'],
    // Teclab no acredita equivalencias.
    contacto: ['nombre', 'apellido', 'localidad', 'email', 'telefono'],
    preinscripcion: [
      'nombre', 'apellido', 'dni', 'sexo', 'fechaNacimiento', 'lugarNacimiento',
      'nacionalidad', 'estadoCivil',
      'domicilio', 'domicilioNumero', 'domicilioPiso', 'domicilioDepartamento',
      'codigoPostal', 'localidad',
      'nivelEstudios', 'colegio', 'colegioLocalidad',
      'email', 'telefono',
    ],
  },
  identidad: {
    nombre: 'Academia Identidad Argentina',
    niveles: ['Identidad Argentina'],
    contacto: ['nombre', 'apellido', 'localidad', 'email', 'telefono'],
    // Las diplomaturas no tienen requisitos de ingreso —ni secundario, ni
    // título previo, ni examen—, así que el legajo es corto: alcanza con saber
    // quién es y dónde vive.
    preinscripcion: [
      'email', 'nombre', 'apellido', 'telefono', 'dni', 'nacionalidad',
      'provincia', 'localidad', 'domicilio',
    ],
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
 * Por eso el checkbox de equivalencias no aparece hasta que hay una carrera de
 * Siglo 21 elegida: es la única casa que las acredita, y ofrecerlas "por las
 * dudas" promete algo que Teclab e Identidad no pueden cumplir.
 *
 * Se calcula, no se escribe: si una casa deja de pedir un campo, sale solo de
 * acá y no queda una lista paralela envejeciendo.
 */
export function camposComunes(modo: Modo): CampoId[] {
  const listas = (Object.keys(CASAS) as CasaId[]).map(id => camposDe(id, modo));
  return listas[0].filter(campo => listas.every(lista => lista.includes(campo)));
}

/**
 * Todos los campos que ese modo puede llegar a mostrar en alguna casa.
 *
 * El formulario de contacto los pinta siempre: los que la casa elegida no pide
 * quedan ocultos pero ocupando su lugar, así elegir una carrera no lo agranda y
 * lo achica. Entre las tres casas el contacto sólo difiere en el checkbox de
 * equivalencias, así que lo reservado es una fila y no se nota.
 *
 * Lo oculto no viaja igual: de eso se ocupa `armarPayload`.
 */
export function camposPosibles(modo: Modo): CampoId[] {
  const vistos = new Set<CampoId>();
  return (Object.keys(CASAS) as CasaId[])
    .flatMap(id => camposDe(id, modo))
    .filter(campo => !vistos.has(campo) && vistos.add(campo));
}

/**
 * Los campos que bloquean el envío.
 *
 * En **preinscripción son todos**, menos los que son opcionales por lo que son
 * (piso, depto, torre). Es un legajo: si el lead no quiere darlos, lo que le
 * corresponde es el formulario de contacto, no una preinscripción a medias que
 * después hay que completar a mano.
 *
 * En **contacto no bloquea ninguno**: una consulta que rebota es un lead
 * perdido, y para eso alcanza con la regla de mail o teléfono.
 *
 * Se deduce, no se escribe casa por casa: así una casa nueva —o una que todavía
 * no tiene su ficha oficial cargada, como Teclab— no queda sin exigir nada.
 */
export const obligatoriosDe = (casa: CasaId, modo: Modo): CampoId[] =>
  modo === 'contacto' ? [] : camposDe(casa, modo).filter(id => !CAMPOS[id].siempreOpcional);

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
