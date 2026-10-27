import {
  EMAIL_VALIDO, CASAS_CON_PRECIO, carreraIdDe, fechaArgentina,
  validarPayloadPrecio, type ResultadoPrecio,
} from '../../../components/formularios/casas.ts';
import { filaConsulta, filaFaq, filasClase, esCasa, text, type JsonRecord } from './filas.ts';

/**
 * Modo demo, sólo local. Recorre el frontend de la preinscripción sin captcha y
 * sin escribir nada: valida el sobre y el payload con los mismos validadores que
 * el envío real (lo inválido sigue dando 400) y responde la misma forma.
 *
 * Igual que `lib/formularios-demo.ts`, no toca la base, la cuota, Turnstile,
 * SMTP2GO, HubSpot ni el robot. La diferencia es de dónde sale la bandera: en el
 * Worker no hay `NODE_ENV`, así que el adaptador la habilita sólo con
 * `APP_STAGE === 'local'` y `FORMULARIOS_DEMO === '1'`. En producción la bandera
 * no existe y el modo queda apagado.
 *
 * La casa sale de lo que manda el navegador: sin base que verificar, acá no se
 * valida la carrera.
 */

export const TOKEN_DEMO = 'demo';

/** El precio del modo demo: ficticio, fijo y rotulado como de demo. */
export function precioDemo(ahora = Date.now()): Extract<ResultadoPrecio, { estado: 'vigente' }> {
  const vence = new Date(ahora + 30 * 24 * 60 * 60 * 1000);
  return {
    estado: 'vigente',
    precio: {
      conceptos: [
        { concepto: 'Matrícula (demo)', monto: '$ 10.000,00', descuento: 50 },
        { concepto: 'Primer bimestre (demo)', monto: '$ 20.000,00', descuento: 20 },
      ],
      total: '$ 30.000,00',
      nota: 'Precio de demostración: no es un precio real.',
      vigenteHasta: fechaArgentina(vence),
    },
  };
}

/** La respuesta de demo por `kind`, con el mismo 201 y la misma forma que en real. */
export function respuestaDemo(kind: string, payload: JsonRecord): Record<string, unknown> {
  switch (kind) {
    case 'consulta': {
      filaConsulta(payload);
      const conPrecio = esCasa(payload.casa)
        && CASAS_CON_PRECIO.includes(payload.casa)
        && payload.tipoFormulario === 'preinscripcion'
        && carreraIdDe(payload) !== null;
      if (!conPrecio) return { ok: true };
      return { ok: true, ...precioDemo() };
    }
    case 'faq':
      filaFaq(payload);
      return { ok: true };
    case 'clase':
      filasClase(payload);
      return { ok: true };
    default:
      if (!validarPayloadPrecio(payload)) throw new TypeError('Datos inválidos');
      return { ok: true, ...precioDemo() };
  }
}
