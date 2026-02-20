# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for **Universidad Siglo 21 - CAU Villa Lugano**, a distance learning university center. Showcases academic programs and facilitates student enrollments.

## Running the Site

No build step — open any `.html` file directly in a browser, or serve with any static file server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript (ES6+)
- **Styling:** Tailwind CSS (via CDN) + custom CSS variables
- **Fonts:** Google Fonts — Inter (body), Atkinson Hyperlegible (pill tags)
- **OCR:** Tesseract.js v4 (CDN, used in `index.html`)
- **Language:** All UI text and code comments are in Spanish (es-ES)

## Project Structure

```
├── index.html              # Main page — careers catalog, enrollment form, OCR tool
├── clases-apoyo.html       # Support classes page
├── contactos.html          # Contact page
├── faq.html                # FAQ page
├── sobre-nosotros.html     # About us page
├── novedades.html          # News page (page 1 of 10)
├── novedades2–10.html      # Paginated news pages
├── datos_carreras.json     # Academic programs data (60+ entries), loaded at runtime
├── novedades_data.json     # News items data, loaded at runtime by novedades*.html
├── shared/
│   ├── navbar.html         # Navbar markup (manually copied into each page)
│   └── navbar.css          # Shared navbar styles (linked from most pages)
└── imagenes/               # Image assets
```

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
All JS is inline `<script>` at the bottom of each HTML file — no separate `.js` files.

### Data Files
- `datos_carreras.json` — fetched at runtime by `index.html` to render the careers catalog
- `novedades_data.json` — fetched at runtime by `novedades*.html` to render news items; has a `pinned` object + `items` array

### novedades Pages
News is split into 10 static HTML pages (`novedades.html`, `novedades2.html` … `novedades10.html`). Pagination logic runs in the inline JS of each page, deriving the current page number from the filename.

## Key Features (in index.html)

- Fuzzy search (Levenshtein distance) over careers catalog
- OCR via Tesseract.js for extracting prices from uploaded images
- Drag-and-drop file upload
- Fee calculator with discount logic
- `localStorage` for user preferences
- HTTPS redirect (skipped for localhost/192.168.x)
