import '../novedades.css';

export default function NovedadesLoading() {
  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-28 sm:pb-0">
      {/* Paginación skeleton */}
      <div className="flex items-center justify-center gap-1 -mt-2 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-9 h-9 rounded-md animate-pulse" style={{ background: '#07241f', border: '1px solid rgba(0,199,177,0.15)' }} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pinned card skeleton (izquierda) */}
        <div
          className="rounded-xl overflow-hidden flex flex-col md:h-[580px] animate-pulse"
          style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.06)' }}
        >
          <div className="h-[260px] flex-shrink-0" style={{ background: '#0c2b24' }} />
          <div className="flex-1 p-6 pb-7 flex flex-col">
            <div className="h-3 w-28 rounded bg-[#243a3d] mb-3" />
            <div className="h-6 w-4/5 rounded bg-[#243a3d] mb-2" />
            <div className="h-6 w-3/5 rounded bg-[#243a3d] mb-3" />
            <div className="h-3.5 w-full rounded bg-[#243a3d] mb-1.5" />
            <div className="h-3.5 w-2/3 rounded bg-[#243a3d]" />
            <div className="mt-auto pt-3.5">
              <div className="h-5 w-20 rounded-full bg-[#243a3d]" />
            </div>
          </div>
        </div>

        {/* Sub cards skeleton (derecha) */}
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-xl overflow-hidden flex-1 min-h-0 animate-pulse"
              style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.06)' }}
            >
              <div className="flex flex-col sm:flex-row h-full">
                <div className="w-full sm:w-[40%] sm:max-w-[240px] flex-shrink-0 h-[160px] sm:h-auto" style={{ background: '#0c2b24' }} />
                <div className="flex-1 p-5 px-6 flex flex-col justify-center">
                  <div className="h-3 w-24 rounded bg-[#243a3d] mb-3" />
                  <div className="h-4 w-4/5 rounded bg-[#243a3d] mb-1.5" />
                  <div className="h-4 w-3/5 rounded bg-[#243a3d] mb-3.5" />
                  <div className="h-5 w-16 rounded-full bg-[#243a3d]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paginación inferior skeleton */}
      <div className="flex items-center justify-center gap-1 mt-4 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-9 h-9 rounded-md animate-pulse" style={{ background: '#07241f', border: '1px solid rgba(0,199,177,0.15)' }} />
        ))}
      </div>
    </main>
  );
}
