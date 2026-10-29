# Resumen del proyecto

El sitio de Universidad Siglo 21 — CAU Villa Lugano publica la oferta
académica, recibe consultas y gestiona clases de apoyo. La producción está en
Cloudflare, con Astro y componentes React sobre Workers y datos en D1.

## Organización

- `cloudflare/`: sitio publicado, Worker, configuración y migraciones de D1.
- `components/`, `lib/` y `estilos/`: código y estilos compartidos.
- `herramientas/`: controles y utilitarios locales, fuera del bundle.
- `docs/criterios.md`: decisiones y preferencias de trabajo.
- `AGENTS.md`: arquitectura, comandos y procedimientos vigentes. Ante una
  contradicción con este resumen, manda ese archivo y el código.

## Publicación y seguridad

Un push a `main` publica el commit después de pasar las verificaciones. El plan
de publicación, el procedimiento manual y los controles están en `AGENTS.md`.
Las migraciones de base se aplican aparte. Los secretos no se guardan en Git;
la revisión de archivos privados y credenciales está documentada en
`docs/publicacion-sin-secretos.md`.

El HTML de novedades se sanitiza con `lib/sanitize-content.ts` antes de
renderizarse. Los formularios pasan por `cloudflare/src/api/formularios.ts` y
sus efectos se procesan mediante el outbox y las colas del Worker.
