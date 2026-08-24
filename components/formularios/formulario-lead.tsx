'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';
import { type CarreraOpcion, CATEGORIES, categoriasPresentes, getCategoryForCarrera, ordenarParaFormulario } from '@/components/index/types';
import { trackConsulta, type OrigenConsulta } from '@/lib/analytics';
import {
  CAMPOS, armarPayload, camposComunes, camposDe, camposPosibles, casaDeCarrera, obligatoriosDe,
  type Campo as CampoDef, type CampoId, type CasaId, type Modo,
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

const SPAN: Record<NonNullable<CampoDef['ancho']>, string> = {
  completo: 'col-span-6',
  medio: 'col-span-6 sm:col-span-3',
  tercio: 'col-span-2',
};

/** Cuánto ocupa cada campo en la grilla de seis de su columna. */
const PESO = { completo: 6, medio: 3, tercio: 2 } as const;
const pesoDe = (id: CampoId) => PESO[CAMPOS[id].ancho ?? 'medio'];

/**
 * El ancho real de cada campo de una columna, en sextos.
 *
 * Es el declarado, salvo cuando dejaría un hueco: si el que sigue no entra en
 * lo que queda de la fila, el actual estira y la cierra. Sin esto, un campo de
 * fila entera después de uno de media —"Localidad" detrás de "Provincia"—
 * empujaba y dejaba medio renglón vacío colgando.
 */
function anchosDeColumna(campos: CampoId[]): number[] {
  const anchos = campos.map(pesoDe);
  let usado = 0;
  for (let i = 0; i < anchos.length; i++) {
    const libre = 6 - usado;
    if (i > 0 && anchos[i] > libre) {
      anchos[i - 1] += libre;
      usado = anchos[i] % 6;
    } else {
      usado = (usado + anchos[i]) % 6;
    }
  }
  if (usado !== 0) anchos[anchos.length - 1] += 6 - usado;
  return anchos;
}

/**
 * Reparte los campos entre las dos columnas.
 *
 * En **contacto** manda el agrupamiento: son seis campos y separar "lo que
 * consultás" de "tus datos" se lee bien.
 *
 * En **preinscripción** manda el equilibrio. Con el agrupamiento, Siglo 21
 * dejaba diez datos personales a la izquierda y sólo el domicilio a la derecha,
 * que ocupa la mitad de alto: la tarjeta quedaba coja. Como los rótulos de
 * columna ya no existen, las columnas no prometen un tema y repartir por peso
 * no engaña a nadie.
 *
 * El `12` del arranque es el buscador de carrera y su filtro, dos filas que
 * cuelgan siempre de la primera columna.
 */
function repartirColumnas(campos: CampoId[], esPreinscripcion: boolean): [CampoId[], CampoId[]] {
  if (!esPreinscripcion) {
    return [
      campos.filter(id => CAMPOS[id].grupo === 'consulta'),
      campos.filter(id => CAMPOS[id].grupo !== 'consulta'),
    ];
  }

  const pesos = campos.map(pesoDe);
  const total = pesos.reduce((suma, peso) => suma + peso, 0) + 12;

  // Se prueban todos los cortes y gana el más parejo. Que la última fila de
  // cada columna quede completa no se resuelve acá —con cantidades impares no
  // siempre se puede— sino estirando el último campo al pintarlo.
  let mejor = 0;
  let mejorPuntaje = Infinity;
  for (let corte = 0; corte <= campos.length; corte++) {
    const izq = pesos.slice(0, corte).reduce((suma, peso) => suma + peso, 12);
    const puntaje = Math.abs(izq - (total - izq));
    if (puntaje < mejorPuntaje) { mejorPuntaje = puntaje; mejor = corte; }
  }

  const izquierda = campos.slice(0, mejor);
  const derecha = campos.slice(mejor);
  return [izquierda, derecha];
}

/** Alto de la lista desplegada, en píxeles. */
const ALTO_LISTA = 224;

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/**
 * Los años posibles de nacimiento, del más probable al menos: un lead nuevo
 * suele estar terminando el secundario, no cumpliendo noventa.
 *
 * El año de hoy sale de `getFullYear()`, que es el local. Con `toISOString()`
 * saldría el de UTC, que en Argentina el 31 de diciembre a la noche ya es el
 * año siguiente.
 */
const ANIOS = Array.from(
  { length: 76 },
  (_, i) => String(new Date().getFullYear() - 15 - i),
);

/**
 * Cuántos días tiene ese mes. Todo entero: no hay coma flotante a la vista, que
 * es de donde salen los redondeos raros.
 */
function diasDelMes(anio: number, mes: number) {
  if (mes === 2) {
    const bisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
    return bisiesto ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

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


/**
 * Un desplegable propio que además se puede escribir.
 *
 * No es un `<select>` nativo por tres razones que se ven: el navegador decide
 * solo hacia qué lado abre la lista —con cuarenta opciones se iba para arriba—,
 * no deja darle al panel la tinta del formulario, y no se puede tipear para
 * llegar rápido a una opción.
 *
 * Escribir filtra la lista. Lo que quede escrito se guarda tal cual: si no es
 * una de las opciones, el campo se pinta en rojo y el envío no pasa. Al salir
 * del campo, si lo tipeado deja una sola opción posible, se completa sola — así
 * "arg" termina en "Argentina" sin obligar a elegirla del listado.
 */
function Desplegable({ id, valor, onChange, opciones, invalido }: {
  id: string;
  valor: string;
  onChange: (valor: string) => void;
  opciones: readonly string[];
  invalido?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  // `null` mientras no se está tipeando: ahí la lista se muestra entera.
  const [busqueda, setBusqueda] = useState<string | null>(null);
  // El rojo aparece al dar Enter con algo que no es una opción, no en cada
  // tecla: mientras se escribe "Uruguaya" todos los estados intermedios son
  // inválidos, y marcarlos hacía parpadear el campo letra por letra.
  const [marcado, setMarcado] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  const filtradas = useMemo(() => {
    const texto = (busqueda ?? '').trim().toLowerCase();
    if (!texto) return opciones;
    return opciones.filter(opcion => opcion.toLowerCase().includes(texto));
  }, [opciones, busqueda]);

  const cerrar = useCallback(() => {
    setAbierto(false);
    setBusqueda(previa => {
      // Si lo tipeado deja una sola opción, se adopta. Si no, queda como está
      // y el borde rojo se encarga de avisar.
      if (previa !== null && previa.trim()) {
        const texto = previa.trim().toLowerCase();
        const posibles = opciones.filter(opcion => opcion.toLowerCase().includes(texto));
        if (posibles.length === 1) onChange(posibles[0]);
      }
      return null;
    });
  }, [onChange, opciones]);

  useEffect(() => {
    if (!abierto) return;
    const afuera = (evento: MouseEvent) => {
      if (cajaRef.current && !cajaRef.current.contains(evento.target as Node)) cerrar();
    };
    const escape = (evento: KeyboardEvent) => { if (evento.key === 'Escape') cerrar(); };
    document.addEventListener('mousedown', afuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', afuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto, cerrar]);

  return (
    <div className="relative" ref={cajaRef}>
      <input
        type="text"
        id={id}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        value={busqueda ?? valor}
        placeholder="Sin especificar"
        onChange={evento => {
          setBusqueda(evento.target.value);
          onChange(evento.target.value);
          setMarcado(false);
          setAbierto(true);
        }}
        onFocus={() => { setBusqueda(null); setAbierto(true); }}
        onKeyDown={evento => {
          if (evento.key !== 'Enter') return;
          evento.preventDefault();
          const texto = (busqueda ?? valor).trim();
          const posibles = opciones.filter(opcion => opcion.toLowerCase().includes(texto.toLowerCase()));
          // Enter con una sola candidata la elige; con cualquier otra cosa,
          // rojo. Es el momento en que el lead dice "ya está, esto puse".
          if (texto && posibles.length === 1) {
            onChange(posibles[0]);
            setBusqueda(null);
            setAbierto(false);
            setMarcado(false);
          } else {
            setMarcado(Boolean(texto) && !opciones.includes(texto));
          }
        }}
        className={`${CAMPO} ${invalido || marcado ? BORDE_MAL : BORDE_OK} cursor-text pr-8`}
      />
      <svg
        onClick={() => { setAbierto(!abierto); setBusqueda(null); }}
        className={`absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 cursor-pointer text-[var(--catalogo-acento)]/60 transition-transform ${abierto ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>

      {/* Siempre hacia abajo: que se abriera para arriba desconcertaba más de lo
          que resolvía. */}
      {abierto && Boolean(filtradas.length) && (
        <div
          id={`${id}-lista`}
          role="listbox"
          className="absolute top-full z-30 mt-1 w-full overflow-auto rounded-lg border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] shadow-xl"
          style={{ maxHeight: ALTO_LISTA }}
        >
          {filtradas.map(opcion => (
            <button
              key={opcion}
              type="button"
              role="option"
              aria-selected={opcion === valor}
              onClick={() => { onChange(opcion); setBusqueda(null); setAbierto(false); }}
              className={`w-full border-b border-[var(--catalogo-acento)]/15 px-3 py-1.5 text-left text-sm transition-colors last:border-b-0 hover:bg-[var(--catalogo-acento)]/10 ${opcion === valor ? 'text-[var(--catalogo-acento)]' : 'text-white'}`}
            >
              {opcion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * La fecha de nacimiento: un campo solo, con calendario propio.
 *
 * No es el `<input type="date">` nativo porque su calendario es el del
 * navegador y no se puede vestir; ni tres desplegables, que resuelven el dato
 * pero se leen como un formulario dentro del formulario. Este es un calendario
 * de verdad, con la tinta del sitio.
 *
 * El mes y el año van en listas y no en flechitas: para una fecha de nacimiento
 * nadie llega a 1990 pasando meses de a uno.
 *
 * El valor sigue siendo el texto `AAAA-MM-DD`. Se parte y se arma con strings;
 * el único `Date` que aparece es `new Date(a, m - 1, 1)` para saber en qué día
 * de la semana cae el primero — ese constructor toma números y es hora local,
 * así que no arrastra el corrimiento de `new Date('1990-04-12')`, que se lee
 * como UTC y en Argentina devuelve el día anterior.
 */
function CampoFecha({ id, valor, onChange, invalido }: {
  id: string;
  valor: string;
  onChange: (valor: string) => void;
  invalido?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  const [anio = '', mes = '', dia = ''] = valor ? valor.split('-') : [];
  const [vista, setVista] = useState(() => ({
    anio: Number(anio) || Number(ANIOS[3]),
    mes: Number(mes) || 1,
  }));

  useEffect(() => {
    if (!abierto) return;
    const afuera = (evento: MouseEvent) => {
      if (cajaRef.current && !cajaRef.current.contains(evento.target as Node)) setAbierto(false);
    };
    const escape = (evento: KeyboardEvent) => { if (evento.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', afuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', afuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  const alternar = () => {
    if (!abierto && anio && mes) setVista({ anio: Number(anio), mes: Number(mes) });
    setAbierto(!abierto);
  };

  const elegir = (numero: number) => {
    onChange(`${vista.anio}-${String(vista.mes).padStart(2, '0')}-${String(numero).padStart(2, '0')}`);
    setAbierto(false);
  };

  const total = diasDelMes(vista.anio, vista.mes);
  // getDay() da 0 para domingo; acá la semana empieza el lunes.
  const arranque = (new Date(vista.anio, vista.mes - 1, 1).getDay() + 6) % 7;

  return (
    <div className="relative" ref={cajaRef}>
      <button
        type="button"
        id={id}
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={`${CAMPO} ${invalido ? BORDE_MAL : BORDE_OK} cursor-pointer pr-11 text-left ${valor ? 'text-white' : 'text-[var(--catalogo-texto-suave)]/60'}`}
      >
        {valor ? `${dia}/${mes}/${anio}` : 'DD/MM/AAAA'}
        {/* El ícono va en su propio recuadro, pegado al borde del campo. */}
        <span className="pointer-events-none absolute right-1 top-1/2 flex h-7 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-acento)]/10">
          <svg className="h-3.5 w-3.5 text-[var(--catalogo-acento)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </span>
      </button>

      {abierto && (
        <div
          role="dialog"
          // Siempre hacia abajo, como el resto de los desplegables.
          className="absolute top-full z-30 mt-1 w-full min-w-[17rem] rounded-lg border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] p-2 shadow-xl"
        >
          <div className="mb-2 grid grid-cols-2 gap-1.5">
            <Desplegable
              id={`${id}-mes`}
              valor={MESES[vista.mes - 1]}
              opciones={MESES}
              // Sólo se mueve con un mes de la lista: con lo tipeado a medias,
              // `indexOf` da -1 y el calendario quedaba en el mes 0.
              onChange={nombre => {
                const indice = MESES.indexOf(nombre as typeof MESES[number]);
                if (indice >= 0) setVista(v => ({ ...v, mes: indice + 1 }));
              }}
            />
            <Desplegable
              id={`${id}-anio`}
              valor={String(vista.anio)}
              opciones={ANIOS}
              // Y sólo con un año de la lista: `Number('1j999')` es NaN, y de
              // ahí salían los "NaN" en la grilla.
              onChange={a => { if (ANIOS.includes(a)) setVista(v => ({ ...v, anio: Number(a) })); }}
            />
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((letra, i) => (
              <span key={i} className="py-1 text-[10px] font-bold uppercase text-[var(--catalogo-etiqueta)]">{letra}</span>
            ))}
            {Array.from({ length: arranque }, (_, i) => <span key={`hueco-${i}`} />)}
            {Array.from({ length: total }, (_, i) => i + 1).map(numero => {
              const elegido = Number(dia) === numero && Number(mes) === vista.mes && Number(anio) === vista.anio;
              return (
                <button
                  key={numero}
                  type="button"
                  onClick={() => elegir(numero)}
                  className={`rounded py-1 text-sm transition-colors ${elegido
                    ? 'bg-[var(--catalogo-acento)] font-bold text-[var(--catalogo-acento-tinta)]'
                    : 'text-white hover:bg-[var(--catalogo-acento)]/20'}`}
                >
                  {numero}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ prefijo, id, valor, onChange, opcional, invalido, error }: {
  /**
   * Distingue los `id` de un formulario de los del otro. La home monta dos
   * —contacto y preinscripción— y sin esto los dos usarían `form-carrera`:
   * el `htmlFor` de la etiqueta engancha con el primero del documento, así que
   * tocar "Carrera" en la preinscripción te llevaba al campo del contacto.
   */
  prefijo: string;
  id: CampoId;
  valor: string | boolean | undefined;
  onChange: (valor: string | boolean) => void;
  /**
   * Marca el campo como "se puede dejar vacío". Va al revés que el asterisco
   * que había antes: ese señalaba los obligatorios y no lo explicaba en ningún
   * lado, así que Piso, Depto y Torre se leían como obligatorios igual. Además
   * son menos los opcionales que los obligatorios, así que ensucia menos.
   */
  opcional: boolean;
  /** Pinta el borde en rojo: es obligatorio y está vacío al intentar enviar. */
  invalido?: boolean;
  error?: string;
}) {
  const campo = CAMPOS[id];
  const htmlId = `${prefijo}-${id}`;
  const marca = opcional
    ? <span className="ml-1 font-normal normal-case tracking-normal text-[var(--catalogo-texto-suave)]/70">(opcional)</span>
    : null;

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
        <Desplegable
          id={htmlId}
          valor={typeof valor === 'string' ? valor : ''}
          onChange={onChange}
          opciones={campo.opciones ?? []}
          invalido={invalido}
        />
      </div>
    );
  }

  if (campo.tipo === 'fecha') {
    return (
      <div>
        <label className={ETIQUETA} htmlFor={htmlId}>{campo.label}{marca}</label>
        <CampoFecha
          id={htmlId}
          valor={typeof valor === 'string' ? valor : ''}
          onChange={onChange}
          invalido={invalido}
        />
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
        className={`${CAMPO} ${error || invalido ? BORDE_MAL : BORDE_OK}`}
      />
      {/* El hueco existe siempre en los campos que reportan error —`error`
          llega definido, aunque sea vacío—, así el mensaje aparece y
          desaparece sin mover el resto del formulario. Por eso los textos van
          cortos: tienen que entrar en una línea. */}
      {error !== undefined && (
        <p className="mt-0.5 min-h-4 text-[11px] leading-4 text-red-400">{error}</p>
      )}
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
  // Se enciende al primer intento de envío. Antes de eso nada se pinta en rojo:
  // un formulario que te reta por lo que todavía no llenaste es hostil.
  const [intentado, setIntentado] = useState(false);
  // Tras un intento fallido el botón queda apagado unos segundos. No es por
  // seguridad —de eso se ocupan el captcha y el rate limit— sino para que el
  // rojo se note: sin la pausa, quien insiste a los golpes ve el formulario
  // parpadear y no llega a leer qué le falta.
  const [enFrio, setEnFrio] = useState(false);
  const frioRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');
  const botonRef = useRef<HTMLButtonElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const tiposRef = useRef<HTMLDivElement>(null);

  const esPreinscripcion = modo === 'preinscripcion';
  const prefijo = modo;

  const carrera = useMemo(
    () => carreras.find(opcion => opcion.nombre === carreraElegida) || null,
    [carreras, carreraElegida],
  );

  // La casa que manda: la fija de la página, o la que trae la carrera elegida.
  const casaActiva = casa ?? casaDeCarrera(carrera);
  // Una preinscripción sin carrera elegida no tiene sentido: no se sabe a qué
  // se preinscribe nadie, ni qué datos hacen falta. Hasta que haya carrera se
  // muestra sólo el buscador. El contacto sí puede empezar en blanco: es una
  // consulta, y bien puede ser sobre nada en particular.
  const esperandoCarrera = esPreinscripcion && !casaActiva;
  const campos = casaActiva
    ? camposDe(casaActiva, modo)
    : esPreinscripcion ? [] : camposComunes(modo);
  const obligatorios = casaActiva ? obligatoriosDe(casaActiva, modo) : [];
  // Si la casa no declara ninguno, no hay distinción que marcar: nada es
  // obligatorio y decírselo campo por campo sería ruido en veinte etiquetas.
  const hayObligatorios = obligatorios.length > 0;

  /**
   * Qué campos llevan el "(opcional)" al lado de la etiqueta.
   *
   * En preinscripción es lo de siempre: los que la casa no exige, y sólo si
   * exige alguno.
   *
   * En contacto la regla es otra y va al revés. Ninguna casa declara
   * obligatorios en este modo —a propósito: una consulta que rebota es un lead
   * perdido—, así que la condición de arriba daba falso en todos y el
   * formulario no decía en ningún lado que se puede mandar con el nombre en
   * blanco. Acá lo único que hace falta es una forma de contestar, así que se
   * marcan todos menos el par mail/teléfono, que ya tiene su propio aviso
   * arriba del bloque.
   *
   * Sale del grupo del campo y no de una lista escrita a mano: si mañana el
   * contacto pide un campo más, entra marcado solo.
   */
  const esOpcional = (id: CampoId) =>
    // Piso, depto y torre lo son siempre: dependen de cómo sea el domicilio, no
    // de lo que pida la casa. Sin esto, en Teclab —que todavía no declaró sus
    // obligatorios— se leían como obligatorios.
    CAMPOS[id].siempreOpcional
    || (esPreinscripcion
      ? hayObligatorios && !obligatorios.includes(id)
      : CAMPOS[id].grupo !== 'contacto');

  // El contacto pinta siempre la unión de las tres casas y oculta lo que la
  // casa elegida no pide, para que elegir una carrera no lo agrande y lo
  // achique. En preinscripción no: la unión son más de treinta campos y
  // reservarles el lugar dejaría media tarjeta en blanco, así que ahí el alto
  // cambia y está bien — el formulario es visiblemente otro.
  // Reservar el lugar de lo que la casa no pide sólo tiene sentido donde la
  // casa puede cambiar: en la home, al elegir carrera. Con la casa fija por
  // props (`/teclab`) el checkbox de equivalencias no va a aparecer nunca, así
  // que guardarle una fila vacía es un hueco que no paga nada.
  const enPantalla = esPreinscripcion || casa ? campos : camposPosibles(modo);
  const pide = (id: CampoId) => campos.includes(id);
  // El mail y el teléfono van juntos en su propia caja, en los dos modos: es
  // por dónde se contesta, y ponerlo aparte lo saca de la lista de datos donde
  // se pierde. Lo que cambia es la exigencia — en el contacto alcanza con uno,
  // en una preinscripción hacen falta los dos— y eso lo dice la caja.
  const columnas = repartirColumnas(
    enPantalla.filter(id => CAMPOS[id].grupo !== 'contacto'),
    esPreinscripcion,
  );

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

  // El timeout no puede quedar vivo si el formulario se desmonta antes.
  useEffect(() => () => { if (frioRef.current) clearTimeout(frioRef.current); }, []);

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

  /**
   * Lo escrito en un campo de lista que no es ninguna de sus opciones —"1j999"
   * en Nacionalidad—. Frena el envío. El rojo lo pone el propio desplegable al
   * dar Enter, o acá al intentar enviar: marcarlo en cada tecla hacía parpadear
   * el campo mientras se escribía.
   *
   * El endpoint además lo descarta por su cuenta (`unaOpcionDe`), así que aunque
   * algo se colara nunca entraría una nacionalidad inventada a la base.
   */
  const malEscritos = campos.filter(id => {
    const opciones = CAMPOS[id].opciones;
    const puesto = valores[id];
    return Boolean(opciones) && typeof puesto === 'string' && puesto.trim() !== ''
      && !opciones!.includes(puesto);
  });

  const hayContacto = Boolean(email || telefono);
  const valido = hayContacto && !errorEmail && !errorTelefono
    && !faltanObligatorios.length && !malEscritos.length && Boolean(token);

  /**
   * Al entrar en un campo, acerca el botón de enviar a la pantalla — pero sólo
   * lo que se pueda sin perder de vista el campo que se acaba de tocar.
   *
   * Todo scroll mueve el campo: es lo que scroll significa. Lo que se puede
   * garantizar es que no se vaya de la pantalla ni quede tapado por la barra,
   * y eso es lo que hace el tope. Si para mostrar el botón habría que empujarlo
   * más allá de eso, no se mueve nada: ver el botón no vale perder de vista lo
   * que se está escribiendo.
   */
  const acercarElBoton = (evento: React.FocusEvent<HTMLFormElement>) => {
    const campo = evento.target;
    const boton = botonRef.current;
    if (!boton || !(campo instanceof HTMLElement)) return;

    // Sólo al escribir, nunca al abrir algo. En un campo de texto acercar el
    // botón ayuda; en un desplegable la página se mueve justo cuando aparece la
    // lista, y eso desorienta más de lo que suma.
    const abreAlgo = campo.getAttribute('role') === 'combobox'
      || campo.getAttribute('aria-haspopup') === 'dialog'
      || campo.id === `${prefijo}-carrera`;
    if (abreAlgo) return;

    const margen = 12;
    const navbar = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--navbar-height'),
      10,
    ) || 60;

    // Cuánto falta para que el botón entre en pantalla.
    const falta = boton.getBoundingClientRect().bottom + margen - window.innerHeight;
    if (falta <= 0) return;

    // Cuánto se puede subir sin meter el campo debajo de la barra.
    const tope = campo.getBoundingClientRect().top - navbar - margen;
    const desplazamiento = Math.min(falta, tope);
    if (desplazamiento <= 0) return;

    window.scrollBy({
      top: desplazamiento,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  const limpiar = () => {
    setListo(false);
    setIntentado(false);
    setEnFrio(false);
    if (frioRef.current) clearTimeout(frioRef.current);
    setValores({});
    setCarreraElegida(''); setBusqueda(''); setTipoElegido('');
    setVerLista(false); setVerTipos(false);
    setToken(''); setCaptchaKey(key => key + 1); setCaptchaVencido(false);
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (enviando) return;

    // El botón no se apaga: apagado no explica nada. Se deja pulsar, y el
    // primer intento enciende los bordes rojos y lleva el foco a lo que falta.
    if (!valido) {
      setIntentado(true);
      setEnFrio(true);
      if (frioRef.current) clearTimeout(frioRef.current);
      frioRef.current = setTimeout(() => setEnFrio(false), 5000);
      const primero = malEscritos[0] ?? faltanObligatorios[0] ?? (!hayContacto ? 'email' : null);
      if (primero) document.getElementById(`${prefijo}-${primero}`)?.focus();
      return;
    }
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

  const titulo = esPreinscripcion ? 'PREINSCRIPCIÓN' : 'CONTACTO';
  const bajada = esPreinscripcion
    ? 'Completá tus datos y adelantamos tu preinscripción.'
    : 'Dejanos tus datos y te contactamos para orientarte.';

  return (
    <section
      id={esPreinscripcion ? 'preinscripcion' : 'formulario'}
      className="relative"
      style={{ borderTop: '2px solid var(--catalogo-acento)', background: 'var(--catalogo-form-fondo)', scrollMarginTop: 'var(--navbar-height, 60px)' }}
    >
      <div className={`${esPreinscripcion ? '' : 'contact-form-layout'} mx-auto w-full max-w-[2400px] px-4 py-4 sm:px-8 sm:py-6 xl:px-20`}>
        <div className="form-content-col">
        <div
          // Sin `overflow-hidden`: recortaba la lista del buscador de carrera
          // cuando la tarjeta es más baja que el desplegable. El overlay de
          // éxito, que era lo que lo justificaba, se monta sólo cuando hay que
          // mostrarlo, así que no necesita que lo tapen.
          className="form-card relative"
          style={{ background: 'var(--catalogo-form-tarjeta)', border: '1px solid rgba(var(--catalogo-acento-rgb), 0.3)', borderRadius: '1rem' }}
        >
          {listo && (
            <div className="form-success-overlay active">
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--catalogo-acento)]"
                  style={{ animation: 'formSuccessPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}
                >
                  <svg
                    className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}
                    style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'formSuccessCheck 0.4s ease 0.6s forwards' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p
                  className="text-xl font-black uppercase tracking-tight text-white"
                  style={{ opacity: 0, animation: 'formSuccessFade 0.3s ease 0.7s forwards' }}
                >
                  {esPreinscripcion ? 'Preinscripción enviada' : 'Consulta enviada'}
                </p>
                <p className="text-sm text-[var(--catalogo-texto-suave)]" style={{ opacity: 0, animation: 'formSuccessFade 0.3s ease 0.85s forwards' }}>
                  Nos comunicamos a la brevedad
                </p>
                <button
                  type="button" onClick={limpiar}
                  className="mt-2 cursor-pointer text-sm font-bold text-[var(--catalogo-acento)] underline underline-offset-2 transition-colors hover:text-white"
                  style={{ opacity: 0, animation: 'formSuccessFade 0.3s ease 1s forwards' }}
                >
                  Enviar otra
                </button>
              </div>
            </div>
          )}

          <form onSubmit={enviar} onFocusCapture={acercarElBoton} noValidate className={listo ? 'invisible' : undefined} aria-hidden={listo}>
            <div className="form-card-header px-3 pb-3 pt-4 sm:px-4" style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
              <h2 className="text-center text-xl font-black uppercase leading-none tracking-tighter sm:text-2xl">
                <span className="text-white">FORMULARIO DE </span>
                <span className="text-[var(--catalogo-acento)]">{titulo}</span>
              </h2>
              <p className="mt-1 text-center text-xs text-[var(--catalogo-texto-suave)]">{bajada}</p>
            </div>


            {/* Los bloques salen de la declaración de la casa: si no pide
                nada de un grupo, ese bloque no se pinta. La maqueta es la de
                siempre — dos columnas y la línea divisoria en el medio.
                
                Sin rótulos: las dos columnas arrancan con una etiqueta y su
                campo, así que alinean solas. Los que había existían sólo para
                emparejarlas cuando la derecha encabezaba con un nombre de grupo
                y la izquierda no. */}
            <div
              className={`grid grid-cols-1 ${esperandoCarrera ? '' : 'md:grid-cols-2'}`}
              style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}
            >
              {([1, 2] as const).map(columna => {
                const suyos = columnas[columna - 1];
                // La columna 1 se pinta siempre: aunque no le tocara ningún
                // campo, ahí vive el buscador de carrera.
                if (!suyos.length && columna !== 1) return null;

                return (
                  <div
                    key={columna}
                    className="space-y-2 px-3 pb-3 pt-3 sm:px-4"
                    style={columna === 2 ? { borderLeft: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' } : undefined}
                  >
                    {columna === 1 && (<>
                    {/* El buscador vive dentro de la primera columna, como
                        siempre: es lo que define la casa y por eso encabeza. */}
                {/* Uno arriba del otro: el buscador es lo primero que se toca
                    y el filtro sólo acota su lista. */}
                <div className="space-y-2">
                  <div ref={listaRef} className="relative">
                    <label className={ETIQUETA} htmlFor={`${prefijo}-carrera`}>Carrera</label>
                    <div className="relative">
                      <input
                        id={`${prefijo}-carrera`}
                        type="text"
                        value={busqueda}
                        onChange={event => { setBusqueda(event.target.value); setCarreraElegida(''); setVerLista(true); }}
                        onFocus={() => setVerLista(true)}
                        onKeyDown={evento => {
                          if (evento.key !== 'Enter') return;
                          // Enter en un buscador no puede mandar el formulario:
                          // acá elige la carrera, que es lo que uno espera.
                          evento.preventDefault();
                          const primera = filtradas[0];
                          if (primera) { setCarreraElegida(primera.nombre); setBusqueda(primera.nombre); setVerLista(false); }
                        }}
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

                  <div ref={tiposRef} className="relative">
                    <label className={ETIQUETA}>Tipo</label>
                    <button
                      type="button"
                      onClick={() => setVerTipos(!verTipos)}
                      className={`relative w-full cursor-pointer rounded-lg border bg-[var(--catalogo-form-campo)] py-1.5 pl-3 pr-7 text-left text-sm font-bold transition-colors focus:outline-none ${filtro ? 'border-[var(--catalogo-acento)]/50 text-[var(--catalogo-acento)]' : 'border-[var(--catalogo-acento)]/25 text-[var(--catalogo-texto-suave)]'}`}
                    >
                      {filtro ? (categorias.find(categoria => categoria.id === filtro)?.label || 'Todos') : 'Todos'}
                      <svg className={`pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--catalogo-acento)]/60 transition-transform ${verTipos ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {verTipos && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] shadow-xl">
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

                    </>)}
                    <div className="grid grid-cols-6 gap-1.5">
                      {suyos.map((id, indice, todos) => (
                        <div
                          key={id}
                          // Reservar el lugar es de desktop, donde la tarjeta es
                          // un bloque fijo y verla crecer y encogerse molesta.
                          // En mobile las columnas se apilan y el hueco quedaría
                          // a la vista, peor que el salto: ahí no está.
                          className={`${SPAN[CAMPOS[id].ancho ?? 'medio']} ${pide(id) ? '' : 'hidden sm:block'} celda-ancho`}
                          style={{
                            ...(pide(id) ? null : { visibility: 'hidden' as const }),
                            ['--ancho' as string]: anchosDeColumna(todos)[indice],
                          }}
                          aria-hidden={!pide(id)}
                        >
                          <Campo
                            prefijo={prefijo}
                            id={id}
                            valor={valores[id]}
                            onChange={valor => poner(id, valor)}
                            opcional={esOpcional(id)}
                            invalido={intentado && (faltanObligatorios.includes(id) || malEscritos.includes(id))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {!esperandoCarrera && (<>
            {/* Por dónde te contestamos. Va último para que el que abandona a
                mitad ya lo haya dado. */}
            <div className="px-3 pb-1 pt-3 sm:px-4" style={{ borderBottom: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}>
              <div className="space-y-1.5 rounded-lg p-2" style={{ border: '1.5px solid var(--catalogo-acento)' }}>
                <p className="flex items-center gap-2 text-[12px] leading-snug text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--catalogo-acento)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                  </svg>
                  {/* En la preinscripción es un bloque más del legajo y se
                      rotula como tal; los dos son obligatorios como todo lo
                      demás y no hace falta aclararlo. En el contacto sí, porque
                      ahí la regla es otra: con uno de los dos alcanza. */}
                  <span>
                    {esPreinscripcion ? (
                      <strong className="text-[var(--catalogo-acento)]">Datos de contacto</strong>
                    ) : (
                      <>
                        <strong className="text-[var(--catalogo-acento)]">Cómo te contestamos:</strong>{' '}
                        con el mail o el teléfono alcanza
                      </>
                    )}
                  </span>
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {enPantalla.filter(id => CAMPOS[id].grupo === 'contacto').map(id => (
                    <Campo
                      key={id}
                      prefijo={prefijo}
                      id={id}
                      valor={valores[id]}
                      onChange={valor => poner(id, valor)}
                      opcional={esOpcional(id)}
                      invalido={intentado && (faltanObligatorios.includes(id) || malEscritos.includes(id) || !hayContacto)}
                      error={id === 'email' ? errorEmail : id === 'telefono' ? errorTelefono : ''}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* El widget va antes del botón y no después: el botón está
                apagado hasta que el captcha se resuelve, así que el control que
                lo enciende no puede quedar debajo. Mientras carga, su lugar lo
                ocupa el marcador de `turnstile-widget.tsx` — si no, ese hueco
                se lee como un vacío y aleja al botón de los datos. */}
            <div className="space-y-1.5 px-3 pb-2 pt-2.5 sm:px-4 sm:pt-3">
              <TurnstileWidget
                key={captchaKey}
                marca={casaActiva ?? 'siglo21'}
                onVerify={nuevo => { setToken(nuevo); setCaptchaVencido(false); }}
                onExpire={() => { setToken(''); setCaptchaVencido(true); }}
              />
              <button
                ref={botonRef}
                type="submit"
                disabled={enviando || enFrio}
                className="w-full rounded-lg py-2 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg, var(--catalogo-acento), var(--catalogo-acento-oscuro))', color: 'var(--catalogo-acento-tinta)', letterSpacing: '0.12em' }}
              >
                {enviando ? 'Enviando...' : esPreinscripcion ? 'Enviar preinscripción' : 'Enviar consulta'}
              </button>

            </div>

            {/* El pie cierra la tarjeta como el encabezado la abre: misma tinta
                y su propia línea. Ahí viven los tres avisos —error del envío,
                captcha vencido, captcha sin tildar— en un renglón de alto fijo,
                así aparecer no mueve nada. */}
            <div
              className="form-card-footer px-3 py-2 sm:px-4"
              style={{ background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}
            >
              <p className="min-h-4 text-center text-[11px] leading-4">
                {error
                  ? <span className="text-red-400">{error}</span>
                  : captchaVencido
                    ? <span className="text-amber-300">El captcha venció. Volvé a tildarlo.</span>
                    : intentado && !token
                      ? <span className="text-amber-300">Falta tildar la verificación de seguridad.</span>
                      : null}
              </p>
            </div>
            </>)}
          </form>
        </div>
        </div>
        {!esPreinscripcion && (
          <div className="contact-form-side-image relative" data-casa={casaActiva ?? 'siglo21'} aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
