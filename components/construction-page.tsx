export default function ConstructionPage({ title }: { title: string }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-6" style={{ color: 'var(--color-highlight)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">{title}</h1>
        <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-highlight)' }}>En construccion</p>
        <p className="text-[#7ca19b] max-w-md">Estamos trabajando en esta seccion. Pronto estara disponible.</p>
      </div>
    </div>
  );
}
