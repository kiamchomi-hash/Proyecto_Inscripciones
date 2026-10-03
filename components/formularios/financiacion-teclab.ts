// Financiación de Teclab: la placa «Opciones de financiación» del período,
// vuelta datos. Es la única fuente del sitio y la usa «Ver precio» (las
// opciones generales). La autoinscripción ya no pregunta banco ni tarjeta: el
// portal del alumno los toma solo.
//
// Fuente: ventas/fuentes/teclab/conocimiento-hermes/financiacion_teclab.md
// (placa oficial del período 2B), vigente desde el 26/08/2026. Hay que
// actualizar este archivo con cada placa nueva: las tasas y los CFT cambian
// por período. El volcado del simulador de Teclab (`financiacion_teclab.json`)
// contradice la placa y no se usa.
//
// Autocontenido a propósito: sin imports, para que lo puedan importar los
// componentes del navegador sin arrastrar nada más.

// Porcentajes tal como figuran en la placa.
const TASA_PREFERENCIAL = { interes: 6.15, cft: 43.34 };
const TASA_RESTO = { interes: 7.41, cft: 53.95 };

const porcentaje = (valor: number) =>
  `${valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const condicionTasa = (tasa: { interes: number; cft: number }) =>
  `${porcentaje(tasa.interes)} de interés, CFT ${porcentaje(tasa.cft)}`;

export interface LineaFinanciacion {
  medio: string;
  detalle: string;
}

/**
 * Las opciones generales, una línea por medio. El CFT va siempre al lado del
 * interés: la normativa de publicidad de financiación lo exige visible cuando
 * se anuncian cuotas con interés.
 */
export function financiacionGeneral(): LineaFinanciacion[] {
  return [
    {
      medio: 'Visa y Mastercard',
      detalle: `3 cuotas con Santander, Galicia, BBVA, Nación, Macro o Naranja: ${condicionTasa(TASA_PREFERENCIAL)}`,
    },
    { medio: 'Visa y Mastercard', detalle: `3 cuotas con otros bancos: ${condicionTasa(TASA_RESTO)}` },
    { medio: 'Naranja X', detalle: '1 pago o Plan Z en 3 cuotas sin interés' },
    { medio: 'GoCuotas y WiBond', detalle: 'hasta 6 cuotas sin interés' },
    { medio: 'American Express', detalle: '1 o 3 cuotas si la emite Santander o American Express; si no, 1 pago' },
  ];
}
