// Descripciones de imágenes revisadas visualmente, vinculadas al archivo y no
// a la carrera: si cambia la portada, no se atribuye la descripción anterior.
// Las fotos de ambiente y los retratos sin información específica son decorativos.
const ALT_PORTADAS: Readonly<Record<string, string>> = {
  '/imagenes/imagenes_carreras/licenciatura-en-administracion-de-infraestructura-tecnologica.webp': 'Una persona manipula componentes dentro de una computadora',
  '/imagenes/Modales/Licenciatura en Diseño y Animación Digital/Foto-hero-diseño-animacion.webp': 'Una persona edita imágenes en varias pantallas',
  '/imagenes/Modales/Profesorado Universitario para Nivel Secundario y Superior/requisitos-para-ser-profesor-secundaria-1200x63.original_meUZnLU.jpg': 'Un docente explica frente a estudiantes en un aula',
  '/imagenes/Modales/Tecnicatura en investigación de la escena del crimen/csi.jpg': 'Cinta de señalización de una escena del crimen',
  '/imagenes/Modales/Tecnicatura en Higiene y Seguridad Laboral/TEC. EN HIGIENE Y SEGURIDAD LANDING_HERO WEB.webp': 'Una trabajadora con casco en un depósito',
  '/imagenes/Modales/Tecnicatura Universitaria en Redes Informáticas y Telecomunicaciones/foto-hero-telecomunicaciones.webp': 'Una mujer usa una computadora portátil junto a racks de servidores',
  '/imagenes/Modales/Tecnicatura en Diseño y Desarrollo de Videojuegos/Foto-hero-diseno-desarrollo-de-videojuegos.webp': 'Una persona trabaja con imágenes digitales en una pantalla',
  '/imagenes/Modales/Tecnicatura Universitaria en Negocios Agroecológicos/La-agroecologia-1200x754-1.webp': 'Varias manos sostienen una planta sobre la tierra',
  '/imagenes/teclab/carreras/logistica.webp': 'Una persona maneja un montacargas en un depósito',
  '/imagenes/teclab/carreras/gestion-de-proyectos-mineros.webp': 'Camiones y maquinaria en una mina a cielo abierto',
  '/imagenes/teclab/carreras/higiene-y-seguridad-en-el-trabajo.webp': 'Trabajadores con cascos y ropa de seguridad en una instalación industrial',
  '/imagenes/teclab/carreras/gestion-ambiental.webp': 'Dos personas toman muestras de agua desde una embarcación',
  '/imagenes/teclab/carreras/desarrollo-de-videojuegos.webp': 'Un espacio con computadoras y equipos para videojuegos',
  '/imagenes/teclab/carreras/diseno-de-producto-digital.webp': 'Personas dibujan bocetos junto a computadoras portátiles',
};

export function altPortadaCarrera(ruta: string): string {
  return ALT_PORTADAS[ruta] ?? '';
}
