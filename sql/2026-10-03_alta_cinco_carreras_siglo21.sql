-- Cinco altas autorizadas. Revisar preflight antes de aplicar una sola vez.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- Sin UNIQUE por nombre: evita altas concurrentes durante las guardas de ausencia.
LOCK TABLE public.carreras IN SHARE ROW EXCLUSIVE MODE;
DO $alta$
DECLARE
  esperado jsonb;
  actual jsonb;
  afectadas integer;
BEGIN
  IF current_user <> 'cau_editor' THEN RAISE EXCEPTION 'Rol no autorizado para esta operación'; END IF;
  SELECT to_jsonb(c) INTO actual FROM public.carreras c WHERE id = 77 FOR UPDATE;
  esperado := '{"nombre":"Antropología Organizacional","prefix":"Grado / Licenciatura en ","nivel":"Grado","activa":false,"orden":36,"updated_at":"2026-03-21T20:09:07.010Z"}'::jsonb;
  IF actual IS NULL OR NOT actual @> (esperado - 'updated_at') OR (actual->>'updated_at')::timestamptz IS DISTINCT FROM (esperado->>'updated_at')::timestamptz THEN
    RAISE EXCEPTION 'Baseline modificado o fila ausente: ID 77';
  END IF;
  SELECT to_jsonb(c) INTO actual FROM public.carreras c WHERE id = 63 FOR UPDATE;
  esperado := '{"nombre":"Administración Hotelera","prefix":"Grado / Licenciatura en","nivel":"Grado","activa":false,"orden":22,"updated_at":"2026-07-30T22:17:18.993Z"}'::jsonb;
  IF actual IS NULL OR NOT actual @> (esperado - 'updated_at') OR (actual->>'updated_at')::timestamptz IS DISTINCT FROM (esperado->>'updated_at')::timestamptz THEN
    RAISE EXCEPTION 'Baseline modificado o fila ausente: ID 63';
  END IF;
  SELECT to_jsonb(c) INTO actual FROM public.carreras c WHERE id = 18 FOR UPDATE;
  esperado := '{"nombre":"Licenciatura en Administración de Infraestructura Tecnológica","prefix":null,"nivel":"Grado","activa":false,"orden":17,"updated_at":"2026-03-21T20:43:42.159Z"}'::jsonb;
  IF actual IS NULL OR NOT actual @> (esperado - 'updated_at') OR (actual->>'updated_at')::timestamptz IS DISTINCT FROM (esperado->>'updated_at')::timestamptz THEN
    RAISE EXCEPTION 'Baseline modificado o fila ausente: ID 18';
  END IF;
  IF EXISTS (SELECT 1 FROM public.carreras WHERE nivel = 'Grado' AND lower(trim(nombre)) IN ('ambiente y energías renovables', 'licenciatura en ambiente y energías renovables')) THEN
    RAISE EXCEPTION 'Ya existe la licenciatura: Ambiente y Energías Renovables';
  END IF;
  IF EXISTS (SELECT 1 FROM public.carreras WHERE nivel = 'Grado' AND lower(trim(nombre)) IN ('hidrocarburos y geociencias', 'licenciatura en hidrocarburos y geociencias')) THEN
    RAISE EXCEPTION 'Ya existe la licenciatura: Hidrocarburos y Geociencias';
  END IF;
  UPDATE public.carreras SET
    nombre = 'Antropología Organizacional',
    prefix = 'Grado / Licenciatura en ',
    nivel = 'Grado',
    modalidad = 'Distancia',
    duracion = '4 años',
    titulo = 'Licenciado/a en Antropología Organizacional',
    descripcion = 'Analizá culturas y vínculos en las organizaciones. Aplicá herramientas antropológicas al mundo del trabajo.',
    enfoque = 'Aplicá herramientas antropológicas al mundo del trabajo.',
    seccion_duracion = '4 años. Consultá el plan de estudios y sus requisitos adicionales.',
    seccion_modalidad = 'Educación Distribuida Home (EDH): cursado virtual con instancias presenciales según el trayecto académico.',
    plan_estudios = 'Primer año
