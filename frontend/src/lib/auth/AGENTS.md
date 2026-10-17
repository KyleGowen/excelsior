# Authentication client context

Read root/frontend AGENTS.md and docs/current/FRONTEND_AUTH_AND_SESSION.md. googleAuthClient preloads Firebase for a direct popup gesture and offers redirect fallback. postAuthNavigation owns safe same-site return and previous-account route handling. API calls live in ../api/auth.ts and account.ts. Only a verified 401 means an absent session; outages stay retryable errors.

Native login uses legacy session routes, not v1 token logout. Do not change native Firebase app selection, cookies, Guest bootstrap, or routing for external preparation. Future independent hosts need a named Firebase app, deliberate persistence, single-use bounded return state, their own opaque host session, and server-only upstream credentials. Never put secrets into browser persistence.
