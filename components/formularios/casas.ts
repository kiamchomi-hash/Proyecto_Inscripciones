import type { TablesInsert } from '@/lib/database.types';

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
// habla con el lead, no se completa en un formulario. La autoinscripción de
// Teclab lo pidió un tiempo y lo dejó el 03/10/2026: el portal del alumno pide
// la tarjeta y decide la financiación por su cuenta.

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
  columna: keyof TablesInsert<'consultas'>;
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

export const columnaDe = (id: CampoId): keyof TablesInsert<'consultas'> => CAMPOS[id].columna;

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
    contacto: ['nombre', 'apellido', 'equivalencias', 'email', 'telefono'],
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
    contacto: ['nombre', 'apellido', 'email', 'telefono'],
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
    contacto: ['nombre', 'apellido', 'email', 'telefono'],
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

// ── Ver precio ──
//
// El modal de Teclab ofrece ver el precio a cambio del mail. El registro
// entra en `consultas` como cualquier lead —así llega el aviso de Telegram— y
// recién después la API lee el precio de una tabla privada
// (`sql/2026-10-02_precios_carrera.sql`). Vive acá y no en un módulo aparte por
// la misma razón que el resto del archivo: los tests corren estos `.ts` con
// Node, que no resuelve imports de valor entre módulos sin extensión.

/** Valor de `tipo_formulario` con el que se guarda el registro. */
export const FORMULARIO_PRECIO = 'precio';

/** Lo que se ve en la línea "Tipo" del aviso de Telegram. */
export const TIPO_PRECIO = 'Ver precio';

/** Los campos que pide, con su columna declarada en `CAMPOS`. */
// Sólo el mail: es lo que se cambia por el precio, y pedir más frenaba a quien
// sólo quería ver cuánto sale. `consultas.nombre` admite null.
export const CAMPOS_PRECIO = ['email'] as const satisfies readonly CampoId[];

/** Las casas que ya publican precio. Siglo 21 e Identidad, todavía no. */
export const CASAS_CON_PRECIO: CasaId[] = ['teclab'];

/** Tabla privada de precios: sin acceso para `anon` ni `authenticated`. */
export const TABLA_PRECIOS = 'precios_privados';

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PayloadPrecio {
  carreraId: number;
  email: string;
  newsletter: boolean;
}

/**
 * Valida el payload de `kind: 'precio'`. Devuelve `null` si no sirve.
 *
 * A diferencia de la consulta, acá el mail es obligatorio: es el dato que se
 * cambia por el precio, y sin él el registro no vale nada. El nombre no se
 * pide; si llega, se ignora.
 */
export function validarPayloadPrecio(payload: Record<string, unknown>): PayloadPrecio | null {
  const carreraId = payload.carreraId;
  const email = typeof payload.email === 'string' ? payload.email.trim().slice(0, CAMPOS.email.max) : '';
  if (typeof carreraId !== 'number' || !Number.isInteger(carreraId) || carreraId < 1) return null;
  if (!EMAIL_VALIDO.test(email)) return null;
  // Opt-in: sólo un `true` explícito suscribe.
  return { carreraId, email, newsletter: payload.newsletter === true };
}

/** Si la carrera puede mostrar precio: activa y de una casa que lo publica. */
export function carreraConPrecio(carrera: { nivel: string; activa: boolean }): boolean {
  const casa = casaDeCarrera(carrera);
  return carrera.activa === true && casa !== null && CASAS_CON_PRECIO.includes(casa);
}

/**
 * La fecha de hoy en Argentina, `AAAA-MM-DD`. La vigencia es un `date` de
 * Postgres: compararla contra el día UTC haría vencer el precio a las 21 h.
 */
export function fechaArgentina(ahora: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(ahora);
}

export interface LineaPrecio {
  concepto: string;
  monto: string;
  descuento: number | null;
}

export interface FilaPrecio {
  conceptos: unknown;
  total: string;
  nota: string | null;
  vigente_hasta: string;
}

