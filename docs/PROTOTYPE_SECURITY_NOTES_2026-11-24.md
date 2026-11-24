# AniGuard Web Prototype — Security Hardening Notes

Date: 24 November 2026
Branch: `security/prototype-demo-guard`
Pull request: https://github.com/abdulsalambt2024/aniguard.ai/pull/1

## What this branch changes
- Removes browser-side super-admin email elevation and preset login accounts.
- Removes hardcoded password-only management login.
- Disables browser-local admin authority and seeded administrator identities.
- Restricts demo admin UI to development or an explicit demo-only build flag.
- Rejects mock authentication in production builds and fails closed on missing Supabase configuration.
- Removes Gemini key injection from Vite's browser bundle.
- Routes text assistant requests through `/api/ai/chat`, verifies the Supabase access token with Auth, limits payload size/history, and adds a basic per-process rate limit.
- Disables unvalidated animal-image diagnosis, crop image classification, video generation/analysis, and direct-key live voice calls.
- Makes the Profit Analyzer return deterministic arithmetic with explicit scope instead of invented forecasts.
- Labels the existing React/Vite UI as sample/local prototype data, not live farmer records.

## Required server environment
Configure only in Vercel server-side environment settings; never use a `VITE_` prefix for the Gemini key:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `GEMINI_API_KEY`

The text assistant returns a configuration error until these are set. Do not paste secrets into source control or chat.

## Important product limitations
- This separate React/Vite application is not yet connected to the main AniGuard 2.0 API and farmer database.
- The browser admin panel is deliberately non-authoritative; real administration requires server-side RBAC and database policies.
- No image-based animal diagnosis is validated. The feature is disabled rather than presenting a generative guess as a clinical result.
- Voice, video, external vet directory, and live market features remain disabled or informational until secure integrations and verified sources exist.
- The profit calculation is a basic calculation from user-entered figures, not an accounting report.

## Verification status
- Source-level review completed for the edited authentication, admin, mock client, AI, and Vite configuration files.
- No successful TypeScript, lint, build, runtime, or end-to-end test result has yet been recorded for this branch.
- No Vercel project is linked to this repository in the selected Vercel account; no preview URL exists yet.
- PR #1 is open as a draft and must not be merged until checks and integration review pass.
