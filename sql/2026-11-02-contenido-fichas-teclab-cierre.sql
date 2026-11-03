-- Contenido propio para las dos fichas de Teclab que quedaron a medias: más
-- competencias en `seccion_modalidad` y los cargos concretos en la última
-- oración de `descripcion`, que es la que la ficha muestra como salida laboral
-- (partirDescripcionTeclab). No se tocan títulos, aranceles ni fechas.
--
-- Ejecutar: npm run db:d1 -- --archivo sql/2026-11-02-contenido-fichas-teclab-cierre.sql --escribir

UPDATE carreras SET
  seccion_modalidad = '• Aplicar lógica de programación y programación orientada a objetos para construir mecánicas y sistemas de interacción.
• Configurar proyectos e integrar recursos, escenas y assets en motores de videojuegos.
• Diseñar la experiencia de usuario del juego: controles, interfaz y recorridos claros para quien juega.
• Probar, corregir y optimizar videojuegos con testing manual y automatizado, midiendo errores y rendimiento.
• Aplicar inteligencia artificial al juego en el comportamiento de personajes, la dificultad y los sistemas de juego.
• Desarrollar sistemas de juego multijugador y coordinar la comunicación entre jugadores y servidores.
• Optimizar el renderizado y el uso de recursos para sostener la fluidez y el rendimiento del juego.
• Gestionar flujos de producción, tiempos y tareas de un proyecto de videojuego.',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 247 AND nombre = 'Tecnicatura Superior en Desarrollo de Videojuegos';

UPDATE carreras SET
  descripcion = 'Estudiá comercio electrónico a distancia: tiendas online y marketplaces, publicidad digital, medios de pago, logística y análisis de ventas. Áreas de e-commerce y marketing digital, retailers, marketplaces, agencias, consultoras, startups, fintech y empresas de logística, en puestos como asistente o analista de comercio electrónico y operador de tienda online.',
  seccion_modalidad = '• Gestionar catálogos, publicaciones y stock en plataformas de comercio electrónico y marketplaces, con precios, fichas de producto y disponibilidad al día.
• Ejecutar campañas de marketing digital y publicidad, medir conversiones y ajustar la inversión según los resultados.
• Coordinar operaciones y logística de pedidos, entregas y posventa, con seguimiento de tiempos y costos.
• Administrar medios de pago, cobros, facturación y devoluciones dentro de la operatoria de la tienda online.
• Analizar datos de ventas, tráfico y comportamiento del cliente con inteligencia de negocios y tableros de indicadores.
• Diseñar la experiencia de usuario del sitio de compra, con recorridos claros y un proceso de pago sin fricción.
• Gestionar la marca y los contenidos del negocio digital en los canales propios y en redes sociales.
• Atender la experiencia del cliente en forma digital, con seguimiento de consultas, reclamos y posventa.',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 248 AND nombre = 'Tecnicatura Superior en Comercio Electrónico (e-commerce)';