export type ResultadoPrecio =
  | { estado: 'vigente'; precio: { conceptos: LineaPrecio[]; total: string; nota: string | null; vigenteHasta: string } }
  | { estado: 'vencido'; vigenteHasta: string }
  | { estado: 'sin-precio' };

/** Las líneas de precio que se pueden mostrar; lo mal formado se descarta. */
function lineasDe(conceptos: unknown): LineaPrecio[] {
  if (!Array.isArray(conceptos)) return [];
  return conceptos.flatMap((linea): LineaPrecio[] => {
    if (linea === null || typeof linea !== 'object') return [];
    const { concepto, monto, descuento } = linea as Record<string, unknown>;
    if (typeof concepto !== 'string' || typeof monto !== 'string') return [];
    return [{ concepto, monto, descuento: typeof descuento === 'number' ? descuento : null }];
  });
}

/**
 * Qué se le devuelve al lead. El precio viaja sólo si está vigente: el último
 * día de la promoción todavía vale. Vencido, la ventana ofrece WhatsApp.
 */
export function resultadoPrecio(fila: FilaPrecio | null, hoy: string): ResultadoPrecio {
  if (!fila) return { estado: 'sin-precio' };
  if (fila.vigente_hasta < hoy) return { estado: 'vencido', vigenteHasta: fila.vigente_hasta };
  return {
    estado: 'vigente',
    precio: {
      conceptos: lineasDe(fila.conceptos),
      total: fila.total,
      nota: fila.nota,
      vigenteHasta: fila.vigente_hasta,
    },
  };
}

// ── Newsletter ──
//
// Los formularios que piden mail suman el checkbox «Quiero recibir novedades
// por mail», tildado de entrada (decisión del 02/10/2026). No es un campo de
// `CAMPOS` a propósito: no se guarda en `consultas` sino en
// `suscripciones_newsletter`, así que `insertConsulta` nunca lo ve. La
// suscripción va con la carrera cuando el formulario tiene una, o general
// (carrera en null, una por mail: `sql/2026-10-02_newsletter_general.sql`).

export const TABLA_NEWSLETTER = 'suscripciones_newsletter';

/** Columnas de la UNIQUE: repetir la suscripción la renueva, no la duplica. */
export const CONFLICTO_NEWSLETTER = 'email,carrera_id';

/**
 * El mail a suscribir, en minúsculas, o `null` si no corresponde: sólo un
 * `newsletter: true` explícito suscribe, y sólo si el dato es un mail válido
 * —en la pregunta privada de la FAQ el contacto puede ser un WhatsApp—.
 */
export function mailParaNewsletter(
  payload: Record<string, unknown>,
  campo: 'email' | 'contacto',
): string | null {
  if (payload.newsletter !== true) return null;
  const valor = payload[campo];
  const email = typeof valor === 'string' ? valor.trim().slice(0, CAMPOS.email.max) : '';
  return EMAIL_VALIDO.test(email) ? email.toLowerCase() : null;
}

/** El `id` de carrera que mandó el formulario, si es un entero positivo. */
export function carreraIdDe(payload: Record<string, unknown>): number | null {
  const id = payload.carreraId;
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null;
}

export function filaNewsletter(
  email: string,
  carrera: { id: number; nombre: string } | null,
  ahora: Date,
): TablesInsert<'suscripciones_newsletter'> {
  return {
    email,
    carrera_id: carrera?.id ?? null,
    carrera_nombre: carrera?.nombre ?? null,
    activo: true,
    consentimiento_at: ahora.toISOString(),
  };
}

// ── Autoinscripción (Teclab) ──
//
// Quien elige gestionar su inscripción manda la preinscripción completa de
// Teclab (`kind: 'autoinscripcion'`), sin medio de pago: lo elige en el portal
// del alumno. Entra en `consultas`
// como cualquier lead —así llega el aviso de Telegram— marcada con su propio
// `tipo_formulario`, que es lo que va a buscar el robot que carga la
// preinscripción en el portal de Teclab. Detalle en
// `docs/formularios-por-casa.md`.

