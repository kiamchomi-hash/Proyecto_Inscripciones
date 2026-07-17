/** Tipos compartidos para datos de Supabase que no están en components/index/types.ts */

export interface FaqPregunta {
  id: number;
  titulo: string;
  descripcion: string | null;
  respuesta: string | null;
  created_at: string;
}
