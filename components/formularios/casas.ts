import type { TablesInsert } from '@/lib/tipos-datos';

// Qué pide cada casa en cada formulario, y dónde se guarda cada dato.
//
// Este archivo es la fuente de verdad de los formularios: lo leen el componente
// (para pintar los campos) y `app/api/formularios/route.ts` (para armar la fila
// que va a `consultas`). Que la columna de D1 viva acá, al lado del campo,
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

type InsertConsulta = TablesInsert<'consultas'>;
type ColumnasDeTipo<T> = {
  [K in keyof InsertConsulta]-?: [NonNullable<InsertConsulta[K]>] extends [never]
    ? never
    : NonNullable<InsertConsulta[K]> extends T ? K : never;
}[keyof InsertConsulta];

interface CampoBase {
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
  opciones?: readonly string[];
  /** Etiquetas visibles distintas del valor histórico que se guarda. */
  etiquetasOpciones?: Readonly<Record<string, string>>;
  numerico?: boolean;
  /**
   * Token de `autocomplete` para que el navegador llene el campo con lo que ya
   * sabe. Sólo donde el dato que guarda coincide con el del token.
   */
  autocompletar?: string;
}

/** Tipo de control y columna compatible; excluye el id generado (never). */
export type Campo = CampoBase & (
  | { tipo: 'checkbox'; columna: ColumnasDeTipo<boolean> }
  | { tipo?: 'texto' | 'select' | 'fecha'; columna: ColumnasDeTipo<string> }
);

/**
 * Argentina primero por uso local. Después, población residente nacida en otro
 * país (stock, no llegadas recientes): INDEC, Censo 2022, migraciones.
 * https://biblioteca.indec.gob.ar/bases/minde/1c2022_7.pdf
 * Desde Costa Rica, orden alfabético por país: sin cifras individuales verificadas.
 */
const NACIONALIDADES = [
  'Argentina', 'Paraguaya', 'Boliviana', 'Venezolana', 'Peruana', 'Chilena',
  'Uruguaya', 'Brasileña', 'Española', 'Colombiana', 'Cubana',
  'Costarricense', 'Ecuatoriana', 'Salvadoreña', 'Guatemalteca',
  'Hondureña', 'Mexicana', 'Nicaragüense', 'Panameña', 'Dominicana', 'Otra',
] as const;

// La etiqueta cambia, no el valor: los legajos anteriores siguen siendo válidos.
const PAISES_NACIONALIDAD: Readonly<Record<string, string>> = {
  Argentina: 'Argentina', Paraguaya: 'Paraguay', Boliviana: 'Bolivia',
  Venezolana: 'Venezuela', Peruana: 'Perú', Chilena: 'Chile', Uruguaya: 'Uruguay',
  Brasileña: 'Brasil', Española: 'España', Colombiana: 'Colombia', Cubana: 'Cuba',
  Costarricense: 'Costa Rica', Ecuatoriana: 'Ecuador', Salvadoreña: 'El Salvador',
  Guatemalteca: 'Guatemala', Hondureña: 'Honduras',
  Mexicana: 'México', Nicaragüense: 'Nicaragua', Panameña: 'Panamá',
  Dominicana: 'República Dominicana', Otra: 'Otro país',
};

