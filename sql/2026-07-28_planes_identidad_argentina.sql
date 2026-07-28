-- Repone el plan_estudios de las 11 carreras de convenio (nivel 'Identidad
-- Argentina') desde las fichas oficiales de la Academia.
--
-- Problema: los planes cargados en Supabase eran resúmenes condensados, no el
-- temario real. El caso extremo era Fraude Financiero y Digital (id 177), que
-- directamente tenía OTRO programa -abría en "Introducción al sistema
-- financiero"-, pero el desfasaje era general: la base juntaba varios puntos
-- del temario en una sola línea y recortaba el resto. Medido el 28/07/2026,
-- de los 331 puntos que traen las fichas faltaban 162 en la base.
--
-- Fuente: Desktop\Academia Identidad Argentina\fichas-diplomaturas\*.txt,
-- generadas el 25/07/2026 desde las landings de identidadargentina.com.ar.
-- Los PDF oficiales de esa carpeta son de imagen: no se pueden cotejar.
--
-- Formato: lo parsea parsePlan() en components/index/ia-modal.tsx — bloques
-- separados por línea en blanco, cabecera "Módulo N: título", puntos con "• ".
-- Solo se toca `plan_estudios`; `descripcion`, `enfoque` y `seccion_modalidad`
-- ya coinciden con las fichas.
--
-- ── Limpieza aplicada sobre las fichas ──
-- Las fichas se extrajeron de PDF a dos columnas y arrastran artefactos. Lo que
-- se corrigió, para que quede asentado y no parezca invención:
--
-- 1. Puntos pegados con " - ". Solo en Gestión de Equipos, 3 casos, cada uno
--    partido en dos: "Componentes básicos de un EAD - Ceremonias necesarias…",
--    "Capitalización de aprendizajes - Conversaciones sobre el equipo" y
--    "Qué es la IE… - Qué son las emociones…". El módulo 1 pasa de 4 puntos a 5.
--    En IA el patrón "1 - " es numeración y en Constitución los guiones son
--    enumeración: ahí no se partió nada.
-- 2. Rótulos "Unidad N" sueltos como punto (Oratoria, RRHH): se saca el rótulo
--    y se conserva el texto. En RRHH módulo 2 había un "Unidad 2:" sin texto
--    detrás: se elimina.
-- 3. Numeración "N - " de la ficha de IA: se saca el número y el punto se une
--    con la línea de explicación que venía abajo, que era su continuación.
-- 4. Puntos partidos al medio por el salto de columna, unidos:
--    Compliance "…(Ley 25264, Normativa" + "UIF, Recomendaciones GAFI…";
--    Constitución "Constitucion De S.A. Mediante." + "Plataforma Digital De I.P.J.".
-- 5. Cortes y erratas: Compliance "protección al denuncian" → "denunciante";
--    Bienestar "RÁCTICAS" → "PRÁCTICAS"; Constitución "NOCIO- NES" → "NOCIONES";
--    IA "Modelos de Lenguagje Grandes" → "lenguaje".
-- 6. Compliance: la ficha cita la "Ley 25264", que no es la de PLA/FT. Es la
--    25.246 (Encubrimiento y Lavado de Activos), con los dígitos permutados.
--    Se corrigió el número. Si se prefiere respetar la ficha al pie de la
--    letra, este es el único punto donde se cambió un dato, no una forma.
-- 7. IA, módulo 6: la ficha repite ahí "Definiciones y requerimientos para la
--    implementación de agentes de IA", que es la explicación del módulo 5
--    pegada por error bajo "Cómo los algoritmos pueden afectar la ética". Se
--    eliminó la repetición.
-- 8. Normalización menor de redacción donde la extracción dejó comas o
--    concordancias sueltas: Hotelero "turismo de ocio,: … de conducta, de
--    viajeros" y "entornos complejos, orientadas al desarrollo"; RRHH
--    "Procedimientos Altas y bajas" y "Concepto Marca empleadora". Mismo
--    contenido, sin agregados.
--
-- ── Dos decisiones que conviene revisar ──
-- a) Bienestar Integral: la ficha titula los módulos 2 a 6 literalmente
--    "MÓDULO 2" … "MÓDULO 6", sin nombre. Se conservan los títulos que ya tenía
--    la base (Energía, Neurociencias, Epigenética y movimiento, Conciencia y
--    meditación, Inteligencia Emocional), que describen bien los puntos de cada
--    uno. Su módulo 1 además parece haber perdido dos puntos en la extracción:
--    "LA BIENVENIDA" quedó como título y "DISPOSICIÓN PARA APRENDER" aparece
--    cortado a "APRENDER" (en la ficha de Mindfulness los dos están enteros y
--    como puntos). Se dejó tal cual la ficha; si hay que reponerlos, es acá.
-- b) Mindfulness: la base tenía 8 módulos y la ficha trae 4. No se pierde
--    contenido -la ficha tiene 30 puntos contra 15 de la base, con el mismo
--    temario repartido en menos módulos-, pero es un cambio visible.
--
-- Correr en el SQL Editor del dashboard de Supabase.