/** Valor de `tipo_formulario` con el que se guarda la autoinscripción. */
export const FORMULARIO_AUTOINSCRIPCION = 'autoinscripcion';

/** Lo que se ve en la línea "Tipo" del aviso de Telegram. */
export const TIPO_AUTOINSCRIPCION = 'Autoinscripción';

/** Las casas que ofrecen autoinscripción. Por ahora sólo Teclab. */
export const CASAS_CON_AUTOINSCRIPCION: CasaId[] = ['teclab'];

export const TELEFONO_VALIDO = /^[\d\s()+-]{8,30}$/;

const esTexto = (valor: unknown): valor is string => typeof valor === 'string';

export interface PayloadAutoinscripcion {
  carreraId: number;
  email: string;
  newsletter: boolean;
}

/**
 * Valida el payload de `kind: 'autoinscripcion'`. Devuelve `null` si no sirve.
 *
 * A diferencia de la consulta, acá no se tolera nada a medias: con estos datos
 * se crea la cuenta del alumno en el portal de Teclab, así que hacen falta
 * todos los obligatorios de su preinscripción, un DNI de verdad (es el usuario
 * y la contraseña) y mail y teléfono válidos.
 */
export function validarPayloadAutoinscripcion(payload: Record<string, unknown>): PayloadAutoinscripcion | null {
  const carreraId = carreraIdDe(payload);
  if (!carreraId || !legajoAutoinscripcionValido(payload)) return null;

  const email = (payload.email as string).trim().slice(0, CAMPOS.email.max);
  // Opt-in: sólo un `true` explícito suscribe.
  return { carreraId, email, newsletter: payload.newsletter === true };
}

/**
 * Si el legajo alcanza para crear la cuenta en el portal de Teclab: todos los
 * obligatorios de su preinscripción, opciones de su lista, un DNI de verdad y
 * mail y teléfono válidos. Lo usa también el enlace de inscripción, que parte
 * de una preinscripción guardada con la validación tolerante de la consulta.
 */
export function legajoAutoinscripcionValido(payload: Record<string, unknown>): boolean {
  for (const id of obligatoriosDe('teclab', 'preinscripcion')) {
    const valor = payload[id];
    if (!esTexto(valor) || !valor.trim()) return false;
    const { opciones } = CAMPOS[id];
    if (opciones && !opciones.includes(valor.trim())) return false;
  }

  const dni = (payload.dni as string).replace(/\D/g, '');
  if (dni.length < 7 || dni.length > 9) return false;

  const email = (payload.email as string).trim().slice(0, CAMPOS.email.max);
  const telefono = (payload.telefono as string).trim();
  return EMAIL_VALIDO.test(email) && TELEFONO_VALIDO.test(telefono);
}

/** Si la carrera admite autoinscripción: la casa sale del `nivel` de la base. */
export function carreraConAutoinscripcion(carrera: { nivel: string }): boolean {
  const casa = casaDeCarrera(carrera);
  return casa !== null && CASAS_CON_AUTOINSCRIPCION.includes(casa);
}

// ── Enlace de inscripción (Teclab) ──
//
// Cada preinscripción de Teclab trae en el aviso de Telegram un enlace para
// reenviarle a la persona: `/inscripcion/<codigo>`. El código lo crea la Edge
// Function `notificar` en `enlaces_inscripcion` (tabla privada,
// `sql/2026-10-03_enlaces_inscripcion.sql`); la URL no lleva ningún dato
// personal. La página muestra el precio vigente y un resumen oculto de los
// datos, y termina en la misma autoinscripción de arriba sin volver a tipear
// nada (`kind: 'enlace'`). Detalle en `docs/formularios-por-casa.md`.

/** Tabla privada de enlaces: sin acceso para `anon` ni `authenticated`. */
export const TABLA_ENLACES = 'enlaces_inscripcion';

/**
 * El formato del código, el mismo que exige el CHECK de la tabla. Sólo letras
 * y números: un `_` suelto rompe el Markdown del aviso de Telegram.
 */
