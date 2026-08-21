import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATALOGO } from '@/components/ui/catalogo';
import './laboratorio.css';

// Herramienta interna: la galería de `components/ui`, para elegir una pieza
// mirándola en vez de leyendo CSS. Es el equivalente de /imagenes, pero para
// componentes.
//
// Sólo existe en desarrollo. No es por vergüenza: cada pieza del catálogo
// arrastra su CSS al HTML de esta página, y publicar una página que nadie
// visita para pagar ese peso en cada build no tiene sentido. En producción
// devuelve 404 — por eso tampoco hace falta tocar el sitemap ni la lista de
// rutas de `lib/vigilancia-esperado.ts`.
export const metadata: Metadata = {
  title: 'Laboratorio de piezas',
  robots: { index: false, follow: false },
};

export default function LaboratorioPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="lab-main">
      <header className="lab-encabezado">
        <h1 className="lab-titulo">Laboratorio de piezas</h1>
        <p className="lab-bajada">
          Lo que hay en <code>components/ui</code>, renderizado. Cada pieza ya está adaptada a la marca y a
          las restricciones del sitio; las reglas están en <code>components/ui/LEER.md</code>.
        </p>
        <p className="lab-bajada lab-bajada--tenue">Esta página no existe en producción.</p>
      </header>

      {CATALOGO.length === 0 ? (
        <p className="lab-vacio">
          Todavía no hay piezas. Se agregan con una entrada en <code>components/ui/catalogo.tsx</code>.
        </p>
      ) : (
        <ul className="lab-grilla">
          {CATALOGO.map(pieza => (
            <li key={pieza.id} className="lab-ficha">
              <div className="lab-escenario">{pieza.muestra}</div>

              <div className="lab-datos">
                <h2 className="lab-nombre">{pieza.titulo}</h2>
                <p className="lab-descripcion">{pieza.descripcion}</p>

                <code className="lab-import">{`import { } from '@/components/ui/${pieza.id}'`}</code>

                <dl className="lab-meta">
                  <div>
                    <dt>En uso</dt>
                    <dd>{pieza.usadaEn.length > 0 ? pieza.usadaEn.join(', ') : 'todavía en ningún lado'}</dd>
                  </div>
                  {pieza.origen && (
                    <div>
                      <dt>Origen</dt>
                      <dd>{pieza.origen}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
