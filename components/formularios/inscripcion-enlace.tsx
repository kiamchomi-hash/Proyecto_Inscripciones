'use client';

// La página del enlace de inscripción (`/inscripcion/[codigo]`): el precio
// vigente de la carrera, el resumen oculto de los datos y «Inscribirme». La
// confirmación y el «¡Listo!» son los mismos de la autoinscripción del
// formulario (`autoinscripcion-teclab.tsx`); acá cambia sólo el envío, que
// manda el código en vez del legajo (`kind: 'enlace'`). No hay medio de pago:
// lo elige la persona en el portal del alumno.
//
// Las props salen de `propsInscripcionEnlace` (casas.ts): no traen el DNI
// completo, ni el domicilio, ni el teléfono, y este componente no los pide.

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { WhatsAppIcon } from '@/components/icons';
import { PasoInscribirme, PasoListo } from './autoinscripcion-teclab';
import { type PropsInscripcionEnlace } from './casas';
import { numeroWhatsAppDe } from '@/lib/whatsapp';

type Paso = 'confirmar' | 'listo';

const waHref = (mensaje: string) =>
  `https://wa.me/${numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(mensaje)}`;

/** `AAAA-MM-DD` → `DD/MM`, sin pasar por `Date` (se correría un día por UTC). */
function diaMes(fecha: string): string {
  const [, mes, dia] = fecha.split('-');
  return dia && mes ? `${dia}/${mes}` : fecha;
}

function BotonWhatsApp({ texto, mensaje }: { texto: string; mensaje: string }) {
  return (
    <a href={waHref(mensaje)} target="_blank" rel="noopener nofollow" className="ie-whatsapp">
      <WhatsAppIcon className="h-4 w-4" />
      {texto}
    </a>
  );
}

// La tabla del precio, alineada como la de «Ver precio» (.vp-lineas en
// modales.css): tres columnas compartidas por todas las filas (subgrid), así
// el descuento y el monto caen en la misma x, y el total cierra en el mismo
// borde. Va en línea porque las reglas .ie-* de la página son flex y, sin
// capa, le ganarían a cualquier utilidad de Tailwind.
const TABLA: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto' };
const FILA: CSSProperties = {
  gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'subgrid', columnGap: '0.6rem', alignItems: 'baseline', justifyContent: 'normal',
};
const A_LA_DERECHA: CSSProperties = { justifySelf: 'end', textAlign: 'right' };

