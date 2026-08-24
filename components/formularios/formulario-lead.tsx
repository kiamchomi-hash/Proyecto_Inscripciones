'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';
import { type CarreraOpcion, CATEGORIES, categoriasPresentes, getCategoryForCarrera, ordenarParaFormulario } from '@/components/index/types';
import { trackConsulta, type OrigenConsulta } from '@/lib/analytics';
import {
  CAMPOS, GRUPOS, armarPayload, camposComunes, camposDe, casaDeCarrera, obligatoriosDe,
  type CampoId, type CasaId, type Grupo, type Modo,
} from './casas';

interface Props {
  carreras: CarreraOpcion[];
  modo: Modo;
  /**
   * La casa, cuando la fija la página (`/teclab`). Si no viene, la deduce la
   * carrera que el lead elija: es el caso de la home, donde conviven las tres.
   */
  casa?: CasaId;
  origen?: OrigenConsulta;
}

type Valores = Partial<Record<CampoId, string | boolean>>;

const ETIQUETA = 'block text-[10px] font-bold text-[var(--catalogo-etiqueta)] mb-0.5 uppercase tracking-wider';
const CAMPO = 'w-full bg-[var(--catalogo-form-campo)] border rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--catalogo-texto-suave)]/60 focus:outline-none transition-colors';
const BORDE_OK = 'border-[var(--catalogo-acento)]/25 focus:border-[var(--catalogo-acento)]/60';
const BORDE_MAL = '!border-red-400/60';

