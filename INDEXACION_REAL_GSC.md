# Estado de indexación REAL — Google Search Console

**Fuente:** Search Console (URL Inspection API + Search Analytics) · **Propiedad:** `sc-domain:siglo21sur.com`

Este documento tiene dos mediciones. La del **24/07** es la línea de base, tomada
justo antes de deployar el arreglo (contenido propio, enlaces internos, sitemap
depurado). La del **27/07** mide qué pasó tres días después. La base no se toca:
es contra lo que se compara en agosto.

---

# Estado al 27/07 — tres días después del deploy

**Al menos 38 de las 96 carreras están indexadas.** Eran 23 el 24/07.

| | 24/07 (base) | 27/07 | Cambio |
|---|--:|--:|--:|
| Carreras indexadas | 23 | **38** | **+15** |
| Sobre el total de 96 | 24% | **40%** | +16 pts |

Es un piso, no un techo: se contaron las carreras que **aparecieron en resultados de
Google** en los últimos 30 días, y una página puede estar indexada sin haber recibido
impresiones en ese lapso. El número real es 38 o más.

## Qué se movió

Las **10 carreras del Día 1** del plan estaban todas en ❌ *Descubierta, sin rastrear*
y hoy aparecen en Google:

| Carrera | Impresiones (30 días) | Posición |
|---|--:|--:|
| Higiene, Seguridad y Medio Ambiente del Trabajo | 28 | 9,3 |
| Seguridad Informática | 20 | 10,9 |
| Logística Global | 15 | 8,3 |
| Inteligencia Artificial y Robótica | 12 | 14,7 |
| Finanzas | 10 | 8,8 |
| Comercio Internacional | 9 | 9,3 |
| Ciencias de Datos | 9 | 14,0 |
| Gestión Ambiental | 9 | 13,6 |
| Matemática | 9 | 6,3 · 1 clic |
| Comercialización | 5 | 14,0 |

Y cinco más de otros grupos: **Gestión de Recursos Humanos**, **Relaciones
Internacionales**, **Periodismo**, **Marketing Digital** (Teclab) y **Cloud
Administration** (Teclab).

**Ninguna se pidió a mano.** Google las rastreó solo después del deploy.

Verificado además con inspección directa de URL el 27/07:

| Carrera | 24/07 | 27/07 |
|---|---|---|
| Tecnicatura Superior en Marketing Digital | ❌ Descubierta | ✅ **Indexada** (rastreada 25/07, con breadcrumbs) |
| Tecnicatura Superior en Inbound Marketing | ✅ Indexada | ✅ Indexada (rastreada 23/07) |
| Tecnicatura Superior en Seguros | ⬜ Desconocida | ❌ **Descubierta** |
| Tecnicatura Superior en Gestión Agraria | ⬜ Desconocida | ❌ **Descubierta** |
| Tecnicatura Superior en Gestión Contable | ❌ Descubierta | ❌ Descubierta |

## El cuello de botella se movió

Ocho páginas están en **posición 8 a 11 con cero clics**: Sobre nosotros (124
impresiones), Administración Agraria (55), Actuario (54), Investigación de la Escena
del Crimen (50), Redes Informáticas (35), Marketing Digital (33), Higiene y Seguridad
(28), Bioinformática (27).

Google ya las muestra. Lo que falla ahora es el `<title>` y la meta description.
Referencia: Agroinformática convierte al **10%** en posición 6,2; Actuario al **0%**
en 8,7.

## Tráfico total del sitio (30 días, 28/06 – 27/07)

| | |
|---|--:|
| Páginas con impresiones | 55 |
| Impresiones | 1.578 |
| Clics | 38 |

El home se lleva 631 impresiones (40%) con posición 15,3 y CTR 2,85%. Agroinformática
sola aporta 11 de los 38 clics — el 29% del total, en una carrera que todavía no se
dicta (ver `proximamente` en `components/index/types.ts`).

---

# Línea de base — 24/07

> ⚠️ Lo que sigue refleja producción **ANTES** del deploy del 24/07. Se conserva sin
> cambios como punto de comparación.

## Qué significa cada estado