Primer Cuatrimestre
• Principios de Economía
• Antropología
• Epistemología
• Psicología Social de la Comunicación
• Etnografía
• Idioma Extranjero I
Segundo Cuatrimestre
• Historia de América Latina
• Fundamentos de Antropología Organizacional
• Oratoria
• Cibercultura
• Sociología General
• Idioma Extranjero II
Segundo año
Tercer Cuatrimestre
• Comunicación Organizacional
• Escuelas Antropológicas
• Métodos y Técnicas de Investigación Social
• Organización Social
• Cultura Organizacional
• Idioma Extranjero III
Cuarto Cuatrimestre
• Lenguaje y Cultura
• Métodos y Técnicas de Investigación Etnográfica
• Antropología Urbana
• Antropología Política y Legal
• Desarrollo Emprendedor
• Idioma Extranjero IV
Tercer año
Quinto Cuatrimestre
• Corrientes Antropológicas Contemporáneas
• Historia Universal
• Marco Legal de las Organizaciones
• Antropología del Trabajo
• Ética y Deontología Profesional
• Idioma Extranjero V
Sexto Cuatrimestre
• Historia del Trabajo
• Análisis y Diagnóstico del Cambio Organizacional
• Antropología Aplicada
• Historia Argentina
• Idioma Extranjero VI
• Seminario de Práctica de Antropología Organizacional
Cuarto año
Séptimo Cuatrimestre
• Grupo y Liderazgo
• Desarrollo y Globalización
• Migración, Nuevas Identidades y Multiculturalidad
• Antropología, Recursos Humanos y RSE
• Tecnología, Medio Ambiente y Cultura en el Siglo XXI
• Práctica Profesional de Antropología Organizacional
Octavo Cuatrimestre
• Sociología del Poder
• Movimientos Sociales y Cultura del Trabajo
• Antropología Rural
• Antropología Económica
• Emprendimientos Universitarios
• Seminario Final de Antropología Organizacional
Materias adicionales
• Práctica Solidaria
• Materias electivas',
    nombre_corto = 'Antropología Organizacional',
    area = 'RRHH',
    activa = true,
    orden = 36,
    slides = '[{"type":"portada","imagen_desktop":"/imagenes/gente/Header_1920x450-1.webp","imagen_desktop_position":"center","bullets":["Analizá culturas y vínculos en las organizaciones.","Aplicá herramientas antropológicas al mundo del trabajo."],"badges":[{"label":"Título","value":"Licenciado/a en Antropología Organizacional"},{"label":"Área","value":"RRHH"}]},{"type":"plan_estudios","paginas":[{"izquierda":{"año":"Primer año","cuatrimestres":[{"label":"Primer Cuatrimestre","materias":["Principios de Economía","Antropología","Epistemología","Psicología Social de la Comunicación","Etnografía","Idioma Extranjero I"]},{"label":"Segundo Cuatrimestre","materias":["Historia de América Latina","Fundamentos de Antropología Organizacional","Oratoria","Cibercultura","Sociología General","Idioma Extranjero II"]}]},"derecha":{"año":"Segundo año","cuatrimestres":[{"label":"Tercer Cuatrimestre","materias":["Comunicación Organizacional","Escuelas Antropológicas","Métodos y Técnicas de Investigación Social","Organización Social","Cultura Organizacional","Idioma Extranjero III"]},{"label":"Cuarto Cuatrimestre","materias":["Lenguaje y Cultura","Métodos y Técnicas de Investigación Etnográfica","Antropología Urbana","Antropología Política y Legal","Desarrollo Emprendedor","Idioma Extranjero IV"]}]}},{"izquierda":{"año":"Tercer año","cuatrimestres":[{"label":"Quinto Cuatrimestre","materias":["Corrientes Antropológicas Contemporáneas","Historia Universal","Marco Legal de las Organizaciones","Antropología del Trabajo","Ética y Deontología Profesional","Idioma Extranjero V"]},{"label":"Sexto Cuatrimestre","materias":["Historia del Trabajo","Análisis y Diagnóstico del Cambio Organizacional","Antropología Aplicada","Historia Argentina","Idioma Extranjero VI","Seminario de Práctica de Antropología Organizacional"]}]},"derecha":{"año":"Cuarto año","cuatrimestres":[{"label":"Séptimo Cuatrimestre","materias":["Grupo y Liderazgo","Desarrollo y Globalización","Migración, Nuevas Identidades y Multiculturalidad","Antropología, Recursos Humanos y RSE","Tecnología, Medio Ambiente y Cultura en el Siglo XXI","Práctica Profesional de Antropología Organizacional"]},{"label":"Octavo Cuatrimestre","materias":["Sociología del Poder","Movimientos Sociales y Cultura del Trabajo","Antropología Rural","Antropología Económica","Emprendimientos Universitarios","Seminario Final de Antropología Organizacional"]}]},"extras":[{"titulo":"Materias adicionales","items":["Práctica Solidaria","Materias electivas"]}]}]},{"type":"cierre","imagen":"/imagenes/imagenes_cau/entrada_estetica.png","titulo":"Estudiá con acompañamiento del CAU Villa Lugano","subtitulo":"Consultanos para conocer la modalidad y los requisitos de ingreso.","beneficios":[{"icono":"graduation-cap","texto":"Título universitario"},{"icono":"users","texto":"Acompañamiento del CAU"}]}]'::jsonb
  WHERE id = 77;
  GET DIAGNOSTICS afectadas = ROW_COUNT;
  IF afectadas <> 1 THEN RAISE EXCEPTION 'Cantidad afectada inesperada'; END IF;
  UPDATE public.carreras SET
    nombre = 'Administración Hotelera',
    prefix = 'Grado / Licenciatura en',
    nivel = 'Grado',
    modalidad = 'Distancia',
    duracion = '4 años',
    titulo = 'Licenciado/a en Administración Hotelera',
    descripcion = 'Gestioná servicios y operaciones hoteleras. Desarrollá experiencias de hospitalidad y equipos de trabajo.',
    enfoque = 'Desarrollá experiencias de hospitalidad y equipos de trabajo.',
    seccion_duracion = '4 años. Consultá el plan de estudios y sus requisitos adicionales.',
    seccion_modalidad = 'Educación Distribuida Home (EDH): cursado virtual con instancias presenciales según el trayecto académico.',
    plan_estudios = 'Primer año
