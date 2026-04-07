'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Turnstile } from 'react-turnstile';
import { supabase } from '@/lib/supabase';
import { type Carrera, CATEGORIES, getCategoryForCarrera } from './types';

interface Props {
  carreras: Carrera[];
}

export default function EnrollmentForm({ carreras }: Props) {
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
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tipoDropdownRef = useRef<HTMLDivElement>(null);

  // Display categories (exclude 'all')
  const formCategories = useMemo(() => CATEGORIES.filter(c => c.id !== 'all'), []);

  // Detect category from selected carrera
  const detectedCategory = useMemo(() => {
    if (!selectedCarrera) return '';
    const found = carreras.find(c => c.nombre === selectedCarrera);
    if (!found) return '';
    return getCategoryForCarrera(found);
  }, [selectedCarrera, carreras]);

  // The active filter: manual selection always wins, fallback to detected
  const activeFilter = selectedTipo || detectedCategory;

  // Filtered carrera list for dropdown
  const filteredCarreras = useMemo(() => {
    let list = carreras;
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
  }, [carreras, carreraSearch, activeFilter]);

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailInvalid = email.trim() !== '' && !emailRegex.test(email.trim());

  // Form validity: at least email or telefono, and email must be valid
  const contactValid = (email.trim() || telefono.trim()) && !emailInvalid;
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

    // Verificar token Turnstile server-side
    try {
      const verifyRes = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        setError('No se pudo verificar el CAPTCHA. Intentá de nuevo.');
        setSubmitting(false);
        setTurnstileToken('');
        return;
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setSubmitting(false);
      setTurnstileToken('');
      return;
    }

    const { error: insertError } = await supabase.from('consultas').insert({
      carrera: selectedCarrera || null,
      tipo: activeFilter ? (CATEGORIES.find(c => c.id === activeFilter)?.label || activeFilter) : null,
      modalidad: 'virtual',
      equivalencias,
      nombre: nombre.trim() || null,
      apellido: apellido.trim() || null,
      email: email.trim() || null,
      telefono: telefono.trim() || null,
      localidad: localidad.trim() || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError('Hubo un error al enviar. Intenta de nuevo o contactanos por WhatsApp.');
      console.error('Form submit error:', insertError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelectedCarrera('');
      setCarreraSearch('');
      setSelectedTipo('');
      setNombre('');
      setApellido('');
      setEmail('');
      setTelefono('');
      setLocalidad('');
      setEquivalencias(false);
      setTurnstileToken('');
    }, 4000);
  };

  return (
    <section id="formulario" className="relative overflow-hidden" style={{ borderTop: '2px solid #00c7b1', background: '#162f2e', scrollMarginTop: 'var(--navbar-height, 60px)' }}>
      <div className="form-layout-grid mx-auto w-full px-4 sm:px-8 xl:px-20 py-4 sm:py-6 relative z-[1]">
        <div className="form-content-col">
        <div className="form-card relative" style={{ background: '#1c3a38', border: '1px solid rgba(0,199,177,0.3)', borderRadius: '1rem' }}>

          {/* Success overlay */}
          {success && (
            <div className="form-success-overlay active">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[#00c7b1] flex items-center justify-center" style={{ animation: 'formSuccessPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3} style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'formSuccessCheck 0.4s ease 0.6s forwards' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-black text-white uppercase tracking-tight" style={{ opacity: 0, animation: 'formSuccessFade 0.3s ease 0.7s forwards' }}>
                  Consulta enviada
                </p>
                <p className="text-sm text-[#7ca19b]" style={{ opacity: 0, animation: 'formSuccessFade 0.3s ease 0.85s forwards' }}>
                  Nos comunicaremos a la brevedad
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Header */}
            <div className="form-card-header px-3 sm:px-4 pt-4 pb-3" style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(0,199,177,0.15)', borderRadius: '1rem 1rem 0 0' }}>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none text-center">
                <span className="text-white">FORMULARIO DE </span>
                <span className="text-[#00c7b1]">CONTACTO</span>
              </h2>
            </div>

            {/* Body: 2 columns on md */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderBottom: '1px solid rgba(0,199,177,0.15)' }}>

              {/* Col 1: Carrera selection */}
              <div className="px-3 sm:px-4 pt-3 pb-3 space-y-2" style={{ borderBottom: '1px solid rgba(0,199,177,0.15)' }}>

                {/* Carrera searchable dropdown + tipo filter */}
                <div ref={dropdownRef}>
                  <label className="block text-[10px] font-bold text-[#9ac5be] mb-0.5 uppercase tracking-wider">
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
                        className="w-full bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg px-3 py-1.5 pr-8 text-sm text-white placeholder-[#7ca19b]/60 focus:outline-none focus:border-[#00c7b1]/60 transition-colors"
                      />
                      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#00c7b1]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>

                      {showDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg shadow-xl overflow-hidden" style={{ maxHeight: 160, overflowY: 'auto' }}>
                          {filteredCarreras.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCarrera(c.nombre)}
                              className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[#00c7b1]/10 transition-colors border-b border-[#00c7b1]/15 last:border-b-0"
                            >
                              {c.nombre}
                            </button>
                          ))}
                          {filteredCarreras.length === 0 && (
                            <div className="px-3 py-2 text-sm text-[#7ca19b]">Sin resultados</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tipo selector (custom dropdown) */}
                    <div className="relative shrink-0" ref={tipoDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowTipoDropdown(!showTipoDropdown)}
                        className={`bg-[#0f2825] border rounded-lg pl-2.5 pr-7 py-1.5 text-sm font-bold focus:outline-none transition-colors cursor-pointer h-full text-left ${
                          activeFilter
                            ? 'border-[#00c7b1]/50 text-[#00c7b1]'
                            : 'border-[#00c7b1]/25 text-[#7ca19b]'
                        }`}
                      >
                        {activeFilter ? (formCategories.find(c => c.id === activeFilter)?.label || 'Todos') : 'Todos'}
                      </button>
                      <svg className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#00c7b1]/60 transition-transform ${showTipoDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>

                      {showTipoDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg shadow-xl overflow-hidden right-0 min-w-[140px]" style={{ maxHeight: 200, overflowY: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => { setSelectedTipo(''); setSelectedCarrera(''); setCarreraSearch(''); setShowTipoDropdown(false); }}
                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors border-b border-[#00c7b1]/15 ${!activeFilter ? 'text-[#00c7b1] bg-[#00c7b1]/10' : 'text-white hover:bg-[#00c7b1]/10'}`}
                          >
                            Todos
                          </button>
                          {formCategories.map((c, i) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedTipo(c.id); setSelectedCarrera(''); setCarreraSearch(''); setShowTipoDropdown(false); }}
                              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${i < formCategories.length - 1 ? 'border-b border-[#00c7b1]/15' : ''} ${activeFilter === c.id ? 'text-[#00c7b1] bg-[#00c7b1]/10' : 'text-white hover:bg-[#00c7b1]/10'}`}
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
                  <label htmlFor="form-modalidad" className="block text-[10px] font-bold text-[#9ac5be] mb-0.5 uppercase tracking-wider">
                    Modalidad
                  </label>
                  <div className="relative">
                    <select
                      id="form-modalidad"
                      className="w-full appearance-none bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00c7b1]/60 transition-colors cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                      defaultValue="virtual"
                    >
                      <option value="virtual">Educacion Distribuida Home (Virtual)</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#00c7b1]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Equivalencias checkbox */}
                <div className="flex items-center gap-2 py-0.5">
                  <div className="relative flex items-center justify-center flex-shrink-0 w-4 h-4">
                    <input
                      type="checkbox"
                      id="form-equivalencias"
                      checked={equivalencias}
                      onChange={e => setEquivalencias(e.target.checked)}
                      className="peer w-full h-full appearance-none bg-[#0f2825] border border-[#00c7b1]/30 rounded checked:bg-[#00c7b1] checked:border-[#00c7b1] focus:outline-none cursor-pointer transition-colors"
                    />
                    <svg className="pointer-events-none absolute inset-0 m-auto h-2.5 w-2.5 text-[#013729] opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <label htmlFor="form-equivalencias" className="text-xs text-[#c8deda] cursor-pointer">
                    Quiero acreditar equivalencias
                  </label>
                </div>
              </div>

              {/* Col 2: Personal data */}
              <div className="px-3 sm:px-4 pt-3 pb-3 space-y-1.5" style={{ borderLeft: '1px solid rgba(0,199,177,0.15)' }}>
                {/* Nombre + Apellido */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#9ac5be] mb-0.5 uppercase tracking-wider" htmlFor="form-nombre">Nombre</label>
                    <input
                      type="text"
                      id="form-nombre"
                      placeholder="Nombre"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      maxLength={100}
                      className="w-full bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#7ca19b]/60 focus:outline-none focus:border-[#00c7b1]/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#9ac5be] mb-0.5 uppercase tracking-wider" htmlFor="form-apellido">Apellido</label>
                    <input
                      type="text"
                      id="form-apellido"
                      placeholder="Apellido"
                      value={apellido}
                      onChange={e => setApellido(e.target.value)}
                      maxLength={100}
                      className="w-full bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#7ca19b]/60 focus:outline-none focus:border-[#00c7b1]/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Contact info box */}
                <div className="space-y-1.5 rounded-lg p-2" style={{ border: '1.5px solid #00c7b1' }}>
                  <p className="text-[12px] text-white leading-snug flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c7b1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    Solo necesitamos un dato de contacto para escribirte (el resto es opcional)
                  </p>

                  <div>
                    <label className="block text-[10px] font-bold text-[#9ac5be] mb-0.5 uppercase tracking-wider" htmlFor="form-email">
                      Email {!telefono.trim() && <span className="text-red-400/70">*</span>}
                    </label>
                    <input
                      type="email"
                      id="form-email"
                      placeholder="Ejemplo: tu@correo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      maxLength={100}
                      className={`w-full bg-[#0f2825] border rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#7ca19b]/60 focus:outline-none transition-colors ${emailInvalid ? 'border-red-400/60 focus:border-red-400' : 'border-[#00c7b1]/25 focus:border-[#00c7b1]/60'}`}
                    />
                    {emailInvalid && (
                      <p className="text-[11px] text-red-400 mt-0.5">El formato del email no es válido.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#9ac5be] mb-0.5 uppercase tracking-wider" htmlFor="form-telefono">
                      Telefono {!email.trim() && <span className="text-red-400/70">*</span>}
                    </label>
                    <input
                      type="tel"
                      id="form-telefono"
                      placeholder="Ejemplo: 11 1234-5678"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      maxLength={100}
                      className="w-full bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#7ca19b]/60 focus:outline-none focus:border-[#00c7b1]/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Localidad */}
                <div>
                  <label className="block text-[10px] font-bold text-[#9ac5be] mb-0.5 uppercase tracking-wider" htmlFor="form-localidad">Localidad</label>
                  <input
                    type="text"
                    id="form-localidad"
                    placeholder="Tu ciudad o barrio"
                    value={localidad}
                    onChange={e => setLocalidad(e.target.value)}
                    maxLength={100}
                    className="w-full bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#7ca19b]/60 focus:outline-none focus:border-[#00c7b1]/60 transition-colors"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-[11px] text-red-400">{error}</p>
                )}
                {!contactValid && (email.trim() || telefono.trim()) && (
                  <p className="text-[11px] text-red-400">Completa al menos email o telefono.</p>
                )}
              </div>
            </div>


            {/* Turnstile + Submit */}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 space-y-2">
              {!turnstileToken && (
                <Turnstile
                  sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                  theme="dark"
                  size="flexible"
                />
              )}
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full py-2 font-black rounded-lg uppercase tracking-widest text-sm transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(90deg, #00c7b1, #009681)', color: '#013729', letterSpacing: '0.12em' }}
              >
                {submitting ? 'Enviando...' : 'Enviar consulta'}
              </button>
            </div>

          </form>
        </div>
        </div>

        {/* Side image (visible >= 1600px) */}
        <div className="form-side-image relative" aria-hidden="true">
          <Image
            src="/imagenes/imagenes_cau/Siglo21IMG_2555.jpg"
            alt="Estudiantes en el Centro de Aprendizaje Universitario Villa Lugano"
            fill
            className="object-cover object-right-center"
          />
        </div>
      </div>
    </section>
  );
}
