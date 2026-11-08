-- Cambia solamente el destino de WhatsApp en las ocho novedades indicadas.
UPDATE novedades
SET contenido = replace(contenido, 'https://wa.me/5491166522722', 'https://wa.me/5491132973801')
WHERE publicada = 1
  AND slug IN (
    'inicio-de-clases',
    'documentacion-legajo-inscripcion',
    'que-es-el-cau-villa-lugano',
    'clases-de-apoyo-como-reservar-turno',
    'carreras-de-grado-a-distancia',
    'tecnicaturas-pregrado-dos-tres-anos',
    'ivu-universitario-21-inicio-cursada',
    'inscripciones-octubre-carreras-distancia'
  )
  AND instr(contenido, 'https://wa.me/5491166522722') > 0;
