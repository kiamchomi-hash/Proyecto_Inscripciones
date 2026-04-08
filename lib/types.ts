/** Tipos compartidos para datos de Supabase que no están en components/index/types.ts */

export interface FaqPregunta {
  id: number;
  titulo: string;
  descripcion: string | null;
  respuesta: string | null;
  created_at: string;
}

export interface PreciosMeta {
  promo_especial_matricula?: number | null;
  promo_especial_tka?: number | null;
  promo_especial_tkb?: number | null;
  periodo_activo?: string | null;
  promo_especial_matricula_1b?: number | null;
  promo_especial_tk_1b?: number | null;
  beneficio_1b_mat?: number | null;
  beneficio_1b_tk?: number | null;
}
