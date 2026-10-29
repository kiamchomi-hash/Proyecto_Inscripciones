import {
  CASAS, CASAS_CON_PRECIO, carreraConPrecio, fechaArgentina, resultadoPrecio,
  type FilaPrecio,
} from '../../../components/formularios/casas.ts';
import { esCarreraVisible } from '../../../components/index/types.ts';
import { BASE_PROD } from '../../../lib/vigilancia-esperado.ts';
import { leerRelojBase } from '../datos/reloj.ts';
import {
  confirmarEnvio, liberarReclamo, marcarAmbiguo, marcarRechazo, reclamarEnvio,
} from '../datos/newsletter-envios.ts';
import { ErrorAmbiguo, ErrorRechazo, type PedidoMail, type Transportes } from '../operativa/consumidores.ts';
import { rechazoBearer } from './auth.ts';

/**
 * Cron del newsletter: mismo contrato que `app/api/newsletter/route.ts`.
 *
 * A cada suscripción activa a una carrera con precio vigente le manda el mail
 * aprobado cada siete días. La regla de elegibilidad es la misma y el envío
 * sigue saliendo de a uno. Lo que cambia es la escritura: antes de cruzar la
 * frontera de SMTP2GO se toma un reclamo durable y `ultimo_envio_at` se escribe
 * en el mismo batch que la confirmación. Un resultado incierto queda ambiguo y
 * no se reintenta solo; un rechazo conocido queda en `error` y se puede volver
 * a intentar en la próxima corrida.
 *
 * Sin `CRON_SECRET` o sin transporte de correo no se lee la base ni se manda nada:
 * no hay respuesta de éxito ficticia.
 */

const POR_CORRIDA = 50;
const DIAS_ENTRE_ENVIOS = 7;
const DIA_MS = 24 * 60 * 60 * 1000;
const PLAZO_MS = 240_000;

interface Resumen {
  candidatas: number;
  enviados: number;
  salteados: number;
  fallidos: number;
}

interface CarreraNewsletter {
  id: number; nombre: string; nivel: string; activa: boolean; proximamente: boolean;
  prefix: string | null; nombre_corto: string | null; duracion: string | null;
}

type PrecioVigente = Extract<ReturnType<typeof resultadoPrecio>, { estado: 'vigente' }>['precio'];
interface Vigente { carrera: CarreraNewsletter; precio: PrecioVigente }

interface FilaCarreraPrecio {
  id: number; nombre: string; nivel: string; activa: number; proximamente: number;
  prefix: string | null; nombre_corto: string | null; duracion: string | null;
  conceptos: string | null; total: string | null; nota: string | null; vigente_hasta: string | null;
}

export interface EntornoNewsletter {
  secretoCron?: string;
  mail?: Transportes['mail'];
  /** Sólo para pruebas de frontera; en runtime se usa el reloj normal. */
  ahora?: () => Date;
}

