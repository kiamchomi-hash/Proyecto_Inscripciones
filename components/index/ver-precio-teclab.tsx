'use client';

// "Ver precio" del modal de Teclab. Es un slide mas del carrusel, el ultimo,
// despues del cierre: el boton «Ver precio» del cierre lleva hasta aca. Muestra
// de entrada los dos caminos: dejar el mail y ver el precio ahi mismo, o hablar
// por WhatsApp. El precio no viaja en el HTML: lo devuelve `POST /api/formularios`
// (kind `precio`) recien despues de registrar el lead, y solo si esta vigente.
//
// Antes era una ventana encima del modal (portal, velo y foco atrapado). Como
// slide no necesita nada de eso: el modal ya cierra con Escape y no pasa de
// slide con las flechas mientras se escribe en un campo.

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';
import { CAMPOS, EMAIL_VALIDO, validarPayloadPrecio, type LineaPrecio } from '@/components/formularios/casas';
import { financiacionGeneral } from '@/components/formularios/financiacion-teclab';
import { coberturaDelPago } from '@/components/formularios/cobertura-pago';
import { urlAutoinscripcion } from '@/components/formularios/elegir-carrera';

type Vista = 'formulario' | 'precio' | 'actualizando';

export interface PrecioVigente {
  conceptos: LineaPrecio[];
  total: string;
  nota: string | null;
  vigenteHasta: string;
}

type Respuesta =
  | { ok: true; estado: 'vigente'; precio: PrecioVigente }
  | { ok: true; estado: 'vencido'; vigenteHasta: string }
  | { ok: true; estado: 'sin-precio' };

const FOCOABLES = 'button:not([disabled]), a[href], input:not([disabled])';

// El mail con el que ya se vio un precio queda en el navegador: la próxima
// carrera arranca con el campo completo y basta con tocar «Ver precio». No se
// pide solo: cada pedido registra un lead y avisa por Telegram, y pasar por el
// slide con «Siguiente» no es pedir el precio.
const CLAVE_MAIL = 'teclab-precio-mail';

function mailGuardado(): string {
  try {
    return localStorage.getItem(CLAVE_MAIL) ?? '';
  } catch {
    return ''; // Navegación privada o storage bloqueado: se tipea como siempre.
  }
}

function guardarMail(email: string) {
  try {
    localStorage.setItem(CLAVE_MAIL, email);
  } catch {
    // Sin storage no se recuerda, y nada más.
  }
}

/** `AAAA-MM-DD` -> `DD/MM`, sin pasar por `Date` (se correria un dia por UTC). */
function diaMes(fecha: string): string {
  const [, mes, dia] = fecha.split('-');
  return dia && mes ? `${dia}/${mes}` : fecha;
}

function mensajeDeError(status: number | null): string {
  if (status === 429) return 'Recibimos varias consultas desde tu conexión. Esperá unos minutos o escribinos por WhatsApp.';
  if (status === 403) return 'No pudimos completar la verificación de seguridad. Probá de nuevo.';
  if (status === 400) return 'Revisá el mail e intentá de nuevo.';
  return 'No pudimos mostrar el precio en este momento. Probá de nuevo o escribinos por WhatsApp.';
}

function IconoWhatsApp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function EnlaceWhatsApp({ href, texto, principal = false }: { href: string; texto: string; principal?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener nofollow"
      className={principal ? 'vp-whatsapp vp-whatsapp-lleno' : 'vp-whatsapp'}
    >
      <IconoWhatsApp />
      {texto}
    </a>
  );
}

/**
 * Las opciones de financiación vigentes, en letra chica bajo el total. El
 * medio se nombra una vez aunque tenga dos líneas (Visa y Mastercard).
 * Va plegada: abierta eran cinco renglones que en un teléfono bajo (375x667)
 * empujaban «Inscribite ya» fuera del slide. Al abrirla, el CFT sigue al lado
 * de cada interés.
 */
