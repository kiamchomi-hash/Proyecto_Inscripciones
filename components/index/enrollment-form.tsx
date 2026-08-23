'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';
import { type CarreraOpcion, CATEGORIES, categoriasPresentes, getCategoryForCarrera, ordenarParaFormulario } from './types';
import { trackConsulta, type OrigenConsulta } from '@/lib/analytics';

interface Props {
  carreras: CarreraOpcion[];
  origen?: OrigenConsulta;
}

// Las clases del formulario, en un solo lugar: los campos de datos personales
// son once y repetirlas en cada uno hacía que una se corrigiera y las otras no.
const ETIQUETA = 'block text-[10px] font-bold text-[var(--catalogo-etiqueta)] mb-0.5 uppercase tracking-wider';
const CAMPO = 'w-full bg-[var(--catalogo-form-campo)] border rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--catalogo-texto-suave)]/60 focus:outline-none transition-colors';
const BORDE_OK = 'border-[var(--catalogo-acento)]/25 focus:border-[var(--catalogo-acento)]/60';

// Como figura en el DNI argentino.
const SEXOS = ['Femenino', 'Masculino', 'Otro'];

function CampoTexto({ id, label, value, onChange, placeholder, maxLength = 100, inputMode }: {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: 'numeric';
}) {
  return (
    <div>
      <label className={ETIQUETA} htmlFor={id}>{label}</label>
      <input
        type="text"
        id={id}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        className={`${CAMPO} ${BORDE_OK}`}
      />
    </div>
  );
}

