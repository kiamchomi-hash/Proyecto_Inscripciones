# CLAUDE.md

## Project Overview

Static website for **Universidad Siglo 21 - CAU Villa Lugano**, a distance learning university center. Showcases academic programs and facilitates student enrollments.

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript (ES6+)
- **Styling:** Tailwind CSS (via CDN)
- **Font:** Google Fonts - Inter
- **OCR:** Tesseract.js v4 (CDN)
- **Build system:** None — no bundler, no package manager, purely static files
- **Language:** All UI text and comments are in Spanish (es-ES)

## Project Structure

```
├── index.html              # Main page — careers catalog, enrollment, OCR tools (~8k lines)
├── clases-apoyo.html       # Support classes page
├── contactos.html          # Contact page
├── sobre-nosotros.html     # About us page
├── novedades.html          # News/updates page
├── datos_carreras.json     # Academic program data (60+ programs)
├── convert_to_json.py      # Python utility to convert career data to JSON
├── extract.ps1             # PowerShell data extraction script
└── imagenes/               # Image assets
```

## Key Conventions

- All JavaScript is inline within HTML files (no separate .js files)
- CSS uses Tailwind utility classes plus custom CSS variables for the color scheme
- Career data is stored in `datos_carreras.json` and loaded at runtime
- No server-side code — everything runs in the browser

## Color Scheme (CSS Variables)

- `#013729` — deep dark background
- `#1c2f31` — card background
- `#00c7b1` — primary accent (teal)
- `#48b3a4` — secondary accent
- `#7ca19b` — muted text

## Notable Features

- Fuzzy search using Levenshtein distance algorithm
- OCR via Tesseract.js for extracting prices from images
- Drag-and-drop file upload
- localStorage for user personalization
- Fee calculator with discount logic

## Last Verified

- GitHub integration: 2026-02-12
