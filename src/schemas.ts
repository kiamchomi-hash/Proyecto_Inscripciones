import { z } from 'zod';

// ── Schema para datos_carreras.json ──
export const CarreraSchema = z.object({
  level: z.string(),
  duration: z.string(),
  degree: z.string(),
  focus: z.string(),
  price: z.string(),
  description: z.string(),
  fullText: z.string().optional().default(''),
});

export const CarrerasDataSchema = z.record(z.string(), CarreraSchema);

export type Carrera = z.infer<typeof CarreraSchema>;
export type CarrerasData = z.infer<typeof CarrerasDataSchema>;

// ── Schema para novedades_data.json ──
export const NovedadItemSchema = z.object({
  title: z.string(),
  date: z.string(),
  tag: z.string(),
  href: z.string(),
  img: z.string().nullable(),
});

export const NovedadesPinnedSchema = NovedadItemSchema.extend({
  excerpt: z.string(),
});

export const NovedadesDataSchema = z.object({
  pinned: NovedadesPinnedSchema,
  items: z.array(NovedadItemSchema),
});

export type NovedadItem = z.infer<typeof NovedadItemSchema>;
export type NovedadesData = z.infer<typeof NovedadesDataSchema>;