begin;

-- ── 172 · Oratoria ──
update public.carreras set plan_estudios = $plan$Módulo 1: Introducción a la Oratoria
• ¿Qué es la oratoria?
• Definición y alcance.
• Historia y evolución.
• Fines y objetivos de la oratoria.
• Importancia en la vida personal y profesional.
• Clasificación de la oratoria.

Módulo 2: Superando el Miedo a Hablar en Público
• Causas del miedo.
• Estrategias y recursos para superar el miedo.

Módulo 3: La Humanización de los Discursos y la Planificación
• La humanización de los discursos.
• Conexión emocional con la audiencia.
• Uso de historias y anécdotas personales.
• Importancia de la planificación.
• Métodos de investigación y recopilación de información.
• Organización y estructura del contenido.

Módulo 4: Estructura del Discurso y Técnicas de Expresión
• Las partes del discurso.
• Introducción: captar la atención.
• Cuerpo: desarrollo de argumentos.
• Conclusión: resumen y cierre impactante.
• La voz y la respiración.
• Técnicas de respiración para el control vocal.
• Modulación y proyección de la voz.

Módulo 5: Comunicación No Verbal y Recursos de Apoyo
• La comunicación no verbal.
• Importancia del lenguaje corporal.
• Gestos, posturas y expresiones faciales.
• Recursos de apoyo en los discursos.
• Uso de ayudas visuales (presentaciones, gráficos, etc.).$plan$
where id = 172 and nombre = 'Diplomatura en Oratoria';

-- ── 173 · Gestión de Equipos de Alto Desempeño ──
update public.carreras set plan_estudios = $plan$Módulo 1: Para qué construir equipos de alto desempeño
• Introducción a una nueva cultura de trabajo.
• Nuevos desafíos para la gestión.
• De qué hablamos cuando de equipos se trata.
• Componentes básicos de un EAD (Equipo Alto Desempeño).
• Ceremonias necesarias en la vida de un equipo.

Módulo 2: La confianza como base fundamental
• Seguridad psicológica.
• La estructura de la confianza.
• El poder de conectar con la vulnerabilidad.
• Roles en el equipo.

Módulo 3: La importancia de tener una meta compartida
• Construcción de visión, misión y valores de equipo.
• Construcción de objetivos comunes.
• Reglas.

Módulo 4: Performance
• Cómo trabajar por proyectos.
• Desarrollo de compromisos.
• Herramientas de seguimiento (reuniones efectivas).
• Ciclo de coordinación de acciones.

Módulo 5: Retrospectiva y aprendizajes
• Conversaciones de feedback.
• Mentalidad de crecimiento.
• Capitalización de aprendizajes.
• Conversaciones sobre el equipo.

Módulo 6: Conversaciones efectivas
• Componentes de una conversación.
• Escucha e indagación.
• Tipos de conversaciones.

Módulo 7: Abordaje de conflictos
• Componentes de un conflicto.
• Metodología para abordar conflictos.
• Cuándo escuchar, cuándo hablar.
• Impacto de la intencionalidad al hablar.

