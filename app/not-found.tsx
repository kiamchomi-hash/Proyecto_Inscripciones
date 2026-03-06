import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center" style={{ padding: '3rem 1.5rem', minHeight: 'calc(100vh - 64px)' }}>
      <div className="text-center">
        <p className="font-black select-none" style={{ fontSize: 'clamp(7rem, 22vw, 16rem)', lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--color-highlight)' }} aria-hidden="true">
          404
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-2 mb-3">
          Pagina no encontrada
        </h1>
        <p className="text-base sm:text-lg mb-2" style={{ color: 'var(--color-text-light)' }}>
          No encontramos lo que buscabas.
        </p>
        <p className="text-sm mb-10" style={{ color: 'var(--color-text-light)' }}>
          La direccion puede haber cambiado o la pagina ya no existe.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-extrabold text-base uppercase tracking-wide rounded-lg transition-all"
          style={{
            backgroundColor: 'var(--color-highlight)',
            color: '#013729',
            padding: '0.875rem 2rem',
            boxShadow: '0 4px 20px rgba(0, 199, 177, 0.3)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V20.25a.75.75 0 01-.75.75H15v-6H9v6H3.75a.75.75 0 01-.75-.75V9.75z" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
