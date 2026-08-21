// Catalogo de los videos institucionales. Los mp4 no viven en el repo: pesan
// entre 1,5 y 6 MB y se sirven desde el bucket publico `videos` de Supabase
// Storage (ver sql/2026-08-15_bucket_videos.sql). En el repo quedan solo los
// poster, que son JPG de ~40 KB y se necesitan antes de que el usuario haga
// clic en reproducir.

const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos`;

export type VideoInstitucional = {
  id: string;
  titulo: string;
  descripcion: string;
  /** Nombre del archivo dentro del bucket `videos`. */
  archivo: string;
  poster: string;
  /** Duracion en segundos: alimenta el schema VideoObject y el cartel del poster. */
  duracion: number;
  /** Fecha de publicacion en ISO, para el schema. */
  publicado: string;
};

export const VIDEOS_INSTITUCIONALES: VideoInstitucional[] = [
  {
    id: 'teclab',
    titulo: 'Carreras Teclab',
    descripcion:
      'Las tecnicaturas superiores de Teclab: dos años, 100% online y con título oficial. Tecnología, negocios y gestión.',
    archivo: 'teclab-carreras.mp4',
    poster: '/imagenes/videos/teclab-carreras.jpg',
    duracion: 37,
    publicado: '2026-06-23',
  },
  {
    id: 'identidad',
    titulo: 'Diplomaturas Identidad Argentina',
    descripcion:
      'Las diplomaturas de la Academia Identidad Argentina: cursada corta, 100% online y en vivo, con certificación.',
    archivo: 'identidad-diplomaturas.mp4',
    poster: '/imagenes/videos/identidad-diplomaturas.jpg',
    duracion: 24,
    publicado: '2026-06-13',
  },
];

export const urlDeVideo = (v: VideoInstitucional) => `${BASE}/${v.archivo}`;

/** ISO 8601 de duracion (PT2M30S), que es lo que pide schema.org. */
export const duracionISO = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `PT${m > 0 ? `${m}M` : ''}${s}S`;
};