Primer Cuatrimestre
• Administración
• Desarrollo Emprendedor
• Geografía Turística
• Herramientas Matemáticas II - Análisis -
• Idioma Extranjero I
• Mercados Turísticos
Segundo Cuatrimestre
• Alimentos y Bebidas
• Comportamiento del Consumidor
• Eventos, Ceremonial y Protocolo
• Idioma Extranjero II
• Servicios Turísticos
Segundo año
Tercer Cuatrimestre
• Contabilidad Básica y de Gestión
• Gestión de Empresas Gastronómicas
• Herramientas Matemáticas III - Estadística I
• Idioma Extranjero III
• Marketing I
• Práctica Solidaria
Cuarto Cuatrimestre
• Cultura Organizacional
• Economía I
• Gestión de Alojamiento
• Idioma Extranjero IV
• Investigación de Mercado
• Marco Legal de las Organizaciones
Tercer año
Quinto Cuatrimestre
• Administración De Recursos Humanos
• Análisis Cuantitativo Financiero
• Contabilidad De Costos
• Economía II
• Idioma Extranjero V
• Recepción, Conserjería y Reservas
Sexto Cuatrimestre
• Dirección General
• Formulación Y Evaluación De Proyectos
• Historia Universal
• Idioma Extranjero VI
• Seminario de Práctica de Administración Hotelera
• Ética y Deontología Profesional
Cuarto año
Séptimo Cuatrimestre
• Emprendimientos Universitarios
• Gestión Ambiental
• Gestión de Turismo de Negocios y de Tiempo Libre
• Idioma Extranjero VII
• Práctica Profesional de Administración Hotelera
• Turismo y Mercado
Octavo Cuatrimestre
• Idioma Extranjero VIII
• Instituciones Políticas y Gubernamentales
• Pisos y Habitaciones - Mantenimiento y Seguridad
• Hotelera
• Planificación Turística
• Seminario Final de Administración Hotelera',
    nombre_corto = 'Administración Hotelera',
    area = 'Turismo y Hotelería',
    activa = true,
    orden = 22,
    slides = '[{"type":"portada","imagen_desktop":"/imagenes/gente/Header_1920x450-1.webp","imagen_desktop_position":"center","bullets":["Gestioná servicios y operaciones hoteleras.","Desarrollá experiencias de hospitalidad y equipos de trabajo."],"badges":[{"label":"Título","value":"Licenciado/a en Administración Hotelera"},{"label":"Área","value":"Turismo y Hotelería"}]},{"type":"plan_estudios","paginas":[{"izquierda":{"año":"Primer año","cuatrimestres":[{"label":"Primer Cuatrimestre","materias":["Administración","Desarrollo Emprendedor","Geografía Turística","Herramientas Matemáticas II - Análisis -","Idioma Extranjero I","Mercados Turísticos"]},{"label":"Segundo Cuatrimestre","materias":["Alimentos y Bebidas","Comportamiento del Consumidor","Eventos, Ceremonial y Protocolo","Idioma Extranjero II","Servicios Turísticos"]}]},"derecha":{"año":"Segundo año","cuatrimestres":[{"label":"Tercer Cuatrimestre","materias":["Contabilidad Básica y de Gestión","Gestión de Empresas Gastronómicas","Herramientas Matemáticas III - Estadística I","Idioma Extranjero III","Marketing I","Práctica Solidaria"]},{"label":"Cuarto Cuatrimestre","materias":["Cultura Organizacional","Economía I","Gestión de Alojamiento","Idioma Extranjero IV","Investigación de Mercado","Marco Legal de las Organizaciones"]}]}},{"izquierda":{"año":"Tercer año","cuatrimestres":[{"label":"Quinto Cuatrimestre","materias":["Administración De Recursos Humanos","Análisis Cuantitativo Financiero","Contabilidad De Costos","Economía II","Idioma Extranjero V","Recepción, Conserjería y Reservas"]},{"label":"Sexto Cuatrimestre","materias":["Dirección General","Formulación Y Evaluación De Proyectos","Historia Universal","Idioma Extranjero VI","Seminario de Práctica de Administración Hotelera","Ética y Deontología Profesional"]}]},"derecha":{"año":"Cuarto año","cuatrimestres":[{"label":"Séptimo Cuatrimestre","materias":["Emprendimientos Universitarios","Gestión Ambiental","Gestión de Turismo de Negocios y de Tiempo Libre","Idioma Extranjero VII","Práctica Profesional de Administración Hotelera","Turismo y Mercado"]},{"label":"Octavo Cuatrimestre","materias":["Idioma Extranjero VIII","Instituciones Políticas y Gubernamentales","Pisos y Habitaciones - Mantenimiento y Seguridad","Hotelera","Planificación Turística","Seminario Final de Administración Hotelera"]}]}}]},{"type":"cierre","imagen":"/imagenes/imagenes_cau/entrada_estetica.png","titulo":"Estudiá con acompañamiento del CAU Villa Lugano","subtitulo":"Consultanos para conocer la modalidad y los requisitos de ingreso.","beneficios":[{"icono":"graduation-cap","texto":"Título universitario"},{"icono":"users","texto":"Acompañamiento del CAU"}]}]'::jsonb
  WHERE id = 63;
  GET DIAGNOSTICS afectadas = ROW_COUNT;
  IF afectadas <> 1 THEN RAISE EXCEPTION 'Cantidad afectada inesperada'; END IF;
  INSERT INTO public.carreras (nombre, prefix, nivel, modalidad, duracion, titulo, descripcion, enfoque, seccion_duracion, seccion_modalidad, plan_estudios, nombre_corto, area, activa, orden, slides) VALUES (
    'Ambiente y Energías Renovables',
    'Grado / Licenciatura en',
    'Grado',
    'Distancia',
    '4 años',
    'Licenciado/a en Ambiente y Energías Renovables',
    'Estudiá energías renovables y gestión ambiental. Desarrollá proyectos orientados a la sostenibilidad.',
    'Desarrollá proyectos orientados a la sostenibilidad.',
    '4 años. Consultá el plan de estudios y sus requisitos adicionales.',
    'Educación Distribuida Home (EDH): cursado virtual con instancias presenciales según el trayecto académico.',
    'Primer año
Primer Cuatrimestre
• Ecología
• Física Ambiental
• Herramientas Matemáticas I – Álgebra
• Introducción a las Energías Renovables
• Sociología General
• Desarrollo Emprendedor
Segundo Cuatrimestre
• Gestión Ambiental
• Gestión del Recurso Aire y Agua
• Química Ambiental
• Hidráulica
• Idioma Extranjero I
• Geografía Económica
Segundo año
Tercer Cuatrimestre
• Herramientas Matemáticas III - Estadística I
• Mediciones Ambientales
• Ordenamiento Ambiental
• Introducción a las Políticas Públicas
• Grupo y Liderazgo
• Idioma Extranjero II
Cuarto Cuatrimestre
• Evaluación del Impacto Ambiental
• Derecho Ambiental
• Energía Solar Fotovoltaica
• Gestión De Residuos I
• Energía Hidráulica
• Idioma Extranjero III
Tercer año
Quinto Cuatrimestre
• Eco Marketing
• Auditoría Ambiental
• Sistemas de Información Geográfica
• Energía Eólica
• Seminario de Práctica
• Idioma Extranjero IV
Sexto Cuatrimestre
• Métodos y Técnicas de Investigación Social
• Evaluación del Impacto Ambiental II
• Desastres Naturales y Adaptación Climática
• Energía de Biomasa
• Responsabilidad Social
• Idioma Extranjero V
Cuarto año
Séptimo Cuatrimestre
• Seguridad e Higiene Laboral
• Salud y Ambiente
• Desarrollo Sustentable
• Comunicación y Educación Medioambiental
• Emprendimientos Universitarios
• Práctica Profesional
Octavo Cuatrimestre
• Gestión de Proyectos de Energías Renovables
• Proyectos de Reducción y Reutilización de Recursos
• Políticas Energéticas Internacionales
• Gestión de los Alimentos
• Idioma Extranjero VI
• Seminario Final',
    'Ambiente y Energías Renovables',
    'Ambiente y Energía',
    true,
    58,
    '[{"type":"portada","imagen_desktop":"/imagenes/gente/Header_1920x450-1.webp","imagen_desktop_position":"center","bullets":["Estudiá energías renovables y gestión ambiental.","Desarrollá proyectos orientados a la sostenibilidad."],"badges":[{"label":"Título","value":"Licenciado/a en Ambiente y Energías Renovables"},{"label":"Área","value":"Ambiente y Energía"}]},{"type":"plan_estudios","paginas":[{"izquierda":{"año":"Primer año","cuatrimestres":[{"label":"Primer Cuatrimestre","materias":["Ecología","Física Ambiental","Herramientas Matemáticas I – Álgebra","Introducción a las Energías Renovables","Sociología General","Desarrollo Emprendedor"]},{"label":"Segundo Cuatrimestre","materias":["Gestión Ambiental","Gestión del Recurso Aire y Agua","Química Ambiental","Hidráulica","Idioma Extranjero I","Geografía Económica"]}]},"derecha":{"año":"Segundo año","cuatrimestres":[{"label":"Tercer Cuatrimestre","materias":["Herramientas Matemáticas III - Estadística I","Mediciones Ambientales","Ordenamiento Ambiental","Introducción a las Políticas Públicas","Grupo y Liderazgo","Idioma Extranjero II"]},{"label":"Cuarto Cuatrimestre","materias":["Evaluación del Impacto Ambiental","Derecho Ambiental","Energía Solar Fotovoltaica","Gestión De Residuos I","Energía Hidráulica","Idioma Extranjero III"]}]}},{"izquierda":{"año":"Tercer año","cuatrimestres":[{"label":"Quinto Cuatrimestre","materias":["Eco Marketing","Auditoría Ambiental","Sistemas de Información Geográfica","Energía Eólica","Seminario de Práctica","Idioma Extranjero IV"]},{"label":"Sexto Cuatrimestre","materias":["Métodos y Técnicas de Investigación Social","Evaluación del Impacto Ambiental II","Desastres Naturales y Adaptación Climática","Energía de Biomasa","Responsabilidad Social","Idioma Extranjero V"]}]},"derecha":{"año":"Cuarto año","cuatrimestres":[{"label":"Séptimo Cuatrimestre","materias":["Seguridad e Higiene Laboral","Salud y Ambiente","Desarrollo Sustentable","Comunicación y Educación Medioambiental","Emprendimientos Universitarios","Práctica Profesional"]},{"label":"Octavo Cuatrimestre","materias":["Gestión de Proyectos de Energías Renovables","Proyectos de Reducción y Reutilización de Recursos","Políticas Energéticas Internacionales","Gestión de los Alimentos","Idioma Extranjero VI","Seminario Final"]}]}}]},{"type":"cierre","imagen":"/imagenes/imagenes_cau/entrada_estetica.png","titulo":"Estudiá con acompañamiento del CAU Villa Lugano","subtitulo":"Consultanos para conocer la modalidad y los requisitos de ingreso.","beneficios":[{"icono":"graduation-cap","texto":"Título universitario"},{"icono":"users","texto":"Acompañamiento del CAU"}]}]'::jsonb
  );
  GET DIAGNOSTICS afectadas = ROW_COUNT;
  IF afectadas <> 1 THEN RAISE EXCEPTION 'Cantidad afectada inesperada'; END IF;
  INSERT INTO public.carreras (nombre, prefix, nivel, modalidad, duracion, titulo, descripcion, enfoque, seccion_duracion, seccion_modalidad, plan_estudios, nombre_corto, area, activa, orden, slides) VALUES (
    'Hidrocarburos y Geociencias',
    'Grado / Licenciatura en',
    'Grado',
    'Distancia',
    '4 años',
    'Licenciado/a en Hidrocarburos y Geociencias',
    'Estudiá geociencias y recursos hidrocarburíferos. Participá en proyectos vinculados a exploración y producción.',
    'Participá en proyectos vinculados a exploración y producción.',
    '4 años. Consultá el plan de estudios y sus requisitos adicionales.',
    'Educación Distribuida Home (EDH): cursado virtual con instancias presenciales según el trayecto académico.',
    'Primer año
Primer Cuatrimestre
• Herramientas Matemáticas I - Álgebra
• Geología I
• Física
• Introducción a la Industria de los Hidrocarburos
• Sociología General
• Idioma Extranjero I
Segundo Cuatrimestre
• Electrotecnia y Termotecnia
• Herramientas Matemáticas II - Análisis
• Química General e Inorgánica
• Sistemas de Representación
• Desarrollo Emprendedor
• Idioma Extranjero II
Segundo año
Tercer Cuatrimestre
• Química Orgánica
• Mecánica de los Fluidos
• Marco Legal de las Organizaciones
• Geología II
• Máquinas y Sistemas
• Idioma Extranjero III
Cuarto Cuatrimestre
• Evaluación de Impacto Ambiental I
• Reservorios
• Perforación
• Derecho Ambiental
• Economía I
• Idioma Extranjero IV
Tercer año
Quinto Cuatrimestre
• Perforación Avanzada
• Materiales para la Industria Petrolera
• Logística
• Evaluación de Impacto Ambiental II
• Ética y Deontología Profesional
• Idioma Extranjero V
Sexto Cuatrimestre
• Yacimientos No Convencionales
• Herramientas Matemáticas III - Estadística I
• Seguridad e Higiene Laboral
• Grupo y Liderazgo
• Idioma Extranjero VI
• Seminario de Práctica de Hidrocarburos y Geociencia
Cuarto año
Séptimo Cuatrimestre
• Derecho y Energía
• Terminación y Reparación de Pozos
• Sistemas Artificiales de Producción
• Instalaciones de Superficie
• Recuperación Secundaria y Mejorada
• Práctica Profesional de Hidrocarburos y Geociencia
Octavo Cuatrimestre
• Implementación de Normas de Calidad
• Política y Economía Ambiental
• Gas y Gasolina
• Industrialización de los Hidrocarburos
• Emprendimientos Universitarios
• Seminario Final de Hidrocarburos y Geociencia
Otros requisitos
Noveno Cuatrimestre
• Práctica Solidaria
• Materia Electiva I
• Materia Electiva II',
    'Hidrocarburos y Geociencias',
    'Energía',
    true,
    59,
    '[{"type":"portada","imagen_desktop":"/imagenes/Modales/Tecnicatura Universitaria en Hidrocarburos y Geociencias/Foto-hero-tecnicatura-hidrocarburos-y-geociencia.webp","imagen_desktop_position":"40% center","bullets":["Estudiá geociencias y recursos hidrocarburíferos.","Participá en proyectos vinculados a exploración y producción."],"badges":[{"label":"Título","value":"Licenciado/a en Hidrocarburos y Geociencias"},{"label":"Área","value":"Energía"}]},{"type":"plan_estudios","paginas":[{"izquierda":{"año":"Primer año","cuatrimestres":[{"label":"Primer Cuatrimestre","materias":["Herramientas Matemáticas I - Álgebra","Geología I","Física","Introducción a la Industria de los Hidrocarburos","Sociología General","Idioma Extranjero I"]},{"label":"Segundo Cuatrimestre","materias":["Electrotecnia y Termotecnia","Herramientas Matemáticas II - Análisis","Química General e Inorgánica","Sistemas de Representación","Desarrollo Emprendedor","Idioma Extranjero II"]}]},"derecha":{"año":"Segundo año","cuatrimestres":[{"label":"Tercer Cuatrimestre","materias":["Química Orgánica","Mecánica de los Fluidos","Marco Legal de las Organizaciones","Geología II","Máquinas y Sistemas","Idioma Extranjero III"]},{"label":"Cuarto Cuatrimestre","materias":["Evaluación de Impacto Ambiental I","Reservorios","Perforación","Derecho Ambiental","Economía I","Idioma Extranjero IV"]}]}},{"izquierda":{"año":"Tercer año","cuatrimestres":[{"label":"Quinto Cuatrimestre","materias":["Perforación Avanzada","Materiales para la Industria Petrolera","Logística","Evaluación de Impacto Ambiental II","Ética y Deontología Profesional","Idioma Extranjero V"]},{"label":"Sexto Cuatrimestre","materias":["Yacimientos No Convencionales","Herramientas Matemáticas III - Estadística I","Seguridad e Higiene Laboral","Grupo y Liderazgo","Idioma Extranjero VI","Seminario de Práctica de Hidrocarburos y Geociencia"]}]},"derecha":{"año":"Cuarto año","cuatrimestres":[{"label":"Séptimo Cuatrimestre","materias":["Derecho y Energía","Terminación y Reparación de Pozos","Sistemas Artificiales de Producción","Instalaciones de Superficie","Recuperación Secundaria y Mejorada","Práctica Profesional de Hidrocarburos y Geociencia"]},{"label":"Octavo Cuatrimestre","materias":["Implementación de Normas de Calidad","Política y Economía Ambiental","Gas y Gasolina","Industrialización de los Hidrocarburos","Emprendimientos Universitarios","Seminario Final de Hidrocarburos y Geociencia"]}]},"extras":[{"titulo":"Otros requisitos, Noveno Cuatrimestre","items":["Práctica Solidaria","Materia Electiva I","Materia Electiva II"]}]}]},{"type":"cierre","imagen":"/imagenes/imagenes_cau/entrada_estetica.png","titulo":"Estudiá con acompañamiento del CAU Villa Lugano","subtitulo":"Consultanos para conocer la modalidad y los requisitos de ingreso.","beneficios":[{"icono":"graduation-cap","texto":"Título universitario"},{"icono":"users","texto":"Acompañamiento del CAU"}]}]'::jsonb
  );
  GET DIAGNOSTICS afectadas = ROW_COUNT;
  IF afectadas <> 1 THEN RAISE EXCEPTION 'Cantidad afectada inesperada'; END IF;
  UPDATE public.carreras SET
    nombre = 'Licenciatura en Administración de Infraestructura Tecnológica',
    prefix = NULL,
    nivel = 'Grado',
    modalidad = 'Distancia',
    duracion = '4 años',
    titulo = 'Licenciado/a en Administración de Infraestructura Tecnológica',
    descripcion = 'Gestioná infraestructura y servicios tecnológicos. Planificá proyectos y recursos de tecnología.',
    enfoque = 'Planificá proyectos y recursos de tecnología.',
    seccion_duracion = '4 años. Consultá el plan de estudios y sus requisitos adicionales.',
    seccion_modalidad = 'Educación Distribuida Home (EDH): cursado virtual con instancias presenciales según el trayecto académico.',
    plan_estudios = 'Primer año
