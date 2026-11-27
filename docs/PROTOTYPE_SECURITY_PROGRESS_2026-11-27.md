# AniGuard Web Prototype Security Progress — 27 November 2026

**Audit date:** 27 November 2026  
**Repository:** `abdulsalambt2024/aniguard.ai`  
**Branch:** `security/prototype-demo-guard`  
**Pull request:** [#1 — Prototype security hardening](https://github.com/abdulsalambt2024/aniguard.ai/pull/1)  
**PR state:** Open, draft, unmerged.

## Latest security change

Latest branch/PR head: `78109377517a5e42acc3c520ed03c0dec80d8332`.

- `d22df3cccb63a2907429cf37ad568ba221acfd46` — add a small server-side Bearer-token parser.
- `677a3aa1f6b53accce1b818380e7657b1fcd016f` — add TypeScript declaration for the parser.
- `5f0719b763e2c467f8b2f10b340f048bd972af7d` — add four unit tests for standard/case-insensitive Bearer schemes, malformed/empty values and duplicate header arrays.
- `08a2266f59d22ddc9aad13aa2a9b290b0c19cca2` — use the parser in the authenticated assistant API route.
- `2261345feb137d2df6a098e7c638014d5e960428` — include the new auth-guard tests in CI.
- `78109377517a5e42acc3c520ed03c0dec80d8332` — correct the regular-expression whitespace matching in the parser.

The parser treats the HTTP authentication scheme case-insensitively and rejects malformed or multi-token values. It only extracts a token; the API still verifies that token with Supabase Auth before calling Gemini. No service-role key is used.

## Verification

GitHub Actions [run 45934618233](https://github.com/abdulsalambt2024/aniguard.ai/actions/runs/45934618233) completed successfully on head `781093775...`:

- Dependency installation — passed.
- Assistant request-guard tests (four Bearer parser tests plus the five existing rate-limiter tests) — passed.
- TypeScript check for `api/ai/chat.ts` — passed.
- Targeted ESLint — passed.
- Vite production build — passed.

The four new parser tests were also executed locally with Node.js 22.16.0: 4 passed, 0 failed.

These checks do not call Supabase Auth with real farmer sessions or call Gemini using a configured deployment secret.

## Security and product limitations

- Assistant requests still require a valid Supabase JWT; the new parser does not replace JWT verification.
- Gemini credentials remain server-only. Never place `GEMINI_API_KEY` in `VITE_*` variables or source control.
- Rate limiting remains bounded to 10,000 tracked users and 15 requests per user per 60-second window **per serverless instance**. It is not a global distributed rate limit; a shared durable store is required before production.
- The assistant has explicit no-diagnosis/no-prescription instructions and directs severe cases to a veterinarian.
- The web prototype remains separate from the AniGuard 2.0 farmer API/database. Sample data must be clearly labelled synthetic and never mixed with real farmer records.
- Browser admin UI remains non-authoritative; trusted server-side RBAC is not ready.
- Image-based disease classification, video analysis/generation and direct-key live voice remain disabled or unavailable. No validated classifier is claimed.
- Profit Analyzer in this prototype is deterministic arithmetic, not an AI forecast or accounting report.

## Deployment and integration

- No Vercel deployment exists for `security/prototype-demo-guard` in the selected Vercel account.
- The visible project under the other Vercel team was not transferred, repointed or modified.
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
