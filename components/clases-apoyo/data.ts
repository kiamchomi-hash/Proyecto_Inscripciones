export interface MateriaData {
  nombre: string;
  wa: string;
  label: string;
  tel: string;
  enConstruccion?: boolean;
  desc: string[];
  images: string[];
}

export const materias: Record<string, MateriaData> = {
  mat: {
    nombre: "Liliana",
    wa: "5491166522722",
    label: "Matemática",
    tel: "+54 9 11 6652-2722",
    desc: [
      "Asistencia integral en: <strong>Ecuaciones, Funciones, Geometría y Razonamiento Lógico</strong>.",
      "Preparación técnica para <strong>exámenes finales y trabajos prácticos</strong>.",
      "Material de apoyo exclusivo basado en <strong>guías de estudio oficiales</strong>.",
    ],
    images: [
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1000&q=80",
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1000&q=80",
    ],
  },
  len: {
    nombre: "Julieta",
    wa: "5491100000000",
    label: "Lengua",
    tel: "+54 9 11 0000-0000",
    desc: [
      "Ayuda en: <strong>Análisis sintáctico, Ortografía, Gramática y Comprensión de textos</strong>.",
      "Preparación para <strong>exámenes y trabajos prácticos</strong> académicos.",
      "Práctica con modelos de evaluación y <strong>guías de estudio</strong> vigentes.",
    ],
    images: [
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1000&q=80", // Books/Studying
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1000&q=80", // Writing/Pen
    ],
  },
  comp: {
    nombre: "Matías",
    wa: "5491111111111",
    label: "Computación",
    tel: "+54 9 11 1111-1111",
    desc: [
      "Capacitación en <strong>Herramientas Ofimáticas, Sistemas Operativos e Internet</strong>.",
      "Apoyo en <strong>proyectos digitales y alfabetización informática</strong>.",
      "Optimización del uso de <strong>plataformas educativas y software específico</strong>.",
    ],
    images: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&q=80", // Coding/Laptop
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1000&q=80", // Modern Tech
    ],
  },
  eng: {
    nombre: "Inglés",
    wa: "5491122222222",
    label: "Inglés",
    tel: "+54 9 11 2222-2222",
    enConstruccion: true,
    desc: [],
    images: [],
  },
  art: {
    nombre: "Gabriela",
    wa: "5491133333333",
    label: "Arte",
    tel: "+54 9 11 3333-3333",
    desc: [
      "Exploración de <strong>Técnicas Visuales, Historia del Arte y Expresión Creativa</strong>.",
      "Apoyo en <strong>proyectos artísticos escolares y carpetas técnicas</strong>.",
      "Desarrollo de <strong>habilidades estéticas y análisis compositivo</strong>.",
    ],
    images: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&q=80", // Painting/Art
      "https://images.unsplash.com/photo-1460661419201-fd4ce18686cf?w=1000&q=80", // Creative supplies
    ],
  },
  sec: {
    nombre: "Apoyo",
    wa: "5491144444444",
    label: "Apoyo",
    tel: "+54 9 11 4444-4444",
    enConstruccion: true,
    desc: [],
    images: [],
  },
};

export const materiaIds = Object.keys(materias) as (keyof typeof materias)[];
