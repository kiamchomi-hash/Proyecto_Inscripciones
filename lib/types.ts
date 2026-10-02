import type { Tables } from '@/lib/database.types';

/** Proyección de FAQ que se publica sin datos de contacto. */
export type FaqPregunta = Pick<Tables<'faq_preguntas'>,
  'id' | 'titulo' | 'descripcion' | 'respuesta' | 'created_at'
>;
