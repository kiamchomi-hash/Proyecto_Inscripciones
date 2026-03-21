import '../novedades.css';

export default function NovedadesLoading() {
  return (
    <section className="w-full min-h-screen" style={{ background: 'var(--color-deep-dark-bg)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Header skeleton */}
        <div className="mb-10">
          <div className="h-8 w-48 bg-[#1c2f31] rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-[#1c2f31] rounded mt-3 animate-pulse" />
        </div>

        {/* Pinned skeleton */}
        <div className="mb-10 rounded-2xl overflow-hidden bg-[#1c2f31] animate-pulse" style={{ height: 280 }} />

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl overflow-hidden bg-[#1c2f31] animate-pulse" style={{ height: 320 }}>
              <div className="h-44 bg-[#243a3d]" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-[#243a3d] rounded" />
                <div className="h-3 w-full bg-[#243a3d] rounded" />
                <div className="h-3 w-2/3 bg-[#243a3d] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