function Financiacion() {
  const lineas = financiacionGeneral();
  return (
    <details className="vp-financiacion">
      <summary className="vp-financiacion-rotulo">Ver financiación</summary>
      <ul className="vp-financiacion-lineas">
        {lineas.map((linea, i) => (
          <li key={linea.detalle}>
            {linea.medio !== lineas[i - 1]?.medio ? <strong>{linea.medio}: </strong> : null}
            {linea.detalle}
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * El precio vigente: conceptos, total, qué cubre el pago, vigencia y
 * financiación plegada. Sin acciones: cada lugar que lo muestra pone las suyas
 * («Inscribite ya» acá, «Inscribirme» en el formulario de preinscripción).
 * Toma los colores de `--vp-acento`, `--vp-acento-claro` y
 * `--vp-texto-acento`, que define el contenedor.
 */
export function DetallePrecio({ precio, duracion }: { precio: PrecioVigente; duracion?: string | null }) {
  // Qué cubre el pago, armado de los conceptos con los meses; si no hay
  // bimestres (curso de pago único), queda la nota de la base.
  const aclaracion = coberturaDelPago(precio.conceptos, duracion) ?? precio.nota;
  return (
    <>
      {precio.conceptos.length > 0 && (
        <ul className="vp-lineas">
          {/* Tres columnas compartidas por todas las filas: concepto,
              descuento (vacío si no hay) y monto, alineados a la derecha. */}
          {precio.conceptos.map(linea => (
            <li key={linea.concepto} className="vp-linea">
              <span className="vp-concepto">{linea.concepto}</span>
              <span className="vp-celda-descuento">
                {linea.descuento ? <span className="vp-descuento">-{linea.descuento}%</span> : null}
              </span>
              <span className="vp-monto">{linea.monto}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="vp-total">
        <span className="vp-total-rotulo">Total</span>
        <span className="vp-total-monto">{precio.total}</span>
      </div>
      {aclaracion ? <p className="vp-nota">{aclaracion}</p> : null}
      <p className="vp-vigencia">Precio vigente hasta el {diaMes(precio.vigenteHasta)}</p>
      <Financiacion />
    </>
  );
}

/**
 * Los dos botones del slide de cierre: «Ver precio», que lleva al slide del
 * precio, y WhatsApp a la vista, para quien prefiere preguntar directo sin
 * pasar por el mail.
 */
export function AccesoVerPrecio({
  acento,
  textoAcento,
  waHref,
  onVerPrecio,
}: {
  acento: string;
  /** Color del texto sobre un relleno del acento */
  textoAcento: string;
  waHref: string;
  onVerPrecio: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onVerPrecio}
        className="vp-boton"
        style={{ '--vp-acento': acento, '--vp-texto-acento': textoAcento } as CSSProperties}
      >
        Ver precio
      </button>
      <EnlaceWhatsApp href={waHref} texto="Consultar por WhatsApp" principal />
    </>
  );
}

/**
 * Formulario y resultado del precio, para ir dentro de un slide. El slide
 * queda montado mientras el modal esta abierto, asi que lo tipeado y el
 * precio ya mostrado sobreviven a ir y volver entre slides sin registrarse
 * dos veces.
 */
export function PanelVerPrecio({
  carreraId,
  nombreCarrera,
  acento,
  acentoClaro,
  textoAcento,
  waHref,
  slug,
  activo,
  duracion,
}: {
  carreraId: number;
  nombreCarrera: string;
  /** `carrera.duracion` («2 años»): con ella la aclaración dice cuántos cuatrimestres se pagan. */
  duracion?: string | null;
  /**
   * Slug de la ficha (`carreraToSlug(carrera)`). Con él, el precio vigente
   * ofrece «Inscribite ya», que lleva al formulario en modo autoinscripción.
   * Se recibe hecho porque `nombreCarrera` puede ser el nombre corto, y con
   * ese el slug sale otro.
   */
  slug?: string;
  acento: string;
  /** Version aclarada del acento, para rotulos chicos sobre el fondo tinta */
  acentoClaro: string;
  /** Color del texto sobre un relleno del acento */
  textoAcento: string;
  waHref: string;
  /** Si el slide esta a la vista. El captcha se monta recien en la primera visita. */
  activo: boolean;
}) {
  const [vista, setVista] = useState<Vista>('formulario');
  // El panel sólo se monta en el navegador (modal con import dinámico), así
  // que leer el storage al iniciar no desarma la hidratación.
  const [email, setEmail] = useState(mailGuardado);
  const [newsletter, setNewsletter] = useState(true);
  const [token, setToken] = useState('');
  // Cambiar la key remonta el widget y pide un token nuevo (son de un solo uso).
  const [captchaKey, setCaptchaKey] = useState(0);
  // Turnstile carga el script de Cloudflare: se monta la primera vez que el
  // slide se ve y no con cada modal que se abre. Queda montado despues, para
  // no pedir otro token cada vez que se vuelve al slide.
  const [visitado, setVisitado] = useState(activo);
  if (activo && !visitado) setVisitado(true);
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [precio, setPrecio] = useState<PrecioVigente | null>(null);

  const resultadoRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const emailId = useId();
  const errorId = useId();

  // Al pasar al resultado, el foco va a su primer boton: el lector de pantalla
  // anuncia el cambio y el teclado no arranca de cero. `preventScroll` para no
  // correr el carrusel.
  useEffect(() => {
    if (vista === 'formulario') return;
    resultadoRef.current?.querySelector<HTMLElement>(FOCOABLES)?.focus({ preventScroll: true });
  }, [vista]);

  const emailValido = EMAIL_VALIDO.test(email.trim());

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    setError('');
    const payload = validarPayloadPrecio({ carreraId, email, newsletter });
    if (!payload || !token || enviando) return;

    setEnviando(true);
    let status: number | null = null;
    try {
      const respuesta = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'precio', token, payload }),
      });
      status = respuesta.status;
      if (!respuesta.ok) throw new Error('submit_failed');
      guardarMail(payload.email);
      const datos = (await respuesta.json()) as Respuesta;
      if (datos.estado === 'vigente' && datos.precio) {
        setPrecio(datos.precio);
        setVista('precio');
      } else {
        setVista('actualizando');
      }
    } catch {
      setError(mensajeDeError(status));
      // El token ya se gasto: se pide uno nuevo y lo tipeado queda como estaba.
      setToken('');
      setCaptchaKey(k => k + 1);
    } finally {
      setEnviando(false);
    }
  };

  const estilos = {
    '--vp-acento': acento,
    '--vp-acento-claro': acentoClaro,
    '--vp-texto-acento': textoAcento,
    // El marcador del widget de Turnstile lee estas variables del catalogo.
    '--catalogo-acento': acento,
    '--catalogo-form-campo': 'rgba(255,255,255,0.06)',
    '--catalogo-etiqueta': acentoClaro,
  } as CSSProperties;

  return (
    <section className="vp-contenido" style={estilos} aria-labelledby={tituloId}>
      <div className="vp-encabezado">
        <p className="vp-rotulo">Precio</p>
        <h3 id={tituloId} className="vp-titulo">{nombreCarrera}</h3>
      </div>

      {vista === 'formulario' && (
        <form className="vp-cuerpo" onSubmit={enviar} noValidate>
          <label htmlFor={emailId} className="vp-etiqueta">{CAMPOS.email.label}</label>
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            maxLength={CAMPOS.email.max}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={intentado && !emailValido}
            className="vp-campo"
          />
          {intentado && !emailValido && <p className="vp-error-campo">Revisá el mail.</p>}

          <label className="vp-check">
            <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} />
            <span>Quiero recibir novedades de la carrera por mail</span>
          </label>

          {/* Invisible: Cloudflare verifica por detras y solo pide algo si
              sospecha de un bot, asi el slide queda en mail y botones. */}
          {visitado && (
            <TurnstileWidget
              key={captchaKey}
              marca="teclab"
              invisible
              onVerify={nuevo => setToken(nuevo)}
              onExpire={() => setToken('')}
            />
          )}
          {intentado && !token && !enviando && (
            <p className="vp-error-campo">Estamos verificando la conexión. Probá de nuevo en un segundo.</p>
          )}

          <button type="submit" className="vp-primario" disabled={enviando} aria-describedby={error ? errorId : undefined}>
            {enviando ? 'Enviando…' : 'Ver precio'}
          </button>

          {error && (
            <p id={errorId} className="vp-aviso" role="alert">
              {error}
            </p>
          )}

          <div className="vp-separador"><span>o</span></div>
          <EnlaceWhatsApp href={waHref} texto="Escribinos por WhatsApp" />
        </form>
      )}

      {vista === 'precio' && precio && (
        <div ref={resultadoRef} className="vp-cuerpo" aria-live="polite">
          <DetallePrecio precio={precio} duracion={duracion} />
          {slug ? (
            <>
              <a href={urlAutoinscripcion(slug)} className="vp-primario">Inscribite ya</a>
              <EnlaceWhatsApp href={waHref} texto="Quiero inscribirme" />
            </>
          ) : <EnlaceWhatsApp href={waHref} texto="Quiero inscribirme" principal />}
        </div>
      )}

      {vista === 'actualizando' && (
        <div ref={resultadoRef} className="vp-cuerpo" aria-live="polite">
          <p className="vp-mensaje">
            Estamos actualizando el precio de esta carrera. Escribinos por WhatsApp y te lo pasamos.
          </p>
          <EnlaceWhatsApp href={waHref} texto="Consultar por WhatsApp" principal />
        </div>
      )}
    </section>
  );
}
