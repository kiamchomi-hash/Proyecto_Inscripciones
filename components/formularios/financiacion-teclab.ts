// Financiación de Teclab: lo que muestra el Simulador de Precios del Portal
// Administrativo, vuelto datos. Es la única fuente del sitio y la usa «Ver
// precio» (las opciones generales). La autoinscripción ya no pregunta banco ni
// tarjeta: el portal del alumno los toma solo.
//
// Fuente: el simulador, en el relevamiento limpio del 16/10/2026 (decisión del
// usuario: manda el portal, no la placa ni el Dashboard Comercial). El primer
// relevamiento de ese día tuvo errores por menús viejos del portal; el limpio
// muestra 6 cuotas sin interés y Plan Z con Naranja X, y Sucrédito sólo en 3
// cuotas. El mismo relevamiento alimenta al bot y al buscador desde
// ventas/fuentes/teclab/conocimiento-hermes/financiacion_teclab.json. Si el
// portal cambia, se vuelve a relevar y se actualizan los dos lados.
//
// Autocontenido a propósito: sin imports, para que lo puedan importar los
// componentes del navegador sin arrastrar nada más.

// Porcentajes tal como figuran en el simulador.
const PREFERENCIAL = { tres: { interes: 6.15, cft: 43.34 }, seis: { interes: 12.48, cft: 50.54 } };
const RESTO = { tres: { interes: 7.41, cft: 53.95 }, seis: { interes: 12.99, cft: 52.96 } };

const porcentaje = (valor: number) =>
  `${valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const condicionTasa = (tasa: { interes: number; cft: number }) =>
  `${porcentaje(tasa.interes)} de interés, CFT ${porcentaje(tasa.cft)}`;

const cuotas = (grupo: typeof PREFERENCIAL) =>
  `3 cuotas: ${condicionTasa(grupo.tres)}; 6 cuotas: ${condicionTasa(grupo.seis)}`;

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
    { medio: 'Cualquier tarjeta', detalle: '1 pago sin recargo' },
    { medio: 'Naranja X', detalle: '6 cuotas sin interés o Plan Z' },
    { medio: 'Visa y Mastercard', detalle: `Galicia, Nación, Santander, Macro y BBVA. ${cuotas(PREFERENCIAL)}` },
    { medio: 'Otros bancos', detalle: `Visa, Mastercard, American Express, Cabal, Diners y Argencard. ${cuotas(RESTO)}` },
    { medio: 'Sucrédito', detalle: `3 cuotas: ${condicionTasa(RESTO.tres)}` },
    { medio: 'Sólo 1 pago', detalle: 'American Express de Galicia, Patagonia, Macro o Reba' },
  ];
}