const CODIGO_ENLACE = /^[A-Za-z0-9]{22,64}$/;

export const esCodigoEnlace = (valor: unknown): valor is string =>
  typeof valor === 'string' && CODIGO_ENLACE.test(valor);

export interface FilaEnlace {
  codigo: string;
  consulta_id: number;
  vence_at: string;
  usado_at: string | null;
}

export type EstadoEnlace = 'valido' | 'vencido' | 'usado' | 'inexistente';

/** Usado gana sobre vencido: quien ya se inscribió no tiene que leer «venció». */
export function estadoEnlace(fila: FilaEnlace | null | undefined, ahora: Date): EstadoEnlace {
  if (!fila) return 'inexistente';
  if (fila.usado_at) return 'usado';
  return new Date(fila.vence_at).getTime() > ahora.getTime() ? 'valido' : 'vencido';
}

/**
 * El DNI con sus puntos, dejando ver los tres primeros dígitos y los dos
 * últimos: `30156456` → `30.1••.•56`. Alcanza para que la persona reconozca
 * el suyo sin que el enlace reenviado lo exponga entero.
 */
export function ocultarDni(dni: unknown): string {
  const digitos = typeof dni === 'string' ? dni.replace(/\D/g, '') : '';
  if (!digitos) return '';
  const tapados = [...digitos].map((digito, i) => (i < 3 || i >= digitos.length - 2 ? digito : '•'));
  const grupos: string[] = [];
  for (let fin = tapados.length; fin > 0; fin -= 3) {
    grupos.unshift(tapados.slice(Math.max(0, fin - 3), fin).join(''));
  }
  return grupos.join('.');
}

/** La primera letra y el dominio: `ana@ejemplo.com` → `a••@ejemplo.com`. */
export function ocultarEmail(email: unknown): string {
  const texto = typeof email === 'string' ? email.trim() : '';
  const arroba = texto.indexOf('@');
  if (arroba < 1) return '';
  return `${texto[0]}••${texto.slice(arroba)}`;
}

type FilaConsulta = Record<string, unknown>;

/** Si la consulta es una preinscripción de Teclab, la única que lleva enlace. */
export const consultaConEnlace = (consulta: FilaConsulta | null | undefined): boolean =>
  !!consulta && consulta.casa === 'teclab' && consulta.tipo_formulario === 'preinscripcion';

/**
 * La fila guardada vuelta payload de la preinscripción de Teclab: cada campo
 * sale de su columna declarada en `CAMPOS`. Con esto la autoinscripción por
 * enlace pasa por la misma validación y el mismo armado que la del formulario.
 */
export function payloadDesdeConsulta(consulta: FilaConsulta): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const campo of camposDe('teclab', 'preinscripcion')) {
    const valor = consulta[columnaDe(campo)];
    payload[campo] = typeof valor === 'string' ? valor : '';
  }
  return payload;
}

export interface PayloadEnlace {
  codigo: string;
  newsletter: boolean;
}

/** Valida el payload de `kind: 'enlace'`. Devuelve `null` si no sirve. */
export function validarPayloadEnlace(payload: Record<string, unknown>): PayloadEnlace | null {
  if (!esCodigoEnlace(payload.codigo)) return null;
  // La suscripción ya se ofreció en la preinscripción: sólo un `true` explícito.
  return { codigo: payload.codigo, newsletter: payload.newsletter === true };
}

/** Lo único de la persona que llega al navegador. */
export interface DatosEnlace {
  nombre: string;
  dni: string;
  email: string;
  carrera: string;
}

export interface PropsInscripcionEnlace {
  codigo: string;
  carrera: { nombre: string; url: string };
  precio: ResultadoPrecio;
  datos: DatosEnlace;
  /** Si lo guardado alcanza para crear la cuenta; si no, la página ofrece WhatsApp. */
  completo: boolean;
}

