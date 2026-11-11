// El título y la descripción de las páginas fijas.
//
// Los usan dos cosas: la página que se sirve en el navegador y su versión
// markdown para agentes. Antes cada uno tenía su copia del texto y, cuando
// cambiaba una, la otra quedaba vieja: por eso viven acá.
//
// Las páginas cuyo contenido viene de un módulo de datos propio —el
// calendario y el sobre nosotros— tienen su título y su descripción ahí
// adentro, con el resto del contenido.

export interface PaginaFija {
  titulo: string;
  descripcion: string;
}

export const PAGINAS: Record<string, PaginaFija> = {
  faq: {
    titulo: 'Preguntas Frecuentes | Siglo 21',
    descripcion: 'Resolvé tus dudas sobre cursada, exámenes y aranceles en CAU Villa Lugano. '
      + 'La universidad cerca de Celina y todo Zona Sur/Oeste.',
  },
  contacto: {
    titulo: 'Contacto | Siglo 21',
    descripcion: 'Contactá al CAU Villa Lugano, sede de Universidad Siglo 21. WhatsApp, Facebook, '
      + 'Instagram. Guaminí 4876, Villa Lugano, Comuna 8, CABA.',
  },
  home: {
    titulo: 'Inicio',
    descripcion: 'Oferta académica online de Universidad Siglo 21, con acompañamiento para '
      + 'estudiantes de CABA, GBA y otras zonas. Consultá carreras e inscripciones.',
  },
  teclab: {
    titulo: 'Teclab',
    descripcion: 'Tecnicaturas y cursos Teclab 100% online en tecnología, gestión y negocios. '
      + 'Conocé la oferta y recibí asesoramiento personalizado.',
  },
  clases: {
    titulo: 'Clases de apoyo',
    descripcion: 'Clases particulares y apoyo escolar presenciales en Villa Lugano, Villa '
      + 'Riachuelo y alrededores: Matemática, Lengua, Física, Computación y Arte. Guaminí 4876.',
  },
  vocacional: {
    titulo: 'Test vocacional',
    descripcion: 'Respondé un recorrido breve y descubrí las áreas y carreras de Universidad '
      + 'Siglo 21 que más conectan con tus intereses.',
  },
};
