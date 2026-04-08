import { z } from 'zod/v3';

/* ── Descuentos ── */

export const descuentoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  porcentaje: z.number().nullable(),
  tipo: z.enum(['sede', 'universidad', 'promocion']),
  activo: z.boolean(),
});

export const descuentoEspecialSchema = z.object({
  matricula: z.number().nullable().optional(),
  ticket_a: z.number().nullable().optional(),
  ticket_b: z.number().nullable().optional(),
});

/* ── Slides ── */

const slidePortadaSchema = z.object({
  type: z.literal('portada'),
  imagen_desktop: z.string().optional(),
  imagen_desktop_position: z.string().optional(),
  imagen_mobile: z.string().optional(),
  bullets: z.array(z.string()),
  badges: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
});

const slideModalidadSchema = z.object({
  type: z.literal('modalidad'),
  imagen: z.string().optional(),
  titulo: z.string(),
  items: z.array(z.object({
    texto: z.string(),
    bold_inicio: z.string().optional(),
    bold_fin: z.string().optional(),
  })),
});

const slideEvaluacionSchema = z.object({
  type: z.literal('evaluacion'),
  cards: z.array(z.object({
    numero: z.string(),
    label: z.string(),
    sub: z.string(),
    accent: z.boolean().optional(),
  })),
  tags: z.array(z.string()),
  nota: z.string(),
});

const slidePlanEstudiosSchema = z.object({
  type: z.literal('plan_estudios'),
  paginas: z.array(z.object({
    izquierda: z.object({
      año: z.string(),
      cuatrimestres: z.array(z.object({ label: z.string(), materias: z.array(z.string()) })),
    }),
    derecha: z.object({
      año: z.string(),
      cuatrimestres: z.array(z.object({ label: z.string(), materias: z.array(z.string()) })),
    }).optional(),
    extras: z.array(z.object({
      titulo: z.string(),
      items: z.array(z.string()),
      nota: z.string().optional(),
    })).optional(),
  })),
});

const slideCierreSchema = z.object({
  type: z.literal('cierre'),
  imagen: z.string().optional(),
  titulo: z.string(),
  subtitulo: z.string().optional(),
  beneficios: z.array(z.object({ icono: z.string(), texto: z.string() })),
});

const knownSlideSchema = z.discriminatedUnion('type', [
  slidePortadaSchema,
  slideModalidadSchema,
  slideEvaluacionSchema,
  slidePlanEstudiosSchema,
  slideCierreSchema,
]);

// Acepta slides conocidos o cualquier objeto con type string (para no rechazar slides futuros)
const carreraSlideSchema = z.union([
  knownSlideSchema,
  z.object({ type: z.string() }).passthrough(),
]);

/* ── Carreras ── */

export const carreraSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  nivel: z.string(),
  duracion: z.string().nullable().default(''),
  titulo: z.string().nullable().default(''),
  enfoque: z.string().nullable().default(''),
  modalidad: z.string(),
  descripcion: z.string().nullable().default(''),
  prefix: z.string().nullable(),
  nombre_corto: z.string().nullable(),
  seccion_duracion: z.string().nullable(),
  seccion_modalidad: z.string().nullable(),
  plan_estudios: z.string().nullable(),
  slides: z.array(carreraSlideSchema).nullable(),
  orden: z.number().nullable().default(0),
  activa: z.boolean(),
  destacada: z.boolean(),
  nueva: z.boolean(),
  area: z.string().nullable().optional(),
  descuento_especial: descuentoEspecialSchema.nullable().optional(),
});

/* ── FAQ ── */

export const faqPreguntaSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  descripcion: z.string().nullable(),
  respuesta: z.string().nullable(),
  created_at: z.string(),
});

/* ── Materias (clases de apoyo) ── */

export const materiaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  label: z.string(),
  nombre_profesor: z.string(),
  whatsapp: z.string(),
  telefono_display: z.string(),
  descripcion: z.array(z.string()),
  imagenes: z.array(z.string()),
  en_construccion: z.boolean(),
  orden: z.number(),
  modo_manana: z.boolean(),
  dias_bloqueados: z.array(z.string()),
  horarios_bloqueados: z.array(z.string()),
});

/* ── Precios meta ── */

export const preciosMetaSchema = z.object({
  promo_especial_matricula: z.number().nullable().optional(),
  promo_especial_tka: z.number().nullable().optional(),
  promo_especial_tkb: z.number().nullable().optional(),
  periodo_activo: z.string().nullable().optional(),
  promo_especial_matricula_1b: z.number().nullable().optional(),
  promo_especial_tk_1b: z.number().nullable().optional(),
  beneficio_1b_mat: z.number().nullable().optional(),
  beneficio_1b_tk: z.number().nullable().optional(),
});

/* ── Helpers ── */

/** Parsea un array de datos Supabase con un schema Zod. Loguea errores y filtra items inválidos. */
export function parseArray<T>(schema: z.ZodType<T>, data: unknown[], label: string): T[] {
  const results: T[] = [];
  for (let i = 0; i < data.length; i++) {
    const parsed = schema.safeParse(data[i]);
    if (parsed.success) {
      results.push(parsed.data);
    } else {
      console.warn(`[Zod] ${label}[${i}] inválido:`, parsed.error.issues);
    }
  }
  return results;
}
