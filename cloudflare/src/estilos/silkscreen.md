# Silkscreen local para la paridad de Computación

No se descargó ninguna fuente. Se copiaron los dos subconjuntos latin que ya
servía el Next local desde su caché de assets; no se incorpora esa caché al paquete.
Los binarios quedan en `src/assets/` para que Vite los entregue con nombre con hash.
No dependen de `.next` al compilar ni ejecutar el paquete.
Vite se configura con `assetsInlineLimit: 0`: si los incrusta como `data:`, la
CSP los bloquea y la ficha cae a monospace. No se agrega `data:` a `font-src`.

El CSS vigente de Next declaró familia Silkscreen, pesos 400/700, `display: swap`,
unicode-range latin y fallback Arial con las métricas reproducidas en
`silkscreen.css`. Son los mismos archivos, no una fuente visualmente parecida:

- `silkscreen-latin-400.woff2`: SHA-256
  `17bb6d80eeea10c69887aa64a1b48e70a3f540de50480da9ec933fac1996bf97`.
- `silkscreen-latin-700.woff2`: SHA-256
  `30ad65d8dff39d9154b3e43fedfaeaea9767468238ea633272304b6fc82bdca7`.

Fuente del contrato: `components/clases-apoyo/computacion/fuente.ts`.
El 25/10/2026 se recuperó el aviso original desde el repositorio oficial de Google
Fonts: <https://raw.githubusercontent.com/google/fonts/main/ofl/silkscreen/OFL.txt>.
Se conserva completo, con copyright de Silkscreen, en `src/assets/OFL-Silkscreen.txt`.
Sólo se normalizó espacio al final de una línea; no se sustituyó el titular por
el de otra fuente. Los binarios no se modificaron. Esta entrega no publica assets.
