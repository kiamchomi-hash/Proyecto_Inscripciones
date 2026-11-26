-- Alta de la Masterclase «Decisiones Inteligentes en Inversión Hotelera».
--
-- Fuente: https://www.identidadargentina.com.ar/ y el detalle de la ficha
-- oficial (/dev/cursos, 26/11/2026). Es una escritura en producción: revisar y
-- aplicar con `npm run db:d1 -- --archivo sql/2026-11-26-identidad-inversion-hotelera.sql --escribir`
-- recién después de la autorización. No es una migración.
--
-- La imagen oficial de la ficha es
-- https://s3.us-east-1.amazonaws.com/identidadargentina.com.ar/images/inversionhotelera.jpeg
-- y el precio publicado por la Academia no se copia acá: los aranceles viven
-- en `precios_privados` y no se publican en el sitio.

INSERT INTO carreras (
  id, nombre, nivel, modalidad, activa, destacada, nueva, proximamente, orden,
  prefix, nombre_corto, duracion, titulo, area, descripcion, enfoque,
  plan_estudios, seccion_duracion, seccion_modalidad, slides
) VALUES (
  253,
  'Masterclase Decisiones Inteligentes en Inversión Hotelera',
  'Identidad Argentina',
  'A distancia',
  1, 0, 1, 0, 13,
  'Masterclase',
  'Inversión Hotelera',
  '1 día',
  'Certificación Nacional e Internacional',
  NULL,
  'Invertir en un hotel o en un proyecto hotelero no es simplemente invertir en un inmueble. Es entrar en un negocio donde desarrolladores y operadores deben demostrar a los inversores que entienden claramente los mercados y que han concebido una estrategia de negocios consistente con las expectativas económicas de quienes aportan el capital. Este taller presenta las cuestiones clave que un inversor debe tener en cuenta para determinar el atractivo, los riesgos y las complejidades propias de cualquier proyecto hotelero. Docente: Claudio Oliveira. Escuela de Administración y Finanzas — Convenio Academia Identidad Argentina.',
  'Cursada: Plataforma Innova Virtual con encuentros en vivo
Modalidad: 100% Online
Duración: 1 Día
Certificación: Nacional e Internacional',
  'Masterclass 1: Entender la verdadera naturaleza del negocio hotelero
• Qué diferencia a un hotel de un negocio hotelero.
• Por qué construir o adquirir un edificio, en una excelente localización, no es suficiente para desarrollar un gran negocio.

Masterclass 2: Evaluar la oportunidad — atractivo, dificultad y riesgo
• Las principales preguntas que un inversor debería formularse para comprometer su capital y cuáles son las respuestas imprescindibles.

Masterclass 3: Aprender de la experiencia
• Factores que han llevado al éxito —o al fracaso— a numerosos emprendimientos hoteleros.',
  NULL,
  'Claudio Oliveira
· Ingeniero, egresado de la Universidad de Buenos Aires, con posgrados en Dirección Estratégica y Marketing Estratégico en la Universidad de Buenos Aires y en la Universidad de Chicago.
· Fue Senior Advisor para firmas internacionales de consultoría de Argentina, EE. UU. y el Reino Unido, a cargo de las prácticas de Estrategia y Management Estratégico.
· Asesoró a firmas locales e internacionales, gobiernos y organismos multilaterales en reestructuraciones, reformas estructurales y estrategias competitivas.
· Se dedica particularmente a la industria de la hospitalidad, con más de 30 proyectos y negocios en operación en todo el país.
· Representa en Argentina a la Cámara Argentino Británica de Comercio en Londres; es autor de «La Marca es el Negocio» y de artículos sobre su especialidad.',
  NULL
);