const respuesta = (cuerpo: object, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const resumenVacio = (): Resumen => ({ candidatas: 0, enviados: 0, salteados: 0, fallidos: 0 });

const codigoDe = (error: unknown) =>
  error instanceof Error ? error.name : 'desconocido';

/** Las carreras que hoy pueden salir: activas, visibles y con precio vigente. */
async function carrerasConPrecioVigente(db: D1Database, hoy: Date) {
  const niveles = CASAS_CON_PRECIO.flatMap(casa => CASAS[casa].niveles);
  const marcadores = niveles.map((_, i) => `?${i + 1}`).join(',');
  const filas = await db.prepare(`SELECT c.id, c.nombre, c.nivel, c.activa, c.proximamente,
      c.prefix, c.nombre_corto, c.duracion,
      p.conceptos, p.total, p.nota, p.vigente_hasta
    FROM carreras c
    LEFT JOIN precios_privados p ON p.carrera_id = c.id
    WHERE c.activa = 1 AND c.nivel IN (${marcadores})`)
    .bind(...niveles).all<FilaCarreraPrecio>();

  const fecha = fechaArgentina(hoy);
  const vigentes = new Map<number, Vigente>();
  for (const fila of filas.results) {
    const carrera: CarreraNewsletter = {
      id: fila.id, nombre: fila.nombre, nivel: fila.nivel,
      activa: fila.activa === 1, proximamente: fila.proximamente === 1,
      prefix: fila.prefix, nombre_corto: fila.nombre_corto, duracion: fila.duracion,
    };
    if (!esCarreraVisible(carrera) || !carreraConPrecio(carrera)) continue;
    if (fila.conceptos === null || fila.total === null || fila.vigente_hasta === null) continue;
    let conceptos: unknown;
    try {
      conceptos = JSON.parse(fila.conceptos);
    } catch {
      console.error('[newsletter] Precio con JSON ilegible');
      continue;
    }
    const resultado = resultadoPrecio({
      conceptos, total: fila.total, nota: fila.nota, vigente_hasta: fila.vigente_hasta,
    } satisfies FilaPrecio, fecha);
    if (resultado.estado === 'vigente') vigentes.set(carrera.id, { carrera, precio: resultado.precio });
  }
  return vigentes;
}

interface Suscripcion {
  id: string;
  email: string;
  carrera_id: number;
}

/**
 * Candidatas con la misma regla que el handler vigente, resuelta en SQL para no
 * traer suscripciones que no pueden salir. El orden es el de Next: primero las
 * que nunca recibieron, después por fecha ascendente.
 */
async function suscripcionesCandidatas(db: D1Database, limite: string, hoy: string) {
  const niveles = CASAS_CON_PRECIO.flatMap(casa => CASAS[casa].niveles);
  const marcadores = niveles.map((_, i) => `?${i + 1}`).join(',');
  const filas = await db.prepare(`SELECT s.id, s.email, s.carrera_id
    FROM suscripciones_newsletter s
    JOIN carreras c ON c.id = s.carrera_id
    JOIN precios_privados p ON p.carrera_id = c.id
    WHERE s.activo = 1 AND c.activa = 1 AND c.proximamente = 0
      AND c.nivel IN (${marcadores})
      AND p.vigente_hasta >= ?${niveles.length + 1}
      AND (s.ultimo_envio_at IS NULL OR s.ultimo_envio_at <= ?${niveles.length + 2})
    ORDER BY (s.ultimo_envio_at IS NOT NULL), s.ultimo_envio_at ASC
    LIMIT ${POR_CORRIDA}`)
    .bind(...niveles, hoy, limite).all<Suscripcion>();
  return filas.results;
}

/** Encabezados de baja de un clic (RFC 8058), como el handler vigente. */
const encabezadosBaja = (id: string) => [
  { header: 'List-Unsubscribe', value: `<${BASE_PROD}/api/newsletter/baja?id=${encodeURIComponent(id)}>` },
  { header: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
];

export async function manejarNewsletter(
  request: Request, db: D1Database | null, entorno: EntornoNewsletter,
): Promise<Response> {
  const negado = await rechazoBearer(request, entorno.secretoCron, 'CRON_SECRET');
  if (negado) return negado;

  const resumen = resumenVacio();
  if (!entorno.mail) {
    console.warn('[newsletter] Corrida omitida: falta el transporte de correo');
    return respuesta({ error: 'transporte de correo sin configurar', ...resumen }, 503);
  }
  // Sin base no hay candidatas: es el 500 de la lectura vigente, no un éxito.
  if (!db) return respuesta({ error: 'No se pudo leer la base', ...resumen }, 500);

  const arranque = Date.now();
  const ahora = entorno.ahora?.() ?? new Date(arranque);
  const limite = new Date(ahora.getTime() - DIAS_ENTRE_ENVIOS * DIA_MS).toISOString();
  const hoy = fechaArgentina(ahora);

  let vigentes: Map<number, Vigente>;
  try {
    vigentes = await carrerasConPrecioVigente(db, ahora);
  } catch (error) {
    console.error('[newsletter] No se pudieron leer las carreras o los precios', { code: codigoDe(error) });
    return respuesta({ error: 'No se pudo leer la base', ...resumen }, 500);
  }
  if (vigentes.size === 0) return respuesta(resumen);

  let candidatas: Suscripcion[];
  try {
    candidatas = await suscripcionesCandidatas(db, limite, hoy);
  } catch (error) {
    console.error('[newsletter] No se pudieron leer las suscripciones', { code: codigoDe(error) });
    return respuesta({ error: 'No se pudo leer la base', ...resumen }, 500);
  }

  resumen.candidatas = candidatas.length;
  const reloj = entorno.ahora ? async () => (entorno.ahora!().toISOString()) : () => leerRelojBase(db);

  // De a uno: el proveedor de correo limita la tasa y un fallo no frena al resto.
  for (const suscripcion of candidatas) {
    const datos = vigentes.get(suscripcion.carrera_id);
    if (!datos || Date.now() - arranque > PLAZO_MS) {
      resumen.salteados += 1;
      continue;
    }
    const marca = await reloj();
    let token: string | null;
    try {
      token = await reclamarEnvio(db, suscripcion.id, limite, marca);
    } catch (error) {
      console.error('[newsletter] No se pudo reclamar la suscripción', { code: codigoDe(error) });
      resumen.fallidos += 1;
      continue;
    }
    if (!token) {
      // Otra corrida la tiene, o quedó en duda esperando revisión manual.
      resumen.salteados += 1;
      continue;
    }

    const bajaUrl = `${BASE_PROD}/newsletter/baja?id=${encodeURIComponent(suscripcion.id)}`;
    const pedido: PedidoMail = {
      para: suscripcion.email,
      carrera: {
        id: datos.carrera.id, nombre: datos.carrera.nombre, nivel: datos.carrera.nivel,
        prefix: datos.carrera.prefix, duracion: datos.carrera.duracion,
        nombre_corto: datos.carrera.nombre_corto,
      },
      precio: { estado: 'vigente', precio: datos.precio },
      limitar: false,
      newsletter: { bajaUrl, encabezados: encabezadosBaja(suscripcion.id) },
    };

    let resultado: Awaited<ReturnType<NonNullable<Transportes['mail']>>>;
    try {
      resultado = await entorno.mail(pedido);
    } catch (error) {
      // Rechazo conocido: se puede reintentar. Cualquier otra cosa pudo haber
      // llegado al proveedor y no se reintenta sola.
      const rechazo = error instanceof ErrorRechazo;
      const codigo = error instanceof ErrorRechazo || error instanceof ErrorAmbiguo
        ? error.codigo
        : codigoDe(error);
      try {
        if (rechazo) await marcarRechazo(db, suscripcion.id, token, codigo, marca);
        else await marcarAmbiguo(db, suscripcion.id, token, codigo, marca);
      } catch (marcaError) {
        console.error('[newsletter] No se pudo registrar el fallo', { code: codigoDe(marcaError) });
      }
      resumen.fallidos += 1;
      console.error('[newsletter] el proveedor de correo no confirmó un envío', { codigo });
      continue;
    }

    if (resultado === 'sin-configurar') {
      try {
        await liberarReclamo(db, suscripcion.id, token);
      } catch (error) {
        console.error('[newsletter] No se pudo liberar el reclamo', { code: codigoDe(error) });
      }
      resumen.salteados += 1;
      continue;
    }
    if (resultado !== 'enviado') {
      try {
        await marcarRechazo(db, suscripcion.id, token, 'rechazado', marca);
      } catch (error) {
        console.error('[newsletter] No se pudo registrar el rechazo', { code: codigoDe(error) });
      }
      resumen.fallidos += 1;
      continue;
    }

    try {
      const confirmado = await confirmarEnvio(db, suscripcion.id, token, marca);
      if (confirmado) resumen.enviados += 1;
      else {
        resumen.fallidos += 1;
        console.error('[newsletter] El reclamo ya no estaba en curso');
      }
    } catch (error) {
      // El mail salió: no se vuelve a mandar. El reclamo queda en curso para
      // reconciliación manual, igual que un resultado externo sin confirmar.
      resumen.fallidos += 1;
      console.error('[newsletter] No se pudo marcar el envío', { code: codigoDe(error) });
    }
  }

  console.info('[newsletter] Corrida terminada', resumen);
  return respuesta(resumen);
}