/**
 * Las props del componente de la página. Es el borde entre el servidor, que
 * lee la fila entera con la service role, y el navegador: de acá sale sólo el
 * resumen oculto, nunca el domicilio, el teléfono ni el DNI completo.
 */
export function propsInscripcionEnlace({ codigo, consulta, carrera, filaPrecio, ahora }: {
  codigo: string;
  consulta: FilaConsulta;
  carrera: { nombre: string; url: string };
  filaPrecio: FilaPrecio | null;
  ahora: Date;
}): PropsInscripcionEnlace {
  const texto = (valor: unknown) => (typeof valor === 'string' ? valor.trim() : '');
  const completo = legajoAutoinscripcionValido(payloadDesdeConsulta(consulta));
  return {
    codigo,
    carrera: { nombre: carrera.nombre, url: carrera.url },
    precio: resultadoPrecio(filaPrecio, fechaArgentina(ahora)),
    datos: {
      nombre: `${texto(consulta.nombre)} ${texto(consulta.apellido)}`.trim(),
      dni: ocultarDni(consulta.dni),
      email: ocultarEmail(consulta.email),
      carrera: carrera.nombre,
    },
    completo,
  };
}

// ── Alta del lead en la landing de la sede (Teclab) ──
//
// Teclab asigna el lead a la sede por la landing de HubSpot
// `vinculacion.teclab.edu.ar/expo-bs-as-esposito`. Al guardar una
// autoinscripción, el servidor manda los datos a ese formulario por la API
// pública de HubSpot (sin autenticación ni captcha): la persona nunca entra
// ahí. Detalle en `docs/formularios-por-casa.md`.

const LEAD_SEDE_PORTAL = '5880041';

/** Id del formulario de la landing; viaja también en los dos campos ocultos. */
export const LEAD_SEDE_FORMULARIO = 'a19c1564-e23a-475c-a16a-11aa244c1b9e';

export const LEAD_SEDE_URL =
  `https://api.hsforms.com/submissions/v3/integration/submit/${LEAD_SEDE_PORTAL}/${LEAD_SEDE_FORMULARIO}`;

const LEAD_SEDE_CONTEXTO = {
  pageUri: 'https://vinculacion.teclab.edu.ar/expo-bs-as-esposito',
  pageName: 'EXPO BS AS ESPOSITO',
} as const;

/** Minúsculas, sin acentos y con la puntuación vuelta espacio. */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();

const contiene = (texto: string, frase: string) => ` ${texto} `.includes(` ${frase} `);

// La opción de la landing va tal cual la escribe HubSpot (con sus acentos y
// sin ellos): otro texto rechaza el envío. El orden importa: «Inbound
// Marketing» antes que «Marketing Digital». Cubre los nombres viejos y los
// nuevos de la misma carrera (Cloud Administration / Servicios en la Nube,
// Gestión Agraria / Empresa Agraria, Customer Experience / Experiencia del
// Cliente). Venta Directa no tiene opción: salió de la oferta.
const CARRERAS_HUBSPOT: [frases: string[], opcion: string][] = [
  [['inteligencia artificial'], 'Curso Inteligencia Artificial'],
  [['cloud', 'nube'], 'Administración de servicios en la nube (Cloud Administration)'],
  [['seguridad informatica'], 'Seguridad informática'],
  [['redes'], 'Redes informáticas'],
  [['programacion'], 'Programación'],
  [['data science', 'ciencia de datos'], 'Data Science'],
  [['quality assurance'], 'Quality Assurance'],
  [['inbound'], 'Inbound Marketing'],
  [['marketing digital'], 'Marketing Digital'],
  [['customer experience', 'experiencia del cliente'], 'Customer Experience'],
  [['seguros', 'productor asesor', 'p a s'], 'Seguros'],
  [['relaciones laborales'], 'Relaciones laborales'],
  [['hotelera'], 'Gestion hotelera'],
  [['contable'], 'Gestion contable'],
  [['agraria'], 'Gestion de la empresa agraria'],
  [['eventos'], 'Planificacion y organizacion de eventos'],
  [['periodismo'], 'Periodismo y nuevas tecnologías'],
];