Primer Cuatrimestre
• Álgebra y Geometría
• Lógica Simbólica
• Introducción a Tecnologías de Información y Comunicaciones
• Sistemas de Información
• Introducción a los algoritmos
• Idioma Extranjero I
Segundo Cuatrimestre
• Análisis Matemático
• Programación orientada a Objetos
• Arquitectura del Computador
• Estadística y Probabilidad
• Física
• Idioma Extranjero II
Segundo año
Tercer Cuatrimestre
• Introducción a la Infraestructura Tecnológica
• Algoritmos y Estructura de Datos I
• Sistemas Operativos
• Base de Datos I
• Innovación Tecnológica
• Idioma Extranjero III
Cuarto Cuatrimestre
• Sistemas Operativos Avanzados
• Algoritmos y Estructura de Datos II
• Comunicaciones
• Legislación de Proyectos Tecnológicos
• Base de Datos II
• Idioma Extranjero IV
Tercer año
Quinto Cuatrimestre
• Inteligencia Artificial
• Computación en la Nube
• Ingeniería de Software
• Seguridad Informática
• Oratoria
• Idioma Extranjero V
Sexto Cuatrimestre
• Herramientas Matemáticas VI - Modelos de Simulación
• Redes
• Privacidad y Seguridad de los Datos
• Grupo y Liderazgo
• Idioma Extranjero VI
• Seminario de Práctica de Infraestructura  Tecnológica
Cuarto año
Séptimo Cuatrimestre
• Gestión de la Calidad, Riesgos y Evaluación de Proyectos
• Internet de las Cosas
• Auditoría de Sistemas
• Ética y Deontología Profesional
• Nanotecnología
• Práctica Profesional de Infraestructura Tecnológica
Octavo Cuatrimestre
• Desarrollo Emprendedor
• Gestión de Proyectos de Infraestructura
• Riesgo Eléctrico en Edificios e Instalaciones
• Inteligencia de Negocios
• Emprendimientos Universitarios
• Seminario Final de Infraestructura Tecnológica
Materias adicionales
• Práctica Solidaria
• Materias electivas',
    nombre_corto = 'Administración de Infraestructura Tecnológica',
    area = 'Tecnología',
    activa = true,
    orden = 17,
    slides = '[{"type":"portada","imagen_desktop":"/imagenes/gente/Header_1920x450-1.webp","imagen_desktop_position":"center","bullets":["Gestioná infraestructura y servicios tecnológicos.","Planificá proyectos y recursos de tecnología."],"badges":[{"label":"Título","value":"Licenciado/a en Administración de Infraestructura Tecnológica"},{"label":"Área","value":"Tecnología"}]},{"type":"plan_estudios","paginas":[{"izquierda":{"año":"Primer año","cuatrimestres":[{"label":"Primer Cuatrimestre","materias":["Álgebra y Geometría","Lógica Simbólica","Introducción a Tecnologías de Información y Comunicaciones","Sistemas de Información","Introducción a los algoritmos","Idioma Extranjero I"]},{"label":"Segundo Cuatrimestre","materias":["Análisis Matemático","Programación orientada a Objetos","Arquitectura del Computador","Estadística y Probabilidad","Física","Idioma Extranjero II"]}]},"derecha":{"año":"Segundo año","cuatrimestres":[{"label":"Tercer Cuatrimestre","materias":["Introducción a la Infraestructura Tecnológica","Algoritmos y Estructura de Datos I","Sistemas Operativos","Base de Datos I","Innovación Tecnológica","Idioma Extranjero III"]},{"label":"Cuarto Cuatrimestre","materias":["Sistemas Operativos Avanzados","Algoritmos y Estructura de Datos II","Comunicaciones","Legislación de Proyectos Tecnológicos","Base de Datos II","Idioma Extranjero IV"]}]}},{"izquierda":{"año":"Tercer año","cuatrimestres":[{"label":"Quinto Cuatrimestre","materias":["Inteligencia Artificial","Computación en la Nube","Ingeniería de Software","Seguridad Informática","Oratoria","Idioma Extranjero V"]},{"label":"Sexto Cuatrimestre","materias":["Herramientas Matemáticas VI - Modelos de Simulación","Redes","Privacidad y Seguridad de los Datos","Grupo y Liderazgo","Idioma Extranjero VI","Seminario de Práctica de Infraestructura  Tecnológica"]}]},"derecha":{"año":"Cuarto año","cuatrimestres":[{"label":"Séptimo Cuatrimestre","materias":["Gestión de la Calidad, Riesgos y Evaluación de Proyectos","Internet de las Cosas","Auditoría de Sistemas","Ética y Deontología Profesional","Nanotecnología","Práctica Profesional de Infraestructura Tecnológica"]},{"label":"Octavo Cuatrimestre","materias":["Desarrollo Emprendedor","Gestión de Proyectos de Infraestructura","Riesgo Eléctrico en Edificios e Instalaciones","Inteligencia de Negocios","Emprendimientos Universitarios","Seminario Final de Infraestructura Tecnológica"]}]},"extras":[{"titulo":"Materias adicionales","items":["Práctica Solidaria","Materias electivas"]}]}]},{"type":"cierre","imagen":"/imagenes/imagenes_cau/entrada_estetica.png","titulo":"Estudiá con acompañamiento del CAU Villa Lugano","subtitulo":"Consultanos para conocer la modalidad y los requisitos de ingreso.","beneficios":[{"icono":"graduation-cap","texto":"Título universitario"},{"icono":"users","texto":"Acompañamiento del CAU"}]}]'::jsonb
  WHERE id = 18;
  GET DIAGNOSTICS afectadas = ROW_COUNT;
  IF afectadas <> 1 THEN RAISE EXCEPTION 'Cantidad afectada inesperada'; END IF;
  SELECT count(*) INTO afectadas FROM public.carreras WHERE activa AND (id IN (18,63,77) OR (nivel = 'Grado' AND nombre IN ('Ambiente y Energías Renovables','Hidrocarburos y Geociencias') AND prefix = 'Grado / Licenciatura en'));
  IF afectadas <> 5 THEN RAISE EXCEPTION 'La operación no devuelve exactamente cinco carreras activas'; END IF;
END;
$alta$;
-- Devuelve únicamente las cinco filas de esta operación, incluidas las identidades nuevas.
SELECT id, nombre, prefix, nivel, modalidad, activa, updated_at
FROM public.carreras
WHERE id IN (18,63,77) OR (nivel = 'Grado' AND nombre IN ('Ambiente y Energías Renovables','Hidrocarburos y Geociencias') AND prefix = 'Grado / Licenciatura en')
ORDER BY id;
COMMIT;