function CampoSelect({ id, label, value, onChange, opciones }: {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  opciones: readonly string[];
}) {
  return (
    <div>
      <label className={ETIQUETA} htmlFor={id}>{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`${CAMPO} ${BORDE_OK} appearance-none cursor-pointer`}
          style={{ colorScheme: 'dark' }}
        >
          <option value="">Sin especificar</option>
          {opciones.map(opcion => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--catalogo-acento)]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

function ContactForm({ carreras, showImage = true }: { carreras: CarreraOpcion[]; showImage?: boolean }) {
  const [selectedCarrera, setSelectedCarrera] = useState('');
  const [carreraSearch, setCarreraSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [showTipoDropdown, setShowTipoDropdown] = useState(false);
  const [modalidad, setModalidad] = useState('virtual');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaExpirado, setCaptchaExpirado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tipoDropdownRef = useRef<HTMLDivElement>(null);

  const formCategories = useMemo(() => categoriasPresentes(carreras), [carreras]);
  const detectedCategory = useMemo(() => {
    const carrera = carreras.find(option => option.nombre === selectedCarrera);
    return carrera ? getCategoryForCarrera(carrera) : '';
  }, [carreras, selectedCarrera]);
  const activeFilter = selectedTipo || detectedCategory;
  const tipoElegido = formCategories.find(category => category.id === activeFilter)?.label || null;
  const filteredCarreras = useMemo(() => {
    const query = carreraSearch.trim().toLowerCase();
    return carreras.filter(carrera => {
      const matchesType = !activeFilter || getCategoryForCarrera(carrera) === activeFilter;
      const matchesSearch = !query || carrera.nombre.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [activeFilter, carreraSearch, carreras]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
      if (tipoDropdownRef.current && !tipoDropdownRef.current.contains(event.target as Node)) setShowTipoDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emailInvalid = email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const telefonoTrim = telefono.trim();
  const telefonoError =
    telefonoTrim === '' ? ''
    : !/^[\d\s()+-]+$/.test(telefonoTrim) ? 'Solo números, espacios y + - ( ).'
    : telefonoTrim.replace(/\D/g, '').length < 8 ? 'Ingresá al menos 8 dígitos.'
    : telefonoTrim.length > 30 ? 'Teléfono demasiado largo.'
    : '';
  const isValid = (email.trim() || telefonoTrim) && !emailInvalid && !telefonoError && !!turnstileToken;
  const inputClass = 'w-full bg-[var(--catalogo-form-campo)] border border-[var(--catalogo-acento)]/25 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--catalogo-texto-suave)]/60 focus:outline-none focus:border-[var(--catalogo-acento)]/60 transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'consulta',
          token: turnstileToken,
          payload: {
            carrera: selectedCarrera || null,
            tipo: tipoElegido,
            modalidad,
            equivalencias: false,
            nombre,
            apellido,
            email,
            telefono,
            localidad,
          },
        }),
      });
      if (!response.ok) {
        const detalle = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(detalle?.error || 'submit_failed');
      }
    } catch (err) {
      const motivo = err instanceof Error ? err.message : '';
      setError(motivo === 'Demasiadas solicitudes'
        ? 'Recibimos varias consultas desde tu conexión. Esperá unos minutos o escribinos por WhatsApp.'
        : 'Hubo un error al enviar. Intentá de nuevo o contactanos por WhatsApp.');
      setSubmitting(false);
      setTurnstileToken('');
      setCaptchaKey((key) => key + 1);
      setCaptchaExpirado(false);
      return;
    }

    trackConsulta('contacto', selectedCarrera || null, tipoElegido);
    setSubmitting(false);
    setSuccess(true);
  };

  const reset = () => {
    setSuccess(false);
    setSelectedCarrera(''); setCarreraSearch(''); setSelectedTipo(''); setModalidad('virtual');
    setShowDropdown(false); setShowTipoDropdown(false);
    setNombre(''); setApellido(''); setEmail(''); setTelefono(''); setLocalidad('');
    setTurnstileToken(''); setCaptchaKey((key) => key + 1); setCaptchaExpirado(false);
  };

  return (
    <section id="formulario" className="relative overflow-hidden" style={{ borderTop: '2px solid var(--catalogo-acento)', background: 'var(--catalogo-form-fondo)', scrollMarginTop: 'var(--navbar-height, 60px)' }}>
      <div className={`${showImage ? 'contact-form-layout' : ''} mx-auto w-full max-w-[2400px] px-4 sm:px-8 xl:px-20 py-4 sm:py-6`}>
        <div className="form-content-col">
        <div className="form-card relative overflow-hidden" style={{ background: 'var(--catalogo-form-tarjeta)', border: '1px solid rgba(var(--catalogo-acento-rgb), 0.3)', borderRadius: '1rem' }}>
          {success && (
            <div className="form-success-overlay active">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--catalogo-acento)] flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-lg font-black text-white uppercase tracking-tight">Consulta enviada</p>
                <p className="text-sm text-[var(--catalogo-texto-suave)]">Nos comunicaremos a la brevedad</p>
                <button type="button" onClick={reset} className="mt-1 text-sm font-bold text-[var(--catalogo-acento)] hover:text-white underline underline-offset-2">Enviar otra consulta</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={success ? 'invisible' : undefined} aria-hidden={success}>
            <div className="px-3 sm:px-4 pt-4 pb-3" style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none text-center"><span className="text-white">FORMULARIO DE </span><span className="text-[var(--catalogo-acento)]">CONTACTO</span></h2>
              <p className="text-xs text-[var(--catalogo-texto-suave)] text-center mt-1">Dejanos tus datos y te contactamos para orientarte.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
              <div className="space-y-2 border-b border-[rgba(var(--catalogo-acento-rgb),0.15)] px-3 pt-3 pb-3 sm:px-4 lg:border-b-0 lg:border-r">
                <div ref={dropdownRef}>
                  <label htmlFor="contacto-carrera" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--catalogo-etiqueta)]">Carrera</label>
                  <div className="relative">
                    <input id="contacto-carrera" type="text" value={carreraSearch} onChange={e => { setCarreraSearch(e.target.value); setSelectedCarrera(''); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} placeholder="Buscar carrera..." autoComplete="off" maxLength={100} className={`${inputClass} pr-8`} />
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--catalogo-acento)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    {showDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-[var(--catalogo-form-campo)] border border-[var(--catalogo-acento)]/25 rounded-lg shadow-xl overflow-hidden" style={{ maxHeight: 160, overflowY: 'auto' }}>
                        {filteredCarreras.map(carrera => <button key={carrera.id} type="button" onClick={() => { setSelectedCarrera(carrera.nombre); setCarreraSearch(carrera.nombre); setShowDropdown(false); }} className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[var(--catalogo-acento)]/10 transition-colors border-b border-[var(--catalogo-acento)]/15 last:border-b-0">{carrera.nombre}</button>)}
                        {filteredCarreras.length === 0 && <div className="px-3 py-2 text-sm text-[var(--catalogo-texto-suave)]">Sin resultados</div>}
                      </div>
                    )}
                  </div>
                </div>
                <div ref={tipoDropdownRef} className="relative">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--catalogo-etiqueta)]">Tipo</label>
                  <button type="button" onClick={() => setShowTipoDropdown(!showTipoDropdown)} className={`relative w-full ${inputClass} cursor-pointer text-left ${activeFilter ? 'border-[var(--catalogo-acento)]/50 text-[var(--catalogo-acento)]' : ''}`}>
                    {activeFilter ? (formCategories.find(category => category.id === activeFilter)?.label || 'Todos') : 'Todos'}
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--catalogo-acento)]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showTipoDropdown && <div className="absolute z-20 w-full mt-1 bg-[var(--catalogo-form-campo)] border border-[var(--catalogo-acento)]/25 rounded-lg shadow-xl overflow-hidden">
                    <button type="button" onClick={() => { setSelectedTipo(''); setSelectedCarrera(''); setCarreraSearch(''); setShowTipoDropdown(false); }} className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[var(--catalogo-acento)]/10">Todos</button>
                    {formCategories.map(category => <button key={category.id} type="button" onClick={() => { setSelectedTipo(category.id); setSelectedCarrera(''); setCarreraSearch(''); setShowTipoDropdown(false); }} className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[var(--catalogo-acento)]/10 border-t border-[var(--catalogo-acento)]/15">{category.label}</button>)}
                  </div>}
                </div>
                <div>
                  <label htmlFor="contacto-modalidad" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--catalogo-etiqueta)]">Modalidad</label>
                  <select id="contacto-modalidad" value={modalidad} onChange={e => setModalidad(e.target.value)} className={`${inputClass} cursor-pointer`} style={{ colorScheme: 'dark' }}>
                    <option value="virtual">Educación Distribuida Home (Virtual)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2 px-3 pt-3 pb-3 sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--catalogo-acento)]">Datos opcionales</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={100} className={inputClass} />
                  <input type="text" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} maxLength={100} className={inputClass} />
                </div>
                <input type="text" placeholder="Localidad (opcional)" value={localidad} onChange={e => setLocalidad(e.target.value)} maxLength={100} className={inputClass} />
              </div>
            </div>

            <div className="px-3 sm:px-4 py-2.5 sm:py-3 space-y-2" style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
              <div className="space-y-1.5 rounded-lg p-2" style={{ border: '1.5px solid var(--catalogo-acento)' }}>
                <p className="text-[12px] text-white leading-snug flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--catalogo-acento)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                  <span><strong className="text-[var(--catalogo-acento)]">Obligatorio:</strong> mail o teléfono</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>
                    <label htmlFor="contacto-email" className="block text-[10px] font-bold text-[var(--catalogo-etiqueta)] mb-0.5 uppercase tracking-wider">Email {!telefono.trim() && <span className="text-red-400/70">*</span>}</label>
                    <input id="contacto-email" type="email" placeholder="Ejemplo: tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} maxLength={100} className={`${inputClass} ${emailInvalid ? '!border-red-400/60' : ''}`} />
                    <p className="text-[11px] leading-4 min-h-4 text-red-400 mt-0.5">{emailInvalid ? 'El formato del email no es válido.' : ''}</p>
                  </div>
                  <div>
                    <label htmlFor="contacto-telefono" className="block text-[10px] font-bold text-[var(--catalogo-etiqueta)] mb-0.5 uppercase tracking-wider">Telefono {!email.trim() && <span className="text-red-400/70">*</span>}</label>
                    <input id="contacto-telefono" type="tel" placeholder="Ejemplo: 11 1234-5678" value={telefono} onChange={e => setTelefono(e.target.value)} maxLength={100} className={`${inputClass} ${telefonoError ? '!border-red-400/60' : ''}`} />
                    <p className="text-[11px] leading-4 min-h-4 text-red-400 mt-0.5">{telefonoError}</p>
                  </div>
                </div>
              </div>
              <TurnstileWidget key={captchaKey} onVerify={(token) => { setTurnstileToken(token); setCaptchaExpirado(false); }} onExpire={() => { setTurnstileToken(''); setCaptchaExpirado(true); }} />
              <p className="text-[11px] leading-4 min-h-4 text-amber-300">{captchaExpirado ? 'El captcha venció. Volvé a tildarlo.' : ''}</p>
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              <button type="submit" disabled={!isValid || submitting} className="w-full py-2 font-black rounded-lg uppercase tracking-widest text-sm transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(90deg, var(--catalogo-acento), var(--catalogo-acento-oscuro))', color: 'var(--catalogo-acento-tinta)', letterSpacing: '0.12em' }}>{submitting ? 'Enviando...' : 'Enviar consulta'}</button>
            </div>
          </form>
        </div>
        </div>
        {showImage && <div className="contact-form-side-image" aria-hidden="true" />}
      </div>
    </section>
  );
}