Módulo 8: Inteligencia Emocional
• Qué es la IE y cuál es su importancia en el rendimiento laboral.
• Qué son las emociones y para qué sirven.
• ¿Controlar o gestionar emociones?
• Empatía, qué es y cómo se desarrolla.$plan$
where id = 173 and nombre = 'Diplomatura en Gestión de Equipos de Alto Desempeño';

-- ── 174 · Mindfulness y Técnicas de Gestión del Estrés ──
update public.carreras set plan_estudios = $plan$Módulo 1: Introducción al mundo del Mindfulness y a la Biodecodificación
• LA BIENVENIDA: comenzando el viaje.
• DISPOSICIÓN PARA APRENDER: formando el camino paso a paso.
• EGO/DESAPEGO: desempañando el espejo para reconocernos mejor.
• PERCEPCIÓN Y HÁBITOS: mente; propiocepción; interocepción.
• FRACTALIDAD: patrones comunes que nos vinculan con todo.
• PALABRAS/SONIDOS: su impacto creador y poder vibratorio.
• ANEXOS: comunicación y escucha / conciencia global / higiene postural.
• PRÁCTICAS.

Módulo 2: La atención y el cerebro. Introducción a la práctica sentada
• CONCIENCIA: qué será y dónde reside.
• ATENCIÓN PLENA (MINDFULNESS): de qué se trata; habitarnos en el ahora y permitirnos “ser”.
• MEDITACIÓN: acercándonos a este bello camino y transitar sus bondades.
• BENEFICIOS DE LA MEDITACIÓN.
• EL SENDERO EMOCIONAL: emociones, sentimientos, reacciones.
• ANEXOS: relajación / trampas psicológicas / valores.
• PRÁCTICAS.

Módulo 3: Influencia del yoga en la gestión de pensamientos
• NEUROCIENCIA/NEUROPLASTICIDAD: aproximaciones a sus conceptos generales.
• COMPOSICIÓN BÁSICA DEL SISTEMA NERVIOSO: comprendiendo los procesos orgánicos que regulan emociones y conductas.
• EL FAMOSO CUARTETO QUÍMICO DEL BIENESTAR: neurotransmisores.
• EJE CORAZÓN/CEREBRO.
• EJE MICROBIOTA/INTESTINO/CEREBRO.
• RESPIRACIÓN.
• ANEXOS: evolución del cerebro / comunicación y neuronas espejo.
• PRÁCTICAS.

Módulo 4: Estrés. Introducción a la mirada sistémica
• EFECTOS FISIOLÓGICOS MÁS ESPECÍFICOS DE LA MEDITACIÓN.
• INTELIGENCIA EMOCIONAL.
• ESTRÉS.
• DOLOR/SUFRIMIENTO.
• BURNOUT.
• AFECTO – COMPASIÓN – AMABILIDAD.
• PRÁCTICAS.$plan$
where id = 174 and nombre = 'Curso de Mindfulness y Técnicas de Gestión del Estrés';

-- ── 175 · Bienestar Integral ──
update public.carreras set plan_estudios = $plan$Módulo 1: La Bienvenida — comenzando el viaje
• APRENDER: formando el camino paso a paso.
• EL YO CON MINÚSCULAS / EGO / DESAPEGO.
• PERCEPCIÓN Y HÁBITOS: mente; propiocepción; interocepción. PATRONES COMUNES: fractalidad.
• SONIDOS Y PALABRAS: su impacto creador y poder vibratorio.
• EL SENDERO EMOCIONAL: emociones, sentimientos, reacciones.
• ANEXOS: comunicación (la escucha) / conexión naturaleza en todo.
• PRÁCTICAS.

Módulo 2: Energía
• ENERGÍA: qué es eso que tanto se menciona.
• CAMPOS DE ENERGÍA.
• PRANA.
• LUZ: vislumbrando ese destello en el ser.
• RITMOS CIRCADIANOS – RELOJES BIOLÓGICOS.
• GLÁNDULA PINEAL.
• EL BUEN DORMIR – SUEÑO.
• ANEXOS: campo energético de la tierra / teoría general de sistemas.
• PRÁCTICAS.

