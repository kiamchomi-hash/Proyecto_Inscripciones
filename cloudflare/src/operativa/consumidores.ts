import { pedidoLeadSede, resultadoPrecio, type ResultadoPrecio } from '../../../components/formularios/casas.ts';
import { leerPrecioPrivado, reservarMailPrecio } from '../datos/repositorio.ts';
import { leerRelojBase } from '../datos/reloj.ts';
import { suscribirNewsletter } from '../datos/newsletter.ts';
import { payloadCompletoDesdeConsulta, diaArgentino } from '../api/filas.ts';
import {
  leerEfecto, listarParaBarrido, reclamarEfecto, liberarReclamo, devolverSinTransporte,
  marcarAmbiguo, marcarEnviado, marcarError, marcarIntento,
  marcarOmitido, TOPE_LOTE_OUTBOX, type FilaOutbox, type ResumenConsumo,
} from './outbox.ts';

/**
 * Puertos de efectos externos. Este módulo NUNCA llama a la red: un consumidor
 * real (Telegram, SMTP, HubSpot, GitHub) se inyecta desde afuera, y en las
 * pruebas es un doble que sólo registra lo recibido. El alta del newsletter es
 * interna: se escribe en la misma base, no pasa por un transporte.
 */
export type ResultadoTransporte = 'enviado' | 'rechazado' | 'sin-configurar';

export interface PedidoTelegram {
  tipo: 'aviso-lead';
  /** De dónde sale el aviso: una consulta, una pregunta o una solicitud de clases. */
  fuente: 'consulta' | 'faq' | 'clase';
  /** Id de la fila que lo originó (`consultas`, `faq_preguntas` o `solicitudes_clase`). */
  id: number | string;
}

export interface PedidoNewsletter {
  /** URL de baja del pie: sólo lleva el id de la suscripción. */
  bajaUrl: string;
  /** Encabezados RFC 8058 que pide SMTP2GO como `custom_headers`. */
  encabezados: { header: string; value: string }[];
}

export interface PedidoMail {
  para: string;
  carrera: {
    id: number; nombre: string; nivel: string; prefix: string | null;
    duracion: string | null; nombre_corto: string | null;
  };
  precio: ResultadoPrecio;
  limitar: boolean;
  /** Si viene, la plantilla es la del newsletter semanal, con su baja. */
  newsletter?: PedidoNewsletter;
}

export interface PedidoLeadSede {
  url: string;
  body: unknown;
}

export interface Transportes {
  telegram?: (pedido: PedidoTelegram) => Promise<ResultadoTransporte>;
  mail?: (pedido: PedidoMail) => Promise<ResultadoTransporte>;
  hubspot?: (pedido: PedidoLeadSede) => Promise<ResultadoTransporte>;
}

/** El proveedor pudo haber entregado: no se reintenta solo. */
export class ErrorAmbiguo extends Error {
  readonly codigo: string;

  constructor(codigo: string) {
    super(codigo);
    this.name = 'ErrorAmbiguo';
    this.codigo = codigo;
  }
}

/**
 * El proveedor respondió que no aceptó el trabajo (HTTP no-2xx, por ejemplo).
 * No es ambiguo: reintentar es seguro. Sólo viaja un código, nunca el mensaje
 * del proveedor ni datos de la persona.
 */
export class ErrorRechazo extends Error {
  readonly codigo: string;

  constructor(codigo: string) {
    super(codigo);
    this.name = 'ErrorRechazo';
    this.codigo = codigo;
  }
}

type Resuelto =
  | { tipo: 'pedido'; transporte: keyof Transportes; pedido: unknown }
  | { tipo: 'resuelto' }
  | { tipo: 'omitido'; motivo: string }
  | { tipo: 'error'; codigo: string };

async function consultaDe(db: D1Database, id: number | null) {
  if (id === null) return null;
  return db.prepare('SELECT * FROM consultas WHERE id = ?1').bind(id).first<Record<string, unknown>>();
}

async function faqDe(db: D1Database, id: number | null) {
  if (id === null) return null;
  return db.prepare('SELECT id, contacto, modo FROM faq_preguntas WHERE id = ?1').bind(id).first<{
    id: number; contacto: string; modo: string;
  }>();
}

const texto = (valor: unknown) => (typeof valor === 'string' ? valor : '');

/** Intenta una lectura que no tumba el efecto: si falla, el motivo lo dice. */
async function intentar<T>(lectura: () => Promise<T>): Promise<T | null> {
  try {
    return await lectura();
  } catch {
    return null;
  }
}

