# AniGuard Web Prototype Security Progress — 28 November 2026

**Audit date:** 28 November 2026  
**Repository:** `abdulsalambt2024/aniguard.ai`  
**Branch:** `security/prototype-demo-guard`  
**Pull request:** [#1 — Prototype security hardening](https://github.com/abdulsalambt2024/aniguard.ai/pull/1)  
**PR state:** Open, draft, unmerged.

## Latest security change

- Latest PR head: `64d010ec96835126b4ad6c1b67eaa4672d02f64c`.
- `ac328ca2375e4dbfab0863e8a1f276ca353d89eb` — reject duplicate/multi-valued Authorization headers in the server-side Bearer parser.
- `64d010ec96835126b4ad6c1b67eaa4672d02f64c` — add regression tests for single-valued and ambiguous duplicate Authorization headers.

The assistant API now accepts a string Authorization header or a one-element header array. It rejects arrays containing multiple values rather than choosing the first value, because different proxies/framework layers can resolve duplicate Authorization headers differently. The extracted token is still verified through Supabase Auth before Gemini is called.

## Verification

GitHub Actions [run 46098848407](https://github.com/abdulsalambt2024/aniguard.ai/actions/runs/46098848407) completed successfully on head `64d010e...`:

- Dependency installation — passed.
- Assistant request-guard tests — passed (five Bearer parser cases plus five bounded rate-limiter cases).
- TypeScript check for `api/ai/chat.ts` — passed.
- Targeted ESLint — passed.
- Vite production build — passed.

The five Bearer parser tests were also run independently with Node.js in the engineering runtime: 5 passed, 0 failed.

These checks do not call Supabase Auth with real farmer sessions or call Gemini using a configured deployment secret.

## Security and product limitations

- Assistant requests still require a valid Supabase JWT; parsing a Bearer header does not replace JWT verification.
- Gemini credentials remain server-only. Never place `GEMINI_API_KEY` in `VITE_*` variables or source control.
- Rate limiting remains bounded to 10,000 tracked users and 15 requests per user per 60-second window **per serverless instance**. It is not a global distributed rate limit; a shared durable store is required before production.
- The assistant has explicit no-diagnosis/no-prescription instructions and directs severe cases to a veterinarian.
- The web prototype remains separate from the AniGuard 2.0 farmer API/database. Any sample records must be visibly labelled synthetic and never mixed with real farmer records.
- Browser admin UI remains non-authoritative; trusted server-side RBAC is not ready.
- Image-based disease classification, video analysis/generation and direct-key live voice remain disabled or unavailable. No validated classifier is claimed.
- Profit Analyzer in this prototype is deterministic arithmetic, not an AI forecast or accounting report.

## Deployment and integration

- No Vercel deployment exists for `security/prototype-demo-guard` in the selected Vercel account.
- The visible Vercel `aniguard.ai` project is linked to a different GitHub repository (`beinghayat/aniguard.ai`). It was not transferred, repointed or modified.
- A separate Vercel project and server-only environment configuration require explicit owner approval.
- The connected AniGuard 2.0 Supabase project still lacks `public.user_roles` and `public.get_user_role(uuid)`; role resolution must fail closed until trusted server-side RBAC is implemented and schema compatibility is established.
- No live Supabase changes, production deployment, project transfer, domain change or secret exposure occurred.

## Next gates

1. Obtain owner approval before creating a separate Vercel project for this repository.
2. Configure server-only deployment variables through approved settings, then test missing, malformed, expired and valid JWTs with dedicated test users.
3. Verify Gemini provider-failure and rate-limit behavior against a preview deployment.
4. Replace per-instance rate limiting with a shared durable store before production.
5. Integrate the web UI with the main AniGuard API and keep synthetic sample data isolated.
6. Implement trusted server-side RBAC before enabling admin operations.
