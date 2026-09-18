---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics. NOT for fixed-size pieces the user will hand-edit afterwards — a poster, flyer, brochure, artboard or /design canvas is `lienzo-de-diseno`.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

### Copy visible: breve y funcional

En interfaces públicas, no describas el mecanismo de la interfaz ni le cuentes
al usuario cómo se está armando el resultado. El texto visible debe nombrar la
acción, el contenido o el estado con la menor cantidad de palabras posible.

- Preferí `Carreras`, `Resultado`, `12 preguntas` o `Empezar`.
- Evitá frases como `Tu mapa se actualiza`, `Mientras respondés...` o
  `preguntas para encontrar dirección`.
- Si una animación o un cambio visual ya comunica algo, no lo expliques también
  con texto.
- La justificación de diseño va en el comentario de código o en el mensaje al
  usuario, nunca en la interfaz.

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Inspección visual obligatoria antes de editar

Nunca corregir una interfaz visual a ciegas ni atribuir un defecto a una causa sin comprobarlo. Antes de tocar CSS o markup, abrir la pantalla real en el navegador o capturarla, inspeccionar el elemento que produce el problema y verificar dimensiones, overflow, fondos, pseudoelementos y scroll. Después del cambio, volver a mirar la pantalla real y confirmar que la causa quedó resuelta. Si el problema no está localizado, seguir inspeccionando; no compensarlo con ajustes arbitrarios.

## UIverse local: referencia obligatoria para este sitio

Cuando el trabajo sea sobre el sitio del CAU, Universidad Siglo 21 o Teclab,
consultá directamente la biblioteca local antes de escribir JSX o CSS:

1. Leé `~/Desktop/uiverse/LEER.md` para conocer el catálogo y la forma de
   guardar la curaduría.
2. Leé `~/Desktop/uiverse/biblioteca/estado.json` y usá la clave `usos` para
   filtrar las piezas marcadas para la marca correspondiente: `siglo21` o
   `teclab`. No mezcles piezas marcadas `ninguna`.
3. Para cada pieza seleccionada, abrí su carpeta en
   `~/Desktop/uiverse/biblioteca/mias/` y revisá `meta.json`, `pieza.html` y
   `pieza.css`. Consultá primero las piezas propias marcadas para esa marca;
   el catálogo general y referencias externas quedan como segunda opción.
4. Elegí referencias por el problema que resuelven —por ejemplo, transición,
   botón, panel lateral, fondo o jerarquía— y adaptá su código al sistema del
   sitio. No copies nombres genéricos de clases ni introduzcas otra paleta o
   tipografía sin una razón concreta.

En el mensaje de trabajo dejá constancia breve de qué piezas locales se
consultaron y qué decisión tomó cada una. Si no hay una pieza pertinente,
decilo y diseñá sólo el elemento faltante; no fuerces una referencia que no
corresponda.

## Ground the Direction in Real References First

The failure mode this skill exists to prevent — generic AI aesthetics — comes
from designing out of memory. Memory averages. It hands back the median of
everything ever scraped, which is exactly the look to avoid.

So before writing CSS, spend one step pulling **real** references. Not to copy
them: to have concrete evidence for the three decisions that set the tone.

1. **Typefaces.** Memory returns Inter, Poppins and Space Grotesk. Find sites
   that already have the tone you want and take the families they actually use.
2. **Palette and spacing.** Read a real product's values and adapt them; do not
   invent a scale.
3. **Composition.** What sections the page has and in what order is a question
   about the audience, not about taste. Study whole pages and real app flows.

**Where to look is not listed here.** The catalogue lives in one place,
`~/Desktop/uiverse/FUENTES.md`: what each source gives you, which one annotates
the typefaces a site really uses, which publish `DESIGN.md` files, and which
expose an MCP server (and which MCP not to install). Read it before choosing —
it is generated from `fuentes.json`, so it is the only copy that stays current.

**Components are a separate question.** Buttons, toggles, inputs and loaders
should not be invented either — they come from the user's own UIverse library
(`~/Desktop/uiverse`). That is the `diseno-uiverse` skill's job; this skill owns
the direction and the page, that one owns the pieces. For anything branded Siglo
21 or Teclab, that skill walks only the pieces the user tagged for that brand in
the gallery (the `usos` key of `biblioteca/estado.json`), not the whole library.

Say out loud which reference each decision came from. "Archivo + Söhne, taken
from <site>" is a designed choice; "a distinctive grotesque" is a guess.

## The Page Still Has a Job

Everything above pushes toward a distinctive look. Nothing above stops that push
from running over the reason the page exists. It has: a redesign of a
neighbourhood learning centre's location page came back more coherent and worse
at its job — three defensible aesthetic calls, three regressions for its reader.

**Before you finish, read the skill `piezas-para-el-publico`, section «Los pisos
de la pieza».** Those floors are binding here — body text that does not get
quieter, the primary action staying a solid control, platform colours left
alone, stat numbers set with weight, air that is not just empty column. Cross
one only when the user asks.

Say who this page's reader is before you start, and check the finished page
against them. A reference gives you tone, never the brief.

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
