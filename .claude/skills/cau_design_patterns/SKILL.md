# CAU Villa Lugano - Design Patterns

Patrones de diseño extraídos de index.html, novedades.html y faq.html del sitio CAU Villa Lugano (Universidad Siglo 21).

## CSS Custom Properties

```css
:root {
  /* Brand */
  --color-deep-dark-bg: #013729;
  --color-card-bg: #1c2f31;
  --color-highlight: #00c7b1;
  --color-secondary-highlight: #48b3a4;
  --color-text-light: #7ca19b;
  --color-text-normal: white;
  --color-accent: #00ffe1;
  --color-surface: #162f2e;
  --color-gold: #e69b05;
  --color-special: #7c207b;
  --navbar-height: 60px;

  /* CAU Brand */
  --cau-brand-teal: #006c5b;
  --cau-brand-blue: #005587;
  --cau-brand-green: #058c70;
  --cau-brand-dark-green: #046353;
  --cau-brand-cream: #fef8f4;
  --cau-brand-deep-teal: #0e6a5a;
}
```

## Typography

- **Body:** `Inter`, weights 100-900
- **Pills/Tags:** `Atkinson Hyperlegible`
- **Branding:** `Unbounded`
- **Headings:** font-weight 800-900, uppercase, tracking-tighter (-0.05em), text-shadow 0 2px 8px
- **Labels:** 9-10px, bold, uppercase, tracking-wider, color rgba(0,199,177,0.8) o #9ac5be

## Body & Background

```css
body {
  background: #041211;
  color: white;
  font-family: 'Inter', sans-serif;
}
body::before {
  /* Gradiente radial + linear */
  background: radial-gradient(ellipse at 20% 50%, rgba(0,199,177,0.08) 0%, transparent 50%),
              linear-gradient(170deg, #041211, #071d1b, #082422, #061716);
}
body::after {
  /* Grid pattern overlay sutil, 40px spacing */
}
/* Scrollbar */
scrollbar-thumb: #00c7b1;  scrollbar-track: #061716;
```

## Responsive Breakpoints

| Breakpoint | Uso |
|---|---|
| `1600px` | Sidebar de beneficios + imagen lateral formulario |
| `1280px` (xl) | Hero logo aparece, padding xl:px-20 |
| `1024px` (lg) | Desktop layout |
| `900px` | Career grid 2 columnas |
| `768px` (md) | Form 2 columnas, news grid 2 cols |
| `640px` (sm) | Mobile filters, padding sm:px-8 |
| `350px, 300px, 150px` | Micro-resoluciones extremas |

## Component Patterns

### Cards (Career List)

```css
.career-name-list {
  --card-bg: #193636;
  --card-hover-bg: #062522;
  --card-border: rgba(0,199,177,0.22);
  border-radius: 0.5rem;
  border: 2px solid var(--card-border);
  transition: all 0.3s ease;
}
/* Hover: border-color highlight, box-shadow 0 4px 12px rgba(0,0,0,0.22) */
```

### Cards (News)

```css
.news-card {
  background: var(--color-card-bg);
  border: 1px solid rgba(0,199,177,0.06);
  border-radius: 0.75rem;
  transition: all 0.35s ease;
}
/* Hover: border rgba(0,199,177,0.3), shadow 0 12px 40px rgba(0,0,0,0.35), translateY(-3px) */
/* Image hover: scale(1.05) 0.5s cubic-bezier(0.22,1,0.36,1) */
```

### Pills / Filter Chips

```css
.filter-pill {
  background: rgba(200,200,210,0.12);
  color: #c5c8ce;
  border: 1px solid rgba(200,200,210,0.25);
  padding: 0.625rem 1.125rem;
  border-radius: 9999px;
  font: 650 0.8rem 'Atkinson Hyperlegible';
  text-transform: uppercase;
  letter-spacing: 0.015em;
  min-height: 2.75rem;
}
/* Active: white bg (0.9 opacity), #1a1a1a text */
/* Featured: --cau-brand-green bg, white text */
```

