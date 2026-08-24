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