Módulo 3: Neurociencias
• NEUROCIENCIAS / NEUROPLASTICIDAD: aproximaciones a sus conceptos generales.
• COMPOSICIÓN BÁSICA DEL SISTEMA NERVIOSO.
• EL FAMOSO CUARTETO QUÍMICO DEL BIENESTAR.
• EJE CORAZÓN – CEREBRO.
• EJE MICROBIOTA – INTESTINO – CEREBRO.
• RESPIRACIÓN: la nutrición primordial.
• SONREIR – REIR – CALMAR.
• ANEXOS: comunicación y neuronas espejo / relación armoniosa con la alimentación.
• PRÁCTICAS.

Módulo 4: Epigenética y movimiento
• GLÁNDULA TIMO.
• EPIGENÉTICA: por encima de la genética.
• CREENCIAS – PROGRAMAS INSTAURADOS.
• EL TIEMPO: qué es eso tras lo que se suele “correr”.
• IMPORTANCIA DEL EJERCICIO FÍSICO.
• APROXIMACIÓN AL YOGA.
• EL BELLO APORTE DE LA MÚSICA – FRECUENCIAS BENEFICIOSAS.
• ANEXOS: higiene postural / resolución ONU Día del Yoga.
• PRÁCTICAS.

Módulo 5: Conciencia y meditación
• CONCIENCIA.
• ATENCIÓN PLENA/MINDFULNESS: de qué se trata; habitarnos en el ahora y permitirnos “ser”.
• MEDITACIÓN: acercarnos a este bello camino y transitar sus bondades.
• BENEFICIOS DE LA MEDITACIÓN.
• EFECTOS FISIOLÓGICOS DE LA MEDITACIÓN.
• VALORES.
• RELAJACIÓN.
• ANEXOS: conciencia global Interser / trampas psicológicas.
• PRÁCTICAS.

Módulo 6: Inteligencia Emocional
• INTELIGENCIA EMOCIONAL.
• ESTRÉS.
• DOLOR Y SUFRIMIENTO.
• BURNOUT (SÍNDROME DEL QUEMADO).
• ARMONÍA.
• AHIMSA (LA NO VIOLENCIA).
• AFECTO – COMPASIÓN – AMABILIDAD.
• ANEXO: resolución ONU Día de la no violencia.
• PRÁCTICAS.$plan$
where id = 175 and nombre = 'Diplomatura en Bienestar Integral: Herramientas para Transformar-te';

-- ── 176 · Integral en RRHH ──
update public.carreras set plan_estudios = $plan$Módulo 1: Introducción a la Gestión del Capital Humano y contrato de trabajo
• Historia y evolución de los Recursos Humanos.
• Funciones del área Gestión de Talentos.
• Diseño de estructura organizacional.
• Job description.
• Contrato de trabajo.
• Procedimientos de altas y bajas.
• Confección de legajos.
• Gestión laboral y nóminas.
• Accidentes / prevención de riesgos laborales.
• Sindicatos.
• Manual de Políticas, Normas y Procedimientos. Diseño, desarrollo e implementación.
• Principales indicadores de administración de Recursos Humanos.
• Código de ética.

Módulo 2: Atracción y selección de talentos. Desarrollo, capacitación y gestión del desempeño
• Proceso de reclutamiento: fuentes, técnicas, redes sociales y portales.
• Proceso de selección y evaluación de candidatos.
• Tecnología en el reclutamiento.
• Desafíos en el proceso.
• Perfiles más requeridos en el mercado.
• La gestión del conocimiento.
• Identificación de necesidades de capacitación.
• Diseño y ejecución de programas de formación.
• Evaluación de la efectividad de la formación.
• Sistemas de evaluación del desempeño.
• Técnicas de feedback efectivo.
• Desarrollo de planes de mejora y carrera.

