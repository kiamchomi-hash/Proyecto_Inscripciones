---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics. NOT for fixed-size pieces the user will hand-edit afterwards — a poster, flyer, brochure, artboard or /design canvas is `lienzo-de-diseno`.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

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
the direction and the page, that one owns the pieces.

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
