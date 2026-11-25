# AniGuard Web Prototype Security Progress — 25 November 2026

**Repository:** `abdulsalambt2024/aniguard.ai`  
**Branch:** `security/prototype-demo-guard`  
**Pull request:** [#1 — Prototype security hardening](https://github.com/abdulsalambt2024/aniguard.ai/pull/1)  
**PR state:** Open, draft, unmerged.  
**Latest inspected head:** `43f0878955cdda7b0cec4de4b3861cea8a571e59`.

## Work completed in this continuation

The text-assistant API's per-instance rate limiter previously used an unbounded Map. It now uses a dedicated bounded helper:

- Fixed-window budget defaults to 15 requests per authenticated user per 60 seconds.
- Tracks at most 10,000 user counters per serverless instance.
- Expired counters are pruned periodically and when capacity is reached.
- When the map is still full, new identities are rejected rather than evicting active counters and allowing an existing user to bypass the limit.
- This is a memory-bound/per-instance safeguard, **not a global distributed rate limit**. A shared store is required before production use.

New tests cover request-limit boundaries, user separation, window reset, fail-closed capacity and empty identifiers.

## Commit trail

- `d6d84e771fa4f5c425fa2f882c6b2a9af171c87c` — bounded rate-limiter helper.
- `44f355b7e8356babb06db2ed4df7105f18abf84b` — TypeScript declaration.
- `e5bbb8cd02b7a2abb5e9f888112ee0dc599259a8` — five Node test cases.
- `82881b29506d2e9a051cdb6e654da6b4dfd0cd23` — use bounded limiter in authenticated assistant route.
- `43f0878955cdda7b0cec4de4b3861cea8a571e59` — CI runs the Node tests before lint/build.

## Verification

GitHub Actions [run 45537907648](https://github.com/abdulsalambt2024/aniguard.ai/actions/runs/45537907648) completed **successfully** on the latest head:

1. Dependency installation — passed.
2. Five assistant rate-limiter unit tests — passed.
3. Targeted ESLint for changed server/integration modules — passed.
4. Vite production build — passed.

This run does **not** test the Vercel serverless route with real Supabase tokens, a configured Gemini credential, or real test users. The full-repository lint baseline previously reported 172 legacy lint errors; the workflow intentionally runs targeted lint on the changed integration/server files. Full lint cleanup remains outstanding.

## Deployment and integration status

- The selected Vercel account has no project linked to repository `abdulsalambt2024/aniguard.ai`; no web preview exists for this branch.
- The selected Vercel team lists an `aniguard.ai` project linked to a different GitHub repository, `beinghayat/aniguard.ai`. This run did not transfer or repoint that project.
- The connected main AniGuard Supabase project has neither `public.user_roles` nor a `get_user_role` RPC. If this prototype uses that same Supabase project, its role lookup falls back to least-privilege `user`; admin management remains disabled. The web app's actual configured Supabase project has not been verified because no preview/environment access was available.
- The server assistant requires server-only `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `GEMINI_API_KEY`. Do not expose these through `VITE_*` variables or source control.

## Product and safety boundaries

- The React/Vite app remains a separate local/sample-data prototype, not an integrated client for the AniGuard 2.0 farmer API/database. Sample data must remain clearly labelled synthetic; do not enter real farmer records.
- Client-side email-based super-admin elevation, preset admin credentials, and browser-local privileged role changes have been removed/disabled.
- Production mock auth is rejected and missing Supabase configuration fails closed.
- Gemini credentials are no longer injected into the browser bundle; text chat is routed through the authenticated server endpoint.
- The admin UI remains non-authoritative until server-side RBAC and database policy checks exist.
- Automated animal-photo disease classification, video generation/analysis and direct-key live voice features remain disabled. No validated image classifier is claimed.
- Profit Analyzer output is direct arithmetic over entered figures, not an AI forecast or accounting report.

## Next gates

1. Obtain a preview deployment in a Vercel project explicitly linked to this repository, without moving or repointing another project.
2. Configure server-only environment variables through the approved deployment settings, then test unauthenticated, expired-token, valid-token, rate-limit and Gemini-failure paths with dedicated test users.
3. Replace per-instance rate limiting with a shared durable limiter before production.
4. Confirm the actual Supabase project schema and implement trusted server-side RBAC before enabling any admin action.
5. Integrate the UI with the main AniGuard API and remove/localize demo-only data paths before presenting it as a real farmer application.

No PR merge, production deployment, Supabase migration, project transfer, domain change or secret exposure occurred.