Módulo 3: Compensaciones, beneficios y clima laboral. Gestión de comunicación interna
• Estrategias de compensación.
• Diseño de paquetes de beneficios.
• Gestión del bienestar integral del empleado.
• Gestión de clima laboral.
• Concepto de marca empleadora.
• Comunicación efectiva.
• Plan de comunicación interna.
• Herramientas de comunicación interpersonal.
• Las reuniones.
• Comunicación 2.0. Nuevas herramientas: storytelling, engagement.

Módulo 4: Tendencias y desafíos emergentes
• Introducción al mundo VICA.
• Transformación digital en Recursos Humanos.
• Diversidad e inclusión en el lugar de trabajo.
• Nuevas formas de trabajo.
• Introducción a las metodologías ágiles.$plan$
where id = 176 and nombre = 'Diplomatura Integral en RRHH';

-- ── 177 · Fraude Financiero y Digital ──
-- El caso que disparó la revisión: el plan cargado era otro programa entero.
update public.carreras set plan_estudios = $plan$Módulo 1: Panorama del fraude financiero y digital
• Evolución del fraude en la economía y los negocios.
• Actores, escenarios y ecosistemas afectados.
• Diferencias entre fraude financiero, operativo y cibernético.
• Impacto económico y reputacional.

Módulo 2: Principales tipologías de fraude
• Fraudes internos y externos.
• Robo o suplantación de identidad.
• Falsificación documental y contable.
• Fraude digital: phishing, vishing, smishing, malware.
• Fraudes en ventas, pagos, préstamos y compras online.

Módulo 3: Comportamiento del defraudador y triángulo del fraude
• Factores psicológicos y motivacionales.
• Tipologías del defraudador.
• Triángulo y diamante del fraude: presión, oportunidad, racionalización y capacidad.
• Detección temprana y señales de alerta.

Módulo 4: Gestión del riesgo de fraude
• Identificación y evaluación de riesgos.
• Construcción de una Matriz de Riesgo de Fraude.
• Controles preventivos y medidas mitigantes.
• Seguimiento, monitoreo y mejora continua.

Módulo 5: Herramientas tecnológicas de prevención
• Herramientas de monitoreo, scoring y alertas.
• IA y análisis de datos para detectar patrones inusuales.
• Ciberseguridad aplicada a la gestión de riesgos.
• Evaluación y selección de proveedores tecnológicos.
• Desarrollo in house.

Módulo 6: Fraude en la empresa y responsabilidades del management
• Fraude interno: detección, investigación y respuesta.
• Responsabilidad penal y administrativa de las empresas.
• Rol del compliance y las auditorías internas.
• Buenas prácticas de gobernanza.

Módulo 7: Cultura organizacional y prevención
• Código de ética, canal de denuncias y formación continua.
• Construcción de una cultura de integridad y responsabilidad compartida.
• Comunicación interna y liderazgo ético.
• Presupuesto y estructura del programa antifraude.

Módulo 8: Indicadores, tableros y mejora continua
• Indicadores de impacto económico y reputacional.
• Medición de la efectividad del programa.
• Tableros de control y reportes ejecutivos.
• Evaluación de desempeño de los controles.
• Retroalimentación para la mejora del sistema preventivo.

Módulo 9: Actuación frente al fraude y proceso legal
• Procedimientos ante incidentes de fraude.
• Documentación y evidencia digital.
• Denuncia, pericias y seguimiento judicial.$plan$
where id = 177 and nombre = 'Diplomatura en Fraude Financiero y Digital';

-- ── 178 · Inteligencia Artificial ──
update public.carreras set plan_estudios = $plan$Módulo 1: Introducción a la Inteligencia Artificial
• Definición de Inteligencia Artificial: definición y alcances de la IA. Diferencias entre IA y un simple programa de software.
• Breve historia y evolución de la Inteligencia Artificial: desde los modelos simples basados en reglas de los años 50 hasta el aprendizaje profundo y los sistemas generativos actuales.
• Distintos tipos de IA.
• IA basada en reglas y sistemas expertos: sistemas que siguen instrucciones predefinidas sin capacidad de aprendizaje.
• Aprendizaje automático (Machine Learning): modelos que analizan datos para mejorar su desempeño con el tiempo.
• Redes neuronales y Deep Learning: algoritmos inspirados en el cerebro humano que permiten procesar grandes volúmenes de información.
• Usos y aplicaciones de la Inteligencia Artificial en el presente.