| | Estado | Qué quiere decir |
|--|--|--|
| ✅ | Indexada | Está en Google, puede aparecer en búsquedas. |
| 🟠 | Rastreada, sin indexar | Google la visitó pero decidió no indexarla (típico: contenido duplicado del home). |
| ❌ | Descubierta, sin rastrear | Google sabe que existe (por el sitemap) pero **nunca la visitó**. Falta de enlaces internos + poca autoridad. |
| ⬜ | Desconocida para Google | Google ni siquiera la tiene registrada todavía. |

## Resumen general

Alcance: las **96 carreras de la oferta vigente** (Grado, Pregrado, Grado CCC, Teclab e
Identidad Argentina). Posgrado, APLV/Extragrado, Certificaciones y Cursos quedaron fuera
del sitio el 27/07/2026 y no se miden.

| | Estado | Carreras | % |
|--|--|--:|--:|
| ✅ | Indexadas | 23 | 24% |
| 🟠 | Rastreadas sin indexar | 4 | 4% |
| ❌ | Descubiertas sin rastrear | 62 | 65% |
| ⬜ | Desconocidas | 7 | 7% |
| | **Total** | **96** | **100%** |

**23 de 96 carreras indexadas.** Las otras 73 no aparecen en Google.

---

## Siglo 21 — Grado (Licenciaturas)

**36 carreras** — ✅ 13 · 🟠 1 · ❌ 22 · ⬜ 0

| | Carrera | Estado en Google |
|:--:|---|---|
| ✅ | Abogacía | Indexada |
| ✅ | Escribanía | Indexada |
| ✅ | Contador Público | Indexada |
| ✅ | Licenciatura en Administración | Indexada |
| ❌ | Licenciatura en Finanzas | Descubierta, sin rastrear |
| ✅ | Actuario | Indexada |
| ❌ | Licenciatura en Comercio Internacional | Descubierta, sin rastrear |
| ❌ | Licenciatura en Comercialización | Descubierta, sin rastrear |
| ✅ | Licenciatura en Negocios Digitales | Indexada |
| ❌ | Licenciatura en Inteligencia Artificial y Robótica | Descubierta, sin rastrear |
| ❌ | Licenciatura en Ciencias de Datos | Descubierta, sin rastrear |
| ❌ | Licenciatura en Seguridad Informática | Descubierta, sin rastrear |
| ✅ | Licenciatura en Informática | Indexada |
| ❌ | Licenciatura en Matemática | Descubierta, sin rastrear |
| ✅ | Licenciatura en Bioinformática | Indexada |
| ❌ | Licenciatura en Logística Global | Descubierta, sin rastrear |
| ❌ | Licenciatura en Gestión Ambiental | Descubierta, sin rastrear |
| ❌ | Licenciatura en Higiene, Seguridad y Medio ambiente del Trabajo | Descubierta, sin rastrear |
| ❌ | Licenciatura en Gestión Turística | Descubierta, sin rastrear |
| 🟠 | Licenciatura en Administración Hotelera | Rastreada, sin indexar |
| ❌ | Licenciatura en Gestión de Recursos Humanos | Descubierta, sin rastrear |
| ❌ | Licenciatura en Gestión Deportiva | Descubierta, sin rastrear |
| ✅ | Licenciatura en Administración Agraria | Indexada |
| ❌ | Licenciatura en Ciencia Política y Gobierno | Descubierta, sin rastrear |
| ✅ | Licenciatura en Administración Pública | Indexada |
| ❌ | Licenciatura en Relaciones Internacionales | Descubierta, sin rastrear |
| ✅ | Licenciatura en Criminología y Seguridad | Indexada |
| ❌ | Licenciatura en Periodismo | Descubierta, sin rastrear |
| ✅ | Licenciatura en Publicidad | Indexada |
| ❌ | Licenciatura en Relaciones Públicas e Institucionales | Descubierta, sin rastrear |
| ❌ | Licenciatura en Diseño y Animación Digital | Descubierta, sin rastrear |
| ❌ | Licenciatura en Terapia Ocupacional y Desarrollo Humano | Descubierta, sin rastrear |
| ❌ | Licenciatura en Educación y Nuevas Tecnologías | Descubierta, sin rastrear |
| ❌ | Licenciatura en Nutrición | Descubierta, sin rastrear |
| ✅ | Licenciatura en Agroinformática | Indexada |
| ❌ | Licenciatura en Sociología | Descubierta, sin rastrear |

