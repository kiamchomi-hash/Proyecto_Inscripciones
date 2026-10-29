-- Fuente: https://21.edu.ar/carreras-y-programas/tecnicatura-universitaria-en-diseno-y-desarrollo-de-videojuegos
-- Conserva plan, título y demás slides; sólo cambia la presentación y la portada.
-- El WHERE exige la descripción anterior y el tipo de slide esperado.
UPDATE carreras
SET descripcion = 'Estudiá diseño y desarrollo de videojuegos a distancia en Universidad Siglo 21. La formación integra diseño, programación y desarrollo de experiencias interactivas. Aprendés a crear mecánicas, personajes y escenarios, trabajar con motores de videojuegos y participar en proyectos junto a equipos multidisciplinarios.',
    slides = json_set(slides, '$[0].bullets', json('["Diseñá mecánicas, personajes y escenarios para videojuegos", "Desarrollá experiencias interactivas con herramientas como Unity, Unreal Engine y Blender"]')),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 109
  AND nombre = 'Diseño y Desarrollo de Videojuegos'
  AND nivel = 'Pregrado'
  AND json_extract(slides, '$[0].type') = 'portada'
  AND descripcion = 'Aprendé a crear videojuegos desde la idea hasta una versión funcional: diseño de mecánicas y niveles, guionado, narrativa, programación orientada a objetos, estructuras de datos, computación gráfica, animación 2D y 3D, sonido, redes, inteligencia artificial aplicada y motores de videojuegos. La formación también incorpora marketing digital y una práctica profesional integradora. Podés desarrollarte en programación, game design, arte y animación para estudios o proyectos propios.';