Módulo 2: IA basada en reglas e introducción al aprendizaje automático
• Sistemas expertos y modelos basados en reglas: sistemas que toman decisiones en base a lógica predefinida. Uso en diagnóstico médico y gestión empresarial.
• Árboles de decisión y redes bayesianas: métodos para clasificación y toma de decisiones basados en probabilidades.
• Introducción al aprendizaje automático: primer acercamiento a los algoritmos que encuentran patrones en datos para mejorar su desempeño.

Módulo 3: IA basada en redes neuronales y Deep Learning
• Redes neuronales artificiales: conceptos fundamentales sobre modelos inspirados en el cerebro humano que procesan datos en múltiples capas.
• Redes neuronales profundas y convolucionales (CNNs): redes especializadas en reconocimiento de imágenes y procesamiento de datos complejos.
• Ejemplos prácticos de implementación de redes neuronales, eventualmente en Python.

Módulo 4: IA generativa e IA aplicada
• Concepto de IA generativa: modelos capaces de generar texto, imágenes y código.
• Redes transformadoras (Transformers): análisis del mecanismo detrás de los modelos de lenguaje avanzados.
• Procesamiento de Lenguaje Natural (Natural Language Processing): técnicas que permiten a la IA interpretar, generar y comprender el lenguaje humano.
• Modelos de lenguaje grandes (Large Language Models).

Módulo 5: Introducción a Prompt Engineering y agentes de IA
• Optimización de prompts para NLP y LLM: cómo estructurar preguntas y comandos para obtener respuestas más precisas y relevantes de los modelos de lenguaje.
• Testeo y comparación de prompts.
• Funcionamiento y alcance de los agentes de IA: definiciones y requerimientos para su implementación.

Módulo 6: Riesgos, ética y desafíos futuros
• Riesgos de implementación: degradación de los sistemas de IA una vez implementados e impacto en su funcionamiento.
• Cómo los algoritmos pueden afectar la ética y desafíos de uso responsable.
• Regulación y responsabilidad en la automatización: impacto de la IA en la vida cotidiana.
• Tendencias futuras de la IA: avances en computación cuántica e IA autoconsciente.$plan$
where id = 178 and nombre = 'Diplomatura en Inteligencia Artificial';

-- ── 179 · Constitución de Sociedades ──
update public.carreras set plan_estudios = $plan$Módulo 1: Nociones conceptuales S.A. – S.A.S. – S.R.L.
• Marco teórico y normativo de las S.A. y S.A.S.

Módulo 2: Constitución de S.A. y de S.A.S. — Plataforma de IPJ
• Constitución de S.A. mediante plataforma digital de I.P.J.
• Recomendaciones prácticas a la hora de constituir S.A. y S.A.S.
• Rubricación de libros societarios físicos y digitales.

Módulo 3: Constitución de S.R.L. — Plataforma de IPJ
• Constitución de S.R.L. mediante plataforma digital de I.P.J.
• Recomendaciones prácticas a la hora de constituir una S.R.L.
• Rubricación de libros societarios físicos y digitales.

Módulo 4: Asesoramiento al cliente y nociones básicas de la plataforma de IPJ
• Pedidos de informes de documentos inscriptos de sociedades en I.P.J.$plan$
where id = 179 and nombre = 'Curso de Constitución de Sociedades S.A, S.A.S, S.R.L';

-- ── 180 · Marketing para Emprendedores ──
update public.carreras set plan_estudios = $plan$Módulo 1: Introducción al Marketing para Emprendedores
• Entender qué es el marketing y su importancia para los negocios.
• Diferenciar entre marketing, ventas y publicidad.
• Reconocer cómo el marketing puede potenciar un negocio.

Módulo 2: Conociendo a tu Cliente Ideal
• Aprender a segmentar el mercado y definir el público objetivo.
• Crear perfiles de cliente (buyer personas).
• Técnicas para entender las necesidades y deseos de los clientes.