const CAMPOS_DECLARADOS = {
  nombre:   { columna: 'nombre', grupo: 'personales',   label: 'Nombre',   placeholder: 'Nombre',   max: 100, autocompletar: 'given-name' },
  apellido: { columna: 'apellido', grupo: 'personales', label: 'Apellido', placeholder: 'Apellido', max: 100, autocompletar: 'family-name' },
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
  nacionalidad: { columna: 'nacionalidad', grupo: 'personales', label: 'Nacionalidad', max: 80, tipo: 'select', opciones: NACIONALIDADES, etiquetasOpciones: PAISES_NACIONALIDAD },
  estadoCivil:    { columna: 'estado_civil', grupo: 'personales',    label: 'Estado civil',      max: 40, tipo: 'select', opciones: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro'] },
  paisResidencia: { columna: 'pais_residencia', grupo: 'personales', label: 'País de residencia', placeholder: 'Argentina', max: 80, autocompletar: 'country-name' },

  // OJO: opciones inventadas, igual que las de tipoDocumento. Confirmar.
  tipoDomicilio: { columna: 'tipo_domicilio', grupo: 'domicilio', label: 'Tipo de domicilio', max: 40, tipo: 'select', opciones: ['Particular', 'Laboral'] },
  // La tabla la llama `direccion`, no `domicilio`.
  domicilio:             { columna: 'direccion', grupo: 'domicilio',              label: 'Calle',     placeholder: 'Calle',  max: 160 },
  domicilioNumero:       { columna: 'direccion_numero', grupo: 'domicilio', ancho: 'tercio',       label: 'Número',    placeholder: 'N°',     max: 20, numerico: true },
  domicilioPiso:         { columna: 'direccion_piso', grupo: 'domicilio', siempreOpcional: true, ancho: 'tercio',         label: 'Piso',      placeholder: 'Piso',   max: 20 },
  domicilioDepartamento: { columna: 'direccion_departamento', grupo: 'domicilio', siempreOpcional: true, ancho: 'tercio', label: 'Depto.',    placeholder: 'Depto.', max: 20 },
  torre:        { columna: 'torre', grupo: 'domicilio', siempreOpcional: true, ancho: 'tercio',         label: 'Torre',         placeholder: 'Torre', max: 20 },
  barrio:       { columna: 'barrio', grupo: 'domicilio', ancho: 'tercio',        label: 'Barrio',        placeholder: 'Barrio', max: 120 },
  codigoPostal: { columna: 'codigo_postal', grupo: 'domicilio', ancho: 'tercio', label: 'Código postal', placeholder: 'Código postal', max: 20, autocompletar: 'postal-code' },
  provincia:    { columna: 'provincia', grupo: 'domicilio', label: 'Provincia', placeholder: 'Provincia', max: 80, autocompletar: 'address-level1' },
  localidad:    { columna: 'localidad', grupo: 'domicilio', ancho: 'completo',     label: 'Localidad',     placeholder: 'Ciudad o localidad', max: 120, autocompletar: 'address-level2' },

  nivelEstudios:    { columna: 'nivel_estudios', grupo: 'estudios',    label: 'Nivel de estudios',     placeholder: 'Secundario completo', max: 80 },
  colegio:          { columna: 'colegio', grupo: 'estudios',           label: 'Colegio',               placeholder: 'Nombre del colegio', max: 160 },
  colegioLocalidad: { columna: 'colegio_localidad', grupo: 'estudios', label: 'Localidad del colegio', placeholder: 'Ciudad o localidad', max: 120 },

  equivalencias: { columna: 'equivalencias', grupo: 'consulta', ancho: 'completo', label: 'Quiero acreditar equivalencias', max: 0, tipo: 'checkbox' },
  email:         { columna: 'email', grupo: 'contacto',         label: 'Email',     placeholder: 'Ejemplo: tu@correo.com', max: 254, autocompletar: 'email' },
  telefono:      { columna: 'telefono', grupo: 'contacto',      label: 'Teléfono',  placeholder: 'Ejemplo: 11 1234-5678', max: 30, autocompletar: 'tel' },
} satisfies Record<CampoId, Campo>;

// Conserva la columna literal por id, pero expone los metadatos opcionales del
// contrato a todos los consumidores. No copia ni transforma la declaración.
export const CAMPOS: {
  [K in CampoId]: Campo & { columna: (typeof CAMPOS_DECLARADOS)[K]['columna'] }
} = CAMPOS_DECLARADOS;

export function columnaDe<K extends CampoId>(id: K): (typeof CAMPOS)[K]['columna'];
export function columnaDe<C extends Campo>(campo: C): C['columna'];
export function columnaDe(campo: CampoId | Campo): Campo['columna'] {
  return typeof campo === 'string' ? CAMPOS[campo].columna : campo.columna;
}

// ── Las casas ──

export type CasaId = 'siglo21' | 'teclab' | 'identidad';
export type Modo = 'contacto' | 'preinscripcion';

export interface Casa {
  nombre: string;
  /** Niveles de `carreras` que pertenecen a esta casa. */
  niveles: string[];
  contacto: CampoId[];
  preinscripcion: CampoId[];
  /**
   * Campos que la casa pide en la preinscripción pero su portal no exige. Se
   * muestran igual y no bloquean el envío.
   */
  opcionales?: CampoId[];
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
    // El portal administrativo crea la preinscripción sin código postal
    // (relevado el 19/10/2026 con «Crear» sobre el formulario vacío).
    opcionales: ['codigoPostal'],
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
 * (piso, depto, torre) y los que el portal de la casa no exige (`opcionales`). Es un legajo: si el lead no quiere darlos, lo que le
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
  modo === 'contacto'
    ? []
    : camposDe(casa, modo).filter(id => !CAMPOS[id].siempreOpcional && !CASAS[casa].opcionales?.includes(id));

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
// de D1. Vive acá y no en un módulo aparte por
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

/** Las casas que permiten consultar precios; Identidad todavía no. */
export const CASAS_CON_PRECIO: CasaId[] = ['teclab', 'siglo21'];

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

/**
 * Si la carrera puede mostrar precio: activa, ya abierta y de una casa que lo
 * publica. Una anunciada (`proximamente`) todavía no tiene precio en la casa.
 * `proximamente` es opcional sólo para el newsletter, que no lo lee; el
 * endpoint de formularios lo trae siempre de la base.
 */
export function carreraConPrecio(carrera: { nivel: string; activa: boolean; proximamente?: boolean }): boolean {
  const casa = casaDeCarrera(carrera);
  return carrera.activa === true && carrera.proximamente !== true && casa !== null && CASAS_CON_PRECIO.includes(casa);
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

/** Aviso puntual confirmado para esta actualización, no una frecuencia diaria. */
export function avisoActualizacionPrecio(ahora: Date): string | null {
  return ahora.getTime() < Date.parse('2026-10-05T11:00:00Z')
    ? 'Actualización prevista: 5 de octubre, alrededor de las 8 h.'
    : null;
}

export type ResultadoPrecio =
  | { estado: 'vigente'; precio: { conceptos: LineaPrecio[]; total: string; nota: string | null; vigenteHasta: string } }
  | { estado: 'vencido'; vigenteHasta: string; precio: Extract<ResultadoPrecio, { estado: 'vigente' }>['precio'] }
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
 * Qué se le devuelve al lead. El último día de la promoción todavía vale.
 * Vencido, el precio viaja como referencia, sin convertirlo en oferta vigente.
 */
export function resultadoPrecio(fila: FilaPrecio | null, hoy: string): ResultadoPrecio {
  if (!fila) return { estado: 'sin-precio' };
  const precio = {
    conceptos: lineasDe(fila.conceptos),
    total: fila.total,
    nota: fila.nota,
    vigenteHasta: fila.vigente_hasta,
  };
  return fila.vigente_hasta < hoy
    ? { estado: 'vencido', vigenteHasta: fila.vigente_hasta, precio }
    : { estado: 'vigente', precio };
}

// ── Newsletter ──
//
// Los formularios que piden mail suman el checkbox «Quiero recibir novedades
// por mail», tildado de entrada (decisión del 02/10/2026). No es un campo de
// `CAMPOS` a propósito: no se guarda en `consultas` sino en
// `suscripciones_newsletter`, así que `insertConsulta` nunca lo ve. La
// suscripción va con la carrera cuando el formulario tiene una, o general
// (carrera en null, una por mail).

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

export const TELEFONO_VALIDO = /^[\d\s()+-]{8,30}$/;

const esTexto = (valor: unknown): valor is string => typeof valor === 'string';

// ── Alta del lead en la landing de la sede (Teclab) ──
//
// Teclab asigna el lead a la sede por la landing de HubSpot
// `vinculacion.teclab.edu.ar/expo-bs-as-esposito`. El servidor manda los datos
// a ese formulario por la API pública de HubSpot (sin autenticación ni captcha):
// la persona nunca entra ahí. Detalle en `docs/formularios-por-casa.md`.
//
// Desde la baja de la autoinscripción (27/10/2026) ningún alta genera el efecto
// `lead-sede`: el contrato y su consumidor quedan, y el envío sólo ocurre si
// existe una fila en el outbox.

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
