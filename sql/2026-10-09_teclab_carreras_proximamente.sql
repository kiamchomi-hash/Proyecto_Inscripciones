-- Alta de cinco carreras nuevas de Teclab como «Próximamente».
--
-- Contexto: el Dashboard Comercial de Teclab v4.0 (05/10/2026) anuncia cinco
-- carreras nuevas -Fintech, Acompañamiento Terapéutico, Producto Digital,
-- Gestión de Alimentos y Energías Renovables- pero su Knowledge Pack está
-- vacío: no hay plan de estudios, duración, título, certificado intermedio ni
-- empresa de cocreación, y teclab.edu.ar todavía no las publica. Se publican
-- igual para que la ficha empiece a indexar y junte avisos antes de que abra la
-- inscripción, con sólo lo confirmado: `proximamente = true` y el resto en null.
--
-- Los nombres son provisorios («Tecnicatura Superior en <X>», como las otras
-- dieciséis). Si el nombre oficial difiere, se corrige `nombre` (y
-- `nombre_corto`) en la fila: el slug cambia solo y el viejo redirige al nuevo,
-- porque /carreras/[slug] compara contra el slug canónico.
--
-- La última oración de cada `descripcion` es la salida laboral a propósito:
-- partirDescripcionTeclab (components/index/teclab.ts) la separa del perfil.
--
-- `modalidad` va en '100% Online', como las dieciséis tecnicaturas del
-- instituto: la columna no admite null.
--
-- Requiere el código que tolera una Teclab `proximamente` sin datos ya
-- publicado: el trigger de `carreras` revalida las páginas al instante.
--
-- Correr con `npm run db -- --archivo sql/2026-10-09_teclab_carreras_proximamente.sql`
-- (rol cau_editor) o en el SQL Editor del dashboard de Supabase.
-- Es idempotente: una fila cuyo nombre ya existe no se vuelve a insertar.

insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  nuevas.nombre, nuevas.nivel, 'Tecnicatura Superior en', nuevas.nombre_corto, nuevas.descripcion, '100% Online',
  null, null, null, null, null, null, null,
  nuevas.orden, true, false, false, true
from (values
  (
    'Tecnicatura Superior en Fintech',
    'Teclab - Tecnología',
    'Fintech',
    'Estudiá fintech a distancia: la tecnología que cambió cómo se paga, se presta y se invierte, desde billeteras virtuales y pagos digitales hasta banca online y análisis de datos financieros. Es un área donde se cruzan las finanzas y el desarrollo de productos digitales, y una de las que más crece en la Argentina. La salida laboral está en fintechs, bancos digitales, billeteras, procesadoras de pago y áreas de innovación financiera.',
    1101
  ),
  (
    'Tecnicatura Superior en Acompañamiento Terapéutico',
    'Teclab - Gestión',
    'Acompañamiento Terapéutico',
    'Estudiá acompañamiento terapéutico con Teclab y formate para acompañar a personas en tratamiento de salud mental, con discapacidad, con consumos problemáticos o adultos mayores, en su casa, en la escuela o en la comunidad. El acompañante terapéutico trabaja dentro de un equipo de salud, siguiendo la estrategia que define el profesional a cargo. La salida laboral está en instituciones de salud, equipos interdisciplinarios, prestadoras de discapacidad, escuelas y acompañamientos particulares.',
    1102
  ),
  (
    'Tecnicatura Superior en Producto Digital',
    'Teclab - Tecnología',
    'Producto Digital',
    'Estudiá producto digital a distancia: cómo se piensa, se diseña y se mejora una app o una plataforma, desde la investigación con usuarios y el prototipo hasta las métricas y la priorización del roadmap. Es el rol que une negocio, diseño y desarrollo en equipos que trabajan con metodologías ágiles. La salida laboral está en empresas de software, startups, e-commerce y áreas digitales de cualquier rubro, como product owner, analista o asistente de producto.',
    1103
  ),
  (
    'Tecnicatura Superior en Gestión de Alimentos',
    'Teclab - Gestión',
    'Gestión de Alimentos',
    'Estudiá gestión de alimentos a distancia y aprendé cómo se organiza la producción, la calidad y la seguridad de lo que comemos, de la materia prima a la góndola. Es un campo donde pesan la higiene y la inocuidad, las normas de calidad y la logística de una cadena que no puede cortarse. La salida laboral está en industrias alimenticias, servicios de comida, gastronomía, supermercados y áreas de calidad.',
    1104
  ),
  (
    'Tecnicatura Superior en Energías Renovables',
    'Teclab - Tecnología',
    'Energías Renovables',
    'Estudiá energías renovables a distancia: cómo se aprovechan la energía solar, la eólica y otras fuentes limpias, y cómo se planifica, se instala y se mantiene un sistema que las use. Es un sector que crece con la transición energética y con la demanda de eficiencia en hogares, empresas e industrias. La salida laboral está en empresas de energía, instaladoras de sistemas solares, consultoras de eficiencia energética y áreas técnicas de la industria.',
    1105
  )
) as nuevas (nombre, nivel, nombre_corto, descripcion, orden)
where not exists (
  select 1 from public.carreras c where c.nombre = nuevas.nombre
);
-- Esperado: INSERT 0 5 la primera vez; INSERT 0 0 si se vuelve a correr.

-- Verificar
select id, nombre, nivel, nombre_corto, orden, activa, proximamente,
       duracion, titulo, enfoque, plan_estudios is null as sin_plan, slides is null as sin_slides
from public.carreras
where orden between 1101 and 1105
order by orden;
-- Esperado: 5 filas, activa y proximamente en true, sin duración, título,
-- enfoque, plan ni slides.

-- Para revertir:
--   delete from public.carreras
--   where proximamente = true
--     and nombre in (
--       'Tecnicatura Superior en Fintech',
--       'Tecnicatura Superior en Acompañamiento Terapéutico',
--       'Tecnicatura Superior en Producto Digital',
--       'Tecnicatura Superior en Gestión de Alimentos',
--       'Tecnicatura Superior en Energías Renovables'
--     );
--
-- Cuando abra la inscripción, en vez de borrar: completar duracion, titulo,
-- enfoque, plan_estudios y seccion_modalidad y pasar proximamente a false.
