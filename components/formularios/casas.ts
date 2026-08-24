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

export type CampoId =
  | 'nombre' | 'apellido' | 'dni' | 'sexo'
  | 'fechaNacimiento' | 'lugarNacimiento' | 'nacionalidad' | 'estadoCivil'
  | 'paisResidencia' | 'domicilio' | 'domicilioNumero' | 'domicilioPiso'
  | 'domicilioDepartamento' | 'barrio' | 'codigoPostal' | 'localidad'
  | 'nivelEstudios' | 'colegio' | 'colegioLocalidad' | 'medioPago'
  | 'modalidad' | 'equivalencias' | 'email' | 'telefono';

export interface Campo {
  /** Columna de `consultas` donde se guarda. */
  columna: string;
  label: string;
  placeholder?: string;
  /** Tope de caracteres, espejado por el endpoint. `0` en los booleanos. */
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
  nacionalidad:   { columna: 'nacionalidad',    label: 'Nacionalidad',      placeholder: 'Argentina', max: 80 },
  estadoCivil:    { columna: 'estado_civil',    label: 'Estado civil',      max: 40, tipo: 'select', opciones: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro'] },
  paisResidencia: { columna: 'pais_residencia', label: 'País de residencia', placeholder: 'Argentina', max: 80 },

  // La tabla la llama `direccion`, no `domicilio`.
  domicilio:             { columna: 'direccion',              label: 'Domicilio', placeholder: 'Calle',  max: 160 },
  domicilioNumero:       { columna: 'direccion_numero',       label: 'Número',    placeholder: 'N°',     max: 20, numerico: true },
  domicilioPiso:         { columna: 'direccion_piso',         label: 'Piso',      placeholder: 'Piso',   max: 20 },
  domicilioDepartamento: { columna: 'direccion_departamento', label: 'Depto.',    placeholder: 'Depto.', max: 20 },
  barrio:       { columna: 'barrio',        label: 'Barrio',        placeholder: 'Barrio', max: 120 },
  codigoPostal: { columna: 'codigo_postal', label: 'Código postal', placeholder: 'Código postal', max: 20 },
  localidad:    { columna: 'localidad',     label: 'Localidad',     placeholder: 'Ciudad o localidad', max: 120 },

  nivelEstudios:    { columna: 'nivel_estudios',    label: 'Nivel de estudios',     placeholder: 'Secundario completo', max: 80 },
  colegio:          { columna: 'colegio',           label: 'Colegio',               placeholder: 'Nombre del colegio', max: 160 },
  colegioLocalidad: { columna: 'colegio_localidad', label: 'Localidad del colegio', placeholder: 'Ciudad o localidad', max: 120 },
  medioPago:        { columna: 'medio_pago',        label: 'Medio de pago',         placeholder: 'Según opción del portal', max: 60 },

  modalidad:     { columna: 'modalidad',     label: 'Modalidad', max: 40, tipo: 'select' },
  equivalencias: { columna: 'equivalencias', label: 'Quiero acreditar equivalencias', max: 0, tipo: 'checkbox' },
  email:         { columna: 'email',         label: 'Email',     placeholder: 'Ejemplo: tu@correo.com', max: 254 },
  telefono:      { columna: 'telefono',      label: 'Teléfono',  placeholder: 'Ejemplo: 11 1234-5678', max: 30 },
};

export const columnaDe = (id: CampoId): string => CAMPOS[id].columna;

// ── Las casas ──

export type CasaId = 'siglo21' | 'teclab' | 'identidad';
export type Modo = 'contacto' | 'preinscripcion';

// Los que toda casa pide. En la home son los únicos que se muestran antes de
// que el lead elija carrera, y los que se conservan cuando cambia de casa.
export const COMUNES: CampoId[] = ['nombre', 'apellido', 'dni', 'email', 'telefono', 'localidad'];

export interface Casa {
  nombre: string;
  /** Niveles de `carreras` que pertenecen a esta casa. */
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
    // PROVISORIO: el juego de Teclab más los tres que suma el legajo de Siglo
    // 21 (país de residencia, barrio y equivalencias). Falta la lista real.
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