export default function EnrollmentForm({ carreras, origen = 'home' }: Props) {
  const [selectedCarrera, setSelectedCarrera] = useState('');
  const [carreraSearch, setCarreraSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [showTipoDropdown, setShowTipoDropdown] = useState(false);
  const [equivalencias, setEquivalencias] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [lugarNacimiento, setLugarNacimiento] = useState('');
  const [nacionalidad, setNacionalidad] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [domicilioNumero, setDomicilioNumero] = useState('');
  const [domicilioPiso, setDomicilioPiso] = useState('');
  const [domicilioDepartamento, setDomicilioDepartamento] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [nivelEstudios, setNivelEstudios] = useState('');
  const [colegio, setColegio] = useState('');
  const [colegioLocalidad, setColegioLocalidad] = useState('');
  const [medioPago, setMedioPago] = useState('');
  // Todos los datos de preinscripción son opcionales en este formulario.
  const [dni, setDni] = useState('');
  const [sexo, setSexo] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  // Cambiar la key remonta el widget y pide un token nuevo (los tokens son de un solo uso)
  const [captchaKey, setCaptchaKey] = useState(0);
  // El token vence a los 300 s; sin avisar, el botón se apaga sin motivo visible
  const [captchaExpirado, setCaptchaExpirado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tipoDropdownRef = useRef<HTMLDivElement>(null);

  // Mostrar sólo categorías que realmente existen entre las carreras recibidas.
  // En la home siguen apareciendo todas; en /teclab quedan únicamente sus dos
  // familias y no se ofrecen filtros que siempre devolverían una lista vacía.
  const formCategories = useMemo(() => categoriasPresentes(carreras), [carreras]);

  // Detect category from selected carrera
  const detectedCategory = useMemo(() => {
    if (!selectedCarrera) return '';
    const found = carreras.find(c => c.nombre === selectedCarrera);
    if (!found) return '';
    return getCategoryForCarrera(found);
  }, [selectedCarrera, carreras]);

  // The active filter: manual selection always wins, fallback to detected
  const activeFilter = selectedTipo || detectedCategory;

  // Teclab no acredita equivalencias, así que el checkbox no va cuando la
  // consulta es de una de sus carreras. La landing lo apaga entera —toda su
  // oferta es Teclab— y en la home se apaga en cuanto el lead elige una
  // carrera o el tipo Teclab.
  const ofreceEquivalencias =
    origen !== 'teclab' && activeFilter !== 'teclab_tecnologia' && activeFilter !== 'teclab_gestion';

  // Destacadas arriba e Identidad Argentina al final, en vez del `orden` crudo de la base
  const carrerasOrdenadas = useMemo(() => ordenarParaFormulario(carreras), [carreras]);

  // Filtered carrera list for dropdown
  const filteredCarreras = useMemo(() => {
    let list = carrerasOrdenadas;
    if (activeFilter) {
      const cat = CATEGORIES.find(c => c.id === activeFilter);
      if (cat) {
        list = list.filter(c => getCategoryForCarrera(c) === activeFilter);
      }
    }
    if (carreraSearch.trim()) {
      const q = carreraSearch.toLowerCase();
      list = list.filter(c => c.nombre.toLowerCase().includes(q));
    }
    return list;
  }, [carrerasOrdenadas, carreraSearch, activeFilter]);

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailInvalid = email.trim() !== '' && !emailRegex.test(email.trim());

  // Espeja al PHONE de app/api/formularios/route.ts, pero contando dígitos en vez de
  // caracteres: así el server nunca rechaza un teléfono que acá dimos por bueno.
  const telefonoTrim = telefono.trim();
  // Los mensajes van cortos a propósito: el hueco que los aloja mide una línea fija,
  // así aparecen y desaparecen sin mover el resto del formulario.
  const telefonoError =
    telefonoTrim === '' ? ''
    : !/^[\d\s()+-]+$/.test(telefonoTrim) ? 'Solo números, espacios y + - ( ).'
    : telefonoTrim.replace(/\D/g, '').length < 8 ? 'Ingresá al menos 8 dígitos.'
    : telefonoTrim.length > 30 ? 'Teléfono demasiado largo.'
    : '';
  const telefonoInvalid = telefonoError !== '';

  // Form validity: at least email or telefono, and both must be valid
  const contactValid = (email.trim() || telefono.trim()) && !emailInvalid && !telefonoInvalid;
  const isValid = contactValid && !!turnstileToken;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (tipoDropdownRef.current && !tipoDropdownRef.current.contains(e.target as Node)) {
        setShowTipoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCarrera = useCallback((nombre: string) => {
    setSelectedCarrera(nombre);
    setCarreraSearch(nombre);
    setShowDropdown(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError('');

    const tipoElegido = activeFilter
      ? (CATEGORIES.find(c => c.id === activeFilter)?.label || activeFilter)
      : null;

    try {
      const response = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'consulta',
          token: turnstileToken,
          payload: {
            carrera: selectedCarrera || null,
            tipo: tipoElegido,
            modalidad: 'virtual',
            // Si el lead lo tildó y después eligió una carrera de Teclab, el
            // checkbox desaparece pero el estado sigue en true: lo que viaja es
            // el valor efectivo, no el que quedó colgado.
            equivalencias: ofreceEquivalencias && equivalencias,
            nombre,
            apellido,
            email,
            telefono,
            localidad,
            dni,
            sexo,
            fechaNacimiento,
            lugarNacimiento,
            nacionalidad,
            estadoCivil,
            domicilio,
            domicilioNumero,
            domicilioPiso,
            domicilioDepartamento,
            codigoPostal,
            nivelEstudios,
            colegio,
            colegioLocalidad,
            medioPago,
          },
        }),
      });
      if (!response.ok) {
        const detalle = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(detalle?.error || 'submit_failed');
      }
    } catch (err) {
      const motivo = err instanceof Error ? err.message : '';
      setError(motivo === 'Demasiadas solicitudes'
        ? 'Recibimos varias consultas desde tu conexión. Esperá unos minutos o escribinos por WhatsApp.'
        : 'Hubo un error al enviar. Intentá de nuevo o contactanos por WhatsApp.');
      setSubmitting(false);
      setTurnstileToken('');
      setCaptchaKey((k) => k + 1);
      setCaptchaExpirado(false);
      return;
    }

    trackConsulta(origen, selectedCarrera || null, tipoElegido);
    setSubmitting(false);
    setSuccess(true);
  };

  if (origen !== 'teclab') {
    return <ContactForm carreras={carreras} showImage={false} />;
  }

  return (
    <>
      {origen === 'teclab' && <ContactForm carreras={carreras} />}
    <section id={origen === 'teclab' ? 'preinscripcion' : 'formulario'} className="relative overflow-hidden" style={{ borderTop: '2px solid var(--catalogo-acento)', background: 'var(--catalogo-form-fondo)', scrollMarginTop: 'var(--navbar-height, 60px)' }}>
      <div className="form-layout-grid mx-auto w-full px-4 sm:px-8 xl:px-20 py-4 sm:py-6 relative z-[1]">
        <div className="form-content-col">
        <div className="form-card relative" style={{ background: 'var(--catalogo-form-tarjeta)', border: '1px solid rgba(var(--catalogo-acento-rgb), 0.3)', borderRadius: '1rem' }}>

          {/* Success overlay */}
          {success && (
            <div className="form-success-overlay active">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--catalogo-acento)] flex items-center justify-center" style={{ animation: 'formSuccessPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3} style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'formSuccessCheck 0.4s ease 0.6s forwards' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-black text-white uppercase tracking-tight" style={{ opacity: 0, animation: 'formSuccessFade 0.3s ease 0.7s forwards' }}>
                  Consulta enviada
                </p>
                <p className="text-sm text-[var(--catalogo-texto-suave)]" style={{ opacity: 0, animation: 'formSuccessFade 0.3s ease 0.85s forwards' }}>
                  Nos comunicaremos a la brevedad
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setSelectedCarrera(''); setCarreraSearch(''); setSelectedTipo('');
                    setNombre(''); setApellido(''); setEmail(''); setTelefono('');
                    setLocalidad(''); setEquivalencias(false); setTurnstileToken('');
                    setDni(''); setSexo('');
                    setFechaNacimiento(''); setLugarNacimiento(''); setNacionalidad(''); setEstadoCivil('');
                    setDomicilio(''); setDomicilioNumero(''); setDomicilioPiso(''); setDomicilioDepartamento('');
                    setCodigoPostal(''); setNivelEstudios(''); setColegio(''); setColegioLocalidad('');
                    setMedioPago('');
                  }}
                  className="mt-2 text-sm font-bold text-[var(--catalogo-acento)] hover:text-white transition-colors cursor-pointer underline underline-offset-2"
                  style={{ opacity: 0, animation: 'formSuccessFade 0.3s ease 1s forwards' }}
                >
                  Enviar otra consulta
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Header */}
            <div className="form-card-header px-3 sm:px-4 pt-4 pb-3" style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)', borderRadius: '1rem 1rem 0 0' }}>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none text-center">
                <span className="text-white">FORMULARIO DE </span>
                <span className="text-[var(--catalogo-acento)]">{origen === 'teclab' ? 'PREINSCRIPCIÓN' : 'CONTACTO'}</span>
              </h2>
              <p className="text-xs text-[var(--catalogo-texto-suave)] text-center mt-1">{origen === 'teclab' ? 'Completá tus datos para adelantar tu preinscripción.' : 'Dejanos tus datos y un asesor te contacta'}</p>
            </div>

            {/* Body: 2 columns on md */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>

              {/* Col 1: Carrera selection */}
              <div className="px-3 sm:px-4 pt-3 pb-3 space-y-2" style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>

                {/* Carrera searchable dropdown + tipo filter */}
                <div ref={dropdownRef}>
                  <label className="block text-[10px] font-bold text-[var(--catalogo-etiqueta)] mb-0.5 uppercase tracking-wider">
                    Seleccionar carrera
                  </label>

                  {/* Search + tipo side by side */}
                  <div className="flex gap-1.5">
                    <div className="relative flex-1 min-w-0">
                      <input
                        type="text"
                        value={carreraSearch}
                        onChange={e => { setCarreraSearch(e.target.value); setSelectedCarrera(''); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Buscar carrera..."
                        autoComplete="off"
                        maxLength={100}
                        className="w-full bg-[var(--catalogo-form-campo)] border border-[var(--catalogo-acento)]/25 rounded-lg px-3 py-1.5 pr-8 text-sm text-white placeholder-[var(--catalogo-texto-suave)]/60 focus:outline-none focus:border-[var(--catalogo-acento)]/60 transition-colors"
                      />
                      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--catalogo-acento)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>

                      {showDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-[var(--catalogo-form-campo)] border border-[var(--catalogo-acento)]/25 rounded-lg shadow-xl overflow-hidden" style={{ maxHeight: 160, overflowY: 'auto' }}>
                          {filteredCarreras.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCarrera(c.nombre)}
                              className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[var(--catalogo-acento)]/10 transition-colors border-b border-[var(--catalogo-acento)]/15 last:border-b-0"
                            >
                              {c.nombre}
                            </button>
                          ))}
                          {filteredCarreras.length === 0 && (
                            <div className="px-3 py-2 text-sm text-[var(--catalogo-texto-suave)]">Sin resultados</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tipo selector (custom dropdown) */}
                    <div className="relative shrink-0" ref={tipoDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowTipoDropdown(!showTipoDropdown)}
                        className={`bg-[var(--catalogo-form-campo)] border rounded-lg pl-2.5 pr-7 py-1.5 text-sm font-bold focus:outline-none transition-colors cursor-pointer h-full text-left ${
                          activeFilter
                            ? 'border-[var(--catalogo-acento)]/50 text-[var(--catalogo-acento)]'
                            : 'border-[var(--catalogo-acento)]/25 text-[var(--catalogo-texto-suave)]'
                        }`}
                      >
                        {activeFilter ? (formCategories.find(c => c.id === activeFilter)?.label || 'Todos') : 'Todos'}
                      </button>
                      <svg className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--catalogo-acento)]/60 transition-transform ${showTipoDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>

                      {showTipoDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-[var(--catalogo-form-campo)] border border-[var(--catalogo-acento)]/25 rounded-lg shadow-xl overflow-hidden right-0 min-w-[140px]" style={{ maxHeight: 200, overflowY: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => { setSelectedTipo(''); setSelectedCarrera(''); setCarreraSearch(''); setShowTipoDropdown(false); }}
                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors border-b border-[var(--catalogo-acento)]/15 ${!activeFilter ? 'text-[var(--catalogo-acento)] bg-[var(--catalogo-acento)]/10' : 'text-white hover:bg-[var(--catalogo-acento)]/10'}`}
                          >
                            Todos
                          </button>
                          {formCategories.map((c, i) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedTipo(c.id); setSelectedCarrera(''); setCarreraSearch(''); setShowTipoDropdown(false); }}
                              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${i < formCategories.length - 1 ? 'border-b border-[var(--catalogo-acento)]/15' : ''} ${activeFilter === c.id ? 'text-[var(--catalogo-acento)] bg-[var(--catalogo-acento)]/10' : 'text-white hover:bg-[var(--catalogo-acento)]/10'}`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modalidad */}
                <div>
                  <label htmlFor="form-modalidad" className="block text-[10px] font-bold text-[var(--catalogo-etiqueta)] mb-0.5 uppercase tracking-wider">
                    Modalidad
                  </label>
                  <div className="relative">
                    <select
                      id="form-modalidad"
                      className="w-full appearance-none bg-[var(--catalogo-form-campo)] border border-[var(--catalogo-acento)]/25 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--catalogo-acento)]/60 transition-colors cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                      defaultValue="virtual"
                    >
                      <option value="virtual">Educacion Distribuida Home (Virtual)</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--catalogo-acento)]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Equivalencias checkbox */}
                {ofreceEquivalencias && (
                <div className="flex items-center gap-2 py-0.5">
                  <div className="relative flex items-center justify-center flex-shrink-0 w-4 h-4">
                    <input
                      type="checkbox"
                      id="form-equivalencias"
                      checked={equivalencias}
                      onChange={e => setEquivalencias(e.target.checked)}
                      className="peer w-full h-full appearance-none bg-[var(--catalogo-form-campo)] border border-[var(--catalogo-acento)]/30 rounded checked:bg-[var(--catalogo-acento)] checked:border-[var(--catalogo-acento)] focus:outline-none cursor-pointer transition-colors"
                    />
                    <svg className="pointer-events-none absolute inset-0 m-auto h-2.5 w-2.5 text-[var(--catalogo-acento-tinta)] opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <label htmlFor="form-equivalencias" className="text-xs text-[var(--catalogo-etiqueta)] cursor-pointer">
                    Quiero acreditar equivalencias
                  </label>
                </div>
                )}
                <div className="pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--catalogo-acento)]">Datos personales · opcionales</p>
                  <p className="text-[11px] leading-4 text-[var(--catalogo-texto-suave)]">No son necesarios para enviar la consulta.</p>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <CampoTexto id="form-nombre" label="Nombre" placeholder="Nombre" value={nombre} onChange={setNombre} />
                  <CampoTexto id="form-apellido" label="Apellido" placeholder="Apellido" value={apellido} onChange={setApellido} />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <CampoTexto id="form-dni" label="DNI" placeholder="Tu DNI" value={dni} onChange={setDni} maxLength={12} inputMode="numeric" />
                  <CampoSelect id="form-sexo" label="Sexo" value={sexo} onChange={setSexo} opciones={SEXOS} />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <CampoTexto id="form-fecha-nacimiento" label="Fecha de nacimiento" placeholder="DD/MM/AAAA" value={fechaNacimiento} onChange={setFechaNacimiento} maxLength={10} />
                  <CampoTexto id="form-lugar-nacimiento" label="Lugar de nacimiento" placeholder="Ciudad y provincia" value={lugarNacimiento} onChange={setLugarNacimiento} />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <CampoTexto id="form-nacionalidad" label="Nacionalidad" placeholder="Argentina" value={nacionalidad} onChange={setNacionalidad} />
                  <CampoSelect id="form-estado-civil" label="Estado civil" value={estadoCivil} onChange={setEstadoCivil} opciones={['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro']} />
                </div>
              </div>

              {/* Col 2: los datos del lead. Ninguno es obligatorio: el resto de
                  lo que pide la preinscripción se le pide después, a mano. */}
              <div className="px-3 sm:px-4 pt-3 pb-3 space-y-2" style={{ borderLeft: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--catalogo-acento)]">Domicilio y estudios · opcionales</p>
                  <p className="text-[11px] leading-4 text-[var(--catalogo-texto-suave)]">También podés completarlos más adelante en el portal.</p>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_5rem_4rem_5rem] gap-1.5">
                  <CampoTexto id="form-domicilio" label="Domicilio" placeholder="Calle" value={domicilio} onChange={setDomicilio} />
                  <CampoTexto id="form-domicilio-numero" label="Número" placeholder="N°" value={domicilioNumero} onChange={setDomicilioNumero} maxLength={10} inputMode="numeric" />
                  <CampoTexto id="form-domicilio-piso" label="Piso" placeholder="Piso" value={domicilioPiso} onChange={setDomicilioPiso} maxLength={6} />
                  <CampoTexto id="form-domicilio-depto" label="Depto." placeholder="Depto." value={domicilioDepartamento} onChange={setDomicilioDepartamento} maxLength={8} />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <CampoTexto id="form-codigo-postal" label="Código postal" placeholder="Código postal" value={codigoPostal} onChange={setCodigoPostal} maxLength={12} />
                  <CampoTexto id="form-localidad" label="Localidad" placeholder="Ciudad o localidad" value={localidad} onChange={setLocalidad} maxLength={120} />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <CampoTexto id="form-nivel-estudios" label="Nivel de estudios" placeholder="Secundario completo" value={nivelEstudios} onChange={setNivelEstudios} />
                  <CampoTexto id="form-colegio" label="Colegio" placeholder="Nombre del colegio" value={colegio} onChange={setColegio} />
                </div>

                <CampoTexto id="form-colegio-localidad" label="Localidad del colegio" placeholder="Ciudad o localidad" value={colegioLocalidad} onChange={setColegioLocalidad} />

                <CampoTexto
                  id="form-medio-pago"
                  label="Medio de pago"
                  placeholder="Según opción del portal"
                  value={medioPago}
                  onChange={setMedioPago}
                />
              </div>
            </div>

            {/* Cómo te escribimos: es lo único obligatorio, y va último para que
                el que abandona a mitad del formulario ya lo haya completado. */}
            <div className="px-3 sm:px-4 pt-3 pb-1" style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
              <div className="space-y-1.5 rounded-lg p-2" style={{ border: '1.5px solid var(--catalogo-acento)' }}>
                <p className="text-[12px] text-white leading-snug flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--catalogo-acento)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <span><strong className="text-[var(--catalogo-acento)]">Obligatorio:</strong> mail o teléfono</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--catalogo-etiqueta)] mb-0.5 uppercase tracking-wider" htmlFor="form-email">
                      Email {!telefono.trim() && <span className="text-red-400/70">*</span>}
                    </label>
                    <input
                      type="email"
                      id="form-email"
                      placeholder="Ejemplo: tu@correo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      maxLength={100}
                      className={`w-full bg-[var(--catalogo-form-campo)] border rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--catalogo-texto-suave)]/60 focus:outline-none transition-colors ${emailInvalid ? 'border-red-400/60 focus:border-red-400' : 'border-[var(--catalogo-acento)]/25 focus:border-[var(--catalogo-acento)]/60'}`}
                    />
                    <p className="text-[11px] leading-4 min-h-4 text-red-400 mt-0.5">
                      {emailInvalid ? 'El formato del email no es válido.' : ''}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--catalogo-etiqueta)] mb-0.5 uppercase tracking-wider" htmlFor="form-telefono">
                      Telefono {!email.trim() && <span className="text-red-400/70">*</span>}
                    </label>
                    <input
                      type="tel"
                      id="form-telefono"
                      placeholder="Ejemplo: 11 1234-5678"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      maxLength={100}
                      className={`w-full bg-[var(--catalogo-form-campo)] border rounded-lg px-3 py-1.5 text-sm text-white placeholder-[var(--catalogo-texto-suave)]/60 focus:outline-none transition-colors ${telefonoInvalid ? 'border-red-400/60 focus:border-red-400' : 'border-[var(--catalogo-acento)]/25 focus:border-[var(--catalogo-acento)]/60'}`}
                    />
                    <p className="text-[11px] leading-4 min-h-4 text-red-400 mt-0.5">{telefonoError}</p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-red-400 mt-1.5">{error}</p>
              )}
            </div>


            {/* Turnstile + Submit */}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 space-y-2">
              <TurnstileWidget
                key={captchaKey}
                onVerify={(token) => { setTurnstileToken(token); setCaptchaExpirado(false); }}
                onExpire={() => { setTurnstileToken(''); setCaptchaExpirado(true); }}
              />
              <p className="text-[11px] leading-4 min-h-4 text-amber-300">
                {captchaExpirado ? 'El captcha venció. Volvé a tildarlo.' : ''}
              </p>
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full py-2 font-black rounded-lg uppercase tracking-widest text-sm transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(90deg, var(--catalogo-acento), var(--catalogo-acento-oscuro))', color: 'var(--catalogo-acento-tinta)', letterSpacing: '0.12em' }}
              >
                {submitting ? 'Enviando...' : origen === 'teclab' ? 'Enviar preinscripción' : 'Enviar consulta'}
              </button>
              <a
                href="https://wa.me/5491166522722?text=Hola%2C%20quiero%20info%20sobre%20las%20carreras"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-[var(--catalogo-etiqueta)] hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                O escribinos por WhatsApp
              </a>
            </div>

          </form>
        </div>
        </div>

        {/* Ilustración lateral (visible >= 1600px). Es decorativa y va como
            background en el CSS: siendo SVG no gana nada pasando por next/image,
            que ademas exige habilitar dangerouslyAllowSVG. */}
      </div>
    </section>
    </>
  );
}