function Precio({ precio, carrera }: Pick<PropsInscripcionEnlace, 'precio'> & { carrera: string }) {
  if (precio.estado !== 'vigente') {
    return (
      <div className="ie-precio">
        <p className="ie-texto">Estamos actualizando el precio de esta carrera. Escribinos y te lo pasamos.</p>
        <BotonWhatsApp texto="Consultar el precio" mensaje={`Hola, quiero saber el precio de ${carrera}`} />
      </div>
    );
  }
  const { conceptos, total, nota, vigenteHasta } = precio.precio;
  return (
    <div className="ie-precio">
      {conceptos.length > 0 && (
        <ul className="ie-lineas" style={TABLA}>
          {conceptos.map(linea => (
            <li key={linea.concepto} className="ie-linea" style={FILA}>
              <span className="ie-concepto">{linea.concepto}</span>
              <span style={A_LA_DERECHA}>
                {linea.descuento ? <span className="ie-descuento">-{linea.descuento}%</span> : null}
              </span>
              <span className="ie-monto" style={A_LA_DERECHA}>{linea.monto}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="ie-total" style={{ paddingInline: '0.65rem' }}>
        <span className="ie-total-rotulo">Total</span>
        <span className="ie-total-monto">{total}</span>
      </div>
      {nota ? <p className="ie-nota">{nota}</p> : null}
      <p className="ie-vigencia">Precio vigente hasta el {diaMes(vigenteHasta)}</p>
    </div>
  );
}

export default function InscripcionEnlace({
  codigo, carrera, precio, datos, completo, demo = false,
}: PropsInscripcionEnlace & { /** Sólo desarrollo: pasa a «¡Listo!» sin enviar. */ demo?: boolean }) {
  const [paso, setPaso] = useState<Paso>('confirmar');
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  // Cambiar la key remonta el widget y pide un token nuevo (son de un solo uso).
  const [captchaKey, setCaptchaKey] = useState(0);
  // Carrusel confirmar → «¡Listo!»: la tarjeta toma el alto del panel activo.
  const panelesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [alto, setAlto] = useState<number>();
  useLayoutEffect(() => {
    const panel = panelesRef.current[paso === 'listo' ? 1 : 0];
    if (!panel) return;
    const medir = () => setAlto(panel.offsetHeight);
    medir();
    if (!('ResizeObserver' in window)) return;
    const observador = new ResizeObserver(medir);
    observador.observe(panel);
    return () => observador.disconnect();
  }, [paso]);

  // El «¡Listo!» es mucho más corto que la página: se vuelve arriba mientras desliza.
  const pasarAListo = () => {
    setPaso('listo');
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const mensajeCorregir = `Hola, quiero corregir mis datos de la inscripción a ${carrera.nombre}`;

  const enviar = async () => {
    if (enviando) return;
    if (demo) {
      pasarAListo();
      return;
    }
    setIntentado(true);
    if (!token) return;
    setEnviando(true);
    setError('');
    try {
      const respuesta = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'enlace', token, payload: { codigo } }),
      });
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null) as { error?: string } | null;
        throw new Error(detalle?.error || 'submit_failed');
      }
    } catch (fallo) {
      const motivo = fallo instanceof Error ? fallo.message : '';
      setError(motivo === 'Demasiadas solicitudes'
        ? 'Recibimos varios envíos desde tu conexión. Esperá unos minutos o escribinos por WhatsApp.'
        : motivo === 'El enlace ya no es válido'
          ? 'Este enlace ya no está disponible. Escribinos por WhatsApp y te ayudamos.'
          : 'Hubo un error al enviar. Intentá de nuevo o escribinos por WhatsApp.');
      setEnviando(false);
      setToken('');
      setCaptchaKey(key => key + 1);
      return;
    }
    setEnviando(false);
    pasarAListo();
  };

  const precioYDatos = (
    <>
      <section className="ie-tarjeta" aria-labelledby="ie-precio-titulo">
        <h2 id="ie-precio-titulo" className="ie-subtitulo">Precio</h2>
        <Precio precio={precio} carrera={carrera.nombre} />
      </section>

      <section className="ie-tarjeta" aria-labelledby="ie-datos-titulo">
        <h2 id="ie-datos-titulo" className="ie-subtitulo">Tus datos</h2>
        <dl className="ie-datos">
          <div><dt>Nombre</dt><dd>{datos.nombre || '—'}</dd></div>
          <div><dt>DNI</dt><dd>{datos.dni || '—'}</dd></div>
          <div><dt>Email</dt><dd>{datos.email || '—'}</dd></div>
          <div><dt>Carrera</dt><dd>{datos.carrera}</dd></div>
        </dl>
        <a href={waHref(mensajeCorregir)} target="_blank" rel="noopener nofollow" className="ie-corregir">
          ¿Algo no está bien? Avisanos por WhatsApp
        </a>
      </section>
    </>
  );

  return (
    <div className="ie-contenido">
      <header className="ie-cabecera">
        <p className="ie-marca">Teclab</p>
        <h1 className="ie-titulo">{carrera.nombre}</h1>
      </header>

      {!completo ? (
        <>
          {precioYDatos}
          <section className="ie-tarjeta ie-pago" aria-label="Inscripción">
            <div className="ie-aviso">
              <p className="ie-texto">Nos faltan algunos datos para completar tu inscripción. Escribinos y la terminamos juntos.</p>
              <BotonWhatsApp texto="Escribinos por WhatsApp" mensaje={`Hola, quiero completar mi inscripción a ${carrera.nombre}`} />
            </div>
          </section>
        </>
      ) : (
        // Carrusel de página entera: precio, datos y «Inscribirme» se deslizan
        // juntos y queda sólo el «¡Listo!».
        <div className="ie-carrusel" style={{ height: alto }}>
          <div className="ie-carrusel-pista" style={{ transform: paso === 'listo' ? 'translateX(-100%)' : undefined }}>
            <div
              ref={panel => { panelesRef.current[0] = panel; }}
              className="ie-carrusel-panel"
              aria-hidden={paso !== 'confirmar'}
              inert={paso !== 'confirmar'}
            >
              {precioYDatos}
              <section className="ie-tarjeta ie-pago" aria-label="Inscripción">
                <PasoInscribirme
                  pregunta={false}
                  intentado={intentado}
                  enviando={enviando}
                  error={error}
                  captcha={paso === 'confirmar'}
                  captchaKey={captchaKey}
                  token={token}
                  onToken={setToken}
                  onEnviar={enviar}
                />
              </section>
            </div>
            <div
              ref={panel => { panelesRef.current[1] = panel; }}
              className="ie-carrusel-panel"
              aria-hidden={paso !== 'listo'}
              inert={paso !== 'listo'}
            >
              {paso === 'listo' && (
                <section className="ie-tarjeta ie-pago" aria-label="Inscripción confirmada">
                  <PasoListo dni={dniCompleto(datos.dni)} waHref={waHref(`Hola, ya me inscribí en ${carrera.nombre}`)} />
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// El enlace trae el DNI enmascarado (30.1••.•56): sin el número completo,
// PasoListo muestra la frase genérica en vez de un usuario equivocado.
function dniCompleto(dni: string | undefined) {
  return dni && !dni.includes('•') ? dni : '';
}
