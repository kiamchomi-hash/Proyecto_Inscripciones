// Contratos normalizados para los consumidores de D1: booleanos como boolean
// y columnas JSON ya decodificadas. El esquema SQL vive en cloudflare/migrations/.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface Filas {
  carreras: {
    activa: boolean
    area: string | null
    created_at: string
    descripcion: string | null
    descuento_especial: Json | null
    destacada: boolean
    duracion: string | null
    enfoque: string | null
    id: number
    modalidad: string
    nivel: string
    nombre: string
    nombre_corto: string | null
    nueva: boolean
    orden: number | null
    plan_estudios: string | null
    prefix: string | null
    proximamente: boolean
    seccion_duracion: string | null
    seccion_modalidad: string | null
    slides: Json | null
    titulo: string | null
    updated_at: string
  };
  materias: {
    activa: boolean
    created_at: string
    descripcion: Json
    dias_bloqueados: Json
    en_construccion: boolean
    horarios_bloqueados: Json
    id: string
    imagenes: Json
    label: string
    modo_manana: boolean
    nombre_profesor: string
    orden: number
    slug: string
    telefono_display: string
    texto_seo: Json | null
    updated_at: string
    whatsapp: string
  };
  faq_preguntas: {
    contacto: string
    created_at: string
    descripcion: string | null
    destacada: boolean
    estado: string
    id: number
    modo: string
    nombre_contacto: string | null
    orden: number | null
    respuesta: string | null
    titulo: string
    updated_at: string
  };
}

interface Altas {
  consultas: {
    apellido?: string | null
    barrio?: string | null
    carrera?: string | null
    casa?: string | null
    codigo_postal?: string | null
    colegio?: string | null
    colegio_localidad?: string | null
    created_at?: string | null
    direccion?: string | null
    direccion_departamento?: string | null
    direccion_numero?: string | null
    direccion_piso?: string | null
    dni?: string | null
    email?: string | null
    equivalencias?: boolean | null
    estado_civil?: string | null
    fecha_nacimiento?: string | null
    id?: never
    localidad?: string | null
    localidad_nacimiento?: string | null
    medio_pago?: string | null
    modalidad?: string | null
    nacionalidad?: string | null
    nivel_estudios?: string | null
    nombre?: string | null
    pais_residencia?: string | null
    provincia?: string | null
    sexo?: string | null
    telefono?: string | null
    tipo?: string | null
    tipo_documento?: string | null
    tipo_domicilio?: string | null
    tipo_formulario?: string | null
    torre?: string | null
  };
  suscripciones_newsletter: {
    activo?: boolean
    carrera_id?: number | null
    carrera_nombre?: string | null
    consentimiento_at?: string
    created_at?: string
    email: string
    id?: string
    ultimo_envio_at?: string | null
    updated_at?: string
  };
}

export type Tables<T extends keyof Filas> = Filas[T];
export type TablesInsert<T extends keyof Altas> = Altas[T];