/** La opción de `carrera` de la landing para una carrera nuestra, o `null`. */
export function carreraHubspotDe(nombre: unknown): string | null {
  if (!esTexto(nombre)) return null;
  const texto = normalizar(nombre);
  const fila = CARRERAS_HUBSPOT.find(([frases]) => frases.some(frase => contiene(texto, frase)));
  return fila ? fila[1] : null;
}

const PROVINCIAS_HUBSPOT = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba', 'Corrientes', 'Entre Rios',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquen', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucuman',
];

const PROVINCIA_POR_TEXTO = new Map<string, string>([
  ...PROVINCIAS_HUBSPOT.map(p => [normalizar(p), p] as [string, string]),
  // La landing no separa la Ciudad: va como Buenos Aires.
  ...['caba', 'c a b a', 'capital federal', 'ciudad de buenos aires',
    'ciudad autonoma de buenos aires', 'provincia de buenos aires', 'pba', 'bs as']
    .map(alias => [alias, 'Buenos Aires'] as [string, string]),
]);

/**
 * La opción de `provincia` de la landing para un texto libre, o `null`. Se
 * compara el texto entero, normalizado: una localidad («Villa Lugano») no
 * adivina provincia y el campo se omite.
 */
export function provinciaHubspotDe(texto: unknown): string | null {
  if (!esTexto(texto)) return null;
  return PROVINCIA_POR_TEXTO.get(normalizar(texto)) ?? null;
}

export interface CampoHubspot {
  objectTypeId: '0-1';
  name: string;
  value: string;
}

export interface DatosLeadSede {
  carrera: unknown;
  email: unknown;
  nombre?: unknown;
  apellido?: unknown;
  telefono?: unknown;
  provincia?: unknown;
  localidad?: unknown;
}

/**
 * El teléfono con prefijo internacional. Sin él, el portal de Teclab, que lo
 * copia del lead, toma `11 …` como un número de Estados Unidos y lo rechaza.
 */
function telefonoLeadSede(telefono: unknown): string {
  if (!esTexto(telefono) || !telefono.trim()) return '';
  const texto = telefono.trim();
  if (texto.startsWith('+')) return texto;
  if (/^54(?!\d{8}$)/.test(texto.replace(/\D/g, ''))) return `+${texto}`;
  return `+54 ${texto.replace(/^0/, '')}`;
}

/**
 * Los campos del alta en la landing, o `null` si falta lo que HubSpot exige:
 * un mail válido y una carrera con opción en la lista. La provincia sale del
 * campo `provincia` y, si no está (Teclab no la pide), de la localidad.
 * `cuando_te_recibis_` no se manda.
 */
export function camposLeadSede(datos: DatosLeadSede): CampoHubspot[] | null {
  const email = esTexto(datos.email) ? datos.email.trim().slice(0, CAMPOS.email.max) : '';
  const carrera = carreraHubspotDe(datos.carrera);
  if (!carrera || !EMAIL_VALIDO.test(email)) return null;

  const valores: [string, unknown][] = [
    ['firstname', datos.nombre],
    ['lastname', datos.apellido],
    ['email', email],
    ['phone', telefonoLeadSede(datos.telefono)],
    ['carrera', carrera],
    ['provincia', provinciaHubspotDe(datos.provincia) ?? provinciaHubspotDe(datos.localidad)],
    ['token_landings', LEAD_SEDE_FORMULARIO],
    ['empresas_form', LEAD_SEDE_FORMULARIO],
  ];
  return valores
    .map(([name, valor]) => [name, esTexto(valor) ? valor.trim().slice(0, 160) : ''] as const)
    .filter(([, value]) => value)
    .map(([name, value]) => ({ objectTypeId: '0-1', name, value }));
}

/** URL y cuerpo del envío a la landing, o `null` si no hay campos para mandar. */
export function pedidoLeadSede(datos: DatosLeadSede) {
  const fields = camposLeadSede(datos);
  if (!fields) return null;
  return { url: LEAD_SEDE_URL, body: { fields, context: { ...LEAD_SEDE_CONTEXTO } } };
}