### News Tags

```css
.news-tag {
  font: 700 0.6rem/1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #00c7b1;
  background: rgba(0,199,177,0.08);
  border: 1px solid rgba(0,199,177,0.18);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}
```

### Buttons

```css
/* Primary (submit) */
background: linear-gradient(90deg, #00c7b1, #009681);
color: #013729;
font-weight: 900;
text-transform: uppercase;
letter-spacing: 0.12em;
border-radius: 0.5rem;

/* Detail link */
.detail-link {
  background: #00c7b1;
  color: #042620;
}
/* Hover: bg #009681, color white */

/* Brand button */
background: linear-gradient(135deg, var(--cau-brand-blue), var(--cau-brand-green));
/* Hover: brightness(1.15) */
```

### Form Inputs

```css
input, select {
  background: #0f2825;
  border: 1px solid rgba(0,199,177,0.25);
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  color: white;
  font-size: 0.875rem;
}
/* Focus: border-color rgba(0,199,177,0.6) */
/* Placeholder: #7ca19b at 60% opacity */
```

### Form Card

```css
.form-card {
  background: #1c3a38;
  border: 1px solid rgba(0,199,177,0.3);
  border-radius: 1rem;
}
/* Header: background rgba(0,0,0,0.35), border-bottom 1px solid rgba(0,199,177,0.15) */
/* At 1600px+: border-right none, border-radius 1rem 0 0 1rem (joins with image) */
```

### FAQ Accordion

```css
.faq-item {
  background: var(--color-card-bg);
  border: 1px solid rgba(0,199,177,0.28);
  border-left: none;
  border-bottom: 2px solid rgba(0,199,177,0.22);
}
.faq-btn {
  background: linear-gradient(to right,
    rgba(0,199,177,0.12) 0px, rgba(0,199,177,0.12) 66px,
    rgba(0,199,177,0.4) 66px, rgba(0,199,177,0.4) 68px,
    transparent 68px);
}
.faq-content {
  transition: max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease;
  overflow: hidden;
}
/* Open: border-bottom intensifies, content bg #162e30 */
```

### Sidebar (Benefits)

```css
/* Container */
background: linear-gradient(135deg, rgba(0,199,177,0.08), rgba(0,199,177,0.03));
border: 1px solid rgba(0,199,177,0.18);
border-radius: 1rem;
padding: 1.75rem;

/* Chips */
.sidebar-benefit-chip {
  background: rgba(0,199,177,0.06);
  border: 1px solid rgba(0,199,177,0.15);
  border-radius: 0.75rem;
  padding: 1.15rem 1.25rem;
}
/* Icon container: 3.5rem, bg rgba(0,199,177,0.1), border rgba(0,199,177,0.2), radius 0.75rem */
/* Title: 1.05rem, #e0e0e0, 700 weight */
/* Description: 0.88rem, #c8d8d4 */
/* Percentage inline: font-weight 800, color #00c7b1 */
```

### Modals

```css
/* Overlay */
position: fixed; inset: 0; z-index: 3000;
background: rgba(0,10,10,0.82);
backdrop-filter: blur(5px);

/* Box */
max-width: 480px;
border-radius: 1.25rem;
border: 1px solid rgba(5,140,112,0.5);
background: #122e2e;
box-shadow: 0 24px 64px rgba(0,0,0,0.55);

/* Header */
background: linear-gradient(135deg, #012a1f, #0d3040);
border-bottom: 1px solid rgba(0,199,177,0.2);
```

### Pagination

```css
.page-btn {
  min-width: 2.25rem; height: 2.25rem;
  font: 700 0.8rem; color: #d0e8e4;
  background: #0a2e28;
  border: 1px solid rgba(0,199,177,0.25);
  border-radius: 0.4rem;
}
/* Active: bg #00c7b1, color #013729 */
```

