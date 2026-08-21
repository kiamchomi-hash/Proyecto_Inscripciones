# Biblioteca de piezas de UI

Piezas visuales sueltas y reutilizables: botones, tarjetas, interruptores, cargadores.
Lo que entra acá ya está probado y adaptado al sitio.

- **Verlas**: `npm run dev` y abrir `/laboratorio`. Esa página no existe en producción.
- **Usar una**: `import { Pieza } from '@/components/ui/pieza'`. El CSS viaja con el
  componente, no hay que importar nada más.

Cada pieza son dos archivos, `<nombre>.tsx` y `<nombre>.css`, y el `.tsx` importa su
propio `.css`. Es el patrón de `components/index/beneficios-strip.tsx`: mientras nadie
importe el componente, su CSS tampoco entra a ninguna página.

## Qué hay que arreglarle a una pieza traída de afuera

No es burocracia: son las cosas del sitio que rompen el copiar y pegar.

1. **Prefijar todas las clases** con `ui-<pieza>-`, y las variantes con `--variante`
   (como `.career-badge--nueva`). Acá no hay CSS Modules: todas las hojas son globales,
   así que un `.button` o un `.card` sueltos pisan el CSS de las páginas o son pisados.
2. **Colores desde las variables** de `app/globals.css` — `--color-highlight`,
   `--color-card-bg`, `--color-accent`, `--color-gold`, y las de marca de Teclab e
   Identidad. Las variantes se hacen reasignando variables declaradas en el selector
   raíz de la pieza, como hace `.career-card` con `--card-bg`.
3. **Revisar cada `rem`.** `app/globals.css` fija `html { font-size: clamp(13px, 10px +
   0.234vw, 16px) }`: una pieza pensada con `1rem = 16px` se ve casi 20% más chica en
   una pantalla de 1080p. Si una medida tiene que ser exacta, va en `px` o en `em`.
4. **Nada externo.** La CSP del sitio tiene `font-src 'self'`, así que un
   `@import url('https://fonts.googleapis.com/...')` queda bloqueado por el navegador;
   las fuentes disponibles son Inter y Unbounded, cargadas en `app/layout.tsx`. Lo mismo
   con imágenes: `img-src` sólo admite el propio dominio, `data:`, `blob:`, Supabase y
   Unsplash.
5. **Accesibilidad.** Un `<button>` de verdad y no un `<div>` con `onClick`;
   `:focus-visible` que se vea; `aria-label` cuando el texto no alcanza. Los trucos de
   checkbox oculto se reemplazan por estado de React.
6. **Movimiento.** Nada de `!important` en animaciones: `app/globals.css` tiene un
   bloque global de `prefers-reduced-motion` que las corta, y romperlo deja sin salida a
   quien configuró su sistema para no ver movimiento.
7. **Peso.** El CSS se inyecta en el HTML de la página que usa la pieza. Si la hoja pasa
   las ~100 líneas, hay que poder decir por qué vale.
8. **Probada en las dos anchos** antes de entrar: escritorio y móvil.

Si la pieza vino de algún lado, arriba del CSS va de dónde salió y qué se le cambió:

```css
/* Boton de contorno animado. Origen: <de donde salio> (licencia).
   Adaptado: clases prefijadas ui-boton-contorno-, colores a las variables de
   globals.css, tamanos en px porque el rem del sitio no es 16px. */
```

No es por la licencia: es lo que permite volver al original cuando una pieza se comporta
raro.

## Cuándo NO agregar una pieza

Si no se va a usar en ninguna página todavía. Una biblioteca llena de cosas que nadie
puso en ningún lado es una carpeta de recortes, y hace más lento encontrar lo que sirve.

## Las piezas

- `tarjeta-sede`: perfil institucional con imagen, accesos a servicios y CTA de WhatsApp. En uso en `/sobre-nosotros`.
