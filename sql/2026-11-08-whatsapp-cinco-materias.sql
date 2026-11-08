-- Actualiza únicamente las cinco materias indicadas que conservan el número anterior.
UPDATE materias
SET whatsapp = '5491132973801', telefono_display = '+54 9 11 3297-3801'
WHERE slug IN ('fisica', 'lengua', 'matematica', 'computacion', 'arte')
  AND whatsapp = '5491166522722';