## Siglo 21 — Grado CCC

**7 carreras** — ✅ 1 · 🟠 0 · ❌ 5 · ⬜ 1

| | Carrera | Estado en Google |
|:--:|---|---|
| ❌ | Licenciatura en Desarrollo De Negocios Inmobiliarios (CCC) | Descubierta, sin rastrear |
| ❌ | Licenciatura en Gerontología (CCC) | Descubierta, sin rastrear |
| ⬜ | Licenciatura en Emprendimiento (CCC) | Desconocida para Google |
| ✅ | Licenciatura en Administración de Servicios de Salud (CCC) | Indexada |
| ❌ | Licenciatura en Educación (CCC) | Descubierta, sin rastrear |
| ❌ | Licenciatura en Psicopedagogía (CCC) | Descubierta, sin rastrear |
| ❌ | Profesorado Universitario para Nivel Secundario y Superior (CCC) | Descubierta, sin rastrear |

## Siglo 21 — Pregrado (Tecnicaturas)

**25 carreras** — ✅ 6 · 🟠 3 · ❌ 14 · ⬜ 2

| | Carrera | Estado en Google |
|:--:|---|---|
| ❌ | Martillero, Corredor Público y Corredor Inmobiliario | Descubierta, sin rastrear |
| ❌ | Procurador | Descubierta, sin rastrear |
| ✅ | Tecnicatura en Investigación de la escena del crimen | Indexada |
| ❌ | Tecnicatura en Administración y Gestión Tributaria | Descubierta, sin rastrear |
| 🟠 | Tecnicatura en Gestión de Empresas Familiares | Rastreada, sin indexar |
| ❌ | Tecnicatura en Administración y Gestión de Políticas Públicas | Descubierta, sin rastrear |
| 🟠 | Tecnicatura en Responsabilidad y Gestión Social | Rastreada, sin indexar |
| ✅ | Tecnicatura en Higiene y Seguridad Laboral | Indexada |
| ❌ | Tecnicatura en Diseño y Animación Digital | Descubierta, sin rastrear |
| ❌ | Tecnicatura en Marketing y Publicidad Digital | Descubierta, sin rastrear |
| ❌ | Tecnicatura en Recursos Turísticos | Descubierta, sin rastrear |
| ⬜ | Tecnicatura en Hidrocarburos y Geociencias | Desconocida para Google |
| ❌ | Tecnicatura en Gestión y Auditorías Ambientales | Descubierta, sin rastrear |
| ❌ | Tecnicatura en Dirección de Equipos de venta | Descubierta, sin rastrear |
| ❌ | Tecnicatura en Gestión Contable e impositiva | Descubierta, sin rastrear |
| 🟠 | Tecnicatura en Relaciones Laborales | Rastreada, sin indexar |
| ❌ | Tecnicatura en Dirección de Protocolo, Organización de Eventos y RRPP | Descubierta, sin rastrear |
| ⬜ | Tecnicatura en Gestión de Moda | Desconocida para Google |
| ✅ | Tecnicatura en Gestión del Clima Laboral de la Organización | Indexada |
| ✅ | Tecnicatura en Promoción Comunitaria en Niñez y Adolescencia | Indexada |
| ❌ | Tecnicatura en Gestión Administrativa de Servicios de Salud | Descubierta, sin rastrear |
| ✅ | Tecnicatura en Redes Informáticas y Telecomunicaciones | Indexada |
| ❌ | Tecnicatura en Diseño y Desarrollo de Videojuegos | Descubierta, sin rastrear |
| ✅ | Tecnicatura en Negocios Agroecológicos | Indexada |
| ❌ | Tecnicatura en Estadística Aplicada y Análisis Avanzado | Descubierta, sin rastrear |

