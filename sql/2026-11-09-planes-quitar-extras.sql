-- Quita bloques «Adicionales» / «Programa de Ingreso» que la página oficial
-- de cada carrera no lista. Fuente: páginas de 21.edu.ar de cada carrera,
-- comparadas el 09/11/2026 (ver odd/tasks/revision-planes-todas-2026-11-09.md).

-- Tecnicaturas con «Programa de Ingreso» (IVU, Aprender en el Siglo 21,
-- Tecnología, Humanidades y Modelos Globales) que la página oficial no muestra.
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 90 AND nombre = 'Gestión de Empresas Familiares';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 94 AND nombre = 'Diseño y Animación Digital';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 96 AND nombre = 'Recursos Turísticos';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 101 AND nombre = 'Relaciones Laborales';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 103 AND nombre = 'Gestión de Moda';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 110 AND nombre = 'Negocios Agroecológicos';

-- Carreras con «Práctica Solidaria» que la página oficial no lista.
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 86 AND nombre = 'Martillero, Corredor Público y Corredor Inmobiliario';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 89 AND nombre = 'Administración y Gestión Tributaria';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 91 AND nombre = 'Administración y Gestión de Políticas Públicas';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 97 AND nombre = 'Hidrocarburos y Geociencias';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 99 AND nombre = 'Dirección de Equipos de venta';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 102 AND nombre = 'Dirección de Protocolo, Organización de Eventos y RRPP';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 104 AND nombre = 'Gestión del Clima Laboral de la Organización';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 105 AND nombre = 'Promoción Comunitaria en Niñez y Adolescencia';
UPDATE carreras SET slides = json_remove(slides, '$[1].paginas[1].extras'), updated_at = datetime('now')
WHERE id = 106 AND nombre = 'Gestión Administrativa de Servicios de Salud';
