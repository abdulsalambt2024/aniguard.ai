# AniGuard Web Prototype Security Progress — 26 November 2026

**Audit date:** 2026-11-26  
**Repository:** `abdulsalambt2024/aniguard.ai`  
**Branch:** `security/prototype-demo-guard`  
**Pull request:** [#1 — Prototype security hardening](https://github.com/abdulsalambt2024/aniguard.ai/pull/1)  
**PR state at audit:** Open, draft, unmerged.  
**Latest branch head inspected:** `1a3242bba1f64b2e25868048d1d00d1c3fc946c2` — `docs: record assistant route type-check verification`.

## Verification on latest head

GitHub Actions run [45538918271](https://github.com/abdulsalambt2024/aniguard.ai/actions/runs/45538918271) completed successfully on the latest PR head:

- Dependency installation — passed.
- Five bounded rate-limiter tests — passed.
- TypeScript check of `api/ai/chat.ts` — passed.
- Targeted ESLint on changed server/integration modules — passed.
- Vite production build — passed.

The latest branch includes the bounded per-instance rate limiter, authenticated server-side Gemini route, server-only Gemini key handling, removal of browser-side privileged role changes, production mock-auth rejection, and disabled/unavailable unsupported AI functions. See [the PR diff](https://github.com/abdulsalambt2024/aniguard.ai/pull/1) for the complete change set.

## Security boundaries and known limitations

- Rate limit: 15 requests per authenticated user per 60-second fixed window, bounded to 10,000 tracked user counters per serverless instance; five unit tests cover limit boundaries, identity separation, expiry, capacity and empty IDs.
- This is **not a global distributed rate limit**. A shared durable store is required before production.
- Gemini credentials are read server-side only. Do not add them to `VITE_*` variables or source control.
- The assistant route still requires server-only `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `GEMINI_API_KEY`; real valid/expired-token and provider-failure tests with dedicated test accounts remain outstanding.
- The web prototype has no Vercel project linked to this repository in the selected Vercel account. No web preview deployment exists for this branch.
- The separate project currently visible under another Vercel team was not transferred, repointed or modified.
- The main AniGuard Supabase project does not expose a `user_roles` table in the current public schema listing. The browser UI remains non-authoritative; server-side RBAC is required before any admin capability can be enabled.
- The web app remains a separate prototype, not an integrated farmer client for AniGuard 2.0. Any sample/demo records must be explicitly labelled synthetic and must not be mixed with real farmer data.
- Image-based disease classification remains disabled/unvalidated. No medicines or antibiotics are prescribed.

## Next gates

1. Obtain explicit approval before creating a separate Vercel project for this repository; do not transfer the existing project.
2. Configure server-only deployment variables through approved settings and test the serverless route using dedicated test users.
3. Replace per-instance limiting with a shared store before production.
4. Implement trusted server-side role resolution and policy checks before admin operations.
5. Integrate the web UI with the main AniGuard API and clearly isolate synthetic sample data.

No PR merge, production deployment, Supabase migration/RLS change, Vercel project transfer, domain change or secret exposure occurred during this audit.