## Teclab — Tecnología

**6 carreras** — ✅ 0 · 🟠 0 · ❌ 6 · ⬜ 0

| | Carrera | Estado en Google |
|:--:|---|---|
| ❌ | Tecnicatura Superior en Programación | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Data Science | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Quality Assurance | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Redes Informáticas | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Seguridad Informática | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Cloud Administration | Descubierta, sin rastrear |

## Teclab — Gestión

**11 carreras** — ✅ 1 · 🟠 0 · ❌ 8 · ⬜ 2

| | Carrera | Estado en Google |
|:--:|---|---|
| ❌ | Tecnicatura Superior en Marketing Digital | Descubierta, sin rastrear |
| ✅ | Tecnicatura Superior en Inbound Marketing | Indexada |
| ❌ | Tecnicatura Superior en Customer Experience | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Venta Directa | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Gestión Contable | Descubierta, sin rastrear |
| ⬜ | Tecnicatura Superior en Seguros | Desconocida para Google |
| ⬜ | Tecnicatura Superior en Gestión Agraria | Desconocida para Google |
| ❌ | Tecnicatura Superior en Relaciones Laborales | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Gestión Hotelera | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Planificación y Organización de Eventos | Descubierta, sin rastrear |
| ❌ | Tecnicatura Superior en Periodismo y Nuevas Tecnologías | Descubierta, sin rastrear |

## Identidad Argentina

**11 carreras** — ✅ 2 · 🟠 0 · ❌ 7 · ⬜ 2

| | Carrera | Estado en Google |
|:--:|---|---|
| ❌ | Diplomatura en Oratoria | Descubierta, sin rastrear |
| ❌ | Diplomatura en Gestión de Equipos de Alto Desempeño | Descubierta, sin rastrear |
| ❌ | Curso de Mindfulness y Técnicas de Gestión del Estrés | Descubierta, sin rastrear |
| ✅ | Diplomatura en Bienestar Integral: Herramientas para Transformar-te | Indexada |
| ❌ | Diplomatura Integral en RRHH | Descubierta, sin rastrear |
| ⬜ | Diplomatura en Fraude Financiero y Digital | Desconocida para Google |
| ❌ | Diplomatura en Inteligencia Artificial | Descubierta, sin rastrear |
| ❌ | Curso de Constitución de Sociedades S.A, S.A.S, S.R.L | Descubierta, sin rastrear |
| ⬜ | Diplomatura en Marketing para Emprendedores y Dueños de Negocios | Desconocida para Google |
| ✅ | Diplomatura en Compliance | Indexada |
| ❌ | Diplomatura en Management Hotelero | Descubierta, sin rastrear |

---

## Lectura de los datos

- **Solo 23 indexadas de 96.** El grueso está en ❌ *Descubierta, sin rastrear*: Google conoce la URL por el sitemap pero **nunca la visitó**, justo el síntoma de los dos bloqueos que arreglamos hoy (sin enlaces internos + páginas duplicadas del home).
- Las 🟠 *Rastreadas sin indexar* son el caso más claro: Google entró, vio que la página era casi idéntica al home y la descartó.
- Las ⬜ *Desconocidas* son URLs que Google todavía no registró; deberían resolverse solas cuando vuelva a leer el sitemap.
- **Dato clave:** las que están ✅ son casi todas las que Google rastreó hace poco (últimas semanas). Cuando se deployen los cambios y Google vuelva a rastrear con contenido propio + enlaces, las ❌ y 🟠 deberían empezar a pasar a ✅.

## Próximo paso recomendado (escrito el 24/07 — ya cumplido)

1. ✅ **Deployar** los cambios (contenido server-side + enlaces + sitemap depurado). Hecho el 24/07.
2. ✅ Pedir indexación de algunas carreras testigo. **No hizo falta:** 15 se indexaron solas.
3. Volver a correr este informe en 2-4 semanas. Pendiente: mediados de agosto.

Lo vigente está arriba, en el estado al 27/07, y el plan de solicitudes actualizado en
`PLAN_INDEXACION.md` (23 URLs de convenio, que son las que no se están indexando solas).
