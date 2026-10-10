# Feasibility: Vercel to Cloudflare Workers

## Objective
Prove whether the site runs correctly on Cloudflare Workers (OpenNext adapter) before deciding a migration. Saving at stake: ~USD 15-20/month (Vercel Pro).

## Scope
- Isolated git worktree `../proyecto-cau-worktrees/cloudflare`, local branch `exp/cloudflare`, never pushed, never merged into `main`.
- Deploy only to a `*.workers.dev` subdomain, with `X-Robots-Tag: noindex`. Production DNS untouched.
- No changes to Supabase, Vercel, triggers or secrets.

## Constraints
- `@opennextjs/cloudflare@1.20.10` peer: `next >=16.3.8` (project: `^16.3.8`), `wrangler ^4.148.0`.
- `.env.local` has no service role: forms are expected to return 503.

## Tasks
- [x] T1. Worktree + install adapter + config (route: delegated, writer trigger: several new files + build). Evidence: worktree `../proyecto-cau-worktrees/cloudflare`, branch `exp/cloudflare`, commit `5841d28`. R2 incremental cache (`cau-factibilidad-cache`, not created yet) + DO sharded tag cache + DO queue; noindex on `/(.*)`.
- [x] T2. `opennextjs-cloudflare build` passes (after the user copied `.env.local`). Warnings: "Node.js middleware support is experimental in cloudflare" (proxy.ts), DO classes not exported during the dev-init step.
- [x] T3. Local preview in workerd: all 12 paths match production status codes (200 pages, `/admin` 307 -> `/admin/login`, `/api/admin/profesores` 401, `/carrera/x` and `/contactos` 308), sitemap 146 URLs on both, home 689 KB vs 692 KB, `POST /api/formularios {}` 400. Difference: redirect and middleware responses (307/308/401) come out WITHOUT CSP, HSTS and X-Robots-Tag on Workers; production sends them.
- [ ] T4. Deploy to workers.dev. NOT DONE ON PURPOSE: OpenNext inlines every `.env.local` variable into `.open-next/cloudflare/next-env.mjs`, including real secrets (Telegram token, Teclab/Microsoft/DEPC passwords, `EDITOR_DATABASE_URL`, `REVALIDATE_SECRET`, `TURNSTILE_SECRET_KEY`, `VERCEL_OIDC_TOKEN`). Deploying would upload them. Needs a build env with only `NEXT_PUBLIC_*` (user decision). R2 bucket not created. Dry-run bundle: 28670 KiB / gzip 5718 KiB (over the 3 MiB free limit, under 10 MiB paid).
- [ ] T5. Report: what works, what breaks, what must be rebuilt (partial: static analysis + preview)

## Progress
- 2026-10-10: T1-T3 done, T4 stopped before upload (secrets in bundle). Rough TTFB, local preview ~35 ms vs production ~130-210 ms (not comparable: local has no network). Next step: user decides how to build without server secrets, then create `cau-factibilidad-cache` and deploy.
- Known rebuild items from static reading: 3 Vercel crons (`/api/vigilancia` 6h, `/api/newsletter` daily, `/api/recordatorio-teclab` weekly) need a `scheduled` handler / Cron Triggers; `@vercel/analytics` + `@vercel/speed-insights` stop reporting; Vercel WAF + `firewall.attack` webhook (`alerta-firewall`) have no equivalent; `next/image` (10 components) goes through the Cloudflare Images binding (billed transforms); `/api/revalidar` depends on the DO tag cache; `buildCommand` of `vercel.json` (`secretos.mjs instalar`, `check`) must be recreated in Workers Builds or CI.

## Closure (2026-10-10)
- Feasibility test closed. Worktree removed (it held `.env.local` and `.open-next/` with secrets). Branch `exp/cloudflare` (commit `5841d28`) kept as the starting config.
- Decision: the user wants to attempt the real migration; they will buy Workers Paid first. Follow-up feature: migration plan, starting with a build that inlines only `NEXT_PUBLIC_*` and server vars via `wrangler secret`.