## Layout Patterns

### Sticky Header

```css
.sticky-header-wrapper {
  position: sticky;
  top: var(--navbar-height, 50px);
  z-index: 999;
  background: rgba(5,26,26,0.97);
  backdrop-filter: blur(12px);
  border-bottom: 2px solid #00c7b1;
  /* Full-width breakout */
  width: 100vw;
  margin-left: calc(-50vw + 50%);
}
```

### Main Grid (careers + sidebar)

```css
#main-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
@media (min-width: 1600px) {
  #main-grid { grid-template-columns: 1fr 500px; }
  #sidebar-column { display: block; position: sticky; top: var(--sidebar-sticky-top); }
}
```

### Form + Image Layout

```css
.form-layout-grid { display: grid; grid-template-columns: 1fr; }
@media (min-width: 1600px) {
  .form-layout-grid { grid-template-columns: 5fr 4fr; align-items: stretch; }
  .form-side-image { display: block; }
  .form-side-image::before { /* vertical border line at junction */ }
}
/* < 1600px: background image blurred (filter: blur(18px) brightness(0.35), opacity 0.45) */
```

### Banner Carousel

```css
.banner-carousel-container {
  aspect-ratio: 3/1; /* desktop */
  max-height: 140px;
}
.banner-carousel-track {
  display: flex;
  transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
}
```

## Animation Patterns

### Timing Functions
- **Standard:** `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out material)
- **Emphasis:** `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out back)
- **Bounce:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot)
- **Exit:** `cubic-bezier(0.7, 0, 0.84, 0)` (accelerate out)

### Durations
- `0.2s` — quick interactions (hover, focus)
- `0.3s` — standard transitions (borders, colors, opacity)
- `0.35s` — card hover effects
- `0.5s-0.6s` — emphasis animations (overlays, carousels)

### Common Effects
- **Card hover:** `translateY(-3px)` + shadow increase
- **Image zoom:** `scale(1.05)` on parent hover
- **Entrance:** `translateY(24px)` → 0, opacity 0 → 1, staggered 0.08s delays
- **Success overlay:** slide up from bottom, checkmark stroke-dasharray animation
- **Skeleton loader:** shimmer with background-position sweep 1.5s

### Form Success Animation

```css
.form-success-overlay {
  transform: translateY(100%);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.form-success-overlay.active { transform: translateY(0); }
.form-success-overlay.closing {
  transform: translateY(-100%);
  transition: transform 0.45s cubic-bezier(0.7, 0, 0.84, 0);
}
/* Circle: pop animation 0.4s with overshoot */
/* Check: stroke-dashoffset 30→0 in 0.4s */
/* Text: opacity fade with 0.7s/0.85s delays */
```

## Border Patterns

| Contexto | Valor |
|---|---|
| Card default | `1px solid rgba(0,199,177,0.06)` a `rgba(0,199,177,0.22)` |
| Card hover | `rgba(0,199,177,0.3)` |
| Form container | `1px solid rgba(0,199,177,0.3)` |
| Dividers internos | `1px solid rgba(0,199,177,0.15)` |
| Highlight sections | `2px solid #00c7b1` |
| Sidebar container | `1px solid rgba(0,199,177,0.18)` |
| Input focus | `rgba(0,199,177,0.6)` |

## Naming Conventions

- **BEM-inspired:** `.news-card`, `.news-card--main`, `.news-card__img`
- **State classes:** `.active`, `.is-open`, `.visible`, `.hidden`, `.panel-open`
- **Component prefixes:** `.news-*`, `.career-*`, `.sidebar-*`, `.floating-*`, `.form-*`, `.faq-*`
- **Utility-like:** Tailwind classes mixed with custom CSS
- **JS hooks:** `id="section-carreras"`, `id="main-grid"`, `id="sidebar-column"`
