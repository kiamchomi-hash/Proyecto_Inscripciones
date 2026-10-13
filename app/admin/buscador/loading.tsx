export default function BuscadorLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" style={{ background: 'var(--admin-bg)' }}>
      <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-white">
        <div aria-hidden="true" className="w-5 h-5 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
        <span>Cargando carreras y precios...</span>
      </div>
    </div>
  );
}
