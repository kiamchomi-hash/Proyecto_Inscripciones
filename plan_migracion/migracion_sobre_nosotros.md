# Migración — sobre-nosotros.html → app/sobre-nosotros/page.tsx

Estado: MIGRADO

Archivos: app/sobre-nosotros/page.tsx, app/sobre-nosotros/sobre-nosotros.css
HTML original: Eliminado

---

## Tecnologías por fase

### Fase 1 — Base
Tailwind CSS                       ✅  Utilities en todo el componente + CSS custom para animaciones hover

### Fase 2 — Lenguaje
TypeScript                         ✅  Archivo .tsx con interfaces tipadas
Axios                              ❌  No se usa — página estática
Zod                                ❌  No se usa — página estática

### Fase 3 — Framework
React + Next.js                    ✅  Server component, App Router, next/image
Zustand                            ❌  No se usa — página estática sin estado

### Fase 4 — UI
daisyUI                            ❌  No se usa
shadcn/ui                          ❌  No se usa

### Fase 5 — Backend
Supabase (PostgreSQL)              ❌  No conectado (contenido estático por ahora)

### Fase 6 — Extras
Stagehand                          ❌  No se usa
Tauri                              ❌  No aplica

---

## Auditoría general

Estructura HTML → JSX              ✅  Hero, stats, sede propia, sede central Siglo 21, feature cards, checklist servicios, CTA WhatsApp, mapa
Estilos → Tailwind                 ✅  Tailwind utilities + CSS custom (shimmer badge, feature card hover, glow dividers, stat accent, map card, whatsapp glow)
JavaScript → React state           ✅  No requiere estado (página estática)
Datos                              ✅  Contenido institucional, stats, servicios, enlaces a clases de apoyo
Interactividad                     ✅  Hover en feature cards, enlaces a WhatsApp, clases de apoyo, FAQ, sede central Siglo 21
Responsive                         ✅  Flex col/row, imagen float en mobile, grid responsive, md: breakpoints
Accesibilidad                      ✅  aria-hidden en iconos decorativos, alt en imágenes, title en iframe
SEO                                ✅  Metadata con title y description descriptivos
Rendimiento                        ✅  next/image para fotos (sede, campus, logo), iframe con lazy loading, server component
Fidelidad visual                   ✅  Tema oscuro, gradientes sutiles, glow dividers, logo CAU en blanco

---

## Completado en esta sesión

- Hero con badge shimmer, gradiente en titulo, botones WhatsApp y FAQ
- Imagen sede propia (Foto-entrada.webp) recortada y optimizada: desktop lado izquierdo, mobile flotante al lado del texto
- Tarjeta info sede con logo CAU blanco, textos con negritas, lineas separadoras, botones Consultanos + horario
- Stats: +1000 egresados en nuestra sede, +88 carreras, 100% distancia, 30 años en el barrio
- Sede central Siglo 21 en contenedor propio con 3 imágenes campus Córdoba + botón a 21.edu.ar
- Feature cards (3 pilares) con icono y titulo en fila
- Sección servicios "Todo en un solo lugar" con checklist, logo blanco, tarjeta CTA con enlaces a clases de apoyo
- Mapa con dirección Guaminí 4876 en contenedor destacado, pills de zonas, botón "Cómo llegar"
- Fondos con gradientes sutiles y glow radial en tarjeta sede

---

## Tareas pendientes

### Prioritarias
- Ajustar imagen Foto-entrada.webp en mobile — revisar object-position en distintos tamaños de pantalla para punto óptimo
- Agregar index.html migrado — enlazar desde sobre-nosotros cuando esté listo
- Agregar más zonas en sección Ubicación/Visitanos — incluir barrios cercanos adicionales (Soldati, Lugano 1 y 2, Ciudad Oculta, etc.)

### UI / Estructura
- Footer — Componente compartido con info de contacto, redes sociales, dirección y horario. Se nota su ausencia al final de la página
- Redes sociales — Agregar íconos de Instagram/Facebook si existen, en la zona de contacto o como links en el footer
- Carrusel campus Córdoba — En mobile las 3 imágenes se apilan vertical y ocupan mucho scroll. Convertir a carrusel horizontal

### Contenido
- Testimonios de alumnos — 2-3 citas de egresados con nombre y carrera. Genera confianza. Podrían venir de Supabase
- Línea de tiempo — "Nuestra historia" con 3-4 hitos clave (apertura, alianza con Siglo 21, egresados, etc). Visual y corto
- Fotos del equipo/instalaciones — Galería con next/image
- Convenios y alianzas — Logos de instituciones asociadas
- boton de clases de apoyo y modificar color de esos botones

### Interactividad
- Animaciones de entrada — Intersection Observer para fade-in suave al hacer scroll en cada sección
- Contador animado — Los stats (+1000, +88, 30) arrancando de 0 y subiendo al entrar en viewport

### Visual
- Sección servicios — Sin la imagen de fondo quedó funcional pero plana. Probar gradiente más marcado o textura sutil

### Backend
- Contenido desde Supabase — Mover textos, features y checklist a una tabla para editar sin tocar código
