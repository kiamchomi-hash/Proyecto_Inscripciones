# Referencias de la auditoría técnica — 02/10/2026

- [Next.js, security release de septiembre de 2026](https://nextjs.org/blog/september-2026-security-release) — versión parcheada 16.3.8 y alcance de los avisos; contrastado con lock e instalación local.
- [Blog oficial de Next.js](https://nextjs.org/blog) — localización del aviso más reciente consultado; el detalle se tomó del anuncio específico.
- [Next.js, autenticación](https://nextjs.org/docs/app/guides/authentication) — autorización en Route Handlers y junto al acceso a datos; no sólo en Proxy.
- [Supabase, generación de tipos](https://supabase.com/docs/guides/api/rest/generating-types) — introspección del esquema; no se adoptó el ejemplo de commits automáticos nocturnos.
- [Supabase JS, soporte TypeScript](https://supabase.com/docs/reference/javascript/typescript-support) — genérico Database, tipos de filas y resultados; alternativa a agregar un ORM.
- [Supabase SSR, releases](https://github.com/supabase/ssr/releases) — comprobación del canal publicado.
- [Supabase SSR 0.12.7](https://github.com/supabase/ssr/releases/tag/v0.12.7) — release del 08/09/2026; verificar cookies y sesión al migrar desde 0.9.
- [Supabase SSR, changelog](https://github.com/supabase/ssr/blob/main/CHANGELOG.md) — la apertura completa falló en el lector web; no se usó como única prueba, se contrastó con la release oficial.
- [Tailwind, compatibilidad](https://tailwindcss.com/docs/compatibility) — mínimos de navegadores que contradicen los declarados en package.json.
- [React Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1) — estabilidad y adopción incremental; no se trasladaron resultados de terceros como mejora esperada propia.
- [Next.js, React Compiler](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler) — integración y piloto opt-in; no activado.
- [Microsoft, TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) — publicación 08/07/2026, compilador nativo y ausencia de API programática en 7.0; razón para no actualizar directamente el harness con transpileModule.
- [Next.js, caché sin Cache Components](https://nextjs.org/docs/app/guides/caching-without-cache-components) — memoización y modelo vigente; la URL anterior /app/guides/caching redirige aquí.
- [Next.js, Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) — alternativa evaluada y postergada por costo de migración y ausencia de necesidad demostrada.

Versiones disponibles adicionales: consulta directa al registro mediante `npm outdated --json` el 02/10/2026. Versiones fijadas: `package-lock.json`; versiones ejecutadas: manifests de `node_modules`. No confundir estas tres fuentes ni inferir de ellas el deployment activo.