Módulo 3: Diseñar y ejecutar campañas de marketing efectivas
• Planificar campañas alineadas con objetivos claros utilizando metodologías SMART.
• Desarrollar mensajes persuasivos adaptados al público objetivo.
• Seleccionar los canales adecuados, tanto digitales como tradicionales, para maximizar resultados.

Módulo 4: Aplicar técnicas de medición y análisis de resultados
• Conocer las métricas clave que indican el éxito o las áreas a mejorar en las campañas.
• Utilizar herramientas analíticas para recopilar datos relevantes.
• Interpretar resultados para ajustar estrategias futuras.

Módulo 5: Utilizar herramientas digitales y tradicionales
• Conocer las principales herramientas digitales disponibles para pequeñas empresas.
• Comprender cómo integrar medios tradicionales en la estrategia global.
• Aprender a seleccionar las mejores plataformas según el perfil del cliente.

Módulo 6: Construcción de Marca y Reputación
• Comprender cómo crear una marca sólida y coherente.
• Reconocer la importancia del servicio al cliente y la fidelización.
• Aprender a gestionar la reputación online y offline.

Módulo 7: Cómo Elaborar un Plan de Marketing Efectivo
• Análisis y situación de la empresa.
• Definición y objetivos de marketing.
• Planificación y control del plan.

Módulo 8: Gestionar recursos y presupuestos de marketing de manera eficiente
• Aprender a planificar presupuestos alineados con los objetivos estratégicos del negocio.
• Priorizar acciones según el retorno esperado.
• Controlar gastos mediante informes periódicos que permitan decisiones acertadas futuras.$plan$
where id = 180 and nombre = 'Diplomatura en Marketing para Emprendedores y Dueños de Negocios';

-- ── 181 · Compliance ──
update public.carreras set plan_estudios = $plan$Módulo 1: Fundamentos del Compliance Corporativo
• Origen y evolución del Compliance.
• Marco normativo nacional e internacional.
• Ética empresarial y cultura organizacional.
• Gobierno corporativo y responsabilidad de los directores.
• Rol y responsabilidades del Oficial de Cumplimiento.

Módulo 2: Diseño de Programas de Cumplimiento
• Elementos clave de un programa de compliance.
• Evaluación de riesgos no financieros (corrupción, conflicto de intereses, fraude).
• Políticas internas, códigos de conducta y manuales de procedimientos. Canales de denuncia y protección al denunciante.
• Monitoreo, seguimiento y mejora continua.
• Reportes a la alta dirección y comités de ética.
• Gestión de incumplimientos y medidas disciplinarias.
• Capacitación.

Módulo 3: Sistemas de Prevención de Lavado de Activos y Financiamiento del Terrorismo (PLA/FT)
• Introducción a los sistemas de prevención de lavado de activos y financiamiento del terrorismo.
• Marco normativo nacional e internacional (Ley 25.246, normativa UIF, recomendaciones GAFI, etc.). Sujetos obligados.

Módulo 4: Casos Prácticos, Tendencias y Desafíos Emergentes
• Estudio de casos locales e internacionales.
• Compliance en el contexto ESG (ambiental, social y de gobernanza).
• Automatización y tecnologías aplicadas al cumplimiento (RegTech).
• Desafíos en la gestión de terceros y cadena de suministro.
• Compliance en empresas familiares, startups y pymes.$plan$
where id = 181 and nombre = 'Diplomatura en Compliance';

-- ── 182 · Management Hotelero ──
update public.carreras set plan_estudios = $plan$Módulo 1: Visión del nuevo contexto del negocio hotelero
• Panorama actual de la industria hotelera internacional y nacional. Aspectos coyunturales y transformaciones estructurales.
• Tendencias del turismo de ocio: nuevos perfiles y patrones de conducta de los viajeros.
• Hoteles de nueva generación: flexibilidad, propósito y autenticidad.
• Impacto del ecosistema digital en la estrategia y gestión del negocio.
• Cambios de paradigma: del alojamiento a la experiencia integral.