// ── El robot de Teclab ──
//
// Cada autoinscripción de Teclab deja una fila en `robot_autoinscripciones`
// (tabla privada, `sql/2026-10-03_robot_autoinscripciones.sql`) y despacha el
// robot de GitHub Actions con un `repository_dispatch`. El despacho lleva sólo
// el id de esa fila: el robot pide el legajo a `/api/robot/autoinscripciones`
// con `ROBOT_SECRET`, así que ningún dato personal queda en GitHub.

/** Tabla privada de la cola del robot: sin acceso para `anon` ni `authenticated`. */
export const TABLA_ROBOT = 'robot_autoinscripciones';

export type EstadoRobot = 'pendiente' | 'cargada' | 'error';

/** Los que el robot puede volver a pedir: una fila con error se reintenta. */
export const ESTADOS_ROBOT_ABIERTOS: EstadoRobot[] = ['pendiente', 'error'];

/** Tope del motivo que informa el robot. */
export const MAX_DETALLE_ROBOT = 300;

/** Cuántos ids pendientes devuelve el barrido de una vez. */
export const TOPE_PENDIENTES_ROBOT = 20;

/** Un id de la cola: entero positivo, venga como número o como texto. */
export function idRobot(valor: unknown): number | null {
  const numero = typeof valor === 'string' && /^\d{1,15}$/.test(valor) ? Number(valor) : valor;
  return typeof numero === 'number' && Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

/**
 * El pedido a GitHub que despierta al robot, o `null` si falta el repo o el
 * token (la fila queda pendiente y la levanta el barrido). El cuerpo lleva
 * sólo el id de la cola, nunca datos de la persona.
 */
export function despachoRobot(repo: string | undefined, token: string | undefined, id: number) {
  if (!repo || !token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return {
    url: `https://api.github.com/repos/${repo}/dispatches`,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'autoinscripcion', client_payload: { id } }),
    },
  };
}

export interface ResultadoRobot {
  id: number;
  estado: 'cargada' | 'error';
  detalle: string;
}

/** Lo que informa el robot al terminar, o `null` si no tiene forma. */
export function validarResultadoRobot(cuerpo: unknown): ResultadoRobot | null {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) return null;
  const { id, estado, detalle } = cuerpo as Record<string, unknown>;
  const numero = idRobot(id);
  if (!numero || (estado !== 'cargada' && estado !== 'error')) return null;
  const texto = typeof detalle === 'string' ? detalle.trim().slice(0, MAX_DETALLE_ROBOT) : '';
  return { id: numero, estado, detalle: texto };
}

/**
 * El aviso de Telegram cuando el robot no pudo cargar una autoinscripción:
 * lo justo para cargarla a mano. Texto plano, sin `parse_mode`: un `_` en un
 * mail o en el motivo no rompe nada. Va al chat privado, igual que los avisos
 * de cada lead.
 */
export function avisoErrorRobot(
  fila: { id: number; intentos: number },
  consulta: FilaConsulta | null,
  detalle: string,
): string {
  const dato = (campo: CampoId) => {
    const valor = consulta?.[columnaDe(campo)];
    return typeof valor === 'string' && valor.trim() ? valor.trim() : '—';
  };
  const carrera = typeof consulta?.carrera === 'string' ? consulta.carrera : '—';
  return [
    `Robot de Teclab: no pudo cargar una autoinscripción (intento ${fila.intentos}).`,
    'Cargarla a mano en el Portal Administrativo.',
    '',
    `Nombre: ${dato('nombre')} ${dato('apellido')}`,
    `DNI: ${dato('dni')}`,
    `Email: ${dato('email')}`,
    `Teléfono: ${dato('telefono')}`,
    `Carrera: ${carrera}`,
    `Motivo: ${detalle || 'sin detalle'}`,
    `Fila del robot: ${fila.id}`,
  ].join('\n');
}