const TITULO_GRUPO: Record<Grupo, string> = {
  consulta: '',
  personales: 'Datos personales',
  domicilio: 'Domicilio',
  estudios: 'Estudios y pago',
  contacto: '',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Espeja al PHONE del endpoint, pero contando dígitos en vez de caracteres: así
 * el server nunca rechaza un teléfono que acá dimos por bueno. Los mensajes van
 * cortos a propósito, para que entren en el hueco de una línea y su aparición
 * no mueva el resto del formulario.
 */
function errorDeTelefono(valor: string) {
  const limpio = valor.trim();
  if (!limpio) return '';
  if (!/^[\d\s()+-]+$/.test(limpio)) return 'Solo números, espacios y + - ( ).';
  if (limpio.replace(/\D/g, '').length < 8) return 'Ingresá al menos 8 dígitos.';
  if (limpio.length > 30) return 'Teléfono demasiado largo.';
  return '';
}

function Campo({ id, valor, onChange, obligatorio, error }: {
  id: CampoId;
  valor: string | boolean | undefined;
  onChange: (valor: string | boolean) => void;
  obligatorio: boolean;
  error?: string;
}) {
  const campo = CAMPOS[id];
  const htmlId = `form-${id}`;
  const marca = obligatorio ? <span className="text-red-400/70"> *</span> : null;

  if (campo.tipo === 'checkbox') {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <div className="relative flex h-4 w-4 flex-shrink-0 items-center justify-center">
          <input
            type="checkbox"
            id={htmlId}
            checked={valor === true}
            onChange={event => onChange(event.target.checked)}
            className="peer h-full w-full cursor-pointer appearance-none rounded border border-[var(--catalogo-acento)]/30 bg-[var(--catalogo-form-campo)] transition-colors checked:border-[var(--catalogo-acento)] checked:bg-[var(--catalogo-acento)] focus:outline-none"
          />
          <svg className="pointer-events-none absolute inset-0 m-auto h-2.5 w-2.5 text-[var(--catalogo-acento-tinta)] opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <label htmlFor={htmlId} className="cursor-pointer text-xs text-[var(--catalogo-etiqueta)]">{campo.label}</label>
      </div>
    );
  }

  if (campo.tipo === 'select') {
    return (
      <div>
        <label className={ETIQUETA} htmlFor={htmlId}>{campo.label}{marca}</label>
        <div className="relative">
          <select
            id={htmlId}
            value={typeof valor === 'string' ? valor : ''}
            onChange={event => onChange(event.target.value)}
            className={`${CAMPO} ${error ? BORDE_MAL : BORDE_OK} cursor-pointer appearance-none`}
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Sin especificar</option>
            {(campo.opciones ?? []).map(opcion => <option key={opcion} value={opcion}>{opcion}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--catalogo-acento)]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className={ETIQUETA} htmlFor={htmlId}>{campo.label}{marca}</label>
      <input
        type={id === 'email' ? 'email' : id === 'telefono' ? 'tel' : 'text'}
        id={htmlId}
        inputMode={campo.numerico ? 'numeric' : undefined}
        placeholder={campo.placeholder}
        value={typeof valor === 'string' ? valor : ''}
        onChange={event => onChange(event.target.value)}
        maxLength={campo.max}
        className={`${CAMPO} ${error ? BORDE_MAL : BORDE_OK}`}
      />
      {error && <p className="mt-0.5 min-h-4 text-[11px] leading-4 text-red-400">{error}</p>}
    </div>
  );
}

export default function FormularioLead({ carreras, modo, casa, origen = 'home' }: Props) {
  // Un solo objeto, no un useState por campo: es lo que permite que al cambiar
  // de carrera lo ya cargado siga ahí. Los campos que la casa nueva no pide se
  // dejan de pintar, pero no se borran ni viajan — de eso se ocupa armarPayload.
  const [valores, setValores] = useState<Valores>({});
  const [carreraElegida, setCarreraElegida] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [verLista, setVerLista] = useState(false);
  const [tipoElegido, setTipoElegido] = useState('');
  const [verTipos, setVerTipos] = useState(false);
  const [token, setToken] = useState('');
  // Cambiar la key remonta el widget y pide un token nuevo (son de un solo uso).
  const [captchaKey, setCaptchaKey] = useState(0);
  // El token vence a los 300 s; sin avisar, el botón se apaga sin motivo visible.
  const [captchaVencido, setCaptchaVencido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');
  const listaRef = useRef<HTMLDivElement>(null);
  const tiposRef = useRef<HTMLDivElement>(null);

  const carrera = useMemo(
    () => carreras.find(opcion => opcion.nombre === carreraElegida) || null,
    [carreras, carreraElegida],
  );

  // La casa que manda: la fija de la página, o la que trae la carrera elegida.
  const casaActiva = casa ?? casaDeCarrera(carrera);
  const campos = casaActiva ? camposDe(casaActiva, modo) : camposComunes(modo);
  const obligatorios = casaActiva ? obligatoriosDe(casaActiva, modo) : [];

  const categorias = useMemo(() => categoriasPresentes(carreras), [carreras]);
  const categoriaDetectada = carrera ? getCategoryForCarrera(carrera) : '';
  const filtro = tipoElegido || categoriaDetectada;
  const ordenadas = useMemo(() => ordenarParaFormulario(carreras), [carreras]);
  const filtradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return ordenadas.filter(opcion => {
      const porTipo = !filtro || getCategoryForCarrera(opcion) === filtro;
      const porTexto = !query || opcion.nombre.toLowerCase().includes(query);
      return porTipo && porTexto;
    });
  }, [ordenadas, busqueda, filtro]);

  useEffect(() => {
    const alClickear = (evento: MouseEvent) => {
      if (listaRef.current && !listaRef.current.contains(evento.target as Node)) setVerLista(false);
      if (tiposRef.current && !tiposRef.current.contains(evento.target as Node)) setVerTipos(false);
    };
    document.addEventListener('mousedown', alClickear);
    return () => document.removeEventListener('mousedown', alClickear);
  }, []);

  const poner = useCallback((id: CampoId, valor: string | boolean) => {
    setValores(previos => ({ ...previos, [id]: valor }));
  }, []);

  const texto = (id: CampoId) => (typeof valores[id] === 'string' ? (valores[id] as string).trim() : '');
  const email = texto('email');
  const telefono = texto('telefono');
  const errorEmail = email && !EMAIL.test(email) ? 'El formato del email no es válido.' : '';
  const errorTelefono = errorDeTelefono(telefono);

  // Falta algún obligatorio de esta casa. Sólo se aplica en preinscripción: un
  // legajo a medias no sirve para preinscribir a nadie, pero una consulta que
  // rebota por un campo vacío es un lead perdido.
  const faltanObligatorios = obligatorios.filter(id => {
    const valor = valores[id];
    return typeof valor === 'boolean' ? false : !String(valor ?? '').trim();
  });

  const hayContacto = Boolean(email || telefono);
  const valido = hayContacto && !errorEmail && !errorTelefono && !faltanObligatorios.length && Boolean(token);

  const limpiar = () => {
    setListo(false);
    setValores({});
    setCarreraElegida(''); setBusqueda(''); setTipoElegido('');
    setVerLista(false); setVerTipos(false);
    setToken(''); setCaptchaKey(key => key + 1); setCaptchaVencido(false);
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    setError('');

    const etiquetaTipo = filtro ? (CATEGORIES.find(c => c.id === filtro)?.label || filtro) : null;
    // Sin casa determinada el sobre viaja sin discriminador: el endpoint lo
    // guarda en null y la consulta entra igual.
    const base = casaActiva
      ? armarPayload(casaActiva, modo, valores)
      : { ...valores };

    try {
      const respuesta = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'consulta',
          token,
          payload: { ...base, carrera: carreraElegida || null, tipo: etiquetaTipo },
        }),
      });
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null) as { error?: string } | null;
        throw new Error(detalle?.error || 'submit_failed');
      }
    } catch (fallo) {
      const motivo = fallo instanceof Error ? fallo.message : '';
      setError(motivo === 'Demasiadas solicitudes'
        ? 'Recibimos varias consultas desde tu conexión. Esperá unos minutos o escribinos por WhatsApp.'
        : 'Hubo un error al enviar. Intentá de nuevo o contactanos por WhatsApp.');
      setEnviando(false);
      setToken(''); setCaptchaKey(key => key + 1); setCaptchaVencido(false);
      return;
    }

    trackConsulta(origen, carreraElegida || null, etiquetaTipo);
    setEnviando(false);
    setListo(true);
  };

  const esPreinscripcion = modo === 'preinscripcion';
  const titulo = esPreinscripcion ? 'PREINSCRIPCIÓN' : 'CONTACTO';
  const bajada = esPreinscripcion
    ? 'Completá tus datos y adelantamos tu preinscripción.'
    : 'Dejanos tus datos y te contactamos para orientarte.';

  return (
    <section
      id={esPreinscripcion ? 'preinscripcion' : 'formulario'}
      className="relative overflow-hidden"
      style={{ borderTop: '2px solid var(--catalogo-acento)', background: 'var(--catalogo-form-fondo)', scrollMarginTop: 'var(--navbar-height, 60px)' }}
    >
      <div className="mx-auto w-full max-w-[2400px] px-4 py-4 sm:px-8 sm:py-6 xl:px-20">
        <div
          className="form-card relative overflow-hidden"
          style={{ background: 'var(--catalogo-form-tarjeta)', border: '1px solid rgba(var(--catalogo-acento-rgb), 0.3)', borderRadius: '1rem' }}
        >
          {listo && (
            <div className="form-success-overlay active">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--catalogo-acento)]">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-black uppercase tracking-tight text-white">
                  {esPreinscripcion ? 'Preinscripción enviada' : 'Consulta enviada'}
                </p>
                <p className="text-sm text-[var(--catalogo-texto-suave)]">Nos comunicamos a la brevedad</p>
                <button type="button" onClick={limpiar} className="mt-1 text-sm font-bold text-[var(--catalogo-acento)] underline underline-offset-2 hover:text-white">
                  Enviar otra
                </button>
              </div>
            </div>
          )}

          <form onSubmit={enviar} noValidate className={listo ? 'invisible' : undefined} aria-hidden={listo}>
            <div className="px-3 pb-3 pt-4 sm:px-4" style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
              <h2 className="text-center text-xl font-black uppercase leading-none tracking-tighter sm:text-2xl">
                <span className="text-white">FORMULARIO DE </span>
                <span className="text-[var(--catalogo-acento)]">{titulo}</span>
              </h2>
              <p className="mt-1 text-center text-xs text-[var(--catalogo-texto-suave)]">{bajada}</p>
            </div>

            {/* Elegir carrera es lo que define la casa, así que va primero. */}
            <div className="space-y-2 px-3 pb-3 pt-3 sm:px-4" style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
              <div className="flex items-end gap-1.5">
                <div ref={listaRef} className="relative min-w-0 flex-1">
                  <label className={ETIQUETA} htmlFor="form-carrera">Carrera</label>
                  <div className="relative">
                    <input
                      id="form-carrera"
                      type="text"
                      value={busqueda}
                      onChange={event => { setBusqueda(event.target.value); setCarreraElegida(''); setVerLista(true); }}
                      onFocus={() => setVerLista(true)}
                      placeholder="Buscar carrera..."
                      autoComplete="off"
                      maxLength={100}
                      className={`${CAMPO} ${BORDE_OK} pr-8`}
                    />
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--catalogo-acento)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {verLista && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] shadow-xl" style={{ maxHeight: 160, overflowY: 'auto' }}>
                        {filtradas.map(opcion => (
                          <button
                            key={opcion.id}
                            type="button"
                            onClick={() => { setCarreraElegida(opcion.nombre); setBusqueda(opcion.nombre); setVerLista(false); }}
                            className="w-full border-b border-[var(--catalogo-acento)]/15 px-3 py-1.5 text-left text-sm text-white transition-colors last:border-b-0 hover:bg-[var(--catalogo-acento)]/10"
                          >
                            {opcion.nombre}
                          </button>
                        ))}
                        {!filtradas.length && <div className="px-3 py-2 text-sm text-[var(--catalogo-texto-suave)]">Sin resultados</div>}
                      </div>
                    )}
                  </div>
                </div>

                <div ref={tiposRef} className="relative shrink-0">
                  <label className={ETIQUETA}>Tipo</label>
                  <button
                    type="button"
                    onClick={() => setVerTipos(!verTipos)}
                    className={`relative h-full cursor-pointer rounded-lg border bg-[var(--catalogo-form-campo)] py-1.5 pl-2.5 pr-7 text-left text-sm font-bold transition-colors focus:outline-none ${filtro ? 'border-[var(--catalogo-acento)]/50 text-[var(--catalogo-acento)]' : 'border-[var(--catalogo-acento)]/25 text-[var(--catalogo-texto-suave)]'}`}
                  >
                    {filtro ? (categorias.find(categoria => categoria.id === filtro)?.label || 'Todos') : 'Todos'}
                    <svg className={`pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--catalogo-acento)]/60 transition-transform ${verTipos ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {verTipos && (
                    <div className="absolute right-0 z-20 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] shadow-xl">
                      <button type="button" onClick={() => { setTipoElegido(''); setCarreraElegida(''); setBusqueda(''); setVerTipos(false); }} className="w-full px-3 py-1.5 text-left text-sm text-white hover:bg-[var(--catalogo-acento)]/10">Todos</button>
                      {categorias.map(categoria => (
                        <button
                          key={categoria.id}
                          type="button"
                          onClick={() => { setTipoElegido(categoria.id); setCarreraElegida(''); setBusqueda(''); setVerTipos(false); }}
                          className="w-full border-t border-[var(--catalogo-acento)]/15 px-3 py-1.5 text-left text-sm text-white hover:bg-[var(--catalogo-acento)]/10"
                        >
                          {categoria.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {esPreinscripcion && !casaActiva && (
                <p className="text-[11px] leading-4 text-[var(--catalogo-texto-suave)]">
                  Elegí la carrera y te pedimos sólo los datos que hacen falta para esa preinscripción.
                </p>
              )}
            </div>

            {/* Los bloques salen de la declaración de la casa: si no pide nada
                de un grupo, ese bloque no se pinta. */}
            {GRUPOS.map(grupo => {
              const delGrupo = campos.filter(id => CAMPOS[id].grupo === grupo);
              if (!delGrupo.length) return null;
              const titulo = TITULO_GRUPO[grupo];

              return (
                <div key={grupo} className="space-y-2 px-3 pb-3 pt-3 sm:px-4" style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
                  {titulo && <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--catalogo-acento)]">{titulo}</p>}
                  {grupo === 'contacto' && (
                    <p className="text-[12px] leading-snug text-white">
                      <strong className="text-[var(--catalogo-acento)]">Obligatorio:</strong> mail o teléfono
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {delGrupo.map(id => (
                      <Campo
                        key={id}
                        id={id}
                        valor={valores[id]}
                        onChange={valor => poner(id, valor)}
                        obligatorio={obligatorios.includes(id)}
                        error={id === 'email' ? errorEmail : id === 'telefono' ? errorTelefono : ''}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="space-y-2 px-3 py-2.5 sm:px-4 sm:py-3">
              <TurnstileWidget
                key={captchaKey}
                onVerify={nuevo => { setToken(nuevo); setCaptchaVencido(false); }}
                onExpire={() => { setToken(''); setCaptchaVencido(true); }}
              />
              <p className="min-h-4 text-[11px] leading-4 text-amber-300">{captchaVencido ? 'El captcha venció. Volvé a tildarlo.' : ''}</p>
              {Boolean(faltanObligatorios.length) && (
                <p className="text-[11px] leading-4 text-[var(--catalogo-texto-suave)]">
                  Faltan {faltanObligatorios.length} {faltanObligatorios.length === 1 ? 'dato' : 'datos'} marcados con <span className="text-red-400/70">*</span>.
                </p>
              )}
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={!valido || enviando}
                className="w-full rounded-lg py-2 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg, var(--catalogo-acento), var(--catalogo-acento-oscuro))', color: 'var(--catalogo-acento-tinta)', letterSpacing: '0.12em' }}
              >
                {enviando ? 'Enviando...' : esPreinscripcion ? 'Enviar preinscripción' : 'Enviar consulta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
