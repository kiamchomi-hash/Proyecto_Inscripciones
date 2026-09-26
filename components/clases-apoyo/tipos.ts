// Tipos de las páginas de materia. Viven aparte porque los usan piezas de
// servidor (la página, la navegación) y de cliente (la reserva, el carrusel).

// Lo mínimo para enlazar a otra materia. Las páginas de materia piden esto de
// las otras y la ficha completa sólo de la propia: si van todas enteras, todas
// las URLs sirven el mismo HTML y Google las descarta como duplicadas (pasó:
// sólo indexó dos de seis).
export interface MateriaNav {
  id: string;
  slug: string;
  label: string;
}

export interface MateriaDB extends MateriaNav {
  nombre_profesor: string;
  whatsapp: string;
  telefono_display: string;
  descripcion: string[];
  imagenes: string[];
  en_construccion: boolean;
  orden: number;
  modo_manana: boolean;
  dias_bloqueados: string[];
  horarios_bloqueados: string[];
  texto_seo?: string[] | null;
}
