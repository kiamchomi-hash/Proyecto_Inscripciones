// Generado desde el esquema público real. Regeneración: docs/tipos-supabase.md.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Permite instanciar createClient con las opciones correctas
  // en lugar de createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      career_clicks: {
        Row: {
          carrera: string
          clicks: number
          fecha: string
          origen: string
        }
        Insert: {
          carrera: string
          clicks?: number
          fecha?: string
          origen?: string
        }
        Update: {
          carrera?: string
          clicks?: number
          fecha?: string
          origen?: string
        }
        Relationships: []
      }
      carreras: {
        Row: {
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
        }
        Insert: {
          activa?: boolean
          area?: string | null
          created_at?: string
          descripcion?: string | null
          descuento_especial?: Json | null
          destacada?: boolean
          duracion?: string | null
          enfoque?: string | null
          id?: number
          modalidad?: string
          nivel: string
          nombre: string
          nombre_corto?: string | null
          nueva?: boolean
          orden?: number | null
          plan_estudios?: string | null
          prefix?: string | null
          proximamente?: boolean
          seccion_duracion?: string | null
          seccion_modalidad?: string | null
          slides?: Json | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean
          area?: string | null
          created_at?: string
          descripcion?: string | null
          descuento_especial?: Json | null
          destacada?: boolean
          duracion?: string | null
          enfoque?: string | null
          id?: number
          modalidad?: string
          nivel?: string
          nombre?: string
          nombre_corto?: string | null
          nueva?: boolean
          orden?: number | null
          plan_estudios?: string | null
          prefix?: string | null
          proximamente?: boolean
          seccion_duracion?: string | null
          seccion_modalidad?: string | null
          slides?: Json | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consultas: {
        Row: {
          apellido: string | null
          barrio: string | null
          carrera: string | null
          casa: string | null
          codigo_postal: string | null
          colegio: string | null
          colegio_localidad: string | null
          created_at: string | null
          direccion: string | null
          direccion_departamento: string | null
          direccion_numero: string | null
          direccion_piso: string | null
          dni: string | null
          email: string | null
          equivalencias: boolean | null
          estado_civil: string | null
          fecha_nacimiento: string | null
          id: number
          localidad: string | null
          localidad_nacimiento: string | null
          medio_pago: string | null
          modalidad: string | null
          nacionalidad: string | null
          nivel_estudios: string | null
          nombre: string | null
          pais_residencia: string | null
          provincia: string | null
          sexo: string | null
          telefono: string | null
          tipo: string | null
          tipo_documento: string | null
          tipo_domicilio: string | null
          tipo_formulario: string | null
          torre: string | null
        }
        Insert: {
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
        }
        Update: {
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
        }
        Relationships: []
      }
      descuentos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          id: number
          nombre: string
          porcentaje: number | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          id?: number
          nombre: string
          porcentaje?: number | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          id?: number
          nombre?: string
          porcentaje?: number | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enlaces_inscripcion: {
        Row: {
          codigo: string
          consulta_id: number
          creado_at: string
          usado_at: string | null
          vence_at: string
        }
        Insert: {
          codigo: string
          consulta_id: number
          creado_at?: string
          usado_at?: string | null
          vence_at?: string
        }
        Update: {
          codigo?: string
          consulta_id?: number
          creado_at?: string
          usado_at?: string | null
          vence_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enlaces_inscripcion_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_preguntas: {
        Row: {
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
        }
        Insert: {
          contacto: string
          created_at?: string
          descripcion?: string | null
          destacada?: boolean
          estado?: string
          id?: number
          modo: string
          nombre_contacto?: string | null
          orden?: number | null
          respuesta?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          contacto?: string
          created_at?: string
          descripcion?: string | null
          destacada?: boolean
          estado?: string
          id?: number
          modo?: string
          nombre_contacto?: string | null
          orden?: number | null
          respuesta?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_rate_limits: {
        Row: {
          key: string
          request_count: number
          window_started_at: string
        }
        Insert: {
          key: string
          request_count?: number
          window_started_at?: string
        }
        Update: {
          key?: string
          request_count?: number
          window_started_at?: string
        }
        Relationships: []
      }
      materias: {
        Row: {
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
        }
        Insert: {
          activa?: boolean
          created_at?: string
          descripcion?: Json
          dias_bloqueados?: Json
          en_construccion?: boolean
          horarios_bloqueados?: Json
          id?: string
          imagenes?: Json
          label: string
          modo_manana?: boolean
          nombre_profesor: string
          orden?: number
          slug: string
          telefono_display: string
          texto_seo?: Json | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          descripcion?: Json
          dias_bloqueados?: Json
          en_construccion?: boolean
          horarios_bloqueados?: Json
          id?: string
          imagenes?: Json
          label?: string
          modo_manana?: boolean
          nombre_profesor?: string
          orden?: number
          slug?: string
          telefono_display?: string
          texto_seo?: Json | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      novedades: {
        Row: {
          contenido: string | null
          created_at: string
          extracto: string | null
          fecha: string
          href: string | null
          id: number
          imagen_url: string | null
          pinned: boolean
          publicada: boolean
          slug: string | null
          tag: string
          titulo: string
          updated_at: string
        }
        Insert: {
          contenido?: string | null
          created_at?: string
          extracto?: string | null
          fecha?: string
          href?: string | null
          id?: number
          imagen_url?: string | null
          pinned?: boolean
          publicada?: boolean
          slug?: string | null
          tag?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          contenido?: string | null
          created_at?: string
          extracto?: string | null
          fecha?: string
          href?: string | null
          id?: number
          imagen_url?: string | null
          pinned?: boolean
          publicada?: boolean
          slug?: string | null
          tag?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      plantillas_mensajes: {
        Row: {
          created_at: string | null
          cuerpo: string
          id: number
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cuerpo: string
          id?: number
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cuerpo?: string
          id?: number
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      precios_carreras: {
        Row: {
          descuento_matricula: number
          descuento_ticket_a: number
          descuento_ticket_b: number
          es_especial: boolean
          id: number
          matricula: number
          nombre_excel: string
          nombre_supabase: string
          periodo: string
          ticket_a: number
          ticket_b: number
          updated_at: string
        }
        Insert: {
          descuento_matricula?: number
          descuento_ticket_a?: number
          descuento_ticket_b?: number
          es_especial?: boolean
          id?: number
          matricula?: number
          nombre_excel: string
          nombre_supabase: string
          periodo?: string
          ticket_a?: number
          ticket_b?: number
          updated_at?: string
        }
        Update: {
          descuento_matricula?: number
          descuento_ticket_a?: number
          descuento_ticket_b?: number
          es_especial?: boolean
          id?: number
          matricula?: number
          nombre_excel?: string
          nombre_supabase?: string
          periodo?: string
          ticket_a?: number
          ticket_b?: number
          updated_at?: string
        }
        Relationships: []
      }
      precios_meta: {
        Row: {
          beneficio_1b_mat: number | null
          beneficio_1b_tk: number | null
          id: number
          periodo_activo: string
          promo_desde: string | null
          promo_desde_1b: string | null
          promo_especial_matricula: number
          promo_especial_matricula_1b: number | null
          promo_especial_tk_1b: number | null
          promo_especial_tka: number
          promo_especial_tkb: number
          promo_hasta: string | null
          promo_hasta_1b: string | null
          recargo_visa_master_3: number
          recargo_visa_master_6: number
          ultima_sync: string
        }
        Insert: {
          beneficio_1b_mat?: number | null
          beneficio_1b_tk?: number | null
          id?: number
          periodo_activo?: string
          promo_desde?: string | null
          promo_desde_1b?: string | null
          promo_especial_matricula?: number
          promo_especial_matricula_1b?: number | null
          promo_especial_tk_1b?: number | null
          promo_especial_tka?: number
          promo_especial_tkb?: number
          promo_hasta?: string | null
          promo_hasta_1b?: string | null
          recargo_visa_master_3?: number
          recargo_visa_master_6?: number
          ultima_sync?: string
        }
        Update: {
          beneficio_1b_mat?: number | null
          beneficio_1b_tk?: number | null
          id?: number
          periodo_activo?: string
          promo_desde?: string | null
          promo_desde_1b?: string | null
          promo_especial_matricula?: number
          promo_especial_matricula_1b?: number | null
          promo_especial_tk_1b?: number | null
          promo_especial_tka?: number
          promo_especial_tkb?: number
          promo_hasta?: string | null
          promo_hasta_1b?: string | null
          recargo_visa_master_3?: number
          recargo_visa_master_6?: number
          ultima_sync?: string
        }
        Relationships: []
      }
      precios_privados: {
        Row: {
          actualizado_at: string
          carrera_id: number
          conceptos: Json
          institucion: string
          nota: string | null
          total: string
          vigente_hasta: string
        }
        Insert: {
          actualizado_at?: string
          carrera_id: number
          conceptos: Json
          institucion: string
          nota?: string | null
          total: string
          vigente_hasta: string
        }
        Update: {
          actualizado_at?: string
          carrera_id?: number
          conceptos?: Json
          institucion?: string
          nota?: string | null
          total?: string
          vigente_hasta?: string
        }
        Relationships: [
          {
            foreignKeyName: "precios_privados_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: true
            referencedRelation: "carreras"
            referencedColumns: ["id"]
          },
        ]
      }
      profesores: {
        Row: {
          created_at: string
          email: string | null
          estado: string
          id: string
          materia_id: string | null
          nombre: string | null
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          estado?: string
          id?: string
          materia_id?: string | null
          nombre?: string | null
          rol?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          estado?: string
          id?: string
          materia_id?: string | null
          nombre?: string | null
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesores_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
        ]
      }
      robot_autoinscripciones: {
        Row: {
          consulta_id: number
          created_at: string
          detalle: string | null
          estado: string
          id: number
          intentos: number
          updated_at: string
        }
        Insert: {
          consulta_id: number
          created_at?: string
          detalle?: string | null
          estado?: string
          id?: never
          intentos?: number
          updated_at?: string
        }
        Update: {
          consulta_id?: number
          created_at?: string
          detalle?: string | null
          estado?: string
          id?: never
          intentos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "robot_autoinscripciones_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: true
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_clase: {
        Row: {
          bloqueo_semanal: boolean
          created_at: string
          dias: string[]
          horarios: string[]
          id: string
          materia_id: string
          nombre: string | null
          telefono: string
        }
        Insert: {
          bloqueo_semanal?: boolean
          created_at?: string
          dias: string[]
          horarios: string[]
          id?: string
          materia_id: string
          nombre?: string | null
          telefono?: string
        }
        Update: {
          bloqueo_semanal?: boolean
          created_at?: string
          dias?: string[]
          horarios?: string[]
          id?: string
          materia_id?: string
          nombre?: string | null
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_clase_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones_newsletter: {
        Row: {
          activo: boolean
          carrera_id: number | null
          carrera_nombre: string | null
          consentimiento_at: string
          created_at: string
          email: string
          id: string
          ultimo_envio_at: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          carrera_id?: number | null
          carrera_nombre?: string | null
          consentimiento_at?: string
          created_at?: string
          email: string
          id?: string
          ultimo_envio_at?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          carrera_id?: number | null
          carrera_nombre?: string | null
          consentimiento_at?: string
          created_at?: string
          email?: string
          id?: string
          ultimo_envio_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_newsletter_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: false
            referencedRelation: "carreras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_form_rate_limit: {
        Args: {
          p_key: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      registrar_click_carrera: {
        Args: { p_carrera: string; p_origen?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
