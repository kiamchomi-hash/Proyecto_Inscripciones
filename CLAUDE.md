ml
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for **Universidad Siglo 21 - CAU Villa Lugano**, a distance learning university center. Showcases academic programs and facilitates student enrollments.

## Running the Site

```bash
# Development (TypeScript directo)
npm run dev

# Producción (compilar primero)
npm run build
npm start

# Compilar Tailwind CSS
npm run css:build        # una vez
npm run css:watch        # modo watch

# El servidor corre en http://localhost:8080
```

## Tech Stack

- **Frontend:** HTML/CSS/JavaScript (ES6+), migrando a TypeScript
- **Backend:** Node.js + Express (TypeScript)
- **Styling:** Tailwind CSS v4 (local via @tailwindcss/cli) + custom CSS variables
- **Validación:** Zod (schemas para datos JSON)
- **HTTP Client:** Axios (disponible, migración gradual desde fetch)
- **Fonts:** Google Fonts — Inter (body), Atkinson Hyperlegible (pill tags), Unbounded (headings)
- **Language:** All UI text and code comments are in Spanish (es-ES)

## Project Structure

```
├── src/
│   ├── server.ts           # Express server (sirve estáticos + API endpoints)
│   ├── schemas.ts          # Zod schemas para datos_carreras y novedades_data
│   └── styles/
│       └── input.css       # Tailwind CSS entrada
├── dist/                   # TypeScript compilado (gitignored)
├── public/
│   └── styles.css          # Tailwind CSS compilado (gitignored)
├── index.html              # Main page — careers catalog, enrollment form
├── clases-apoyo.html       # Support classes page (panel institucional)
├── contactos.html          # Contact page
├── faq.html                # FAQ page
├── sobre-nosotros.html     # About us page
├── novedades.html          # News page (page 1 of 10)
├── novedades2–10.html      # Paginated news pages
├── datos_carreras.json     # Academic programs data (60+ entries)
├── novedades_data.json     # News items data
├── shared/
│   ├── navbar.html         # Navbar markup (canonical source)
│   ├── navbar.css          # Shared navbar styles
│   └── background.css      # Shared background styles
├── imagenes/               # Image assets
├── package.json            # npm config
└── tsconfig.json           # TypeScript config
```

## API Endpoints

- `GET /api/carreras` — returns validated careers data (Zod)
- `GET /api/novedades` — returns validated news data (Zod)

## Architecture Patterns

### Navbar
The navbar is duplicated across pages. `shared/navbar.html` is the canonical source. Most pages link `shared/navbar.css` for styles; `index.html` has its own inline copy of the navbar CSS instead.

When modifying navbar styles or markup, update **both**:
1. `shared/navbar.html` + `shared/navbar.css`
2. The inline copy in `index.html`
3. Any page that has diverged (check with grep for `.main-navbar` blocks)

### Color Scheme (CSS Variables)

Defined in `:root` on each page:

| Variable | Value | Usage |
|---|---|---|
| `--color-deep-dark-bg` | `#013729` | Page background |
| `--color-card-bg` | `#1c2f31` | Card backgrounds |
| `--color-highlight` | `#00c7b1` | Primary accent (teal) |
| `--color-secondary-highlight` | `#48b3a4` | Secondary accent |
| `--color-text-light` | `#7ca19b` | Muted text |

### JavaScript
Currently inline `<script>` at the bottom of each HTML file. Gradual migration to separate `.ts` files planned.

### Data Files
- `datos_carreras.json` — fetched at runtime by `index.html`, validated by `CarrerasDataSchema`
- `novedades_data.json` — fetched at runtime by `novedades*.html`, validated by `NovedadesDataSchema`

### novedades Pages
News is split into 10 static HTML pages (`novedades.html`, `novedades2.html` … `novedades10.html`). Pagination logic runs in the inline JS of each page, deriving the current page number from the filename.

## Key Features (in index.html)

- Fuzzy search (Levenshtein distance) over careers catalog
- Drag-and-drop file upload
- Fee calculator with discount logic
- `localStorage` for user preferences
- HTTPS redirect (skipped for localhost/192.168.x)