Módulo 2: Competitividad
• Cómo y por qué desarrollar estrategias integrales de marketing, ventas y posicionamiento que fortalezcan la competitividad del establecimiento.
• Variables clave: mercados, canales y productos.
• Gestión del mix de marketing (producto, precio, distribución, promoción).
• Comparación competitiva y benchmarking.
• Gestión de marca y comunicación estratégica y táctica.
• Marketing digital: políticas y criterios esenciales que debe manejar la dirección y los managers no especialistas.

Módulo 3: Calidad
• Analizar la calidad como herramienta estratégica: un análisis desde la perspectiva comercial, económica y operativa.
• El concepto de calidad en la experiencia hotelera: un enfoque multidimensional.
• Componentes y estándares de un programa de calidad.
• Calidad percibida vs. calidad operativa.
• Calidad extrema: un enfoque más allá de la idea de satisfacción.

Módulo 4: Capital humano, liderazgo y gestión de la organización
• Liderazgo y gestión en entornos complejos, orientados al desarrollo del talento y la cohesión organizacional.
• Desarrollo de recursos humanos en contextos con múltiples restricciones.
• El rol del gerente: liderazgo y toma de decisiones.
• Modelos de liderazgo situacional y liderazgo de servicio.
• Estructuras dinámicas y nuevas tendencias organizacionales.
• Gestión de equipos multigeneracionales y multiculturales.
• Cultura organizacional y su impacto en la experiencia del huésped.
• Herramientas de coaching y feedback para la mejora del desempeño.

Módulo 5: Creación y gestión de valor económico
• Comprender y aplicar las herramientas de análisis económico-financiero para optimizar los resultados del negocio hotelero.
• Enfoque estratégico de la creación de valor.
• Profit management: integración entre ingresos, costos e inversiones.
• Indicadores de gestión (RevPAR, ADR, GOPPAR, TRevPAR).
• Construcción de escenarios financieros y análisis de riesgo.
• Gestión de flujo de caja y control de gastos operativos.
• Evaluación de proyectos de inversión y valuación de negocios hoteleros.
• Herramientas para medir rentabilidad por segmento o canal.

Módulo 6: Proyectos hoteleros
• Desarrollar competencias para evaluar, planificar y ejecutar nuevos proyectos hoteleros, desde la concepción hasta la apertura.
• Determinación del atractivo y viabilidad de nuevos negocios.
• Organización y gestión de proyectos hoteleros.
• Etapas del programa de trabajo: estudio, desarrollo, implementación.
• Planificación de aperturas y control de start-up.
• Estructuras de financiamiento y fideicomisos inmobiliarios para proyectos hoteleros.
• Estrategias de preopening y posicionamiento inicial.
• Gestión de proveedores y alianzas estratégicas en la etapa de lanzamiento.$plan$
where id = 182 and nombre = 'Diplomatura en Management Hotelero';

commit;

-- Verificación. Tienen que salir las 11 filas con estos conteos:
--   172 Oratoria              5 mod / 26 puntos
--   173 Gestión de Equipos    8 mod / 31 puntos
--   174 Mindfulness           4 mod / 30 puntos
--   175 Bienestar Integral    6 mod / 52 puntos
--   176 Integral en RRHH      4 mod / 40 puntos
--   177 Fraude Financiero     9 mod / 38 puntos
--   178 Inteligencia Artif.   6 mod / 24 puntos
--   179 Const. Sociedades     4 mod /  8 puntos
--   180 Marketing Emprend.    8 mod / 24 puntos
--   181 Compliance            4 mod / 19 puntos
--   182 Management Hotelero   6 mod / 40 puntos
select
  id,
  nombre,
  (length(plan_estudios) - length(replace(plan_estudios, 'Módulo ', ''))) / 7 as modulos,
  (length(plan_estudios) - length(replace(plan_estudios, '• ', ''))) / 2      as puntos
from public.carreras
where nivel = 'Identidad Argentina'
order by id;

-- Después de correrlo: revalidar/redeploy para que el ISR (revalidate = 3600)
-- tome los planes nuevos en la home y en cada /carreras/<slug>.
