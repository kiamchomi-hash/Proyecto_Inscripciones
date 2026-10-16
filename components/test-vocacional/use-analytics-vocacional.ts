'use client';

import { useEffect, useState } from 'react';
import { trackVocacional } from '@/lib/analytics';
import { crearAnalyticsVocacional, type TestVocacional } from '@/lib/vocacional-analytics';

/** Una instancia estable por test; las transiciones se registran en el clic. */
export function useAnalyticsVocacional(test: TestVocacional, total: number) {
  const [medicion] = useState(() => crearAnalyticsVocacional(test, total, trackVocacional));
  useEffect(() => medicion.conectar(window), [medicion]);
  return medicion;
}
