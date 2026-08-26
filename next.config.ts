import type { NextConfig } from 'next';

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost').host;

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['jspdf', 'jspdf-autotable', '@supabase/supabase-js'],
    // El CSS viajaba en dos <link> que bloqueaban el render (~450 ms segun PSI en
    // mobile). Inlineado en el HTML desaparece esa ida y vuelta de la ruta critica:
    // el navegador pinta con lo que ya recibio. Requiere style-src 'unsafe-inline',
    // que la CSP de abajo ya permite.
    inlineCss: true,
  },
  images: {
    // 90 para las fotos grandes (hero de carrera y modales de Teclab): con el
    // 75 por defecto las caras quedaban con artefactos visibles.
    qualities: [75, 90],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: supabaseHost },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: https://${supabaseHost} https://images.unsplash.com`,
              "font-src 'self'",
              // Los videos institucionales se sirven desde el bucket publico de
              // Supabase Storage; sin esta directiva caen en default-src y el
              // navegador los bloquea.
              `media-src 'self' https://${supabaseHost}`,
              `connect-src 'self' https://${supabaseHost} https://*.google-analytics.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://challenges.cloudflare.com`,
              "frame-src https://challenges.cloudflare.com https://www.google.com https://www.youtube-nocookie.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        // Biblioteca de imagenes: herramienta interna, sin enlaces desde el
        // sitio y fuera del sitemap. A proposito NO va al disallow de
        // robots.ts: si se bloquea el rastreo, Google no llega a leer el
        // noindex y la URL puede listarse igual, sin descripcion.
        source: '/imagenes',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/contactos',
        destination: '/contacto',
        permanent: true,
      },
      {
        source: '/novedades',
        destination: '/novedades/1',
        permanent: true,
      },
      // Ruta vieja en singular (marzo 2026), puede seguir indexada
      {
        source: '/carrera/:slug',
        destination: '/carreras/:slug',
        permanent: true,
      },
      // /carreras sin slug no existe como página; el catálogo está en la home
      {
        source: '/carreras',
        destination: '/',
        permanent: true,
      },
      // El curso de Teclab estuvo dos días con el slug que salía de "Curso en"
      // (30/07 al 01/08/2026). Se corrigió a "Curso de", que es como se dice y
      // como viene el prefijo en la base; el slug viejo pudo entrar al sitemap.
      {
        source: '/carreras/curso-en-actualizacion-profesional-en-inteligencia-artificial',
        destination: '/carreras/curso-de-actualizacion-profesional-en-inteligencia-artificial',
        permanent: true,
      },
      // La materia dejo de ser "Fisico-Quimica" y paso a ser solo "Fisica"
      // (11/08/2026): el profesor no dicta quimica. La URL vieja estaba
      // indexada desde el 09/08, asi que va con 301 a la nueva — es la misma
      // pagina con otro nombre.
      {
        source: '/clases-apoyo/fisico-quimica',
        destination: '/clases-apoyo/fisica',
        statusCode: 301,
      },
      // La novedad del inicio de clases dejo de tener la fecha en el slug
      // (08/08/2026): era `segundo-semestre-2026-inicio-3-de-agosto` y pasa a
      // `inicio-de-clases`, que no vence. La URL vieja estaba indexada, asi que
      // va con 301 al articulo nuevo — es el mismo tema, no hay que mandarla a
      // la home como las carreras de baja.
      {
        source: '/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto',
        destination: '/novedades/articulo/inicio-de-clases',
        statusCode: 301,
      },
      // El articulo de Teclab (15/07/2026) y la landing /teclab cubrian el mismo
      // tema y competian por las mismas consultas de marca: teclab, teclab
      // carreras, teclab tecnicaturas. Se unifico en la landing, que se actualiza
      // sola desde la base y enlaza todas las fichas; el articulo quedo con
      // publicada = false en Supabase y su URL va con 301 aca. Toda su huella en
      // buscadores eran 4 impresiones y 0 clics en 90 dias, asi que no se pierde
      // nada al unificar.
      {
        source: '/novedades/articulo/teclab-tecnicaturas-online',
        destination: '/teclab',
        statusCode: 301,
      },
      // La diplomatura de convenio se llama "Prevención de Fraude Financiero y
      // Digital" — así la nombran la landing y el material de la academia; la
      // API todavía devuelve el título corto. Se corrigió el nombre en la base
      // (21/08/2026) y con él cambió el slug. La URL vieja estaba indexada
      // desde el 04/08, asi que va con 301 a la nueva: es la misma ficha.
      {
        source: '/carreras/diplomatura-en-fraude-financiero-y-digital',
        destination: '/carreras/diplomatura-en-prevencion-de-fraude-financiero-y-digital',
        statusCode: 301,
      },
      // ── Carreras dadas de baja ──
      // Estas van con `statusCode: 301` y no con `permanent: true`, que emite
      // 308. Para Google los dos son equivalentes, pero el 301 es el que espera
      // el resto de las herramientas de SEO y el que figura en el seguimiento de
      // docs/indexacion.md; que la medición diga lo mismo que el config evita tener
      // que explicar la diferencia cada vez.
      //
      // Agroinformática se sacó de la oferta el 03/08/2026 (`activa = false` en
      // Supabase): el CAU no la dicta. La ficha estaba indexada y traía ~10
      // clics cada 90 días, todos de búsquedas navegacionales por el nombre de
      // la carrera, así que no se manda a otra ficha —sería otra cosa de la que
      // buscaron— sino al catálogo de la home.
      {
        source: '/carreras/licenciatura-en-agroinformatica',
        destination: '/',
        statusCode: 301,
      },
      // Mismo caso que Agroinformática: salieron del catálogo teniendo la ficha
      // indexada, y quedaron devolviendo 404 —que tira a la basura la autoridad
      // de una URL que Google ya tenía—. Administración Hotelera venía con
      // tráfico (32 impresiones, 2 clics, posición 14,2). Van a la home por lo
      // mismo: quien buscó la carrera por su nombre no quiere otra ficha.
      {
        source: '/carreras/licenciatura-en-administracion-hotelera',
        destination: '/',
        statusCode: 301,
      },
      {
        source: '/carreras/licenciatura-en-nutricion',
        destination: '/',
        statusCode: 301,
      },
      {
        source: '/carreras/licenciatura-en-sociologia',
        destination: '/',
        statusCode: 301,
      },
      {
        source: '/carreras/tecnicatura-en-responsabilidad-y-gestion-social',
        destination: '/',
        statusCode: 301,
      },
      // Teclab dejo de ofrecer Venta Directa (07/08/2026), asi que el CAU no la
      // puede vender: `activa = false` en Supabase. La ficha ya estaba indexada
      // (31/07), asi que la URL va a la home como las demas bajas — quien buscó
      // esta carrera por su nombre no quiere que le abran otra.
      {
        source: '/carreras/tecnicatura-superior-en-venta-directa',
        destination: '/',
        statusCode: 301,
      },
      // Estas cuatro diplomaturas de Identidad Argentina salieron del catálogo
      // de la academia el 10/08/2026: su API pública (`/dev/cursos`, la que
      // alimenta la lista de escuelas del sitio) dejó de listarlas y consultarlas
      // por id ya no devuelve ni título ni precio. Se apagaron con
      // `activa = false` en Supabase.
      //
      // Van con 302 y no con 301 como las bajas de arriba: éstas pueden volver
      // —es la academia la que rota su oferta, no una carrera que el CAU dejó de
      // dictar—. Las fichas estaban indexadas, así que tampoco pueden quedar en
      // 404: con 302 Google mantiene la URL, y reponerlas es sacar la entrada y
      // volver `activa` a true.
      {
        source: '/carreras/diplomatura-en-bienestar-integral-herramientas-para-transformar-te',
        destination: '/',
        statusCode: 302,
      },
      {
        source: '/carreras/diplomatura-en-inteligencia-artificial',
        destination: '/',
        statusCode: 302,
      },
      {
        source: '/carreras/diplomatura-en-marketing-para-emprendedores-y-duenos-de-negocios',
        destination: '/',
        statusCode: 302,
      },
      {
        source: '/carreras/diplomatura-en-management-hotelero',
        destination: '/',
        statusCode: 302,
      },
      // Identidad Argentina renombró Mindfulness el 10/08/2026 —y además es
      // Diplomatura, no Curso—, así que cambió el slug. Acá sí va 301: es la
      // misma ficha con otro nombre, no una baja, y la URL vieja estaba indexada
      // (rastreada el 05/08).
      {
        source: '/carreras/curso-de-mindfulness-y-tecnicas-de-gestion-del-estres',
        destination: '/carreras/diplomatura-en-mindfulness-liderazgo-personal-y-gestion-de-vinculos',
        statusCode: 301,
      },
      // Apex a www. **Ojo: en produccion esta regla no se ejecuta.** Vercel tiene
      // su propio redirect a nivel de dominio (Project → Domains), corre en el
      // borde antes que la app y gana siempre. Se nota en la respuesta: no trae
      // ninguna cabecera de Next.
      //
      // Hasta el 25/08/2026 ese redirect del dominio venia con
      // `redirectStatusCode: 307`, el valor de fabrica, mientras este bloque
      // decia `permanent: true`. O sea que el codigo declaraba 308 y produccion
      // servia 307 desde marzo, sin que ningun diff lo mostrara. Un 307 dice
      // "mudanza temporal", asi que Google nunca consolidaba el apex en www:
      // seguia entrando por ahi y gastando un pedido en cada URL sin www que
      // tenia anotada, con dos fichas esperando turno de rastreo. Se corrigio
      // en el dominio (a 308), que es donde se decide.
      //
      // La regla se deja igual: es la red de abajo si alguien saca el redirect
      // del panel, y en ese caso el que vale es este. **Tocarla aca no cambia
      // nada mientras el del dominio exista.** El codigo esperado esta fijado en
      // `lib/vigilancia-esperado.ts` y los dos vigilantes avisan si se mueve.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'siglo21sur.com' }],
        destination: 'https://www.siglo21sur.com/:path*',
        permanent: true,
      },
      // El alias .vercel.app de produccion servia el sitio entero con 200 y sin
      // noindex: contenido duplicado compitiendo con el dominio propio. Los otros
      // aliases (los de deployment y el de rama) ya estan detras del SSO de Vercel
      // y con X-Robots-Tag: noindex, asi que este era el unico abierto. El canonical
      // apunta bien, pero es una sugerencia; el 308 no. Matchea ese host exacto:
      // ni localhost ni los previews entran.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'proyecto-inscripciones.vercel.app' }],
        destination: 'https://www.siglo21sur.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