function detalleDe(fila: FilaOutbox): Record<string, unknown> {
  if (!fila.detalle) return {};
  try {
    const datos = JSON.parse(fila.detalle) as unknown;
    return datos !== null && typeof datos === 'object' && !Array.isArray(datos)
      ? datos as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

/** El aviso del alta: la fuente depende de la tabla que lo originó. */
function pedidoAvisoLead(fila: FilaOutbox): Resuelto {
  if (fila.faq_id !== null) {
    return { tipo: 'pedido', transporte: 'telegram', pedido: { tipo: 'aviso-lead', fuente: 'faq', id: fila.faq_id } };
  }
  if (fila.clase_id !== null) {
    return { tipo: 'pedido', transporte: 'telegram', pedido: { tipo: 'aviso-lead', fuente: 'clase', id: fila.clase_id } };
  }
  if (fila.consulta_id !== null) {
    return { tipo: 'pedido', transporte: 'telegram', pedido: { tipo: 'aviso-lead', fuente: 'consulta', id: fila.consulta_id } };
  }
  return { tipo: 'omitido', motivo: 'sin-ancla' };
}

/** Mail a suscribir según la tabla de origen: `consultas.email` o `faq_preguntas.contacto`. */
async function emailDelAlta(db: D1Database, fila: FilaOutbox) {
  if (fila.faq_id !== null) {
    const pregunta = await faqDe(db, fila.faq_id);
    return { email: texto(pregunta?.contacto), carreraId: null, fuente: 'faq' as const };
  }
  const consulta = await consultaDe(db, fila.consulta_id);
  const carreraId = detalleDe(fila).carreraId;
  return {
    email: texto(consulta?.email),
    carreraId: Number.isSafeInteger(carreraId) && (carreraId as number) > 0 ? carreraId as number : null,
    fuente: 'consulta' as const,
  };
}

async function prepararEfecto(db: D1Database, fila: FilaOutbox, ahora: string): Promise<Resuelto> {
  switch (fila.tipo) {
    case 'aviso-lead':
      return pedidoAvisoLead(fila);

    case 'newsletter-alta': {
      const { email, carreraId } = await emailDelAlta(db, fila);
      const correo = email.trim().toLowerCase();
      if (!correo) return { tipo: 'omitido', motivo: 'sin-email' };
      // La carrera se busca por id, no por el texto del navegador; sin ella es general.
      const carrera = carreraId === null
        ? null
        : await intentar(() => db.prepare('SELECT id, nombre FROM carreras WHERE id = ?1')
          .bind(carreraId).first<{ id: number; nombre: string }>());
      try {
        await suscribirNewsletter(db, { email: correo, carrera: carrera ?? null, ahora });
        return { tipo: 'resuelto' };
      } catch (error) {
        return { tipo: 'error', codigo: error instanceof Error ? error.name : 'desconocido' };
      }
    }

    case 'mail-precio': {
      const consulta = await consultaDe(db, fila.consulta_id);
      const email = texto(consulta?.email).trim();
      if (!email) return { tipo: 'omitido', motivo: 'sin-email' };
      const detalle = detalleDe(fila);
      const carreraId = detalle.carreraId;
      if (!Number.isSafeInteger(carreraId) || !carreraId) return { tipo: 'omitido', motivo: 'sin-carrera' };
      const carrera = await intentar(() => db.prepare('SELECT id, nombre, nivel, prefix, duracion, nombre_corto FROM carreras WHERE id = ?1')
        .bind(carreraId).first<{ id: number; nombre: string; nivel: string; prefix: string | null; duracion: string | null; nombre_corto: string | null }>());
      if (!carrera) return { tipo: 'omitido', motivo: 'carrera-inexistente' };
      const privado = await intentar(() => leerPrecioPrivado(db, carreraId as number));
      const resultado = resultadoPrecio(privado ?? null, diaArgentino(ahora));
      if (resultado.estado !== 'vigente') return { tipo: 'omitido', motivo: 'sin-precio-vigente' };
      return {
        tipo: 'pedido', transporte: 'mail',
        pedido: { para: email, carrera, precio: resultado, limitar: detalle.limitar === true },
      };
    }

    case 'lead-sede': {
      const consulta = await consultaDe(db, fila.consulta_id);
      if (!consulta) return { tipo: 'omitido', motivo: 'consulta-inexistente' };
      const datos = payloadCompletoDesdeConsulta(consulta);
      const pedido = pedidoLeadSede({ ...datos, carrera: texto(consulta.carrera), email: datos.email });
      // Sin opción de carrera o con mail inválido no hay alta: se registra y sigue.
      if (!pedido) return { tipo: 'omitido', motivo: 'lead-sede-sin-datos' };
      return { tipo: 'pedido', transporte: 'hubspot', pedido };
    }

    default:
      return { tipo: 'omitido', motivo: 'tipo-desconocido' };
  }
}

/**
 * Barrido acotado con cursor durable; cada fila pasa por el mismo reclamo que Queues.
 */
export async function consumirPendientes(
  db: D1Database,
  transportes: Transportes,
  { limite = TOPE_LOTE_OUTBOX }: { limite?: number } = {},
): Promise<ResumenConsumo> {
  const resumen: ResumenConsumo = {
    leidos: 0, enviados: 0, errores: 0, ambiguos: 0, omitidos: 0, sinTransporte: 0,
  };
  const filas = await listarParaBarrido(db, limite);
  for (const fila of filas) {
    resumen.leidos += 1;
    const resultado = await consumirEfecto(db, fila.id, transportes);
    if (resultado === 'enviado') resumen.enviados += 1;
    else if (resultado === 'omitido') resumen.omitidos += 1;
    else if (resultado === 'error') resumen.errores += 1;
    else if (resultado === 'ambiguo') resumen.ambiguos += 1;
    else if (resultado === 'sin-transporte') resumen.sinTransporte += 1;
  }
  return resumen;
}

/** Lo que dejó un intento: el estado nuevo o el motivo por el que no se envió. */
export type ResultadoConsumo =
  | 'enviado' | 'omitido' | 'error' | 'ambiguo'
  | 'sin-transporte' | 'no-pendiente' | 'inexistente';

/**
 * Consume una fila puntual por id. Es el punto de entrada de la cola: un mensaje
 * repetido después de `enviado` no vuelve a llamar al transporte (`no-pendiente`),
 * así la entrega al menos una vez de Queues no duplica el efecto.
 */
export async function consumirEfecto(
  db: D1Database, id: number, transportes: Transportes,
): Promise<ResultadoConsumo> {
  const fila = await leerEfecto(db, id);
  if (!fila) return 'inexistente';
  if (fila.estado !== 'pendiente') return 'no-pendiente';
  const token = await reclamarEfecto(db, id);
  if (!token) return 'no-pendiente';
  const intento = { externo: false };
  let completado = false;
  try {
    const resultado = await procesarFila(db, fila, transportes, intento);
    completado = true;
    return resultado;
  } finally {
    // Si la persistencia del resultado externo falla, no liberar ni reenviar.
    // Un proceso muerto deja el reclamo durable para reconciliación manual.
    if (completado || !intento.externo) await liberarReclamo(db, id, token);
  }
}

/** Sólo se llama con el reclamo durable adquirido. */
async function procesarFila(
  db: D1Database, fila: FilaOutbox, transportes: Transportes, intento: { externo: boolean },
): Promise<Exclude<ResultadoConsumo, 'no-pendiente' | 'inexistente'>> {
  const ahora = await leerRelojBase(db);
  const preparado = await prepararEfecto(db, fila, ahora);

  if (preparado.tipo === 'omitido') {
    return await marcarOmitido(db, fila.id, preparado.motivo) ? 'omitido' : 'sin-transporte';
  }
  if (preparado.tipo === 'resuelto') {
    return await marcarEnviado(db, fila.id) ? 'enviado' : 'sin-transporte';
  }
  if (preparado.tipo === 'error') {
    return await marcarError(db, fila.id, preparado.codigo) ? 'error' : 'sin-transporte';
  }
  const transporte = transportes[preparado.transporte];
  if (!transporte) {
    // Sin transporte configurado la intención sigue pendiente: es recuperable.
    return 'sin-transporte';
  }
  // Sólo reservar cuando los datos y el puerto ya están disponibles. El reclamo
  // protege también esta preparación; reservar no equivale a haber entregado.
  if (preparado.transporte === 'mail') {
    const pedido = preparado.pedido as PedidoMail;
    if (pedido.limitar && !await reservarMailPrecio(db, pedido.para, pedido.carrera.id)) {
      return await marcarOmitido(db, fila.id, 'reserva-vigente') ? 'omitido' : 'sin-transporte';
    }
  }
  // El intento se persiste antes de llamar al proveedor y no se reembolsa.
  if (!await marcarIntento(db, fila.id)) return 'sin-transporte';
  // Estado conservador ANTES de cruzar la frontera externa. Si el isolate muere
  // o falla D1 después del envío, ni cron ni Queues vuelven a enviarlo a ciegas.
  if (!await marcarAmbiguo(db, fila.id, 'envio-en-curso')) return 'sin-transporte';
  intento.externo = true;
  let resultado: ResultadoTransporte;
  try {
    resultado = await transporte(preparado.pedido as never);
  } catch (error) {
    if (error instanceof ErrorRechazo) {
      return await marcarError(db, fila.id, error.codigo) ? 'error' : 'sin-transporte';
    }
    return await marcarAmbiguo(db, fila.id, error instanceof ErrorAmbiguo ? error.codigo : 'transporte-incierto')
      ? 'ambiguo' : 'sin-transporte';
  }
  if (resultado === 'enviado') return await marcarEnviado(db, fila.id) ? 'enviado' : 'sin-transporte';
  if (resultado === 'sin-configurar') {
    await devolverSinTransporte(db, fila.id);
    return 'sin-transporte';
  }
  return await marcarError(db, fila.id, 'rechazado') ? 'error' : 'sin-transporte';
}
